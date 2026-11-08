// Evals for the Postgres connector and the store import (EE-118 step 9), against a real Postgres. CI starts
// one as a service (.github/workflows/test.yml); locally, point MENTURA_EVAL_DATABASE_URL at a throwaway
// database. Without it the evals say they skipped. Each run uses its own tenant ids, so runs never collide.
//
//   node platform/connectors/postgres-eval.ts

import { appendFileSync, cpSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { contract, FIXTURE, harness, OUTSIDE } from "naive-framework/src/store/connectors/suite.mjs";
import { connect, driverFrom, ensureSchema, poolFrom, TABLE, verify } from "./postgres.ts";
import { filesOf, importFolder } from "./store-import.ts";
import { naivePath } from "../../scripts/naive.ts";
import { exportFolder } from "./store-export.ts";
import { withWorkingCopy, type Store } from "../hosted/working-copy.ts";
import { runCommand } from "../hosted/run.ts";

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

function textOrderBoundary(head: number): { early: number, late: number } {
  if (head < 11) return { early: 11, late: 107 };
  let late = 10;
  while (late <= head + 1) late *= 10;
  return { early: late - 1, late };
}
{
  const headRaw = (await pool.query(`select coalesce(max(seq), 0)::int as n from ${TABLE}`)).rows[0]?.n;
  const head = typeof headRaw === "number" ? headRaw : Number(headRaw);
  if (!Number.isFinite(head)) throw new Error("postgres eval could not read the latest sequence");
  const { early, late } = textOrderBoundary(head);
  expect(`postgres: sequences ${early} and ${late} disagree as text and as integers`, early < late && String(early) > String(late));
  const place = (seq: number) => pool.query(`select setval(pg_get_serial_sequence($1, 'seq'), $2, false)`, [TABLE, seq]);
  const tenant = `${run}-boundary`;
  const store = connect({ tenant, client: pool });
  await place(early);
  const older = await store.write("a-target.md", "version-one\n");
  await place(late);
  const newer = await store.write("a-target.md", "version-two\n");
  const read = await store.read("a-target.md");
  const listed = await store.list();
  const dir = join(scratch, "boundary");
  const exported = await exportFolder(dir, { tenant, client: pool });
  const file = readFileSync(join(dir, "a-target.md"), "utf8");
  expect(
    "postgres: read, list, and export return the newest bytes when an older sequence text-sorts first",
    "seq" in older && older.seq === early && "seq" in newer && newer.seq === late
      && read?.content === "version-two\n" && read.seq === late
      && listed.length === 1 && listed[0]?.version === newer.version
      && exported.files === 1 && exported.mismatched.length === 0 && file === "version-two\n",
    JSON.stringify({ early, late, older, newer, content: read?.content, seq: read?.seq, listed, file, mismatched: exported.mismatched }),
  );
}

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

// The import: Naive's example workspace into a fresh tenant, then again, then a changed file.
console.log("\n# store import");
const folder = join(scratch, "workspace");
cpSync(naivePath("packages/naive/src/records/examples/workspace"), folder, { recursive: true });
const tenant = `${run}-workspace`;
const files = filesOf(folder).length;
const dry = await importFolder(folder, { tenant, client: pool, check: true });
expect("import --check writes nothing and counts every file as to be appended", dry.appended === files && dry.chain.rows === 0);
const first = await importFolder(folder, { tenant, client: pool });
expect("import loads every file of the workspace, reads each back the same, and the chain holds", first.appended === files && first.mismatched.length === 0 && first.chain.rows === files && first.chain.broken.length === 0, JSON.stringify({ ...first, chain: first.chain.broken.slice(0, 3) }));
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

// The hosted working copy: the same tenant checked out, a Naive check run on it in hosted mode as its own process,
// and a provenance line appended, which commits as an append with its base (platform/hosted/working-copy.ts).
console.log("\n# hosted working copy");
const log = "ventures/northstar/provenance.jsonl";
const store = connect({ tenant, client: pool }) as unknown as Store;
const before = (await store.read(log))?.content ?? "";
const hostedRun = await withWorkingCopy(store, join(scratch, "hosted"), (dir) => {
  const status = runCommand([process.execPath, naivePath("packages/naive/src/checks/check-ventures.mjs"), "{dir}"])(dir);
  appendFileSync(join(dir, log), JSON.stringify({ at: "2026-11-07T00:00:00Z", entity: "venture.json", activity: "write", agent: "eval" }) + "\n");
  return status;
});
expect("hosted: Naive's check runs on the working copy in hosted mode and passes", hostedRun.result === 0);
expect("hosted: the run's provenance line is appended to the store, and nothing else is written", JSON.stringify(hostedRun.commit.appended) === JSON.stringify([log]) && hostedRun.commit.wrote.length === 0 && (await store.read(log))?.content.startsWith(before) === true, JSON.stringify(hostedRun.commit));
expect("hosted: the tenant's chain still holds after the commit", (await verify(pool, tenant)).broken.length === 0);

await pool.end();
finish();
