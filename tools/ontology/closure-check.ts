#!/usr/bin/env node
// Closure check (S4-PR1 and S4-PR2 of the ontology program). Writes the closure record for Torian: one verdict
// line for every open pull request, every pull request the plan names or main preserves as a patch, the
// `framework` branch and the `preserve/sources-2026-11-03` branch.
//
//   node tools/ontology/closure-check.ts --records <dir>               the full record, as docs/mentura/reviews/<date>-closure.md holds it
//   node tools/ontology/closure-check.ts --records <dir> --root <dir>  read another checkout
//
// --records is a folder exported from the company tenant's store (or MENTURA_RECORDS; see tools/ontology/records-folder.ts).
// A ledger row's copy counts when it is in the checkout or in the records folder.
//
// The plan asks to "confirm each has a settled record on main". Torian deferred his golden rulings on
// 2026-11-05: labels stay proposals in docs/mentura/reviews/ontology-program/reconcile/ and S3-PR5 waits, so no
// record on main is settled yet. This check therefore reads "settled record" as "an idea record exists
// under people/p-54697df9/ideas/ in the company's records for the ledger row" and prints `safe to close` when every idea
// has one. The label state (settled, proposed only or unlabelled) is shown as information, not a gate.
// A pull request whose marker is missing or lists no ideas reads `cannot be checked`, and so does framework
// while any pull request that reaches it does.
//
// A pull request is in the program when the plan names it or its patch is preserved under
// docs/mentura/design/preserved/framework/, since only then are its ideas, or its whole diff, on main. Any other open
// pull request gets a line that gives it no verdict, and one whose title names a program PR id (S4-PR1, ...)
// lands by merging instead.
//
// The source branch is safe to retire once S1-PR10 is done: every ledger row has a copy on main, except rows
// whose only copy the stage 1 ruling put out of reach (the Mac, agent memory, the private store).
//
// Inputs are files on main and local git history, so it runs offline and gives the same output for the
// same commit:
//   - the open pull requests: docs/mentura/reviews/ontology-program/open-prs.tsv, listed on GitHub with `gh api`;
//   - the plan's pull requests, program PR ids, gate G7 and stage 1 ruling: lines in the plan;
//   - the ideas a pull request carries: the `ledger:` ids in docs/mentura/design/preserved/framework/pr-N/PRESERVED.md,
//     plus every merged-ledger row whose repo pointer names `#N` (a superset, so closing waits on more ideas);
//   - which pull requests target framework: the base branch and commits in pr-N.json, stacked ones included;
//   - merged: a commit on HEAD whose subject ends with `(#N)`;
//   - the framework tip: the base commit the preserved metadata records, checked as an ancestor of HEAD;
//   - the idea records: each record's `source` names its ledger row;
//   - the ledger rows with no copy on main: tools/ontology/preservation-coverage.ts.
// It only reads. It never calls the forge, and it closes, comments on and deletes nothing.

import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { coverage, LEDGER, parseLedger, recordFiles, treeFiles } from "./preservation-coverage.ts";
import { IDEAS, ideasIn, recordsFolder } from "./records-folder.ts";

export const PLAN = "docs/mentura/design/CLAUDE_HANDOFF_ONTOLOGY_PROGRAM.md";
export const PRESERVED = "docs/mentura/design/preserved/framework";
export { IDEAS };
export const PROPOSALS = "docs/mentura/reviews/ontology-program/reconcile/proposals.jsonl";
export const OPEN_PRS = "docs/mentura/reviews/ontology-program/open-prs.tsv";
export const SOURCE_BRANCH = "preserve/sources-2026-11-03";

// Ledger sources whose only copy is somewhere Claude cannot reach. The stage 1 ruling leaves them on the
// coverage list without blocking S1-PR10.
export const OUT_OF_REACH = new Set(["Mac only", "agent memory only, no copy", "private store: Grok box notes", "confidential, private store"]);

export type Label = "settled" | "proposed only" | "unlabelled";

export const SECTIONS = ["Safe to close", "Blocked", "Nothing to close", "Outside this list"] as const;
export type Section = (typeof SECTIONS)[number];
export type Line = { section: Section; text: string };

