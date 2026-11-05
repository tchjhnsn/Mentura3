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
const row = (id: string, pointer: string) => `| ${id} |  |  | idea ${id} | Grok audit | 2026-11-01 | open-PR | ${pointer} |  |  |\n`;
const record = (n: string, extra: object = {}) =>
  write(`instance/people/p-54697df9/ideas/n-${n}.json`, JSON.stringify({ id: `n-${n}`, text: `idea N-${n}`, captured: "2026-11-01", source: `merged-ledger.md row N-${n}`, ...extra }));
const preserve = (pr: number, ledger: string, base: string, baseOid: string, headOid: string) => {
  write(`docs/design/preserved/framework/pr-${pr}/PRESERVED.md`, `---\nstatus: preserved, not reconciled\nledger: ${ledger}\n---\n`);
  write(`docs/design/preserved/framework/pr-${pr}/pr-${pr}.json`, JSON.stringify({ number: pr, baseRefName: base, baseRefOid: baseOid, headRefOid: headOid }));
};
const run = () => spawnSync(process.execPath, [script, "--root", root], { encoding: "utf8" });
const tree = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (name === ".git") return [];
    return statSync(path).isDirectory() ? tree(path) : [`${path}\n${readFileSync(path, "utf8")}`];
  });

try {
  git("init", "-q");
  write("docs/design/CLAUDE_HANDOFF_ONTOLOGY_PROGRAM.md", "- The open PRs this plan names are #901, #902, #903 and #904.\n");
  write("docs/reviews/2026-11-03-preservation/merged-ledger.md", header + row("N-001", "PR #901") + row("N-002", "PR #902") + row("N-003", "part of it is in PR #902, not #9020") + row("N-004", "PR #9020"));
  git("add", "-A");
  git("commit", "-qm", "feat: land something (#903)");
  const tip = git("rev-parse", "HEAD");
  const head901 = "1".repeat(40);
  preserve(901, "N-001 (Grok audit id R1)", "framework", tip, head901);
  preserve(902, "N-002", "branch-of-901", head901, "2".repeat(40));
  record("001");
  record("002", { status: "open" });
  write("docs/reviews/ontology-program/reconcile/proposals.jsonl", '{"idea": "n-001", "field": "status", "value": "open"}\n');

  const before = tree(root);
  const out = run();
  assert.equal(out.status, 0, out.stderr);
  const lines = out.stdout.trimEnd().split("\n");
  assert.equal(lines.length, 5, "one line per planned pull request and one for framework");
  assert.equal(lines[0], "#901 not merged: safe to close. Ideas N-001. Labels: 1 proposed only.", "every idea on main reads safe to close; labels are information");
  assert.equal(lines[1], "#902 not merged: missing N-003 (no idea record on main). Ideas N-002, N-003. Labels: 1 settled.", "a ledger row whose pointer names the PR counts, and its missing record is named");
  assert.equal(lines[2], `#903 merged into main as ${tip.slice(0, 7)}: nothing to close.`);
  assert.equal(lines[3], "#904 not merged: no preservation marker lists its ideas, so they cannot be checked.", "an unmapped PR is never safe to close");
  assert.equal(
    lines[4],
    `framework: missing N-003 (no idea record on main). Recorded tip ${tip.slice(0, 7)}. PRs #901 (N-001), #902 (N-002, N-003). Labels: 1 settled, 1 proposed only.`,
    "framework names each PR on it, stacked ones included, and blocks on their missing ideas",
  );
  assert.deepEqual(tree(root), before, "the check writes nothing");

  record("003");
  const all = run().stdout.split("\n");
  assert.match(all[1], /^#902 not merged: safe to close\./, "adding the record clears the PR");
  assert.match(all[4], /^framework: safe to close\./);

  const marker902 = join(root, "docs/design/preserved/framework/pr-902/PRESERVED.md");
  const kept902 = readFileSync(marker902, "utf8");
  rmSync(marker902);
  const gone = run().stdout.split("\n");
  assert.equal(gone[1], "#902 not merged: no preservation marker lists its ideas, so they cannot be checked.");
  assert.match(gone[4], /^framework: cannot be checked, no preservation marker lists the ideas of #902\./, "a stacked PR without a marker blocks framework");
  assert.match(gone[4], / PRs #901 \(N-001\), #902 \(/, "framework still names the unmapped PR");
  writeFileSync(marker902, kept902);

  preserve(905, "", "branch-of-902", "2".repeat(40), "5".repeat(40));
  const empty = run().stdout.split("\n");
  assert.match(empty[4], /^framework: cannot be checked, no preservation marker lists the ideas of #905\./, "a stacked PR whose marker lists no ideas blocks framework");
  assert.match(empty[4], /#905 \(no ideas listed\)/);
  rmSync(join(root, "docs/design/preserved/framework/pr-905"), { recursive: true });

  preserve(901, "N-001", "framework", "f".repeat(40), head901);
  assert.match(run().stdout.split("\n")[4], new RegExp(`^framework: tip fffffff is not on main\\.`), "a framework tip off main blocks closure");
  console.log("closure check: ok");
} finally {
  rmSync(root, { recursive: true, force: true });
}
