#!/usr/bin/env node
// Closure check (S4-PR1 of the ontology program). For each open pull request the plan names, and for the
// `framework` branch, list the ideas it carries and say whether each one exists as an idea record on main.
//
//   node scripts/closure-check.ts                one line per pull request, then one line for framework
//   node scripts/closure-check.ts --root <dir>   read another checkout
//
// The plan asks to "confirm each has a settled record on main". Torian deferred his golden rulings on
// 2026-11-05: labels stay proposals in docs/reviews/ontology-program/reconcile/ and S3-PR5 waits, so no
// record on main is settled yet. This check therefore reads "settled record" as "an idea record exists
// under instance/people/p-54697df9/ideas/ for the ledger row" and prints `safe to close` when every idea
// has one. The label state (settled, proposed only or unlabelled) is shown as information, not a gate.
// A pull request whose marker is missing or lists no ideas reads `cannot be checked`, and so does framework
// while any pull request that reaches it does.
//
// Inputs are files on main and local git history, so it runs offline and gives the same output for the
// same commit:
//   - the open pull requests: the plan's "The open PRs this plan names are" line;
//   - the ideas a pull request carries: the `ledger:` ids in docs/design/preserved/framework/pr-N/PRESERVED.md,
//     plus every merged-ledger row whose repo pointer names `#N` (a superset, so closing waits on more ideas);
//   - which pull requests target framework: the base branch and commits in pr-N.json, stacked ones included;
//   - merged: a commit on HEAD whose subject ends with `(#N)`;
//   - the framework tip: the base commit the preserved metadata records, checked as an ancestor of HEAD;
//   - the idea records: each record's `source` names its ledger row.
// It only reads. It never calls the forge, and it closes, comments on and deletes nothing.

import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { LEDGER, parseLedger } from "./preservation-coverage.ts";

export const PLAN = "docs/design/CLAUDE_HANDOFF_ONTOLOGY_PROGRAM.md";
export const PRESERVED = "docs/design/preserved/framework";
export const IDEAS = "instance/people/p-54697df9/ideas";
export const PROPOSALS = "docs/reviews/ontology-program/reconcile/proposals.jsonl";

export type Label = "settled" | "proposed only" | "unlabelled";

export type PreservedPr = {
  number: number;
  ledger: string[];
  base: string;
  baseOid: string;
  headOid: string;
};

export type Repo = {
  planned: number[];
  pointers: Map<number, string[]>;
  preserved: PreservedPr[];
  records: Map<string, { record: string; label: Label }>;
  merged: Map<number, string>;
  onMain: (_oid: string) => boolean;
};

export function plannedPrs(plan: string): number[] {
  const line = /The open PRs this plan names are ([^\n]+)/.exec(plan);
  if (!line) throw new Error(`${PLAN} has no "The open PRs this plan names are" line`);
  return [...line[1].matchAll(/#(\d+)/g)].map((m) => Number(m[1]));
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

export function closure(repo: Repo): string[] {
  const byNumber = new Map(repo.preserved.map((pr) => [pr.number, pr]));
  const lines = repo.planned.map((number) => {
    const merged = repo.merged.get(number);
    if (merged) return `#${number} merged into main as ${merged}: nothing to close.`;
    const pr = byNumber.get(number);
    if (!pr || unmapped(pr)) return `#${number} not merged: no preservation marker lists its ideas, so they cannot be checked.`;
    const ids = carried(pr, repo);
    const { missing, labels } = ideasLine(ids, repo);
    const verdict = missing.length === 0 ? "safe to close" : `missing ${missing.join(", ")} (no idea record on main)`;
    return `#${number} not merged: ${verdict}. Ideas ${ids.join(", ")}. Labels: ${labels}.`;
  });

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
  lines.push(`framework: ${verdict}. Recorded tip ${tips.map(short).join(", ") || "none"}. PRs ${prs || "none"}. Labels: ${labels}.`);
  return lines;
}

function git(root: string, args: string[]): { status: number | null; stdout: string } {
  const out = spawnSync("git", args, { cwd: root, encoding: "utf8" });
  return { status: out.status, stdout: out.stdout };
}

export function readRepo(root: string): Repo {
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
  for (const file of readdirSync(join(root, IDEAS)).filter((f) => f.endsWith(".json")).sort()) {
    const idea = JSON.parse(readFileSync(join(root, IDEAS, file), "utf8")) as { id: string; source?: string; status?: string; importance?: string };
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

  const planned = plannedPrs(readFileSync(join(root, PLAN), "utf8"));
  const rows = parseLedger(readFileSync(join(root, LEDGER), "utf8"));
  const pointers = new Map(planned.map((n) => [n, rows.filter((row) => new RegExp(`#${n}(?!\\d)`).test(row.pointer)).map((row) => row.id)]));

  return {
    planned,
    pointers,
    preserved,
    records,
    merged,
    onMain: (oid) => git(root, ["merge-base", "--is-ancestor", oid, "HEAD"]).status === 0,
  };
}

function main(argv: string[]): number {
  const at = argv.indexOf("--root");
  const root = at >= 0 ? resolve(argv[at + 1]) : join(fileURLToPath(new URL(".", import.meta.url)), "..");
  process.stdout.write(closure(readRepo(root)).join("\n") + "\n");
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) process.exitCode = main(process.argv.slice(2));
