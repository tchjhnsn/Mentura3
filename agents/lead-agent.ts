// One lead agent run (lead agents design, build plan item 4): a deepagents agent built from a LeadAgentSpec, working the
// venture's records through Naive's router as the lead's team-plan role. It reads every record and writes only its own
// lead plan, decisions and handoffs: for a task it writes a plan entry (a bet citing measure and handoff ids) and one
// handoff per function involved, each addressed to that function's agent (<function>-agent) and naming the lead as
// requested_by, so the lead verifies the work later and the function agent claims it (Naive's handoff claim). It never
// writes a function's records; the function agents do that when they work their handoffs.
//
// The run mirrors runFunctionAgent (function-agent.ts): the same process claim, venture lock, run id, trace join,
// environment and outcome, so a lead run and a function agent run on one venture never overlap.
//
//   const result = await runLeadAgent(leadAgent("growth-lead"), "Launch the paid tier.", {
//     venture: "kettle", model: modelSource(process.env.MENTURA_MODEL), trace: { session: "grokbot-7" },
//   });
//   result.status === "done" && result.handoffs   // [{ id: "launch-pricing-page", role: "marketing-and-sales-agent", requested_by: "growth-lead" }, ...]

import { existsSync, readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import type { BaseLanguageModel } from "@langchain/core/language_models/base";
import { HumanMessage } from "@langchain/core/messages";
import { CompositeBackend, createDeepAgent, FilesystemBackend } from "deepagents";
import type { EditResult, WriteResult } from "deepagents";
import { spans } from "naive-framework/src/core/instrumentation.mjs";
import { ventureFile } from "naive-framework/src/core/venture-paths.mjs";
import { roleOf, routeGlob } from "naive-framework/src/engine/access.mjs";
import type { Context } from "naive-framework/src/router/agent-files.ts";
import { ventureDir } from "naive-framework/src/router/router.mjs";
import type { HeldDraft, ModelSource, RunId, TraceJoin, TeamPlanEntryRead, Written } from "./function-agent.ts";
import { answerOf, lockVenture, messageOf, MODEL_FIX, outcomeOf, ownProcess, phaseOf, withRunEnv } from "./function-agent.ts";
import { functionAgent, functionIds, reachesTeamPlan } from "./function-spec.ts";
import type { LeadAgentSpec, LeadId } from "./lead-spec.ts";
import { beyondLead, leadTeamPlanEntry } from "./lead-spec.ts";
import { NaiveBackend } from "./naive-backend.ts";
import { NaiveTracer } from "./naive-tracer.ts";

export interface LeadRunContext {
  venture: string,
  workspace?: string,
  model: ModelSource,
  trace: TraceJoin,
  runId?: RunId,
  harness?: string,
  signal?: AbortSignal,
}

/** Which lead run this was and where its trace is. */
export interface LeadRunRef {
  id: RunId,
  lead: LeadId,
  role: string,
  venture: string,
  session: string,
  trace_id: string,
  parent_span_id: string | null,
}

/** A handoff the run wrote: who it is addressed to and who requested it. */
export interface WrittenHandoff { id: string, role: string, requested_by: string | null }

/**
 * What a lead run returns: a function agent run's outcome plus whether its lead plan changed (or is held) and the
 * handoffs it wrote, read back from the records after the run.
 */
export type LeadRunResult =
  | { status: "done", run: LeadRunRef, answer: string, wrote: Written[], held: HeldDraft[], plan: boolean, handoffs: WrittenHandoff[] }
  | { status: "already-ran", run: LeadRunRef, wrote: Written[], held: HeldDraft[], plan: boolean, handoffs: WrittenHandoff[] }
  | { status: "failed", run: LeadRunRef, error: string, wrote: Written[], held: HeldDraft[], plan: boolean, handoffs: WrittenHandoff[] }
  | { status: "cancelled", run: LeadRunRef, wrote: Written[], held: HeldDraft[], plan: boolean, handoffs: WrittenHandoff[] }
  | { status: "busy", venture: string, holder: number | null }
  | { status: "refused", reason: string, fix?: string };

/**
 * Runs one lead on one task. Order as runFunctionAgent: claim the process; find the venture; check the team-plan role
 * (an agent's, listing write routes that keep to the lead's plan, decisions and handoffs); lock the venture; answer
 * already-ran for a run id already in the session; load the model; invoke under the run's env and derive the outcome.
 */
export async function runLeadAgent(spec: LeadAgentSpec, task: string, ctx: LeadRunContext): Promise<LeadRunResult> {
  return await ownProcess(async () => {
    const dir = ventureDir(ctx.venture, ctx.workspace) as string | null;
    if (!dir) return { status: "refused", reason: `no venture ${ctx.venture} in ${ctx.workspace ?? process.env.MENTURA_WORKSPACE ?? process.cwd()}`, fix: "Set MENTURA_WORKSPACE to the folder that holds the ventures, or pass the venture's id." };
    const role = roleOf(dir, spec.role) as TeamPlanEntryRead | null;
    const entry = JSON.stringify(leadTeamPlanEntry(spec, phaseOf(dir)));
    if (!role) return { status: "refused", reason: `${spec.role} is not in ${ctx.venture}'s team plan`, fix: entry };
    if (role.occupant !== "agent") return { status: "refused", reason: `${spec.role} is a person's role in ${ctx.venture}'s team plan` };
    if (!role.routes?.write) return { status: "refused", reason: `${spec.role} lists no write routes, so it could write every route: a lead writes only its plan, decisions and handoffs`, fix: entry };
    if (reachesTeamPlan(role.routes.write)) return { status: "refused", reason: `${spec.role} could write the team plan, and so widen its own reach`, fix: entry };
    const beyond = beyondLead(spec.id, role.routes.write);
    if (beyond.length) return { status: "refused", reason: `${spec.role} lists write routes that reach ${beyond.slice(0, 3).join(", ")}${beyond.length > 3 ? ` and ${beyond.length - 3} more` : ""}: a lead writes only its plan, decisions and handoffs, never a function's records`, fix: entry };

    const id = ctx.runId ?? (randomUUID() as RunId);
    const trace_id = ctx.trace.trace_id ?? id;
    const run: LeadRunRef = { id, lead: spec.id, role: spec.role, venture: ctx.venture, session: ctx.trace.session ?? trace_id, trace_id, parent_span_id: ctx.trace.parent_span_id ?? null };

    const lock = lockVenture(dir);
    if ("busy" in lock) return { status: "busy", venture: ctx.venture, holder: lock.busy };
    try {
      if ((spans(dir, run.session) as { span_id: string }[]).some((s) => s.span_id === run.id)) return { status: "already-ran", run, ...leadOutcome(dir, spec, run) };
      let model: BaseLanguageModel;
      try { model = await ctx.model.load(); }
      catch (e) { return { status: "refused", reason: messageOf(e), fix: MODEL_FIX }; }
      return await withRunEnv(run, ctx, () => invoke(dir, spec, task, run, role, model, ctx.workspace, ctx.signal));
    }
    finally { lock.release(); }
  });
}

// ---- internals ----

const MAX_STEPS = 200;

/** How a lead works, the same for every lead. The lead-specific part comes from the spec. */
const RULES = [
  "The venture's records are your files. ls, read_file, write_file, edit_file, glob and grep go through Naive's router: a path is a route (/foundation/telos, /operations/handoff/<id>) and a file's content is its record's JSON. You may read every record.",
  "You plan and verify; you never do a function's work. You write only your lead plan, decisions and handoffs. Every other write is refused.",
  "For a task: decide which functions it involves, write one handoff per function at /operations/handoff/<id>, then add a bet to your lead plan that cites the measures it serves and those handoff ids.",
  "Each handoff is addressed to that function's agent (role <function>-agent), names you as requested_by, starts as status draft, unclaimed, with attempts 0, and has a review criterion whose reviewer is you. Its decision_classes are classes the function agent may use; a one-way door or a never-redelegated class is never one of them.",
  "Only a person settles a decision. To raise a question, write an open decision under /decisions/. When a tool answers \"Held for a person\", the record did not change: say in your answer what waits.",
  "Finish with a short answer for whoever called you: the handoffs you wrote, the bet you added, and what waits for a person.",
];

/**
 * A NaiveBackend that refuses, before Naive sees it, any write outside the lead's plan, decisions and handoffs, and any
 * handoff not addressed to a function agent or not naming the lead as requested_by. Naive's router enforces the team
 * plan's routes and the requester rule too; this tells the model why in one place.
 */
class LeadBackend extends NaiveBackend {
  spec: LeadAgentSpec;
  agents: Set<string>;

  constructor(ctx: Context, tracer: NaiveTracer, spec: LeadAgentSpec) {
    super(ctx, tracer);
    this.spec = spec;
    this.agents = new Set(functionIds().map((f) => functionAgent(f).role));
  }

  refusal(path: string, content: string | null): string | null {
    const route = path.replace(/^\/+/, "").replace(/\.json$/, "");
    if (!this.spec.writes.some((g) => routeGlob(g).test(route))) return `A lead writes only ${this.spec.writes.join(", ")}. ${path} was not written: hand the work to the function's agent with a handoff.`;
    if (!/^operations\/handoff\//.test(route) || content === null) return null;
    let h: { role?: unknown, requested_by?: unknown };
    try { h = JSON.parse(content) as typeof h; } catch { return null; }
    if (typeof h.role !== "string" || !this.agents.has(h.role)) return `A lead hands work to a function agent: role must be one of ${[...this.agents].join(", ")}, not ${String(h.role)}. ${path} was not written.`;
    if (h.requested_by !== this.spec.role) return `A lead's handoff names it as requested_by (${this.spec.role}), so it verifies the work. ${path} was not written.`;
    return null;
  }

  override async write(filePath: string, content: string): Promise<WriteResult> {
    const no = this.refusal(filePath, content);
    return no ? { error: no } : await super.write(filePath, content);
  }

  override async edit(filePath: string, oldString: string, newString: string, replaceAll = false): Promise<EditResult> {
    let next: string | null = null;
    const cur = await this.readRaw(filePath);
    if (cur.data && typeof cur.data.content === "string") next = replaceAll ? cur.data.content.split(oldString).join(newString) : cur.data.content.replace(oldString, newString);
    const no = this.refusal(filePath, next);
    return no ? { error: no } : await super.edit(filePath, oldString, newString, replaceAll);
  }
}

async function invoke(dir: string, spec: LeadAgentSpec, task: string, run: LeadRunRef, role: TeamPlanEntryRead, model: BaseLanguageModel, workspace?: string, signal?: AbortSignal): Promise<LeadRunResult> {
  const tracer = new NaiveTracer(dir, { session: run.session, trace_id: run.trace_id, agents: [spec.id] });
  const records = new LeadBackend({ venture: run.venture, workspace, actor_id: spec.role }, tracer, spec);
  const backend = spec.skill ? new CompositeBackend(records, { "/lead/": new FilesystemBackend({ rootDir: spec.skill, virtualMode: true }) }) : records;
  const agent = createDeepAgent({ model, backend, name: spec.id, systemPrompt: promptOf(spec, run.venture, role),
    permissions: [{ operations: ["write"], paths: ["/lead/**"], mode: "deny" }] });
  // deepagents 1.16's invoke type resolves the messages field to never under strict mode, so the input is cast.
  const input = { messages: [new HumanMessage(task)] } as unknown as Parameters<typeof agent.invoke>[0];
  try {
    const out = await agent.invoke(input, { runId: run.id, callbacks: [tracer], signal, recursionLimit: MAX_STEPS });
    return { status: "done", run, answer: answerOf(out), ...leadOutcome(dir, spec, run) };
  }
  catch (e) {
    tracer.closeOpen(signal?.aborted ? "cancelled" : messageOf(e));
    return signal?.aborted ? { status: "cancelled", run, ...leadOutcome(dir, spec, run) } : { status: "failed", run, error: messageOf(e), ...leadOutcome(dir, spec, run) };
  }
}

/** The system prompt: who the lead is (its role template), the function agents it hands work to, its reach, and RULES. Pure. */
function promptOf(spec: LeadAgentSpec, venture: string, role: TeamPlanEntryRead): string {
  const agents = functionIds().map((f) => { const a = functionAgent(f); return `${a.role} (${a.label}${spec.portfolio.includes(f) ? ", in your portfolio" : ""})`; });
  return [
    `You are the ${spec.label} of the venture ${venture}, acting in the team-plan role ${role.id}. ${spec.description}`,
    `Your portfolio: ${spec.portfolio.join(", ")}. Your lead plan is ${spec.plan} (lead, portfolio, measures, bets, review_cadence); a bet has id, statement, measures, handoffs and status.`,
    `You may write ${(role.routes?.write ?? []).join(", ")}; you may read ${role.routes?.read?.join(", ") ?? "every route"}.`,
    role.authority?.length ? `Decision classes delegated to you: ${role.authority.join(", ")}.` : "No decision class is delegated to you.",
    `The function agents you may hand work to: ${agents.join("; ")}.`,
    spec.skill ? "Your role's skill is under /lead/ (read-only): read /lead/SKILL.md before you plan." : "",
    "",
    ...RULES.map((r) => `- ${r}`),
  ].filter((l, i, a) => l !== "" || a[i - 1] !== "").join("\n");
}

/** The run's outcome (outcomeOf) plus whether the lead plan changed or is held, and each handoff it wrote, read back. */
function leadOutcome(dir: string, spec: LeadAgentSpec, run: LeadRunRef): { wrote: Written[], held: HeldDraft[], plan: boolean, handoffs: WrittenHandoff[] } {
  const o = outcomeOf(dir, run);
  const plan = [...o.wrote, ...o.held].some((w) => w.route === spec.plan);
  const handoffs: WrittenHandoff[] = [];
  for (const w of o.wrote.filter((x) => /^operations\/handoffs\/[^/]+\.json$/.test(x.entity))) {
    const file = ventureFile(dir, w.entity) as string;
    if (!existsSync(file)) continue;
    const h = JSON.parse(readFileSync(file, "utf8")) as { id: string, role: string, requested_by?: string };
    handoffs.push({ id: h.id, role: h.role, requested_by: h.requested_by ?? null });
  }
  return { ...o, plan, handoffs };
}
