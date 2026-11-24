// Tests for the triage graph (raw triage item 4), offline with a scripted Jev and MemorySaver: a sure entry files
// an idea and a triage record and routes; an unsure one holds, survives as a checkpoint, and resumes on the founder's
// answers, recording each as a correction; no Jev holds everything; the graph never writes raw.
//
//   node platform/agents/triage-graph-test.ts

import { MemorySaver } from "@langchain/langgraph";
import { request, type Context, type Entry } from "naive-framework/src/engine/triage.mjs";
import { validateValue } from "naive-framework/src/records/validate.mjs";
import { askJev, jevRunnable, keyVariable, type JevReply, type JevRequest } from "./jev.ts";
import { Command, triageGraph, type Deps, type Loaded, type RawRef } from "./triage-graph.ts";

let failed = 0;
const ok = (name: string, cond: boolean, detail?: unknown) => {
  if (cond) console.log(`ok ${name}`);
  else { failed++; console.log(`FAIL ${name}${detail === undefined ? "" : `: ${JSON.stringify(detail).slice(0, 600)}`}`); }
};

const FUNCTIONS = ["strategy", "marketing-and-sales", "products", "finance"];
const context: Context = { ventures: [{ id: "kettle", about: "a kettle that texts you" }], functions: FUNCTIONS, ideas: [] };
const dump: Entry = { path: "raw/dump/20261109-0100-ab12.md", text: "A kettle that texts you when the water boils." };
const ref: RawRef = { tenant: "acme", path: dump.path };

// Jev, scripted: every question answered with a sure probability unless a key is listed as unsure.
const scripted = (unsure: string[] = [], overrides: Record<string, number> = {}) => {
  const calls: JevRequest[] = [];
  return { calls, invoke: async (req: JevRequest): Promise<JevReply> => {
    calls.push(req);
    const answers: Record<string, unknown> = {};
    for (const k of Object.keys(req.questions)) {
      if (k === "urgency") { answers[k] = { score: 0.4 }; continue; }
      const yes = k === "kind:idea" || k === "venture:f1:kettle" || k === "function:f1:products";
      answers[k] = { noul: overrides[k] ?? (unsure.includes(k) ? 0.6 : yes ? 0.99 : 0.01) };
    }
    return { model: "jev-test", answers, usage: { input_tokens: 0, output_tokens: 0 } };
  } };
};
const memory = () => {
  const rows = new Map<string, string>();
  return { rows, write: async (path: string, content: string) => {
    if (path.startsWith("raw/dump/") || path.startsWith("raw/sources/")) return { ok: false, error: "raw is immutable" };
    rows.set(path, content); return { ok: true };
  } };
};
const valid = (schema: string, raw: string | undefined) => raw !== undefined && validateValue(schema, JSON.parse(raw)).status === 0;
const why = (schema: string, raw: string | undefined) => raw === undefined ? "missing" : validateValue(schema, JSON.parse(raw)).stdout;
const routeContext = { leads: [{ id: "product-lead", portfolio: ["products", "service-delivery", "supply-chain", "it"] }], plans: [], measures: [] };
const make = (over: Partial<Deps>) => {
  const writer = memory();
  const deps: Deps = { load: async (): Promise<Loaded> => ({ entry: dump, context, person: "p-1" }), writer, jev: scripted(), checkpointer: new MemorySaver(),
    line: 0.95, routeContext: routeContext as unknown as Deps["routeContext"], now: () => "2026-11-09T01:00:00Z", ...over };
  return { graph: triageGraph(deps), writer: deps.writer as ReturnType<typeof memory> };
};

// 1. Every label sure: files now.
{
  const jev = scripted();
  const { graph, writer } = make({ jev });
  const out = await graph.invoke({ ref }, { configurable: { thread_id: "t1" } });
  ok("one Jev request carries the questions triage.ts built", jev.calls.length === 1 && JSON.stringify(Object.keys(jev.calls[0].questions).sort()) === JSON.stringify(Object.keys(request(dump, context).questions).sort()));
  const idea = writer.rows.get("people/p-1/ideas/20261109-0100-ab12-f1.json");
  ok("a sure entry files an idea citing its raw path", !!idea && JSON.parse(idea).source === dump.path && JSON.parse(idea).ventures?.[0] === "kettle", [...writer.rows.keys()]);
  const tr = JSON.parse(writer.rows.get("raw/triage/20261109-0100-ab12.json") ?? "{}");
  ok("the triage record keeps every label, the model and the line", tr.model === "jev-test" && tr.line === 0.95 && tr.entry === dump.path && tr.status === "filed" && Array.isArray(tr.labels) && tr.labels.length === Object.keys(request(dump, context).questions).length && tr.held.length === 0, tr);
  ok("the idea and the triage record match Naive's schemas", valid("founder-idea.schema.json", idea) && valid("triage.schema.json", writer.rows.get("raw/triage/20261109-0100-ab12.json")),
    [why("founder-idea.schema.json", idea), why("triage.schema.json", writer.rows.get("raw/triage/20261109-0100-ab12.json"))]);
  ok("the routed task goes to the products function agent", out.routed.length === 1 && out.routed[0].to === "function-agent" && out.routed[0].role === "products-agent", out.routed);
  ok("nothing under raw/dump or raw/sources was written", ![...writer.rows.keys()].some((p) => p.startsWith("raw/dump/") || p.startsWith("raw/sources/")));
}

