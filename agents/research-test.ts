// Tests the researcher run offline (autoresearch build plan item 13): every function derives a researcher spec from
// Naive's data, and strategy's works competitors/[id]/signals; a run with a scripted model (fakeModel) keeps a change
// as a held draft, discards one, and stops at the run's limit and then at the plan's budget, writing only through
// Naive's recipes/<pattern> route; every other write is refused before Naive sees it; the cut is the plan's read_cut,
// narrowed but never widened by MENTURA_READS_AS_OF; a run with no budget left loads no model; a retry is already-ran;
// the run's spans and provenance lines share the caller's trace and check-traces passes; the CLI takes a venture's
// folder and refuses an unstaffed researcher with the team-plan entry to add.
//
//   node --import ./scripts/naive-ts.ts platform/agents/research-test.ts

import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { AIMessage } from "@langchain/core/messages";
import { fakeModel } from "@langchain/core/testing";
import { span } from "naive-framework/src/core/instrumentation.mjs";
import { entries, record } from "naive-framework/src/core/provenance.mjs";
import { signalId } from "naive-framework/src/core/signal-id.ts";
import { planRecipe } from "naive-framework/src/engine/recipes/eval-set.ts";
import { call } from "naive-framework/src/router/router.mjs";
import { naivePath, naiveTs } from "../../scripts/naive.ts";
import type { ModelSource } from "./function-agent.ts";
import { runIdOf } from "./function-agent.ts";
import { functionIds, functionResearcher, programPatterns, programSection, researcherTeamPlanEntry } from "./function-spec.ts";
import type { ResearchResult } from "./research.ts";
import { cutOf, runResearcher } from "./research.ts";

let failed = 0;
const ok = (name: string, cond: boolean, detail: unknown = "") => { console.log(`${cond ? "pass" : "FAIL"}  ${name}${cond || detail === "" ? "" : `: ${typeof detail === "string" ? detail : JSON.stringify(detail).slice(0, 900)}`}`); if (!cond) failed++; };
const BIN = fileURLToPath(new URL("./bin.ts", import.meta.url));

// ---- 1. Specs from Naive's data ----
const ids = functionIds();
ok("every function derives a researcher spec, role <function>-researcher", ids.length === 13 && ids.every((id) => functionResearcher(id).role === `${id}-researcher`));
const strategy = functionResearcher("strategy");
ok("strategy's researcher works competitors/[id]/signals and writes only its recipe route", JSON.stringify(strategy.patterns) === '["competitors/[id]/signals"]' && JSON.stringify(strategy.writes) === '["recipes/competitors/[id]/signals"]', strategy);
ok("a function with no projected pattern gets none", functionResearcher("products").patterns.length === 0 && functionResearcher("products").writes.length === 0);
ok("the research skill is Naive's, mounted from the installed package", existsSync(join(strategy.skill, "SKILL.md")) && strategy.program === "operations/research-program/strategy");
ok("an unknown function is an error naming the valid ones", (() => { try { functionResearcher("sales"); return false; } catch (e) { return /strategy/.test(String(e)); } })());
const PROGRAM = "# Research program: Strategy\n\n## What to research\n\nRaises before they are reported.\n\n## Patterns\n\n### competitors/[id]/signals\n\nForecast raises only from well-rated producers.\nNever drop a confirmed round.\n\n### market/rounds\n\nNot projected yet.\n";
ok("programPatterns reads the Patterns section's headings", JSON.stringify(programPatterns(PROGRAM)) === '["competitors/[id]/signals","market/rounds"]');
ok("programSection is one pattern's notes", programSection(PROGRAM, "competitors/[id]/signals").includes("Never drop a confirmed round.") && !programSection(PROGRAM, "competitors/[id]/signals").includes("Not projected"));
ok("cutOf: the earliest plan cut, narrowed by an earlier given cut, never widened", (() => {
  const a = cutOf(["2025-06-01T00:00:00Z", "2025-03-01T00:00:00Z"]), b = cutOf(["2025-03-01T00:00:00Z"], "2025-01-01T00:00:00Z"), c = cutOf(["2025-03-01T00:00:00Z"], "2026-01-01T00:00:00Z"), d = cutOf(["2025-03-01T00:00:00Z"], "soon");
  return "iso" in a && a.iso === "2025-03-01T00:00:00.000Z" && "iso" in b && b.iso === "2025-01-01T00:00:00.000Z" && "iso" in c && c.iso === "2025-03-01T00:00:00.000Z" && "error" in d;
})());

