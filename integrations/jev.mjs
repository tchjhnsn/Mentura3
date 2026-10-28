#!/usr/bin/env node
// Jev (TypeSafe), for typed judgments (platform, EE-041): reads one Naive request on stdin (state,
// model, questions), sends it in chunks, and prints {model, answers, usage} on stdout. The framework
// builds the request and reads the answers (purpose/frameworks/idea-map, product-anatomy); only
// this side names the vendor and the credential.
//
//   node purpose/frameworks/idea-map/ideamap.mjs request <venture> | TYPESAFE_API_KEY=... node platform/integrations/jev.mjs

const ENDPOINT = "https://api.typesafe.ai/v1/systemone";
const key = process.env.TYPESAFE_API_KEY ?? process.env.TYPESAFEAI_API_KEY;
if (!key) { console.error("TYPESAFE_API_KEY is not set: tag with the founder's agent instead"); process.exit(3); }
let input = "";
for await (const c of process.stdin) input += c;
const req = JSON.parse(input);
const keys = Object.keys(req.questions);
const size = Number(process.env.JEV_CHUNK ?? 260);
const chunks = Array.from({ length: Math.ceil(keys.length / size) }, (_, i) => keys.slice(i * size, (i + 1) * size));
const out = { model: null, answers: {}, usage: { input_tokens: 0, output_tokens: 0 }, requests: chunks.length };
const t0 = Date.now();
await Promise.all(chunks.map(async (ks) => {
  const res = await fetch(ENDPOINT, { method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ ...req, questions: Object.fromEntries(ks.map((k) => [k, req.questions[k]])) }), signal: AbortSignal.timeout(120000) });
  if (!res.ok) throw new Error(`TypeSafe returned ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const r = await res.json();
  out.model = r.model;
  Object.assign(out.answers, r.answers);
  out.usage.input_tokens += r.usage?.input_tokens ?? 0; out.usage.output_tokens += r.usage?.output_tokens ?? 0;
}));
out.ms = Date.now() - t0;
console.log(JSON.stringify(out));
