// Tests shipping trace files to LangSmith (platform/integrations/langsmith-otel.ts), offline, against a local
// stand-in for LangSmith's OTel endpoint: spans become OTLP spans with parents kept and a run type; only pending
// spans are sent and each once; offline leaves them pending; a refused batch is not marked sent; no key exits 3.
// A span that holds gen_ai.input.messages and gen_ai.output.messages also copies them onto input.value,
// output.value, gen_ai.prompt and gen_ai.completion. The copy is redacted. A span without those keys stays without them.
//
//   node platform/integrations/langsmith-otel-test.ts

import { spawnSync } from "node:child_process";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { fakeModel } from "@langchain/core/testing";
import { span, withSpan } from "naive-framework/src/core/instrumentation.mjs";
import type { TraceSpan } from "naive-framework/src/records/types/records.d.ts";
import { redactTrace, setTraceRedactor } from "../agents/trace-redact.ts";
import { pending, sync, toOtlp } from "./langsmith-otel.ts";

let failed = 0;
const ok = (name: string, cond: boolean, detail = "") => { console.log(`${cond ? "pass" : "FAIL"}  ${name}${cond || !detail ? "" : `: ${detail}`}`); if (!cond) failed++; };

for (const k of ["NAIVE_TRACES", "MENTURA_TRACE_ID", "MENTURA_SPAN_ID", "MENTURA_SESSION", "LANGSMITH_API_KEY"]) delete process.env[k];
const dir = mkdtempSync(join(tmpdir(), "langsmith-otel-"));
writeFileSync(join(dir, "venture.json"), JSON.stringify({ id: "kettle", name: "Kettle", phase: "discovery" }));
writeFileSync(join(dir, "naive.config.json"), JSON.stringify({ traces: true }));
await withSpan(dir, { name: "invoke_agent strategy", kind: "agent", session: "run-1" }, async () => {
  span(dir, { name: "chat claude", kind: "model", attributes: { "gen_ai.request.model": "claude", "gen_ai.usage.input_tokens": 12 } });
  await withSpan(dir, { name: "execute_tool naive_read", kind: "tool" }, () => 1);
});

// The stand-in: records each request; can refuse or be unreachable.
const got: { headers: Record<string, unknown>, body: { resourceSpans: { resource: { attributes: { key: string, value: { stringValue?: string } }[] }, scopeSpans: { spans: ReturnType<typeof toOtlp>[] }[] }[] } }[] = [];
let refuse = false;
const server = createServer((req, res) => {
  let text = "";
  req.on("data", (c) => { text += c; });
  req.on("end", () => {
    if (req.url !== "/otel/v1/traces") { res.writeHead(404).end(); return; }
    got.push({ headers: req.headers, body: JSON.parse(text) });
    if (refuse) { res.writeHead(400).end("bad batch"); return; }
    res.writeHead(200, { "content-type": "application/json" }).end("{}");
  });
});
await new Promise<void>((r) => server.listen(0, "127.0.0.1", () => r()));
const endpoint = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;

// Refused: nothing is marked sent.
refuse = true;
const r0 = await sync(dir, { endpoint, key: "test-key", project: "mentura-dev" });
ok("a refused batch is reported and stays pending", !!r0[0].error && !r0[0].offline && pending(dir, "run-1").length === 3);
refuse = false;

