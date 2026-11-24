// The hosted outside log. Rows live in outside_log, which is not naive_records and not an identity table.
// The runtime does not create the table and does not connect to a database this module cannot
// prove is distinct from the tenant store and the identity store.
//
//   MENTURA_OUTSIDE_DATABASE_URL   the outside log, and only that database
//   MENTURA_DATABASE_URL           the tenant record store; required before a hosted connection
//   MENTURA_IDENTITY_DATABASE_URL  the identity store; required before a hosted connection
//
// A local test may create mentura_outside_test on the server MENTURA_EVAL_DATABASE_URL names.
// That command refuses a host that is not loopback, and it refuses the eval database itself.

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import pg from "pg";
import { lineHash } from "./host.ts";
import type { HostLog, StoredLine } from "./log.ts";

const LOOPBACK = new Set(["localhost", "127.0.0.1", "::1"]);
const SQL_FILE = new URL("./sql/001-outside-log.sql", import.meta.url);

export interface QueryClient {
  query(text: string, params?: unknown[]): Promise<{ rows: Record<string, unknown>[]; rowCount?: number | null }>;
  release?: () => void;
}

export interface OutsidePool {
  connect(): Promise<QueryClient>;
  end(): Promise<void>;
}

interface Destination { host: string; port: string; database: string }

export function outsideSqlText(): string {
  return readFileSync(SQL_FILE, "utf8");
}

/** SHA-256 of the schema file the parent applies. A changed file is a different schema. */
export function outsideSqlHash(): string {
  return createHash("sha256").update(outsideSqlText()).digest("hex");
}

