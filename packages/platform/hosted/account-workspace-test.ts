// The hosted console workspace against a throwaway Postgres.
// Applies the connector schema, then uses a role that can only select and insert.
// A second process reads the venture. A refused bridge call commits nothing.
// Two writers of one record leave a valid chain. The temporary copy is removed.
//
//   MENTURA_EVAL_DATABASE_URL=postgres://mentura@127.0.0.1:5432/postgres node platform/hosted/account-workspace-test.ts

import { createHash } from "node:crypto";
import { mkdtempSync, readdirSync, readFileSync, renameSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn, spawnSync } from "node:child_process";
import pg from "pg";
import { signAssertion, type Identity } from "../bridge/assertion.ts";
import { issueClaim } from "../bridge/claims.ts";
import { runHostedConsole } from "../bridge/hosted-call.ts";
import { SCHEMA, TABLE, connect, ensureSchema, verify, type Client } from "../connectors/postgres.ts";
import { closeWorkspacePools, hostedWorkspaceRequired, runAccountWorkspace, runHostedBridge } from "./account-workspace.ts";
import { actionFailure, publicMessage } from "./public-error.ts";

const SCHEMA_HASH = createHash("sha256").update(SCHEMA).digest("hex");

let failed = 0;
const expect = (name: string, ok: boolean, detail?: unknown) => {
  console.log(`${ok ? "ok  " : "FAIL"}  ${name}`);
  if (!ok) { failed++; if (detail !== undefined) console.log("      ", detail); }
};

expect("https origin selects the durable workspace", hostedWorkspaceRequired({ MENTURA_PUBLIC_ORIGIN: "https://mentura.example" }));
expect("a refused database connection does not name the host, the role, or the database", [
  "connect ECONNREFUSED 127.0.0.1:1",
  "connect ECONNRESET 127.0.0.1:5432",
  "getaddrinfo ENOTFOUND db.invalid",
  "password authentication failed for user \"mentura_console_tenant\"",
  "no pg_hba.conf entry for host \"127.0.0.1\", user \"throwaway_role\", database \"mentura_console_tenant_test\", no encryption",
  "database \"no_such_db\" does not exist",
  "role \"mentura_console_tenant\" does not exist",
].every((message) => {
  const shown = publicMessage(new Error(message));
  return shown === "Naive did not finish. Try again." && ["127.0.0.1", "mentura_console_tenant", "throwaway_role", "no_such_db", "pg_hba"].every((part) => !shown.includes(part));
}));
expect("local origin keeps the local workspace", !hostedWorkspaceRequired({ MENTURA_PUBLIC_ORIGIN: "http://127.0.0.1:3100" }));
console.log(`schema sha256 ${SCHEMA_HASH}`);

const source = process.env.MENTURA_EVAL_DATABASE_URL ?? "";
if (!source) {
  if (process.env.CI) {
    console.error("FAIL  hosted workspace: CI did not set MENTURA_EVAL_DATABASE_URL");
    process.exit(1);
  }
  console.log("SKIP  hosted workspace: set MENTURA_EVAL_DATABASE_URL to a local Postgres");
  process.exit(failed ? 1 : 0);
}
const hostName = new URL(source).hostname;
if (hostName !== "localhost" && hostName !== "127.0.0.1" && hostName !== "::1") {
  console.error("FAIL  hosted workspace: refusing a database host that is not loopback");
  process.exit(1);
}

async function ensureDatabase(name: string): Promise<string> {
  const admin = new URL(source);
  admin.pathname = "/postgres";
  const pool = new pg.Pool({ connectionString: admin.toString(), max: 1 });
  try {
    const existing = await pool.query("select 1 from pg_database where datname = $1", [name]);
    if (!existing.rowCount) await pool.query(`create database ${name}`);
  } finally {
    await pool.end();
  }
  admin.pathname = `/${name}`;
  return admin.toString();
}

