// The function agents as MCP tools, for Grokbot (EE-123): stdio, newline-delimited JSON-RPC, protocol 2025-06-18, no
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

import { spawn } from "node:child_process";
import type { ChildProcess } from "node:child_process";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";
import { roleOf } from "naive-framework/src/engine/access.mjs";
import { ventureDir } from "naive-framework/src/router/router.mjs";
import type { RunResult } from "./function-agent.ts";
import type { FunctionId } from "./function-spec.ts";
import { functionAgent, functionIds } from "./function-spec.ts";

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
 * list. Input: { task, venture?, run_id? }; venture defaults to MENTURA_VENTURE, run_id is the caller's idempotency key.
 */
export function toolsFor(env: Env): Tool[] {
  const dir = env.MENTURA_VENTURE ? ventureDir(env.MENTURA_VENTURE, env.MENTURA_WORKSPACE || undefined) as string | null : null;
  const staffed = (id: FunctionId): boolean => !dir || (roleOf(dir, functionAgent(id).role) as { occupant?: string } | null)?.occupant === "agent";
  return functionIds().filter(staffed).map((id) => {
    const s = functionAgent(id);
    return {
      name: toolName(id),
      description: `The ${s.label} function agent (APQC ${s.charter.apqc}): ${s.charter.governance}; ${s.charter.operations}. It works the venture's records through Naive's router as ${s.role}, within the routes the venture's team plan gives it, and returns its answer, the records it wrote, and the drafts held for a person with the command that accepts each. Only a person accepts a draft. A run can take minutes; a busy result means another agent is working on the venture, so try again later with the same run_id.`,
      inputSchema: { type: "object", properties: {
        task: { type: "string", description: "What the agent should do, in plain words" },
        venture: { type: "string", description: `The venture's id${env.MENTURA_VENTURE ? ` (default ${env.MENTURA_VENTURE})` : ""}` },
        run_id: { type: "string", format: "uuid", description: "Your idempotency key: the same run_id again reports the first run instead of running twice" },
      }, required: ["task"] },
    };
  });
}

/** Starts one run process for a tool call and resolves with its RunResult. Injected so a test can stand in for it. */
export type SpawnRun = (_fn: FunctionId, _args: { venture: string, run_id?: string, task: string }, _env: Env) => { child: ChildProcess, result: Promise<RunResult> };

/** The children still running, by request id, so notifications/cancelled can stop one. */
const running = new Map<number | string, ChildProcess>();

/**
 * Handles one message. tools/call spawns the run, keeps the child under the request id so notifications/cancelled can
 * SIGTERM it (the run ends its open spans and releases its lock), and replies with the RunResult as text and as
 * structuredContent. isError is true unless the status is done or already-ran.
 */
export async function handle(msg: Message, env: Env, spawnRun: SpawnRun = spawnBin): Promise<Reply> {
  const { id, method, params = {} } = msg;
  const reply = (result: unknown): Reply => ({ jsonrpc: "2.0", id, result });
  const failed = (text: string): Reply => reply({ content: [{ type: "text", text }], isError: true });
  switch (method) {
    case "initialize": return reply({ protocolVersion: "2025-06-18", capabilities: { tools: {} }, serverInfo: { name: "mentura-agents", version: "0.1.0" },
      instructions: "Each agent_<function> tool runs that function's agent on the venture's records. Show the person every held draft and its accept command; never run it yourself." });
    case "notifications/initialized": return null;
    case "notifications/cancelled": { const c = params.requestId === undefined ? undefined : running.get(params.requestId); c?.kill("SIGTERM"); return null; }
    case "ping": return reply({});
    case "tools/list": return reply({ tools: toolsFor(env) });
    case "tools/call": {
      const fn = functionIds().find((f) => toolName(f) === params.name);
      if (!fn) return { jsonrpc: "2.0", id, error: { code: -32602, message: `unknown tool ${params.name}` } };
      const a = (params.arguments ?? {}) as { task?: unknown, venture?: unknown, run_id?: unknown };
      const venture = typeof a.venture === "string" && a.venture ? a.venture : env.MENTURA_VENTURE;
      if (typeof a.task !== "string" || !a.task.trim()) return failed("task is required: say what the agent should do");
      if (!venture) return failed("venture is required: pass it, or set MENTURA_VENTURE in this server's environment");
      const { child, result } = spawnRun(fn, { venture, task: a.task, ...(typeof a.run_id === "string" ? { run_id: a.run_id } : {}) }, env);
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

/** One `bin.ts run` child: the task on stdin, its one line of stdout parsed as the RunResult. */
const spawnBin: SpawnRun = (fn, args, env) => {
  const child = spawn(process.execPath, [BIN, "run", fn, "--venture", args.venture, ...(args.run_id ? ["--run-id", args.run_id] : [])],
    { env: { ...env }, stdio: ["pipe", "pipe", "inherit"] });
  child.stdin?.end(args.task);
  const result = new Promise<RunResult>((resolve, reject) => {
    let out = "";
    child.stdout?.on("data", (d: Buffer) => { out += d.toString("utf8"); });
    child.on("error", reject);
    child.on("close", (code, signal) => {
      try { resolve(JSON.parse(out.trim().split("\n").at(-1) ?? "") as RunResult); }
      catch { reject(new Error(`the run process ended (${signal ?? `exit ${code}`}) without a result`)); }
    });
  });
  return { child, result };
};
