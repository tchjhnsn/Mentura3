// Writes a JSON Schema for every life record kind to packages/core/schemas/life/<app>.<kind>.schema.json, from
// packages/core/src/life-schemas.ts, and removes files there for kinds that no longer exist. With --check it writes
// nothing and fails when a committed file is missing, stale or left over:
//   pnpm schemas            (npx tsx scripts/life-schemas.ts)
//   pnpm schemas --check
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { lifeSchemaFiles } from "../../packages/core/src/life-schemas.ts";

const dir = join(import.meta.dirname, "../../packages/core/schemas/life");
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

if (problems.length > 0) {
  console.error(`Life schemas are out of date. Run pnpm schemas in web/.\n${problems.join("\n")}`);
  process.exit(1);
}
console.log(check ? `${want.size} life schemas are current.` : `Wrote ${want.size} life schemas to packages/core/schemas/life.`);
