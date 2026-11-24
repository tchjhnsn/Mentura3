import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

const script = new URL("./closure-check.ts", import.meta.url).pathname;
const root = mkdtempSync(join(tmpdir(), "closure-check-"));
const write = (rel: string, text: string) => {
  mkdirSync(dirname(join(root, rel)), { recursive: true });
  writeFileSync(join(root, rel), text);
};
const git = (...args: string[]) => {
  const out = spawnSync("git", ["-c", "user.name=t", "-c", "user.email=t@example.com", ...args], { cwd: root, encoding: "utf8" });
  assert.equal(out.status, 0, out.stderr);
  return out.stdout.trim();
};
const header = "| id | Grok id(s) | Claude id(s) | idea | where it lives | date learned | repo status | repo pointer | verbatim text | conflict |\n|---|---|---|---|---|---|---|---|---|---|\n";
const row = (id: string, pointer: string, where = "Grok audit", status = "open-PR") => `| ${id} |  |  | idea ${id} | ${where} | 2026-11-01 | ${status} | ${pointer} |  |  |\n`;
const record = (n: string, extra: object = {}) =>
  write(`people/p-54697df9/ideas/n-${n}.json`, JSON.stringify({ id: `n-${n}`, text: `idea N-${n}`, captured: "2026-11-01", source: `merged-ledger.md row N-${n}`, ...extra }));
const preserve = (pr: number, ledger: string, base: string, baseOid: string, headOid: string) => {
  write(`docs/mentura/design/preserved/framework/pr-${pr}/PRESERVED.md`, `---\nstatus: preserved, not reconciled\nledger: ${ledger}\n---\n`);
  write(`docs/mentura/design/preserved/framework/pr-${pr}/pr-${pr}.json`, JSON.stringify({ number: pr, baseRefName: base, baseRefOid: baseOid, headRefOid: headOid }));
};
const g7Open = "- [ ] G7. Whether `framework` is rebased onto `main` before closure. The default is no rebase, since stage 1 preserves its PRs from their own diffs. Blocks S4-PR2.\n";
const stage1 = 'Stage 1 closed on Torian\'s ruling of Nov 4, 2026 at 18:52Z: "Whatever you have access to is what we will continue with."\n';
const plan = (g7 = g7Open, ruling = stage1) =>
  write("docs/mentura/design/CLAUDE_HANDOFF_ONTOLOGY_PROGRAM.md", `PR ids in order are S1-PR0, S1-PR10, S4-PR1, S4-PR2.\n\n${g7}\n${ruling}\n- The open PRs this plan names are #901, #902, #903, #904 and #909.\n`);
const listed = "2026-11-05T12:00:00Z";
const openPrs = [
  [901, "framework PR one"],
  [902, "framework PR two"],
  [904, "unmapped PR"],
  [906, "feat(ontology): S4-PR1 closure check"],
  [907, "a PR the ledger names"],
  [908, "a PR nobody touched"],
];
write("docs/mentura/reviews/ontology-program/open-prs.tsv", `number\ttitle\tlisted\n${openPrs.map(([n, t]) => `${n}\t${t}\t${listed}`).join("\n")}\n`);
const run = () => spawnSync(process.execPath, [script, "--root", root, "--records", root], { encoding: "utf8" });
// Each verdict line keyed by its first word (`#901`, `framework`, ...), with the section heading above it.
const verdicts = (stdout: string) => {
  const found = new Map<string, { section: string; text: string }>();
  let section = "";
  for (const line of stdout.split("\n")) {
    if (line.startsWith("## ")) section = line.slice(3);
    else if (line.startsWith("- ") && /^- (#\d+|framework|preserve\/)/.test(line)) found.set(line.slice(2).split(/[ :]/)[0], { section, text: line.slice(2) });
  }
  return found;
};
const tree = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (name === ".git") return [];
    return statSync(path).isDirectory() ? tree(path) : [`${path}\n${readFileSync(path, "utf8")}`];
  });

