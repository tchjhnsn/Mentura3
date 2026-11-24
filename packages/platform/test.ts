// Runs every test of the platform library and reports each one.
//
//   npm test        (node test.ts)
//
// Needs Node 22.18 or later and npm install here (naive-framework comes from tchjhnsn/naive; see naive-git-auth.sh).
// Tests that need Postgres skip without MENTURA_EVAL_DATABASE_URL or their own database URL. Exit code 1 if any fails.

import { spawn } from "node:child_process";
import { availableParallelism } from "node:os";
import { naiveTs } from "./naive.ts";

const root = new URL(".", import.meta.url).pathname;

const steps: [string, string[]][] = [
  ["kits", ["kits/test.mjs"]],
  ["webhooks", ["webhooks/test.mjs"]],
  ["outside host: account isolation, held writes, agent refusal, signing-key file, log across processes", ["outside/host.test.ts"]],
  ["outside host: durable log on local Postgres (skips without a database URL)", ["outside/postgres-log.test.ts"]],
  ["outside host: database account isolation on outside_log (skips without a database URL)", ["outside/account-isolation.test.ts"]],
  ["outside host: requirement schema through Naive's validator", ["outside/requirement-schema.test.ts"]],
  ["outside host: Naive policy exports the bridge checks", ["agents/outside-policy.test.ts"]],
  ["research engine (cells, credibility, adapters, queue; stubs only)", ["research/research-test.mjs"]],
  ["connectors: GitHub contract, registration, router and catalog evals", ["connectors/eval.mjs"]],
  ["connectors: Postgres contract and a hosted run on a working copy (skips without MENTURA_EVAL_DATABASE_URL)", ["connectors/postgres-eval.ts"]],
  ["raw intake: claims across two workers (skips the database half without MENTURA_EVAL_DATABASE_URL)", ["intake/raw-intake-eval.ts"]],
  ["raw intake from GitHub: a signed push writes the raw files it added", ["intake/github-push-test.ts"]],
  ["hosted working copy: check out, run hosted, commit with base versions, retry on conflict", ["hosted/working-copy-test.ts"]],
  ["hosted workspace: naive_records, a second process, isolation, a refused write, a conflict (skips without a database URL)", ["hosted/account-workspace-test.ts"]],
  ["Mentura as Naive's platform adapter", ["adapter-test.mjs"]],
  ["LangSmith exporter", ["integrations/langsmith-test.mjs"]],
  ["LangChain over Naive: a deep agent edits records through the router", [...naiveTs, "agents/agents-test.ts"]],
  ["function agents", [...naiveTs, "agents/function-agent-test.ts"]],
  ["lead agents", [...naiveTs, "agents/lead-agent-test.ts"]],
  ["triage graph", [...naiveTs, "agents/triage-graph-test.ts"]],
  ["triage corrections", [...naiveTs, "agents/triage-ledger-test.ts"]],
  ["function researchers", [...naiveTs, "agents/research-test.ts"]],
  ["LangSmith replication", [...naiveTs, "integrations/langsmith-otel-test.ts"]],
  ["remote image fetcher", ["integrations/remote-image-test.mjs"]],
  ["site reader (offline)", ["integrations/site-test.mjs"]],
  ["Rho money source (offline)", ["integrations/rho-test.mjs"]],
  ["the bridge into Naive: signed identity, path guard, setup and judge errors", ["bridge/bridge-test.ts"]],
];

type Result = { name: string; code: number; out: string };
const run = ([name, args]: [string, string[]]): Promise<Result> => new Promise((done) => {
  const child = spawn(process.execPath, args, { cwd: root, stdio: ["ignore", "pipe", "pipe"] });
  let out = "";
  child.stdout.on("data", (d) => (out += d));
  child.stderr.on("data", (d) => (out += d));
  child.on("close", (code) => done({ name, code: code ?? 1, out }));
});

const workers = Number(process.env.TEST_WORKERS) || availableParallelism();
const results: Result[] = new Array(steps.length);
let next = 0;
await Promise.all(Array.from({ length: Math.min(workers, steps.length) }, async () => {
  while (next < steps.length) { const i = next++; results[i] = await run(steps[i]); }
}));

let failed = 0;
for (const r of results) {
  console.log(`${r.code === 0 ? "pass" : "FAIL"}  ${r.name}`);
  if (r.code !== 0) { failed++; console.log(r.out.trim().split("\n").slice(-30).map((l) => `      ${l}`).join("\n")); }
}
console.log(failed ? `${failed} of ${steps.length} failed` : `all ${steps.length} passing`);
process.exit(failed ? 1 : 0);
