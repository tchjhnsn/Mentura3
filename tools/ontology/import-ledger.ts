#!/usr/bin/env node
// Imports the merged preservation ledger as idea records (S3-PR1 of the ontology program, EE-114).
// Reads docs/mentura/reviews/2026-11-03-preservation/merged-ledger.md once and writes one founder-idea record per
// row to people/p-54697df9/ideas/n-NNN.json in the company's records, and FLAGS.tsv beside ideas/ with one row
// per record that trips a flag.
//
//   node tools/ontology/import-ledger.ts (--records <dir> | --person <folder>) [--ledger <file>] [--full <file>]
//
// --records is a folder exported from the company tenant's store (or MENTURA_RECORDS; see tools/ontology/records-folder.ts).
// Load what it writes back with platform/connectors/store-import.ts.
//
// The ledger names no person for its rows. Grok Bot and Claude remembered the ideas from work with
// Torian, so every row goes to his person folder (id p-54697df9, handle tchjhnsn).
//
// The record's text is the row's idea cell, byte for byte apart from the table's escaped pipe. The
// verbatim-text cell is not copied. It quotes the sources, and tools/ontology/preservation-coverage.ts counts a
// quoted passage found in the tree as a preserved source, so copying it would mark out-of-reach sources
// as preserved.
//
// The public ledger shows a confidential row as a pointer only. Its text comes unchanged from
// grok-store/merged-ledger.full.md on branch preserve/sources-2026-11-03 (or --full).
//
// The import sets id, text, captured and source. Status, importance, relations and scope are left for a
// model to propose and a person to settle (the Captured state in the program's Appendix E). A rerun keeps
// every other field already in a record, so it converges and never undoes a later ruling.
//
// The flags are the content rules of grok-store/flag-scan.py on the preserve branch, applied to each
// record file, plus mentura-confidential on every confidential row.

import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { PERSON, recordsFolder } from "./records-folder.ts";

const repo = join(fileURLToPath(new URL(".", import.meta.url)), "..", "..");
export const LEDGER = "docs/mentura/reviews/2026-11-03-preservation/merged-ledger.md";
export { PERSON };
const FULL_BRANCH = "preserve/sources-2026-11-03";
const FULL_PATH = "grok-store/merged-ledger.full.md";

export type Row = { mid: string; grok: string; claude: string; idea: string; learned: string; pointer: string };
export type Idea = { id: string; text: string; captured: string; source: string };
export type FlagRow = { path: string; sha256: string; flags: string[]; detail: string; added: string; cleanup: string };

export function parseRows(text: string): Map<string, Row> {
  const rows = new Map<string, Row>();
  for (const line of text.split("\n")) {
    if (!/^\| N-\d{3} \|/.test(line)) continue;
    const cells = line.trim().slice(1, -1).split(/(?<!\\)\|/).map((cell) => cell.replace(/\\\|/g, "|").trim());
    if (cells.length !== 10) throw new Error(`ledger row has ${cells.length} cells, not 10: ${line.slice(0, 40)}`);
    const [mid, grok, claude, idea, , learned, , pointer] = cells;
    if (rows.has(mid)) throw new Error(`ledger row ${mid} appears twice`);
    rows.set(mid, { mid, grok, claude, idea, learned, pointer });
  }
  return rows;
}

const isConfidential = (row: Row) => row.pointer === "pointer only";

function idea(row: Row, confidential: boolean): Idea {
  const captured = /^\d{4}-\d{2}-\d{2}/.exec(row.learned)?.[0];
  if (!captured) throw new Error(`${row.mid}: date learned "${row.learned}" does not start with a date`);
  const from = confidential ? `${FULL_PATH} row ${row.mid} on ${FULL_BRANCH} (confidential)` : `${LEDGER} row ${row.mid}`;
  const source = [from, row.grok && `Grok ${row.grok}`, row.claude && `Claude ${row.claude}`, `date learned ${row.learned}`].filter(Boolean).join("; ");
  return { id: row.mid.toLowerCase(), text: row.idea, captured, source };
}

