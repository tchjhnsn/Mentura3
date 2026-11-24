// Tests Mentura's LangChain side over Naive (EE-121, EE-122), offline with a scripted model: a deep agent built with
// createDeepAgent and the NaiveBackend lists, reads and edits a venture's records through Naive's router; an edit that
// decides a decision is held as a draft; the NaiveTracer writes the run as spans in the venture's trace files (the
// agent, each model call, each tool call, Naive's file operation and router call under the tool); the provenance
// line of the write names the tool's file operation span; inputs stay out unless traces.content is on; check-traces
// passes.
//
//   node platform/agents/agents-test.ts

import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { fakeModel } from "@langchain/core/testing";
import { createDeepAgent } from "deepagents";
import { sessions, spans } from "naive-framework/src/core/instrumentation.mjs";
import { entries } from "naive-framework/src/core/provenance.mjs";
import { naivePath } from "../naive.ts";
import { NaiveBackend } from "./naive-backend.ts";
import { NaiveTracer } from "./naive-tracer.ts";

let failed = 0;
const ok = (name: string, cond: boolean, detail = "") => { console.log(`${cond ? "pass" : "FAIL"}  ${name}${cond || !detail ? "" : `: ${detail}`}`); if (!cond) failed++; };

const ws = mkdtempSync(join(tmpdir(), "mentura-agents-"));
const init = spawnSync("node", [naivePath("packages/naive/src/engine/init-venture.mjs"), join(ws, "kettle"), "kettle", "--layers", "purpose"], { encoding: "utf8" });
if (init.status !== 0) throw new Error(init.stderr);
const dir = join(ws, "kettle");
process.env.MENTURA_WORKSPACE = ws;
for (const k of ["NAIVE_TRACES", "MENTURA_TRACE_ID", "MENTURA_SPAN_ID", "MENTURA_SESSION"]) delete process.env[k];
writeFileSync(join(dir, "naive.config.json"), JSON.stringify({ traces: true }));

// A decision the agent will work on, written as a person would.
const team = JSON.parse(readFileSync(join(dir, "decisions/venture.team.decision.json"), "utf8")) as Record<string, unknown>;
const pricing = { ...team, id: "pricing", question: "What do we charge for the first kettle?", options: ["Free beta", "Paid from day one"], status: "open" };
delete (pricing as Record<string, unknown>).decides; delete (pricing as Record<string, unknown>).unlocks;
writeFileSync(join(dir, "decisions/pricing.decision.json"), JSON.stringify(pricing, null, 2) + "\n");

const model = fakeModel()
  .respondWithTools([{ name: "ls", args: { path: "/decisions" }, id: "call-ls" }])
  .respondWithTools([{ name: "read_file", args: { file_path: "/decisions/pricing" }, id: "call-read" }])
  .respondWithTools([{ name: "edit_file", args: { file_path: "/decisions/pricing", old_string: "What do we charge for the first kettle?", new_string: "What do we charge for the first kettle, and from when?" }, id: "call-edit" }])
  .respondWithTools([{ name: "edit_file", args: { file_path: "/decisions/pricing", old_string: "\"status\": \"open\"", new_string: "\"status\": \"decided\"" }, id: "call-decide" }])
  .respond(new AIMessage("I sharpened the pricing question and proposed deciding it; a person has to accept that."));

const tracer = new NaiveTracer(dir, { session: "harness-run-1", agents: ["strategy"] });
const backend = new NaiveBackend({ venture: "kettle", workspace: ws }, tracer);
const agent = createDeepAgent({ model, backend, name: "strategy", systemPrompt: "You are the strategy function agent. Work only through the venture's records." });
// deepagents 1.16's invoke type resolves the messages field to never under strict mode, so the input is cast.
const input = { messages: [new HumanMessage("Tighten the pricing decision.")] } as unknown as Parameters<typeof agent.invoke>[0];
const out = await agent.invoke(input, { callbacks: [tracer] });
const msgs = (out as { messages: { content: unknown, getType?: () => string }[] }).messages;
const toolText = msgs.filter((m) => m.getType?.() === "tool").map((m) => Array.isArray(m.content) ? m.content.map((b: { text?: string }) => b.text ?? JSON.stringify(b)).join("\n") : String(m.content));

