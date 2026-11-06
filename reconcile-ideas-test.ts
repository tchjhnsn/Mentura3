import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { QUEUE, STATE, TRANSITIONS } from "./reconcile-ideas.ts";
import { recordsIn, schemaFile } from "naive-framework/packages/records/index.mjs";
import { naivePath, naiveTs } from "./naive.ts";

const repo = new URL("..", import.meta.url).pathname;
const runner = join(repo, "scripts/reconcile-ideas.ts");
const root = mkdtempSync(join(tmpdir(), "reconcile-ideas-"));
const ideas = "instance/people/p-54697df9/ideas";
const proposals = join(root, "proposals.jsonl");
const at = (p: string): string => join(root, p);
const write = (p: string, data: unknown): void => { mkdirSync(dirname(at(p)), { recursive: true }); writeFileSync(at(p), typeof data === "string" ? data : `${JSON.stringify(data, null, 2)}\n`); };
const read = (p: string): string => existsSync(at(p)) ? readFileSync(at(p), "utf8") : "";
const jsonl = (p: string): Record<string, unknown>[] => read(p).split("\n").filter(Boolean).map((l) => JSON.parse(l));
const machine = (key: string): Record<string, unknown> | undefined => jsonl(STATE).find((m) => `${m.idea}.${m.field}` === key);
const propose = (...lines: unknown[]): void => writeFileSync(proposals, lines.map((l) => JSON.stringify(l)).join("\n") + "\n");
const rule = (idea: string, field: string, value: unknown, source: number | { card: object } = 1): void =>
  write(`docs/reviews/ontology-golden/${idea}.${field}.json`, { idea, field, value, ...(typeof source === "number" ? { comment: `https://github.com/tchjhnsn/everything-ecosystem/issues/1#issuecomment-${source}` } : source), ruled: "2026-11-05" });
const idea = (id: string, text: string, extra: object = {}): void => write(`${ideas}/${id}.json`, { id, text, captured: "2026-11-05", ...extra });

const covered = new Set<string>();
const reconcile = (): { status: number | null; out: string; steps: string[] } => {
  const r = spawnSync(process.execPath, [...naiveTs, runner, "--root", root, "--proposals", proposals, "--naive", root], { encoding: "utf8" });
  const out = `${r.stdout}${r.stderr}`;
  const steps = [...out.matchAll(/^(\S+): (.+?) -> (.+?) \((.+)\)$/gm)].map((m) => {
    const row = TRANSITIONS.find((t) => t.when === m[4]);
    assert.ok(row, `each printed step names an Appendix E row: ${m[0]}`);
    covered.add(`${row.from} -> ${row.to}`);
    return `${m[1]} ${m[2]} -> ${m[3]}`;
  });
  return { status: r.status, out, steps };
};