const database = "mentura_console_tenant_test";
const adminUrl = await ensureDatabase(database);
await ensureDatabase("mentura_identity_guard");
await ensureDatabase("mentura_outside_guard");
const admin = new pg.Pool({ connectionString: adminUrl, max: 1 });
function asClient(pool: pg.Pool): Client {
  return {
    query: (text, params) => pool.query(text, params),
    connect: async () => {
      const client = await pool.connect();
      return { query: (text, params) => client.query(text, params), release: () => client.release() };
    },
  };
}
const adminClient = asClient(admin);
await ensureSchema(adminClient);
await admin.query(`
  do $$ begin
    if not exists (select 1 from pg_roles where rolname = 'mentura_console_tenant') then
      create role mentura_console_tenant login password 'mentura-console-tenant';
    end if;
  end $$;
`);
await admin.query("alter role mentura_console_tenant with login password 'mentura-console-tenant'");
await admin.query("grant connect on database mentura_console_tenant_test to mentura_console_tenant");
await admin.query("grant usage on schema public to mentura_console_tenant");
await admin.query(`grant select, insert on ${TABLE} to mentura_console_tenant`);
await admin.query(`grant usage, select on sequence ${TABLE}_seq_seq to mentura_console_tenant`);
await admin.query(readFileSync(new URL("./sql/002-tenant-isolation.sql", import.meta.url), "utf8"));
await admin.query("insert into mentura_tenant_key (id, secret) values (true, $1) on conflict (id) do update set secret = excluded.secret", ["bridge-test-key-0123456789abcdef"]);
const runtime = new URL(adminUrl);
runtime.username = "mentura_console_tenant";
runtime.password = "mentura-console-tenant";
const runtimeUrl = runtime.toString();

const previous = {
  origin: process.env.MENTURA_PUBLIC_ORIGIN,
  tenant: process.env.MENTURA_DATABASE_URL,
  identity: process.env.MENTURA_IDENTITY_DATABASE_URL,
  outside: process.env.MENTURA_OUTSIDE_DATABASE_URL,
  secret: process.env.BETTER_AUTH_SECRET,
};
const identityUrl = new URL(source);
identityUrl.pathname = "/mentura_identity_guard";
const outsideUrl = new URL(source);
outsideUrl.pathname = "/mentura_outside_guard";
process.env.MENTURA_PUBLIC_ORIGIN = "https://mentura.example";
process.env.MENTURA_DATABASE_URL = runtimeUrl;
process.env.MENTURA_IDENTITY_DATABASE_URL = identityUrl.toString();
process.env.MENTURA_OUTSIDE_DATABASE_URL = outsideUrl.toString();
process.env.BETTER_AUTH_SECRET = "hosted-secret-must-not-appear-0123456789";

const bridge = new URL("../bridge/bridge.mjs", import.meta.url).pathname;
const key = "bridge-test-key-0123456789abcdef";
const userId = "acctada";
const identity: Identity = { userId, name: "Ada", email: "ada@example.com", organizationId: "org", organizationRole: "owner" };
const sign = (op: string, request: Record<string, unknown> = {}) => signAssertion(identity, { op, ...request }, key);

const sentinel = mkdtempSync(join(tmpdir(), "mentura-no-fallback-"));
const elsewhere = mkdtempSync(join(tmpdir(), "mentura-elsewhere-"));
writeFileSync(join(elsewhere, "keep.txt"), "keep\n");
let refused = false;
try {
  await runHostedBridge({
    userId,
    assertion: sign("ventures"),
    bridgePath: bridge,
    key,
    tmp: sentinel,
    env: { ...process.env, MENTURA_DATABASE_URL: "", NAIVE_CONSOLE_WORKSPACE: elsewhere },
  });
} catch {
  refused = true;
}
expect("a hosted console without the tenant database does not use the local workspace", refused && readdirSync(sentinel).length === 0 && readdirSync(elsewhere).join() === "keep.txt" && readFileSync(join(elsewhere, "keep.txt"), "utf8") === "keep\n");

const created = await runHostedBridge<{ id: string }>({ userId, assertion: sign("create", { name: "Harbor", description: "A pier." }), bridgePath: bridge, key });
expect("create commits a venture", typeof created.id === "string" && created.id.length > 0, created);
await closeWorkspacePools();

