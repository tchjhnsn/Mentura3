// Writes lean/Reflect/Generated/Ontology.lean from packages/core/src/terms/ontology.json.
//
//   node scripts/ontology-lean.ts           write the Lean file
//   node scripts/ontology-lean.ts --check   exit 1 when the committed file differs from a fresh run
//
// The generator itself is packages/core/src/terms/ontology-lean.ts.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { ONTOLOGY } from "../packages/core/src/terms/ontology.ts";
import { LEAN_ONTOLOGY_PATH, leanOntology } from "../packages/core/src/terms/ontology-lean.ts";

const target = fileURLToPath(new URL(`../${LEAN_ONTOLOGY_PATH}`, import.meta.url));
const fresh = leanOntology(ONTOLOGY);

if (process.argv.includes("--check")) {
  let current = "";
  try {
    current = readFileSync(target, "utf8");
  } catch {
    // A missing file is stale.
  }
  if (current !== fresh) {
    console.error(`${LEAN_ONTOLOGY_PATH} is stale: run node scripts/ontology-lean.ts`);
    process.exit(1);
  }
  console.log(`${LEAN_ONTOLOGY_PATH} is current`);
} else {
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, fresh);
  console.log(`wrote ${LEAN_ONTOLOGY_PATH}`);
}