// ---- A venture with signals, a person's live recipe, a plan of two dev evaluations, and the researcher staffed ----
const DAY = 86_400_000;
const iso = (ms: number) => new Date(ms).toISOString().replace(/\.\d+Z$/, "Z");
const ws = mkdtempSync(join(tmpdir(), "mentura-research-"));
const dir = join(ws, "lab");
const PATTERN = "competitors/[id]/signals", FILE = `/${PATTERN}.recipe.ts`;
const ROUNDS: Record<string, [string, string][]> = {
  "alpha-robotics": [["seed", "2024-02-05"], ["series-a", "2024-11-11"], ["series-b", "2025-09-01"]],
  "beta-labs": [["seed", "2024-03-18"], ["series-a", "2025-02-10"]],
  "gamma-ai": [["seed", "2024-01-22"], ["series-a", "2024-08-19"], ["series-b", "2025-05-05"]],
  "delta-works": [["seed", "2024-04-15"], ["series-a", "2025-07-14"]],
};
const signal = (subject: string, producer: string, series: string, time: string, lag: number, rating: [string, number] = ["B", 2]) => {
  const body = { type: "competitor-funding@1.0", producer, subject, time, observed: iso(Date.parse(`${time}T00:00:00Z`) + lag * DAY),
    props: { org: { name: subject }, round: { series, amount: 1000000, currency: "USD" } }, rating: { reliability: rating[0], credibility: rating[1] }, cites: [] };
  return { ...body, id: signalId(body) };
};
const put = (root: string, s: ReturnType<typeof signal>) => {
  const f = join(dir, root, "signals/competitor-funding", s.subject, `${s.time}-${s.id}.json`);
  mkdirSync(dirname(f), { recursive: true });
  writeFileSync(f, JSON.stringify(s, null, 2) + "\n");
};
const example = readFileSync(naivePath("packages/naive/src/records/examples/signals/competitors/[id]/signals.recipe.ts"), "utf8");
const tuned = example.replace("raise_base: 0.05, raise_per_month: 0.02", "raise_base: 0.05, raise_per_month: 0.06");
const RUN_KEYS = ["NAIVE_TRACES", "MENTURA_TRACE_ID", "MENTURA_SPAN_ID", "MENTURA_SESSION", "MENTURA_ACTOR", "MENTURA_ACTOR_ID", "MENTURA_MODEL", "MENTURA_HARNESS", "MENTURA_READS_AS_OF", "LANGSMITH_TRACING", "LANGCHAIN_TRACING_V2"];
for (const k of RUN_KEYS) delete process.env[k];
process.env.MENTURA_WORKSPACE = ws;
const lines = () => { const f = join(dir, `${PATTERN}.experiments.jsonl`); return existsSync(f) ? readFileSync(f, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l) as { verdict: string, actor?: { id?: string }, candidate: string }) : []; };

