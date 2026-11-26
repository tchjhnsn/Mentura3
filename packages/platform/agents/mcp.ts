// The function agents as MCP tools, for any MCP harness and any model (EE-123): stdio, newline-delimited JSON-RPC, protocol 2025-06-18, no
// dependencies, the house pattern of platform/mcp/research.mjs (an exported handle(), the stdio loop only from
// serve()). It holds no run state. Each tools/call spawns one `bin.ts run <function>` process with this server's
// environment unchanged (the caller's trace, model and key variables pass through untouched) and the task on stdin,
// and answers with that process's RunResult. Unlike research.mjs, calls are not chained: an agent run takes minutes,
// and a ping or a cancel must not wait behind it. Calls on one venture serialize at the venture's lock.
//
//   node <EE>/platform/agents/bin.ts mcp       (env: MENTURA_WORKSPACE, MENTURA_VENTURE, MENTURA_SESSION,
//                                               MENTURA_TRACE_ID, MENTURA_SPAN_ID, MENTURA_MODEL, MENTURA_HARNESS)
//
// Tools are derived, one per function agent the venture has staffed: agent_<function> for each id in departments.json
// whose <function>-agent role is an agent's in MENTURA_VENTURE's team plan, or every function when no venture is set
// or found. A venture staffs a second function by adding its role to the team plan; nothing here changes.
//
// Leads (lead agents build plan item 4) are derived the same way: lead_<id> for each role template with a portfolio
// whose role is an agent's in the team plan, each call a `bin.ts lead <id>` child. route_task applies Naive's routing
// rule (engine/route-task.ts): the calling model labels the task with the functions it touches, the measure it serves
// and the decision classes it names, and code picks the target: one function goes to agent_<function>, several in one
// portfolio or across portfolios with an accountable lead go to lead_<id>, and a one-way door, a never-redelegated
// class or a cross-portfolio task with no accountable lead goes to a person.

import { spawn } from "node:child_process";
import type { ChildProcess } from "node:child_process";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";
import { roleOf } from "naive-framework/src/engine/access.mjs";
import { ventureDir } from "naive-framework/src/router/router.mjs";
import type { RunResult } from "./function-agent.ts";
import type { FunctionId } from "./function-spec.ts";
import { functionAgent, functionIds } from "./function-spec.ts";
import type { LeadRunResult } from "./lead-agent.ts";
import type { LeadId, RouteAnswer } from "./lead-spec.ts";
import { leadAgent, leadIds, leadToolName, routeFor } from "./lead-spec.ts";

type Env = Readonly<Record<string, string | undefined>>;

/** An MCP tool as tools/list returns it. */
export interface Tool { name: string, description: string, inputSchema: Record<string, unknown> }

/** A JSON-RPC message from the client. */
export interface Message { jsonrpc?: "2.0", id?: number | string, method: string, params?: { name?: string, arguments?: unknown, requestId?: number | string } }

/** A JSON-RPC reply, or null for a notification. */
export type Reply = { jsonrpc: "2.0", id: number | string | undefined, result?: unknown, error?: { code: number, message: string } } | null;

/** The tool name for a function: agent_strategy, agent_marketing-and-sales. */
export const toolName = (fn: FunctionId): string => `agent_${fn}`;

/**
 * The tools for this server's environment, re-derived on every tools/list, so a team-plan change shows at the next
 * list: agent_<function> and lead_<id> for each staffed role, and route_task. A run tool's input is
 * { task, venture?, run_id? }; venture defaults to MENTURA_VENTURE, run_id is the caller's idempotency key.
 */
