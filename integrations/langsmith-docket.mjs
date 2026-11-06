#!/usr/bin/env node
// The docket's evidence as a LangSmith experiment (platform, EE-041, EE-075): the scenario states
// become a dataset (each with its expected next step and source), and one scored run of the docket
// and the judge becomes an experiment over it, with docket_right, docket_function_right, judge_right
// and agree as feedback on each row. Each run of this script adds one experiment, so versions of the
// docket can be compared side by side.
//
//   node schema/docket-eval.mjs --answers a.json --json | LANGSMITH_API_KEY=... node platform/integrations/langsmith-docket.mjs [--name <experiment>]

import { randomUUID } from "node:crypto";
import { states } from "naive-framework/schema/docket-eval.mjs";

const API = (process.env.LANGSMITH_ENDPOINT ?? "https://api.smith.langchain.com") + "/api/v1";
const key = process.env.LANGSMITH_API_KEY;
if (!key) { console.error("LANGSMITH_API_KEY is not set"); process.exit(3); }
const headers = { "x-api-key": key, "content-type": "application/json" };
const call = async (method, path, body) => {
  const r = await fetch(API + path, { method, headers, ...(body ? { body: JSON.stringify(body) } : {}) });
  if (!r.ok) throw new Error(`${method} ${path}: LangSmith answered ${r.status}: ${(await r.text()).slice(0, 300)}`);
  return r.status === 204 ? null : r.json();
};
let input = "";
for await (const c of process.stdin) input += c;
const scored = JSON.parse(input);
const arg = (k, d) => (process.argv.includes(k) ? process.argv[process.argv.indexOf(k) + 1] : d);

const NAME = "Naive: docket scenarios";
const list = states();
let [dataset] = /** @type {{ id: string }[]} */ (await call("GET", `/datasets?name=${encodeURIComponent(NAME)}`));
if (!dataset) dataset = /** @type {{ id: string }} */ (await call("POST", "/datasets", { name: NAME, description: "Venture states where the right next step is argued from a cited source (schema/examples/docket-scenarios.json). Labels are an agent's draft until the founder reviews them." }));
/** @typedef {{ id: string, inputs: { state: string } }} Example */
const have = /** @type {Example[]} */ (await call("GET", `/examples?dataset=${dataset.id}&limit=100`));
const byState = new Map(have.map((e) => [e.inputs.state, e]));
for (const st of list) if (!byState.has(st.id)) {
  const e = /** @type {Example} */ (await call("POST", "/examples", { dataset_id: dataset.id, inputs: { state: st.id, phase: st.phase, situation: st.scenario.situation, decisions: st.decisions.map((d) => ({ id: d.id, question: d.question, function: d.function.id, render: d.render, held_by: d.held_by ?? null })) },
    outputs: { decision: st.expected.decision, function: st.expected.function, why: st.scenario.why, source: st.scenario.source } }));
  byState.set(st.id, e);
}

const name = arg("--name", `docket ${new Date().toISOString().slice(0, 16)}`);
const session = /** @type {{ id: string, tenant_id: string }} */ (await call("POST", "/sessions", { name, reference_dataset_id: dataset.id, description: `docket next ${scored.docket_next}, function ${scored.docket_function}${scored.judge_next != null ? `; judge next ${scored.judge_next}, agree ${scored.docket_judge_agree}` : ""}` }));
const now = new Date().toISOString();
const post = [];
const feedback = [];
for (const r of scored.rows) {
  const id = randomUUID();
  const dotted = `${now.replace(/[-:]/g, "").replace(".", "").replace("Z", "")}000Z${id}`;
  post.push({ id, trace_id: id, dotted_order: dotted, name: "docket", run_type: "chain", start_time: now, end_time: now, session_id: session.id, reference_example_id: byState.get(r.state).id,
    inputs: byState.get(r.state).inputs, outputs: { docket: r.docket, judge: r.judge ?? null }, extra: { metadata: { framework: "naive", state: r.state } } });
  for (const k of ["docket_right", "docket_function_right", "judge_right", "agree"]) if (r[k] != null) feedback.push({ run_id: id, key: k, score: r[k] ? 1 : 0 });
}
await call("POST", "/runs/batch", { post });
for (const f of feedback) await call("POST", "/feedback", f);
console.log(JSON.stringify({ dataset: dataset.id, experiment: session.id, name, rows: post.length, url: `https://smith.langchain.com/o/${session.tenant_id}/datasets/${dataset.id}/compare?selectedSessions=${session.id}` }));