try {
  const doc = readFileSync(join(repo, "docs/design/CLAUDE_HANDOFF_ONTOLOGY_PROGRAM.md"), "utf8");
  const appendix = doc.slice(doc.indexOf("## Appendix E"));
  const rows = [...appendix.matchAll(/^\| (\S[^|]*?) \| (\S[^|]*?) \| (\S[^|]*?) \|$/gm)].slice(1).map((m) => `${m[1]} | ${m[2]} | ${m[3]}`);
  const table = TRANSITIONS.map((t) => `${t.from} | ${t.to} | ${t.when}`);
  assert.deepEqual(table, rows, "the runner's transition table is Appendix E, row for row");

  for (const p of ["docs/ontology-catalog.json", "docs/ontology.json", "schema/terms/admitted.json", "lean/Naive"]) cpSync(naivePath(p), at(p), { recursive: true });
  // The fixture holds Naive's files too (the runner gets --naive root), so a case can edit the ontology or Lean.
  // Its record types sit where the resolver says, as the runner reads them with recordsIn(naive).
  const fixtureRecords = recordsIn(root);
  mkdirSync(fixtureRecords.RECORDS, { recursive: true });
  for (const name of ["golden-ruling", "founder-idea", "ontology-metamodel"]) cpSync(schemaFile(name), fixtureRecords.schemaFile(name));
  for (let n = 1; n <= 7; n++) idea(`n-00${n}`, `Fixture idea ${n}`);

  propose(
    { idea: "n-001", field: "status", value: "open" },
    { idea: "n-002", field: "importance", value: "urgent" },
    { idea: "n-003", field: "scope", value: { scope: "naive@products", via: "appends_to" }, terms: ["reconcile widget@products"] },
  );
  let r = reconcile();
  assert.equal(r.status, 0, r.out);
  assert.equal(machine("n-001.status")?.state, "Labeled", "a valid proposal ends Labeled");
  assert.equal(machine("n-002.importance")?.state, "Captured", "a schema-invalid proposal ends Captured");
  assert.match(String(machine("n-002.importance")?.reason), /importance "urgent" is not one of high, medium, low/, "with the reason");
  assert.equal(machine("n-003.scope")?.state, "RoutedToScope", "a proposal with a missing term ends RoutedToScope");
  assert.deepEqual(machine("n-003.scope")?.missing, [{ term: "reconcile widget@products", owning: "naive@products" }], "with the owning scope");
  assert.deepEqual(jsonl(QUEUE).map((q) => [q.idea, q.field, q.ask]), [["n-001", "status", "rule"]], "a label with no ruling is one queue line for Torian");

  const state = read(STATE), queued = read(QUEUE);
  r = reconcile();
  assert.deepEqual(r.steps, [], `a rerun takes no transition: ${r.out}`);
  assert.match(r.out, /no change$/m);
  assert.equal(read(STATE), state, "a rerun leaves the state byte for byte");
  assert.equal(read(QUEUE), queued, "a rerun leaves the queue byte for byte");

  rule("n-001", "status", "open");
  r = reconcile();
  assert.deepEqual(r.steps, ["n-001.status Labeled -> GoldenCompare", "n-001.status GoldenCompare -> Settled"], r.out);
  assert.deepEqual(jsonl(QUEUE), [], "a settled label leaves the queue");

  const before = read("docs/ontology.json");
  const ontology = JSON.parse(before);
  ontology.nouns.push({ noun: "reconcile widget", level: "record", meaning: "A fixture noun", standard: "ours", status: "proposed", function: "products", handoff_type: false });
  write("docs/ontology.json", ontology);
  r = reconcile();
  assert.equal(machine("n-003.scope")?.state, "Labeled", `once the owning scope defines the term, the label is gated again: ${r.out}`);
  assert.ok(r.steps.includes("n-003.scope RoutedToScope -> Proposed"), r.out);
  write("docs/ontology.json", before);

  propose({ idea: "n-004", field: "relation", value: [{ relation: "related", to: "n-001" }] });
  const card = { thread: "cmsg_01Thread", message: "cmsg_01Card", chosen_at: "2026-11-05T16:10:00Z" };
  rule("n-004", "relation", [], { card });
  r = reconcile();
  assert.equal(machine("n-004.relation")?.state, "Disputed", `a label that differs from the ruling is Disputed: ${r.out}`);
  const disputes = jsonl(QUEUE).filter((q) => q.idea === "n-004");
  assert.equal(disputes.length, 1, "a dispute is one queue line");
  assert.equal(disputes[0].ask, "dispute");
  assert.deepEqual(disputes[0].ruling, []);
  assert.deepEqual(disputes[0].source, card, "a dispute names the decision card Torian ruled on");
  propose({ idea: "n-004", field: "relation", value: [] });
  r = reconcile();
  assert.deepEqual(r.steps, [], "a dispute waits for Torian; the runner never rules");
  assert.match(r.out, /^HELD n-004\.relation: Disputed takes no new proposal/m, "a new line for a disputed label is held, and said so");

  rule("n-004", "relation", [], 2);
  r = reconcile();
  assert.deepEqual(r.steps, ["n-004.relation Disputed -> Settled"], `Torian's new ruling settles the dispute: ${r.out}`);

  propose({ idea: "n-005", field: "status", value: "open", terms: [" leading space"] });
  r = reconcile();
  assert.equal(machine("n-005.status")?.state, "Rejected", r.out);
  assert.match(String(machine("n-005.status")?.reason), /not a noun the ontology metamodel admits/, "a term outside the metamodel is rejected at the schema check");
  propose({ idea: "n-005", field: "status", value: "open", terms: ["party"] });
  r = reconcile();
  assert.ok(r.steps.includes("n-005.status Rejected -> Proposed"), r.out);
  assert.match(String(machine("n-005.status")?.retry), /metamodel/, "the retry carries the reason");
  assert.equal(machine("n-005.status")?.state, "Labeled", "a top category is visible to every scope");

  propose({ idea: "n-006", field: "relation", value: [{ relation: "builds_on", to: "n-404" }] });
  r = reconcile();
  assert.match(String(machine("n-006.relation")?.reason), /typed-link T3: n-006 names idea n-404/, `a relation to no idea is rejected by the term engine: ${r.out}`);
  assert.equal(machine("n-006.relation")?.missing, undefined, "a dangling idea is not a missing term");

  const terms = read("lean/Naive/Terms.lean");
  write("lean/Naive/Terms.lean", terms.replaceAll("idea_inverse_involutive", "idea_inverse_renamed"));
  propose({ idea: "n-007", field: "importance", value: "high" });
  r = reconcile();
  assert.equal(machine("n-007.importance")?.state, "Rejected", r.out);
  assert.match(String(machine("n-007.importance")?.reason), /Lean disagrees with the code: .*idea_inverse_involutive/, "a Lean disagreement rejects at the proof check");
  write("lean/Naive/Terms.lean", terms);

  idea("n-001", "Fixture idea 1, edited");
  r = reconcile();
  assert.ok(r.steps.includes("n-001.status Settled -> Proposed"), `an edited idea reopens its settled labels: ${r.out}`);
  assert.equal(machine("n-001.status")?.state, "Settled", "and the ruling settles it again");
  assert.equal(machine("n-004.relation")?.state, "Disputed", "a label settled through a dispute reopens with its upstream idea, and the same difference is disputed again");

  idea("n-001", "Fixture idea 1, edited", { status: "shelved" });
  r = reconcile();
  assert.deepEqual(r.steps, ["n-001.status Settled -> end"], `a shelved idea ends its settled labels: ${r.out}`);

  writeFileSync(proposals, `${JSON.stringify({ idea: "n-999", field: "status", value: "open" })}\n`);
  r = reconcile();
  assert.equal(r.status, 1, "a line that names no idea exits 1");
  assert.match(r.out, /UNREAD line 1: names no idea/);

  const missed = TRANSITIONS.map((t) => `${t.from} -> ${t.to}`).filter((t) => !covered.has(t));
  assert.deepEqual(missed, [], "the test drives every Appendix E transition");

  const validate = (field: string, value: unknown): number | null => {
    const file = join(root, "ruling.json");
    writeFileSync(file, JSON.stringify({ idea: "n-001", field, value, comment: "https://github.com/a/b/issues/1#issuecomment-1", ruled: "2026-11-05" }));
    return spawnSync("python3", ["-I", naivePath("schema/validate.py"), "--schema", "golden-ruling.schema.json", "--file", file], { cwd: repo, encoding: "utf8" }).status;
  };
  const cases: [string, unknown, boolean][] = [
    ["status", "open", true], ["status", "high", false], ["importance", "low", true], ["relation", [], true],
    ["relation", [{ relation: "builds_on", to: "n-002" }], true], ["relation", [{ relation: "inspires", to: "n-002" }], false],
    ["relation", [{ relation: "related", to: "n-002", note: "x" }], false], ["scope", { scope: "shared", via: "creates" }, true],
    ["scope", { scope: "products", via: "creates" }, false], ["scope", { scope: "naive@it" }, false],
  ];
  for (const [k, [field, value, valid]] of cases.entries()) {
    assert.equal(validate(field, value), valid ? 0 : 1, `validate.py agrees on ${field} ${JSON.stringify(value)}`);
    idea(`c-${k}`, `Schema case ${k}`);
    propose({ idea: `c-${k}`, field, value });
    reconcile();
    const m = machine(`c-${k}.${field}`);
    assert.equal(m?.state === "Captured" && m.reason !== undefined, !valid, `the runner agrees with the golden ruling schema on ${field} ${JSON.stringify(value)}`);
  }

  const real = spawnSync(process.execPath, [...naiveTs, runner], { cwd: repo, encoding: "utf8" });
  assert.equal(real.status, 0, real.stderr);
  assert.match(real.stdout, /^218 ideas, \d+ proposals, \d+ labels( \([^)]*\))?, 0 transitions; no change$/m, "the committed state and queue are fresh for the committed proposals");
  console.log("reconcile runner: all pass");
} finally {
  rmSync(root, { recursive: true, force: true });
}
