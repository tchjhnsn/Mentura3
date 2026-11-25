// The hosted console's venture workspace. Records live in naive_records, one tenant per team (a personal team's id
// is its person's id, so the tenants made before teams are those people's personal teams).
// A request checks them out to a temporary folder, runs the console bridge there with NAIVE_RUNTIME=hosted,
// and commits what that run wrote. The folder is removed afterwards. A hosted origin does not use
// console/.data as the store. Local npm start does not call this.
//
// The Next server does not import this file. It starts console-child.ts, and that process imports it.
// The signed assertion is the bridge's stdin, not an argument.
//
// The tenant is the team id inside the signed assertion (identity.organizationId, else identity.userId), and the
// database binds the row policy to the same id (sql/003-team-tenant.sql). A different person on the call is refused.
// The runtime role may select and insert on naive_records, and use its sequence. It may not update,
// delete, or create the table. That login is not limited to one tenant: the table has no row policy.
// The owner applies the connector's SCHEMA before the role is used.
// This file does not create a database, a login, or a password.

import { execFile } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import pg from "pg";
import { openAssertion } from "../bridge/assertion.ts";
import { VersionConflict } from "naive-framework/src/store/connectors/contract.mjs";
import { connect, poolFrom, type Client } from "../connectors/postgres.ts";
import { publicMessage } from "./public-error.ts";
import { hostedWorkspaceRequired } from "./required.ts";
import { accountClient } from "./tenant-session.ts";
import { checkout, commit, refresh, type Store } from "./working-copy.ts";

export { hostedWorkspaceRequired };
const LOOPBACK = new Set(["localhost", "127.0.0.1", "::1"]);
const BRIDGE_ENV = ["PATH", "LANG", "LC_ALL", "LC_CTYPE", "TZ", "TMPDIR", "NAIVE_FRAMEWORK_DIR", "NAIVE_MCP_URL"];
const REFUSED_IDENTITY = "The console refused this request: it carries no signed identity.";
const pools = new Map<string, Client & { end(): Promise<void> }>();

interface Destination { host: string; port: string; database: string }