// The agent worked through the router.
ok("ls through the router lists the decision", toolText.some((t) => t.includes("/decisions/pricing")), toolText[0]);
ok("read_file through the router returns the record", toolText.some((t) => t.includes("What do we charge for the first kettle?")), toolText[1]);
const after = JSON.parse(readFileSync(join(dir, "decisions/pricing.decision.json"), "utf8")) as { question: string, status: string };
ok("edit_file wrote the record through the router", after.question.endsWith("and from when?"), JSON.stringify(after));
ok("an agent's edit that decides a decision is held as a draft, and the agent is told", after.status === "open" && /Held for a person/.test(toolText.at(-1) ?? ""), toolText.at(-1));

// The run is in the venture's trace files.
const all = sessions(dir).flatMap((s: string) => spans(dir, s)) as { kind: string, name: string, span_id: string, parent_span_id?: string, trace_id: string, attributes?: Record<string, unknown> }[];
const byId = new Map(all.map((s) => [s.span_id, s]));
const agentSpan = all.find((s) => s.kind === "agent" && s.name === "invoke_agent strategy");
ok("the run is in the session the harness named", sessions(dir).includes("harness-run-1"), sessions(dir).join());
ok("the agent run is one agent span", !!agentSpan, all.map((s) => s.name).join(", "));
ok("each model call is a model span under the agent", all.filter((s) => s.kind === "model").length === 5 && all.filter((s) => s.kind === "model").every((s) => s.parent_span_id === agentSpan?.span_id));
const tools = all.filter((s) => s.kind === "tool" && s.name.startsWith("execute_tool ") && !s.name.startsWith("execute_tool naive_"));
ok("each tool call is a tool span under the agent", tools.length === 4 && tools.every((s) => s.parent_span_id === agentSpan?.span_id), tools.map((s) => s.name).join(", "));
const ops = all.filter((s) => s.name.startsWith("execute_tool naive_"));
ok("Naive's file operations hang from the tool call that made them", ops.length >= 4 && ops.every((s) => byId.get(s.parent_span_id ?? "")?.kind === "tool" || byId.get(s.parent_span_id ?? "")?.name.startsWith("execute_tool naive_")));
ok("Naive's router calls are under its file operations", all.some((s) => s.kind === "call" && byId.get(s.parent_span_id ?? "")?.name.startsWith("execute_tool naive_")));
ok("one trace id for the whole run", new Set(all.map((s) => s.trace_id)).size === 1);
const write = entries(dir).filter((e: { entity?: string }) => e.entity === "decisions/pricing.decision.json").at(-1) as { span?: { span_id: string } } | undefined;
ok("the provenance line of the edit names a span of this run", !!write?.span && byId.has(write.span.span_id));
ok("inputs and outputs are left out (traces.content is off)", !readFileSync(join(dir, "traces/harness-run-1.jsonl"), "utf8").includes("Tighten the pricing decision"));
ok("token and model attributes are kept", all.filter((s) => s.kind === "model").every((s) => typeof s.attributes?.["gen_ai.request.model"] === "string"));
const check = spawnSync("node", [naivePath("packages/naive/src/checks/check-traces.ts"), dir], { encoding: "utf8" });
ok("check-traces passes the venture", check.status === 0, check.stderr || check.stdout);

if (process.env.DEBUG_SPANS) for (const s of all) console.log(s.kind.padEnd(6), s.name.padEnd(40), s.span_id.slice(0, 8), (s.parent_span_id ?? "-").slice(0, 8), byId.get(s.parent_span_id ?? "")?.name ?? "");
if (process.env.DEBUG_SPANS) console.log(JSON.stringify(entries(dir).slice(-4).map((e: { entity?: string, span?: unknown }) => [e.entity, e.span])));
if (failed) { console.error(`${failed} failed`); process.exit(1); }
console.log("agents: all passing");
