import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { report } from "./agreement-report.ts";
import { GOLDEN, IDEAS, PROPOSALS, STATE, readProposals } from "./reconcile-ideas.ts";
import { naiveTs } from "./naive.ts";

const repo = new URL("..", import.meta.url).pathname;
const script = join(repo, "scripts/agreement-report.ts");
const root = mkdtempSync(join(tmpdir(), "agreement-report-"));
const at = (p: string): string => join(root, p);
const write = (p: string, text: string): void => { mkdirSync(dirname(at(p)), { recursive: true }); writeFileSync(at(p), text); };
const ids = ["n-001", "n-002", "n-003", "n-004", "n-005"];
const run = (...args: string[]): { status: number | null; out: string } => {
  const r = spawnSync(process.execPath, [...naiveTs, script, "--root", root, "--records", root, ...args], { encoding: "utf8" });
  return { status: r.status, out: `${r.stdout}${r.stderr}` };
};
const reportText = (): string => { const f = readdirSync(at(GOLDEN)).find((n) => n.startsWith("AGREEMENT_"))!; return readFileSync(at(join(GOLDEN, f)), "utf8"); };

type Label = { idea: string; field: string; value: unknown; state: string };
/** Writes proposals.jsonl and a state.jsonl whose machines took exactly those lines, as the runner stores them. */
const seed = (labels: Label[], taken: Label[] = labels): void => {
  write(PROPOSALS, labels.map(({ idea, field, value }) => JSON.stringify({ idea, field, value })).join("\n") + "\n");
  write("taken.jsonl", taken.map(({ idea, field, value }) => JSON.stringify({ idea, field, value })).join("\n") + "\n");
  const { lines } = readProposals(at("taken.jsonl"), { ideas: new Map(ids.map((id) => [id, { id, text: id, relations: [] }])) });
  write(STATE, taken.map((l) => JSON.stringify({ idea: l.idea, field: l.field, state: l.state, proposal: { idea: l.idea, field: l.field, value: l.value }, taken: lines.get(`${l.idea}.${l.field}`)!.hash })).join("\n") + "\n");
};
/** Commits the report a fresh run gives, then checks that --check fails on the stale state alone and names the label. */
const failsStale = (key: string, why: RegExp, what: string): void => {
  const fresh = report(root, root);
  write(join(GOLDEN, `AGREEMENT_${fresh.date}.md`), fresh.text);
  const checked = run("--check");
  assert.equal(checked.status, 1, `${what} fails --check even though the report text is unchanged: ${checked.out}`);
  assert.doesNotMatch(checked.out, /differs from a fresh run|is missing|is not the current report/, `${what} leaves the report text unchanged`);
  assert.match(checked.out, new RegExp(`^FAIL 1 label in ${STATE} is stale: ${key.replace(".", "\\.")}$`, "m"), `${what} is named in the failure`);
  assert.match(checked.out, why, `${what} gives its reason`);
};
/** A ruling cites a comment or a decision card; the report reads neither. */
const rule = (idea: string, field: string, value: unknown): void => {
  const source = idea === "n-005" ? { card: { thread: "t", message: "m", chosen_at: "2026-11-05T00:00:00Z" } } : { comment: "https://github.com/o/r/issues/1#issuecomment-1" };
  write(join(GOLDEN, `${idea}.${field}.json`), JSON.stringify({ idea, field, value, ...source, ruled: "2026-11-05" }));
};