const child = await new Promise<{ code: number; out: string }>((resolve) => {
  const proc = spawn(process.execPath, ["platform/hosted/account-workspace-read.ts", bridge, userId, key], { stdio: ["ignore", "pipe", "inherit"] });
  let out = "";
  proc.stdout.on("data", (chunk) => { out += chunk; });
  proc.on("exit", (code) => resolve({ code: code ?? 1, out }));
});
expect("a replacement process reads the venture", child.code === 0 && child.out.includes(created.id) && !child.out.includes("hosted-secret-must-not-appear"));

const other = await runHostedBridge<{ ventures: { id: string }[] }>({
  userId: "acctbea",
  assertion: signAssertion({ ...identity, userId: "acctbea", name: "Bea" }, { op: "ventures" }, key),
  bridgePath: bridge,
  key,
});
expect("another account does not see the venture", other.ventures.length === 0, other);
const beforeMismatch = Number((await admin.query(`select count(*)::int as n from ${TABLE} where tenant = $1`, [userId])).rows[0]?.n);
const beforeOther = Number((await admin.query(`select count(*)::int as n from ${TABLE} where tenant = $1`, ["acctbea"])).rows[0]?.n);
let mismatch = "";
try {
  await runHostedBridge({ userId: "acctbea", assertion: sign("ventures"), bridgePath: bridge, key });
} catch (error) {
  mismatch = error instanceof Error ? error.message : "";
}
const afterMismatch = Number((await admin.query(`select count(*)::int as n from ${TABLE} where tenant = $1`, [userId])).rows[0]?.n);
const afterOther = Number((await admin.query(`select count(*)::int as n from ${TABLE} where tenant = $1`, ["acctbea"])).rows[0]?.n);
expect("a caller tenant that is not the signed account is refused and commits nothing", mismatch === "The console refused this request: it carries no signed identity." && beforeMismatch === afterMismatch && beforeOther === afterOther && !mismatch.includes("acctbea") && !mismatch.includes(identity.email));

const runtimeDb = new pg.Pool({ connectionString: runtimeUrl, max: 2 });
const hiddenRows = await runtimeDb.query(`select count(*)::int as n from ${TABLE}`);
let crossInsert = false;
try {
  await runtimeDb.query(`insert into ${TABLE} (tenant, path, content, version, hash) values ('acctbea', 'forged.txt', 'x', 'v', 'h')`);
} catch { crossInsert = true; }
const forgedGrant = await runtimeDb.query("select pg_catalog.set_config('mentura.grant', pg_catalog.gen_random_uuid()::text, true) as grant");
const afterForgery = await runtimeDb.query(`select count(*)::int as n from ${TABLE}`);
let setRoleRefused = false;
let disablePolicyRefused = false;
try { await runtimeDb.query("set role mentura_records_owner"); } catch { setRoleRefused = true; }
try { await runtimeDb.query(`alter table ${TABLE} disable row level security`); } catch { disablePolicyRefused = true; }
let keyHidden = false;
try { await runtimeDb.query("select secret from mentura_tenant_key"); } catch { keyHidden = true; }
expect("the runtime login cannot read or insert another account, forge a grant, or become the owner", Number(hiddenRows.rows[0]?.n) === 0 && crossInsert && Number(afterForgery.rows[0]?.n) === 0 && setRoleRefused && disablePolicyRefused && keyHidden && String(forgedGrant.rows[0]?.grant ?? "") !== "");
await admin.query(`
  do $$ begin
    if not exists (select 1 from pg_roles where rolname = 'mentura_records_owner') then
      create role mentura_records_owner login password 'mentura-records-owner' nosuperuser nocreaterole;
    end if;
  end $$;
`);
await admin.query("alter role mentura_records_owner with login nosuperuser nocreaterole password 'mentura-records-owner'");
await admin.query("grant connect on database mentura_console_tenant_test to mentura_records_owner");
await admin.query("grant usage on schema public to mentura_records_owner");
await admin.query(`alter table ${TABLE} owner to mentura_records_owner`);
const ownerUrl = new URL(adminUrl);
ownerUrl.username = "mentura_records_owner";
ownerUrl.password = "mentura-records-owner";
const ownerDb = new pg.Pool({ connectionString: ownerUrl.toString(), max: 1 });
const ownerSeen = await ownerDb.query(`select count(*)::int as n from ${TABLE}`);
expect("the table owner is subject to the row policy and sees no account", Number(ownerSeen.rows[0]?.n) === 0);
await ownerDb.end();
await runtimeDb.end();

