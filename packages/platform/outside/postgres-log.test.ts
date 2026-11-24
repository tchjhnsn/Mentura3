// The hosted outside log against a local Postgres.
// Creates mentura_outside_test on the server MENTURA_EVAL_DATABASE_URL names, unless
// MENTURA_OUTSIDE_DATABASE_URL is already a loopback database. Skips outside CI when
// neither is set. Refuses the tenant store, the identity store, and mentura_eval.
//
//   node outside/postgres-log.test.ts

import { mkdtempSync, mkdirSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";
import pg from "pg";
import { accountId, loadRequirement, openToolHost, ventureId, type ToolHost, type VentureScope } from "./host.ts";
import { lineHash } from "./host.ts";
import { applyOutsideSchema, assertOutsideDestination, outsideLog, outsidePool, outsideSqlHash, outsideSqlText, proveOutsideSeparate, runtimeCanDamageLog } from "./postgres-log.ts";

const SQL_HASH = "1c8a73209ede05dffb3f076f36fe98e85dd820c9a479059f219b3b69ac6cf06a";

let failed = 0;
const expect = (name: string, ok: boolean, detail?: unknown) => {
  console.log(`${ok ? "ok  " : "FAIL"}  ${name}`);
  if (!ok) { failed++; if (detail !== undefined) console.log("      ", JSON.stringify(detail)); }
};

expect("the reviewed schema hash matches the file", outsideSqlHash() === SQL_HASH);
const stripped = outsideSqlText().replace(/--.*$/gm, "");
expect("the schema does not name the tenant store or an identity table", !/\bnaive_records\b/i.test(stripped) && !/\bidentity_/i.test(stripped));
expect("a tenant-store URL is refused by name", (() => {
  try {
    assertOutsideDestination("postgres://mentura@127.0.0.1:5432/mentura_tenant", { MENTURA_DATABASE_URL: "postgres://mentura@localhost:5432/mentura_tenant" });
    return false;
  } catch { return true; }
})());
expect("the connector eval database is refused by name", (() => {
  try { assertOutsideDestination("postgres://mentura@127.0.0.1:5432/mentura_eval", {}); return false; }
  catch { return true; }
})());

async function databaseUrl(): Promise<string | null> {
  const explicit = process.env.MENTURA_OUTSIDE_DATABASE_URL;
  if (explicit) {
    assertOutsideDestination(explicit);
    return explicit;
  }
  const evalUrl = process.env.MENTURA_EVAL_DATABASE_URL;
  if (!evalUrl) return null;
  const adminTarget = new URL(evalUrl);
  const host = adminTarget.hostname;
  if (host !== "localhost" && host !== "127.0.0.1" && host !== "::1") throw new Error("outside: database URL is refused");
  adminTarget.pathname = "/postgres";
  const admin = new pg.Pool({ connectionString: adminTarget.toString(), max: 1 });
  try {
    const name = "mentura_outside_test";
    const existing = await admin.query("select 1 from pg_database where datname = $1", [name]);
    if (!existing.rowCount) await admin.query(`create database ${name}`);
  } finally {
    await admin.end();
  }
  adminTarget.pathname = "/mentura_outside_test";
  return adminTarget.toString();
}

const url = await databaseUrl();
if (!url) {
  if (process.env.CI) {
    console.error("FAIL  outside postgres: CI did not set MENTURA_OUTSIDE_DATABASE_URL or MENTURA_EVAL_DATABASE_URL");
    process.exit(1);
  }
  console.log("SKIP  outside postgres: set MENTURA_OUTSIDE_DATABASE_URL or MENTURA_EVAL_DATABASE_URL to a local Postgres");
  process.exit(failed ? 1 : 0);
}

await proveOutsideSeparate(url);
await applyOutsideSchema(url);
const admin = new pg.Pool({ connectionString: url, max: 2 });
await admin.query(`
  do $$ begin
    if not exists (select 1 from pg_roles where rolname = 'outside_host_test') then
      create role outside_host_test login password 'outside-host-test';
    end if;
  end $$;
`);
await admin.query("alter role outside_host_test with login nosuperuser password 'outside-host-test'");
await admin.query("grant connect on database mentura_outside_test to outside_host_test");
await admin.query("grant usage on schema public to outside_host_test");
await admin.query("grant select, insert on outside_log to outside_host_test");
const runtimeUrl = new URL(url);
runtimeUrl.username = "outside_host_test";
runtimeUrl.password = "outside-host-test";
const runtime = runtimeUrl.toString();
const pool = outsidePool(runtime);

const root = mkdtempSync(join(tmpdir(), "outside-pg-"));
const secretDir = join(root, "secrets");
mkdirSync(secretDir, { mode: 0o700 });
const signingKeyFile = join(secretDir, "signing");
const inboundKeyFile = join(secretDir, "inbound");
writeFileSync(signingKeyFile, "test-key-material-0123456789abcdef", { mode: 0o600 });
writeFileSync(inboundKeyFile, "test-inbound-material-0123456789abcd", { mode: 0o600 });

function workspace(name: string): { workspace: string; venture: string; fixture: string } {
  const dir = join(root, name);
  const venture = join(dir, "kettle");
  const fixture = join(dir, "fixtures", "finance");
  mkdirSync(venture, { recursive: true });
  mkdirSync(fixture, { recursive: true });
  writeFileSync(join(fixture, "note.txt"), "local reading\n", { mode: 0o600 });
  return { workspace: dir, venture, fixture };
}

const requirement = loadRequirement({
  id: "fin-reading-1",
  ventureId: "kettle",
  functionId: "finance",
  statement: "Finance needs a reading of the fixture directory in this account.",
  gap: "GitHub issues, projects, discussions, docs, reviews, actions, and repository files do not hold this reading.",
  address: "finance",
  support: {
    status: "hypothesized",
    evidence: { kind: "founder-statement", recordPath: "knowledge/outside/fin-reading-1.json" },
    provenance: { by: "Ada", at: "2026-11-08T00:00:00.000Z" },
  },
}, ["finance"]);

function opened(dir: string, id: string): ToolHost {
  return openToolHost({
    accountId: accountId(id),
    accountWorkspace: dir,
    signingKeyFile,
    inboundKeyFile,
    log: outsideLog(pool, id),
    policy: {
      personMayAct: (_dir, name) => name === "Ada" || name === "Bea",
      personMayApprove: (_dir, name) => name === "Ada",
    },
    functionIds: ["finance"],
    shapeCheck: { accepted: () => true },
  });
}

function scope(dir: string, venture: string, id: string, name: string): VentureScope {
  return {
    ventureId: ventureId("kettle"),
    ventureDir: venture,
    functionId: "finance",
    actor: { kind: "person", sessionUserId: accountId(id), venturePersonName: name },
  };
}

const ada = workspace("acct-ada");
const adaHost = opened(ada.workspace, "acct-ada");
const adaScope = scope(ada.workspace, ada.venture, "acct-ada", "Ada");
const bound = await adaHost.submit(adaScope, { kind: "bind", idempotencyKey: "bind-pg", requirement, providerId: "local-fixture", fixture: "finance", accountRef: "local" });
expect("postgres bind connects the local fixture", bound.status === "bound", bound.status === "bound" ? undefined : bound);
const connectionId = bound.status === "bound" ? String(bound.connectionId) : "";
const held = await adaHost.submit(adaScope, { kind: "write", idempotencyKey: "write-pg", connectionId, payload: { note: "fixture line" } });
expect("postgres write is held", held.status === "awaiting-approval");
const approved = await adaHost.submit(adaScope, { kind: "approve", idempotencyKey: "approve-pg", approves: String("intentId" in held ? held.intentId : "") });
expect("postgres approve writes once", approved.status === "done" && "receiptId" in approved);
const receiptId = "receiptId" in approved ? String(approved.receiptId) : "";
expect("the file log was not the store", !existsSync(join(ada.workspace, "outside", "kettle", "events.jsonl")));

await pool.end();
const again = outsidePool(runtime);
const reread = openToolHost({
  accountId: accountId("acct-ada"),
  accountWorkspace: ada.workspace,
  signingKeyFile,
  inboundKeyFile,
  log: outsideLog(again, "acct-ada"),
  policy: { personMayAct: () => true, personMayApprove: () => true },
  functionIds: ["finance"],
  shapeCheck: { accepted: () => true },
});
const second = await reread.submit(adaScope, { kind: "approve", idempotencyKey: "approve-pg-2", approves: String("intentId" in held ? held.intentId : "") });
expect("a new pool returns the same receipt", second.status === "done" && "receiptId" in second && second.receiptId === receiptId);
await again.end();

const child = await new Promise<{ code: number; out: string }>((resolve) => {
  const proc = spawn(process.execPath, ["outside/postgres-read.ts", runtime, ada.workspace, ada.venture, signingKeyFile, inboundKeyFile, receiptId], { stdio: ["ignore", "pipe", "inherit"] });
  let out = "";
  proc.stdout.on("data", (chunk) => { out += chunk; });
  proc.on("exit", (code) => resolve({ code: code ?? 1, out }));
});
expect("a second process reads the receipt from postgres", child.code === 0 && child.out.includes(receiptId));

const live = outsidePool(runtime);
const bea = workspace("acct-bea");
const beaHost = openToolHost({
  accountId: accountId("acct-bea"),
  accountWorkspace: bea.workspace,
  signingKeyFile,
  inboundKeyFile,
  log: outsideLog(live, "acct-bea"),
  policy: { personMayAct: () => true, personMayApprove: () => true },
  functionIds: ["finance"],
  shapeCheck: { accepted: () => true },
});
const crossed = await beaHost.submit(scope(bea.workspace, bea.venture, "acct-bea", "Bea"), { kind: "read", idempotencyKey: "bea-read", connectionId });
const beaRows = await live.connect().then(async (client) => {
  try {
    const found = await client.query("select count(*)::int as n from outside_log where account_id = $1", ["acct-bea"]);
    return Number(found.rows[0]?.n ?? 0);
  } finally { client.release?.(); }
});
expect("another account does not read this connection", crossed.status === "refused" && beaRows === 0);

const raced = openToolHost({
  accountId: accountId("acct-ada"),
  accountWorkspace: ada.workspace,
  signingKeyFile,
  inboundKeyFile,
  log: outsideLog(live, "acct-ada"),
  policy: { personMayAct: () => true, personMayApprove: () => true },
  functionIds: ["finance"],
  shapeCheck: { accepted: () => true },
});
const [one, two] = await Promise.all([
  raced.submit(adaScope, { kind: "read", idempotencyKey: "race-pg", connectionId }),
  raced.submit(adaScope, { kind: "read", idempotencyKey: "race-pg", connectionId }),
]);
const raceRows = await live.connect().then(async (client) => {
  try {
    const found = await client.query(
      `select count(*)::int as n from outside_log where account_id = $1 and venture_id = $2 and line->>'kind' = 'cache' and line->>'key' like $3`,
      ["acct-ada", "kettle", "%race-pg"],
    );
    return Number(found.rows[0]?.n ?? 0);
  } finally { client.release?.(); }
});
expect("one idempotency key commits one cache row", one.status === "done" && two.status === "done" && "receiptId" in one && "receiptId" in two && one.receiptId === two.receiptId && raceRows === 1);

const revokeHeld = await raced.submit(adaScope, { kind: "write", idempotencyKey: "write-revoke-pg", connectionId, payload: { note: "stop" } });
const revoked = await raced.submit(adaScope, { kind: "revoke", idempotencyKey: "revoke-pg", authorizationId: String("authorizationId" in revokeHeld ? revokeHeld.authorizationId : "") });
const owner = await admin.connect();
let deleteRefused = false;
let truncateRefused = false;
try { await owner.query("delete from outside_log where account_id = $1", ["acct-ada"]); }
catch { deleteRefused = true; }
try { await owner.query("truncate outside_log"); }
catch { truncateRefused = true; }
finally { owner.release?.(); }
const afterRevoke = await raced.submit(adaScope, { kind: "approve", idempotencyKey: "approve-revoke-pg", approves: String("intentId" in revokeHeld ? revokeHeld.intentId : "") });
expect("a delete is refused and revoke still blocks approve", revoked.status === "revoked" && deleteRefused && truncateRefused && afterRevoke.status === "refused" && afterRevoke.reason === "revoked");

await admin.query("create table if not exists naive_records (id integer)");
await admin.query("create table if not exists identity_account (id integer)");
await admin.query("revoke all on table naive_records from public");
await admin.query("revoke all on table identity_account from public");
const client = await live.connect();
try {
  const sample = { kind: "note" };
  await client.query("begin");
  await client.query("set local role outside_host_test");
  await client.query(
    `insert into outside_log (account_id, venture_id, seq, prev_hash, line_hash, line) values ($1, $2, $3, $4, $5, $6::jsonb)`,
    ["role-check", "kettle", 1, "", lineHash(sample), JSON.stringify(sample)],
  );
  const refused = async (sql: string) => {
    await client.query("savepoint probe");
    try {
      await client.query(sql);
      await client.query("rollback to savepoint probe");
      return false;
    } catch {
      await client.query("rollback to savepoint probe");
      return true;
    }
  };
  const updateRefused = await refused("update outside_log set seq = seq where account_id = 'role-check'");
  const truncateRefused = await refused("truncate outside_log");
  const denied = async (sql: string) => {
    await client.query("savepoint probe");
    try {
      await client.query(sql);
      await client.query("rollback to savepoint probe");
      return "";
    } catch (error) {
      await client.query("rollback to savepoint probe");
      return typeof error === "object" && error !== null && "code" in error ? String(error.code) : "";
    }
  };
  const tenantHidden = await denied("select * from naive_records");
  const identityHidden = await denied("select * from identity_account");
  await client.query("rollback");
  expect("the runtime role can insert and cannot update or truncate, and cannot read the other stores", updateRefused && truncateRefused && tenantHidden === "42501" && identityHidden === "42501");
} finally {
  client.release?.();
}

const asOwner = outsidePool(url);
const ownerHost = openToolHost({
  accountId: accountId("acct-ada"),
  accountWorkspace: ada.workspace,
  signingKeyFile,
  inboundKeyFile,
  log: outsideLog(asOwner, "acct-ada"),
  policy: { personMayAct: () => true, personMayApprove: () => true },
  functionIds: ["finance"],
  shapeCheck: { accepted: () => true },
});
const owned = await ownerHost.submit(adaScope, { kind: "read", idempotencyKey: "owner-role", connectionId });
expect("the table owner cannot open the runtime log", owned.status === "refused" && owned.reason === "outside: runtime role must not own the log");
await asOwner.end();

await admin.query(`
  do $$ begin
    if not exists (select 1 from pg_roles where rolname = 'outside_plain_owner') then create role outside_plain_owner nologin nosuperuser nocreaterole; end if;
    if not exists (select 1 from pg_roles where rolname = 'outside_owner_mid') then create role outside_owner_mid nologin nosuperuser nocreaterole; end if;
    if not exists (select 1 from pg_roles where rolname = 'outside_owner_member') then create role outside_owner_member login password 'outside-owner-member' nosuperuser nocreaterole; end if;
    if not exists (select 1 from pg_roles where rolname = 'outside_owner_trans') then create role outside_owner_trans login password 'outside-owner-trans' nosuperuser nocreaterole; end if;
    if not exists (select 1 from pg_roles where rolname = 'outside_owner_setonly') then create role outside_owner_setonly login password 'outside-owner-setonly' nosuperuser nocreaterole; end if;
    if not exists (select 1 from pg_roles where rolname = 'outside_owner_noset') then create role outside_owner_noset login password 'outside-owner-noset' nosuperuser nocreaterole; end if;
    if not exists (select 1 from pg_roles where rolname = 'outside_admin_member') then create role outside_admin_member login password 'outside-admin-member' nosuperuser nocreaterole; end if;
    if not exists (select 1 from pg_roles where rolname = 'outside_admin_mid') then create role outside_admin_mid nologin nosuperuser nocreaterole; end if;
    if not exists (select 1 from pg_roles where rolname = 'outside_admin_hop') then create role outside_admin_hop login password 'outside-admin-hop' nosuperuser nocreaterole; end if;
    if not exists (select 1 from pg_roles where rolname = 'outside_other_super') then create role outside_other_super nologin superuser; end if;
    if not exists (select 1 from pg_roles where rolname = 'outside_set_super') then create role outside_set_super login password 'outside-set-super' nosuperuser nocreaterole; end if;
    if not exists (select 1 from pg_roles where rolname = 'outside_create_only') then create role outside_create_only login password 'outside-create-only' nosuperuser createrole; end if;
  end $$;
`);
const logins = [
  ["outside_owner_member", "outside-owner-member"],
  ["outside_owner_trans", "outside-owner-trans"],
  ["outside_owner_setonly", "outside-owner-setonly"],
  ["outside_owner_noset", "outside-owner-noset"],
  ["outside_admin_member", "outside-admin-member"],
  ["outside_admin_hop", "outside-admin-hop"],
  ["outside_set_super", "outside-set-super"],
  ["outside_create_only", "outside-create-only"],
] as const;
for (const [role, password] of logins) {
  const attributes = role === "outside_create_only" ? "login nosuperuser createrole" : "login nosuperuser nocreaterole";
  await admin.query(`alter role ${role} with ${attributes} password '${password}'`);
}
await admin.query(`
  do $$
  declare
    owner name;
    db name := current_database();
  begin
    select pg_catalog.pg_get_userbyid(c.relowner) into owner
      from pg_catalog.pg_class c
      join pg_catalog.pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and c.relname = 'outside_log';
    execute format('grant connect on database %I to outside_owner_member, outside_owner_trans, outside_owner_setonly, outside_owner_noset, outside_admin_member, outside_admin_hop, outside_set_super, outside_create_only', db);
    grant usage on schema public to outside_owner_member, outside_owner_trans, outside_owner_setonly, outside_owner_noset, outside_admin_member, outside_admin_hop, outside_set_super, outside_create_only;
    grant select, insert on outside_log to outside_owner_member, outside_owner_trans, outside_owner_setonly, outside_owner_noset, outside_admin_member, outside_admin_hop, outside_set_super, outside_create_only;
    execute format('revoke %I from outside_owner_member, outside_owner_mid, outside_owner_setonly, outside_owner_noset, outside_admin_member, outside_admin_mid', owner);
    revoke outside_owner_mid from outside_owner_trans;
    revoke outside_admin_mid from outside_admin_hop;
    revoke outside_other_super from outside_set_super;
    execute format('grant %I to outside_owner_member', owner);
    execute format('grant %I to outside_owner_mid', owner);
    execute 'grant outside_owner_mid to outside_owner_trans';
    execute format('grant %I to outside_owner_setonly with inherit false, set true', owner);
    execute format('grant %I to outside_owner_noset with inherit false, set false, admin false', owner);
    execute format('grant %I to outside_admin_member with admin true, inherit false, set false', owner);
    execute format('grant %I to outside_admin_mid with admin true, inherit false, set false', owner);
    execute 'grant outside_admin_mid to outside_admin_hop with admin true, inherit false, set false';
    execute 'grant outside_other_super to outside_set_super with inherit false, set true';
  end $$;
`);
const ownerName = String((await admin.query(
  `select pg_catalog.pg_get_userbyid(c.relowner) as name
     from pg_catalog.pg_class c
     join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'outside_log'`,
)).rows[0]?.name ?? "");
if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(ownerName)) throw new Error("outside: role name is not a single safe name");

