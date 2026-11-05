// The agreement report (S3-PR4): how often a gated label matches Torian's golden ruling, per field, with and
// without the symbolic checks, the spread across scopes and what limits the number.
//
//   node scripts/agreement-report.ts [--root <dir>] [--check]
//
// Without the symbolic checks, each ruling is compared with the raw proposal for its idea and field in
// proposals.jsonl, whatever the gate did with it. With them, only labels that reached Labeled or a later state
// count, compared by the value the machine holds in state.jsonl. Values compare as the reconcile runner compares
// them (sameLabel), so a relation list is a set.
//
// The report is docs/reviews/ontology-golden/AGREEMENT_<date>.md. The date is the newest ruling's day, or with
// no ruling the newest captured day of the idea records, so a rerun on the same inputs writes the same file. A
// run writes the file only when it changed and removes any other AGREEMENT_*.md, which git keeps. --check writes
// nothing and exits 1 when the committed report differs from a fresh run.
//
// Both modes exit 1, naming the labels, when state.jsonl is stale against proposals.jsonl: a label at Labeled or
// later whose line changed (the runner prints HELD and leaves it), a line the runner has not taken yet, or a
// Labeled label with a ruling the runner has not compared.

import { existsSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { GOLDEN, IDEAS, PROPOSALS, STATE, readProposals, readState, sameLabel } from "./reconcile-ideas.ts";
import type { Field, Json, Machine, StateName } from "./reconcile-ideas.ts";

const FIELDS: readonly Field[] = ["status", "importance", "relation", "scope"];
/** States a label reaches only after every symbolic check passed. */
const GATED: ReadonlySet<StateName> = new Set<StateName>(["Labeled", "GoldenCompare", "Settled", "Disputed", "end"]);
/** States that take a changed proposal line on the next run (Appendix E: Captured -> Proposed, Rejected -> Proposed). */
const TAKES_LINES: ReadonlySet<StateName> = new Set<StateName>(["Captured", "Rejected"]);
const DAY = /^\d{4}-\d{2}-\d{2}$/;

type Ruling = { idea: string; field: Field; value: Json; ruled: string };
type Tally = { n: number; agree: number };
/** One ruled label with what each side of the comparison saw. */
type Compared = { field: Field; scope: string; raw: boolean | null; gated: boolean | null; heldBack: boolean | null };
type Stale = { key: string; state: StateName | "none"; why: string };

const count = (n: number, noun: string): string => `${n} ${noun}${n === 1 ? "" : "s"}`;
const keyOf = (idea: string, field: Field): string => `${idea}.${field}`;
const isObject = (x: unknown): x is { [key: string]: Json } => typeof x === "object" && x !== null && !Array.isArray(x);
const valueOf = (p: Json | undefined): Json => (isObject(p) ? p.value : null) ?? null;
const add = (t: Tally, match: boolean | null): void => { if (match !== null) { t.n++; if (match) t.agree++; } };
const tally = (rows: Compared[], side: "raw" | "gated" | "heldBack"): Tally => { const t = { n: 0, agree: 0 }; for (const r of rows) add(t, r[side]); return t; };

function readRulings(root: string): Ruling[] {
  const dir = join(root, GOLDEN);
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((f) => f.endsWith(".json")).sort().map((f) => {
    const r = JSON.parse(readFileSync(join(dir, f), "utf8")) as { idea?: unknown; field?: unknown; value?: Json; ruled?: unknown };
    if (typeof r.idea !== "string" || !(FIELDS as readonly unknown[]).includes(r.field) || f !== `${r.idea}.${String(r.field)}.json`) throw new Error(`${GOLDEN}/${f} is not a ruling named <idea>.<field>.json`);
    if (typeof r.ruled !== "string" || !DAY.test(r.ruled)) throw new Error(`${GOLDEN}/${f} has no ruled day`);
    return { idea: r.idea, field: r.field as Field, value: r.value ?? null, ruled: r.ruled };
  });
}

/** 95 percent Wilson interval, in whole percent. */
function wilson({ n, agree }: Tally): [number, number] {
  const z = 1.96, p = agree / n, d = 1 + (z * z) / n;
  const mid = (p + (z * z) / (2 * n)) / d, half = (z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) / d;
  return [Math.round(Math.max(0, mid - half) * 100), Math.round(Math.min(1, mid + half) * 100)];
}
const percent = (t: Tally): string => { const v = (100 * t.agree) / t.n; return Number.isInteger(v) ? String(v) : v.toFixed(1); };
const cell = (t: Tally): string => t.n === 0 ? "n = 0, no percentage" : `${t.agree} of ${t.n}, ${percent(t)} percent (95% interval ${wilson(t).join(" to ")})`;

export type Report = { date: string; text: string; perField: { field: Field | "all"; raw: Tally; gated: Tally }[]; stale: Stale[] };

export function report(root: string): Report {
  const ideaFiles = readdirSync(join(root, IDEAS)).filter((f) => f.endsWith(".json"));
  const ideas = new Map(ideaFiles.map((f) => {
    const r = JSON.parse(readFileSync(join(root, IDEAS, f), "utf8")) as { id: string; text: string; captured?: string };
    return [r.id, { id: r.id, text: r.text, relations: [], captured: r.captured }];
  }));
  const { lines } = readProposals(join(root, PROPOSALS), { ideas });
  const machines: Map<string, Machine> = readState(join(root, STATE));
  const rulings = readRulings(root);

  const stale: Stale[] = [];
  for (const [key, line] of [...lines].sort(([a], [b]) => a.localeCompare(b))) {
    const m = machines.get(key);
    if (m?.taken === line.hash) continue;
    if (!m || TAKES_LINES.has(m.state)) stale.push({ key, state: m?.state ?? "none", why: "the runner has not taken this line; run node scripts/reconcile-ideas.ts" });
    else stale.push({ key, state: m.state, why: `HELD: proposals.jsonl changed after the label reached ${m.state}, and Appendix E gives ${m.state} no arrow to take it; restore the line the label took or reset the label` });
  }
  for (const r of rulings) {
    const key = keyOf(r.idea, r.field);
    if (machines.get(key)?.state === "Labeled") stale.push({ key, state: "Labeled", why: "a ruling exists that the runner has not compared; run node scripts/reconcile-ideas.ts" });
  }

  const proposedScope = (idea: string): string => {
    const v = valueOf(lines.get(keyOf(idea, "scope"))?.proposal);
    return isObject(v) && typeof v.scope === "string" ? v.scope : "no proposed scope";
  };
  const rows: Compared[] = rulings.map((r) => {
    const line = lines.get(keyOf(r.idea, r.field));
    const m = machines.get(keyOf(r.idea, r.field));
    const raw = line ? sameLabel(valueOf(line.proposal), r.value) : null;
    const gated = m && GATED.has(m.state) ? sameLabel(valueOf(m.proposal), r.value) : null;
    return { field: r.field, scope: proposedScope(r.idea), raw, gated, heldBack: raw !== null && gated === null ? raw : null };
  });

  const newestRuling = rulings.map((r) => r.ruled).sort().at(-1);
  const date = newestRuling ?? [...ideas.values()].map((i) => i.captured ?? "").filter((d) => DAY.test(d)).sort().at(-1) ?? "undated";

  const states = new Map<string, number>();
  for (const m of machines.values()) states.set(m.state, (states.get(m.state) ?? 0) + 1);
  const stateList = [...states].sort(([a], [b]) => a.localeCompare(b)).map(([s, n]) => `${n} ${s}`).join(", ") || "none";
  const gatedLabels = [...machines.values()].filter((m) => GATED.has(m.state)).length;

  const perField = [...FIELDS, "all" as const].map((field) => {
    const mine = field === "all" ? rows : rows.filter((r) => r.field === field);
    return { field, rulings: mine.length, raw: tally(mine, "raw"), gated: tally(mine, "gated"), heldBack: tally(mine, "heldBack") };
  });
  const scopes = [...new Set(rows.map((r) => r.scope))].sort().map((scope) => {
    const mine = rows.filter((r) => r.scope === scope);
    return { scope, rulings: mine.length, raw: tally(mine, "raw"), gated: tally(mine, "gated") };
  });
  const measured = scopes.filter((s) => s.gated.n > 0).map((s) => ({ ...s, rate: s.gated.agree / s.gated.n })).sort((a, b) => a.rate - b.rate || a.scope.localeCompare(b.scope));

  const routed = [...machines.values()].filter((m) => m.state === "RoutedToScope");
  const missingTerms = new Map<string, Set<string>>();
  for (const m of routed) for (const x of m.missing ?? []) { const s = missingTerms.get(x.owning) ?? new Set(); s.add(x.term); missingTerms.set(x.owning, s); }
  const distinctMissing = new Set([...missingTerms.values()].flatMap((s) => [...s])).size;
  const unproposed = rows.filter((r) => r.raw === null).length;
  const all = perField.at(-1)!;

  const out: string[] = [];
  out.push(`# Agreement between gated labels and Torian's rulings, ${date}`, "");
  out.push("This file is generated by `scripts/agreement-report.ts`. From the repository root, `node scripts/agreement-report.ts` rewrites it, and `node scripts/agreement-report.ts --check` exits 1 when the committed file differs from a fresh run. Do not edit it by hand.", "");
  out.push(`The date is ${newestRuling ? "the day of the newest ruling" : "the newest captured day of the idea records, because no ruling exists yet"}. The inputs are ${ideas.size} idea records, ${lines.size} proposals in \`${PROPOSALS}\`, ${machines.size} labels in \`${STATE}\` (${stateList}) and ${rulings.length} rulings in \`${GOLDEN}/\`.`, "");
  if (!rulings.length) out.push("Trust in the gated labels is not measured yet. There are 0 golden rulings, so every sample size below is 0 and no percentage is given. Nothing in this report says how often a gated label is right.", "");
  out.push("## Agreement per field", "");
  out.push("Without the symbolic checks, each ruling is compared with the raw proposal for its idea and field, whatever the gate did with it. With them, only labels that reached Labeled or a later state count. Held back counts ruled labels the gate kept from Labeled, and how many of those the proposal had right. Each cell gives the matches, the sample size and, when the sample is not empty, the percentage with its 95% Wilson interval.", "");
  out.push("| field | rulings | without the symbolic checks | with the symbolic checks | held back by the gate |", "|---|---|---|---|---|");
  for (const f of perField) out.push(`| ${f.field} | ${f.rulings} | ${cell(f.raw)} | ${cell(f.gated)} | ${cell(f.heldBack)} |`);
  out.push("", "## Spread across scopes", "");
  out.push("A label's scope is the scope proposed for its idea in the scope line of `proposals.jsonl`, since the idea records carry none.", "");
  if (!scopes.length) out.push("No ruling exists yet, so there is no spread to report.");
  else {
    out.push("| scope | rulings | without the symbolic checks | with the symbolic checks |", "|---|---|---|---|");
    for (const s of scopes) out.push(`| ${s.scope} | ${s.rulings} | ${cell(s.raw)} | ${cell(s.gated)} |`);
    out.push("", measured.length > 1
      ? `With the symbolic checks, agreement runs from ${percent(measured[0].gated)} percent in ${measured[0].scope} (n = ${measured[0].gated.n}) to ${percent(measured.at(-1)!.gated)} percent in ${measured.at(-1)!.scope} (n = ${measured.at(-1)!.gated.n}).`
      : `Fewer than two scopes have a gated label with a ruling, so there is no spread yet.`);
  }
  out.push("", "## What limits the number", "");
  out.push(`- Sample size. ${all.gated.n} of ${count(gatedLabels, "gated label")} ${all.gated.n === 1 ? "has" : "have"} a ruling. ${all.gated.n === 0 ? "With n = 0 there is no estimate at all." : "The 95% interval in each cell is the width that sample size allows, and it narrows only as rulings are added."}`);
  out.push(`- Selection of the sample. A ruling counts wherever it came from, so the number describes the labels Torian chose to rule on, not every label. \`SAMPLE.md\`, the one drawn sample so far, is stratified by field and value and drawn only from labels that reached Labeled, so it over-weights rare values. A rule applied to a class of ideas (for example every mixed-scope idea) measures that class only. ${all.heldBack.n === 0 ? "No ruled label was held back by the gate, so the two columns compare the same labels and cannot differ yet; the effect of the symbolic checks shows only once rulings cover labels the gate rejected." : `${count(all.heldBack.n, "ruled label")} held back by the gate ${all.heldBack.n === 1 ? "is" : "are"} counted in the last column, and the proposal had ${all.heldBack.agree} of them right.`}`);
  out.push(`- Missing nouns. ${count(routed.length, "label")} ${routed.length === 1 ? "is" : "are"} RoutedToScope because ${count(distinctMissing, "term")} ${distinctMissing === 1 ? "is" : "are"} missing from the scope they are used in${missingTerms.size ? ` (owning scopes: ${[...missingTerms].sort(([a], [b]) => a.localeCompare(b)).map(([s, t]) => `${s} ${t.size}`).join(", ")})` : ""}. They never reach Labeled, so the column with the symbolic checks cannot measure them until the owning scopes define the terms.`);
  out.push(`- Rulings without a proposal. ${count(unproposed, "ruling")} ${unproposed === 1 ? "names" : "name"} a label with no line in \`proposals.jsonl\` and count in neither column.`);
  out.push("- Exact match. A label agrees only when its value equals the ruling. A relation list that shares some items with the ruling counts as a miss, and a scope with the right scope but another attachment counts as a miss.");
  out.push("- One run. Every proposal comes from one proposals file, so the number describes that run, not a proposer in general.");
  out.push("");
  return { date, text: out.join("\n"), perField: perField.map(({ field, raw, gated }) => ({ field, raw, gated })), stale };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const arg = (name: string): string | undefined => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : undefined; };
  const root = resolve(arg("--root") ?? join(dirname(new URL(import.meta.url).pathname), ".."));
  const check = process.argv.includes("--check");
  const r = report(root);
  for (const f of r.perField) console.log(`${f.field}: without the symbolic checks ${cell(f.raw)}; with them ${cell(f.gated)}`);
  for (const s of r.stale) console.log(`STALE ${s.key} (${s.state}): ${s.why}`);
  const staleLine = `${count(r.stale.length, "label")} in ${STATE} ${r.stale.length === 1 ? "is" : "are"} stale: ${r.stale.map((s) => s.key).join(", ")}`;
  const name = `AGREEMENT_${r.date}.md`;
  const path = join(root, GOLDEN, name);
  const others = readdirSync(join(root, GOLDEN)).filter((f) => /^AGREEMENT_.*\.md$/.test(f) && f !== name);
  const now = existsSync(path) ? readFileSync(path, "utf8") : null;
  if (check) {
    const problems = [
      ...(now === r.text ? [] : [`${GOLDEN}/${name} ${now === null ? "is missing" : "differs from a fresh run"}; regenerate with node scripts/agreement-report.ts`]),
      ...others.map((f) => `${GOLDEN}/${f} is not the current report (${name}); regenerate with node scripts/agreement-report.ts`),
      ...(r.stale.length ? [staleLine] : []),
    ];
    for (const p of problems) console.log(`FAIL ${p}`);
    if (!problems.length) console.log(`${GOLDEN}/${name} matches a fresh run`);
    process.exit(problems.length ? 1 : 0);
  }
  if (r.stale.length) { console.log(`not written: ${staleLine}`); process.exit(1); }
  for (const f of others) rmSync(join(root, GOLDEN, f));
  if (now !== r.text) writeFileSync(path, r.text);
  console.log(now === r.text && !others.length ? "no change" : `wrote ${GOLDEN}/${name}${others.length ? `, removed ${others.join(", ")}` : ""}`);
}
