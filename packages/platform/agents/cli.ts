// mentura-agent: the one way to start a function agent (EE-123). Every caller spawns it: any MCP harness through the shim
// (`mentura-agent mcp`, platform/agents/mcp.ts) or a shell call, and later a filesystem trigger. One process per run,
// so the run's trace context and environment belong to that process and nothing is shared between runs.
//
//   node <EE>/platform/agents/bin.ts run <function> --venture <id> [--run-id <uuid>]   < task.txt
//   node <EE>/platform/agents/bin.ts lead <lead> --venture <id> [--run-id <uuid>]       < task.txt
//   node <EE>/platform/agents/bin.ts research <function> --venture <id or folder> [--run-id <uuid>] [--max-experiments <n>]
//   node <EE>/platform/agents/bin.ts mcp
//   node <EE>/platform/agents/bin.ts harness                                         < prompt.txt
//   node <EE>/platform/agents/bin.ts traces --venture <id> [--session <name>] [--trace <id>]
//   node <EE>/platform/agents/bin.ts cmd --venture <id> [--by <person>]                 < "/meet strategy intake"
//
// What changes per call is an argument (function, venture, run id) or stdin (the task, kept out of argv and so out
// of `ps`). What stays with the caller is the environment, read once here:
//   MENTURA_WORKSPACE                     the folder that holds the ventures
//   MENTURA_SESSION, MENTURA_TRACE_ID,    the caller's trace: the run's spans go to <venture>/traces/<session>.jsonl
//   MENTURA_SPAN_ID                       and its root span hangs from the caller's span
//   MENTURA_MODEL                         provider:model; the provider package reads its own key (ANTHROPIC_API_KEY)
//   MENTURA_HARNESS                       who started the run, for provenance
//   MENTURA_READS_AS_OF                   research only: a cut earlier than the plans' read cut narrows the reads
//
// research runs the function's researcher (platform/agents/research.ts, autoresearch build plan item 13): no task,
// since the venture's research program is the task. Its --venture also takes a venture's folder.
//
// lead runs a lead agent (platform/agents/lead-agent.ts, lead agents build plan item 4): a role template with a
// portfolio, which writes a lead plan entry and one handoff per function involved instead of a function's records.
//
// cmd runs one slash command (platform/agents/commands.ts): meetings that walk a function workflow with its agent,
// what is due, memory, tooling. --by (or MENTURA_PERSON) is the person speaking; it names the minutes.
//
// Prints one JSON RunResult (or LeadRunResult, or ResearchResult) on stdout, a usage error included. Exit: 0 done or already-ran, 1 failed, 2 refused or
// usage, 75 busy (try again later), 130 cancelled. SIGTERM and SIGINT abort the run cleanly.
//
// The name is mentura-agent, not `mentura agent`, because the installed Naive package already owns the `mentura` bin
// (its router CLI), and Naive imports nothing from this repository.

import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import type { RunId, RunResult, TraceJoin, ModelSource } from "./function-agent.ts";
import { runFunctionAgent, runIdOf } from "./function-agent.ts";
import { functionAgent, functionResearcher } from "./function-spec.ts";
import type { LeadRunResult } from "./lead-agent.ts";
import { leadAgent } from "./lead-spec.ts";
import type { ResearchResult } from "./research.ts";
import { ventureDir } from "naive-framework/src/router/router.mjs";

type Env = Readonly<Record<string, string | undefined>>;

/** A run request parsed from argv and the environment. The only place either is read. */
export interface Invocation {
  /** The function id, or for lead the lead's id. */
  function: string,
  venture: string,
  runId?: RunId,
  workspace?: string,
  trace: TraceJoin,
  /** MENTURA_MODEL, or null when unset; a run that needs a model and has none is refused then, not here. */
  model: string | null,
  harness?: string,
}