async function ownerRefused(user: string, secret: string): Promise<boolean> {
  if (!url) throw new Error("outside: database URL is refused");
  const next = new URL(url);
  next.username = user;
  next.password = secret;
  const pool = outsidePool(next.toString());
  try {
    await outsideLog(pool, "acct-ada").run("kettle", () => true);
    return false;
  } catch (error) {
    return error instanceof Error && error.message === "outside: runtime role must not own the log";
  } finally {
    await pool.end();
  }
}
expect("a direct member of the owner cannot open the log", await ownerRefused("outside_owner_member", "outside-owner-member"));
expect("a transitive member of the owner cannot open the log", await ownerRefused("outside_owner_trans", "outside-owner-trans"));
expect("a non-inheriting member who can set the owner cannot open the log", await ownerRefused("outside_owner_setonly", "outside-owner-setonly"));
expect("admin on the owner cannot open the log", await ownerRefused("outside_admin_member", "outside-admin-member"));
expect("admin through another role cannot open the log", await ownerRefused("outside_admin_hop", "outside-admin-hop"));
expect("set on a different superuser cannot open the log", await ownerRefused("outside_set_super", "outside-set-super"));

async function deletedInRollback(user: string, secret: string, setup: string[]): Promise<boolean> {
  if (!url) throw new Error("outside: database URL is refused");
  const next = new URL(url);
  next.username = user;
  next.password = secret;
  const pool = outsidePool(next.toString());
  const client = await pool.connect();
  try {
    await client.query("begin");
    for (const statement of setup) await client.query(statement);
    await client.query("alter table outside_log disable trigger outside_log_append_only");
    const deleted = await client.query("delete from outside_log");
    await client.query("rollback");
    return (deleted.rowCount ?? 0) > 0;
  } catch {
    try { await client.query("rollback"); } catch { /* already closed */ }
    return false;
  } finally {
    client.release?.();
    await pool.end();
  }
}
await admin.query("alter table outside_log owner to outside_plain_owner");
await admin.query("grant outside_plain_owner to outside_admin_member with admin true, inherit false, set false");
expect("admin on a non-superuser owner can grant itself that owner and delete until rolled back", await deletedInRollback("outside_admin_member", "outside-admin-member", [
  "grant outside_plain_owner to outside_admin_member with inherit true, set true",
]));
await admin.query(`alter table outside_log owner to "${ownerName}"`);
expect("set on another superuser can become that superuser and delete until rolled back", await deletedInRollback("outside_set_super", "outside-set-super", [
  "set role outside_other_super",
]));
const stillThere = await admin.query("select count(*)::int as n from outside_log");
expect("those destructive probes rolled back", Number(stillThere.rows[0]?.n) > 0);