export function toolsFor(env: Env): Tool[] {
  const dir = dirOf(env);
  const staffed = (role: string): boolean => !dir || (roleOf(dir, role) as { occupant?: string } | null)?.occupant === "agent";
  const agents = functionIds().filter((id) => staffed(functionAgent(id).role)).map((id): Tool => {
    const s = functionAgent(id);
    return {
      name: toolName(id),
      description: `The ${s.label} function agent (APQC ${s.charter.apqc}): ${s.charter.governance}; ${s.charter.operations}. It works the venture's records through Naive's router as ${s.role}, within the routes the venture's team plan gives it, and returns its answer, the records it wrote, and the drafts held for a person with the command that accepts each. Only a person accepts a draft. A run can take minutes; a busy result means another agent is working on the venture, so try again later with the same run_id.`,
      inputSchema: RUN_INPUT(env),
    };
  });
  const leads = leadIds().filter((id) => staffed(leadAgent(id).role)).map((id): Tool => {
    const s = leadAgent(id);
    return {
      name: leadToolName(id),
      description: `The ${s.label}, a lead over ${s.portfolio.join(", ")}. It reads every record and writes only its lead plan, decisions and handoffs: for a task that spans functions it adds a bet to its plan and writes one handoff per function involved, addressed to that function's agent and requested by ${s.role}, and returns them with any drafts held for a person. It never writes a function's records. Call route_task first: it says when a task belongs to a lead. A run can take minutes; a busy result means another agent is working on the venture, so try again later with the same run_id.`,
      inputSchema: RUN_INPUT(env),
    };
  });
  return [...agents, ...leads, ROUTE_TOOL(env), COMMAND_TOOL(env)];
}

const RUN_INPUT = (env: Env): Record<string, unknown> => ({ type: "object", properties: {
  task: { type: "string", description: "What the agent should do, in plain words" },
  venture: { type: "string", description: `The venture's id${env.MENTURA_VENTURE ? ` (default ${env.MENTURA_VENTURE})` : ""}` },
  run_id: { type: "string", format: "uuid", description: "Your idempotency key: the same run_id again reports the first run instead of running twice" },
}, required: ["task"] });

/** The routing tool: the model classifies, Naive's rule decides (lead agents design, "Routing a task"). */
const ROUTE_TOOL = (env: Env): Tool => ({
  name: "route_task",
  description: "Says who takes a task, by Naive's routing rule, before you call an agent. Label the task with the functions it touches (ids from departments.json), the telos measure it serves if you can tell, and any decision classes it names. The answer is the tool to call (agent_<function> for one function, lead_<id> for several), or no tool when a person must decide (a one-way door, a never-redelegated class, or functions across portfolios with no accountable lead), with the reason. When the target is not staffed, it carries the team-plan entry a person would add.",
  inputSchema: { type: "object", properties: {
    functions: { type: "array", items: { type: "string", enum: functionIds() }, description: "The functions the task touches" },
    measure: { type: "string", description: "The telos measure id the task serves, if known" },
    classes: { type: "array", items: { type: "string" }, description: "Decision class ids the task names (spend-money, production-ship and so on)" },
    venture: { type: "string", description: `The venture's id${env.MENTURA_VENTURE ? ` (default ${env.MENTURA_VENTURE})` : ""}` },
  }, required: ["functions"] },
});

/** The slash command tool: meetings that walk a function workflow with its agent, what is due, memory and tooling (commands.ts). */
const COMMAND_TOOL = (env: Env): Tool => ({
  name: "command",
  description: "Runs one Mentura slash command on the venture and returns its result. /next says what is due; /meet <function> [<workflow>] opens a meeting that walks that workflow with the function's agent and stops when it needs the person; /answer, /done, /skip, /handoff <meeting> answer the item it waits on; /revisit and /end loop back over skipped items or close it; /meetings, /skipped, /memory <role>, /tools <need>, /help. Show the person what the meeting waits on and pass their words back with /answer; never answer for them.",
  inputSchema: { type: "object", properties: {
    text: { type: "string", description: "The command line, starting with /" },
    by: { type: "string", description: `The person speaking${env.MENTURA_PERSON ? ` (default ${env.MENTURA_PERSON})` : ""}` },
    venture: { type: "string", description: `The venture's id${env.MENTURA_VENTURE ? ` (default ${env.MENTURA_VENTURE})` : ""}` },
  }, required: ["text"] },
});

/** Runs `bin.ts cmd` once and resolves with its one line of JSON. Injected so a test can stand in for it. */
export type SpawnCommand = (_args: { venture: string, by: string, text: string }, _env: Env) => { child: ChildProcess, result: Promise<{ ok: boolean, [k: string]: unknown }> };

const dirOf = (env: Env, venture = env.MENTURA_VENTURE): string | null =>
  venture ? ventureDir(venture, env.MENTURA_WORKSPACE || undefined) as string | null : null;

