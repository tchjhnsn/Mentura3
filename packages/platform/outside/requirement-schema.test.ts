// Shape of an outside requirement, checked by Naive's validator. Exits 2 when the pin is not installed.
// This does not admit a term and it does not call the term engine.

import { join } from "node:path";
import { naiveRequirementCheck } from "./naive-requirement.ts";

const here = new URL(".", import.meta.url).pathname;
const good = {
  id: "fin-reading-1",
  ventureId: "kettle",
  functionId: "finance",
  statement: "Finance needs a reading of a local directory.",
  gap: "GitHub issues, projects, discussions, docs, reviews, actions, and repository files do not hold this reading.",
  address: "finance",
  support: {
    status: "hypothesized",
    evidence: { kind: "founder-statement", recordPath: "knowledge/outside/fin-reading-1.json" },
    provenance: { by: "Ada", at: "2026-11-08T00:00:00.000Z" },
  },
};

try {
  const { Validator, registryOf } = await import("naive-framework/src/records/validate.mjs");
  const schemas = registryOf(join(here, "schemas"));
  const validator = new Validator(schemas);
  const schema = schemas.get("requirement.schema.json");
  if (schema === undefined) throw new Error("requirement.schema.json was not loaded");
  const id = typeof schema === "object" && schema !== null && "$id" in schema && typeof schema.$id === "string" ? schema.$id : "requirement.schema.json";
  const problems = (record: unknown) => validator.validate(JSON.parse(JSON.stringify(record)), schema, id) as unknown[];
  const ok = problems(good).length === 0;
  const bad = problems({ ...good, support: { ...good.support, status: "verified" } }).length > 0;
  const check = naiveRequirementCheck(["finance"]);
  const badId = check.accepted({ ...good, id: "Bad_ID", extra: true });
  const kept = check.accepted(good);
  console.log(`${ok ? "ok  " : "FAIL"}  a hypothesized requirement passes Naive's validator`);
  console.log(`${bad ? "ok  " : "FAIL"}  a verified status fails Naive's validator`);
  console.log(`${kept && !badId ? "ok  " : "FAIL"}  the production check refuses an id and an extra field the validator refuses`);
  if (!ok || !bad || !kept || badId) process.exit(1);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("Cannot find package 'naive-framework'")) {
    console.error(`BLOCKED naive-framework is not installed: ${message}`);
    process.exit(2);
  }
  console.error(message);
  process.exit(1);
}