const [adaAgain, beaAgain] = await Promise.all([
  runHostedBridge<{ ventures: { id: string }[] }>({ userId, assertion: sign("ventures"), bridgePath: bridge, key }),
  runHostedBridge<{ ventures: { id: string }[] }>({
    userId: "acctbea",
    assertion: signAssertion({ ...identity, userId: "acctbea", name: "Bea" }, { op: "ventures" }, key),
    bridgePath: bridge,
    key,
  }),
]);
expect("two accounts reusing the pool stay apart", adaAgain.ventures.some((row) => row.id === created.id) && beaAgain.ventures.length === 0);

const envProbe = join(tmpdir(), "mentura-env-bridge.mjs");
writeFileSync(envProbe, "process.stdout.write(JSON.stringify({ ok: true, result: { sentinel: process.env.SENTINEL ?? \"\", token: process.env.GITHUB_TOKEN ?? \"\", database: process.env.MENTURA_DATABASE_URL ?? \"\", runtime: process.env.NAIVE_RUNTIME ?? \"\" } }));\n");
const bridged = await runHostedBridge<{ sentinel: string; token: string; database: string; runtime: string }>({
  userId,
  assertion: sign("ventures"),
  bridgePath: envProbe,
  key,
  env: { ...process.env, SENTINEL: "super-secret-sentinel", GITHUB_TOKEN: "ghp-not-for-the-bridge" },
});
expect("the bridge process does not receive the server secrets", bridged.runtime === "hosted" && bridged.sentinel === "" && bridged.token === "" && bridged.database === "" && !JSON.stringify(bridged).includes("super-secret-sentinel") && !JSON.stringify(bridged).includes("ghp-not-for-the-bridge"));

const before = await admin.query(`select count(*)::int as n from ${TABLE} where tenant = $1`, [userId]);
let validationRefused = false;
try {
  await runHostedBridge({ userId, assertion: sign("create", { name: " -no", description: "no" }), bridgePath: bridge, key });
} catch {
  validationRefused = true;
}
const after = await admin.query(`select count(*)::int as n from ${TABLE} where tenant = $1`, [userId]);
expect("a refused create commits nothing", validationRefused && Number(before.rows[0]?.n) === Number(after.rows[0]?.n));

const scratch = mkdtempSync(join(tmpdir(), "mentura-clean-"));
await runAccountWorkspace({
  userId,
  assertion: sign("ventures"),
  tmp: scratch,
  run: async () => ({ ok: true, result: true }),
});
expect("the temporary copy is removed", readdirSync(scratch).length === 0);
rmSync(scratch, { recursive: true, force: true });

const store = connect({ tenant: userId, client: adminClient, schema: false });
await store.write("ventures/acme/note.txt", "base\n");
const [first, second] = await Promise.all([
  runAccountWorkspace({
    userId,
    assertion: sign("ventures"),
    run: async (dir) => {
      const { readFileSync: read, writeFileSync: write } = await import("node:fs");
      const { join: at } = await import("node:path");
      const file = at(dir, "ventures/acme/note.txt");
      write(file, `${read(file, "utf8")}from-a\n`);
      return { ok: true, result: "a" };
    },
  }),
  runAccountWorkspace({
    userId,
    assertion: sign("ventures"),
    run: async (dir) => {
      const { readFileSync: read, writeFileSync: write } = await import("node:fs");
      const { join: at } = await import("node:path");
      const file = at(dir, "ventures/acme/note.txt");
      write(file, `${read(file, "utf8")}from-b\n`);
      return { ok: true, result: "b" };
    },
  }),
]);
const chain = await verify(adminClient, userId);
const note = await store.read("ventures/acme/note.txt");
const text = note?.content ?? "";
expect("a conflict retries and keeps one chain", first === "a" && second === "b" && chain.broken.length === 0 && text.includes("from-a") && text.includes("from-b") && text.startsWith("base\n"), { broken: chain.broken, text });

