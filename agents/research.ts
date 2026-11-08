// One researcher run (autoresearch build plan item 13; everything-ecosystem docs/design/AUTORESEARCH_RECORDS_2026-11-06.md,
// "program.md per function" and "Framework versus platform"): the unattended loop that Naive's research skill leaves to
// Mentura. For each pattern the function's research program lists, one deep agent (the pattern's subagent) proposes one
// change to /<pattern>.recipe.ts per turn. Every write goes through Naive's recipes/<pattern> route, which scores it
// inside the write against the frozen eval plan; Mentura never computes, supplies or reads back a score of its own.
//
//   const result = await runResearcher(functionResearcher("strategy"), {
//     venture: "kettle", model: modelSource(process.env.MENTURA_MODEL), trace: {},
//   });
//   result.status === "done" && result.patterns   // [{ pattern, stop: "budget", experiments: [{ verdict: "keep" }, ...] }]
//
// The limits, checked before every turn:
//   budget   the plan's dev evaluations left, read from recipes/<pattern> (spent is counted by Naive from the log). Naive
//            refuses a write once they are spent, so the plan's budget holds even if this loop were wrong.
//   limit    experiments this run may write per pattern: maxExperiments, by default the dev evaluations the plan has
//            left when the run starts. A failed experiment uses the run's count but not the plan's budget.
//   stopped  a turn that writes no experiment: the researcher had nothing worth trying.
//   steps    each turn is bounded by MAX_STEPS graph steps, like a function agent run.
//
// The read cut: every read is as of the earliest read_cut among the plans of the patterns worked, or the caller's
// reads_as_of (MENTURA_READS_AS_OF) when that is earlier. It is never later than a plan's read_cut. It is set both in
// the backend's context and in the process environment, so every Naive reader in the run is clamped.