await admin.query(`
  do $$ begin
    if not exists (select 1 from pg_roles where rolname = 'outside_fn_owner') then create role outside_fn_owner login password 'outside-fn-owner' nosuperuser nocreaterole; end if;
    if not exists (select 1 from pg_roles where rolname = 'outside_fn_admin') then create role outside_fn_admin login password 'outside-fn-admin' nosuperuser nocreaterole; end if;
    if not exists (select 1 from pg_roles where rolname = 'outside_fn_set') then create role outside_fn_set login password 'outside-fn-set' nosuperuser nocreaterole; end if;
    if not exists (select 1 from pg_roles where rolname = 'outside_replica') then create role outside_replica login password 'outside-replica' nosuperuser nocreaterole; end if;
    if not exists (select 1 from pg_roles where rolname = 'outside_replica_mid') then create role outside_replica_mid nologin nosuperuser nocreaterole; end if;
    if not exists (select 1 from pg_roles where rolname = 'outside_replica_inherit') then create role outside_replica_inherit login password 'outside-replica-inherit' nosuperuser nocreaterole; end if;
    if not exists (select 1 from pg_roles where rolname = 'outside_replica_set') then create role outside_replica_set login password 'outside-replica-set' nosuperuser nocreaterole; end if;
    if not exists (select 1 from pg_roles where rolname = 'outside_replica_admin') then create role outside_replica_admin login password 'outside-replica-admin' nosuperuser nocreaterole; end if;
  end $$;
`);
const guardLogins = [
  ["outside_fn_owner", "outside-fn-owner"],
  ["outside_fn_admin", "outside-fn-admin"],
  ["outside_fn_set", "outside-fn-set"],
  ["outside_replica", "outside-replica"],
  ["outside_replica_inherit", "outside-replica-inherit"],
  ["outside_replica_set", "outside-replica-set"],
  ["outside_replica_admin", "outside-replica-admin"],
] as const;
for (const [role, password] of guardLogins) {
  await admin.query(`alter role ${role} with login nosuperuser nocreaterole password '${password}'`);
}
await admin.query(`
  do $$
  declare db name := current_database();
  begin
    execute format('grant connect on database %I to outside_fn_owner, outside_fn_admin, outside_fn_set, outside_replica, outside_replica_inherit, outside_replica_set, outside_replica_admin', db);
    grant usage on schema public to outside_fn_owner, outside_fn_admin, outside_fn_set, outside_replica, outside_replica_inherit, outside_replica_set, outside_replica_admin;
    grant select, insert on outside_log to outside_fn_owner, outside_fn_admin, outside_fn_set, outside_replica, outside_replica_inherit, outside_replica_set, outside_replica_admin;
    revoke outside_fn_owner from outside_fn_admin, outside_fn_set;
    revoke outside_replica_mid from outside_replica_inherit, outside_replica_set, outside_replica_admin;
    revoke set on parameter session_replication_role from outside_replica, outside_replica_mid, outside_replica_inherit, outside_replica_set, outside_replica_admin;
  end $$;
`);
await admin.query("alter function outside_log_append_only() owner to outside_fn_owner");
await admin.query("grant outside_fn_owner to outside_fn_admin with admin true, inherit false, set false");
await admin.query("grant outside_fn_owner to outside_fn_set with inherit false, set true");
expect("the function owner cannot open the log", await ownerRefused("outside_fn_owner", "outside-fn-owner"));
expect("admin on the function owner cannot open the log", await ownerRefused("outside_fn_admin", "outside-fn-admin"));
expect("set on the function owner cannot open the log", await ownerRefused("outside_fn_set", "outside-fn-set"));