try {
  for (const id of ids) write(join(IDEAS, `${id}.json`), JSON.stringify({ id, text: `idea ${id}`, captured: id === "n-005" ? "2026-11-02" : "2026-11-01" }));
  mkdirSync(at(GOLDEN), { recursive: true });

  seed(ids.slice(0, 4).map((idea) => ({ idea, field: "status", value: "open", state: "Labeled" })));
  const empty = run();
  assert.equal(empty.status, 0, empty.out);
  assert.match(empty.out, /^status: without the symbolic checks n = 0, no percentage; with them n = 0, no percentage$/m, "zero rulings give n = 0 and no percentage");
  assert.ok(readdirSync(at(GOLDEN)).includes("AGREEMENT_2026-11-02.md"), "with no ruling the report is dated by the newest captured idea");
  assert.doesNotMatch(reportText(), /NaN|Infinity/, "zero rulings never divide by zero");
  assert.match(reportText(), /Trust in the gated labels is not measured yet\. There are 0 golden rulings/, "zero rulings say plainly that trust is not measured");
  assert.equal(run("--check").status, 0, "a fresh report passes --check");

  const four: Label[] = [
    { idea: "n-001", field: "status", value: "open", state: "Settled" },
    { idea: "n-002", field: "status", value: "open", state: "Settled" },
    { idea: "n-003", field: "status", value: "open", state: "Settled" },
    { idea: "n-004", field: "status", value: "open", state: "Disputed" },
    { idea: "n-005", field: "scope", value: { scope: "naive@strategy", via: "appends_to" }, state: "RoutedToScope" },
  ];
  seed(four);
  for (const idea of ["n-001", "n-002", "n-003"]) rule(idea, "status", "open");
  rule("n-004", "status", "dropped");
  rule("n-005", "scope", { scope: "naive@strategy", via: "appends_to" });
  assert.equal(run("--check").status, 1, "new rulings make the committed report stale");
  const known = run();
  assert.equal(known.status, 0, known.out);
  assert.match(known.out, /^status: without the symbolic checks 3 of 4, 75 percent \(95% interval \d+ to \d+\); with them 3 of 4, 75 percent/m, "3 of 4 matches give 75 percent for status");
  assert.match(known.out, /^scope: without the symbolic checks 1 of 1, 100 percent .*; with them n = 0, no percentage$/m, "a ruled label the gate routed counts without the checks only");
  const text = reportText();
  assert.ok(readdirSync(at(GOLDEN)).filter((f) => f.startsWith("AGREEMENT_")).join() === "AGREEMENT_2026-11-05.md", "the report is dated by the newest ruling and replaces the older one");
  assert.match(text, /^\| status \| 4 \| 3 of 4, 75 percent \(95% interval 30 to 95\) \| 3 of 4, 75 percent \(95% interval 30 to 95\) \| n = 0, no percentage \|$/m);
  assert.match(text, /^\| scope \| 1 \| 1 of 1, 100 percent .* \| n = 0, no percentage \| 1 of 1, 100 percent .* \|$/m, "held back by the gate counts the routed label");
  assert.match(text, /^\| naive@strategy \| 1 \|/m, "the scope table groups by the proposed scope");
  assert.match(text, /^## What limits the number$/m);
  assert.match(text, /- Sample size\. 4 of 4 gated labels have a ruling\./);
  assert.match(text, /- Missing nouns\. 1 label is RoutedToScope/);
  assert.equal(run("--check").status, 0, "the regenerated report passes --check");
  assert.match(run().out, /^no change$/m, "a rerun changes nothing");

  rule("n-003", "status", "shelved");
  const edited = run("--check");
  assert.equal(edited.status, 1, "an edited ruling makes --check fail");
  assert.match(edited.out, /AGREEMENT_2026-11-05\.md differs from a fresh run/);
  rule("n-003", "status", "open");

  seed(four.map((l) => l.idea === "n-002" ? { ...l, value: "in-venture" } : l), four);
  failsStale("n-002.status", /^STALE n-002\.status \(Settled\): HELD/m, "a held proposal");
  const refused = run();
  assert.equal(refused.status, 1, "a stale state is not reported on");
  assert.match(refused.out, /not written: 1 label .*n-002\.status/);

  seed([...four, { idea: "n-001", field: "importance", value: "high", state: "Labeled" }], four);
  failsStale("n-001.importance", /^STALE n-001\.importance \(none\): the runner has not taken this line/m, "a line the runner never took");

  seed(four.map((l) => l.idea === "n-001" ? { ...l, state: "Labeled" } : l));
  failsStale("n-001.status", /^STALE n-001\.status \(Labeled\): a ruling exists that the runner has not compared/m, "a Labeled label with a ruling");

  seed(four.filter((l) => l.idea !== "n-003"), four);
  failsStale("n-003.status", /^STALE n-003\.status \(Settled\): proposals\.jsonl has no line for this label/m, "a Settled label whose line left proposals.jsonl");

  // The committed report against the company's records, which live in the store since EE-118 step 9c: it runs when
  // MENTURA_RECORDS names an export (platform/connectors/store-export.ts), and says so when it does not.
  if (process.env.MENTURA_RECORDS) {
    const real = spawnSync(process.execPath, [...naiveTs, script, "--check"], { cwd: repo, encoding: "utf8" });
    assert.equal(real.status, 0, `the committed report matches a fresh run: ${real.stdout}${real.stderr}`);
  } else console.log("not checked: the committed report against the company's records (set MENTURA_RECORDS to an export)");
  console.log("agreement report: zero rulings give no percentage, 3 of 4 gives 75 percent, an edited ruling and each stale state fail --check, the committed report is fresh");
} finally {
  rmSync(root, { recursive: true, force: true });
}
