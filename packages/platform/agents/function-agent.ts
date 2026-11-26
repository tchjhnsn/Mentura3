// One function agent run (EE-123): a deepagents agent built from a FunctionAgentSpec, working the venture's records
// through Naive's router as the spec's team-plan role, traced into the caller's session, and answered with what it
// wrote and what waits for a person. Callers run it once per process through the CLI (platform/agents/cli.ts); the
// MCP shim and future filesystem triggers spawn that CLI. The process is the run: while a run is active the process
// environment is the run's, so Naive's env readers (provenance agentFromEnv, currentSpan, the tracer's root parent)
// all see one session, one trace, one role and one model.
//
//   const result = await runFunctionAgent(functionAgent("strategy"), "Tighten the pricing decision.", {
//     venture: "kettle", model: modelSource(process.env.MENTURA_MODEL),
//     trace: { session: "harness-7", trace_id: T, parent_span_id: P },
//   });
//   result.status === "done" && result.held   // [{ route: "decisions/pricing", draft, accept: "mentura accept decisions/pricing --venture kettle" }]

import { closeSync, constants, existsSync, mkdirSync, openSync, readFileSync, unlinkSync, writeSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { join } from "node:path";
import type { BaseLanguageModel } from "@langchain/core/language_models/base";
import { CompositeBackend, createDeepAgent, FilesystemBackend } from "deepagents";
import { invokeThread, openRunSaver } from "./checkpoint.ts";
import { spans } from "naive-framework/src/core/instrumentation.mjs";
import { entries, stealDeadLock } from "naive-framework/src/core/provenance.mjs";
import { ventureFile } from "naive-framework/src/core/venture-paths.mjs";
import { roleOf } from "naive-framework/src/engine/access.mjs";
import { ventureDir } from "naive-framework/src/router/router.mjs";
import type { FunctionAgentSpec, FunctionId, Phase } from "./function-spec.ts";
import { reachesTeamPlan, teamPlanEntry } from "./function-spec.ts";
import { NaiveBackend } from "./naive-backend.ts";
import { NaiveTracer } from "./naive-tracer.ts";

/** A run id: a UUID, used as the root span id, so a retry with the same id finds the run in the session's trace. */
export type RunId = string & { readonly __run: true };

/** Parses a caller's run id. Throws unless it is a UUID (LangChain run ids and LangSmith both expect one). */
export function runIdOf(s: string): RunId {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)) throw new Error(`a run id is a UUID, not ${s}`);
  return s.toLowerCase() as RunId;
}

/**
 * Where the run joins the caller's trace. Every field is optional: a run with no trace id starts its own trace, whose
 * id is the run id; a run with no session uses its trace id; a run with no parent span is a root. Read once, at the
 * boundary (the CLI reads MENTURA_SESSION, MENTURA_TRACE_ID and MENTURA_SPAN_ID).
 */
export interface TraceJoin { session?: string, trace_id?: string, parent_span_id?: string }

/**
 * The model, by name, loaded only when the run will call it. name is "provider:model" (anthropic:claude-opus-4-5) and
 * is what provenance records as agent.model. load() resolves a LangChain chat model whose provider package reads its
 * own key from its own environment variable; nothing in Mentura reads, logs or stores the key.
 */
export interface ModelSource { readonly name: string, load(): Promise<BaseLanguageModel> }

export interface RunContext {
  venture: string,
  /** The folder that holds the ventures. Defaults to Naive's own resolution (MENTURA_WORKSPACE). */
  workspace?: string,
  model: ModelSource,
  trace: TraceJoin,
  /** The caller's idempotency key. Generated when absent. */
  runId?: RunId,
  /** Who started the run, for provenance agent.harness (a harness such as Claude Code or Cursor, a trigger). */
  harness?: string,
  /** Aborts the run: open spans end with status error, the lock is released, the result is cancelled. */
  signal?: AbortSignal,
}

/** Which run this was and where its trace is. */
export interface RunRef {
  id: RunId,
  function: FunctionId,
  role: string,
  venture: string,
  session: string,
  trace_id: string,
  parent_span_id: string | null,
}

/** A record the run changed. */
export interface Written { route: string, entity: string }

/** A write the gate held for a person, with the command a person runs to accept it. */
export interface HeldDraft { route: string, draft: string, accept: string }

/**
 * What a run returns. wrote and held are derived after the run from provenance lines whose span descends from the
 * run's root span, never collected during it, so a retry (already-ran) reports exactly what the first run did.
 */