async function droppedAndDeleted(user: string, secret: string, setup: string[]): Promise<boolean> {
  if (!url) throw new Error("outside: database URL is refused");
  const next = new URL(url);
  next.username = user;
  next.password = secret;
  const pool = outsidePool(next.toString());
  const client = await pool.connect();
  try {
    await client.query("begin");
    for (const statement of setup) await client.query(statement);
    await client.query("drop function public.outside_log_append_only() cascade");
    const deleted = await client.query("delete from outside_log");
    await client.query("rollback");
    return (deleted.rowCount ?? 0) > 0;
  } catch {
    try { await client.query("rollback"); } catch { /* already closed */ }
    return false;
  } finally {
    client.release?.();
    await pool.end();
  }
}
await admin.query("grant delete on outside_log to outside_fn_owner, outside_fn_admin, outside_fn_set");
expect("the function owner can drop the triggers and delete until rolled back", await droppedAndDeleted("outside_fn_owner", "outside-fn-owner", []));
expect("admin on the function owner can grant itself that role and delete until rolled back", await droppedAndDeleted("outside_fn_admin", "outside-fn-admin", [
  "grant outside_fn_owner to outside_fn_admin with inherit true, set true",
]));
expect("set on the function owner can become that role and delete until rolled back", await droppedAndDeleted("outside_fn_set", "outside-fn-set", [
  "set role outside_fn_owner",
]));
await admin.query("revoke delete on outside_log from outside_fn_owner, outside_fn_admin, outside_fn_set");
await applyOutsideSchema(url);

