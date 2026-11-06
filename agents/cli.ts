// mentura-agent: the one way to start a function agent (EE-123). Every caller spawns it: Grokbot through the MCP shim
// (`mentura-agent mcp`, platform/agents/mcp.ts) or a shell call, and later a filesystem trigger. One process per run,
// so the run's trace context and environment belong to that process and nothing is shared between runs.
//
//   node <EE>/platform/agents/bin.ts run <function> --venture <id> [--run-id <uuid>]   < task.txt
//   node <EE>/platform/agents/bin.ts mcp
//
// What changes per call is an argument (function, venture, run id) or stdin (the task, kept out of argv and so out
// of `ps`). What stays with the caller is the environment, read once here:
//   MENTURA_WORKSPACE                     the folder that holds the ventures
//   MENTURA_SESSION, MENTURA_TRACE_ID,    the caller's trace: the run's spans go to <venture>/traces/<session>.jsonl
//   MENTURA_SPAN_ID                       and its root span hangs from the caller's span
//   MENTURA_MODEL                         provider:model; the provider package reads its own key (ANTHROPIC_API_KEY)
//   MENTURA_HARNESS                       who started the run, for provenance
//
// Prints one JSON RunResult on stdout, a usage error included. Exit: 0 done or already-ran, 1 failed, 2 refused or
// usage, 75 busy (try again later), 130 cancelled. SIGTERM and SIGINT abort the run cleanly.
//
// The name is mentura-agent, not `mentura agent`, because the installed Naive package already owns the `mentura` bin
// (its router CLI), and Naive imports nothing from this repository.

import type { RunId, RunResult, TraceJoin, ModelSource } from "./function-agent.ts";
import { runFunctionAgent, runIdOf } from "./function-agent.ts";
import { functionAgent } from "./function-spec.ts";

type Env = Readonly<Record<string, string | undefined>>;

/** A run request parsed from argv and the environment. The only place either is read. */
export interface Invocation {
  function: string,
  venture: string,
  runId?: RunId,
  workspace?: string,
  trace: TraceJoin,
  /** MENTURA_MODEL, or null when unset; a run that needs a model and has none is refused then, not here. */
  model: string | null,
  harness?: string,
}

export type Parsed =
  | { command: "run", invocation: Invocation }
  | { command: "mcp" }
  | { command: "usage", usage: string };

const USAGE = "usage: mentura-agent run <function> --venture <id> [--run-id <uuid>] < task, or mentura-agent mcp";

/** Parses argv and env. Pure. A bad --run-id, a missing --venture or any other flag is a usage error. */
export function parse(argv: readonly string[], env: Env): Parsed {
  const val = (k: string): string | undefined => env[k] || undefined;
  if (argv[0] === "mcp" && argv.length === 1) return { command: "mcp" };
  if (argv[0] !== "run" || !argv[1] || argv[1].startsWith("--")) return { command: "usage", usage: USAGE };
  const flags = new Map<string, string>();
  for (let i = 2; i < argv.length; i += 2) {
    const [k, v] = [argv[i], argv[i + 1]];
    if ((k !== "--venture" && k !== "--run-id") || !v || flags.has(k)) return { command: "usage", usage: `${USAGE} (unexpected ${k ?? "end"})` };
    flags.set(k, v);
  }
  const venture = flags.get("--venture");
  if (!venture) return { command: "usage", usage: `${USAGE} (--venture is required)` };
  let runId: RunId | undefined;
  try { runId = flags.has("--run-id") ? runIdOf(flags.get("--run-id") ?? "") : undefined; }
  catch (e) { return { command: "usage", usage: `${USAGE} (${(e as Error).message})` }; }
  const trace: TraceJoin = { session: val("MENTURA_SESSION"), trace_id: val("MENTURA_TRACE_ID"), parent_span_id: val("MENTURA_SPAN_ID") };
  if (trace.parent_span_id && !trace.trace_id) return { command: "usage", usage: "MENTURA_SPAN_ID names a parent span, so MENTURA_TRACE_ID must name its trace" };
  return { command: "run", invocation: { function: argv[1], venture, runId, workspace: val("MENTURA_WORKSPACE"), trace, model: val("MENTURA_MODEL") ?? null, harness: val("MENTURA_HARNESS") } };
}

/**
 * The model source for a "provider:model" name: load() calls LangChain's initChatModel, which imports the provider
 * package (@langchain/anthropic for anthropic:...) and lets it read its own key from the environment. With no name,
 * or a name of another form, load() rejects with how to set one; nothing is loaded until a run needs it.
 */
export function modelSource(name: string | null): ModelSource {
  return {
    name: name ?? "unset",
    load: async () => {
      if (!name) throw new Error("MENTURA_MODEL is not set, so the function agent has no model");
      if (!/^[a-z][a-z0-9-]*:.+$/.test(name)) throw new Error(`MENTURA_MODEL is ${name}, not provider:model`);
      const { initChatModel } = await import("langchain/chat_models/universal");
      return await initChatModel(name);
    },
  };
}

/** The exit code for a result. The MCP shim reads status instead. */
export function exitCode(r: RunResult): number {
  switch (r.status) {
    case "done": case "already-ran": return 0;
    case "failed": return 1;
    case "refused": return 2;
    case "busy": return 75;
    case "cancelled": return 130;
  }
}

/**
 * The CLI. run: parse, derive the spec (an unknown function is a refusal), read the task from stdin, wire SIGTERM and
 * SIGINT to an AbortController, call runFunctionAgent, print the result, return its exit code. mcp: serve the shim
 * until stdin closes.
 */
export async function main(argv: readonly string[], env: Env, stdin: NodeJS.ReadableStream): Promise<number> {
  const print = (r: RunResult): number => { process.stdout.write(JSON.stringify(r) + "\n"); return exitCode(r); };
  const p = parse(argv, env);
  if (p.command === "usage") return print({ status: "refused", reason: p.usage });
  if (p.command === "mcp") { await (await import("./mcp.ts")).serve(stdin, process.stdout, env); return 0; }
  const inv = p.invocation;
  let spec;
  try { spec = functionAgent(inv.function); } catch (e) { return print({ status: "refused", reason: (e as Error).message }); }
  const task = (await text(stdin)).trim();
  if (!task) return print({ status: "refused", reason: "no task on stdin" });
  const abort = new AbortController();
  for (const s of ["SIGTERM", "SIGINT"] as const) process.once(s, () => abort.abort());
  return print(await runFunctionAgent(spec, task, { venture: inv.venture, workspace: inv.workspace, trace: inv.trace, runId: inv.runId,
    harness: inv.harness, model: modelSource(inv.model), signal: abort.signal }));
}

async function text(stream: NodeJS.ReadableStream): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const c of stream) chunks.push(typeof c === "string" ? Buffer.from(c) : c);
  return Buffer.concat(chunks).toString("utf8");
}
