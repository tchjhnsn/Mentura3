// hosted/setup-store.ts on a throwaway database: it sets the store up twice, the runtime login can write its own
// account's rows only after mentura_authorize, it cannot read the key, and it cannot bypass row security.
// Skips without MENTURA_EVAL_DATABASE_URL (a loopback Postgres, as in CI).

import pg from "pg";
import { signAssertion } from "../bridge/assertion.ts";
import { passwordLiteral, RUNTIME_ROLE, setupStore, setupSteps } from "./setup-store.ts";

let failed = 0;
const expect = (name: string, ok: boolean, detail?: unknown) => {
  console.log(`${ok ? "ok" : "FAIL"}  ${name}${ok || detail === undefined ? "" : ` ${JSON.stringify(detail)}`}`);
  if (!ok) failed++;
};
const throws = (fn: () => unknown) => { try { fn(); return false; } catch { return true; } };

expect("a short or quoted password is refused before any SQL", throws(() => passwordLiteral("short")) && throws(() => passwordLiteral(`${"a".repeat(40)}'; drop role x; --`)));
expect("a database name that is not an identifier is refused", throws(() => setupSteps("bad;name")));

const source = process.env.MENTURA_EVAL_DATABASE_URL ?? "";
if (!source) {
  if (process.env.CI) { console.error("FAIL  setup store: CI did not set MENTURA_EVAL_DATABASE_URL"); process.exit(1); }
  console.log("SKIP  setup store: set MENTURA_EVAL_DATABASE_URL to a local Postgres");
  process.exit(failed ? 1 : 0);
}
if (!["localhost", "127.0.0.1", "::1"].includes(new URL(source).hostname)) { console.error("FAIL  setup store: refusing a host that is not loopback"); process.exit(1); }

const name = "mentura_setup_store_test";
const root = new URL(source);
root.pathname = "/postgres";
const rootPool = new pg.Pool({ connectionString: root.toString(), max: 1 });
if (!(await rootPool.query("select 1 from pg_database where datname = $1", [name])).rowCount) await rootPool.query(`create database ${name}`);
await rootPool.end();
const adminUrl = new URL(source);
adminUrl.pathname = `/${name}`;

const password = "setup-store-test-password-0123456789";
const key = "setup-store-test-key-0123456789abcdef";
const env = { MENTURA_ADMIN_DATABASE_URL: adminUrl.toString(), MENTURA_RUNTIME_PASSWORD: password, NAIVE_BRIDGE_KEY: key };
process.env.MENTURA_ADMIN_DATABASE_URL = env.MENTURA_ADMIN_DATABASE_URL;
const first = await setupStore(env, "pg");
const second = await setupStore(env, "pg");
expect("the store sets up, and again", first.database === name && second.role === RUNTIME_ROLE);

const runtimeUrl = new URL(adminUrl);
runtimeUrl.username = RUNTIME_ROLE;
runtimeUrl.password = password;
const runtime = new pg.Pool({ connectionString: runtimeUrl.toString(), max: 1 });
try {
  const role = await runtime.query("select rolbypassrls as b, rolsuper as s from pg_roles where rolname = current_user");
  expect("the runtime login cannot bypass row security", role.rows[0]?.b === false && role.rows[0]?.s === false, role.rows[0]);
  let keyHidden = false;
  try { await runtime.query("select secret from mentura_tenant_key"); } catch { keyHidden = true; }
  expect("the runtime login cannot read the key", keyHidden);
  let unsignedRefused = false;
  try {
    await runtime.query("insert into naive_records (tenant, path, content, version, hash) values ('someone', 'a.json', '{}', 'v', 'h')");
  } catch { unsignedRefused = true; }
  expect("without a signed grant the runtime login writes nothing", unsignedRefused);
  // Tenant = team (sql/003-team-tenant.sql): the grant binds the assertion's team id, else the person's id.
  const writes = async (identity: { userId: string; organizationId: string }, tenant: string) => {
    const conn = await runtime.connect();
    try {
      await conn.query("begin");
      await conn.query("select mentura_authorize($1)", [signAssertion({ ...identity, name: "T", email: "t@example.com", organizationRole: "owner" }, { op: "ventures" }, key)]);
      await conn.query("insert into naive_records (tenant, path, content, version, hash) values ($1, 'team.json', '{}', 'v', 'h')", [tenant]);
      return true;
    } catch { return false; } finally { await conn.query("rollback").catch(() => undefined); conn.release(); }
  };
  expect("an assertion for a team writes that team's rows", await writes({ userId: "person-1", organizationId: "team-a" }, "team-a"));
  expect("an assertion for a team does not write its person's own rows", !(await writes({ userId: "person-1", organizationId: "team-a" }, "person-1")));
  expect("an assertion with no team writes its person's rows, as before teams", await writes({ userId: "person-1", organizationId: "" }, "person-1"));
} finally {
  await runtime.end();
}
process.exit(failed ? 1 : 0);