await admin.query("grant set on parameter session_replication_role to outside_replica, outside_replica_mid");
await admin.query("grant outside_replica_mid to outside_replica_inherit");
await admin.query("grant outside_replica_mid to outside_replica_set with inherit false, set true");
await admin.query("grant outside_replica_mid to outside_replica_admin with admin true, inherit false, set false");
expect("a login granted set on session_replication_role cannot open the log", await ownerRefused("outside_replica", "outside-replica"));
expect("a member who inherits that parameter grant cannot open the log", await ownerRefused("outside_replica_inherit", "outside-replica-inherit"));
expect("a member who can set the role that holds that grant cannot open the log", await ownerRefused("outside_replica_set", "outside-replica-set"));
expect("admin on the role that holds that grant cannot open the log", await ownerRefused("outside_replica_admin", "outside-replica-admin"));

async function replicaDeleted(user: string, secret: string, setup: string[]): Promise<boolean> {
  if (!url) throw new Error("outside: database URL is refused");
  const next = new URL(url);
  next.username = user;
  next.password = secret;
  const pool = outsidePool(next.toString());
  const client = await pool.connect();
  try {
    await client.query("begin");
    for (const statement of setup) await client.query(statement);
    await client.query("set local session_replication_role = replica");
    const deleted = await client.query("delete from outside_log");
    await client.query("rollback");
    return (deleted.rowCount ?? 0) > 0;
  } catch {
    try { await client.query("rollback"); } catch { /* already closed */ }
    return false;
  } finally {
    client.release?.();
    await pool.end();
  }
}
await admin.query("grant delete on outside_log to outside_replica, outside_replica_mid, outside_replica_inherit, outside_replica_set, outside_replica_admin");
expect("replica mode does not delete while the triggers fire always", await replicaDeleted("outside_replica", "outside-replica", []) === false);
expect("an inherited parameter grant does not delete in replica mode", await replicaDeleted("outside_replica_inherit", "outside-replica-inherit", []) === false);
expect("set on the parameter holder does not delete in replica mode", await replicaDeleted("outside_replica_set", "outside-replica-set", [
  "set role outside_replica_mid",
]) === false);
expect("admin on the parameter holder does not delete in replica mode", await replicaDeleted("outside_replica_admin", "outside-replica-admin", [
  "grant outside_replica_mid to outside_replica_admin with inherit true, set true",
]) === false);
await admin.query("revoke delete on outside_log from outside_replica, outside_replica_inherit, outside_replica_set, outside_replica_admin");
const triggersBack = await admin.query(
  `select count(*)::int as n from pg_catalog.pg_trigger t
     join pg_catalog.pg_class c on c.oid = t.tgrelid
     join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'outside_log' and not t.tgisinternal and t.tgenabled = 'A'`,
);
const rowsKept = await admin.query("select count(*)::int as n from outside_log");
expect("the trigger probes rolled back and both triggers still always fire", Number(triggersBack.rows[0]?.n) === 2 && Number(rowsKept.rows[0]?.n) === Number(stillThere.rows[0]?.n));

