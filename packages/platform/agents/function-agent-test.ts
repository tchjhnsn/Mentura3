// Tests the function agents offline (EE-123): every function in the installed Naive derives a spec; the strategy agent,
// run with a scripted model (fakeModel), works the venture's records as strategy-agent through Naive's router, reads
// its skills under /function/ and may not write there, is refused outside its team-plan reach, has a decision held as
// a draft and reports it with the accept command, writes its run into the caller's session nested under the caller's
// span, stamps its provenance lines with the same session, role, model and trace, restores the process environment,
// and leaves check-traces passing. A retry with the same run id reports the same outcome without loading a model. A
// second run in the same process is refused while one is active, a second process on the same venture gets busy, a
// dead holder's lock is reclaimed, a function the venture has not staffed is refused with the team-plan entry to add,
// and the MCP shim lists only staffed functions and carries a call through a real child process.
//
//   node platform/agents/function-agent-test.ts

import { spawn, spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";
import { AIMessage } from "@langchain/core/messages";
import { fakeModel } from "@langchain/core/testing";
import { span, spans } from "naive-framework/src/core/instrumentation.mjs";
import { entries } from "naive-framework/src/core/provenance.mjs";
import { routeGlob } from "naive-framework/src/engine/access.mjs";
import { functionWrites } from "naive-framework/src/engine/agents/reach.mjs";
import { routes } from "naive-framework/src/router/router.mjs";
import { naivePath } from "../naive.ts";
import type { ModelSource, RunResult } from "./function-agent.ts";
import { runFunctionAgent, runIdOf } from "./function-agent.ts";
import { functionAgent, functionIds, teamPlanEntry } from "./function-spec.ts";
import { setTraceRedactor } from "./trace-redact.ts";

let failed = 0;
const ok = (name: string, cond: boolean, detail = "") => { console.log(`${cond ? "pass" : "FAIL"}  ${name}${cond || !detail ? "" : `: ${detail}`}`); if (!cond) failed++; };
const BIN = fileURLToPath(new URL("./bin.ts", import.meta.url));

// ---- 1. Every function derives a spec from Naive's data (no list here to keep in step) ----
const ids = functionIds();
ok("every function in departments.json derives a spec", ids.length === 13 && ids.every((id) => { try { functionAgent(id); return true; } catch { return false; } }));
ok("each role is <function>-agent", ids.every((id) => functionAgent(id).role === `${id}-agent`));
const table = (routes() as { route: string }[]).map((r) => r.route.replace("[id]", "x"));
ok("every suggested write glob matches a route", ids.every((id) => functionAgent(id).writes.every((g) => table.some((r) => routeGlob(g).test(r)))));
const strategy = functionAgent("strategy");
ok("a function agent's writes are the routes the router allows", ids.every((id) => JSON.stringify([...functionAgent(id).writes]) === JSON.stringify(functionWrites(id))));
ok("strategy writes decisions and its own foundation and validation routes", strategy.writes.includes("decisions/*") && strategy.writes.includes("foundation/telos") && strategy.writes.includes("validation/interviews/*"), JSON.stringify(strategy.writes));
ok("no function's derived reach can write the team plan", ids.every((id) => !functionAgent(id).writes.some((g) => routeGlob(g).test("people/team-plan"))));
ok("strategy's skills come from its module and its validation kit", ["telos", "chief-of-staff", "problem-validation", "validation-score"].every((n) => strategy.skills.some((s) => s.name === n)) && strategy.skills.every((s) => /^\/function\/(skills|kits\/validation\/skills)\//.test(s.path)), strategy.skills.map((s) => s.path).join());
ok("an unknown function is an error naming the valid ones", (() => { try { functionAgent("sales"); return false; } catch (e) { return /strategy/.test(String(e)); } })());

// ---- A venture staffed with the strategy agent only, written as a person would ----
const ws = mkdtempSync(join(tmpdir(), "mentura-fn-agents-"));
const init = spawnSync("node", [naivePath("packages/naive/src/engine/init-venture.mjs"), join(ws, "kettle"), "kettle", "--layers", "purpose"], { encoding: "utf8" });
if (init.status !== 0) throw new Error(init.stderr);
const dir = join(ws, "kettle");
process.env.MENTURA_WORKSPACE = ws;
const RUN_KEYS = ["NAIVE_TRACES", "MENTURA_TRACE_ID", "MENTURA_SPAN_ID", "MENTURA_SESSION", "MENTURA_ACTOR", "MENTURA_ACTOR_ID", "MENTURA_MODEL", "MENTURA_HARNESS", "LANGSMITH_TRACING", "LANGCHAIN_TRACING_V2"];
for (const k of RUN_KEYS) delete process.env[k];
// No "traces": true here on purpose: a function agent run is traced anyway.
writeFileSync(join(dir, "naive.config.json"), JSON.stringify({}));
mkdirSync(join(dir, "operations"), { recursive: true });
writeFileSync(join(dir, "operations/team-plan.json"), JSON.stringify({ venture: "kettle", roles: [{ id: "founder", occupant: "person", needed_by: "discovery", status: "filled" }, teamPlanEntry(strategy, "discovery")] }, null, 2));
const team = JSON.parse(readFileSync(join(dir, "decisions/venture.team.decision.json"), "utf8")) as Record<string, unknown>;
const pricing: Record<string, unknown> = { ...team, id: "pricing", question: "What do we charge for the first kettle?", options: ["Free beta", "Paid from day one"], status: "open" };
delete pricing.decides; delete pricing.unlocks;
writeFileSync(join(dir, "decisions/pricing.decision.json"), JSON.stringify(pricing, null, 2) + "\n");

// The caller's trace, as the harness would hand it down.
const SESSION = "harness-7", TRACE = randomUUID(), PARENT = randomUUID(), RUN = runIdOf(randomUUID());
const caller = { session: SESSION, trace_id: TRACE, parent_span_id: PARENT };
const scripted = (m: ReturnType<typeof fakeModel>): ModelSource => ({ name: "fake:scripted", load: async () => m });
const noModel: ModelSource = { name: "fake:none", load: async () => { throw new Error("the model was loaded"); } };
const textOf = (c: unknown): string => typeof c === "string" ? c : Array.isArray(c) ? c.map((b: { text?: string }) => b.text ?? JSON.stringify(b)).join("\n") : JSON.stringify(c);

// ---- 2. The strategy run ----
// respondWithTools would echo the whole prompt as the message content, which doubles each turn until deepagents summarizes.
const step = (name: string, args: Record<string, unknown>, id: string) => new AIMessage({ content: "", tool_calls: [{ name, args, id, type: "tool_call" }] });
const model = fakeModel()
  .respond(step("ls", { path: "/function/skills/" }, "c1"))
  .respond(step("read_file", { file_path: "/function/skills/telos/SKILL.md" }, "c2"))
  .respond(step("write_file", { file_path: "/function/skills/telos/NOTES.md", content: "mine now" }, "c3"))
  .respond(step("read_file", { file_path: "/decisions/pricing" }, "c4"))
  .respond(step("edit_file", { file_path: "/decisions/pricing", old_string: "What do we charge for the first kettle?", new_string: "What do we charge for the first kettle, and from when?" }, "c5"))
  .respond(step("edit_file", { file_path: "/decisions/pricing", old_string: "\"status\": \"open\"", new_string: "\"status\": \"decided\"" }, "c6"))
  .respond(step("write_file", { file_path: "/governance/board", content: "{}" }, "c7"))
  .respond(new AIMessage("I sharpened the pricing question and proposed deciding it; a person has to accept that."));
const r = await runFunctionAgent(strategy, "Tighten the pricing decision.", { venture: "kettle", model: scripted(model), trace: caller, runId: RUN, harness: "claude-code" });

ok("the run is done with the model's answer", r.status === "done" && r.answer.startsWith("I sharpened"), JSON.stringify(r));
const calls = (model as unknown as { calls: { messages: { content: unknown, getType: () => string }[] }[] }).calls;
const system = textOf(calls[0]?.messages[0]?.content);
ok("the system prompt names the function, the role and its reach", system.includes("Strategy function agent of the venture kettle") && system.includes("strategy-agent") && system.includes("foundation/telos"), system.slice(0, 400));
ok("a skill's description reaches the system prompt (the skills middleware read the mounted module)", system.includes("Start with the end: help the owner state what the venture is for"), system.slice(-1500));
const last = calls.at(-1)?.messages ?? [];
const tool = last.filter((m) => m.getType() === "tool").map((m) => textOf(m.content));
ok("ls /function/skills/ lists the function's skills", /telos/.test(tool[0] ?? "") && /board-design/.test(tool[0] ?? ""), tool[0]);
ok("read_file returns a skill's SKILL.md", /Start with the end/.test(tool[1] ?? ""), tool[1]?.slice(0, 200));
ok("writing under /function/ is denied", /permission denied/i.test(tool[2] ?? ""), tool[2]);
const after = JSON.parse(readFileSync(join(dir, "decisions/pricing.decision.json"), "utf8")) as { question: string, status: string };
ok("the question edit went through the router", after.question.endsWith("and from when?") && after.status === "open", JSON.stringify(after));
ok("deciding was held for a person, and the agent was told", /Held for a person/.test(tool[5] ?? ""), tool[5]);
ok("a write outside the team-plan reach is refused", /strategy-agent/.test(tool[6] ?? "") && /governance\/board/.test(tool[6] ?? ""), tool[6]);
ok("the held decision comes back with its accept command", r.status === "done" && r.held.length === 1 && r.held[0].route === "decisions/pricing" && r.held[0].accept === "mentura accept decisions/pricing --venture kettle", JSON.stringify(r));
ok("the written record is reported", r.status === "done" && r.wrote.some((w) => w.entity === "decisions/pricing.decision.json"), JSON.stringify(r));

const run = spans(dir, SESSION) as { span_id: string, parent_span_id?: string, trace_id: string, name: string }[];
const root = run.find((s) => s.span_id === RUN);
ok("the run is in the caller's session file", !!root, run.map((s) => s.name).join());
ok("its root span is invoke_agent strategy, nested under the caller's span", root?.name === "invoke_agent strategy" && root.parent_span_id === PARENT, JSON.stringify(root));
ok("every span of the run is in the caller's trace", run.length > 5 && run.every((s) => s.trace_id === TRACE));
ok("with content off, the trace file does not contain the task", !readFileSync(join(dir, "traces", `${SESSION}.jsonl`), "utf8").includes("Tighten the pricing decision."));
const lines = (entries(dir) as { span?: { trace_id: string }, agent?: Record<string, string> }[]).filter((e) => e.span?.trace_id === TRACE);
ok("provenance names the same session, role, model and harness", lines.length > 0 && lines.every((e) => e.agent?.session === SESSION && e.agent?.id === "strategy-agent" && e.agent?.model === "fake:scripted" && e.agent?.harness === "claude-code"), JSON.stringify(lines.map((e) => e.agent)));
ok("the process environment is restored after the run", RUN_KEYS.every((k) => process.env[k] === undefined) && process.env.MENTURA_WORKSPACE === ws);
// The harness writes its own span when its turn ends; then the venture's traces are whole.
span(dir, { name: "invoke_agent harness", kind: "agent", trace_id: TRACE, span_id: PARENT, parent_span_id: null, session: SESSION }, { force: true });
const check = spawnSync("node", [naivePath("packages/naive/src/checks/check-traces.ts"), dir], { encoding: "utf8" });
ok("check-traces passes with no warnings", check.status === 0 && !/warning:/.test(check.stdout + check.stderr), check.stdout + check.stderr);

ok("the run saved a checkpoint", existsSync(join(dir, ".naive", "agent-checkpoints.sqlite")));
const traceFile = join(dir, "traces", `${SESSION}.jsonl`);
const traceAside = `${traceFile}.aside`;
renameSync(traceFile, traceAside);
const callsBefore = calls.length;
const resumed = await runFunctionAgent(strategy, "Tighten the pricing decision.", { venture: "kettle", model: scripted(model), trace: caller, runId: RUN, harness: "claude-code" });
ok("a finished run whose span is missing returns the same answer and does not call the model", resumed.status === "done" && r.status === "done" && resumed.answer === r.answer && calls.length === callsBefore, JSON.stringify(resumed));
renameSync(traceAside, traceFile);

// ---- 3. Idempotent: the same run id reports what the run did, without a model ----
const count = spans(dir, SESSION).length;
const again = await runFunctionAgent(strategy, "Tighten the pricing decision.", { venture: "kettle", model: noModel, trace: caller, runId: RUN });
ok("a retry with the same run id is already-ran with the same outcome", again.status === "already-ran" && r.status === "done" && JSON.stringify([again.held, again.wrote]) === JSON.stringify([r.held, r.wrote]), JSON.stringify(again));
ok("a retry writes no span", spans(dir, SESSION).length === count);

// ---- 4. One run at a time per process ----
let release = (): void => {};
const gate = new Promise<void>((res) => { release = res; });
const first = runFunctionAgent(strategy, "Wait.", { venture: "kettle", model: { name: "fake:gated", load: async () => { await gate; throw new Error("released"); } }, trace: caller });
const second = await runFunctionAgent(strategy, "Me too.", { venture: "kettle", model: noModel, trace: caller }).then(() => "ran", (e: Error) => e.message);
release();
const firstResult = await first;
ok("a second run in the same process is refused while one is active", /already active in this process/.test(second), second);
ok("the first run still ends (refused here: its model would not load)", firstResult.status === "refused" && /released/.test(firstResult.reason), JSON.stringify(firstResult));

// ---- 5. One run at a time per venture, across processes ----
const lock = join(dir, ".naive", "agent-run.lock");
writeFileSync(lock, String(process.pid));
const busy = spawnSync("node", [BIN, "run", "strategy", "--venture", "kettle"], { input: "Tighten the pricing decision.", encoding: "utf8", env: { ...process.env, MENTURA_MODEL: "fake:none" } });
const br = JSON.parse(busy.stdout || "{}") as RunResult;
ok("a second process on a locked venture is busy (exit 75) and names the holder", busy.status === 75 && br.status === "busy" && br.holder === process.pid, busy.stdout + busy.stderr);
const dead = spawnSync("node", ["-e", ""]).pid;
writeFileSync(lock, String(dead));
const reclaimed = await runFunctionAgent(strategy, "Tighten the pricing decision.", { venture: "kettle", model: noModel, trace: caller, runId: RUN });
ok("a dead holder's lock is reclaimed", reclaimed.status === "already-ran", JSON.stringify(reclaimed));
rmSync(lock, { force: true });

// ---- 6. A function the venture has not staffed is refused, with the entry to add (no model needed) ----
const refused = spawnSync("node", [BIN, "run", "products", "--venture", "kettle"], { input: "Write the roadmap.", encoding: "utf8" });
const rr = JSON.parse(refused.stdout || "{}") as { status?: string, fix?: string };
ok("an unstaffed function is refused (exit 2) with its team-plan entry", refused.status === 2 && rr.status === "refused" && /"id":\s*"products-agent"/.test(rr.fix ?? ""), refused.stdout + refused.stderr);
const usage = spawnSync("node", [BIN, "run", "strategy", "--venture", "kettle", "--run-id", "not-a-uuid"], { input: "x", encoding: "utf8" });
ok("a bad run id is a usage refusal (exit 2)", usage.status === 2 && /UUID/.test(usage.stdout), usage.stdout + usage.stderr);

// ---- 7. The MCP shim: derived tools, and a call through a real child process ----
const shim = spawn("node", [BIN, "mcp"], { env: { ...process.env, MENTURA_VENTURE: "kettle", MENTURA_SESSION: SESSION, MENTURA_TRACE_ID: TRACE, MENTURA_SPAN_ID: PARENT, MENTURA_MODEL: "fake:none" }, stdio: ["pipe", "pipe", "inherit"] });
interface ShimReply { id: number, result?: { tools?: { name: string }[], isError?: boolean, structuredContent?: RunResult } }
const replies = new Map<number, (_reply: ShimReply) => void>();
createInterface({ input: shim.stdout }).on("line", (l) => { const m = JSON.parse(l) as ShimReply; replies.get(m.id)?.(m); });
const ask = (id: number, method: string, params: unknown = {}) => new Promise<ShimReply>((res) => { replies.set(id, res); shim.stdin.write(JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n"); });
await ask(1, "initialize", { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "test", version: "0" } });
const listed = await ask(2, "tools/list");
ok("the shim lists only the functions the venture has staffed, and route_task", JSON.stringify(listed.result?.tools?.map((t) => t.name)) === JSON.stringify(["agent_strategy", "route_task"]), JSON.stringify(listed.result?.tools?.map((t) => t.name)));
const called = await ask(3, "tools/call", { name: "agent_strategy", arguments: { task: "Tighten the pricing decision.", run_id: RUN } });
const sc = called.result?.structuredContent;
ok("a call through the shim reaches the same run through the environment alone (already-ran, same drafts)", called.result?.isError === false && sc?.status === "already-ran" && r.status === "done" && JSON.stringify(sc.held) === JSON.stringify(r.held), JSON.stringify(called.result));
shim.stdin.end();
await new Promise((res) => shim.on("close", res));

// ---- 8. Content on: the root span keeps the task and the answer, and a redactor runs first ----
writeFileSync(join(dir, "naive.config.json"), JSON.stringify({ traces: { spans: true, content: true } }));
const marked = "Price the second kettle. TRACE_MARKER";
const answered = "Charge for the first kettle from day one.";
const contentModel = fakeModel().respond(new AIMessage(answered));
const SESSION_C = "harness-content", RUN_C = runIdOf(randomUUID());
setTraceRedactor((text) => text.replaceAll("TRACE_MARKER", "[redacted]"));
let rc: RunResult;
try {
  rc = await runFunctionAgent(strategy, marked, { venture: "kettle", model: scripted(contentModel), trace: { session: SESSION_C, trace_id: randomUUID() }, runId: RUN_C, harness: "claude-code" });
}
finally { setTraceRedactor((text) => text); }
const contentRoot = (spans(dir, SESSION_C) as { span_id: string, attributes?: Record<string, unknown> }[]).find((s) => s.span_id === RUN_C);
ok("with content on, the root span stores the task and the answer", rc.status === "done" && contentRoot?.attributes?.["gen_ai.input.messages"] === "Price the second kettle. [redacted]" && contentRoot?.attributes?.["gen_ai.output.messages"] === answered && contentRoot?.attributes?.["gen_ai.operation.name"] === "invoke_agent", JSON.stringify(contentRoot?.attributes));
ok("the redactor's marker is absent from the root span", !JSON.stringify(contentRoot ?? {}).includes("TRACE_MARKER"));

if (failed) { console.error(`${failed} failed`); process.exit(1); }
console.log("function agents: all passing");
