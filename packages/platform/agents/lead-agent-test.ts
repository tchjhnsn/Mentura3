// Tests the lead agents offline (lead agents build plan item 4): every lead derives from Naive's role templates (no list
// here); the growth lead, run with a scripted model (fakeModel), reads its skill under /lead/, writes one handoff per
// function involved addressed to that function's agent with requested_by growth-lead, adds a bet to its lead plan, and
// writes no function record (a function route and a handoff for someone else are refused). The routing rule sends a
// single-function task to agent_<function>, a one-way door to a person, two functions in one portfolio to the lead and
// functions across portfolios with no measure to a person. The CLI refuses an unstaffed lead with its team-plan entry,
// and the MCP shim lists lead_<id> and route_task and carries both through a real child process.
//
//   node platform/agents/lead-agent-test.ts

import { spawn, spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";
import { AIMessage } from "@langchain/core/messages";
import { fakeModel } from "@langchain/core/testing";
import { spans } from "naive-framework/src/core/instrumentation.mjs";
import { routeGlob } from "naive-framework/src/engine/access.mjs";
import { naivePath } from "../naive.ts";
import type { ModelSource } from "./function-agent.ts";
import { runIdOf } from "./function-agent.ts";
import type { LeadRunResult } from "./lead-agent.ts";
import { runLeadAgent } from "./lead-agent.ts";
import type { RouteAnswer } from "./lead-spec.ts";
import { beyondLead, leadAgent, leadIds, leadTeamPlanEntry, routeFor } from "./lead-spec.ts";

let failed = 0;
const ok = (name: string, cond: boolean, detail = "") => { console.log(`${cond ? "pass" : "FAIL"}  ${name}${cond || !detail ? "" : `: ${detail}`}`); if (!cond) failed++; };
const BIN = fileURLToPath(new URL("./bin.ts", import.meta.url));

// ---- 1. Every lead derives from Naive's role templates ----
const ids = leadIds();
ok("the leads are the role templates with a portfolio", [...ids].sort().join() === "finance-lead,growth-lead,product-lead,strategy-lead", ids.join());
ok("each lead writes only its plan, decisions and handoffs", ids.every((id) => { const s = leadAgent(id); return s.writes.join() === `operations/lead/${id},decisions/*,operations/handoff/*` && !s.writes.some((g) => routeGlob(g).test("people/team-plan")); }));
const growth = leadAgent("growth-lead");
ok("growth-lead's portfolio comes from its template", growth.portfolio.join() === "marketing-and-sales,customer-service" && growth.skill !== null, JSON.stringify(growth));
ok("a function route is beyond a lead", beyondLead("growth-lead", ["foundation/*"]).length > 0 && beyondLead("growth-lead", growth.writes).length === 0);
ok("an unknown lead is an error naming the leads", (() => { try { leadAgent("sales-lead"); return false; } catch (e) { return /growth-lead/.test(String(e)); } })());

// ---- A venture staffed with the growth lead only, written as a person would ----
const ws = mkdtempSync(join(tmpdir(), "mentura-leads-"));
const init = spawnSync("node", [naivePath("packages/naive/src/engine/init-venture.mjs"), join(ws, "kettle"), "kettle", "--layers", "purpose"], { encoding: "utf8" });
if (init.status !== 0) throw new Error(init.stderr);
const dir = join(ws, "kettle");
process.env.MENTURA_WORKSPACE = ws;
for (const k of ["NAIVE_TRACES", "MENTURA_TRACE_ID", "MENTURA_SPAN_ID", "MENTURA_SESSION", "MENTURA_ACTOR", "MENTURA_ACTOR_ID", "MENTURA_MODEL", "MENTURA_HARNESS"]) delete process.env[k];
writeFileSync(join(dir, "naive.config.json"), JSON.stringify({}));
mkdirSync(join(dir, "operations"), { recursive: true });
writeFileSync(join(dir, "operations/team-plan.json"), JSON.stringify({ venture: "kettle", roles: [{ id: "founder", occupant: "person", needed_by: "discovery", status: "filled" }, leadTeamPlanEntry(growth, "discovery")] }, null, 2));

// ---- 2. The growth lead's run writes a plan entry and one handoff per function, and no function record ----
const handoff = (id: string, fn: string, requested_by = "growth-lead") => JSON.stringify({
  id, title: `Paid tier: ${fn}`, venture: "kettle", role: `${fn}-agent`, brief: `${id}.md`, decision_classes: ["defer-or-route"],
  done_criteria: [{ id: "fit", kind: "review", check: "Does the work serve the paid tier launch?", reviewer: "growth-lead" }],
  status: "draft", attempts: 0, max_attempts: 3, run_cap: "2h", requested_by,
}, null, 2);
const plan = JSON.stringify({ lead: "growth-lead", portfolio: ["marketing-and-sales", "customer-service"], measures: ["paying-teams"], review_cadence: "weekly",
  bets: [{ id: "paid-tier", statement: "A paid tier with support converts beta teams", measures: ["paying-teams"], handoffs: ["paid-tier-pricing-page", "paid-tier-support"], status: "proposed" }] }, null, 2);
const step = (name: string, args: Record<string, unknown>, id: string) => new AIMessage({ content: "", tool_calls: [{ name, args, id, type: "tool_call" }] });
const model = fakeModel()
  .respond(step("read_file", { file_path: "/lead/SKILL.md" }, "c1"))
  .respond(step("write_file", { file_path: "/operations/handoff/paid-tier-pricing-page", content: handoff("paid-tier-pricing-page", "marketing-and-sales") }, "c2"))
  .respond(step("write_file", { file_path: "/operations/handoff/paid-tier-support", content: handoff("paid-tier-support", "customer-service") }, "c3"))
  .respond(step("write_file", { file_path: "/operations/lead/growth-lead", content: plan }, "c4"))
  .respond(step("write_file", { file_path: "/foundation/telos", content: "{}" }, "c5"))
  .respond(step("write_file", { file_path: "/operations/handoff/someone-else", content: handoff("someone-else", "finance", "finance-lead") }, "c6"))
  .respond(step("write_file", { file_path: "/operations/handoff/to-a-person", content: handoff("to-a-person", "founder").replace("\"founder-agent\"", "\"founder\"") }, "c7"))
  .respond(new AIMessage("I wrote two handoffs, one to marketing and sales and one to customer service, and added the paid-tier bet to my plan."));
const SESSION = "harness-9", TRACE = randomUUID(), RUN = runIdOf(randomUUID());
const scripted = (m: ReturnType<typeof fakeModel>): ModelSource => ({ name: "fake:scripted", load: async () => m });
const r = await runLeadAgent(growth, "Launch the paid tier with support.", { venture: "kettle", model: scripted(model), trace: { session: SESSION, trace_id: TRACE }, runId: RUN, harness: "claude-code" });
const textOf = (c: unknown): string => typeof c === "string" ? c : Array.isArray(c) ? c.map((b: { text?: string }) => b.text ?? JSON.stringify(b)).join("\n") : JSON.stringify(c);
const calls = (model as unknown as { calls: { messages: { content: unknown, getType: () => string }[] }[] }).calls;
const system = textOf(calls[0]?.messages[0]?.content);
const tool = (calls.at(-1)?.messages ?? []).filter((m) => m.getType() === "tool").map((m) => textOf(m.content));

ok("the run is done with the model's answer", r.status === "done" && r.answer.startsWith("I wrote two handoffs"), JSON.stringify(r));
ok("with content off, the trace file does not contain the task", !readFileSync(join(dir, "traces", `${SESSION}.jsonl`), "utf8").includes("Launch the paid tier with support."));
ok("the system prompt names the lead, its portfolio and the function agents", system.includes("Growth lead of the venture kettle") && system.includes("marketing-and-sales, customer-service") && system.includes("finance-agent"), system.slice(0, 600));
ok("the lead reads its role's skill under /lead/ (Naive's one generic lead skill since EE-215)", /\blead/i.test(tool[0] ?? "") && !/not found/i.test(tool[0] ?? ""), tool[0]?.slice(0, 200));
ok("a function's record is refused before Naive sees it", /A lead writes only/.test(tool[4] ?? ""), tool[4]);
ok("a handoff naming another requester is refused", /requested_by \(growth-lead\)/.test(tool[5] ?? ""), tool[5]);
ok("a handoff not addressed to a function agent is refused", /function agent/.test(tool[6] ?? ""), tool[6]);
const handoffs = r.status === "done" ? r.handoffs : [];
ok("one handoff per function involved, each to that function's agent and requested by the lead", JSON.stringify(handoffs.map((h) => [h.id, h.role, h.requested_by]).sort()) === JSON.stringify([["paid-tier-pricing-page", "marketing-and-sales-agent", "growth-lead"], ["paid-tier-support", "customer-service-agent", "growth-lead"]]), JSON.stringify(handoffs));
ok("the lead plan entry is written", r.status === "done" && r.plan && (JSON.parse(readFileSync(join(dir, "operations/leads/growth-lead.json"), "utf8")) as { bets: { id: string }[] }).bets[0].id === "paid-tier", JSON.stringify(r));
const wrote = r.status === "done" ? r.wrote.map((w) => w.entity) : [];
ok("no function record was written: only the plan and handoffs", wrote.length === 3 && wrote.every((e) => /^operations\/(leads|handoffs)\//.test(e)), JSON.stringify(wrote));
ok("nothing beyond them is held either", r.status === "done" && r.held.length === 0, JSON.stringify(r.status === "done" ? r.held : r));
const again = await runLeadAgent(growth, "Launch the paid tier with support.", { venture: "kettle", model: { name: "fake:none", load: async () => { throw new Error("the model was loaded"); } }, trace: { session: SESSION, trace_id: TRACE }, runId: RUN });
ok("a retry with the same run id is already-ran with the same handoffs", again.status === "already-ran" && JSON.stringify(again.handoffs) === JSON.stringify(handoffs), JSON.stringify(again));

// ---- 3. The routing rule ----
const single = routeFor({ functions: ["finance"] }, dir);
ok("a single-function task routes to agent_<function>", single.to === "function-agent" && single.tool === "agent_finance" && single.rule === 3, JSON.stringify(single));
ok("an unstaffed target carries the team-plan entry to add", !single.staffed && single.fix?.id === "finance-agent", JSON.stringify(single));
const door = routeFor({ functions: ["products"], classes: ["production-ship"] }, dir);
ok("a one-way door routes to a person", door.to === "person" && door.tool === null && door.rule === 2, JSON.stringify(door));
const money = routeFor({ functions: ["marketing-and-sales", "customer-service"], classes: ["spend-money"] }, dir);
ok("a never-redelegated class routes to a person", money.to === "person" && money.rule === 2, JSON.stringify(money));
const portfolio = routeFor({ functions: ["marketing-and-sales", "customer-service"] }, dir);
ok("two functions in one portfolio route to that lead, staffed", portfolio.to === "lead" && portfolio.tool === "lead_growth-lead" && portfolio.staffed, JSON.stringify(portfolio));
const across = routeFor({ functions: ["marketing-and-sales", "finance"] }, dir);
ok("functions across portfolios with no measure route to a person", across.to === "person" && across.rule === 5, JSON.stringify(across));
ok("a measure the venture's lead plan binds routes across portfolios to that lead", (() => { const a = routeFor({ functions: ["marketing-and-sales", "finance"], measure: "paying-teams" }, dir); return a.to === "lead" && a.role === "growth-lead"; })());

// ---- 4. The CLI ----
const unstaffed = spawnSync("node", [BIN, "lead", "finance-lead", "--venture", "kettle"], { input: "Plan the runway.", encoding: "utf8" });
const ur = JSON.parse(unstaffed.stdout || "{}") as { status?: string, fix?: string };
ok("an unstaffed lead is refused (exit 2) with its team-plan entry", unstaffed.status === 2 && ur.status === "refused" && /"id":\s*"finance-lead"/.test(ur.fix ?? ""), unstaffed.stdout + unstaffed.stderr);
const unknown = spawnSync("node", [BIN, "lead", "sales-lead", "--venture", "kettle"], { input: "x", encoding: "utf8" });
ok("an unknown lead is refused (exit 2)", unknown.status === 2 && /no lead sales-lead/.test(unknown.stdout), unknown.stdout + unknown.stderr);

// ---- 5. The MCP shim: lead_<id> and route_task through a real child process ----
const shim = spawn("node", [BIN, "mcp"], { env: { ...process.env, MENTURA_VENTURE: "kettle", MENTURA_SESSION: SESSION, MENTURA_TRACE_ID: TRACE, MENTURA_MODEL: "fake:none" }, stdio: ["pipe", "pipe", "inherit"] });
interface ShimReply { id: number, result?: { tools?: { name: string }[], isError?: boolean, structuredContent?: LeadRunResult | RouteAnswer } }
const replies = new Map<number, (_reply: ShimReply) => void>();
createInterface({ input: shim.stdout }).on("line", (l) => { const m = JSON.parse(l) as ShimReply; replies.get(m.id)?.(m); });
const ask = (id: number, method: string, params: unknown = {}) => new Promise<ShimReply>((res) => { replies.set(id, res); shim.stdin.write(JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n"); });
await ask(1, "initialize", { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "test", version: "0" } });
const listed = await ask(2, "tools/list");
ok("the shim lists the staffed lead, route_task and command", JSON.stringify(listed.result?.tools?.map((t) => t.name)) === JSON.stringify(["lead_growth-lead", "route_task", "command"]), JSON.stringify(listed.result?.tools?.map((t) => t.name)));
const routed = (await ask(3, "tools/call", { name: "route_task", arguments: { functions: ["finance"] } })).result?.structuredContent as RouteAnswer | undefined;
ok("route_task sends a single-function task to agent_<function>", routed?.tool === "agent_finance", JSON.stringify(routed));
const toPerson = (await ask(4, "tools/call", { name: "route_task", arguments: { functions: ["products"], classes: ["production-ship"] } })).result?.structuredContent as RouteAnswer | undefined;
ok("route_task sends a one-way door to a person", toPerson?.to === "person" && toPerson.tool === null, JSON.stringify(toPerson));
const called = await ask(5, "tools/call", { name: "lead_growth-lead", arguments: { task: "Launch the paid tier with support.", run_id: RUN } });
const sc = called.result?.structuredContent as LeadRunResult | undefined;
ok("a lead call through the shim reaches the same run (already-ran, same handoffs)", called.result?.isError === false && sc?.status === "already-ran" && JSON.stringify(sc.handoffs) === JSON.stringify(handoffs), JSON.stringify(called.result));
shim.stdin.end();
await new Promise((res) => shim.on("close", res));

// ---- 6. Content on: the root span keeps the task and the answer ----
writeFileSync(join(dir, "naive.config.json"), JSON.stringify({ traces: { spans: true, content: true } }));
const leadTask = "Plan the paid tier launch.";
const leadAnswer = "The paid tier is planned.";
const leadModel = fakeModel().respond(new AIMessage(leadAnswer));
const SESSION_C = "harness-lead-content", RUN_C = runIdOf(randomUUID());
const rc = await runLeadAgent(growth, leadTask, { venture: "kettle", model: scripted(leadModel), trace: { session: SESSION_C, trace_id: randomUUID() }, runId: RUN_C, harness: "claude-code" });
const contentRoot = (spans(dir, SESSION_C) as { span_id: string, attributes?: Record<string, unknown> }[]).find((s) => s.span_id === RUN_C);
ok("with content on, the root span stores the task and the answer", rc.status === "done" && contentRoot?.attributes?.["gen_ai.input.messages"] === leadTask && contentRoot?.attributes?.["gen_ai.output.messages"] === leadAnswer && contentRoot?.attributes?.["gen_ai.operation.name"] === "invoke_agent", JSON.stringify(contentRoot?.attributes));

rmSync(ws, { recursive: true, force: true });
if (failed) { console.error(`${failed} failed`); process.exit(1); }
console.log("lead agents: all passing");