/** Routes one classified task for the venture in env (or none): what route_task answers. Pure over the venture's files. */
export function routeTool(args: { functions?: unknown, measure?: unknown, classes?: unknown, venture?: unknown }, env: Env): RouteAnswer | { error: string } {
  const strings = (v: unknown): string[] | null => Array.isArray(v) && v.every((x) => typeof x === "string") ? v as string[] : null;
  const functions = strings(args.functions);
  if (!functions) return { error: "functions is required: the function ids the task touches" };
  const classes = args.classes === undefined ? [] : strings(args.classes);
  if (!classes) return { error: "classes is a list of decision class ids" };
  const venture = typeof args.venture === "string" && args.venture ? args.venture : env.MENTURA_VENTURE;
  return routeFor({ functions, classes, measure: typeof args.measure === "string" && args.measure ? args.measure : null }, dirOf(env, venture));
}

/** Which run a tool call starts: a function agent (bin.ts run) or a lead (bin.ts lead). */
export type Target = { kind: "run", id: FunctionId } | { kind: "lead", id: LeadId };

/** Starts one run process for a tool call and resolves with its result. Injected so a test can stand in for it. */
export type SpawnRun = (_target: Target, _args: { venture: string, run_id?: string, task: string }, _env: Env) => { child: ChildProcess, result: Promise<RunResult | LeadRunResult> };

/** The children still running, by request id, so notifications/cancelled can stop one. */
const running = new Map<number | string, ChildProcess>();

/**
 * Handles one message. tools/call spawns the run, keeps the child under the request id so notifications/cancelled can
 * SIGTERM it (the run ends its open spans and releases its lock), and replies with the RunResult as text and as
 * structuredContent. isError is true unless the status is done or already-ran.
 */
export async function handle(msg: Message, env: Env, spawnRun: SpawnRun = spawnBin, spawnCommand: SpawnCommand = spawnCmd): Promise<Reply> {
  const { id, method, params = {} } = msg;
  const reply = (result: unknown): Reply => ({ jsonrpc: "2.0", id, result });
  const failed = (text: string): Reply => reply({ content: [{ type: "text", text }], isError: true });
  switch (method) {
    case "initialize": return reply({ protocolVersion: "2025-06-18", capabilities: { tools: {} }, serverInfo: { name: "mentura-agents", version: "0.1.0" },
      instructions: "Call route_task first to learn who takes a task. Each agent_<function> tool runs that function's agent on the venture's records; each lead_<id> tool runs a lead, which writes handoffs for the function agents. When route_task names no tool, a person decides: tell them why. Show the person every held draft and its accept command; never run it yourself." });
    case "notifications/initialized": return null;
    case "notifications/cancelled": { const c = params.requestId === undefined ? undefined : running.get(params.requestId); c?.kill("SIGTERM"); return null; }
    case "ping": return reply({});
    case "tools/list": return reply({ tools: toolsFor(env) });
    case "tools/call": {
      if (params.name === "route_task") {
        const r = routeTool((params.arguments ?? {}) as Record<string, unknown>, env);
        return "error" in r ? failed(r.error) : reply({ content: [{ type: "text", text: JSON.stringify(r, null, 2) }], structuredContent: r, isError: false });
      }
      if (params.name === "command") {
        const a = (params.arguments ?? {}) as { text?: unknown, by?: unknown, venture?: unknown };
        const venture = typeof a.venture === "string" && a.venture ? a.venture : env.MENTURA_VENTURE;
        const by = typeof a.by === "string" && a.by ? a.by : env.MENTURA_PERSON;
        if (typeof a.text !== "string" || !a.text.trim().startsWith("/")) return failed("text is required: a command line starting with /, such as /next");
        if (!venture) return failed("venture is required: pass it, or set MENTURA_VENTURE in this server's environment");
        if (!by) return failed("by is required: the person speaking, or set MENTURA_PERSON in this server's environment");
        const { child, result } = spawnCommand({ venture, by, text: a.text }, env);
        if (id !== undefined) running.set(id, child);
        try { const r = await result; return reply({ content: [{ type: "text", text: JSON.stringify(r, null, 2) }], structuredContent: r, isError: !r.ok }); }
        catch (e) { return failed(String((e as Error).message ?? e)); }
        finally { if (id !== undefined) running.delete(id); }
      }
      const fn = functionIds().find((f) => toolName(f) === params.name);
      const lead = fn ? undefined : leadIds().find((l) => leadToolName(l) === params.name);
      const target: Target | null = fn ? { kind: "run", id: fn } : lead ? { kind: "lead", id: lead } : null;
      if (!target) return { jsonrpc: "2.0", id, error: { code: -32602, message: `unknown tool ${params.name}` } };
      const a = (params.arguments ?? {}) as { task?: unknown, venture?: unknown, run_id?: unknown };
      const venture = typeof a.venture === "string" && a.venture ? a.venture : env.MENTURA_VENTURE;
      if (typeof a.task !== "string" || !a.task.trim()) return failed("task is required: say what the agent should do");
      if (!venture) return failed("venture is required: pass it, or set MENTURA_VENTURE in this server's environment");
      const { child, result } = spawnRun(target, { venture, task: a.task, ...(typeof a.run_id === "string" ? { run_id: a.run_id } : {}) }, env);
      if (id !== undefined) running.set(id, child);
      try {
        const r = await result;
        return reply({ content: [{ type: "text", text: JSON.stringify(r, null, 2) }], structuredContent: r, isError: r.status !== "done" && r.status !== "already-ran" });
      }
      catch (e) { return failed(String((e as Error).message ?? e)); }
      finally { if (id !== undefined) running.delete(id); }
    }
    default: return id === undefined ? null : { jsonrpc: "2.0", id, error: { code: -32601, message: `method not found: ${method}` } };
  }
}