export type PreservedPr = {
  number: number;
  ledger: string[];
  base: string;
  baseOid: string;
  headOid: string;
};

export type Repo = {
  planned: number[];
  programIds: string[];
  g7: string;
  stage1: string | null;
  listed: string;
  open: Map<number, string>;
  pointers: Map<number, string[]>;
  preserved: PreservedPr[];
  records: Map<string, { record: string; label: Label }>;
  merged: Map<number, string>;
  uncovered: { id: string; source: string }[];
  onMain: (_oid: string) => boolean;
};

export function plannedPrs(plan: string): number[] {
  const line = /The open PRs this plan names are ([^\n]+)/.exec(plan);
  if (!line) throw new Error(`${PLAN} has no "The open PRs this plan names are" line`);
  return [...line[1].matchAll(/#(\d+)/g)].map((m) => Number(m[1]));
}

export function programIds(plan: string): string[] {
  const line = /PR ids in order are ([^\n]+)/.exec(plan);
  if (!line) throw new Error(`${PLAN} has no "PR ids in order are" line`);
  return line[1].match(/\bS\d-PR\d+[a-z]?\b/g) ?? [];
}

export function gateG7(plan: string): string {
  const line = /^- \[([ x])\] G7\. (Whether [^.]+\.)(.*)$/m.exec(plan);
  if (!line) throw new Error(`${PLAN} has no gate G7 line`);
  const [, mark, question, rest] = line;
  const asked = `Gate G7 asks: "${question}"`;
  if (mark === "x") return `${asked} The plan records it as decided. ${rest.trim()}`;
  const fallback = /The default is (.+?)\.(?: |$)/.exec(rest);
  if (!fallback) throw new Error(`${PLAN} gate G7 is open and states no default`);
  return `${asked} It is open, so its default holds. The default is ${fallback[1]}. The framework line below reads the branch as it stands, not rebased onto main.`;
}

export function stage1Ruling(plan: string): string | null {
  return /^Stage 1 closed on Torian's ruling of ([^"\n]+?): "/m.exec(plan)?.[1] ?? null;
}

export function parseOpenPrs(text: string): { listed: string; open: Map<number, string> } {
  const [header, ...rows] = text.split("\n").filter(Boolean);
  if (header !== "number\ttitle\tlisted") throw new Error(`${OPEN_PRS} must start with the header number, title, listed`);
  const open = new Map<number, string>();
  const times = new Set<string>();
  for (const row of rows) {
    const [number, title, listed] = row.split("\t");
    if (!/^\d+$/.test(number) || !title || !listed) throw new Error(`${OPEN_PRS} has a malformed row: ${row}`);
    open.set(Number(number), title);
    times.add(listed);
  }
  if (times.size !== 1) throw new Error(`${OPEN_PRS} must hold one listing, with one time on every row`);
  return { listed: [...times][0], open };
}

export function ledgerIds(marker: string): string[] {
  const line = /^ledger:(.*)$/m.exec(marker);
  return line ? [...new Set(line[1].match(/\bN-\d{3}\b/g) ?? [])].sort() : [];
}

function short(oid: string): string {
  return oid.slice(0, 7);
}

// The pull requests whose base chain reaches the framework branch, in number order.
export function frameworkPrs(preserved: PreservedPr[]): PreservedPr[] {
  const byHead = new Map(preserved.map((pr) => [pr.headOid, pr]));
  const reaches = (pr: PreservedPr, seen: Set<number>): boolean => {
    if (pr.base === "framework") return true;
    const parent = byHead.get(pr.baseOid);
    return parent !== undefined && !seen.has(parent.number) && reaches(parent, new Set([...seen, pr.number]));
  };
  return preserved.filter((pr) => reaches(pr, new Set())).sort((a, b) => a.number - b.number);
}

// A pull request whose ideas no preservation marker lists cannot be checked, alone or as part of framework.
function unmapped(pr: PreservedPr): boolean {
  return pr.ledger.length === 0;
}

// The ledger ids a pull request carries: its marker's ids and the ledger rows whose pointer names it.
function carried(pr: PreservedPr, repo: Repo): string[] {
  return [...new Set([...pr.ledger, ...(repo.pointers.get(pr.number) ?? [])])].sort();
}

function ideasLine(ids: string[], repo: Repo): { missing: string[]; labels: string } {
  const missing = ids.filter((id) => !repo.records.has(id));
  const counts = new Map<Label, number>();
  for (const id of ids) {
    const label = repo.records.get(id)?.label;
    if (label) counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  const order: Label[] = ["settled", "proposed only", "unlabelled"];
  const labels = order.filter((l) => counts.has(l)).map((l) => `${counts.get(l)} ${l}`).join(", ");
  return { missing, labels: labels || "none" };
}

function programId(title: string, ids: string[]): string | undefined {
  return ids.find((id) => new RegExp(`(?<![\\w-])${id}(?!\\w)`).test(title));
}

function prLine(number: number, repo: Repo, preserved: Map<number, PreservedPr>): Line {
  const merged = repo.merged.get(number);
  if (merged) return { section: "Nothing to close", text: `#${number} merged into main as ${merged}: nothing to close.` };
  const title = repo.open.get(number);
  if (title === undefined) return { section: "Nothing to close", text: `#${number} not merged and not open on GitHub: nothing to close.` };
  const own = programId(title, repo.programIds);
  if (own) return { section: "Outside this list", text: `#${number} is this program's own pull request (${own}): it lands by merging, so there is nothing to close.` };

  const pr = preserved.get(number);
  if (repo.planned.includes(number) || pr) {
    if (!pr || unmapped(pr)) return { section: "Blocked", text: `#${number} not merged: no preservation marker lists its ideas, so they cannot be checked.` };
    const ids = carried(pr, repo);
    const { missing, labels } = ideasLine(ids, repo);
    const safe = missing.length === 0;
    const verdict = safe ? "safe to close" : `missing ${missing.join(", ")} (no idea record on main)`;
    return { section: safe ? "Safe to close" : "Blocked", text: `#${number} not merged: ${verdict}. Ideas ${ids.join(", ")}. Labels: ${labels}.` };
  }

  const rows = repo.pointers.get(number) ?? [];
  if (rows.length === 0) return { section: "Outside this list", text: `#${number} not part of this program: no ledger row names it, so this list gives it no verdict.` };
  const named = rows.length === 1 ? `ledger row ${rows[0]} names` : `ledger rows ${rows.join(", ")} name`;
  return {
    section: "Outside this list",
    text: `#${number} not part of this program: ${named} it, but the plan does not, and main holds no copy of its diff, so this list gives it no verdict.`,
  };
}

function frameworkLine(repo: Repo): Line {
  const framework = frameworkPrs(repo.preserved);
  const tips = [...new Set(framework.filter((pr) => pr.base === "framework").map((pr) => pr.baseOid))];
  const offMain = tips.filter((oid) => !repo.onMain(oid));
  const ids = [...new Set(framework.flatMap((pr) => carried(pr, repo)))].sort();
  const { missing, labels } = ideasLine(ids, repo);
  const unchecked = framework.filter(unmapped).map((pr) => `#${pr.number}`);
  const blocks = [
    ...(framework.length === 0 ? ["no preserved pull request targets it"] : []),
    ...(unchecked.length > 0 ? [`cannot be checked, no preservation marker lists the ideas of ${unchecked.join(", ")}`] : []),
    ...(offMain.length > 0 ? [`tip ${offMain.map(short).join(", ")} is not on main`] : []),
    ...(missing.length > 0 ? [`missing ${missing.join(", ")} (no idea record on main)`] : []),
  ];
  const verdict = blocks.length === 0 ? "safe to close" : blocks.join("; ");
  const prs = framework.map((pr) => `#${pr.number} (${carried(pr, repo).join(", ") || "no ideas listed"})`).join(", ");
  return {
    section: blocks.length === 0 ? "Safe to close" : "Blocked",
    text: `framework: ${verdict}. Recorded tip ${tips.map(short).join(", ") || "none"}. PRs ${prs || "none"}. Labels: ${labels}.`,
  };
}

function rowCount(count: number): string {
  return `${count} ledger ${count === 1 ? "row" : "rows"}`;
}

function sourceBranchLine(repo: Repo): Line {
  const reachable = repo.uncovered.filter((row) => !(repo.stage1 && OUT_OF_REACH.has(row.source)));
  if (reachable.length > 0) {
    return {
      section: "Blocked",
      text: `${SOURCE_BRANCH}: not safe to retire until S1-PR10 is done. ${rowCount(reachable.length)} within reach ${reachable.length === 1 ? "has" : "have"} no copy on main: ${reachable.map((row) => row.id).join(", ")}.`,
    };
  }
  const counts = new Map<string, number>();
  for (const row of repo.uncovered) counts.set(row.source, (counts.get(row.source) ?? 0) + 1);
  const groups = [...counts.keys()].sort().map((source) => `${counts.get(source)} ${source}`).join("; ");
  const rest = repo.uncovered.length > 0 ? ` ${rowCount(repo.uncovered.length)} ${repo.uncovered.length === 1 ? "stays" : "stay"} out of reach under Torian's ruling of ${repo.stage1} that closed stage 1 (${groups}).` : "";
  return { section: "Safe to close", text: `${SOURCE_BRANCH}: safe to retire, since S1-PR10 is done and every ledger row within reach has a copy on main.${rest}` };
}

export function closure(repo: Repo): Line[] {
  const preserved = new Map(repo.preserved.map((pr) => [pr.number, pr]));
  const numbers = [...new Set([...repo.planned, ...preserved.keys(), ...repo.open.keys()])].sort((a, b) => a - b);
  return [...numbers.map((number) => prLine(number, repo, preserved)), frameworkLine(repo), sourceBranchLine(repo)];
}

const DIAGRAM = [
  "```mermaid",
  "flowchart TD",
  "  pr[Pull request] --> merged{Commit on main ends with its number?}",
  "  merged -- yes --> nothing[Nothing to close]",
  "  merged -- no --> open{On the open list?}",
  "  open -- no --> nothing",
  "  open -- yes --> own{Title names a program PR id?}",
  "  own -- yes --> outside[Outside this list]",
  "  own -- no --> scope{Named by the plan or preserved as a patch?}",
  "  scope -- no --> outside",
  "  scope -- yes --> ideas{Every idea it carries has a record on main?}",
  "  ideas -- yes --> safe[Safe to close]",
  "  ideas -- no, or no marker --> blocked[Blocked]",
  "  fw[framework] --> fwq{Every PR on it safe and its tip on main?}",
  "  fwq -- yes --> safe",
  "  fwq -- no --> blocked",
  "  src[preserve/sources-2026-11-03] --> s1{S1-PR10 done?}",
  "  s1 -- yes --> safe",
  "  s1 -- no --> blocked",
  "```",
];

export function record(repo: Repo): string {
  const date = repo.listed.slice(0, 10);
  const lines = closure(repo);
  const sections = SECTIONS.flatMap((section) => {
    const body = lines.filter((line) => line.section === section).map((line) => `- ${line.text}`);
    return [`## ${section}`, "", ...(body.length > 0 ? body : ["None."]), ""];
  });
  return [
    `# Closure list, ${date}`,
    "",
    `This file is generated by \`tools/ontology/closure-check.ts\`. From the repository root, \`node tools/ontology/closure-check.ts > docs/mentura/reviews/${date}-closure.md\` writes it. A fresh run matches it byte for byte while main and the open pull request list stay the same.`,
    "",
    "It is a list for Torian. Claude closes no pull request and deletes no branch. Torian, or Grok Bot on his explicit go, acts on it.",
    "",
    "## Inputs",
    "",
    `- The open pull requests are in \`${OPEN_PRS}\`, listed on GitHub at ${repo.listed}. A pull request opened after that time is missing here, and one merged since then reads merged.`,
    `- The program's pull requests are the plan's list in \`${PLAN}\` and every patch preserved under \`${PRESERVED}/\`.`,
    `- An idea is on main when a file under \`${IDEAS}/\` in the company's records names its ledger row in \`source\`. Labels (settled, proposed only, unlabelled) are information and do not gate.`,
    "- The check compares ideas, not bytes. A file that only a closed pull request or a retired branch holds goes with it.",
    "",
    "## Gate G7",
    "",
    repo.g7,
    "",
    "## How a verdict is reached",
    "",
    ...DIAGRAM,
    "",
    ...sections,
  ].join("\n");
}

function git(root: string, args: string[]): { status: number | null; stdout: string } {
  const out = spawnSync("git", args, { cwd: root, encoding: "utf8" });
  return { status: out.status, stdout: out.stdout };
}

export function readRepo(root: string, recordsDir: string): Repo {
  const preserved: PreservedPr[] = [];
  for (const dir of readdirSync(join(root, PRESERVED)).filter((d) => /^pr-\d+$/.test(d)).sort()) {
    const marker = join(root, PRESERVED, dir, "PRESERVED.md");
    const meta = join(root, PRESERVED, dir, `${dir}.json`);
    if (!existsSync(meta)) continue;
    const json = JSON.parse(readFileSync(meta, "utf8")) as { number: number; baseRefName: string; baseRefOid: string; headRefOid: string };
    const ledger = existsSync(marker) ? ledgerIds(readFileSync(marker, "utf8")) : [];
    preserved.push({ number: json.number, ledger, base: json.baseRefName, baseOid: json.baseRefOid, headOid: json.headRefOid });
  }

  const proposed = new Set<string>();
  const proposals = join(root, PROPOSALS);
  if (existsSync(proposals)) {
    for (const line of readFileSync(proposals, "utf8").split("\n").filter(Boolean)) proposed.add((JSON.parse(line) as { idea: string }).idea);
  }
  const records = new Map<string, { record: string; label: Label }>();
  for (const file of readdirSync(ideasIn(recordsDir)).filter((f) => f.endsWith(".json")).sort()) {
    const idea = JSON.parse(readFileSync(join(ideasIn(recordsDir), file), "utf8")) as { id: string; source?: string; status?: string; importance?: string };
    const row = /\brow (N-\d{3})\b/.exec(idea.source ?? "");
    if (!row) continue;
    const label: Label = idea.status || idea.importance ? "settled" : proposed.has(idea.id) ? "proposed only" : "unlabelled";
    records.set(row[1], { record: idea.id, label });
  }

  const log = git(root, ["log", "--format=%H %s", "HEAD"]);
  if (log.status !== 0) throw new Error(`git log failed in ${root}`);
  const merged = new Map<number, string>();
  for (const line of log.stdout.split("\n")) {
    const m = /^(\w+) .*\(#(\d+)\)$/.exec(line);
    if (m && !merged.has(Number(m[2]))) merged.set(Number(m[2]), short(m[1]));
  }

  const plan = readFileSync(join(root, PLAN), "utf8");
  const planned = plannedPrs(plan);
  const { listed, open } = parseOpenPrs(readFileSync(join(root, OPEN_PRS), "utf8"));
  const files = new Map([...treeFiles(root), ...recordFiles(recordsDir)]);
  const rows = parseLedger(readFileSync(join(root, LEDGER), "utf8"));
  const numbers = [...new Set([...planned, ...preserved.map((pr) => pr.number), ...open.keys()])];
  const pointers = new Map(numbers.map((n) => [n, rows.filter((row) => new RegExp(`#${n}(?!\\d)`).test(row.pointer)).map((row) => row.id)]));
  const uncovered = coverage(rows, files)
    .filter((row) => !row.onMain)
    .map((row) => ({ id: row.id, source: row.source }));

  return {
    planned,
    programIds: programIds(plan),
    g7: gateG7(plan),
    stage1: stage1Ruling(plan),
    listed,
    open,
    pointers,
    preserved,
    records,
    merged,
    uncovered,
    onMain: (oid) => git(root, ["merge-base", "--is-ancestor", oid, "HEAD"]).status === 0,
  };
}

function main(argv: string[]): number {
  const at = argv.indexOf("--root");
  const root = at >= 0 ? resolve(argv[at + 1]) : join(fileURLToPath(new URL(".", import.meta.url)), "..", "..");
  let records: string;
  try { records = recordsFolder(argv); } catch (e) { process.stderr.write(`${(e as Error).message}\n`); return 2; }
  process.stdout.write(record(readRepo(root, records)));
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) process.exitCode = main(process.argv.slice(2));
