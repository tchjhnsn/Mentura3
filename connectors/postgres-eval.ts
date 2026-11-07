// Evals for the Postgres connector and the store import (EE-118 step 9), against a real Postgres. CI starts
// one as a service (.github/workflows/test.yml); locally, point MENTURA_EVAL_DATABASE_URL at a throwaway
// database. Without it the evals say they skipped. Each run uses its own tenant ids, so runs never collide.
//
//   node platform/connectors/postgres-eval.ts

import { cpSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { contract, FIXTURE, harness, OUTSIDE } from "naive-framework/src/store/connectors/suite.mjs";
import { connect, driverFrom, ensureSchema, poolFrom, TABLE, verify } from "./postgres.ts";
import { filesOf, importFolder } from "./store-import.ts";
import { exportFolder } from "./store-export.ts";

const h = harness("postgres");
const { expect, throws, skip, scratch, finish } = h;
// The driver choice needs no database.
expect("postgres: with no MENTURA_DB_DRIVER the driver is pg", driverFrom(undefined) === "pg");
expect("postgres: neon-ws names Neon's WebSocket driver", driverFrom("neon-ws") === "neon-ws");
expect("postgres: an unknown driver is refused by name", await throws(async () => driverFrom("mysql"), /must be one of pg, neon-ws/));
if (!process.env.MENTURA_EVAL_DATABASE_URL) { skip("the Postgres evals: set MENTURA_EVAL_DATABASE_URL to a throwaway database"); finish(); }
const pool = poolFrom("MENTURA_EVAL_DATABASE_URL");
await ensureSchema(pool);
const run = `eval-${Date.now().toString(36)}-${process.pid}`;
let n = 0;

// The contract: the fixture under a root, one item outside it that must never show.
const make = async ({ writes = "direct" } = {}) => {
  const tenant = `${run}-c${++n}`;
  const seed = connect({ tenant, client: pool });
  for (const [p, c] of Object.entries(FIXTURE)) await seed.write(`kb/${p}`, c);
  for (const [p, c] of Object.entries(OUTSIDE)) await seed.write(p, c);
  const c = connect({ tenant, client: pool, root: "kb", writes });
  return { c, tenant, base: async (p: string) => (await seed.read(`kb/${p}`))?.content ?? null, later: async (p: string) => (await seed.read(`kb/${p}`))?.content ?? null, pulls: () => [] };
};
const t = await contract(h, "postgres", make);
{
  const again = await t.c.write("notes/alpha.md", (await t.c.read("notes/alpha.md"))?.content ?? "");
  expect("postgres: writing the content the store already holds appends nothing", "unchanged" in again);
  const rows = (await pool.query(`select count(*)::int as n from ${TABLE} where tenant = $1 and path = 'kb/notes/alpha.md'`, [t.tenant])).rows[0].n;
  expect("postgres: an overwrite is a new row; the old content stays in the table", rows === 2, `rows ${rows}`);
  expect("postgres: the tenant's hash chain holds", (await verify(pool, t.tenant)).broken.length === 0);
  expect("postgres: UPDATE is refused by the database", await throws(() => pool.query(`update ${TABLE} set content = 'x' where tenant = $1`, [t.tenant]), /append-only/));
  expect("postgres: DELETE is refused by the database", await throws(() => pool.query(`delete from ${TABLE} where tenant = $1`, [t.tenant]), /append-only/));
  const other = connect({ tenant: `${run}-other`, client: pool });
  expect("postgres: one tenant never sees another's records", (await other.list()).length === 0 && (await other.read("kb/notes/alpha.md")) === null);
  const odd = connect({ tenant: `${run}-like`, client: pool });
  await odd.write("a_b/x.md", "x\n"); await odd.write("aXb/y.md", "y\n");
  expect("postgres: a prefix's own _ and % match only themselves", JSON.stringify((await odd.list("a_b")).map((x) => x.path)) === JSON.stringify(["a_b/x.md"]));
  expect("postgres: a source with no tenant, or that asks for pull requests, is refused", await throws(() => connect({ client: pool })) && await throws(() => connect({ tenant: "x", client: pool, writes: "pull-request" })));
  const saved = process.env.MENTURA_EVAL_NO_URL;
  delete process.env.MENTURA_EVAL_NO_URL;
  expect("postgres: without a connection string it fails and names the variable to set", await throws(() => connect({ tenant: "x", url: "MENTURA_EVAL_NO_URL" }).list(), /no connection string in MENTURA_EVAL_NO_URL/));
  if (saved !== undefined) process.env.MENTURA_EVAL_NO_URL = saved;
}

// The import: this repository's instance/ into a fresh tenant, then again, then a changed file.
console.log("\n# store import");
const folder = join(scratch, "instance");
cpSync(new URL("../../instance", import.meta.url).pathname, folder, { recursive: true });
const tenant = `${run}-instance`;
const files = filesOf(folder).length;
const dry = await importFolder(folder, { tenant, client: pool, check: true });
expect("import --check writes nothing and counts every file as to be appended", dry.appended === files && dry.chain.rows === 0);
const first = await importFolder(folder, { tenant, client: pool });
expect("import loads every file of instance/, reads each back the same, and the chain holds", first.appended === files && first.mismatched.length === 0 && first.chain.rows === files && first.chain.broken.length === 0, JSON.stringify({ ...first, chain: first.chain.broken.slice(0, 3) }));
const second = await importFolder(folder, { tenant, client: pool });
expect("import run again appends nothing", second.appended === 0 && second.unchanged === files && second.chain.rows === files);
writeFileSync(join(folder, "workspace.json"), JSON.stringify({ changed: true }) + "\n");
const third = await importFolder(folder, { tenant, client: pool });
expect("a changed file appends one row and the chain still holds", third.appended === 1 && third.chain.rows === files + 1 && third.chain.broken.length === 0);

// The export: the tenant back out into a folder, the same files with the newest content.
console.log("\n# store export");
const back = join(scratch, "export");
const exported = await exportFolder(back, { tenant, client: pool });
const same = filesOf(back).join() === filesOf(folder).join() && filesOf(folder).every((f) => readFileSync(join(back, f), "utf8") === readFileSync(join(folder, f), "utf8"));
expect("export writes every file back with its newest content", exported.files === files && exported.mismatched.length === 0 && same, JSON.stringify(exported.mismatched.slice(0, 3)));
const some = filesOf(folder)[0]?.split("/")[0] ?? "";
const part = await exportFolder(join(scratch, "export-part"), { tenant, client: pool, root: some });
expect("export --root writes only the records under that path", part.files === filesOf(folder).filter((f) => f.startsWith(`${some}/`)).length && part.mismatched.length === 0);
mkdirSync(join(scratch, "busy"), { recursive: true });
writeFileSync(join(scratch, "busy/keep.md"), "mine\n");
expect("export refuses a folder that is not empty", await throws(() => exportFolder(join(scratch, "busy"), { tenant, client: pool }), /not empty/));

await pool.end();
finish();