/** The stdio loop: every line is handled as it arrives, each reply written when it is ready. Resolves when stdin closes. */
export function serve(stdin: NodeJS.ReadableStream, stdout: NodeJS.WritableStream, env: Env): Promise<void> {
  const pending = new Set<Promise<void>>();
  const rl = createInterface({ input: stdin });
  rl.on("line", (line) => {
    if (!line.trim()) return;
    let msg: Message;
    try { msg = JSON.parse(line) as Message; }
    catch { stdout.write(JSON.stringify({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "parse error" } }) + "\n"); return; }
    const p = handle(msg, env).then((r) => { if (r) stdout.write(JSON.stringify(r) + "\n"); });
    pending.add(p);
    void p.finally(() => pending.delete(p));
  });
  // When the client goes away, its runs are stopped the way a cancel stops them, so each releases its venture's lock.
  return new Promise((resolve) => rl.on("close", () => { for (const c of running.values()) c.kill("SIGTERM"); void Promise.allSettled([...pending]).then(() => resolve()); }));
}

const BIN = fileURLToPath(new URL("./bin.ts", import.meta.url));

/** One `bin.ts run` (or `bin.ts lead`) child: the task on stdin, its one line of stdout parsed as the result. */
const spawnCmd: SpawnCommand = (args, env) => {
  const child = spawn(process.execPath, [BIN, "cmd", "--venture", args.venture, "--by", args.by], { env: { ...env }, stdio: ["pipe", "pipe", "inherit"] });
  child.stdin?.end(args.text);
  const result = new Promise<{ ok: boolean, [k: string]: unknown }>((resolve, reject) => {
    let out = "";
    child.stdout?.on("data", (d: Buffer) => { out += d.toString("utf8"); });
    child.on("error", reject);
    child.on("close", (code, signal) => {
      try { resolve(JSON.parse(out.trim().split("\n").at(-1) ?? "") as { ok: boolean }); }
      catch { reject(new Error(`the command process ended (${signal ?? `exit ${code}`}) without a result`)); }
    });
  });
  return { child, result };
};

const spawnBin: SpawnRun = (target, args, env) => {
  const child = spawn(process.execPath, [BIN, target.kind, target.id, "--venture", args.venture, ...(args.run_id ? ["--run-id", args.run_id] : [])],
    { env: { ...env }, stdio: ["pipe", "pipe", "inherit"] });
  child.stdin?.end(args.task);
  const result = new Promise<RunResult | LeadRunResult>((resolve, reject) => {
    let out = "";
    child.stdout?.on("data", (d: Buffer) => { out += d.toString("utf8"); });
    child.on("error", reject);
    child.on("close", (code, signal) => {
      try { resolve(JSON.parse(out.trim().split("\n").at(-1) ?? "") as RunResult | LeadRunResult); }
      catch { reject(new Error(`the run process ended (${signal ?? `exit ${code}`}) without a result`)); }
    });
  });
  return { child, result };
};
