#!/usr/bin/env node
// Preservation coverage. Reads docs/reviews/2026-11-03-preservation/merged-ledger.md and the files in
// the working tree, and prints every ledger row whose idea has no copy in the repo, grouped by where
// its text lives.
//
//   node scripts/preservation-coverage.ts           print the uncovered rows, exit 0
//   node scripts/preservation-coverage.ts --check   the same, exit 1 when any row is uncovered
//
// A row is covered when one of these holds:
//   1. its repo status is `in-main built`, `in-main decided not built` or `on main`;
//   2. a preservation marker in the tree names its id (a Markdown file whose front matter says
//      `status: preserved, not reconciled`; every N-NNN in it counts, and `N-001 to N-004` is a range);
//   3. one of its quoted passages of 30 characters or more appears in a file in the tree outside docs/reviews/.
// A row whose pointer names several sources reads covered when any one of them is preserved, and a marker
// counts every whole-word N-NNN it holds. Both are the plan's approximation of "has a copy on main".
// Confidential rows are checked like any other row and print their flags.

import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const LEDGER = "docs/reviews/2026-11-03-preservation/merged-ledger.md";
const MIN_QUOTE = 30;
const ON_MAIN = new Set(["in-main built", "in-main decided not built", "on main"]);
const AT_RISK = ["Claude project only (not exported)", "partly exported", "Mac only", "agent memory only, no copy", "unknown"];

export type Covered = "status" | "marker" | "text" | null;

export type LedgerRow = {
  id: string;
  idea: string;
  source: string;
  status: string;
  pointer: string;
  quotes: string[];
  flags: string[];
};

export type CoverageRow = LedgerRow & { onMain: boolean; coveredBy: Covered };

// Split a Markdown table row on pipes that are not escaped, then unescape.
function cells(line: string): string[] {
  const inner = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  return inner.split(/(?<!\\)\|/).map((cell) => cell.replace(/\\\|/g, "|").trim());
}

function quotesIn(text: string): string[] {
  const found: string[] = [];
  for (const match of text.matchAll(/"((?:[^"\\]|\\.)*)"/g)) {
    const quote = match[1].replace(/\\"/g, '"').trim();
    if (quote.length >= MIN_QUOTE) found.push(quote);
  }
  return found;
}

function sourceOf(where: string): string {
  if (/^confidential\b/i.test(where)) return "confidential, private store";
  const match = /location class:\s*([^;]+)/.exec(where);
  return match ? match[1].trim() : "unknown";
}

// Parse the ledger once, at the boundary, into typed rows.
export function parseLedger(text: string): LedgerRow[] {
  const rows: LedgerRow[] = [];
  const seen = new Set<string>();
  for (const line of text.split("\n")) {
    if (!/^\| N-\d{3} \|/.test(line)) continue;
    const parts = cells(line);
    if (parts.length < 9) throw new Error(`ledger row has ${parts.length} cells: ${line.slice(0, 40)}`);
    const [id, , , idea, where, , status, pointer] = parts;
    const rest = parts.slice(8, parts.length - 1).join(" | ");
    const conflict = parts.length >= 10 ? parts[parts.length - 1] : "";
    if (seen.has(id)) throw new Error(`ledger row ${id} appears twice`);
    seen.add(id);
    const source = sourceOf(where);
    const flags: string[] = [];
    if (source.startsWith("confidential")) flags.push("confidential");
    if (AT_RISK.some((risk) => source.startsWith(risk))) flags.push("at-risk");
    if (conflict) flags.push("conflict");
    rows.push({ id, idea, source, status, pointer, quotes: quotesIn(`${pointer} ${rest}`), flags });
  }
  return rows;
}

// Ids named by preservation markers: files whose front matter says `status: preserved, not reconciled`.
export function markedIds(files: Map<string, string>): Set<string> {
  const ids = new Set<string>();
  for (const [path, text] of files) {
    if (!path.endsWith(".md")) continue;
    const front = /^---\n([\s\S]*?)\n---\n/.exec(text);
    if (!front || !/^status: preserved, not reconciled$/m.test(front[1])) continue;
    for (const match of text.matchAll(/\bN-(\d{3})(?: to N-(\d{3}))?\b/g)) {
      const from = Number(match[1]);
      const to = match[2] ? Number(match[2]) : from;
      for (let n = from; n <= to; n++) ids.add(`N-${String(n).padStart(3, "0")}`);
    }
  }
  return ids;
}

export function coverage(rows: LedgerRow[], files: Map<string, string>): CoverageRow[] {
  const marked = markedIds(files);
  const texts = [...files.entries()].filter(([path]) => path !== LEDGER && !path.startsWith("docs/reviews/")).map(([, text]) => text);
  return rows.map((row) => {
    let coveredBy: Covered = null;
    if (ON_MAIN.has(row.status)) coveredBy = "status";
    else if (marked.has(row.id)) coveredBy = "marker";
    else if (row.quotes.some((quote) => texts.some((text) => text.includes(quote)))) coveredBy = "text";
    return { ...row, onMain: coveredBy !== null, coveredBy };
  });
}

export function report(rows: CoverageRow[]): string {
  const uncovered = rows.filter((row) => !row.onMain);
  const groups = new Map<string, CoverageRow[]>();
  for (const row of uncovered) groups.set(row.source, [...(groups.get(row.source) ?? []), row]);
  const lines = [`${uncovered.length} of ${rows.length} ledger rows have no copy in the repo.`];
  for (const source of [...groups.keys()].sort()) {
    const group = groups.get(source) ?? [];
    lines.push("", `${source} (${group.length})`);
    for (const row of group) {
      const flags = row.flags.length ? ` [${row.flags.join(", ")}]` : "";
      lines.push(`  ${row.id} ${row.status}${flags}: ${row.idea}`);
    }
  }
  return `${lines.join("\n")}\n`;
}

// Tracked and untracked files that git does not ignore, read as text; binary files are skipped.
export function treeFiles(root: string): Map<string, string> {
  const listed = spawnSync("git", ["ls-files", "-z", "--cached", "--others", "--exclude-standard"], { cwd: root, encoding: "utf8" });
  if (listed.status !== 0) throw new Error(`git ls-files failed: ${listed.stderr}`);
  const files = new Map<string, string>();
  for (const path of listed.stdout.split("\0").filter(Boolean).sort()) {
    if (/(^|\/)\.env/.test(path)) continue;
    let text: string;
    try {
      text = readFileSync(join(root, path), "utf8");
    } catch {
      continue;
    }
    if (!text.includes("\0")) files.set(path, text);
  }
  return files;
}

function main(argv: string[]): number {
  const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");
  const files = treeFiles(root);
  const ledger = files.get(LEDGER);
  if (ledger === undefined) {
    process.stderr.write(`${LEDGER} not found\n`);
    return 2;
  }
  const rows = coverage(parseLedger(ledger), files);
  process.stdout.write(report(rows));
  return argv.includes("--check") && rows.some((row) => !row.onMain) ? 1 : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) process.exitCode = main(process.argv.slice(2));