try {
  mkdirSync(join(dir, "knowledge"), { recursive: true });
  writeFileSync(join(dir, "venture.json"), JSON.stringify({ id: "lab", name: "Lab", parent: null, phase: "discovery", owner: "self", status: "active", departments: ["strategy"],
    layers: { purpose: false, knowledge: { location: "knowledge/" }, operations: false, evidence: false } }) + "\n");
  // No "traces": true on purpose: a researcher run is traced anyway.
  writeFileSync(join(dir, "naive.config.json"), JSON.stringify({}) + "\n");
  writeFileSync(join(dir, "knowledge/sources.json"), JSON.stringify({ sources: [
    { id: "lib-a", connector: "filesystem", root: "libs/a", writes: "none", carries: "signals" },
    { id: "lib-b", connector: "filesystem", root: "libs/b", writes: "none", carries: "signals" },
  ], records: {} }, null, 2));
  for (const [subject, rounds] of Object.entries(ROUNDS)) {
    for (const [series, time] of rounds) { put("libs/a", signal(subject, "lib-a/research", series, time, 2)); put("libs/b", signal(subject, "lib-b/news", series, time, 20)); }
    put("libs/a", signal(subject, "lib-a/research", "seed", iso(Date.parse(`${rounds[0][1]}T00:00:00Z`) - 10 * DAY).slice(0, 10), 15, ["D", 4]));
  }
  put("libs/a", signal("beta-labs", "lib-a/research", "series-b", "2025-08-04", 2));
  mkdirSync(join(dir, "competitors/[id]"), { recursive: true });
  writeFileSync(join(dir, `${PATTERN}.recipe.ts`), example);
  record(dir, { entity: `${PATTERN}.recipe.ts`, activity: "create", agent: { kind: "person", via: "cli", id: "founder" } });
  const made = await planRecipe(dir, PATTERN, { by: "founder", made: "2026-06-01T00:00:00Z", budgets: { dev_evaluations: 2, holdout_checks: 1 } });
  if (!made.ok) throw new Error(`no plan: ${made.errors.join("; ")}`);
  const plan = made.plan;
  mkdirSync(join(dir, "operations"), { recursive: true });
  writeFileSync(join(dir, "operations/team-plan.json"), JSON.stringify({ venture: "lab", roles: [{ id: "founder", occupant: "person", needed_by: "discovery", status: "filled" }, researcherTeamPlanEntry(strategy, "discovery")] }, null, 2));

  // ---- 2. Refusals before any model: no program yet, then the program a person writes ----
  const SESSION = "harness-9", TRACE = randomUUID(), PARENT = randomUUID();
  const caller = { session: SESSION, trace_id: TRACE, parent_span_id: PARENT };
  const noModel: ModelSource = { name: "fake:none", load: async () => { throw new Error("the model was loaded"); } };
  const before = await runResearcher(strategy, { venture: "lab", model: noModel, trace: caller });
  ok("a run with no research program is refused, naming how a person writes one", before.status === "refused" && /no research program/.test(before.reason) && /--as person/.test(before.fix ?? ""), before);
  const wrote = await call({ venture: "lab", route: "operations/research-program/strategy", action: "write", input: { text: PROGRAM }, actor: "person", via: "cli" }) as { ok: boolean };
  if (!wrote.ok) throw new Error(`no program: ${JSON.stringify(wrote)}`);

  // ---- 3. Run 1, limited to one experiment: a keep, held as a draft ----
  const step = (name: string, args: Record<string, unknown>, id: string) => new AIMessage({ content: "", tool_calls: [{ name, args, id, type: "tool_call" }] });
  const model = fakeModel()
    .respond(step("read_file", { file_path: FILE }, "c1"))
    .respond(step("write_file", { file_path: "/decisions/raise.json", content: "{}" }, "c2"))
    .respond(step("edit_file", { file_path: FILE, old_string: "raise_per_month: 0.02", new_string: "raise_per_month: 0.06" }, "c3"))
    .respond(new AIMessage("Raised the monthly raise rate, since rounds come faster than the recipe assumed."))
    .respond(step("read_file", { file_path: FILE }, "c4"))
    .respond(step("edit_file", { file_path: FILE, old_string: "raise_per_month: 0.06", new_string: "raise_per_month: 0.02" }, "c5"))
    .respond(new AIMessage("Tried the old rate again."))
    .respond(new AIMessage("This turn must never be asked for."));
  const scripted: ModelSource = { name: "fake:scripted", load: async () => model };
  const calls = () => (model as unknown as { calls: { messages: { content: unknown, getType: () => string }[] }[] }).calls;
  const textOf = (c: unknown): string => typeof c === "string" ? c : Array.isArray(c) ? c.map((b: { text?: string }) => b.text ?? JSON.stringify(b)).join("\n") : JSON.stringify(c);
  const RUN1 = runIdOf(randomUUID());
  const later = "2030-01-01T00:00:00Z";
  const r1 = await runResearcher(strategy, { venture: "lab", model: scripted, trace: caller, runId: RUN1, harness: "claude-code", maxExperiments: 1, readsAsOf: later });
  const p1 = r1.status === "done" ? r1.patterns.find((p) => p.pattern === PATTERN) : undefined;
  ok("run 1 is done and reads as of the plan's cut, not the later cut it was given", r1.status === "done" && Date.parse(r1.reads_as_of) === Date.parse(plan.read_cut), r1);
  ok("run 1 kept one experiment and stopped at the run's limit", p1?.stop === "limit" && p1.experiments.length === 1 && p1.experiments[0].verdict === "keep" && p1.experiments[0].kept_as === "better" && p1.budget?.spent === 1 && p1.budget.of === 2, p1);
  ok("a pattern the program lists that the researcher does not work is skipped with the reason", r1.status === "done" && r1.patterns.some((p) => p.pattern === "market/rounds" && p.stop === "skipped" && /does not work/.test(p.why)), r1);
  const draft = join(dir, "_drafts", `${PATTERN.replace(/\//g, "__")}.recipe.ts.draft`);
  ok("the keep is a held draft that is the new tip; the live recipe is unchanged", existsSync(draft) && readFileSync(draft, "utf8") === tuned && readFileSync(join(dir, `${PATTERN}.recipe.ts`), "utf8") === example);
  ok("the held draft comes back with its accept command", r1.status === "done" && r1.held.length === 1 && r1.held[0].accept === `mentura accept recipes/${PATTERN} --venture lab`, r1.status === "done" ? r1.held : r1);
  const first = calls()[0]?.messages ?? [];
  const system = textOf(first[0]?.content);
  ok("the system prompt names the role, the pattern, the cut and the program's notes for it", system.includes("strategy-researcher") && system.includes(FILE) && system.includes(new Date(Date.parse(plan.read_cut)).toISOString()) && system.includes("Never drop a confirmed round."), system.slice(0, 1200));
  ok("the research skill's description reaches the system prompt (the skills middleware read the mounted /research/ folder)", system.includes("Naive's one generic research skill"), system.slice(-1500));
  const tools1 = (calls()[3]?.messages ?? []).filter((m) => m.getType() === "tool").map((m) => textOf(m.content));
  ok("reading the recipe file gives the tip's source", (tools1[0] ?? "").includes("raise_per_month: 0.02"), tools1[0]?.slice(0, 300));
  ok("any write other than the recipe is refused before Naive sees it", /writes only/.test(tools1[1] ?? "") && !existsSync(join(dir, "decisions/raise.decision.json")), tools1[1]);
  ok("the keep's tool result says it is held for a person", /Held for a person/.test(tools1[2] ?? ""), tools1[2]);
  ok("the process environment is restored after the run, the cut included", RUN_KEYS.every((k) => process.env[k] === undefined) && process.env.MENTURA_WORKSPACE === ws);

  // ---- 4. Run 2, with the default limit: a discard, then a stop at the plan's budget ----
  const RUN2 = runIdOf(randomUUID());
  const r2 = await runResearcher(strategy, { venture: "lab", model: scripted, trace: caller, runId: RUN2 });
  const p2 = r2.status === "done" ? r2.patterns.find((p) => p.pattern === PATTERN) : undefined;
  ok("run 2 discarded its experiment and stopped at the plan's budget", p2?.stop === "budget" && p2.experiments.length === 1 && p2.experiments[0].verdict === "discard" && p2.budget?.spent === 2 && /spent its 2 dev evaluations/.test(p2.why), p2);
  ok("the turn after the budget is never asked for (seven model calls in all)", calls().length === 7, calls().length);
  ok("the discard leaves the draft as the tip", readFileSync(draft, "utf8") === tuned);
  const all = lines();
  ok("both experiments were logged by Naive's evaluator as the researcher's, through recipes/<pattern>", all.length === 2 && all.every((l) => l.actor?.id === "strategy-researcher") && entries(dir).some((e: { entity: string, agent?: { id?: string } }) => e.entity === `${PATTERN}.experiments.jsonl` && e.agent?.id === "evaluator"), all);

  // ---- 5. No budget left: no model, and the cut a caller narrows ----
  const earlier = "2024-06-01T00:00:00Z";
  const r3 = await runResearcher(strategy, { venture: "lab", model: noModel, trace: caller, readsAsOf: earlier });
  ok("a run with no budget left loads no model, and an earlier cut is kept", r3.status === "done" && r3.patterns.find((p) => p.pattern === PATTERN)?.stop === "budget" && Date.parse(r3.reads_as_of) === Date.parse(earlier), r3);
  const again = await runResearcher(strategy, { venture: "lab", model: noModel, trace: caller, runId: RUN2 });
  ok("a retry with run 2's id is already-ran", again.status === "already-ran", again);

  // ---- 6. Traces: the runs nest under the caller's span, provenance shares the trace, check-traces passes ----
  const draftLine = (entries(dir) as { activity: string, agent?: Record<string, string>, span?: { trace_id: string } }[]).find((e) => e.activity === "draft");
  ok("the keep's provenance line names the run's session, role, model and harness, in the caller's trace", draftLine?.span?.trace_id === TRACE && draftLine.agent?.session === SESSION && draftLine.agent?.id === "strategy-researcher" && draftLine.agent?.model === "fake:scripted" && draftLine.agent?.harness === "claude-code", draftLine);
  span(dir, { name: "invoke_agent harness", kind: "agent", trace_id: TRACE, span_id: PARENT, parent_span_id: null, session: SESSION }, { force: true });
  const check = spawnSync("node", [...naiveTs, naivePath("packages/naive/src/checks/check-traces.ts"), dir], { encoding: "utf8" });
  ok("check-traces passes with no warnings", check.status === 0 && !/warning:/.test(check.stdout + check.stderr), check.stdout + check.stderr);

  // ---- 7. The CLI: a venture's folder, an unstaffed researcher, a bad limit ----
  const env = { ...process.env, MENTURA_WORKSPACE: "", MENTURA_MODEL: "fake:none" };
  const unstaffed = spawnSync("node", [BIN, "research", "products", "--venture", dir], { encoding: "utf8", env });
  const ur = JSON.parse(unstaffed.stdout || "{}") as ResearchResult;
  ok("research by folder finds the venture, and an unstaffed researcher is refused (exit 2) with its entry", unstaffed.status === 2 && ur.status === "refused" && /products-researcher is not in lab's team plan/.test(ur.reason) && /"id":\s*"products-researcher"/.test(ur.fix ?? ""), unstaffed.stdout + unstaffed.stderr);
  const spent = spawnSync("node", [BIN, "research", "strategy", "--venture", dir], { encoding: "utf8", env });
  const sr = JSON.parse(spent.stdout || "{}") as ResearchResult;
  ok("through the CLI, a researcher with no budget left is done (exit 0) without a model", spent.status === 0 && sr.status === "done" && sr.patterns.some((p) => p.stop === "budget"), spent.stdout + spent.stderr);
  const bad = spawnSync("node", [BIN, "research", "strategy", "--venture", dir, "--max-experiments", "0"], { encoding: "utf8", env });
  ok("a --max-experiments below 1 is a usage refusal (exit 2)", bad.status === 2 && /max-experiments/.test(bad.stdout), bad.stdout + bad.stderr);
} finally {
  rmSync(ws, { recursive: true, force: true });
}

if (failed) { console.error(`${failed} failed`); process.exit(1); }
console.log("researcher: all passing");
