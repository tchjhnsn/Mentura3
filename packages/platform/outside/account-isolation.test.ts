// Database-enforced account isolation for outside_log, on a throwaway Postgres.
// The runtime login cannot read or insert another account by naming one.
// A grant dies with its transaction. Rollback leaves the log rows in place.
//
//   MENTURA_EVAL_DATABASE_URL=postgres://mentura@127.0.0.1:5432/postgres node outside/account-isolation.test.ts

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import pg from "pg";
import { signAssertion, type Identity } from "../bridge/assertion.ts";
import { outsideLog, outsidePool, runtimeCanDamageLog } from "./postgres-log.ts";
import { applyOutsideSchema } from "./postgres-log.ts";

const forwardSql = readFileSync(new URL("./sql/002-outside-account.sql", import.meta.url), "utf8");
const rollbackSql = readFileSync(new URL("./sql/002-outside-account-rollback.sql", import.meta.url), "utf8");
const forwardHash = "4796374ece6a393e40f2d7d960604f17ccfb0be356100788df9d2a7e48873b82";
const rollbackHash = "002bfddaaaf41983bfea160ac1e899fdf6a8806049844f7e6a0cebb8b45cfb57";
const key = "outside-account-key-0123456789abcdef";

let failed = 0;
const expect = (name: string, ok: boolean, detail?: unknown) => {
  console.log(`${ok ? "ok  " : "FAIL"}  ${name}`);
  if (!ok) { failed++; if (detail !== undefined) console.log("      ", detail); }
};

expect("the account schema hash matches the file", createHash("sha256").update(forwardSql).digest("hex") === forwardHash);
expect("the account rollback hash matches the file", createHash("sha256").update(rollbackSql).digest("hex") === rollbackHash);
expect("the account schema does not name the tenant store or an identity table", !/\bnaive_records\b/i.test(forwardSql.replace(/--.*$/gm, "")) && !/\bidentity_/i.test(forwardSql.replace(/--.*$/gm, "")));

const source = process.env.MENTURA_EVAL_DATABASE_URL ?? "";
if (!source) {
  if (process.env.CI) {
    console.error("FAIL  outside account: CI did not set MENTURA_EVAL_DATABASE_URL");
    process.exit(1);
  }
  console.log("SKIP  outside account: set MENTURA_EVAL_DATABASE_URL to a local Postgres");
  process.exit(failed ? 1 : 0);
}
const hostName = new URL(source).hostname;
if (hostName !== "localhost" && hostName !== "127.0.0.1" && hostName !== "::1") {
  console.error("FAIL  outside account: refusing a database host that is not loopback");
  process.exit(1);
}

const database = "mentura_outside_account_test";
const adminBase = new URL(source);
adminBase.pathname = "/postgres";
const maintainer = new pg.Pool({ connectionString: adminBase.toString(), max: 1 });
const existing = await maintainer.query("select 1 from pg_database where datname = $1", [database]);
if (!existing.rowCount) await maintainer.query(`create database ${database}`);
await maintainer.end();
adminBase.pathname = `/${database}`;
const adminUrl = adminBase.toString();
await applyOutsideSchema(adminUrl);
const admin = new pg.Pool({ connectionString: adminUrl, max: 1 });
await admin.query(forwardSql);
await admin.query("insert into outside_log_key (id, secret) values (true, $1) on conflict (id) do update set secret = excluded.secret", [key]);
await admin.query(`
  do $$ begin
    if not exists (select 1 from pg_roles where rolname = 'outside_account_runtime') then
      create role outside_account_runtime login password 'outside-account-runtime' nosuperuser nocreaterole;
    end if;
    if not exists (select 1 from pg_roles where rolname = 'outside_account_owner') then
      create role outside_account_owner login password 'outside-account-owner' nosuperuser nocreaterole;
    end if;
  end $$;
`);
await admin.query("alter role outside_account_runtime with login nosuperuser nocreaterole nobypassrls password 'outside-account-runtime'");
await admin.query("alter role outside_account_owner with login nosuperuser nocreaterole nobypassrls password 'outside-account-owner'");
await admin.query(`grant connect on database ${database} to outside_account_runtime, outside_account_owner`);
await admin.query("grant usage on schema public to outside_account_runtime, outside_account_owner");
await admin.query("grant select, insert on outside_log to outside_account_runtime");
await admin.query("grant execute on function outside_log_authorize(text), outside_log_account() to outside_account_runtime");
await admin.query("grant usage on schema outside_crypto to outside_account_owner");
await admin.query("grant execute on all functions in schema outside_crypto to outside_account_owner");
await admin.query("alter table outside_log owner to outside_account_owner");
await admin.query("alter function outside_log_append_only() owner to outside_account_owner");
await admin.query("alter function outside_log_account() owner to outside_account_owner");
await admin.query("alter function outside_log_authorize(text) owner to outside_account_owner");
await admin.query("alter table outside_log_key owner to outside_account_owner");
await admin.query("alter table outside_log_grant owner to outside_account_owner");

