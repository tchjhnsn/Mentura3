// The path a working copy pushes, turned into the route Naive's router writes (bridge/sync-paths.ts), proved
// against Naive's real route table: every writable record pattern must map to a route resolve() knows, so a push
// cannot quietly land a record somewhere the data model does not keep it.
import assert from "node:assert/strict";
import { resolve, routes } from "naive-framework/src/router/router.mjs";
import { syncPath, syncRoute, type RouteEntry } from "./sync-paths.ts";

interface Row extends RouteEntry { kind: string; actions: string[] }
const table = (routes() as Row[]).filter((r) => r.kind === "record" && r.actions.includes("write"));
assert.ok(table.length > 50, `the route table has ${table.length} writable record routes; that is too few to be the real one`);

// Every writable pattern maps to a route the router resolves. A new record type that breaks the rule fails here.
const unmapped: string[] = [];
let mapped = 0;
for (const r of table) {
  for (const pattern of r.files ?? []) {
    const path = pattern.replace(/\*/g, "sample");
    const route = syncRoute(table, path);
    if (!route || !(resolve(route) as { r: unknown }).r) { unmapped.push(`${path} -> ${route ?? "null"}`); continue; }
    mapped++;
  }
}
assert.deepEqual(unmapped, [], `these record paths map to no route the router knows:\n${unmapped.join("\n")}`);

// A named record wins over a collection's wildcard that would also match it.
assert.equal(syncRoute(table, "money/_summary.json"), "purpose/money/summary");
assert.equal(syncRoute(table, "operations/activity/_summary.json"), "operations/activity-summary");
assert.equal(syncRoute(table, "money/rent.json"), "money/rent");

// The shapes the contract's own examples use.
assert.equal(syncRoute(table, "foundation/problem.json"), "foundation/problem");
assert.equal(syncRoute(table, "decisions/pricing.decision.json"), "decisions/pricing");
assert.equal(syncRoute(table, "evidence/results/r1.json"), "evidence/r1");

// A path no record type claims is null, so the push refuses it rather than writing a raw file. venture.json has
// no route of its own, so sync cannot change it either.
for (const path of ["nothing/here.json", "venture.json", "provenance.jsonl", "README.md"]) {
  assert.equal(syncRoute(table, path), null, path);
}

// Nothing may leave the business folder, and nothing hidden may be named.
for (const bad of ["", "/etc/passwd", "../other/venture.json", "a/../b.json", "a//b.json", "a\\b.json", ".naive/cache.json", ".env", 7, null]) {
  assert.throws(() => syncPath(bad as unknown), /not a path inside the business/, String(bad));
}
for (const good of ["foundation/problem.json", "decisions/pricing.decision.json", "money/_summary.json"]) {
  assert.equal(syncPath(good), good);
}

console.log(`sync paths: ${mapped} record patterns map to a route the router resolves`);