export type RunResult =
  | { status: "done", run: RunRef, answer: string, wrote: Written[], held: HeldDraft[] }
  | { status: "already-ran", run: RunRef, wrote: Written[], held: HeldDraft[] }
  | { status: "failed", run: RunRef, error: string, wrote: Written[], held: HeldDraft[] }
  | { status: "cancelled", run: RunRef, wrote: Written[], held: HeldDraft[] }
  | { status: "busy", venture: string, holder: number | null }
  | { status: "refused", reason: string, fix?: string };

/**
 * Runs one function agent on one task. One run at a time per process: a second call while one is active throws,
 * because the run owns the process environment while it runs. Across processes, one run at a time per venture: the
 * venture's provenance log and trace files are hash chains, a total order, so a second process gets busy.
 *
 * Order, so that a run fails as early and as cheaply as possible: claim the process; find the venture; check the
 * team-plan role; lock the venture; answer already-ran when the run id is a span in the session; load the model;
 * invoke under the run's env and derive the outcome.
 */
export async function runFunctionAgent(spec: FunctionAgentSpec, task: string, ctx: RunContext): Promise<RunResult> {
  return await ownProcess(async () => {
    const dir = ventureDir(ctx.venture, ctx.workspace) as string | null;
    if (!dir) return { status: "refused", reason: `no venture ${ctx.venture} in ${ctx.workspace ?? process.env.MENTURA_WORKSPACE ?? process.cwd()}`, fix: "Set MENTURA_WORKSPACE to the folder that holds the ventures, or pass the venture's id." };
    const role = roleOf(dir, spec.role) as TeamPlanEntryRead | null;
    const entry = JSON.stringify(teamPlanEntry(spec, phaseOf(dir)));
    if (!role) return { status: "refused", reason: `${spec.role} is not in ${ctx.venture}'s team plan`, fix: entry };
    if (role.occupant !== "agent") return { status: "refused", reason: `${spec.role} is a person's role in ${ctx.venture}'s team plan` };
    if (!role.routes) return { status: "refused", reason: `${spec.role} lists no routes, so it could reach every route: a function agent never runs that way`, fix: entry };
    if (reachesTeamPlan(role.routes.write ?? [])) return { status: "refused", reason: `${spec.role} could write the team plan, and so widen its own reach`, fix: entry };

    const id = ctx.runId ?? (randomUUID() as RunId);
    const trace_id = ctx.trace.trace_id ?? id;
    const run: RunRef = { id, function: spec.function, role: spec.role, venture: ctx.venture, session: ctx.trace.session ?? trace_id, trace_id, parent_span_id: ctx.trace.parent_span_id ?? null };

    const lock = lockVenture(dir);
    if ("busy" in lock) return { status: "busy", venture: ctx.venture, holder: lock.busy };
    try {
      if ((spans(dir, run.session) as { span_id: string }[]).some((s) => s.span_id === run.id)) return { status: "already-ran", run, ...outcomeOf(dir, run) };
      let model: BaseLanguageModel;
      try { model = await ctx.model.load(); }
      catch (e) { return { status: "refused", reason: messageOf(e), fix: MODEL_FIX }; }
      return await withRunEnv(run, ctx, () => invoke(dir, spec, task, run, role, model, ctx.workspace, ctx.signal));
    }
    finally { lock.release(); }
  });
}

// ---- shared with the researcher run (research.ts) ----

/** True while a run owns this process. */
let active = false;

/**
 * Runs fn as the one run this process has: a second call while one is active throws, because a run owns the process
 * environment while it runs. A function agent run and a researcher run share the claim.
 */
export async function ownProcess<T>(fn: () => Promise<T>): Promise<T> {
  if (active) throw new Error("a function agent run is already active in this process: start another process");
  active = true;
  try { return await fn(); }
  finally { active = false; }
}

// ---- internals ----

/** Steps the graph may take before LangGraph stops it: a bound on what one headless run can spend. */
const MAX_STEPS = 200;

export const MODEL_FIX = "Set MENTURA_MODEL to provider:model (anthropic:claude-opus-4-5) and install that provider's LangChain package (npm install @langchain/anthropic). The package reads its own key from its own variable.";

/** How a function agent works, the same for every function. The function-specific part comes from the spec. */
const RULES = [
  "The venture's records are your files. ls, read_file, write_file, edit_file, glob and grep go through Naive's router: a path is a route (/foundation/telos, /decisions/pricing) and a file's content is its record's JSON.",
  "When a tool answers \"Held for a person\", the record did not change. A person must accept your draft. Do not try the write again. Say in your answer what waits.",
  "Only a person settles a decision. To raise a question, write an open decision under /decisions/.",
  "Your function's skills, frameworks and templates are under /function/ and are read-only. Read a skill's SKILL.md before you do the work it covers.",
  "Finish with a short answer for whoever called you: what you changed, what waits for a person, and what you recommend next.",
];