// Sent: the OTLP body.
const r1 = await sync(dir, { endpoint, key: "test-key", project: "mentura-dev" });
const sent = got.at(-1)!;
const list = sent.body.resourceSpans[0].scopeSpans[0].spans;
ok("pending spans are sent once", r1[0].sent === 3 && pending(dir, "run-1").length === 0);
ok("the key and the project go in LangSmith's headers", sent.headers["x-api-key"] === "test-key" && sent.headers["langsmith-project"] === "mentura-dev");
ok("the resource names the venture and the session", sent.body.resourceSpans[0].resource.attributes.some((a) => a.key === "naive.venture" && a.value.stringValue === "kettle"));
const agent = list.find((s) => s.name === "invoke_agent strategy");
ok("ids are OTLP ids (32 and 16 hex)", list.every((s) => /^[0-9a-f]{32}$/.test(s.traceId) && /^[0-9a-f]{16}$/.test(s.spanId)) && new Set(list.map((s) => s.traceId)).size === 1);
ok("parents are kept", list.filter((s) => s.name !== "invoke_agent strategy").every((s) => s.parentSpanId === agent?.spanId));
const kind = (s: ReturnType<typeof toOtlp>) => s.attributes.find((a) => a.key === "langsmith.span.kind")?.value;
ok("each span names its LangSmith run type", JSON.stringify(list.map(kind)).includes("llm") && JSON.stringify(list.map(kind)).includes("tool") && JSON.stringify(list.map(kind)).includes("chain"));
ok("numbers stay numbers", list.find((s) => s.name === "chat claude")?.attributes.some((a) => a.key === "gen_ai.usage.input_tokens" && "intValue" in a.value && a.value.intValue === "12") === true);

// Nothing new: nothing sent. A new span: only it is sent.
const before = got.length;
await sync(dir, { endpoint, key: "test-key" });
ok("a second run with nothing new sends nothing", got.length === before);
span(dir, { name: "chat claude", kind: "model", session: "run-1" });
const r2 = await sync(dir, { endpoint, key: "test-key" });
ok("a span written later is the only one sent", r2[0].sent === 1 && got.at(-1)!.body.resourceSpans[0].scopeSpans[0].spans.length === 1);

// Offline: pending stays.
span(dir, { name: "chat claude", kind: "model", session: "run-1" });
await new Promise<void>((r) => server.close(() => r()));
const r3 = await sync(dir, { endpoint, key: "test-key" });
ok("offline, the spans stay pending and nothing fails", r3[0].offline === true && pending(dir, "run-1").length === 1);
ok("the sync state lives in the venture's .naive folder", Object.keys(JSON.parse(readFileSync(join(dir, ".naive/langsmith-sync.json"), "utf8")) as object).includes("run-1"));

// The command line: no key exits 3 and names what stays pending.
const cli = spawnSync("node", ["integrations/langsmith-otel.ts", dir], { encoding: "utf8", env: { ...process.env, LANGSMITH_API_KEY: "" } });
ok("with no key the command exits 3 and the spans stay pending", cli.status === 3 && /1 spans stay pending/.test(cli.stderr), cli.stderr);
const dry = spawnSync("node", ["integrations/langsmith-otel.ts", dir, "--dry-run"], { encoding: "utf8" });
ok("--dry-run lists what is pending", dry.status === 0 && /run-1 {2}1 pending/.test(dry.stdout), dry.stdout + dry.stderr);

// LangSmith reads input.value and output.value. The reply text comes from a scripted model.
const MARKER = "TRACE_MARKER";
const prompt = `When does the kettle boil? ${MARKER}`;
const model = fakeModel().respond(new AIMessage(`The kettle boils. ${MARKER}`));
const reply = await model.invoke([new HumanMessage(prompt)]);
const answer = reply.text;
const stringOf = (s: ReturnType<typeof toOtlp>, key: string): string | undefined => {
  const v = s.attributes.find((a) => a.key === key)?.value;
  return v && "stringValue" in v ? v.stringValue : undefined;
};
const traceSpan = (attributes?: TraceSpan["attributes"]): TraceSpan => ({
  trace_id: "11111111-1111-1111-1111-111111111111", span_id: "22222222-2222-2222-2222-222222222222",
  name: "chat claude", kind: "model", start: "2026-11-26T10:00:00.000Z", end: "2026-11-26T10:00:01.000Z",
  status: "ok", prev: "genesis", hash: "abc", attributes,
});
const held = { "gen_ai.input.messages": prompt, "gen_ai.output.messages": answer };
const exported = toOtlp(traceSpan(held));
ok("the scripted reply is the output message", answer === `The kettle boils. ${MARKER}`);
ok("a span with messages copies them onto the keys LangSmith reads, and the originals remain",
  stringOf(exported, "input.value") === prompt && stringOf(exported, "output.value") === answer
  && stringOf(exported, "gen_ai.prompt") === prompt && stringOf(exported, "gen_ai.completion") === answer
  && stringOf(exported, "gen_ai.input.messages") === prompt && stringOf(exported, "gen_ai.output.messages") === answer
  && !("input.value" in held) && !("output.value" in held) && !("gen_ai.prompt" in held) && !("gen_ai.completion" in held));
