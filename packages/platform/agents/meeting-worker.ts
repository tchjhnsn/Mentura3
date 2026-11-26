// The production worker for the meeting graph: each agenda item is worked, or recommended on, by its owner as a
// function agent run (function-agent.ts), in this process, one after another. The run id comes from the meeting, the
// item and the attempt (itemRunId), so a meeting resumed after a crash finds the run it already made and does not run
// it twice. The task names the meeting's goal and the item, and for a workflow step its skill, the routes it writes
// and the decision classes it may raise, so the agent does that step and nothing else.

import type { Meeting } from "./meetings.ts";
import { itemRunId, workflowOf, type AgendaItem, type WorkflowStep } from "./meetings.ts";
import type { ModelSource, RunId, RunResult, TraceJoin } from "./function-agent.ts";
import { runFunctionAgent } from "./function-agent.ts";
import { functionAgent } from "./function-spec.ts";
import type { Worked, Worker } from "./meeting-graph.ts";

export interface WorkerContext { venture: string, workspace?: string, model: ModelSource, trace: TraceJoin, harness?: string, signal?: AbortSignal }

/** The workflow step an item works, when the meeting walks a workflow. */
function stepOf(m: Meeting, item: AgendaItem): WorkflowStep | null {
  if (!m.workflow || !item.step) return null;
  const [fn, wf] = m.workflow.split("/");
  try { return workflowOf(fn, wf).steps.find((s) => s.id === item.step) ?? null; } catch { return null; }
}

/** The task for an item's run. Pure. */
export function taskOf(m: Meeting, item: AgendaItem, answer: string | null, mode: "work" | "recommend"): string {
  const step = stepOf(m, item);
  const done = m.agenda.filter((i) => i.status === "done" && i.result).map((i) => `- ${i.id}: ${i.result}`);
  return [
    `You are in the meeting "${m.title}" (record operations/meeting/${m.id}). Its goal: ${m.goal}`,
    `It is done when: ${m.outcome_expected.join("; ")}.`,
    done.length ? `Already done in this meeting:\n${done.join("\n")}` : "Nothing is done in this meeting yet.",
    "",
    mode === "work" ? `Work this agenda item and nothing else: ${item.id}. ${item.title}` : `This agenda item was handed to you to recommend on: ${item.id}. ${item.title}`,
    ...(step?.skill ? [`Read the skill ${step.skill} under /function/ first.`] : []),
    ...(step?.writes?.length ? [`Write or draft: ${step.writes.join(", ")}.`] : []),
    ...(step?.raises?.length ? [`A question a person must settle is an open decision under /decisions/ of class ${step.raises.join(" or ")}.`] : []),
    ...(answer ? [`The person answered: ${answer}`] : []),
    mode === "recommend"
      ? "Do not finish the item. Say in two or three sentences what you recommend and why. When a person must choose between options, write an open decision under /decisions/ that keeps every option open, and name its id."
      : "Finish with one or two sentences on what came of it: what you wrote, what waits for a person.",
  ].join("\n");
}

/** What a run produced, as the graph records it. A run that is not done throws, so the graph leaves the item skipped. */
function workedOf(r: RunResult): Worked {
  if (r.status !== "done" && r.status !== "already-ran") throw new Error(r.status === "failed" ? r.error : r.status === "refused" ? `${r.reason}${r.fix ? ` Fix: ${r.fix}` : ""}` : r.status);
  const routes = [...r.wrote.map((w) => w.route), ...r.held.map((h) => `${h.route} (held for a person)`)];
  const decisions = [...r.wrote, ...r.held].map((w) => w.route).filter((x) => x.startsWith("decisions/")).map((x) => x.slice("decisions/".length));
  const answer = r.status === "done" ? r.answer.trim() : "already worked in an earlier run";
  return { result: answer.length > 600 ? `${answer.slice(0, 597)}...` : answer || "done", writes: routes, decisions, held: r.held.map((h) => h.route) };
}

const functionOf = (owner: string | undefined): string => {
  if (!owner?.endsWith("-agent")) throw new Error(`${owner ?? "nobody"} is not a function agent, so no agent can work this item`);
  return owner.slice(0, -"-agent".length);
};

/** The worker that runs each item's owner as a function agent. */
export function functionWorker(ctx: WorkerContext): Worker {
  const run = (m: Meeting, item: AgendaItem, task: string, key: string, attempt: number): Promise<RunResult> =>
    runFunctionAgent(functionAgent(functionOf(item.owner)), task, { venture: ctx.venture, workspace: ctx.workspace, model: ctx.model,
      trace: ctx.trace, harness: ctx.harness ?? "mentura-meeting", signal: ctx.signal, runId: itemRunId(m.id, key, attempt) as RunId });
  return {
    async work(m, item, answer, attempt) { return workedOf(await run(m, item, taskOf(m, item, answer, "work"), item.id, attempt)); },
    async recommend(m, item, attempt) {
      const w = workedOf(await run(m, item, taskOf(m, item, null, "recommend"), `${item.id}#recommend`, attempt));
      return { recommendation: w.result, decisions: w.decisions };
    },
  };
}