async function sqlState(url: string, sql: string): Promise<string> {
  const pool = new pg.Pool({ connectionString: url, max: 1 });
  const client = await pool.connect();
  try {
    await client.query(sql);
    return "ok";
  } catch (error) {
    return typeof error === "object" && error !== null && "code" in error ? String(error.code) : "error";
  } finally {
    client.release();
    await pool.end();
  }
}
const identityAdmin = new pg.Pool({ connectionString: identityUrl.toString(), max: 1 });
await identityAdmin.query("create table if not exists identity_account (id text)");
await identityAdmin.query("create table if not exists identity_profile (id text)");
await identityAdmin.end();
const outsideAdmin = new pg.Pool({ connectionString: outsideUrl.toString(), max: 1 });
await outsideAdmin.query("create table if not exists outside_log (seq bigint)");
await outsideAdmin.end();
const asRuntime = (url: URL) => {
  const next = new URL(url);
  next.username = "mentura_console_tenant";
  next.password = "mentura-console-tenant";
  return next.toString();
};
const updateCode = await sqlState(runtimeUrl, `update ${TABLE} set path = path where tenant = '${userId}'`);
const deleteCode = await sqlState(runtimeUrl, `delete from ${TABLE} where tenant = '${userId}'`);
const connected = await sqlState(asRuntime(identityUrl), "select 1");
const identityCode = await sqlState(asRuntime(identityUrl), "select * from identity_account");
const profileCode = await sqlState(asRuntime(identityUrl), "select * from identity_profile");
const outsideCode = await sqlState(asRuntime(outsideUrl), "select * from outside_log");
expect("opening the other databases is not row access: select, update, and delete are permission denied", connected === "ok" && updateCode === "42501" && deleteCode === "42501" && identityCode === "42501" && profileCode === "42501" && outsideCode === "42501", { connected, updateCode, deleteCode, identityCode, profileCode, outsideCode });

const disk = mkdtempSync(join(tmpdir(), "mentura-claim-disk-"));
const madeRun = spawnSync(process.execPath, [bridge, sign("create", { name: "Orphan", description: "left on disk" })], {
  encoding: "utf8",
  env: { ...process.env, NAIVE_CONSOLE_WORKSPACE: disk, NAIVE_BRIDGE_KEY: key, NAIVE_RUNTIME: "" },
});
const made = JSON.parse(madeRun.stdout || "{}") as { ok?: boolean; result?: { folder: string }; error?: string };
let claimRefused = false;
if (made.ok && made.result?.folder) {
  const folder = made.result.folder;
  renameSync(join(disk, ".accounts", userId, folder), join(disk, folder));
  const code = issueClaim(disk, folder);
  const claimFile = join(disk, ".claims", `${createHash("sha256").update(code).digest("hex")}.json`);
  const ventureFile = join(disk, folder, "venture.json");
  const seen = spawnSync(process.execPath, [bridge, sign("claim", { code })], {
    encoding: "utf8",
    env: { ...process.env, NAIVE_CONSOLE_WORKSPACE: disk, NAIVE_BRIDGE_KEY: key, NAIVE_RUNTIME: "hosted" },
  });
  const direct = JSON.parse(seen.stdout || "{}") as { ok?: boolean; error?: string };
  const beforeClaim = Number((await admin.query(`select count(*)::int as n from ${TABLE} where tenant = $1`, [userId])).rows[0]?.n);
  let hostedError = "";
  try {
    await runHostedBridge({ userId, assertion: sign("claim", { code }), bridgePath: bridge, key, env: { ...process.env, NAIVE_CONSOLE_WORKSPACE: disk } });
  } catch (error) {
    hostedError = error instanceof Error ? error.message : String(error);
  }
  const afterClaim = Number((await admin.query(`select count(*)::int as n from ${TABLE} where tenant = $1`, [userId])).rows[0]?.n);
  const quiet = [direct.error ?? "", hostedError].every((text) => !text.includes(code) && !text.includes(identity.email) && !text.includes("left on disk") && !text.includes(disk));
  claimRefused = direct.ok === false && direct.error === "The hosted console cannot redeem a code issued for a venture on disk." && hostedError === direct.error && existsSync(ventureFile) && existsSync(claimFile) && beforeClaim === afterClaim && quiet;
}
expect("a hosted claim does not redeem a code issued on disk", made.ok === true && claimRefused);