/** The keys withRunEnv sets. Every one is restored after the run, unset again when it was unset. */
const RUN_ENV = ["MENTURA_ACTOR", "MENTURA_ACTOR_ID", "MENTURA_MODEL", "MENTURA_SESSION", "MENTURA_TRACE_ID", "MENTURA_SPAN_ID",
  "MENTURA_HARNESS", "MENTURA_WORKSPACE", "NAIVE_TRACES", "LANGSMITH_TRACING", "LANGCHAIN_TRACING_V2"] as const;

/** Keys a run may add to its environment beyond RUN_ENV, restored the same way. A researcher run sets MENTURA_READS_AS_OF. */
export type ExtraRunEnv = Partial<Record<"MENTURA_READS_AS_OF", string>>;

/**
 * The run's projection onto the process environment, set before fn and restored after, so every Naive reader agrees
 * with the run: the actor is an agent in the spec's role, with the run's model, session, trace and harness; the root
 * span hangs from the caller's span; traces are on (a function agent run is always traced); and LangChain's own
 * tracing is off, because traces stay in the venture and shipping them is the LangSmith exporter's job.
 */
export async function withRunEnv<T>(run: Pick<RunRef, "role" | "session" | "trace_id" | "parent_span_id">, ctx: Pick<RunContext, "model" | "harness" | "workspace">, fn: () => Promise<T>, extra: ExtraRunEnv = {}): Promise<T> {
  const keys: string[] = [...RUN_ENV, ...Object.keys(extra)];
  const saved = keys.map((k) => process.env[k]);
  const set: Record<string, string | undefined> = { ...extra,
    MENTURA_ACTOR: "agent", MENTURA_ACTOR_ID: run.role, MENTURA_MODEL: ctx.model.name, MENTURA_SESSION: run.session,
    MENTURA_TRACE_ID: run.trace_id, MENTURA_SPAN_ID: run.parent_span_id ?? undefined, MENTURA_HARNESS: ctx.harness,
    MENTURA_WORKSPACE: ctx.workspace ?? process.env.MENTURA_WORKSPACE, NAIVE_TRACES: "1", LANGSMITH_TRACING: "false", LANGCHAIN_TRACING_V2: "false",
  };
  for (const k of keys) { const v = set[k]; if (v === undefined) delete process.env[k]; else process.env[k] = v; }
  try { return await fn(); }
  finally { keys.forEach((k, i) => { if (saved[i] === undefined) delete process.env[k]; else process.env[k] = saved[i]; }); }
}

/**
 * Builds and invokes the deep agent. The backend is the venture's records (NaiveBackend, acting as spec.role) with the
 * function's module mounted at /function/ and its writes denied, so its skills, frameworks and templates are readable.
 * The tracer's root span is run.id (passed as the LangChain runId) and hangs from MENTURA_SPAN_ID, the caller's span.
 * The same run id continues from .naive/agent-checkpoints.sqlite when the process stopped before that span was written.
 */
async function invoke(dir: string, spec: FunctionAgentSpec, task: string, run: RunRef, role: TeamPlanEntryRead, model: BaseLanguageModel, workspace?: string, signal?: AbortSignal): Promise<RunResult> {
  const tracer = new NaiveTracer(dir, { session: run.session, trace_id: run.trace_id, agents: [spec.function] });
  const backend = new CompositeBackend(new NaiveBackend({ venture: run.venture, workspace, actor_id: spec.role }, tracer),
    { "/function/": new FilesystemBackend({ rootDir: spec.module, virtualMode: true }) });
  const skills = [...new Set(spec.skills.map((s) => s.path.replace(/[^/]+\/$/, "")))];
  const saver = openRunSaver(dir);
  const agent = createDeepAgent({ model, backend, name: spec.function, systemPrompt: promptOf(spec, run.venture, role), skills,
    checkpointer: saver, permissions: [{ operations: ["write"], paths: ["/function/**"], mode: "deny" }] });
  try {
    const out = await invokeThread(agent, run.id, task, { runId: run.id, callbacks: [tracer], signal, recursionLimit: MAX_STEPS });
    return { status: "done", run, answer: answerOf(out), ...outcomeOf(dir, run) };
  }
  catch (e) {
    tracer.closeOpen(signal?.aborted ? "cancelled" : messageOf(e));
    return signal?.aborted ? { status: "cancelled", run, ...outcomeOf(dir, run) } : { status: "failed", run, error: messageOf(e), ...outcomeOf(dir, run) };
  }
  finally { saver.close(); }
}