const nosetUrl = new URL(url);
nosetUrl.username = "outside_owner_noset";
nosetUrl.password = "outside-owner-noset";
const noset = outsidePool(nosetUrl.toString());
let nosetOpened = false;
try {
  await outsideLog(noset, "acct-noset").run("kettle", () => true);
  nosetOpened = true;
} catch { nosetOpened = false; }
const nosetClient = await noset.connect();
let disableRefused = false;
let memberDeleteRefused = false;
try {
  await nosetClient.query("begin");
  try { await nosetClient.query("alter table outside_log disable trigger outside_log_append_only"); }
  catch { disableRefused = true; }
  try { await nosetClient.query("delete from outside_log where account_id = 'acct-ada'"); }
  catch { memberDeleteRefused = true; }
  await nosetClient.query("rollback");
} finally { nosetClient.release?.(); }
await noset.end();
expect("a membership with no admin, inherit, or set cannot open, disable, or delete", nosetOpened === false && disableRefused && memberDeleteRefused);
expect("createrole cannot open the log and cannot disable the trigger", await (async () => {
  if (!url) return false;
  const refused = await ownerRefused("outside_create_only", "outside-create-only");
  const damaged = await deletedInRollback("outside_create_only", "outside-create-only", []);
  return refused && damaged === false;
})());