/** A research request: an Invocation plus the researcher's limits. */
export interface ResearchInvocation extends Invocation {
  /** MENTURA_READS_AS_OF, used only when earlier than the plans' read cut. */
  readsAsOf?: string,
  /** --max-experiments: experiments the run may write per pattern. */
  maxExperiments?: number,
}

export type Parsed =
  | { command: "run", invocation: Invocation }
  | { command: "lead", invocation: Invocation }
  | { command: "research", invocation: ResearchInvocation }
  | { command: "mcp" }
  | { command: "harness" }
  | { command: "traces", venture: string, workspace?: string, session?: string, trace?: string }
  | { command: "cmd", invocation: Invocation, person: string }
  | { command: "usage", usage: string };

const USAGE = "usage: mentura-agent run <function> --venture <id> [--run-id <uuid>] < task, mentura-agent lead <lead> --venture <id> [--run-id <uuid>] < task, mentura-agent research <function> --venture <id or folder> [--run-id <uuid>] [--max-experiments <n>], mentura-agent mcp, mentura-agent harness < prompt, mentura-agent traces --venture <id> [--session <name>] [--trace <id>], or mentura-agent cmd --venture <id> [--by <person>] < /command";

/** Parses argv and env. Pure. A bad --run-id or --max-experiments, a missing --venture or any other flag is a usage error. */
export function parse(argv: readonly string[], env: Env): Parsed {
  const val = (k: string): string | undefined => env[k] || undefined;
  if (argv[0] === "mcp" && argv.length === 1) return { command: "mcp" };
  if (argv[0] === "harness" && argv.length === 1) return { command: "harness" };
  if (argv[0] === "traces") return parseTraces(argv, val);
  if (argv[0] === "cmd") return parseCmd(argv, val);
  if ((argv[0] !== "run" && argv[0] !== "lead" && argv[0] !== "research") || !argv[1] || argv[1].startsWith("--")) return { command: "usage", usage: USAGE };
  const known = argv[0] === "research" ? ["--venture", "--run-id", "--max-experiments"] : ["--venture", "--run-id"];
  const flags = new Map<string, string>();
  for (let i = 2; i < argv.length; i += 2) {
    const [k, v] = [argv[i], argv[i + 1]];
    if (!known.includes(k) || !v || flags.has(k)) return { command: "usage", usage: `${USAGE} (unexpected ${k ?? "end"})` };
    flags.set(k, v);
  }
  const venture = flags.get("--venture");
  if (!venture) return { command: "usage", usage: `${USAGE} (--venture is required)` };
  let runId: RunId | undefined;
  try { runId = flags.has("--run-id") ? runIdOf(flags.get("--run-id") ?? "") : undefined; }
  catch (e) { return { command: "usage", usage: `${USAGE} (${(e as Error).message})` }; }
  const trace: TraceJoin = { session: val("MENTURA_SESSION"), trace_id: val("MENTURA_TRACE_ID"), parent_span_id: val("MENTURA_SPAN_ID") };
  if (trace.parent_span_id && !trace.trace_id) return { command: "usage", usage: "MENTURA_SPAN_ID names a parent span, so MENTURA_TRACE_ID must name its trace" };
  const invocation: Invocation = { function: argv[1], venture, runId, workspace: val("MENTURA_WORKSPACE"), trace, model: val("MENTURA_MODEL") ?? null, harness: val("MENTURA_HARNESS") };
  if (argv[0] === "run" || argv[0] === "lead") return { command: argv[0], invocation };
  const max = flags.get("--max-experiments");
  if (max !== undefined && !/^[1-9][0-9]*$/.test(max)) return { command: "usage", usage: `${USAGE} (--max-experiments is a whole number of at least 1, not ${max})` };
  return { command: "research", invocation: { ...invocation, readsAsOf: val("MENTURA_READS_AS_OF"), ...(max ? { maxExperiments: Number(max) } : {}) } };
}

