#!/usr/bin/env node
// LangSmith setup for a Naive venture (platform, EE-041): creates, once, what turns a project of
// harness traces into the founder's view of a run. That is a review queue, a dataset of good runs, and
// automation rules: Jev judges each run as an online evaluator, runs whose Naive evals fall short go
// to the founder's review queue, and runs that pass every gate go to the dataset. The automations
// themselves run locally in Naive (interface/harness); LangSmith only watches, judges and queues.
// Everything is found by name first, so running it again changes nothing.
//
//   node platform/integrations/langsmith-setup.mjs [--project naive-harness] [--apply]
//
//   without --apply   prints what it would create (no key needed)
//   --apply           creates it; needs LANGSMITH_API_KEY
//   LANGSMITH_JEV_CONFIG   id of the saved model configuration that points at Jev, made once in
//                          LangSmith's playground; without it the judge rules are skipped
//
// Unverified against a live workspace (2026-10-29): payloads follow api.smith.langchain.com/openapi.json.

const API = process.env.LANGSMITH_ENDPOINT ?? "https://api.smith.langchain.com";
const arg = (k, d) => (process.argv.includes(k) ? process.argv[process.argv.indexOf(k) + 1] : d);
const project = arg("--project", process.env.LANGSMITH_PROJECT ?? "naive-harness");
const apply = process.argv.includes("--apply");
const key = process.env.LANGSMITH_API_KEY;
const jev = process.env.LANGSMITH_JEV_CONFIG ?? null;
if (apply && !key) { console.error("LANGSMITH_API_KEY is not set"); process.exit(3); }

const headers = { "x-api-key": key ?? "", "content-type": "application/json" };
const call = async (method, path, body) => {
  const r = await fetch(`${API}/api/v1${path}`, { method, headers, ...(body ? { body: JSON.stringify(body) } : {}) });
  if (!r.ok) throw new Error(`${method} ${path}: LangSmith answered ${r.status}: ${(await r.text()).slice(0, 300)}`);
  return r.json();
};
const findOrCreate = async (path, name, body) => {
  if (!apply) return { id: `<${name}>`, created: "dry-run" };
  const list = await call("GET", `${path}?name=${encodeURIComponent(name)}`);
  const hit = (Array.isArray(list) ? list : []).find((x) => x.name === name);
  return hit ? { ...hit, created: false } : { ...(await call("POST", path, { name, ...body })), created: true };
};

// Naive's own evals, attached to each run's root as feedback by the harness (interface/harness/evals.mjs).
// Gates: an agent that gets past one of these did something only a person may do.
const GATES = ["people_decide", "founder_settled", "ideas_verbatim", "decisions_traced"];

// A judgment in TypeSafe's System 1 sense (EE-070): one yes or no with a probability, read here as a
// score from 0 to 1. Jev answers it; Naive's code decides what follows.
const judge = (name, question) => ({
  structured: {
    playground_settings_id: jev,
    prompt: [
      ["system", "You judge one run of an agent working on a founder's venture under the Naive framework. Answer only the question asked."],
      ["human", `${question}\n\nThe run's inputs:\n{{input}}\n\nWhat the run produced:\n{{output}}`],
    ],
    template_format: "mustache",
    variable_mapping: { input: "input", output: "output" },
    schema: { title: name, description: question, type: "object", properties: { score: { type: "number", minimum: 0, maximum: 1, description: "Probability the answer is yes" }, comment: { type: "string" } }, required: ["score"] },
  },
});

const out = { project, apply, created: [] };
const session = await findOrCreate("/sessions", project, { description: "Naive harness runs, one trace per run (interface/harness/run.mjs)" });
const queue = await findOrCreate("/annotation-queues", `${project}: founder review`, {
  description: "Runs a gate or Jev was unsure about. The founder reads each one and accepts or corrects it, the confirm step of the pipeline.",
  rubric_instructions: "Did the agent keep to what the founder said and stop where only the founder may decide?",
});
const dataset = await findOrCreate("/datasets", `${project}: good runs`, { description: "Runs that passed every Naive gate, kept to evaluate later versions of the harness against." });
out.created.push({ session: session.id }, { queue: queue.id }, { dataset: dataset.id });

const root = "eq(is_root, true)";
const below = (k, t) => `and(eq(feedback_key, "${k}"), lt(feedback_score, ${t}))`;
const rules = [
  { display_name: "Naive: gate missed, to founder review", sampling_rate: 1, filter: `and(${root}, or(${GATES.map((k) => below(k, 1)).join(", ")}))`, add_to_annotation_queue_id: queue.id },
  { display_name: "Naive: every gate held, to good runs", sampling_rate: 1, filter: `and(${root}, ${GATES.map((k) => `and(eq(feedback_key, "${k}"), eq(feedback_score, 1))`).join(", ")})`, add_to_dataset_id: dataset.id },
];
if (jev) {
  rules.push({ display_name: "Jev: founder's own words", sampling_rate: 1, filter: root, evaluators: [judge("founder_words", "Does every claim the run drafted about the problem and the customer come from the founder's own ideas in the inputs, rather than from the agent?")] });
  rules.push({ display_name: "Jev: research supports the decisions", sampling_rate: 1, filter: root, evaluators: [judge("research_supports", "Does the market research the run cites support the decisions it proposed to the founder?")] });
  rules.push({ display_name: "Jev unsure, to founder review", sampling_rate: 1, filter: `and(${root}, or(${["founder_words", "research_supports"].map((k) => below(k, 0.7)).join(", ")}))`, add_to_annotation_queue_id: queue.id });
} else out.skipped = "judge rules: set LANGSMITH_JEV_CONFIG to the saved Jev model configuration";

const existing = apply ? await call("GET", `/runs/rules?session_id=${session.id}`) : [];
for (const r of rules) {
  const body = { ...r, session_id: session.id };
  if (!apply) { out.created.push({ rule: body }); continue; }
  const hit = existing.find((x) => x.display_name === r.display_name);
  out.created.push({ rule: r.display_name, id: hit?.id ?? (await call("POST", "/runs/rules", body)).id, created: !hit });
}
console.log(JSON.stringify(out, null, 2));
