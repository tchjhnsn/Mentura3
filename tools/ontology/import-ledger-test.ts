import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const script = new URL("./import-ledger.ts", import.meta.url).pathname;
const dir = mkdtempSync(join(tmpdir(), "import-ledger-"));
const header = [
  "| id | Grok id(s) | Claude id(s) | idea | where it lives | date learned | repo status | repo pointer | verbatim text | conflict |",
  "|---|---|---|---|---|---|---|---|---|---|",
];
const plain = '| N-001 | M1 |  | Records first, then models: a \\| pipe stays in its cell | Grok audit: M1 | 2026-10-26, 10-28 | not in any repo | none | "a quoted source" |  |';
const pointer = "| N-002 |  | C-002 | Confidential Mentura item | confidential, held in private store at `preserve/claude-export/` | 2026-11-01 | not in any repo | pointer only | | |";
const whole = "| N-002 |  | C-002 | The made-up research engine keeps a private journal for investors. | Claude memory: x | 2026-11-01 | not in any repo | artifact x | \"quote\" |  |";
const ledger = join(dir, "ledger.md");
const full = join(dir, "full.md");
const person = join(dir, "people/p-0a0a0a0a");
writeFileSync(ledger, [...header, plain, pointer, ""].join("\n"));
writeFileSync(full, [...header, plain, whole, ""].join("\n"));

const run = (...args: string[]) => spawnSync(process.execPath, [script, "--ledger", ledger, "--full", full, "--person", person, ...args], { encoding: "utf8" });
const read = (rel: string) => readFileSync(join(person, rel), "utf8");
const snapshot = () => Object.fromEntries(["FLAGS.tsv", ...readdirSync(join(person, "ideas")).map((f) => `ideas/${f}`)].map((rel) => [rel, read(rel)]));

try {
  const first = run();
  assert.equal(first.status, 0, first.stderr);
  assert.equal(first.stdout, "2 records (1 confidential), 2 written, 1 flagged in FLAGS.tsv\n");
  assert.deepEqual(readdirSync(join(person, "ideas")).sort(), ["n-001.json", "n-002.json"], "one record per ledger row");

  const one = JSON.parse(read("ideas/n-001.json"));
  assert.deepEqual(one, {
    id: "n-001",
    text: "Records first, then models: a | pipe stays in its cell",
    captured: "2026-10-26",
    source: `docs/mentura/reviews/2026-11-03-preservation/merged-ledger.md row N-001; Grok M1; date learned 2026-10-26, 10-28`,
  });
  assert.ok(plain.includes(` ${one.text.replace("|", "\\|")} `), "the text is the ledger's idea cell byte for byte, unescaped");
  assert.equal("status" in one || "importance" in one, false, "status and importance are left for a proposal");

  const two = JSON.parse(read("ideas/n-002.json"));
  assert.equal(two.text, "The made-up research engine keeps a private journal for investors.", "a confidential row takes its text from the full ledger");
  assert.match(two.source, /^grok-store\/merged-ledger\.full\.md row N-002 on preserve\/sources-2026-11-03 \(confidential\); Claude C-002;/);

  const flags = read("FLAGS.tsv").split("\n");
  assert.equal(flags[0], "path\tsha256\tflags\tdetail\tadded\tcleanup");
  const [path, sha, labels, detail, added] = flags[1].split("\t");
  assert.equal(path, "ideas/n-002.json");
  assert.equal(sha, spawnSync("sha256sum", [join(person, path)], { encoding: "utf8" }).stdout.split(" ")[0], "the row carries the record's sha256");
  assert.equal(labels, "mentura-confidential,investor-relations,founder-personal");
  assert.match(detail, /^confidential row of the merged ledger; Mentura lane terms: research engine x1 \| /);
  assert.match(added, /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(flags.length, 3, "an unflagged record has no row");

  const before = snapshot();
  const again = run();
  assert.equal(again.status, 0, again.stderr);
  assert.match(again.stdout, / 0 written,/);
  assert.deepEqual(snapshot(), before, "a rerun changes nothing");

  writeFileSync(join(person, "ideas/n-001.json"), JSON.stringify({ ...one, text: "edited by hand", status: "open", importance: "high" }, null, 2));
  writeFileSync(join(person, "FLAGS.tsv"), read("FLAGS.tsv").replace(added, "2026-01-01"));
  assert.equal(run().status, 0);
  const settled = JSON.parse(read("ideas/n-001.json"));
  assert.equal(settled.text, one.text, "a rerun restores the verbatim text");
  assert.deepEqual([settled.status, settled.importance], ["open", "high"], "a rerun keeps fields the import does not own");
  assert.equal(read("FLAGS.tsv").split("\n")[1].split("\t")[4], "2026-01-01", "an unchanged record keeps the date its row was added");

  writeFileSync(full, [...header, plain, ""].join("\n"));
  const missing = run();
  assert.equal(missing.status, 2);
  assert.match(missing.stderr, /N-002 is confidential and the full ledger has no full row for it/);

  writeFileSync(ledger, [...header, plain, plain, ""].join("\n"));
  assert.match(run().stderr, /ledger row N-001 appears twice/);
} finally {
  rmSync(dir, { recursive: true, force: true });
}

console.log("import-ledger: fixture rows, verbatim text, confidential row from the full ledger, FLAGS.tsv, rerun converges");