function parseCmd(argv: readonly string[], val: (k: string) => string | undefined): Parsed {
  const flags = new Map<string, string>();
  for (let i = 1; i < argv.length; i += 2) {
    const [k, v] = [argv[i], argv[i + 1]];
    if (!["--venture", "--by"].includes(k) || !v || flags.has(k)) return { command: "usage", usage: `${USAGE} (unexpected ${k ?? "end"})` };
    flags.set(k, v);
  }
  const venture = flags.get("--venture") ?? val("MENTURA_VENTURE");
  if (!venture) return { command: "usage", usage: `${USAGE} (--venture or MENTURA_VENTURE is required)` };
  const person = flags.get("--by") ?? val("MENTURA_PERSON");
  if (!person) return { command: "usage", usage: `${USAGE} (--by or MENTURA_PERSON names the person speaking)` };
  const trace: TraceJoin = { session: val("MENTURA_SESSION"), trace_id: val("MENTURA_TRACE_ID"), parent_span_id: val("MENTURA_SPAN_ID") };
  return { command: "cmd", person, invocation: { function: "", venture, workspace: val("MENTURA_WORKSPACE"), trace, model: val("MENTURA_MODEL") ?? null, harness: val("MENTURA_HARNESS") } };
}

/** cmd: one slash command against one venture. Prints a CommandResult; exit 0 when ok, 2 when not. */
async function command(inv: Invocation, person: string, stdin: NodeJS.ReadableStream): Promise<number> {
  const { parseCommand, runCommand } = await import("./commands.ts");
  const { commandHost } = await import("./command-host.ts");
  const out = (r: unknown, code: number): number => { process.stdout.write(JSON.stringify(r) + "\n"); return code; };
  let cmd;
  try { cmd = parseCommand(await text(stdin)); } catch (e) { return out({ ok: false, error: (e as Error).message }, 2); }
  const abort = new AbortController();
  for (const s of ["SIGTERM", "SIGINT"] as const) process.once(s, () => abort.abort());
  const host = await commandHost({ venture: inv.venture, workspace: inv.workspace, person, model: modelSource(inv.model), trace: inv.trace, harness: inv.harness, signal: abort.signal });
  if ("error" in host) return out({ ok: false, error: host.error }, 2);
  try { const r = await runCommand(cmd, host.ctx); return out(r, r.ok ? 0 : 2); }
  finally { host.close(); }
}

function parseTraces(argv: readonly string[], val: (k: string) => string | undefined): Parsed {
  const known = ["--venture", "--session", "--trace"];
  const flags = new Map<string, string>();
  for (let i = 1; i < argv.length; i += 2) {
    const [k, v] = [argv[i], argv[i + 1]];
    if (!known.includes(k) || !v || flags.has(k)) return { command: "usage", usage: `${USAGE} (unexpected ${k ?? "end"})` };
    flags.set(k, v);
  }
  const venture = flags.get("--venture");
  if (!venture) return { command: "usage", usage: `${USAGE} (--venture is required)` };
  return { command: "traces", venture, workspace: val("MENTURA_WORKSPACE"), session: flags.get("--session"), trace: flags.get("--trace") };
}

async function traces(p: { venture: string, workspace?: string, session?: string, trace?: string }): Promise<number> {
  const located = ventureOf(p.venture, p.workspace);
  const dir = ventureDir(located.venture, located.workspace) as string | null;
  if (!dir) {
    process.stdout.write(JSON.stringify({ status: "refused", reason: `no venture ${located.venture} in ${located.workspace ?? process.env.MENTURA_WORKSPACE ?? process.cwd()}` }) + "\n");
    return 2;
  }
  const { traceView } = await import("./traces.ts");
  process.stdout.write(JSON.stringify(traceView(dir, { session: p.session, trace: p.trace })) + "\n");
  return 0;
}

/**
 * A research --venture that names a folder holding venture.json becomes that venture's id in its parent folder, the
 * way Naive's router finds a venture. Anything else is an id, resolved in MENTURA_WORKSPACE as for run.
 */
