// Runs the ontology program's tests and reports each one.
//
//   npm test        (node test.ts)
//
// Needs Node 22.19 or later and npm install here. The checks against the founder's real idea records run only when
// MENTURA_RECORDS names an export of the company tenant's store. Exit code 1 if any fails.

import { spawnSync } from "node:child_process";

const root = new URL(".", import.meta.url).pathname;
const steps: [string, string][] = [
  ["preservation coverage (ledger rows with no copy in the repo, grouped by source)", "preservation-coverage-test.ts"],
  ["ledger import (one idea record per merged ledger row, verbatim, confidential rows from the full ledger, reruns converge)", "import-ledger-test.ts"],
  ["golden rulings (the sample validates; bad rulings are rejected)", "golden-ruling-test.ts"],
  ["reconcile runner (proposals gated through the schema, EE-095 and Lean; reruns change nothing)", "reconcile-ideas-test.ts"],
  ["closure check (read-only closure record for program PRs)", "closure-check-test.ts"],
  ["agreement report (the committed report matches a fresh run)", "agreement-report-test.ts"],
];

let failed = 0;
for (const [name, file] of steps) {
  const r = spawnSync(process.execPath, [file], { cwd: root, encoding: "utf8" });
  console.log(`${r.status === 0 ? "pass" : "FAIL"}  ${name}`);
  if (r.status !== 0) { failed++; console.log(`${r.stdout}${r.stderr}`.trim().split("\n").slice(-20).map((l) => `      ${l}`).join("\n")); }
}
console.log(failed ? `${failed} of ${steps.length} failed` : `all ${steps.length} passing`);
process.exit(failed ? 1 : 0);