const identity = (userId: string): Identity => ({ userId, name: "Ada", email: "ada@example.com", organizationId: "org", organizationRole: "owner" });
const assertion = (userId: string) => signAssertion(identity(userId), { op: "outside" }, key);
const runtimeUrl = new URL(adminUrl);
runtimeUrl.username = "outside_account_runtime";
runtimeUrl.password = "outside-account-runtime";
const runtime = new pg.Pool({ connectionString: runtimeUrl.toString(), max: 2 });

const beforeWrite = Number((await admin.query("select count(*)::int as n from outside_log where account_id = 'acct-ada'")).rows[0]?.n);
const line = { kind: "note", note: "own" };
const writer = outsidePool(runtimeUrl.toString());
let wrote = 0;
try {
  wrote = await outsideLog(writer, "acct-ada", assertion("acct-ada")).run("kettle", (io) => {
    io.append(line);
    return io.read().length;
  });
} finally { await writer.end(); }
expect("a signed account appends its own line", wrote === beforeWrite + 1);

const own = await runtime.connect();
let ownSeen = 0;
let otherSeen = 0;
let insertOther = false;
let noAssertion = 0;
let randomGrant = 0;
let oldGrant = 0;
let keyHidden = false;
let grantHidden = false;
try {
  await own.query("begin");
  await own.query("select outside_log_authorize($1)", [assertion("acct-ada")]);
  ownSeen = Number((await own.query("select count(*)::int as n from outside_log")).rows[0]?.n);
  const saved = String((await own.query("select current_setting('outside.grant', true) as grant")).rows[0]?.grant ?? "");
  await own.query("commit");
  await own.query("begin");
  noAssertion = Number((await own.query("select count(*)::int as n from outside_log")).rows[0]?.n);
  await own.query("select pg_catalog.set_config('outside.grant', pg_catalog.gen_random_uuid()::text, true)");
  randomGrant = Number((await own.query("select count(*)::int as n from outside_log")).rows[0]?.n);
  await own.query("select pg_catalog.set_config('outside.grant', $1, true)", [saved]);
  oldGrant = Number((await own.query("select count(*)::int as n from outside_log")).rows[0]?.n);
  await own.query("rollback");
  await own.query("begin");
  await own.query("select outside_log_authorize($1)", [assertion("acct-ada")]);
  otherSeen = Number((await own.query("select count(*)::int as n from outside_log where account_id = 'acct-bea'")).rows[0]?.n);
  try {
    await own.query("insert into outside_log (account_id, venture_id, seq, prev_hash, line_hash, line) values ('acct-bea', 'kettle', 1, '', repeat('a', 64), '{\"kind\":\"note\"}'::jsonb)");
  } catch { insertOther = true; }
  await own.query("rollback");
} finally { own.release(); }
try { await runtime.query("select secret from outside_log_key"); } catch { keyHidden = true; }
try { await runtime.query("select grant_id from outside_log_grant"); } catch { grantHidden = true; }
expect("the signed account sees its row, and another account's rows are not visible", ownSeen === beforeWrite + 1 && otherSeen === 0 && insertOther);
expect("a new transaction, a random grant, and a previous grant see no rows", noAssertion === 0 && randomGrant === 0 && oldGrant === 0);
expect("the runtime cannot read the key or the grant table", keyHidden && grantHidden);

const ownerUrl = new URL(adminUrl);
ownerUrl.username = "outside_account_owner";
ownerUrl.password = "outside-account-owner";
const owner = new pg.Pool({ connectionString: ownerUrl.toString(), max: 1 });
const ownerSeen = Number((await owner.query("select count(*)::int as n from outside_log")).rows[0]?.n);
expect("the non-superuser table owner is subject to the row policy and sees no rows", ownerSeen === 0);
await owner.end();

const first = await runtime.connect();
const second = await runtime.connect();
let reused = false;
try {
  await first.query("begin");
  await first.query("select outside_log_authorize($1)", [assertion("acct-ada")]);
  await first.query("commit");
  await second.query("begin");
  await second.query("select outside_log_authorize($1)", [assertion("acct-bea")]);
  const adaOnBea = Number((await second.query("select count(*)::int as n from outside_log where account_id = 'acct-ada'")).rows[0]?.n);
  const beaOnBea = Number((await second.query("select count(*)::int as n from outside_log")).rows[0]?.n);
  await second.query("rollback");
  await first.query("begin");
  const afterReuse = Number((await first.query("select count(*)::int as n from outside_log")).rows[0]?.n);
  await first.query("rollback");
  reused = adaOnBea === 0 && beaOnBea === 0 && afterReuse === 0;
} finally {
  first.release();
  second.release();
}
expect("a connection reused for another account does not keep the first grant", reused);

