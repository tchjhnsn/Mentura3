// Writes a JSON Schema for every life record kind to packages/core/schemas/life/<app>.<kind>.schema.json, from
// packages/core/src/life-schemas.ts, and removes files there for kinds that no longer exist. It also writes the person
// record's schema to packages/core/schemas/person.schema.json, from packages/core/src/person-schema.ts. With --check it
// writes nothing and fails when a committed file is missing, stale or left over:
//   pnpm schemas            (npx tsx scripts/life-schemas.ts)
//   pnpm schemas --check
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { lifeSchemaFiles } from "../../packages/core/src/life-schemas.ts";
import { PERSON_SCHEMA_FILE, personSchemaFile } from "../../packages/core/src/person-schema.ts";

const schemas = join(import.meta.dirname, "../../packages/core/schemas");
const dir = join(schemas, "life");
const check = process.argv.includes("--check");
const want = lifeSchemaFiles();
mkdirSync(dir, { recursive: true });
const have = new Set(readdirSync(dir).filter((f) => f.endsWith(".schema.json")));

const problems: string[] = [];
for (const [name, text] of want) {
  const now = have.has(name) ? readFileSync(join(dir, name), "utf8") : null;
  if (now === text) continue;
  if (check) problems.push(`${name} is ${now === null ? "missing" : "stale"}`);
  else writeFileSync(join(dir, name), text);
}
for (const name of have) {
  if (want.has(name)) continue;
  if (check) problems.push(`${name} is not a life kind`);
  else rmSync(join(dir, name));
}

const person = personSchemaFile();
const personNow = (() => {
  try {
    return readFileSync(join(schemas, PERSON_SCHEMA_FILE), "utf8");
  } catch {
    return null;
  }
})();
if (personNow !== person) {
  if (check) problems.push(`${PERSON_SCHEMA_FILE} is ${personNow === null ? "missing" : "stale"}`);
  else writeFileSync(join(schemas, PERSON_SCHEMA_FILE), person);
}

if (problems.length > 0) {
  console.error(`Schemas are out of date. Run pnpm schemas in web/.\n${problems.join("\n")}`);
  process.exit(1);
}
console.log(check ? `${want.size} life schemas and the person schema are current.` : `Wrote ${want.size} life schemas to packages/core/schemas/life and ${PERSON_SCHEMA_FILE} to packages/core/schemas.`);
