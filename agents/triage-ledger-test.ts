// Tests for founder corrections in the detection ledger (raw triage item 7): an answered held label resolves its trial
// as a false alarm (or a hit), a filed label a founder changes resolves as a miss, and the router ledger appends real,
// chained lines to a Naive venture's triage-accept ledger in a temporary workspace.
//
//   node platform/agents/triage-ledger-test.ts

import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { MemorySaver } from "@langchain/langgraph";
import { ledgerPath, verify } from "naive-framework/src/router/detection-ledger.mjs";
import type { Context, Entry } from "naive-framework/src/engine/triage.mjs";
import { correctFiled, routerLedger, trialId, type Ledger, type Resolution, type Trial, type TriageRecord } from "./triage-ledger.ts";
import { Command, triageGraph, type Deps } from "./triage-graph.ts";
import type { JevReply, JevRequest } from "./jev.ts";
import { naivePath } from "../../scripts/naive.ts";

let failed = 0;
const ok = (name: string, cond: boolean, detail?: unknown) => {
  if (cond) console.log(`ok ${name}`);
  else { failed++; console.log(`FAIL ${name}${detail === undefined ? "" : `: ${JSON.stringify(detail).slice(0, 600)}`}`); }
};

const context: Context = { ventures: [{ id: "kettle", about: "a kettle that texts you" }], functions: ["strategy", "products", "finance"], ideas: [] };
const dump: Entry = { path: "raw/dump/20261109-0100-ab12.md", text: "A kettle that texts you when the water boils." };
const jev = (unsure: Record<string, number> = {}) => ({ invoke: async (req: JevRequest): Promise<JevReply> => {
  const answers: Record<string, unknown> = {};
  for (const k of Object.keys(req.questions)) {
    if (k === "urgency") { answers[k] = { score: 0.4 }; continue; }
    const yes = k === "kind:idea" || k === "venture:f1:kettle" || k === "function:f1:products";
    answers[k] = { noul: unsure[k] ?? (yes ? 0.99 : 0.01) };
  }
  return { model: "jev-test", answers, usage: { input_tokens: 0, output_tokens: 0 } };
} });
const memoryLedger = () => {
  const trials: Trial[] = [], resolutions: Resolution[] = [];
  const ledger: Ledger = { trial: async (t) => { trials.push(t); }, resolve: async (r) => { resolutions.push(r); } };
  return { ledger, trials, resolutions };
};
const run = async (unsure: Record<string, number>, answer?: Record<string, boolean>) => {
  const rows = new Map<string, string>();
  const m = memoryLedger();
  const deps: Deps = { load: async () => ({ entry: dump, context, person: "p-1" }), writer: { write: async (p, c) => { rows.set(p, c); return { ok: true }; } },
    jev: jev(unsure), checkpointer: new MemorySaver(), line: 0.95, routeContext: { leads: [], plans: [], measures: [] } as unknown as Deps["routeContext"],
    ledger: m.ledger, now: () => "2026-11-09T01:00:00Z" };
  const g = triageGraph(deps), cfg = { configurable: { thread_id: "t" } };
  await g.invoke({ ref: { tenant: "acme", path: dump.path } }, cfg);
  if (answer) await g.invoke(new Command({ resume: answer }), cfg);
  return { ...m, record: JSON.parse(rows.get("raw/triage/20261109-0100-ab12.json") ?? "{}") as TriageRecord };
};

// 1. A sure run: every Noul label is a no call, and nothing is resolved.
{
  const r = await run({});
  const nouls = r.record.labels.filter((x) => x.kind === "noul").length;
  ok("a sure run records one no call per Noul label and resolves none", r.trials.length === nouls && r.trials.every((t) => t.call === "no" && t.criterion.yes === 0.95 && t.criterion.yes_when === "below") && r.resolutions.length === 0, r.trials);
  const miss = await correctFiled(r.ledger, r.record, "function:f1:products", false, "p-1");
  ok("a filed label the founder changes resolves as a miss", miss === "miss" && r.resolutions.at(-1)?.trial === trialId("20261109-0100-ab12", "function:f1:products"), r.resolutions);
  const kept = await correctFiled(r.ledger, r.record, "venture:f1:kettle", true, "p-1");
  ok("a filed label the founder confirms resolves as a correct rejection", kept === "correct-rejection");
}

