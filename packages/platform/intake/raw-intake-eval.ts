// Evals for raw intake (raw triage item 5) against a real Postgres: CI starts one as a service; locally, point
// MENTURA_EVAL_DATABASE_URL at a throwaway database. Without it the database half says it skipped. Each run uses its
// own tenant ids, so runs never collide.
//
//   node platform/intake/raw-intake-eval.ts

import { connect, ensureSchema, poolFrom } from "../connectors/postgres.ts";
import { CLAIMS, claim, ensureIntake, isRawEntry, parsePayload, pgListener, startWorker, unclaimed } from "./raw-intake.ts";

let failed = 0;
const ok = (name: string, cond: boolean, detail?: unknown) => {
  if (cond) console.log(`ok ${name}`);
  else { failed++; console.log(`FAIL ${name}${detail === undefined ? "" : `: ${JSON.stringify(detail)}`}`); }
};

// No database needed.
ok("a capture is a raw entry", isRawEntry("raw/dump/20261109-0032-ab12.md"));
ok("a reference's text is a raw entry, under a venture too", isRawEntry("ventures/acme/raw/sources/pg-essay/text.md"));
ok("source.json, a triage record and other records are not", !isRawEntry("raw/sources/pg-essay/source.json") && !isRawEntry("raw/triage/x.json") && !isRawEntry("ideas/raw/dump/x.txt") && !isRawEntry("notes/raw.md"));
ok("a payload splits at the first colon", JSON.stringify(parsePayload("acme:raw/dump/a.md")) === JSON.stringify({ tenant: "acme", path: "raw/dump/a.md" }) && parsePayload("nocolon") === null);

if (!process.env.MENTURA_EVAL_DATABASE_URL) {
  console.log("skip the raw intake evals on Postgres: set MENTURA_EVAL_DATABASE_URL to a throwaway database");
  process.exit(failed ? 1 : 0);
}

const pool = poolFrom("MENTURA_EVAL_DATABASE_URL");
await ensureSchema(pool);
await ensureIntake(pool);
await ensureIntake(pool);
ok("the intake schema runs twice", true);
const run = `intake-${Date.now().toString(36)}-${process.pid}`;
const tenant = `${run}-a`, other = `${run}-b`;
const store = connect({ tenant, client: pool });
const otherStore = connect({ tenant: other, client: pool });

// Written before any worker starts: the sweep finds them.
await store.write("raw/dump/early-1.md", "---\nid: early-1\n---\n\nAn idea before the worker.\n");
await store.write("notes/plain.md", "Not raw.\n");
await store.write("raw/sources/pg/source.json", JSON.stringify({ id: "pg", origin: "https://example.com" }));
await otherStore.write("raw/dump/other-1.md", "Another tenant's idea.\n");
const before = (await unclaimed(pool, tenant)).map((e) => e.path);
ok("unclaimed lists only this tenant's raw entries", JSON.stringify(before) === JSON.stringify(["raw/dump/early-1.md"]), before);

ok("a path that is not a raw entry is never claimed", !(await claim(pool, tenant, "notes/plain.md", "w0")));

// Two workers on the same tenant, both listening.
const seen: Record<string, string[]> = { w1: [], w2: [] };
const make = async (name: string) => startWorker({ client: pool, listener: await pgListener("MENTURA_EVAL_DATABASE_URL"), worker: name, tenant,
  triage: async (e) => { seen[name].push(e.path); } });
const [w1, w2] = await Promise.all([make("w1"), make("w2")]);
await store.write("raw/dump/live-1.md", "An idea while the workers listen.\n");
await store.write("raw/sources/pg/text.md", "The essay's text.\n");
await store.write("decisions/d-1.json", "{}\n");
// Notifications arrive asynchronously; wait until both entries are claimed or a few seconds pass.
for (let i = 0; i < 50 && (await unclaimed(pool, tenant)).length > 0; i++) await new Promise((r) => setTimeout(r, 100));
await Promise.all([w1.idle(), w2.idle()]);
const all = [...seen.w1, ...seen.w2].sort();
ok("every raw entry is triaged exactly once across two workers", JSON.stringify(all) === JSON.stringify(["raw/dump/early-1.md", "raw/dump/live-1.md", "raw/sources/pg/text.md"]), seen);
ok("nothing that is not a raw entry reached triage", !all.some((p) => p.startsWith("decisions/") || p.startsWith("notes/")));
ok("the other tenant's entry was left for its own worker", (await unclaimed(pool, other)).length === 1);

// Writing the same entry again (a new row with the same content is skipped; new content is a new row) claims nothing new.
await store.write("raw/dump/live-1.md", "An idea while the workers listen, edited.\n");
await new Promise((r) => setTimeout(r, 300));
await Promise.all([w1.idle(), w2.idle()]);
ok("a second row for a claimed entry is not triaged again", [...seen.w1, ...seen.w2].length === 3, seen);

// Claims are append-only.
let refused = "";
try { await pool.query(`delete from ${CLAIMS} where tenant = $1`, [tenant]); } catch (e) { refused = e instanceof Error ? e.message : String(e); }
ok("a claim cannot be deleted", /append-only/.test(refused), refused);
try { refused = ""; await pool.query(`update ${CLAIMS} set worker = 'x' where tenant = $1`, [tenant]); } catch (e) { refused = e instanceof Error ? e.message : String(e); }
ok("a claim cannot be changed", /append-only/.test(refused), refused);

// A triage that throws keeps its claim and is reported.
const errors: string[] = [];
const w3 = await startWorker({ client: pool, listener: await pgListener("MENTURA_EVAL_DATABASE_URL"), worker: "w3", tenant: other,
  triage: async () => { throw new Error("Jev unreachable"); }, onError: (e, err) => errors.push(`${e.path}: ${err instanceof Error ? err.message : ""}`) });
await w3.idle();
ok("a failed triage is reported and keeps its claim", errors.length === 1 && /Jev unreachable/.test(errors[0]) && (await unclaimed(pool, other)).length === 0, errors);

await Promise.all([w1.stop(), w2.stop(), w3.stop()]);
await pool.end();
process.exit(failed ? 1 : 0);