await admin.query(`
  do $$ begin
    if not exists (select 1 from pg_roles where rolname = 'outside_program_login') then create role outside_program_login login password 'outside-program-login' nosuperuser nocreaterole; end if;
    if not exists (select 1 from pg_roles where rolname = 'outside_secdef_login') then create role outside_secdef_login login password 'outside-secdef-login' nosuperuser nocreaterole; end if;
  end $$;
`);
await admin.query("alter role outside_program_login with login nosuperuser nocreaterole password 'outside-program-login'");
await admin.query("alter role outside_secdef_login with login nosuperuser nocreaterole password 'outside-secdef-login'");
await admin.query(`
  do $$
  declare db name := current_database();
  begin
    execute format('grant connect on database %I to outside_program_login, outside_secdef_login', db);
    grant usage on schema public to outside_program_login, outside_secdef_login;
    grant select, insert on outside_log to outside_program_login, outside_secdef_login;
    revoke pg_execute_server_program from outside_program_login;
  end $$;
`);
await admin.query("grant pg_execute_server_program to outside_program_login");
const programRefused = await ownerRefused("outside_program_login", "outside-program-login");
const programUrl = new URL(url);
programUrl.username = "outside_program_login";
programUrl.password = "outside-program-login";
const programPool = outsidePool(programUrl.toString());
const programClient = await programPool.connect();
let programRan = false;
try {
  await programClient.query("copy (select 1) to program 'id'");
  programRan = true;
} finally {
  programClient.release?.();
  await programPool.end();
}
await admin.query("revoke pg_execute_server_program from outside_program_login");
expect("a member of pg_execute_server_program cannot open the log and can run a program", programRefused && programRan);

await admin.query("alter table outside_log owner to outside_plain_owner");
await admin.query("alter function outside_log_append_only() owner to outside_plain_owner");
await admin.query(`
  create or replace function outside_secdef_wipe() returns void
  language plpgsql security definer set search_path = pg_catalog, public as $$
  begin
    execute 'alter table public.outside_log disable trigger user';
    delete from public.outside_log;
  end $$;
`);
await admin.query("alter function outside_secdef_wipe() owner to outside_plain_owner");
await admin.query("revoke all on function outside_secdef_wipe() from public");
await admin.query("grant execute on function outside_secdef_wipe() to outside_secdef_login");
const secdefRefused = await ownerRefused("outside_secdef_login", "outside-secdef-login");
const secdefUrl = new URL(url);
secdefUrl.username = "outside_secdef_login";
secdefUrl.password = "outside-secdef-login";
const secdefPool = outsidePool(secdefUrl.toString());
const secdefClient = await secdefPool.connect();
let wiped = false;
try {
  await secdefClient.query("begin");
  await secdefClient.query("select outside_secdef_wipe()");
  const left = await secdefClient.query("select count(*)::int as n from outside_log");
  wiped = Number(left.rows[0]?.n) === 0;
  await secdefClient.query("rollback");
} finally {
  secdefClient.release?.();
  await secdefPool.end();
}
await admin.query("drop function outside_secdef_wipe()");
await admin.query(`alter table outside_log owner to "${ownerName}"`);
await admin.query(`alter function outside_log_append_only() owner to "${ownerName}"`);
const stillKept = await admin.query("select count(*)::int as n from outside_log");
expect("execute on a security-definer function of the table owner cannot open the log, and the call deletes until rolled back", secdefRefused && wiped && Number(stillKept.rows[0]?.n) === Number(stillThere.rows[0]?.n));