// 2. A held label the founder answers as Jev guessed is a false alarm; answered the other way, a hit.
{
  const r = await run({ "function:f1:finance": 0.6 }, { "function:f1:finance": true });
  const t = r.trials.find((x) => x.key === "function:f1:finance");
  ok("a held label is a yes call scored by Jev's certainty", t?.call === "yes" && t.score === 0.6, t);
  ok("answered as Jev guessed, it resolves as a false alarm by the founder", r.resolutions.length === 1 && r.resolutions[0].outcome === "false-alarm" && r.resolutions[0].by.id === "p-1", r.resolutions);
  let threw = false;
  try { await correctFiled(r.ledger, r.record, "function:f1:finance", false, "p-1"); } catch { threw = true; }
  ok("a held label is not corrected again as a filed one", threw);
  const h = await run({ "function:f1:finance": 0.6 }, { "function:f1:finance": false });
  ok("answered the other way, it resolves as a hit", h.resolutions[0]?.outcome === "hit", h.resolutions);
}

// 3. No Jev: no score, so no trial.
{
  const m = memoryLedger();
  const g = triageGraph({ load: async () => ({ entry: dump, context, person: "p-1" }), writer: { write: async () => ({ ok: true }) }, jev: null, checkpointer: new MemorySaver(),
    line: 0.95, routeContext: { leads: [], plans: [], measures: [] } as unknown as Deps["routeContext"], ledger: m.ledger });
  const cfg = { configurable: { thread_id: "n" } };
  await g.invoke({ ref: { tenant: "acme", path: dump.path } }, cfg);
  await g.invoke(new Command({ resume: {} }), cfg);
  ok("with no Jev answer there is no trial", m.trials.length === 0 && m.resolutions.length === 0, m.trials);
}

// 4. Through Naive's router, into a real venture's ledger.
{
  const ws = mkdtempSync(join(tmpdir(), "triage-ledger-test-"));
  const cli = naivePath("packages/naive/src/interfaces/cli/mentura.mjs");
  const env = { ...process.env, MENTURA_WORKSPACE: ws };
  const made = spawnSync(process.execPath, [cli, "init", join(ws, "ventures/kettle"), "--id", "kettle"], { encoding: "utf8", env });
  ok("a venture from Naive's template starts", made.status === 0, made.stderr);
  const ledger = routerLedger({ venture: "kettle", workspace: ws });
  const r = await run({ "function:f1:finance": 0.6 }, { "function:f1:finance": true });
  try {
    for (const t of r.trials.slice(0, 2)) await ledger.trial(t);
    await ledger.trial(r.trials.find((t) => t.key === "function:f1:finance") as Trial);
    await ledger.resolve({ trial: trialId("20261109-0100-ab12", "function:f1:finance"), outcome: "false-alarm", by: { kind: "person", id: "p-1" } });
    const lines = readFileSync(join(ws, "ventures/kettle", ledgerPath("triage-accept")), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l));
    ok("the router appends chained trial and resolution lines", lines.length === 4 && verify(lines).ok && lines.at(-1).outcome === "false-alarm", { lines: lines.length, v: verify(lines) });
    let refused = false;
    try { await ledger.resolve({ trial: trialId("20261109-0100-ab12", "function:f1:finance"), outcome: "hit", by: { kind: "person", id: "p-1" } }); } catch { refused = true; }
    ok("a trial is resolved once", refused);
  } catch (e) {
    ok("the router ledger appends", false, e instanceof Error ? e.message : String(e));
  }
  rmSync(ws, { recursive: true, force: true });
}

process.exit(failed ? 1 : 0);