// 2. An unsure label holds; the checkpoint keeps the run; the founder's answers resume it.
{
  const saver = new MemorySaver();
  const { graph, writer } = make({ jev: scripted(["function:f1:finance"]), checkpointer: saver });
  const cfg = { configurable: { thread_id: "t2" } };
  const held = await graph.invoke({ ref }, cfg) as unknown as { __interrupt__?: { value: { questions: { key: string, guess: number | null }[] } }[] };
  const qs = held.__interrupt__?.[0]?.value.questions ?? [];
  ok("an unsure label pauses the run with that question and Jev's guess", qs.length === 1 && qs[0].key === "function:f1:finance" && qs[0].guess === 0.6, held);
  ok("nothing is filed while a label is held", writer.rows.size === 0);
  const snap = await graph.getState(cfg);
  ok("the held run is a checkpoint waiting at hold", snap.next.includes("hold"), snap.next);
  const done = await graph.invoke(new Command({ resume: { "function:f1:finance": true } }), cfg);
  ok("the founder's answer resumes the run and files", writer.rows.has("people/p-1/ideas/20261109-0100-ab12-f1.json") && done.filed.length === 1, [...writer.rows.keys()]);
  const tr = JSON.parse(writer.rows.get("raw/triage/20261109-0100-ab12.json") ?? "{}");
  const fin = (tr.labels ?? []).find((x: { key: string }) => x.key === "function:f1:finance");
  ok("the answer is kept beside Jev's guess", fin?.p === 0.6 && fin?.person === true && tr.status === "answered" && JSON.stringify(tr.held) === JSON.stringify(["function:f1:finance"]) && valid("triage.schema.json", writer.rows.get("raw/triage/20261109-0100-ab12.json")), tr);
  ok("two functions across portfolios with no measure go to a person", done.routed[0]?.to === "person", done.routed);
}

// 3. A possible one-way door: the work goes to a person whatever else holds.
{
  const { graph } = make({ jev: scripted([], { "door:one-way": 0.3 }) });
  const cfg = { configurable: { thread_id: "t3" } };
  await graph.invoke({ ref }, cfg);
  const done = await graph.invoke(new Command({ resume: { "door:one-way": true } }), cfg);
  ok("a one-way door sends the routed work to a person", done.routed.every((r: { to: string }) => r.to === "person") && done.routed.length === 1, done.routed);
}

// 4. No Jev key: every label is held; nothing falls back to another model.
{
  const { graph, writer } = make({ jev: null });
  const out = await graph.invoke({ ref }, { configurable: { thread_id: "t4" } }) as unknown as { __interrupt__?: { value: { questions: unknown[] } }[] };
  const n = out.__interrupt__?.[0]?.value.questions.length ?? 0;
  ok("with no Jev every question is held for the founder", n === Object.keys(request(dump, context).questions).length - 1 && writer.rows.size === 0, n);
}

// 5. confirm_all: even a sure run waits for the founder.
{
  const { graph, writer } = make({ confirmAll: true });
  const out = await graph.invoke({ ref }, { configurable: { thread_id: "t5" } }) as unknown as { __interrupt__?: unknown[] };
  ok("confirm_all holds a run whose labels are all sure", !!out.__interrupt__?.length && writer.rows.size === 0);
}

// 6. A reference files a founder-reference.
{
  const src: Entry = { path: "raw/sources/pg-essay/text.md", text: "The essay.", source: { title: "How to Do Great Work", origin: "https://example.com/great-work" } };
  const { graph, writer } = make({ load: async () => ({ entry: src, context, person: "p-1" }), jev: scripted([], { "kind:idea": 0.01, "kind:reference": 0.99 }) });
  await graph.invoke({ ref: { tenant: "acme", path: src.path } }, { configurable: { thread_id: "t6" } });
  const r = JSON.parse(writer.rows.get("people/p-1/references/pg-essay.json") ?? "{}");
  ok("a reference becomes a founder-reference added by the triage agent", r.title === "How to Do Great Work" && r.URL === "https://example.com/great-work" && r.added_by?.id === "triage-agent" && valid("founder-reference.schema.json", writer.rows.get("people/p-1/references/pg-essay.json")),
    [[...writer.rows.keys()], why("founder-reference.schema.json", writer.rows.get("people/p-1/references/pg-essay.json"))]);
}

// Jev's runnable: no key, no runnable; with a key, chunks and merges, and never returns the key.
ok("with no key there is no Jev runnable", jevRunnable({ env: {} }) === null && keyVariable({}) === null);
{
  const seen: string[] = [];
  const fake = async (_url: string, init: { headers: Record<string, string>, body: string }) => {
    seen.push(init.headers.Authorization);
    const qs = Object.keys((JSON.parse(init.body) as { questions: Record<string, unknown> }).questions);
    return { ok: true, status: 200, text: async () => "", json: async () => ({ model: "jev-x", answers: Object.fromEntries(qs.map((k) => [k, { noul: 0.9 }])), usage: { input_tokens: 1, output_tokens: 1 } }) };
  };
  const r = await askJev({ state: {}, model: "jev-latest", questions: { a: {}, b: {}, c: {} } }, { env: { TYPESAFE_API_KEY: "test-key-not-real" }, fetch: fake, chunk: 2 });
  ok("questions go in chunks and the answers merge", seen.length === 2 && Object.keys(r.answers).length === 3 && r.usage.input_tokens === 2 && !JSON.stringify(r).includes("test-key-not-real"), r);
}

process.exit(failed ? 1 : 0);
