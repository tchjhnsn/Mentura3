// Sets up the hosted business store in a tenant database, as its owner: the naive_records table, the runtime login,
// its grants, the row policy (sql/002-tenant-isolation.sql) and the key that signs each account's assertion. It runs
// the same steps as hosted/account-workspace-test.ts does on a throwaway database. Safe to run again: each step is
// idempotent, and a second run resets the runtime password and the key to the values given.
//
//   MENTURA_ADMIN_DATABASE_URL=<owner url> MENTURA_RUNTIME_PASSWORD=<password> NAIVE_BRIDGE_KEY=<key> \
//     node hosted/setup-store.ts [--driver neon-ws]
//
// It reads the three values from the environment and prints none of them. The runtime login is created with SQL,
// not a hosting provider's console, so it gets no role that bypasses row security (Neon's neon_superuser does).

import { readFileSync } from "node:fs";
import { driverFrom, ensureSchema, poolFrom, TABLE, type Driver } from "../connectors/postgres.ts";

export const RUNTIME_ROLE = "mentura_console_tenant";

/** The statements, in order. The password and key are parameters or quoted literals, never logged. */
export function setupSteps(database: string): string[] {
  if (!/^[a-z_][a-z0-9_]*$/.test(database)) throw new Error("the tenant database's name must be a plain identifier");
  return [
    `grant connect on database ${database} to ${RUNTIME_ROLE}`,
    `grant usage on schema public to ${RUNTIME_ROLE}`,
    `grant select, insert on ${TABLE} to ${RUNTIME_ROLE}`,
    `grant usage, select on sequence ${TABLE}_seq_seq to ${RUNTIME_ROLE}`,
  ];
}

/** A password literal for ALTER ROLE, which takes no bind parameters. Only a long plain token is accepted. */
export function passwordLiteral(password: string): string {
  if (!/^[A-Za-z0-9_-]{32,128}$/.test(password)) throw new Error("the runtime password must be 32 to 128 letters, digits, - or _");
  return `'${password}'`;
}

export async function setupStore(env: NodeJS.ProcessEnv = process.env, driver: Driver = driverFrom()): Promise<{ database: string; role: string }> {
  const password = env.MENTURA_RUNTIME_PASSWORD ?? "";
  const key = env.NAIVE_BRIDGE_KEY ?? "";
  if (key.length < 32) throw new Error("NAIVE_BRIDGE_KEY must be set, at least 32 characters");
  const literal = passwordLiteral(password);
  const admin = poolFrom("MENTURA_ADMIN_DATABASE_URL", driver);
  try {
    const database = String((await admin.query("select current_database() as d")).rows[0]?.d ?? "");
    await ensureSchema(admin);
    await admin.query(`do $$ begin
      if not exists (select 1 from pg_roles where rolname = '${RUNTIME_ROLE}') then
        create role ${RUNTIME_ROLE} login;
      end if;
    end $$`);
    // Attributes stay at their defaults (no superuser, no bypass): a hosted owner such as Neon's may not set them at all.
    await admin.query(`alter role ${RUNTIME_ROLE} with login password ${literal}`);
    for (const sql of setupSteps(database)) await admin.query(sql);
    await admin.query(readFileSync(new URL("./sql/002-tenant-isolation.sql", import.meta.url), "utf8"));
    await admin.query("insert into mentura_tenant_key (id, secret) values (true, $1) on conflict (id) do update set secret = excluded.secret", [key]);
    const bypass = await admin.query("select rolbypassrls as b, rolsuper as s from pg_roles where rolname = $1", [RUNTIME_ROLE]);
    if (bypass.rows[0]?.b || bypass.rows[0]?.s) throw new Error(`${RUNTIME_ROLE} can bypass row security; drop it and run this again`);
    // A member of a role that bypasses row security could switch to it, so no such membership is allowed either.
    const inherited = await admin.query(`select count(*)::int as n from pg_roles r
      where (r.rolbypassrls or r.rolsuper) and r.rolname <> $1 and pg_has_role($1, r.oid, 'member')`, [RUNTIME_ROLE]);
    if (Number(inherited.rows[0]?.n) > 0) throw new Error(`${RUNTIME_ROLE} belongs to a role that can bypass row security; drop it and run this again`);
    return { database, role: RUNTIME_ROLE };
  } finally {
    await admin.end();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const i = process.argv.indexOf("--driver");
  const driver = i > 0 ? driverFrom(process.argv[i + 1]) : driverFrom();
  setupStore(process.env, driver).then(
    (r) => console.log(`hosted store ready: ${r.role} on ${r.database}`),
    (e) => { console.error(`setup failed: ${e instanceof Error ? e.message.replace(/postgres(ql)?:\/\/\S+/g, "<url>") : "unknown"}`); process.exit(1); },
  );
}
