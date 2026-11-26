// The record-writing entry for NAIVE_AGENT_CMD. naive agent run sends the prompt on stdin, sets
// MENTURA_ACTOR_ID to the role, and runs in the venture folder. This command runs that role through
// mentura-agent, so the only file tools are NaiveBackend. It has no shell.

import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { RunResult, ModelSource, TraceJoin, RunId } from "./function-agent.ts";
import { runFunctionAgent, runIdOf } from "./function-agent.ts";
import { functionAgent, functionIds } from "./function-spec.ts";
import { leadAgent, leadIds } from "./lead-spec.ts";
import type { LeadRunResult } from "./lead-agent.ts";

const TASK = "## Task\n\n";
const AFTER = "\n## How to read and write records";

type Env = Readonly<Record<string, string | undefined>>;

/** The task inside a naive agent prompt, or the whole text when it is not one. */
export function taskOf(prompt: string): string {
  const at = prompt.indexOf(TASK);
  if (at < 0) return prompt.trim();
  const rest = prompt.slice(at + TASK.length);
  const end = rest.indexOf(AFTER);
  return (end < 0 ? rest : rest.slice(0, end)).trim();
}

/** The venture in this folder: its id, and the parent folder as the workspace. */
export function ventureAt(cwd: string): { venture: string, workspace: string } | { error: string } {
  const file = join(cwd, "venture.json");
  if (!existsSync(file)) return { error: `no venture.json in ${cwd}` };
  let id = "";
  try { id = (JSON.parse(readFileSync(file, "utf8")) as { id?: string }).id ?? ""; }
  catch { return { error: `venture.json in ${cwd} is not JSON` }; }
  if (!id) return { error: `venture.json in ${cwd} has no id` };
  return { venture: id, workspace: dirname(cwd) };
}

/**
 * Runs the role in MENTURA_ACTOR_ID on the task in the prompt. A function agent and a lead go through
 * the same runs as `mentura-agent run` and `mentura-agent lead`.
 */
export async function runHarness(env: Env, prompt: string, model: ModelSource, cwd: string, signal?: AbortSignal): Promise<RunResult | LeadRunResult> {
  const role = env.MENTURA_ACTOR_ID;
  if (!role) return { status: "refused", reason: "MENTURA_ACTOR_ID is not set. naive agent run sets it to the role." };
  const found = ventureAt(cwd);
  if ("error" in found) return { status: "refused", reason: found.error };
  const task = taskOf(prompt);
  if (!task) return { status: "refused", reason: "no task on stdin" };
  const trace: TraceJoin = { session: env.MENTURA_SESSION, trace_id: env.MENTURA_TRACE_ID, parent_span_id: env.MENTURA_SPAN_ID };
  if (trace.parent_span_id && !trace.trace_id) return { status: "refused", reason: "MENTURA_SPAN_ID names a parent span, so MENTURA_TRACE_ID must name its trace" };
  let runId: RunId | undefined;
  if (env.MENTURA_RUN_ID) {
    try { runId = runIdOf(env.MENTURA_RUN_ID); }
    catch (e) { return { status: "refused", reason: (e as Error).message }; }
  }
  const ctx = { ...found, trace, runId, harness: env.MENTURA_HARNESS ?? "mentura-agent", model, signal };
  const fn = role.endsWith("-agent") ? role.slice(0, -"-agent".length) : "";
  if (fn && (functionIds() as readonly string[]).includes(fn)) return runFunctionAgent(functionAgent(fn), task, ctx);
  if ((leadIds() as readonly string[]).includes(role)) {
    const { runLeadAgent } = await import("./lead-agent.ts");
    return runLeadAgent(leadAgent(role), task, ctx);
  }
  return { status: "refused", reason: `${role} is not a function agent or a lead` };
}