const description = "pier-must-not-leak-9f3a";
const failureDir = mkdtempSync(join(tmpdir(), "mentura-fail-"));
const argvLog = join(failureDir, "argv.json");
const sleeper = join(failureDir, "sleep.mjs");
const exiting = join(failureDir, "exit.mjs");
writeFileSync(sleeper, "import { writeFileSync } from \"node:fs\"; writeFileSync(process.env.ARGV_LOG, JSON.stringify(process.argv)); setInterval(() => {}, 1000);\n");
writeFileSync(exiting, "import { writeFileSync } from \"node:fs\"; writeFileSync(process.env.ARGV_LOG, JSON.stringify(process.argv)); process.exit(2);\n");
const failureEnv = { ...process.env, ARGV_LOG: argvLog };
async function failedCall(bridgePath: string, timeoutMs: number) {
  const assertion = sign("create", { name: "Harbor", description });
  const beforeRows = Number((await admin.query(`select count(*)::int as n from ${TABLE} where tenant = $1`, [userId])).rows[0]?.n);
  const beforeDirs = new Set(readdirSync(tmpdir()).filter((name) => name.startsWith("mentura-account-")));
  let caught: unknown = new Error("the call returned");
  try {
    await runHostedConsole({ userId, assertion, bridgePath, key, timeoutMs, env: failureEnv });
  } catch (error) {
    caught = error;
  }
  const body = actionFailure(caught);
  const raw = actionFailure(new Error(`Command failed: ${process.execPath} ${bridgePath} ${assertion}`));
  const afterRows = Number((await admin.query(`select count(*)::int as n from ${TABLE} where tenant = $1`, [userId])).rows[0]?.n);
  const left = readdirSync(tmpdir()).filter((name) => name.startsWith("mentura-account-") && !beforeDirs.has(name));
  const argv = existsSync(argvLog) ? readFileSync(argvLog, "utf8") : "";
  const secret = process.env.BETTER_AUTH_SECRET ?? "";
  const hidden = [assertion, description, identity.email, secret, runtimeUrl, "Command failed", bridgePath, failureDir];
  const messageClean = hidden.every((part) => part.length > 0 && !body.message.includes(part) && !raw.message.includes(part));
  const argvClean = !argv.includes(assertion) && !argv.includes(description) && !argv.includes(identity.email) && !argv.includes(secret) && !argv.includes(runtimeUrl);
  return body.message === "Naive did not finish. Try again." && raw.message === body.message && beforeRows === afterRows && left.length === 0 && messageClean && argvClean;
}
expect("a timed-out hosted action returns nothing sensitive and commits nothing", await failedCall(sleeper, 200));
expect("a failed hosted action returns nothing sensitive and commits nothing", await failedCall(exiting, 5_000));

const leaked = await admin.query(`select content from ${TABLE} where tenant = $1 and content like $2`, [userId, "%hosted-secret-must-not-appear%"]);
expect("committed records do not contain the server secret", (leaked.rowCount ?? 0) === 0);