function destination(url: string): Destination {
  const trimmed = url.trim();
  if (!/^(postgres|postgresql):\/\//i.test(trimmed)) throw new Error("outside: database URL is refused");
  let parsed: URL;
  try { parsed = new URL(trimmed); }
  catch { throw new Error("outside: database URL is refused"); }
  if (parsed.searchParams.has("host") || parsed.searchParams.has("dbname") || parsed.searchParams.has("database")) {
    throw new Error("outside: database URL is refused");
  }
  const host = parsed.hostname.toLowerCase();
  const database = decodeURIComponent(parsed.pathname.replace(/^\//, ""));
  if (!host || !database || /[\s=]/.test(database)) throw new Error("outside: database URL is refused");
  return { host, port: parsed.port || "5432", database };
}

function samePlace(left: Destination, right: Destination): boolean {
  const host = (value: string) => LOOPBACK.has(value) ? "loopback" : value;
  return host(left.host) === host(right.host) && left.port === right.port && left.database === right.database;
}

function named(env: NodeJS.ProcessEnv, key: string): Destination | null {
  const value = env[key];
  if (!value) return null;
  return destination(value);
}

/** Refuses the tenant store, the identity store, and the connector eval database by name. */
export function assertOutsideDestination(url: string, env: NodeJS.ProcessEnv = process.env): Destination {
  const here = destination(url);
  if (here.database === "mentura_eval" || here.database.includes("identity")) {
    throw new Error("outside: database URL is refused");
  }
  for (const key of ["MENTURA_DATABASE_URL", "MENTURA_IDENTITY_DATABASE_URL", "MENTURA_AUTH_DATABASE_URL"]) {
    const other = named(env, key);
    if (other && samePlace(here, other)) throw new Error("outside: database URL is refused");
  }
  return here;
}

async function databaseIdentity(url: string): Promise<{ systemId: string; oid: string }> {
  const client = new pg.Client({ connectionString: url, connectionTimeoutMillis: 5000, application_name: "mentura-outside-isolation" });
  await client.connect();
  try {
    await client.query("begin read only");
    const found = await client.query(
      `select s.system_identifier::text as system_id, d.oid::text as oid
         from pg_catalog.pg_control_system() s
         join pg_catalog.pg_database d on d.datname = pg_catalog.current_database()`,
    );
    await client.query("rollback");
    const row = found.rows[0];
    const systemId = String(row?.system_id ?? "");
    const oid = String(row?.oid ?? "");
    if (!systemId || !oid) throw new Error("outside: database URL is refused");
    return { systemId, oid };
  } finally {
    await client.end();
  }
}

/**
 * Proves the outside database is a different database from the tenant store and the identity store.
 * A hosted origin must name both of those URLs. This reads system identifiers and writes nothing.
 */
export async function proveOutsideSeparate(url: string, env: NodeJS.ProcessEnv = process.env): Promise<void> {
  assertOutsideDestination(url, env);
  const hosted = (() => { try { return new URL(env.MENTURA_PUBLIC_ORIGIN ?? "").protocol === "https:"; } catch { return false; } })();
  const others = ["MENTURA_DATABASE_URL", "MENTURA_IDENTITY_DATABASE_URL"].filter((key) => env[key]);
  if (hosted && others.length < 2) throw new Error("outside: database URL is refused");
  const here = await databaseIdentity(url);
  for (const key of ["MENTURA_DATABASE_URL", "MENTURA_IDENTITY_DATABASE_URL", "MENTURA_AUTH_DATABASE_URL"]) {
    const other = env[key];
    if (!other) continue;
    const found = await databaseIdentity(other);
    if (found.systemId === here.systemId && found.oid === here.oid) throw new Error("outside: database URL is refused");
  }
}

/** Applies the reviewed schema. Refuses a host that is not loopback, so this process does not migrate Neon. */
export async function applyOutsideSchema(url: string): Promise<void> {
  const here = assertOutsideDestination(url);
  if (!LOOPBACK.has(here.host)) throw new Error("outside: database URL is refused");
  await proveOutsideSeparate(url);
  const sql = outsideSqlText().replace(/--.*$/gm, "");
  if (/\bnaive_records\b/i.test(sql) || /\bidentity_/i.test(sql)) throw new Error("outside: schema names a store it must not touch");
  const pool = new pg.Pool({ connectionString: url, max: 1, application_name: "mentura-outside-schema" });
  try {
    await pool.query(outsideSqlText());
  } finally {
    await pool.end();
  }
}

function pgCode(error: unknown): string {
  return typeof error === "object" && error !== null && "code" in error ? String(error.code) : "";
}

// An open-time list of owners and named privileges does not prove a login cannot destroy the
// log. Membership in pg_execute_server_program is none of those owners and can run a program as
// the database's operating-system user. Execute on a security-definer function owned by the
// table owner is none of those owners, and that function can disable the triggers. The log
// opens only when the login's privileges are the runtime contract, and nothing else. It is not
// a superuser and cannot create roles, databases, or replication, and it does not bypass row
// security. It is a member of no role. It cannot create in a schema. On outside_log it can
// select and insert, not update, delete, truncate, or create a trigger. It cannot set
// session_replication_role. It does not own the table, its schema, this database, or a trigger
// function on the table. It cannot execute a security-definer function, or a function in an
// untrusted language, outside pg_catalog and information_schema, except outside_log_account()
// and outside_log_authorize(text) when the table owner owns them, they return text,
// account() is sql, authorize(text) is plpgsql, and their only setting is
// search_path=pg_catalog, public. A matching
// name with another owner, argument list, or setting is refused. The user triggers must exist
// and fire in replica mode. The principal is session_user, the authenticated login. A role
// default can make current_user a safe role while session_user stays a superuser or a member
// of pg_execute_server_program, and SET ROLE NONE returns to that login. The contract is read
// from session_user, and the session must still be that login. A superuser can still rewrite
// those system catalogs. This check does not remove privileges.

/** True when this login holds a privilege outside the append-only runtime contract. */
export const runtimeCanDamageLog = `
select (
  me.rolsuper
  or me.rolcreaterole
  or me.rolcreatedb
  or me.rolreplication
  or me.rolbypassrls
  or exists (select 1 from pg_catalog.pg_auth_members m where m.member = me.oid)
  or exists (select 1 from pg_catalog.pg_namespace n where pg_catalog.has_schema_privilege(me.oid, n.oid, 'CREATE'))
  or exists (
    select 1 from pg_catalog.pg_database d
    where d.datname = pg_catalog.current_database() and d.datdba = me.oid
  )
  or exists (
    select 1
      from pg_catalog.pg_class c
      join pg_catalog.pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and c.relname = 'outside_log'
       and (c.relowner = me.oid or n.nspowner = me.oid
            or pg_catalog.has_table_privilege(me.oid, c.oid, 'UPDATE')
            or pg_catalog.has_table_privilege(me.oid, c.oid, 'DELETE')
            or pg_catalog.has_table_privilege(me.oid, c.oid, 'TRUNCATE')
            or pg_catalog.has_table_privilege(me.oid, c.oid, 'TRIGGER'))
  )
  or not exists (
    select 1
      from pg_catalog.pg_class c
      join pg_catalog.pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and c.relname = 'outside_log'
  )
  or exists (
    select 1
      from pg_catalog.pg_trigger t
      join pg_catalog.pg_class c on c.oid = t.tgrelid
      join pg_catalog.pg_namespace n on n.oid = c.relnamespace
      join pg_catalog.pg_proc p on p.oid = t.tgfoid
     where n.nspname = 'public' and c.relname = 'outside_log' and not t.tgisinternal
       and (p.proowner = me.oid or t.tgenabled <> 'A')
  )
  or not exists (
    select 1
      from pg_catalog.pg_trigger t
      join pg_catalog.pg_class c on c.oid = t.tgrelid
      join pg_catalog.pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and c.relname = 'outside_log' and not t.tgisinternal and t.tgenabled = 'A'
  )
  or pg_catalog.has_parameter_privilege(me.oid, 'session_replication_role', 'SET')
  or session_user <> current_user
  or exists (
    select 1 from pg_catalog.unnest(coalesce(me.rolconfig, array[]::text[])) cfg
    where split_part(cfg, '=', 1) in ('session_replication_role', 'role', 'session_authorization')
  )
  or exists (
    select 1
      from pg_catalog.pg_db_role_setting s
     where s.setrole = me.oid
       and (s.setdatabase = 0 or s.setdatabase = (select oid from pg_catalog.pg_database where datname = pg_catalog.current_database()))
       and exists (
         select 1 from pg_catalog.unnest(coalesce(s.setconfig, array[]::text[])) cfg
         where split_part(cfg, '=', 1) in ('session_replication_role', 'role', 'session_authorization')
       )
  )
  or exists (
    select 1
      from pg_catalog.pg_proc p
      join pg_catalog.pg_namespace n on n.oid = p.pronamespace
      join pg_catalog.pg_language l on l.oid = p.prolang
     where pg_catalog.has_function_privilege(me.oid, p.oid, 'EXECUTE')
       and n.nspname not in ('pg_catalog', 'information_schema')
       and (
         not l.lanpltrusted
         or (
           p.prosecdef
           and not (
             n.nspname = 'public'
             and p.prorettype = 25
             and p.proowner <> me.oid
             and exists (
               select 1
                 from pg_catalog.pg_class c
                 join pg_catalog.pg_namespace cn on cn.oid = c.relnamespace
                where cn.nspname = 'public' and c.relname = 'outside_log' and c.relowner = p.proowner
             )
             and (
               (p.proname = 'outside_log_account' and p.pronargs = 0 and l.lanname = 'sql')
               or (p.proname = 'outside_log_authorize' and p.pronargs = 1 and p.proargtypes = array[25::oid]::oidvector and l.lanname = 'plpgsql')
             )
             and exists (
               select 1 from pg_catalog.unnest(coalesce(p.proconfig, array[]::text[])) cfg
               where cfg = 'search_path=pg_catalog, public'
             )
             and not exists (
               select 1 from pg_catalog.unnest(coalesce(p.proconfig, array[]::text[])) cfg
               where split_part(cfg, '=', 1) in ('role', 'session_authorization', 'session_replication_role')
                  or cfg <> 'search_path=pg_catalog, public'
             )
           )
         )
       )
  )
) as capable
from pg_catalog.pg_roles me
where me.rolname = session_user
`;

/** The log for one account. When an assertion is passed, the database, not that argument, names the account. */
export function outsideLog(pool: OutsidePool, accountId: string, assertion?: string): HostLog {
  return {
    async run(ventureId, fn) {
      if (!/^[A-Za-z0-9_-]{1,80}$/.test(accountId)) throw new Error("outside: account id is not a single safe name");
      if (!/^[a-z0-9][a-z0-9-]{0,40}$/.test(ventureId)) throw new Error("outside: venture id is not a single safe name");
      const client = await pool.connect();
      try {
        await client.query("begin");
        const who = await client.query(runtimeCanDamageLog);
        const row = who.rows[0];
        if (!row || row.capable === true) throw new Error("outside: runtime role must not own the log");
        let account = accountId;
        if (assertion) {
          const authorized = await client.query("select outside_log_authorize($1) as account", [assertion]);
          account = String(authorized.rows[0]?.account ?? "");
          if (account !== accountId) throw new Error("outside: account is not the signed account");
        } else {
          const forced = await client.query(
            `select c.relforcerowsecurity as forced
               from pg_catalog.pg_class c
               join pg_catalog.pg_namespace n on n.oid = c.relnamespace
              where n.nspname = 'public' and c.relname = 'outside_log'`,
          );
          if (forced.rows[0]?.forced === true) throw new Error("outside: assertion refused");
        }
        await client.query("select pg_advisory_xact_lock(hashtext($1))", [`outside_log/${account}/${ventureId}`]);
        const found = await client.query(
          `select seq, prev_hash, line_hash, line from outside_log where account_id = $1 and venture_id = $2 order by seq`,
          [account, ventureId],
        );
        const lines: StoredLine[] = [];
        let prev = "";
        for (const [index, row] of found.rows.entries()) {
          const line = row.line as StoredLine;
          if (Number(row.seq) !== index + 1 || String(row.prev_hash) !== prev || String(row.line_hash) !== lineHash(line)) {
            throw new Error("outside: log is not valid");
          }
          lines.push(line);
          prev = String(row.line_hash);
        }
        const pending: StoredLine[] = [];
        const result = fn({
          read: () => lines.concat(pending),
          append: (line) => { pending.push(line); },
        });
        let seq = lines.length + 1;
        for (const line of pending) {
          const hash = lineHash(line);
          await client.query(
            `insert into outside_log (account_id, venture_id, seq, prev_hash, line_hash, line) values ($1, $2, $3, $4, $5, $6::jsonb)`,
            [account, ventureId, seq, prev, hash, JSON.stringify(line)],
          );
          prev = hash;
          seq += 1;
        }
        await client.query("commit");
        return result;
      } catch (error) {
        try { await client.query("rollback"); } catch { /* the transaction may already be closed */ }
        if (error instanceof Error && error.message.startsWith("outside:")) throw error;
        if (pgCode(error) === "23505") throw new Error("outside: log is busy");
        const code = /^[A-Z0-9]{5}$/.test(pgCode(error)) ? pgCode(error) : "error";
        throw new Error(`outside: log is not available (${code})`);
      } finally {
        client.release?.();
      }
    },
  };
}

export function outsidePool(url: string): OutsidePool {
  return new pg.Pool({ connectionString: url, max: 8, application_name: "mentura-outside-log" });
}