function destination(url: string): Destination {
  const trimmed = url.trim();
  if (!/^(postgres|postgresql):\/\//i.test(trimmed)) throw new Error("the hosted workspace refused this database");
  let parsed: URL;
  try { parsed = new URL(trimmed); }
  catch { throw new Error("the hosted workspace refused this database"); }
  if (parsed.searchParams.has("host") || parsed.searchParams.has("dbname") || parsed.searchParams.has("database")) {
    throw new Error("the hosted workspace refused this database");
  }
  const host = parsed.hostname.toLowerCase();
  const database = decodeURIComponent(parsed.pathname.replace(/^\//, ""));
  if (!host || !database || /[\s=]/.test(database)) throw new Error("the hosted workspace refused this database");
  return { host, port: parsed.port || "5432", database };
}

function samePlace(left: Destination, right: Destination): boolean {
  const host = (value: string) => LOOPBACK.has(value) ? "loopback" : value;
  return host(left.host) === host(right.host) && left.port === right.port && left.database === right.database;
}

/** The tenant database must not be the identity store, the outside log, or the connector eval database. */
export function assertTenantDestination(url: string, env: NodeJS.ProcessEnv = process.env): void {
  const here = destination(url);
  if (here.database === "mentura_eval" || here.database.includes("identity") || here.database.includes("outside")) {
    throw new Error("the hosted workspace refused this database");
  }
  for (const key of ["MENTURA_IDENTITY_DATABASE_URL", "MENTURA_AUTH_DATABASE_URL", "MENTURA_OUTSIDE_DATABASE_URL"]) {
    const other = env[key];
    if (!other) continue;
    if (samePlace(here, destination(other))) throw new Error("the hosted workspace refused this database");
  }
}

async function databaseIdentity(url: string): Promise<{ systemId: string; oid: string }> {
  const client = new pg.Client({ connectionString: url, connectionTimeoutMillis: 5000, application_name: "mentura-workspace-isolation" });
  await client.connect();
  try {
    await client.query("begin read only");
    const found = await client.query(
      `select s.system_identifier::text as system_id, d.oid::text as oid
         from pg_catalog.pg_control_system() s
         join pg_catalog.pg_database d on d.datname = pg_catalog.current_database()`,
    );
    await client.query("rollback");
    const row = found.rows[0] as { system_id?: string; oid?: string } | undefined;
    const systemId = String(row?.system_id ?? "");
    const oid = String(row?.oid ?? "");
    if (!systemId || !oid) throw new Error("the hosted workspace refused this database");
    return { systemId, oid };
  } finally {
    await client.end();
  }
}

/** A hosted origin must name the identity and outside databases so this one can be proved different. */
export async function proveTenantSeparate(url: string, env: NodeJS.ProcessEnv = process.env): Promise<void> {
  assertTenantDestination(url, env);
  if (!hostedWorkspaceRequired(env)) return;
  if (!env.MENTURA_IDENTITY_DATABASE_URL || !env.MENTURA_OUTSIDE_DATABASE_URL) {
    throw new Error("the hosted workspace refused this database");
  }
  const here = await databaseIdentity(url);
  for (const key of ["MENTURA_IDENTITY_DATABASE_URL", "MENTURA_OUTSIDE_DATABASE_URL", "MENTURA_AUTH_DATABASE_URL"]) {
    const other = env[key];
    if (!other) continue;
    const found = await databaseIdentity(other);
    if (found.systemId === here.systemId && found.oid === here.oid) throw new Error("the hosted workspace refused this database");
  }
}

function accountId(userId: string): string {
  if (!/^[A-Za-z0-9_-]{1,80}$/.test(userId)) throw new Error("The console refused this request: it carries no usable account.");
  return userId;
}

export async function closeWorkspacePools(): Promise<void> {
  const open = [...pools.values()];
  pools.clear();
  await Promise.all(open.map((pool) => pool.end()));
}

async function poolFor(url: string): Promise<Client & { end(): Promise<void> }> {
  const known = pools.get(url);
  if (known) return known;
  const pool = poolFrom("MENTURA_DATABASE_URL");
  // poolFrom reads the variable name, not the string. Tests and the console set the variable.
  // A caller that proved a specific URL still uses that variable, which must be the same string.
  if ((process.env.MENTURA_DATABASE_URL ?? "") !== url) {
    await pool.end();
    throw new Error("the hosted workspace refused this database");
  }
  pools.set(url, pool);
  return pool;
}

export interface WorkspaceRun<T> { ok: boolean; result?: T; error?: string }

/**
 * Check the account's records out, run `fn` in that folder, and commit only when `fn` reports ok.
 * A conflict refreshes the copy and runs `fn` again. The folder is always removed.
 */
export async function runAccountWorkspace<T>(input: {
  userId: string;
  run: (dir: string) => Promise<WorkspaceRun<T>>;
  env?: NodeJS.ProcessEnv;
  retries?: number;
  tmp?: string;
  /** Signed assertion for userId. The database, not this process alone, binds the tenant. */
  assertion?: string;
}): Promise<T> {
  const env = input.env ?? process.env;
  const url = env.MENTURA_DATABASE_URL ?? "";
  if (!url) throw new Error("the hosted workspace refused this database");
  await proveTenantSeparate(url, env);
  const userId = accountId(input.userId);
  const pooled = await poolFor(url);
  const client = input.assertion ? accountClient(pooled, input.assertion) : pooled;
  const store = connect({ tenant: userId, client, schema: false }) as unknown as Store;
  const root = mkdtempSync(join(input.tmp ?? tmpdir(), "mentura-account-"));
  const copy = join(root, ".accounts", userId);
  try {
    const bases = await checkout(store, copy);
    const retries = input.retries ?? 2;
    for (let attempt = 1; ; attempt++) {
      const outcome = await input.run(copy);
      if (!outcome.ok) throw new Error(outcome.error || "Naive did not accept this.");
      try {
        await commit(store, copy, bases);
        return outcome.result as T;
      } catch (error) {
        if (!(error instanceof VersionConflict) || attempt > retries) throw error;
        await refresh(store, copy, bases);
      }
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

/** The bridge process gets the hosted workspace and the assertion key, not the server environment. */
export function bridgeEnv(env: NodeJS.ProcessEnv, workspace: string, key: string): NodeJS.ProcessEnv {
  const next: NodeJS.ProcessEnv = {
    NAIVE_CONSOLE_WORKSPACE: workspace,
    NAIVE_RUNTIME: "hosted",
    NAIVE_BRIDGE_KEY: key,
  };
  for (const name of BRIDGE_ENV) {
    const value = env[name];
    if (value) next[name] = value;
  }
  return next;
}

/** The bridge reads the assertion from stdin. It is not an argument, so a process error cannot quote it. */
function runBridge(bridgePath: string, assertion: string, env: NodeJS.ProcessEnv, timeout: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = execFile(process.execPath, [bridgePath], { maxBuffer: 32 * 1024 * 1024, timeout, env }, (error, stdout) => {
      if (error) reject(error);
      else resolve(stdout);
    });
    child.stdin?.end(assertion);
  });
}

/** Run one signed bridge request for this account against naive_records. */
export async function runHostedBridge<T>(input: {
  userId: string;
  assertion: string;
  bridgePath: string;
  key: string;
  env?: NodeJS.ProcessEnv;
  timeoutMs?: number;
  tmp?: string;
}): Promise<T> {
  const env = input.env ?? process.env;
  let signedId = "";
  let tenant = "";
  try {
    const { identity } = openAssertion(input.assertion, input.key);
    signedId = identity.userId;
    // The tenant is the team the web server checked the person's membership of (web/src/server/naive.ts). A personal
    // team's id is its person's, so an assertion without a team names the person's own tenant, as before teams.
    tenant = identity.organizationId || identity.userId;
  } catch (error) {
    throw new Error(publicMessage(error));
  }
  if (typeof signedId !== "string" || signedId !== input.userId || typeof tenant !== "string") throw new Error(REFUSED_IDENTITY);
  try {
    return await runAccountWorkspace({
      userId: tenant,
      assertion: input.assertion,
      env,
      tmp: input.tmp,
      run: async (dir) => {
        const workspace = join(dir, "..", "..");
        try {
          const stdout = await runBridge(input.bridgePath, input.assertion, bridgeEnv(env, workspace, input.key), input.timeoutMs ?? 120_000);
          const parsed = JSON.parse(stdout) as WorkspaceRun<T>;
          if (typeof parsed.error === "string") return { ...parsed, error: publicMessage(parsed.error) };
          return parsed;
        } catch (error) {
          return { ok: false, error: publicMessage(error) };
        }
      },
    });
  } catch (error) {
    throw new Error(publicMessage(error));
  }
}