try {
  git("init", "-q");
  plan();
  write(
    "docs/mentura/reviews/2026-11-03-preservation/merged-ledger.md",
    header +
      row("N-001", "PR #901") +
      row("N-002", "PR #902") +
      row("N-003", "part of it is in PR #902, not #9020", "location class: Mac only") +
      row("N-004", "PR #9020") +
      row("N-005", "PR #907", "location class: repo", "on main"),
  );
  git("add", "-A");
  git("commit", "-qm", "feat: land something (#903)");
  const tip = git("rev-parse", "HEAD");
  const head901 = "1".repeat(40);
  preserve(901, "N-001 (Grok audit id R1)", "framework", tip, head901);
  preserve(902, "N-002", "branch-of-901", head901, "2".repeat(40));
  record("001");
  record("002", { status: "open" });
  write("docs/mentura/reviews/ontology-program/reconcile/proposals.jsonl", '{"idea": "n-001", "field": "status", "value": "open"}\n');

  const before = tree(root);
  const out = run();
  assert.equal(out.status, 0, out.stderr);
  assert.equal(run().stdout, out.stdout, "two runs give the same record");
  assert.match(out.stdout, /^# Closure list, 2026-11-05\n/, "the record is dated by the open-PR listing, not the clock");
  assert.match(out.stdout, /```mermaid\nflowchart TD\n/, "the record carries its diagram");
  assert.match(out.stdout, /It is open, so its default holds\. The default is no rebase, since stage 1 preserves its PRs from their own diffs\./, "the record states gate G7's default");
  const v = verdicts(out.stdout);
  assert.deepEqual([...v.keys()], ["#901", "#902", "#904", "framework", "preserve/sources-2026-11-03", "#903", "#909", "#906", "#907", "#908"], "one line per PR and branch, grouped by section");
  assert.deepEqual(v.get("#901"), { section: "Safe to close", text: "#901 not merged: safe to close. Ideas N-001. Labels: 1 proposed only." }, "every idea on main reads safe to close; labels are information");
  assert.deepEqual(
    v.get("#902"),
    { section: "Blocked", text: "#902 not merged: missing N-003 (no idea record on main). Ideas N-002, N-003. Labels: 1 settled." },
    "a ledger row whose pointer names the PR counts, and its missing record is named",
  );
  assert.deepEqual(v.get("#903"), { section: "Nothing to close", text: `#903 merged into main as ${tip.slice(0, 7)}: nothing to close.` });
  assert.deepEqual(v.get("#904"), { section: "Blocked", text: "#904 not merged: no preservation marker lists its ideas, so they cannot be checked." }, "an unmapped PR is never safe to close");
  assert.deepEqual(v.get("#909"), { section: "Nothing to close", text: "#909 not merged and not open on GitHub: nothing to close." }, "a planned PR that is no longer open needs nothing");
  assert.equal(v.get("#906")?.text, "#906 is this program's own pull request (S4-PR1): it lands by merging, so there is nothing to close.");
  assert.deepEqual(
    v.get("#907"),
    { section: "Outside this list", text: "#907 not part of this program: ledger row N-005 names it, but the plan does not, and main holds no copy of its diff, so this list gives it no verdict." },
    "a PR the ledger names but the program does not preserve is never safe to close",
  );
  assert.equal(v.get("#908")?.text, "#908 not part of this program: no ledger row names it, so this list gives it no verdict.");
  assert.deepEqual(v.get("framework"), {
    section: "Blocked",
    text: `framework: missing N-003 (no idea record on main). Recorded tip ${tip.slice(0, 7)}. PRs #901 (N-001), #902 (N-002, N-003). Labels: 1 settled, 1 proposed only.`,
  });
  assert.deepEqual(
    v.get("preserve/sources-2026-11-03"),
    { section: "Blocked", text: "preserve/sources-2026-11-03: not safe to retire until S1-PR10 is done. 1 ledger row within reach has no copy on main: N-004." },
    "a reachable row with no copy blocks the source branch; the Mac-only row does not",
  );
  assert.deepEqual(tree(root), before, "the check writes nothing");

  record("003");
  write("docs/mentura/design/preserved/n-004.md", "---\nstatus: preserved, not reconciled\n---\nN-004\n");
  const all = verdicts(run().stdout);
  assert.match(all.get("#902")?.text ?? "", /^#902 not merged: safe to close\./, "adding the record clears the PR");
  assert.match(all.get("framework")?.text ?? "", /^framework: safe to close\./);
  assert.deepEqual(all.get("preserve/sources-2026-11-03"), {
    section: "Safe to close",
    text: "preserve/sources-2026-11-03: safe to retire, since S1-PR10 is done and every ledger row within reach has a copy on main. 1 ledger row stays out of reach under Torian's ruling of Nov 4, 2026 at 18:52Z that closed stage 1 (1 Mac only).",
  });

  plan(g7Open, "");
  assert.match(
    verdicts(run().stdout).get("preserve/sources-2026-11-03")?.text ?? "",
    /^preserve\/sources-2026-11-03: not safe to retire until S1-PR10 is done\. 1 ledger row within reach has no copy on main: N-003\.$/,
    "without the stage 1 ruling an out-of-reach row blocks too",
  );
  plan(g7Open.replace("[ ]", "[x]").replace("\n", " Decided Nov 6: no rebase.\n"));
  assert.match(run().stdout, /The plan records it as decided\. The default is no rebase, .* Decided Nov 6: no rebase\./, "a decided G7 reads as decided");
  plan();

  const marker902 = join(root, "docs/mentura/design/preserved/framework/pr-902/PRESERVED.md");
  const kept902 = readFileSync(marker902, "utf8");
  rmSync(marker902);
  const gone = verdicts(run().stdout);
  assert.equal(gone.get("#902")?.text, "#902 not merged: no preservation marker lists its ideas, so they cannot be checked.");
  assert.match(gone.get("framework")?.text ?? "", /^framework: cannot be checked, no preservation marker lists the ideas of #902\./, "a stacked PR without a marker blocks framework");
  assert.match(gone.get("framework")?.text ?? "", / PRs #901 \(N-001\), #902 \(/, "framework still names the unmapped PR");
  writeFileSync(marker902, kept902);

  preserve(905, "", "branch-of-902", "2".repeat(40), "5".repeat(40));
  const empty = verdicts(run().stdout);
  assert.match(empty.get("framework")?.text ?? "", /^framework: cannot be checked, no preservation marker lists the ideas of #905\./, "a stacked PR whose marker lists no ideas blocks framework");
  assert.match(empty.get("framework")?.text ?? "", /#905 \(no ideas listed\)/);
  assert.equal(empty.get("#905")?.section, "Nothing to close", "a preserved PR that is not open needs nothing");
  rmSync(join(root, "docs/mentura/design/preserved/framework/pr-905"), { recursive: true });

  preserve(901, "N-001", "framework", "f".repeat(40), head901);
  assert.match(verdicts(run().stdout).get("framework")?.text ?? "", /^framework: tip fffffff is not on main\./, "a framework tip off main blocks closure");

  write("docs/mentura/reviews/ontology-program/open-prs.tsv", `number\ttitle\tlisted\n901\tone\t${listed}\n902\ttwo\t2026-11-06T00:00:00Z\n`);
  assert.notEqual(run().status, 0, "an open-PR list with two listing times is refused");
  console.log("closure check: ok");
} finally {
  rmSync(root, { recursive: true, force: true });
}