await admin.query(`
  do $$ begin
    if not exists (select 1 from pg_roles where rolname = 'outside_safe_wear') then create role outside_safe_wear nologin nosuperuser nocreaterole; end if;
    if not exists (select 1 from pg_roles where rolname = 'outside_super_login') then create role outside_super_login login password 'outside-super-login' superuser; end if;
    if not exists (select 1 from pg_roles where rolname = 'outside_program_default') then create role outside_program_default login password 'outside-program-default' nosuperuser nocreaterole; end if;
  end $$;
`);
await admin.query("alter role outside_super_login with login superuser password 'outside-super-login'");
await admin.query("alter role outside_program_default with login nosuperuser nocreaterole password 'outside-program-default'");
await admin.query(`
  do $$
  declare db name := current_database();
  begin
    execute format('grant connect on database %I to outside_safe_wear, outside_super_login, outside_program_default', db);
    grant usage on schema public to outside_safe_wear, outside_super_login, outside_program_default;
    grant select, insert on outside_log to outside_safe_wear, outside_super_login, outside_program_default;
    grant outside_safe_wear to outside_super_login;
    grant outside_safe_wear to outside_program_default;
    grant pg_execute_server_program to outside_program_default;
  end $$;
`);
await admin.query("alter role outside_super_login set role to outside_safe_wear");
await admin.query("alter role outside_program_default set role to outside_safe_wear");

async function loginIdentity(user: string, secret: string): Promise<{ current: string; session: string; opened: boolean }> {
  if (!url) throw new Error("outside: database URL is refused");
  const next = new URL(url);
  next.username = user;
  next.password = secret;
  const pool = outsidePool(next.toString());
  const client = await pool.connect();
  try {
    const who = await client.query("select current_user as current, session_user as session");
    const row = who.rows[0];
    let opened = false;
    try {
      await outsideLog(pool, "acct-ada").run("kettle", () => true);
      opened = true;
    } catch (error) {
      opened = !(error instanceof Error && error.message === "outside: runtime role must not own the log");
    }
    return { current: String(row?.current ?? ""), session: String(row?.session ?? ""), opened };
  } finally {
    client.release?.();
    await pool.end();
  }
}
const superLogin = await loginIdentity("outside_super_login", "outside-super-login");
const superPool = outsidePool(new URL(`postgres://outside_super_login:outside-super-login@${new URL(url).host}${new URL(url).pathname}`).toString());
const superClient = await superPool.connect();
let superDeleted = false;
try {
  await superClient.query("begin");
  await superClient.query("set role none");
  const restored = await superClient.query("select current_user as current");
  await superClient.query("alter table outside_log disable trigger outside_log_append_only");
  const deleted = await superClient.query("delete from outside_log");
  await superClient.query("rollback");
  superDeleted = String(restored.rows[0]?.current ?? "") === "outside_super_login" && (deleted.rowCount ?? 0) > 0;
} finally {
  superClient.release?.();
  await superPool.end();
}
expect("a superuser login whose default role is safe cannot open, and set role none deletes until rolled back", superLogin.current === "outside_safe_wear" && superLogin.session === "outside_super_login" && superLogin.opened === false && superDeleted);

const programLogin = await loginIdentity("outside_program_default", "outside-program-default");
const programDefaultPool = outsidePool(new URL(`postgres://outside_program_default:outside-program-default@${new URL(url).host}${new URL(url).pathname}`).toString());
const programDefaultClient = await programDefaultPool.connect();
let programRestored = false;
try {
  await programDefaultClient.query("set role none");
  const restored = await programDefaultClient.query("select current_user as current");
  await programDefaultClient.query("copy (select 1) to program 'id'");
  programRestored = String(restored.rows[0]?.current ?? "") === "outside_program_default";
} finally {
  programDefaultClient.release?.();
  await programDefaultPool.end();
}
expect("a server-program member whose default role is safe cannot open, and set role none runs a program", programLogin.current === "outside_safe_wear" && programLogin.session === "outside_program_default" && programLogin.opened === false && programRestored);
await admin.query("alter role outside_super_login reset role");
await admin.query("alter role outside_program_default reset role");
await admin.query("revoke pg_execute_server_program from outside_program_default");
await admin.query("alter role outside_super_login nosuperuser");

const runtimeFlags = await live.connect();
let runtimeSeparate = false;
try {
  const found = await runtimeFlags.query(runtimeCanDamageLog);
  runtimeSeparate = found.rows[0]?.capable === false;
} finally { runtimeFlags.release?.(); }
expect("the select and insert runtime role cannot reach a destructive role", runtimeSeparate);
await admin.query(`
  do $$
  declare owner name;
  begin
    select pg_catalog.pg_get_userbyid(c.relowner) into owner
      from pg_catalog.pg_class c
      join pg_catalog.pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and c.relname = 'outside_log';
    execute format('revoke %I from outside_owner_member, outside_owner_mid, outside_owner_setonly, outside_owner_noset, outside_admin_member, outside_admin_mid', owner);
    revoke outside_owner_mid from outside_owner_trans;
    revoke outside_admin_mid from outside_admin_hop;
    revoke outside_other_super from outside_set_super;
    revoke outside_plain_owner from outside_admin_member;
    revoke outside_fn_owner from outside_fn_admin, outside_fn_set;
    revoke outside_replica_mid from outside_replica_inherit, outside_replica_set, outside_replica_admin;
    revoke set on parameter session_replication_role from outside_replica, outside_replica_mid;
  end $$;
`);
await admin.query("alter function outside_log_append_only() owner to current_user");
await live.end();
await admin.end();
if (failed) { console.log(`${failed} failed`); process.exit(1); }
console.log("outside postgres: all checks passed");