const updateRefused = await runtime.query("update outside_log set seq = seq").then(() => false).catch(() => true);
const deleteRefused = await runtime.query("delete from outside_log").then(() => false).catch(() => true);
const truncateRefused = await runtime.query("truncate outside_log").then(() => false).catch(() => true);
expect("update, delete, and truncate stay refused", updateRefused && deleteRefused && truncateRefused);

const capable = async () => {
  const client = await runtime.connect();
  try {
    return (await client.query(runtimeCanDamageLog)).rows[0]?.capable === true;
  } finally { client.release(); }
};
expect("the runtime can open while the account functions keep their owner and settings", await capable() === false);
await admin.query(`
  create or replace function outside_log_other() returns void
  language plpgsql security definer set search_path = pg_catalog, public as $$ begin return; end $$;
`);
await admin.query("alter function outside_log_other() owner to outside_account_owner");
await admin.query("grant execute on function outside_log_other() to outside_account_runtime");
expect("a third security-definer function refuses the runtime", await capable());
await admin.query("drop function outside_log_other()");
await admin.query("alter function outside_log_authorize(text) set search_path = public");
expect("the authorize function with an open search path refuses the runtime", await capable());
await admin.query("alter function outside_log_authorize(text) set search_path = pg_catalog, public");
await admin.query("alter function outside_log_authorize(text) owner to outside_account_runtime");
expect("the authorize function owned by the runtime refuses the runtime", await capable());
await admin.query("alter function outside_log_authorize(text) owner to outside_account_owner");
expect("restoring the owner and search path lets the runtime open", await capable() === false);

const beforeRollback = Number((await admin.query("select count(*)::int as n from outside_log")).rows[0]?.n);
await admin.query(`
  do $$ begin
    if exists (select 1 from pg_roles where rolname = 'outside_host') then
      if to_regprocedure('public.outside_log_authorize(text)') is not null then
        revoke all on function public.outside_log_authorize(text) from outside_host;
        revoke all on function public.outside_log_account() from outside_host;
      end if;
      execute format('revoke all on database %I from outside_host', current_database());
      drop role outside_host;
    end if;
  end $$;
`);
await admin.query(rollbackSql);
const afterAbsent = Number((await admin.query("select count(*)::int as n from outside_log")).rows[0]?.n);
const policyGone = Number((await admin.query("select count(*)::int as n from pg_catalog.pg_policy where polname = 'outside_log_account'")).rows[0]?.n);
await admin.query(rollbackSql);
const afterAgain = Number((await admin.query("select count(*)::int as n from outside_log")).rows[0]?.n);
expect("rollback with the runtime role absent leaves the rows and can run again", beforeRollback === beforeWrite + 1 && afterAbsent === beforeRollback && afterAgain === beforeRollback && policyGone === 0);

await admin.query(`
  do $$ begin
    if exists (select 1 from pg_roles where rolname = 'outside_host') then
      execute format('revoke all on database %I from outside_host', current_database());
      drop role outside_host;
    end if;
  end $$;
`);
await admin.query("create role outside_host nologin nosuperuser nocreaterole");
await admin.query(forwardSql);
await admin.query("insert into outside_log_key (id, secret) values (true, $1) on conflict (id) do update set secret = excluded.secret", [key]);
await admin.query("alter table outside_log owner to outside_account_owner");
await admin.query("alter function outside_log_append_only() owner to outside_account_owner");
await admin.query("alter function outside_log_account() owner to outside_account_owner");
await admin.query("alter function outside_log_authorize(text) owner to outside_account_owner");
await admin.query("alter table outside_log_key owner to outside_account_owner");
await admin.query("alter table outside_log_grant owner to outside_account_owner");
await admin.query(rollbackSql);
const afterPresent = Number((await admin.query("select count(*)::int as n from outside_log")).rows[0]?.n);
await admin.query(rollbackSql);
const afterPresentAgain = Number((await admin.query("select count(*)::int as n from outside_log")).rows[0]?.n);
expect("rollback with outside_host present leaves the rows and can run again", afterPresent === beforeRollback && afterPresentAgain === beforeRollback);
await admin.query("drop role if exists outside_host");

await runtime.end();
await admin.end();
if (failed) { console.log(`${failed} failed`); process.exit(1); }
console.log("outside account isolation: all checks passed");