const quiet = toOtlp(traceSpan({ "gen_ai.request.model": "claude" }));
ok("a span without messages does not gain prompt or reply keys",
  ["input.value", "output.value", "gen_ai.prompt", "gen_ai.completion"].every((k) => !quiet.attributes.some((a) => a.key === k)));
const messageList = [{ role: "user", content: "hi" }];
const asList = toOtlp(traceSpan({ "gen_ai.input.messages": messageList }));
ok("a message list is JSON on the keys LangSmith reads", stringOf(asList, "input.value") === JSON.stringify(messageList) && stringOf(asList, "gen_ai.prompt") === JSON.stringify(messageList) && stringOf(asList, "output.value") === undefined && stringOf(asList, "gen_ai.completion") === undefined);
setTraceRedactor((text) => text.replaceAll(MARKER, "[redacted]"));
try {
  const source = { "gen_ai.input.messages": prompt, "gen_ai.output.messages": answer };
  const hidden = toOtlp(traceSpan(source));
  const promptOut = prompt.replaceAll(MARKER, "[redacted]");
  const answerOut = answer.replaceAll(MARKER, "[redacted]");
  ok("every content string in the export drops the marker, and the span object keeps it",
    stringOf(hidden, "input.value") === promptOut && stringOf(hidden, "output.value") === answerOut
    && stringOf(hidden, "gen_ai.prompt") === promptOut && stringOf(hidden, "gen_ai.completion") === answerOut
    && stringOf(hidden, "gen_ai.input.messages") === promptOut && stringOf(hidden, "gen_ai.output.messages") === answerOut
    && source["gen_ai.input.messages"] === prompt && source["gen_ai.output.messages"] === answer);
  const planted = {
    "gen_ai.tool.call.arguments": `arg ${MARKER}`, "gen_ai.tool.call.result": `result ${MARKER}`,
    "gen_ai.system_instructions": `system ${MARKER}`, "naive.input": `in ${MARKER}`, "naive.output": `out ${MARKER}`,
  };
  const tools = toOtlp(traceSpan(planted));
  ok("a marker in tool text, instructions, and naive input or output never leaves the export", !JSON.stringify(tools).includes(MARKER));
  const named = toOtlp(traceSpan({ ...planted, "gen_ai.request.model": `claude-${MARKER}` }));
  ok("a model name is not a content key", stringOf(named, "gen_ai.request.model") === `claude-${MARKER}`);
  setTraceRedactor((text) => text.replaceAll(MARKER, "[redacted]"), "all");
  const everything = toOtlp(traceSpan({ ...planted, "gen_ai.request.model": `claude-${MARKER}` }));
  ok("redact-all still covers the content keys, and the model name too", !JSON.stringify(everything).includes(MARKER));
  const erred = toOtlp({ ...traceSpan({}), status: "error", error: `refused ${MARKER}` });
  ok("an error status message is redacted", erred.status.message === "refused [redacted]");
} finally {
  setTraceRedactor((text) => text);
}
ok("the redactor is identity again", redactTrace(`keep ${MARKER}`) === `keep ${MARKER}`);

if (failed) { console.error(`${failed} failed`); process.exit(1); }
console.log("langsmith otel: all passing");
