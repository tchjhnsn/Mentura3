#!/usr/bin/env node
// LangSmith traces and evals (platform, EE-041): uploads one harness run's trace (interface/harness
// writes <workspace>/trace.json) as a tree of runs, with Naive's evals as feedback on the root run.
// The framework writes the trace and computes the evals; only this side names the vendor and the key.
//
//   LANGSMITH_API_KEY=... node platform/integrations/langsmith.mjs <workspace>/trace.json [--project naive-harness]
//
// trace.json: { name, run_type, start, end, inputs, outputs, error?, children: [ ...same ], feedback: [{ key, score, comment }] }

import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";

const API = process.env.LANGSMITH_ENDPOINT ?? "https://api.smith.langchain.com";
const key = process.env.LANGSMITH_API_KEY;
if (!key) { console.error("LANGSMITH_API_KEY is not set: the trace stays in trace.json"); process.exit(3); }
const file = process.argv[2];
const i = process.argv.indexOf("--project");
const project = i >= 0 ? process.argv[i + 1] : process.env.LANGSMITH_PROJECT ?? "naive-harness";
const trace = JSON.parse(readFileSync(file, "utf8"));
const headers = { "x-api-key": key, "content-type": "application/json" };
const stamp = (iso) => new Date(iso).toISOString().replace(/[-:]/g, "").replace(".", "").replace("Z", "") + "000Z";

const runs = [];
function flatten(node, parent = null) {
  const id = randomUUID();
  const dotted = `${parent ? `${parent.dotted}.` : ""}${stamp(node.start)}${id}`;
  const traceId = parent?.trace ?? id;
  runs.push({ id, trace_id: traceId, dotted_order: dotted, ...(parent ? { parent_run_id: parent.id } : {}), name: node.name, run_type: node.run_type ?? "chain",
    inputs: node.inputs ?? {}, outputs: node.outputs ?? {}, ...(node.error ? { error: node.error } : {}), start_time: node.start, end_time: node.end ?? node.start,
    session_name: project, extra: { metadata: { framework: "naive", ...(node.metadata ?? {}) } }, tags: node.tags ?? [] });
  for (const c of node.children ?? []) flatten(c, { id, dotted, trace: traceId });
  return id;
}
const root = flatten(trace);
const res = await fetch(`${API}/runs/batch`, { method: "POST", headers, body: JSON.stringify({ post: runs }) });
if (!res.ok) { console.error(`LangSmith answered ${res.status}: ${(await res.text()).slice(0, 300)}`); process.exit(1); }
for (const f of trace.feedback ?? []) {
  const r = await fetch(`${API}/feedback`, { method: "POST", headers, body: JSON.stringify({ run_id: root, key: f.key, score: f.score, comment: f.comment ?? null }) });
  if (!r.ok) console.error(`feedback ${f.key}: LangSmith answered ${r.status}`);
}
let url = null;
try {
  const s = await (await fetch(`${API}/sessions?name=${encodeURIComponent(project)}`, { headers })).json();
  const p = Array.isArray(s) ? s[0] : null;
  if (p) url = `https://smith.langchain.com/o/${p.tenant_id}/projects/p/${p.id}/r/${root}?trace_id=${root}`;
} catch {}
console.log(JSON.stringify({ project, root, runs: runs.length, feedback: (trace.feedback ?? []).length, url }));