const rollbackSql = readFileSync(new URL("./sql/002-tenant-isolation-rollback.sql", import.meta.url), "utf8");
const migrationSql = readFileSync(new URL("./sql/002-tenant-isolation.sql", import.meta.url), "utf8");
const rollbackUrl = await ensureDatabase("mentura_tenant_rollback_test");
const rollbackAdmin = new pg.Pool({ connectionString: rollbackUrl, max: 1 });
const rollbackClient = asClient(rollbackAdmin);
await ensureSchema(rollbackClient);
const beforeRows = Number((await rollbackAdmin.query(`select count(*)::int as n from ${TABLE}`)).rows[0]?.n);
await rollbackAdmin.query(`insert into ${TABLE} (tenant, path, content, version, hash) values ('acct-kept', 'a.txt', 'one', 'v1', 'h1'), ('acct-kept', 'b.txt', 'two', 'v2', 'h2')`);
const keptRows = beforeRows + 2;
await rollbackAdmin.query(migrationSql);
async function isolationGone(rows: number): Promise<boolean> {
  const kept = await rollbackAdmin.query(`select count(*)::int as n from ${TABLE}`);
  const policy = await rollbackAdmin.query(`select 1 from pg_catalog.pg_policy where polname = 'naive_records_tenant'`);
  const fn = await rollbackAdmin.query(`select to_regprocedure('public.mentura_authorize(text)') as fn`);
  const rls = await rollbackAdmin.query(`select c.relrowsecurity as on, c.relforcerowsecurity as forced from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relname = '${TABLE}'`);
  const state = rls.rows[0] as { on?: boolean; forced?: boolean } | undefined;
  return Number(kept.rows[0]?.n) === rows && (policy.rowCount ?? 0) === 0 && fn.rows[0]?.fn === null && state?.on === false && state?.forced === false;
}
await rollbackAdmin.query(rollbackSql);
const afterPresent = await isolationGone(keptRows);
await rollbackAdmin.query(rollbackSql);
expect("rollback with the runtime role present leaves the records and can run again", afterPresent && await isolationGone(keptRows));
await rollbackAdmin.query(migrationSql);
const absent = await rollbackAdmin.connect();
let absentOk = false;
try {
  await absent.query("begin");
  await absent.query("alter role mentura_console_tenant rename to mentura_console_tenant_held");
  await absent.query(rollbackSql);
  const kept = await absent.query(`select count(*)::int as n from ${TABLE}`);
  const fn = await absent.query(`select to_regprocedure('public.mentura_authorize(text)') as fn`);
  absentOk = Number(kept.rows[0]?.n) === keptRows && fn.rows[0]?.fn === null;
  await absent.query("rollback");
} finally {
  absent.release();
}
const roleRestored = await rollbackAdmin.query(`select 1 from pg_catalog.pg_roles where rolname = 'mentura_console_tenant'`);
const rowsRestored = await rollbackAdmin.query(`select count(*)::int as n from ${TABLE}`);
expect("rollback with the runtime role absent finishes and the rename is not kept", absentOk && (roleRestored.rowCount ?? 0) === 1 && Number(rowsRestored.rows[0]?.n) === keptRows);
await rollbackAdmin.end();

await closeWorkspacePools();
await admin.end();
rmSync(sentinel, { recursive: true, force: true });
rmSync(elsewhere, { recursive: true, force: true });
rmSync(disk, { recursive: true, force: true });
rmSync(failureDir, { recursive: true, force: true });
const restore = (name: "MENTURA_PUBLIC_ORIGIN" | "MENTURA_DATABASE_URL" | "MENTURA_IDENTITY_DATABASE_URL" | "MENTURA_OUTSIDE_DATABASE_URL" | "BETTER_AUTH_SECRET", value: string | undefined) => {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
};
restore("MENTURA_PUBLIC_ORIGIN", previous.origin);
restore("MENTURA_DATABASE_URL", previous.tenant);
restore("MENTURA_IDENTITY_DATABASE_URL", previous.identity);
restore("MENTURA_OUTSIDE_DATABASE_URL", previous.outside);
restore("BETTER_AUTH_SECRET", previous.secret);

if (failed) { console.log(`${failed} failed`); process.exit(1); }
console.log("hosted console workspace: all checks passed");