import { existsSync, readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import type { BaseLanguageModel } from "@langchain/core/language_models/base";
import { HumanMessage } from "@langchain/core/messages";
import type { EditResult, WriteResult } from "deepagents";
import { CompositeBackend, createDeepAgent, FilesystemBackend } from "deepagents";
import { span, spans } from "naive-framework/src/core/instrumentation.mjs";
import { ventureFile } from "naive-framework/src/core/venture-paths.mjs";
import { may, roleOf } from "naive-framework/src/engine/access.mjs";
import { loadPlan } from "naive-framework/src/engine/recipes/eval-set.ts";
import { call, ventureDir } from "naive-framework/src/router/router.mjs";
import type { Context } from "naive-framework/src/router/agent-files.ts";
import type { EvalPlan, Experiment } from "naive-framework/src/records/types/records.d.ts";
import type { HeldDraft, ModelSource, RunId, RunRef, TeamPlanEntryRead, TraceJoin } from "./function-agent.ts";
import { lockVenture, messageOf, MODEL_FIX, outcomeOf, ownProcess, phaseOf, withRunEnv } from "./function-agent.ts";
import type { FunctionResearcherSpec } from "./function-spec.ts";
import { programPatterns, programSection, reachesTeamPlan, researcherTeamPlanEntry } from "./function-spec.ts";
import { NaiveBackend } from "./naive-backend.ts";
import { NaiveTracer } from "./naive-tracer.ts";

export interface ResearchContext {
  venture: string,
  /** The folder that holds the ventures. Defaults to Naive's own resolution (MENTURA_WORKSPACE). */
  workspace?: string,
  model: ModelSource,
  trace: TraceJoin,
  /** The caller's idempotency key. Generated when absent. */
  runId?: RunId,
  harness?: string,
  /** The caller's cut (MENTURA_READS_AS_OF), an ISO 8601 time. Used only when it is earlier than the plans' cut. */
  readsAsOf?: string,
  /** Experiments this run may write per pattern. Defaults to the dev evaluations the plan has left. */
  maxExperiments?: number,
  signal?: AbortSignal,
}

/** One experiment the run wrote, as the evaluator logged it in <pattern>.experiments.jsonl. */
export interface ExperimentRef {
  id: string,
  verdict: "keep" | "discard" | "fail",
  kept_as?: "better" | "smaller",
  candidate: string,
  base: string | null,
  dev?: { score: number, tip_score: number | null, margin: number },
  reason?: string,
}

/** Why a pattern's loop ended. skipped: it never started (the reason says why). */
export type Stop = "budget" | "limit" | "stopped" | "failed" | "cancelled" | "skipped";

/** What happened to one pattern the program lists. */
export interface PatternRun {
  pattern: string,
  stop: Stop,
  why: string,
  /** The plan in force, its sha, or null when there is none. */
  plan: string | null,
  /** Dev evaluations spent under the plan and its budget, as Naive counted them when the loop ended. */
  budget: { spent: number, of: number } | null,
  experiments: ExperimentRef[],
}

export type ResearchResult =
  | { status: "done", run: RunRef, reads_as_of: string, patterns: PatternRun[], held: HeldDraft[] }
  | { status: "already-ran", run: RunRef, held: HeldDraft[] }
  | { status: "failed", run: RunRef, reads_as_of: string, error: string, patterns: PatternRun[], held: HeldDraft[] }
  | { status: "cancelled", run: RunRef, reads_as_of: string, patterns: PatternRun[], held: HeldDraft[] }
  | { status: "busy", venture: string, holder: number | null }
  | { status: "refused", reason: string, fix?: string };

/** Steps the graph may take in one turn before LangGraph stops it. */
const MAX_STEPS = 60;

/**
 * Runs one function's researcher on one venture. Order, so a run fails as early and as cheaply as possible: claim the
 * process; find the venture; check the team-plan role; read the program (live, the person's instructions now); pick the
 * patterns it lists that this researcher works, the team plan lets it write and that have a plan; compute the cut;
 * lock the venture; answer already-ran when the run id is a span in the session; read each pattern's budget; load
 * the model only when some pattern has budget left; then run each pattern's loop under the run's environment.
 */
export async function runResearcher(spec: FunctionResearcherSpec, ctx: ResearchContext): Promise<ResearchResult> {
  return await ownProcess(async () => {
    const dir = ventureDir(ctx.venture, ctx.workspace) as string | null;
    if (!dir) return { status: "refused", reason: `no venture ${ctx.venture} in ${ctx.workspace ?? process.env.MENTURA_WORKSPACE ?? process.cwd()}`, fix: "Set MENTURA_WORKSPACE to the folder that holds the ventures, or pass the venture's folder." };
    const role = roleOf(dir, spec.role) as TeamPlanEntryRead | null;
    const entry = JSON.stringify(researcherTeamPlanEntry(spec, phaseOf(dir)));
    if (!role) return { status: "refused", reason: `${spec.role} is not in ${ctx.venture}'s team plan`, fix: entry };
    if (role.occupant !== "agent") return { status: "refused", reason: `${spec.role} is a person's role in ${ctx.venture}'s team plan` };
    if (!role.routes) return { status: "refused", reason: `${spec.role} lists no routes, so it could reach every route: a researcher never runs that way`, fix: entry };
    const writes = role.routes.write ?? [];
    if (reachesTeamPlan(writes)) return { status: "refused", reason: `${spec.role} could write the team plan, and so widen its own reach`, fix: entry };
    const stray = writes.filter((g) => !g.startsWith("recipes/"));
    if (stray.length) return { status: "refused", reason: `${spec.role} may write ${stray.join(", ")}: a researcher writes only recipes/<pattern>`, fix: entry };

    const program = await call({ venture: ctx.venture, workspace: ctx.workspace, route: spec.program, action: "read", actor: "agent", actor_id: spec.role }) as { ok: boolean, result?: unknown, error?: string };
    if (!program.ok) return { status: "refused", reason: `cannot read ${spec.program}: ${program.error ?? "no reason given"}` };
    const text = typeof program.result === "string" ? program.result : (program.result as { text?: string } | null)?.text ?? "";
    if (!text.trim()) return { status: "refused", reason: `${ctx.venture} has no research program for ${spec.function}`, fix: `A person writes programs/${spec.function}.md: mentura ${spec.program} write --venture ${ctx.venture} --as person --input <file.json>, starting from mentura ${spec.program} template.` };

    const skipped: PatternRun[] = [];
    const work: { pattern: string, plan: EvalPlan }[] = [];
    const skip = (pattern: string, why: string, plan: string | null = null) => skipped.push({ pattern, stop: "skipped", why, plan, budget: null, experiments: [] });
    for (const pattern of programPatterns(text)) {
      if (!spec.patterns.includes(pattern)) { skip(pattern, `${spec.role} does not work ${pattern}: its patterns are ${spec.patterns.join(", ") || "none"}`); continue; }
      if (!may(dir, spec.role, "write", `recipes/${pattern}`)) { skip(pattern, `the team plan does not let ${spec.role} write recipes/${pattern}`); continue; }
      const plan = loadPlan(dir, pattern) as EvalPlan | null;
      if (!plan) { skip(pattern, `no eval plan at ${pattern}.plan.json: a person makes one with naive recipes plan ${pattern} --by <person>`); continue; }
      work.push({ pattern, plan });
    }
    if (!work.length && !skipped.length) return { status: "refused", reason: `${spec.program} lists no pattern under Patterns, so there is nothing to research` };

    const cut = cutOf(work.map((w) => w.plan.read_cut), ctx.readsAsOf);
    if ("error" in cut) return { status: "refused", reason: cut.error };
    const id = ctx.runId ?? (randomUUID() as RunId);
    const trace_id = ctx.trace.trace_id ?? id;
    const run: RunRef = { id, function: spec.function, role: spec.role, venture: ctx.venture, session: ctx.trace.session ?? trace_id, trace_id, parent_span_id: ctx.trace.parent_span_id ?? null };

    const lock = lockVenture(dir);
    if ("busy" in lock) return { status: "busy", venture: ctx.venture, holder: lock.busy };
    try {
      if ((spans(dir, run.session) as { span_id: string }[]).some((s) => s.span_id === run.id)) return { status: "already-ran", run, held: outcomeOf(dir, run).held };
      const nctx: Context = { venture: ctx.venture, workspace: ctx.workspace, actor_id: spec.role, reads_as_of: cut.iso };
      const budgets = new Map<string, { spent: number, of: number }>();
      for (const w of work) {
        const b = await budgetOf(nctx, w.pattern);
        if ("error" in b) return { status: "refused", reason: b.error };
        budgets.set(w.pattern, b);
      }
      if (!work.some((w) => left(budgets.get(w.pattern)) > 0)) {
        const spent = work.map((w): PatternRun => ({ pattern: w.pattern, stop: "budget", why: budgetWhy(w.plan), plan: w.plan.sha, budget: budgets.get(w.pattern) ?? null, experiments: [] }));
        return { status: "done", run, reads_as_of: cut.iso, patterns: [...spent, ...skipped], held: outcomeOf(dir, run).held };
      }
      let model: BaseLanguageModel;
      try { model = await ctx.model.load(); }
      catch (e) { return { status: "refused", reason: messageOf(e), fix: MODEL_FIX }; }
      const done: PatternRun[] = [];
      let error: string | null = null;
      const start = new Date().toISOString();
      await withRunEnv(run, ctx, async () => {
        // Each turn's agent span hangs from the run's root span, written below once the run ends.
        process.env.MENTURA_SPAN_ID = run.id;
        try {
          for (const w of work) {
            if (ctx.signal?.aborted) { done.push({ pattern: w.pattern, stop: "cancelled", why: "the run was cancelled", plan: w.plan.sha, budget: budgets.get(w.pattern) ?? null, experiments: [] }); continue; }
            const r = await researchPattern(dir, spec, w.pattern, w.plan, text, cut.iso, nctx, model, run, ctx);
            done.push(r);
            if (r.stop === "failed" && !error) error = r.why;
          }
        } finally {
          span(dir, { name: `invoke_agent ${spec.role}`, kind: "agent", trace_id: run.trace_id, span_id: run.id, parent_span_id: run.parent_span_id, session: run.session, start, end: new Date().toISOString(),
            status: error || ctx.signal?.aborted ? "error" : "ok", ...(error ? { error } : ctx.signal?.aborted ? { error: "cancelled" } : {}),
            attributes: { "gen_ai.operation.name": "invoke_agent", "gen_ai.agent.name": spec.role, "naive.reads_as_of": cut.iso, "naive.patterns": work.map((w) => w.pattern).join(" ") } }, { force: true });
        }
      }, { MENTURA_READS_AS_OF: cut.iso });
      const patterns = [...done, ...skipped];
      const held = outcomeOf(dir, run).held;
      if (ctx.signal?.aborted) return { status: "cancelled", run, reads_as_of: cut.iso, patterns, held };
      if (error) return { status: "failed", run, reads_as_of: cut.iso, error, patterns, held };
      return { status: "done", run, reads_as_of: cut.iso, patterns, held };
    }
    finally { lock.release(); }
  });
}

/**
 * The cut a run reads as of: the earliest of the plans' read cuts, or the caller's when that is earlier. Never later
 * than a plan's read cut, so a caller can narrow what the researcher sees but never widen it. Pure.
 */
export function cutOf(planCuts: readonly string[], given?: string): { iso: string } | { error: string } {
  const times = planCuts.map((c) => Date.parse(c)).filter(Number.isFinite);
  let ms = times.length ? Math.min(...times) : Number.POSITIVE_INFINITY;
  if (given) {
    const g = Date.parse(given);
    if (!Number.isFinite(g)) return { error: `MENTURA_READS_AS_OF is ${given}, not an ISO 8601 time` };
    ms = Math.min(ms, g);
  }
  // With no plan to work and no cut given, the run reads as of now; it reads nothing, since nothing is worked.
  return { iso: new Date(Number.isFinite(ms) ? ms : Date.now()).toISOString() };
}

// ---- internals ----

const left = (b: { spent: number, of: number } | undefined): number => b ? Math.max(0, b.of - b.spent) : 0;
const budgetWhy = (plan: EvalPlan): string => `the plan ${plan.sha.slice(0, 12)} has spent its ${plan.budgets.dev_evaluations} dev evaluations: a person makes the next plan with naive recipes plan ${plan.pattern} --by <person>`;

/** The plan's dev budget as Naive counts it, read from recipes/<pattern> as the researcher, as of the cut. */
async function budgetOf(nctx: Context, pattern: string): Promise<{ spent: number, of: number } | { error: string }> {
  const r = await call({ venture: nctx.venture, workspace: nctx.workspace, route: `recipes/${pattern}`, action: "read", actor: "agent", actor_id: nctx.actor_id, reads_as_of: nctx.reads_as_of }) as { ok: boolean, result?: { spent?: { dev_evaluations: number, of: number } | null }, error?: string };
  if (!r.ok) return { error: `cannot read recipes/${pattern}: ${r.error ?? "no reason given"}. The installed Naive needs its recipe route (autoresearch build plan item 6).` };
  const s = r.result?.spent;
  return s ? { spent: s.dev_evaluations, of: s.of } : { error: `recipes/${pattern} names no plan, so it has no budget` };
}

/** The experiment log's lines, oldest first. The run reads it only to report what Naive's evaluator logged. */
function logLines(dir: string, pattern: string): Experiment[] {
  const f = ventureFile(dir, `${pattern}.experiments.jsonl`) as string;
  return existsSync(f) ? readFileSync(f, "utf8").split("\n").filter((l) => l.trim()).map((l) => JSON.parse(l) as Experiment) : [];
}

const refOf = (l: Experiment): ExperimentRef => ({
  id: l.id, verdict: l.verdict ?? "fail", ...(l.kept_as ? { kept_as: l.kept_as } : {}), candidate: l.candidate, base: l.base ?? null,
  ...(l.dev ? { dev: { score: l.dev.score, tip_score: l.dev.tip_score, margin: l.dev.margin } } : {}), ...(l.reason ? { reason: l.reason } : {}),
});

/**
 * A NaiveBackend that writes one file: /<pattern>.recipe.ts, which Naive's agent files send to recipes/<pattern> with
 * its base, and at most cap times in the run. Every other write and edit is refused here, before Naive sees it.
 */
class RecipeBackend extends NaiveBackend {
  file: string;
  cap: number;
  count = 0;

  constructor(ctx: Context, tracer: NaiveTracer, pattern: string, cap: number) {
    super(ctx, tracer);
    this.file = `/${pattern}.recipe.ts`;
    this.cap = cap;
  }

  refusal(path: string): string | null {
    if (`/${path.replace(/^\/+/, "")}` !== this.file) return `A researcher writes only ${this.file}, through recipes/<pattern>. ${path} was not written.`;
    if (this.count >= this.cap) return `This run's limit of ${this.cap} experiments on ${this.file} is reached: write nothing more and answer.`;
    return null;
  }

  override async write(filePath: string, content: string): Promise<WriteResult> {
    const no = this.refusal(filePath);
    if (no) return { error: no };
    this.count++;
    return await super.write(filePath, content);
  }

  override async edit(filePath: string, oldString: string, newString: string, replaceAll = false): Promise<EditResult> {
    const no = this.refusal(filePath);
    if (no) return { error: no };
    this.count++;
    return await super.edit(filePath, oldString, newString, replaceAll);
  }
}

/** How a researcher works, the same for every function and pattern. */
const RULES = [
  "Read /research/SKILL.md first: it is Naive's research loop and its rules. It is read-only.",
  "Each turn, make one change to the recipe with edit_file (or write_file for the whole file). Naive scores it inside the write against the frozen eval plan. A keep is held as a draft for a person and becomes the tip you edit next. A discard or a fail is refused with its verdict and reason. Never repeat a discarded change.",
  "You write nothing else: every other write is refused. You never see dev or holdout outcomes, and you never accept your own work.",
  "When nothing is worth trying, answer without writing, and the run stops.",
  "End each turn with one sentence: what you changed and why.",
];

/** The system prompt for one pattern's subagent. Pure. */
function promptOf(spec: FunctionResearcherSpec, venture: string, pattern: string, plan: EvalPlan, section: string, cut: string): string {
  return [
    `You are the ${spec.label} researcher of the venture ${venture}, acting in the team-plan role ${spec.role}.`,
    `You improve one recipe, /${pattern}.recipe.ts: the pure TypeScript module that makes every record at ${pattern}.`,
    `You read the venture only as of ${cut}. Every read is clamped there, and nothing under _eval/ is yours.`,
    `The eval plan ${plan.sha.slice(0, 12)}: horizon ${plan.horizon}, weights ${plan.weights}, min_gain ${plan.min_gain}, ${plan.budgets.dev_evaluations} dev evaluations.`,
    "",
    "What the person's research program says for this pattern:",
    section || `(the program lists ${pattern} with no notes)`,
    "",
    ...RULES.map((r) => `- ${r}`),
  ].join("\n");
}

/** One turn's task: the budget left and what this run's experiments on the pattern did so far. Pure. */
function taskOf(pattern: string, budget: { spent: number, of: number }, made: readonly ExperimentRef[]): string {
  const history = made.length
    ? made.map((e, i) => `${i + 1}. ${e.verdict}${e.kept_as ? ` (${e.kept_as})` : ""}${e.dev ? `, dev ${e.dev.score} against the tip's ${e.dev.tip_score ?? "none"} (margin ${e.dev.margin})` : ""}${e.reason ? `: ${e.reason}` : ""}`).join("\n")
    : "none yet";
  return [`Run one experiment on /${pattern}.recipe.ts.`, `Dev evaluations left under the plan: ${left(budget)} of ${budget.of}.`, `This run's experiments so far:\n${history}`].join("\n");
}

/** One pattern's loop: one turn per experiment until the budget, the run's limit, a turn with no experiment, or an error. */
async function researchPattern(dir: string, spec: FunctionResearcherSpec, pattern: string, plan: EvalPlan, program: string, cut: string, nctx: Context, model: BaseLanguageModel, run: RunRef, ctx: ResearchContext): Promise<PatternRun> {
  const tracer = new NaiveTracer(dir, { session: run.session, trace_id: run.trace_id, agents: [spec.role] });
  const first = await budgetOf(nctx, pattern);
  if ("error" in first) return { pattern, stop: "failed", why: first.error, plan: plan.sha, budget: null, experiments: [] };
  let budget = first;
  const cap = ctx.maxExperiments ?? left(budget);
  const recipes = new RecipeBackend(nctx, tracer, pattern, cap);
  const backend = new CompositeBackend(recipes, { "/research/": new FilesystemBackend({ rootDir: spec.skill, virtualMode: true }) });
  const agent = createDeepAgent({ model, backend, name: spec.role, systemPrompt: promptOf(spec, nctx.venture, pattern, plan, programSection(program, pattern), cut), skills: ["/research/"],
    permissions: [{ operations: ["write"], paths: ["/research/**"], mode: "deny" }] });
  const made: ExperimentRef[] = [];
  const end = (stop: Stop, why: string): PatternRun => ({ pattern, stop, why, plan: plan.sha, budget, experiments: made });
  for (;;) {
    if (ctx.signal?.aborted) return end("cancelled", "the run was cancelled");
    if (left(budget) <= 0) return end("budget", budgetWhy(plan));
    if (recipes.count >= cap) return end("limit", `this run wrote its limit of ${cap} experiments on ${pattern}`);
    const before = logLines(dir, pattern).length;
    // deepagents 1.16's invoke type resolves the messages field to never under strict mode, so the input is cast.
    const input = { messages: [new HumanMessage(taskOf(pattern, budget, made))] } as unknown as Parameters<typeof agent.invoke>[0];
    try { await agent.invoke(input, { runId: randomUUID(), callbacks: [tracer], signal: ctx.signal, recursionLimit: MAX_STEPS }); }
    catch (e) {
      tracer.closeOpen(ctx.signal?.aborted ? "cancelled" : messageOf(e));
      made.push(...logLines(dir, pattern).slice(before).filter((l) => l.kind === "experiment" && l.actor?.id === spec.role).map(refOf));
      return ctx.signal?.aborted ? end("cancelled", "the run was cancelled") : end("failed", messageOf(e));
    }
    const fresh = logLines(dir, pattern).slice(before).filter((l) => l.kind === "experiment" && l.actor?.id === spec.role).map(refOf);
    made.push(...fresh);
    const next = await budgetOf(nctx, pattern);
    if ("error" in next) return end("failed", next.error);
    budget = next;
    if (!fresh.length) return end("stopped", "the researcher's turn wrote no experiment, so it had nothing more to try");
  }
}