export function ventureOf(venture: string, workspace?: string): { venture: string, workspace?: string } {
  const folder = resolve(venture);
  if (!(venture.includes("/") || venture === ".") || !existsSync(join(folder, "venture.json"))) return { venture, workspace };
  const id = (JSON.parse(readFileSync(join(folder, "venture.json"), "utf8")) as { id?: string }).id;
  return id ? { venture: id, workspace: dirname(folder) } : { venture, workspace };
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
export function exitCode(r: Pick<RunResult | LeadRunResult, "status">): number {
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
 * SIGINT to an AbortController, call runFunctionAgent, print the result, return its exit code. lead: the same with a
 * lead and runLeadAgent. mcp: serve the shim until stdin closes.
 */
export async function main(argv: readonly string[], env: Env, stdin: NodeJS.ReadableStream): Promise<number> {
  const print = (r: RunResult | LeadRunResult | ResearchResult): number => { process.stdout.write(JSON.stringify(r) + "\n"); return exitCode(r); };
  const p = parse(argv, env);
  if (p.command === "usage") return print({ status: "refused", reason: p.usage });
  if (p.command === "mcp") { await (await import("./mcp.ts")).serve(stdin, process.stdout, env); return 0; }
  if (p.command === "traces") return traces(p);
  if (p.command === "cmd") return command(p.invocation, p.person, stdin);
  if (p.command === "harness") {
    const { runHarness } = await import("./harness.ts");
    const abort = new AbortController();
    for (const s of ["SIGTERM", "SIGINT"] as const) process.once(s, () => abort.abort());
    return print(await runHarness(env, await text(stdin), modelSource(env.MENTURA_MODEL ?? null), process.cwd(), abort.signal));
  }
  if (p.command === "research") return print(await research(p.invocation));
  if (p.command === "lead") return print(await lead(p.invocation, stdin));
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

/** lead: derive the lead (an unknown lead is a refusal), read the task from stdin, wire SIGTERM and SIGINT, run it. */
async function lead(inv: Invocation, stdin: NodeJS.ReadableStream): Promise<LeadRunResult> {
  let spec;
  try { spec = leadAgent(inv.function); } catch (e) { return { status: "refused", reason: (e as Error).message }; }
  const task = (await text(stdin)).trim();
  if (!task) return { status: "refused", reason: "no task on stdin" };
  const abort = new AbortController();
  for (const s of ["SIGTERM", "SIGINT"] as const) process.once(s, () => abort.abort());
  const { runLeadAgent } = await import("./lead-agent.ts");
  return await runLeadAgent(spec, task, { venture: inv.venture, workspace: inv.workspace, trace: inv.trace, runId: inv.runId,
    harness: inv.harness, model: modelSource(inv.model), signal: abort.signal });
}

/** research: derive the researcher (an unknown function is a refusal), wire SIGTERM and SIGINT, run it. No stdin. */
async function research(inv: ResearchInvocation): Promise<ResearchResult> {
  let spec;
  try { spec = functionResearcher(inv.function); } catch (e) { return { status: "refused", reason: (e as Error).message }; }
  const abort = new AbortController();
  for (const s of ["SIGTERM", "SIGINT"] as const) process.once(s, () => abort.abort());
  // Imported here, so run and mcp load nothing of the researcher.
  const { runResearcher } = await import("./research.ts");
  return await runResearcher(spec, { ...ventureOf(inv.venture, inv.workspace), trace: inv.trace, runId: inv.runId, harness: inv.harness,
    model: modelSource(inv.model), readsAsOf: inv.readsAsOf, maxExperiments: inv.maxExperiments, signal: abort.signal });
}

async function text(stream: NodeJS.ReadableStream): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const c of stream) chunks.push(typeof c === "string" ? Buffer.from(c) : c);
  return Buffer.concat(chunks).toString("utf8");
}
