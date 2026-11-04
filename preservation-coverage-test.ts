import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { coverage, LEDGER, markedIds, parseLedger, report } from "./preservation-coverage.ts";

const quote = "This fixture sentence is made up for the test and quotes no ledger row.";
const ledger = [
  "| id | Grok id(s) | Claude id(s) | idea | where it lives | date learned | repo status | repo pointer | verbatim text | conflict |",
  "|---|---|---|---|---|---|---|---|---|---|",
  `| N-001 | M1 |  | Copied idea | Grok audit: M1; location class: private store: Grok box notes | 2026-11-03 | not in any repo | none | "${quote}" |  |`,
  `| N-002 |  | C-002 | Missing idea | Claude memory: x; location class: Mac only | 2026-11-03 | not in any repo | a \\| b | "This passage exists nowhere in the repository tree at all." | yes |`,
  "| N-003 |  | C-003 | Built idea | location class: repo | 2026-11-03 | in-main built | `schema/x.mjs` | see the file |  |",
  "| N-004 |  | C-004 | Confidential Mentura item | confidential, held in private store at `preserve/claude-export/` | 2026-11-01 | not in any repo | pointer only | | |",
  "| N-005 |  | C-005 | Marked idea | location class: private store: Claude export | 2026-11-03 | not in any repo | none | short |  |",
  "| N-006 |  | C-006 | Ranged idea | location class: private store: Claude export | 2026-11-03 | open-PR | #1 | short |  |",
].join("\n");

const rows = parseLedger(ledger);
assert.equal(rows.length, 6);
assert.equal(rows[1].pointer, "a | b", "an escaped pipe stays inside its cell");
assert.deepEqual(rows[1].flags, ["at-risk", "conflict"]);
assert.deepEqual(rows[3].flags, ["confidential"]);
assert.equal(rows[3].source, "confidential, private store");
assert.equal(rows[0].source, "private store: Grok box notes");
assert.throws(() => parseLedger(`${ledger}\n${ledger.split("\n")[2]}`), /appears twice/);

const marker = "---\ntype: preserved\nstatus: preserved, not reconciled\nledger: N-005, N-006 to N-006\n---\n\n# Marker\n";
const notMarker = "---\ntype: design\nstatus: draft\n---\n\nN-002 is named here but this is not a marker.\n";
assert.deepEqual([...markedIds(new Map([["a.md", marker], ["b.md", notMarker]]))].sort(), ["N-005", "N-006"]);
assert.deepEqual([...markedIds(new Map([["c.md", "---\nstatus: preserved, not reconciled\n---\nN-010 to N-012\n"]]))], ["N-010", "N-011", "N-012"]);

// A row with a copy in the tree reads covered; one without reads uncovered.
const files = new Map<string, string>([
  [LEDGER, ledger],
  ["docs/design/copy.md", `Preserved: ${quote}\n`],
  ["docs/design/marker.md", marker],
  ["docs/reviews/other.md", "This passage exists nowhere in the repository tree at all."],
]);
const result = coverage(rows, files);
const by = Object.fromEntries(result.map((row) => [row.id, row.coveredBy]));
assert.deepEqual(by, { "N-001": "text", "N-002": null, "N-003": "status", "N-004": null, "N-005": "marker", "N-006": "marker" });

const withoutCopy = coverage(rows, new Map([[LEDGER, ledger]]));
assert.equal(withoutCopy[0].onMain, false, "without the copy the row reads uncovered");

const text = report(result);
assert.match(text, /^2 of 6 ledger rows have no copy in the repo\.\n/);
assert.match(text, /\nMac only \(1\)\n {2}N-002 not in any repo \[at-risk, conflict\]: Missing idea\n/);
assert.match(text, /\nconfidential, private store \(1\)\n {2}N-004 not in any repo \[confidential\]: Confidential Mentura item\n/);
assert.equal(report(result), text, "the report is the same on a second run");

// The command reads the real ledger: exit 0 without --check, and --check exits 1 exactly when a row is uncovered.
const script = new URL("./preservation-coverage.ts", import.meta.url).pathname;
const plain = spawnSync(process.execPath, [script], { encoding: "utf8" });
assert.equal(plain.status, 0, plain.stderr);
const count = Number(/^(\d+) of \d+ ledger rows/.exec(plain.stdout)?.[1]);
assert.ok(Number.isInteger(count), plain.stdout.slice(0, 200));
const check = spawnSync(process.execPath, [script, "--check"], { encoding: "utf8" });
assert.equal(check.status, count > 0 ? 1 : 0, check.stderr);
assert.equal(check.stdout, plain.stdout);