/** The fields of the venture's team-plan entry the run reads. Read fresh on every run (Naive's roleOf). A lead run reads the same. */
export interface TeamPlanEntryRead { id: string, occupant: string, authority?: string[], routes?: { read?: string[], write?: string[] } }

/** The system prompt: who the agent is (departments.json), what it may reach (the venture's team plan), and RULES. Pure. */
function promptOf(spec: FunctionAgentSpec, venture: string, role: TeamPlanEntryRead): string {
  const write = role.routes?.write ?? [];
  return [
    `You are the ${spec.label} function agent of the venture ${venture} (APQC ${spec.charter.apqc}).`,
    `Its governance side: ${spec.charter.governance}. Its operations side: ${spec.charter.operations}.`,
    `You act in the team-plan role ${role.id}. You may write ${write.length ? write.join(", ") : "no route"}; you may read ${role.routes?.read?.join(", ") ?? "every route"}.`,
    role.authority?.length ? `Decision classes delegated to you: ${role.authority.join(", ")}.` : "No decision class is delegated to you.",
    "",
    ...RULES.map((r) => `- ${r}`),
  ].join("\n");
}

/**
 * What the run did, derived: the span ids that descend from run.id in the session's trace file, then every provenance
 * line whose span is one of them. A draft line whose _drafts/ file still exists is held; any other line is written.
 * Reading the whole log is the point: the same answer before and after a retry.
 */
export function outcomeOf(dir: string, run: Pick<RunRef, "id" | "session" | "venture">): { wrote: Written[], held: HeldDraft[] } {
  const children = new Map<string, string[]>();
  for (const s of spans(dir, run.session) as { span_id: string, parent_span_id?: string }[]) {
    if (s.parent_span_id) children.set(s.parent_span_id, [...(children.get(s.parent_span_id) ?? []), s.span_id]);
  }
  const tree = new Set<string>([run.id]);
  for (const id of tree) for (const c of children.get(id) ?? []) tree.add(c);
  const mine = (entries(dir) as { entity: string, route?: string, activity: string, span?: { span_id: string } }[]).filter((e) => e.span && tree.has(e.span.span_id));
  const wrote = new Map<string, Written>(), held = new Map<string, HeldDraft>();
  for (const e of mine) {
    const route = e.route ?? e.entity;
    if (e.activity === "draft") { if (existsSync(ventureFile(dir, e.entity))) held.set(e.entity, { route, draft: e.entity, accept: `mentura accept ${route} --venture ${run.venture}` }); }
    else wrote.set(e.entity, { route, entity: e.entity });
  }
  return { wrote: [...wrote.values()], held: [...held.values()] };
}

/**
 * One run at a time per venture, across processes: <venture>/.naive/agent-run.lock, created exclusively, holding the
 * pid only, so Naive's stealDeadLock can tell a live holder from a crashed one and reclaim the lock after a crash.
 * Never waits: a busy venture is the caller's to retry.
 */
export function lockVenture(dir: string): { release(): void } | { busy: number | null } {
  const lock = join(dir, ".naive", "agent-run.lock");
  mkdirSync(join(dir, ".naive"), { recursive: true });
  const take = (): boolean => {
    let fd: number;
    try { fd = openSync(lock, constants.O_CREAT | constants.O_EXCL | constants.O_RDWR); }
    catch (e) { if ((e as NodeJS.ErrnoException).code === "EEXIST") return false; throw e; }
    try { writeSync(fd, String(process.pid)); } finally { closeSync(fd); }
    return true;
  };
  if (take() || (stealDeadLock(lock) && take())) return { release: () => { try { unlinkSync(lock); } catch { /* already gone */ } } };
  let holder: number | null = null;
  try { const n = Number.parseInt(readFileSync(lock, "utf8"), 10); holder = Number.isFinite(n) ? n : null; } catch { /* released meanwhile */ }
  return { busy: holder };
}

/** The venture's phase from venture.json, for the suggested team-plan entry. */
export function phaseOf(dir: string): Phase {
  try { return (JSON.parse(readFileSync(join(dir, "venture.json"), "utf8")) as { phase?: Phase }).phase ?? "discovery"; }
  catch { return "discovery"; }
}

/** The text of the last AI message the agent returned. */
export function answerOf(out: unknown): string {
  const messages = (out as { messages?: { content: unknown, getType?: () => string }[] }).messages ?? [];
  const last = messages.filter((m) => m.getType?.() === "ai").at(-1);
  if (!last) return "";
  if (typeof last.content === "string") return last.content;
  return Array.isArray(last.content) ? last.content.map((b: { text?: string }) => b.text ?? "").join("") : "";
}

export const messageOf = (e: unknown): string => String((e as Error)?.message ?? e);