export function ideasOf(ledger: string, full: () => string): { idea: Idea; confidential: boolean }[] {
  const rows = [...parseRows(ledger).values()];
  const fullRows = rows.some(isConfidential) ? parseRows(full()) : new Map<string, Row>();
  return rows.map((row) => {
    if (!isConfidential(row)) return { idea: idea(row, false), confidential: false };
    const whole = fullRows.get(row.mid);
    if (!whole || isConfidential(whole)) throw new Error(`${row.mid} is confidential and the full ledger has no full row for it`);
    return { idea: idea(whole, true), confidential: true };
  });
}

const MENTURA_TERMS = ["mentura", "research engine", "discovery record", "precog", "curation", "library internals"];
const count = (text: string, term: string) => text.split(term).length - 1;

function linesOf(rx: RegExp, text: string, cap = 8): string | null {
  const nums = text.split("\n").flatMap((line, i) => (rx.test(line) ? [i + 1] : []));
  if (!nums.length) return null;
  const more = nums.length > cap ? ` (+${nums.length - cap} more)` : "";
  return `${nums.length} lines (${nums.slice(0, cap).join(",")}${more})`;
}

type Rule = { flag: string; cleanup: string; detail: (_text: string, _confidential: boolean) => string | null };

const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const PHONE = /(\+?1[ .-]?)?\(?\b[2-9]\d{2}\)?[ .-]\d{3}[ .-]\d{4}\b/;

const RULES: Rule[] = [
  {
    flag: "names-polity",
    cleanup: "remove or reword the paused civic venture references before any public mirror",
    detail: (text) => { const at = linesOf(/pol[i]ty/i, text); return at && `paused civic venture named on ${at}`; },
  },
  {
    flag: "mentura-confidential",
    cleanup: "remove or redact before any public mirror; keep only in the private repo",
    detail: (text, confidential) => {
      // The folder these docs moved to (docs/mentura/) names the company, not a lane term.
      const low = text.toLowerCase().replaceAll("docs/mentura/", "docs/");
      const hits = MENTURA_TERMS.filter((t) => count(low, t)).map((t): [string, number] => [t, count(low, t)]);
      if (hits.some(([t]) => t === "mentura") && low.includes("pipeline")) hits.push(["pipeline", count(low, "pipeline")]);
      if (!hits.length && !confidential) return null;
      const terms = hits.length ? `Mentura lane terms: ${hits.sort(([a], [b]) => a.localeCompare(b)).map(([t, n]) => `${t} x${n}`).join(", ")}` : "no lane terms";
      return confidential ? `confidential row of the merged ledger; ${terms}` : terms;
    },
  },
  {
    flag: "personal-data-third-party",
    cleanup: "redact the named outside person before any public mirror or sharing",
    detail: (text) => {
      const found: string[] = [];
      const emails = new Set(text.match(EMAIL) ?? []);
      if (emails.size) found.push(`${emails.size} email addresses`);
      if (PHONE.test(text)) found.push("phone numbers");
      const named = linesOf(/\bRohith\b/i, text);
      if (named) found.push(`names a private outside person (talent lead) on ${named}`);
      return found.length ? found.join("; ") : null;
    },
  },
  {
    flag: "investor-relations",
    cleanup: "move to a restricted location or remove before any public mirror",
    detail: (text) => { const at = linesOf(/investors?\b|fundrais|cap table|term sheet|pitch deck/i, text); return at && `investor or fundraising material on ${at}`; },
  },
  {
    flag: "founder-personal",
    cleanup: "review with Torian and redact personal notes before any public mirror",
    detail: (text) => { const at = linesOf(/founder journal|private journal|\bjournal\b/i, text); return at && `founder journal mentions on ${at}`; },
  },
];

export function flagsOf(path: string, text: string, confidential: boolean, added: string): FlagRow | null {
  const hits = RULES.flatMap((rule) => { const detail = rule.detail(text, confidential); return detail ? [{ rule, detail }] : []; });
  if (!hits.length) return null;
  return {
    path,
    sha256: createHash("sha256").update(text).digest("hex"),
    flags: hits.map(({ rule }) => rule.flag),
    detail: hits.map(({ detail }) => detail).join(" | "),
    added,
    cleanup: hits.map(({ rule }) => rule.cleanup).join("; "),
  };
}

const HEADER = "path\tsha256\tflags\tdetail\tadded\tcleanup";

export function parseFlags(text: string): Map<string, FlagRow> {
  const rows = new Map<string, FlagRow>();
  for (const line of text.split("\n").slice(1).filter(Boolean)) {
    const [path, sha256, flags, detail, added, cleanup] = line.split("\t");
    rows.set(path, { path, sha256, flags: flags.split(","), detail, added, cleanup });
  }
  return rows;
}

function writeIfChanged(path: string, text: string): boolean {
  if (existsSync(path) && readFileSync(path, "utf8") === text) return false;
  mkdirSync(dirname(path), { recursive: true });
  const tmp = `${path}.${process.pid}.tmp`;
  writeFileSync(tmp, text);
  renameSync(tmp, path);
  return true;
}

function merged(path: string, imported: Idea): string {
  const existing: Record<string, unknown> = existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : {};
  const kept = Object.fromEntries(Object.entries(existing).filter(([key]) => !(key in imported)));
  return `${JSON.stringify({ ...imported, ...kept }, null, 2)}\n`;
}

export function importLedger(o: { ledger: string; full: () => string; person: string; today: string }) {
  const ideas = ideasOf(o.ledger, o.full);
  const flagsPath = join(o.person, "FLAGS.tsv");
  const before = existsSync(flagsPath) ? parseFlags(readFileSync(flagsPath, "utf8")) : new Map<string, FlagRow>();
  let written = 0;
  const flagRows: FlagRow[] = [];
  for (const { idea, confidential } of ideas) {
    const rel = `ideas/${idea.id}.json`;
    const text = merged(join(o.person, rel), idea);
    if (writeIfChanged(join(o.person, rel), text)) written++;
    const row = flagsOf(rel, text, confidential, o.today);
    const old = before.get(rel);
    if (row) flagRows.push(old && old.sha256 === row.sha256 ? { ...row, added: old.added } : row);
  }
  const tsv = [HEADER, ...flagRows.sort((a, b) => a.path.localeCompare(b.path)).map((r) => [r.path, r.sha256, r.flags.join(","), r.detail, r.added, r.cleanup].join("\t"))].join("\n");
  writeIfChanged(flagsPath, `${tsv}\n`);
  return { records: ideas.length, written, confidential: ideas.filter((i) => i.confidential).length, flagged: flagRows.length };
}

function fullFromBranch(): string {
  for (const ref of [`origin/${FULL_BRANCH}`, FULL_BRANCH]) {
    const shown = spawnSync("git", ["show", `${ref}:${FULL_PATH}`], { cwd: repo, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
    if (shown.status === 0) return shown.stdout;
  }
  throw new Error(`${FULL_PATH} is not readable on ${FULL_BRANCH}; run git fetch origin ${FULL_BRANCH} or pass --full <file>`);
}

function main(argv: string[]): number {
  const opt = (name: string) => { const i = argv.indexOf(name); return i === -1 ? undefined : argv[i + 1]; };
  const full = opt("--full");
  try {
    const result = importLedger({
      ledger: readFileSync(opt("--ledger") ?? join(repo, LEDGER), "utf8"),
      full: full ? () => readFileSync(full, "utf8") : fullFromBranch,
      person: opt("--person") ?? join(recordsFolder(argv), PERSON),
      today: new Date().toISOString().slice(0, 10),
    });
    process.stdout.write(`${result.records} records (${result.confidential} confidential), ${result.written} written, ${result.flagged} flagged in FLAGS.tsv\n`);
    return 0;
  } catch (e) {
    process.stderr.write(`${e instanceof Error ? e.message : String(e)}\n`);
    return 2;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) process.exitCode = main(process.argv.slice(2));
