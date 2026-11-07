// The reconcile runner (S3-PR3): gates proposed labels for idea records through the schema, the EE-095 term engine
// and the Lean agreement check, and moves each label through the idea record statechart, Appendix E of
// docs/design/CLAUDE_HANDOFF_ONTOLOGY_PROGRAM.md. It makes no model or network call: proposals are input.
//
//   node --import ./scripts/naive-ts.ts scripts/reconcile-ideas.ts --records <dir> [--root <dir>] [--proposals <file>] [--naive <dir>]
//
// --records is a folder exported from the company tenant's store, holding the idea records (MENTURA_RECORDS works
// too; see scripts/records-folder.ts). --root is the repository with the rulings and state (this one). --naive is the Naive checkout whose
// schemas, ontology, catalog, admitted terms and Lean proofs the gates read (default: the installed naive-framework).
// The --import flag lets Node load Naive's TypeScript from node_modules (scripts/naive-ts.ts, temporary).
//
// A proposal is one JSON line: {"idea": "n-001", "field": "status", "value": "open", "terms": ["pricing decision"]}.
// field and value take the shape of a golden ruling (schema/golden-ruling.schema.json), so a gated label and Torian's
// ruling compare as equal values. terms are the nouns the label rests on, each a noun of the ontology metamodel. When
// one file holds several lines for one idea and field, the last one is the proposal.
//
// One machine runs per idea and field. Each run reads the state, the proposals, the idea records, the catalog, the
// ontology, the admitted terms, Lean and the golden rulings, and steps every machine until none moves. Then it writes
// the state and Torian's queue (one line per label he has to rule on or a dispute), only when they changed, so a
// rerun with the same inputs changes nothing. The runner never writes a golden ruling and never posts anywhere.

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { run } from "naive-framework/src/terms/engine.ts";
import { disagreements, readLean } from "naive-framework/src/terms/lean-agreement-test.ts";
import type { LinkGraph } from "naive-framework/src/terms/levels.ts";
import { typedLink } from "naive-framework/src/terms/terms.ts";
import { recordsIn } from "naive-framework/src/records/index.mjs";
import { naiveRoot } from "./naive.ts";
import { IDEAS, ideasIn, recordsFolder } from "./records-folder.ts";

export { IDEAS };
export const GOLDEN = "docs/reviews/ontology-golden";
export const STATE = "docs/reviews/ontology-program/reconcile/state.jsonl";
export const QUEUE = "docs/reviews/ontology-program/reconcile/queue.jsonl";
export const PROPOSALS = "docs/reviews/ontology-program/reconcile/proposals.jsonl";

export type Json = null | boolean | number | string | Json[] | { [key: string]: Json };
type JsonObject = { [key: string]: Json };
export type Field = "status" | "importance" | "relation" | "scope";
const FIELDS: readonly Field[] = ["status", "importance", "relation", "scope"];

type Checking = "SchemaCheck" | "TermCheck" | "ProofCheck" | "end of Checking";
export type StateName = "Captured" | "Proposed" | Checking | "Rejected" | "RoutedToScope" | "Labeled" | "GoldenCompare" | "Settled" | "Disputed" | "end";
const CHECKING: ReadonlySet<StateName> = new Set<StateName>(["SchemaCheck", "TermCheck", "ProofCheck", "end of Checking"]);
const RESTING: ReadonlySet<StateName> = new Set<StateName>(["Captured", "Rejected", "RoutedToScope", "Labeled", "Settled", "Disputed", "end"]);

type Missing = { term: string; owning: string };
/** One label's machine, as the state file stores it. A machine that saw no proposal is Captured and is not stored. */
export type Machine = {
  idea: string;
  field: Field;
  state: StateName;
  proposal?: Json;
  taken?: string;
  reason?: string;
  missing?: Missing[];
  retry?: string;
  ruling?: string;
  upstream?: string;
};

type Idea = { id: string; text: string; status?: string; relations: { relation: string; to: string }[]; scope?: { scope: string; via: string } };
type Ruling = { hash: string; value: Json; source: Json };
type Noun = { noun: string; function: string | null };
type Line = { proposal: Json; hash: string };

const isObject = (x: unknown): x is JsonObject => typeof x === "object" && x !== null && !Array.isArray(x);
const canonical = (x: Json): string => Array.isArray(x) ? `[${x.map(canonical).join(",")}]`
  : isObject(x) ? `{${Object.keys(x).sort().map((k) => `${JSON.stringify(k)}:${canonical(x[k])}`).join(",")}}` : JSON.stringify(x);
const hash = (s: string): string => createHash("sha256").update(s).digest("hex").slice(0, 16);
const readJson = (path: string): unknown => JSON.parse(readFileSync(path, "utf8"));
const keyOf = (idea: string, field: Field): string => `${idea}.${field}`;
/** Equal labels: relation lists are sets (uniqueItems), so their order does not count. */
export const sameLabel = (a: Json, b: Json): boolean => {
  const norm = (v: Json): string => Array.isArray(v) ? canonical(v.map(canonical).sort()) : canonical(v);
  return norm(a) === norm(b);
};

/** What the schemas say a proposal may hold, read once from the schema files so the runner never restates them. */
type Vocabulary = { status: string[]; importance: string[]; relation: string[]; via: string[]; ideaId: RegExp; scope: RegExp; noun: RegExp };
function vocabulary(root: string): Vocabulary {
  const records = recordsIn(root);
  const golden = readJson(records.schemaFile("golden-ruling")) as { $defs: { status: { enum: string[] }; importance: { enum: string[] }; scope: { properties: { scope: { pattern: string } } } }; properties: { idea: { pattern: string } } };
  const idea = readJson(records.schemaFile("founder-idea")) as { $defs: { relation: { enum: string[] }; attachment: { enum: string[] } } };
  const meta = readJson(records.schemaFile("ontology-metamodel")) as { $defs: { change_line: { properties: { noun: { pattern: string } } } } };
  return {
    status: golden.$defs.status.enum, importance: golden.$defs.importance.enum, relation: idea.$defs.relation.enum, via: idea.$defs.attachment.enum,
    ideaId: new RegExp(golden.properties.idea.pattern), scope: new RegExp(golden.$defs.scope.properties.scope.pattern), noun: new RegExp(meta.$defs.change_line.properties.noun.pattern),
  };
}

/** Everything a run reads besides the state. Lean and the rulings are read only when a machine needs them. */
export class World {
  readonly root: string;
  /** The Naive checkout whose schemas, ontology, admitted terms and Lean proofs the gates read (the installed package). */
  readonly naive: string;
  readonly vocab: Vocabulary;
  readonly ideas: Map<string, Idea>;
  lines: Map<string, Line>;
  readonly scopes: string[];
  readonly imports: Map<string, string[]>;
  readonly scopeOf: Map<string, string>;
  readonly nouns: Map<string, Noun>;
  readonly tops: Set<string>;
  readonly admitted: Set<string>;
  private leanCache: string[] | undefined;
  private rulingCache = new Map<string, Ruling | null>();

  constructor(root: string, lines: Map<string, Line>, naive: string, records: string) {
    this.root = root;
    this.naive = naive;
    this.lines = lines;
    this.vocab = vocabulary(naive);
    this.ideas = new Map(readdirSync(ideasIn(records)).filter((f) => f.endsWith(".json")).map((f) => {
      const r = readJson(join(ideasIn(records), f)) as Idea;
      return [r.id, { id: r.id, text: r.text, status: r.status, relations: r.relations ?? [], scope: r.scope }];
    }));
    const catalog = readJson(join(naive, "packages/naive/src/terms/ontology-catalog.json")) as { scopes: { scope: string; owner: string; imports: string[] }[] };
    this.scopes = catalog.scopes.map((s) => s.scope);
    this.imports = new Map(catalog.scopes.map((s) => [s.scope, s.imports]));
    this.scopeOf = new Map(catalog.scopes.map((s) => [s.owner, s.scope]));
    const ontology = readJson(join(naive, "packages/naive/src/terms/ontology.json")) as { top_categories: { name: string }[]; nouns: (Noun & { status: string })[] };
    this.nouns = new Map(ontology.nouns.filter((n) => n.status !== "retired").map((n) => [n.noun, { noun: n.noun, function: n.function ?? null }]));
    this.tops = new Set(ontology.top_categories.map((t) => t.name));
    const admitted = readJson(join(naive, "packages/naive/src/terms/admitted.json")) as { terms: { id: string; label: string }[] };
    this.admitted = new Set(admitted.terms.flatMap((t) => [t.id, t.label]));
  }

  /** The Lean agreement check (packages/naive/src/terms/lean-agreement-test.ts), plus the theorems typed-link cites. */
  lean(): string[] {
    if (!this.leanCache) {
      const declared = readLean(this.naive).theorems;
      this.leanCache = [
        ...disagreements(this.naive),
        ...(typedLink.lean ?? []).filter((t) => !declared.has(t)).map((t) => `typed-link cites Lean theorem ${t}, which lean/Naive does not declare`),
      ];
    }
    return this.leanCache;
  }

  ruling(idea: string, field: Field): Ruling | null {
    const key = keyOf(idea, field);
    if (!this.rulingCache.has(key)) {
      const path = join(this.root, GOLDEN, `${key}.json`);
      if (!existsSync(path)) this.rulingCache.set(key, null);
      else {
        const text = readFileSync(path, "utf8");
        const r = JSON.parse(text) as { value: Json; comment?: string; card?: Json };
        this.rulingCache.set(key, { hash: hash(text), value: r.value, source: r.comment ?? r.card ?? null });
      }
    }
    return this.rulingCache.get(key) ?? null;
  }

  /** Dropped or shelved, by the idea record or by Torian's settled status ruling. */
  ended(idea: string, status: Machine | undefined): boolean {
    const gone = (s: Json | undefined): boolean => s === "dropped" || s === "shelved";
    if (gone(this.ideas.get(idea)?.status)) return true;
    return !!status && (status.state === "Settled" || status.state === "end") && gone(this.ruling(idea, "status")?.value);
  }

  /** The idea's text and the text of every idea it relates to, as the idea graph hashes an idea with its upstream. */
  upstream(m: Machine): string {
    const idea = this.ideas.get(m.idea);
    const named = [...(idea?.relations ?? []), ...relationsIn(m)].map((r) => r.to);
    return hash(canonical([idea?.text ?? null, ...[...new Set(named)].sort().map((id) => [id, this.ideas.get(id)?.text ?? null])]));
  }
}

const relationsIn = (m: Machine): { relation: string; to: string }[] => {
  const p = m.proposal;
  return m.field === "relation" && isObject(p) && Array.isArray(p.value) ? (p.value as { relation: string; to: string }[]) : [];
};

/** Proposed -> Checking or back to Captured: whether the line fits a golden ruling's field and value, plus terms. */
export function lineProblems(p: Json, v: Vocabulary): string[] {
  if (!isObject(p)) return ["the line is not a JSON object"];
  const out = Object.keys(p).filter((k) => !["idea", "field", "value", "terms"].includes(k)).map((k) => `${k} is not a proposal key (idea, field, value, terms)`);
  const value = p.value;
  const oneOf = (x: Json, allowed: string[], what: string): string[] => typeof x === "string" && allowed.includes(x) ? [] : [`${what} ${JSON.stringify(x)} is not one of ${allowed.join(", ")}`];
  if (value === undefined) out.push("value is missing");
  else if (p.field === "status") out.push(...oneOf(value, v.status, "status"));
  else if (p.field === "importance") out.push(...oneOf(value, v.importance, "importance"));
  else if (p.field === "relation") {
    if (!Array.isArray(value)) out.push("relation value is not a list");
    else {
      if (new Set(value.map(canonical)).size !== value.length) out.push("relation value repeats an item");
      value.forEach((r, k) => {
        if (!isObject(r) || Object.keys(r).sort().join() !== "relation,to") out.push(`relation[${k}] is not exactly {relation, to}`);
        else out.push(...oneOf(r.relation, v.relation, `relation[${k}]`), ...(typeof r.to === "string" && v.ideaId.test(r.to) ? [] : [`relation[${k}].to ${JSON.stringify(r.to)} is not an idea id`]));
      });
    }
  } else if (p.field === "scope") {
    if (!isObject(value) || Object.keys(value).sort().join() !== "scope,via") out.push("scope value is not exactly {scope, via}");
    else out.push(...(typeof value.scope === "string" && v.scope.test(value.scope) ? [] : [`scope ${JSON.stringify(value.scope)} is not naive@<function> or shared`]), ...oneOf(value.via, v.via, "via"));
  }
  if (p.terms !== undefined && !(Array.isArray(p.terms) && p.terms.every((t) => typeof t === "string"))) out.push("terms is not a list of strings");
  return out;
}

const termsOf = (m: Machine): string[] => isObject(m.proposal) && Array.isArray(m.proposal.terms) ? (m.proposal.terms as string[]) : [];
const valueOf = (m: Machine): Json => (isObject(m.proposal) ? m.proposal.value : null) ?? null;

/** SchemaCheck: every term is a noun the ontology metamodel admits (its change line's noun form). */
const metamodelProblems = (m: Machine, w: World): string[] =>
  termsOf(m).filter((t) => !w.vocab.noun.test(t)).map((t) => `term ${JSON.stringify(t)} is not a noun the ontology metamodel admits`);

/** The scope a label's terms are read in: the scope it proposes, else the idea's scope, else shared. */
const usedScope = (m: Machine, w: World): string => {
  const v = valueOf(m);
  if (m.field === "scope" && isObject(v) && typeof v.scope === "string") return v.scope;
  return w.ideas.get(m.idea)?.scope?.scope ?? "shared";
};

/** A term the scope cannot see, with its owning scope: the scope that defines it, else the one its
 *  name@function suffix names, else the scope that uses it. The rule schema/terms/catalog-test.ts applies. */
function missingTerm(term: string, used: string, w: World): Missing | null {
  if (w.tops.has(term) || w.admitted.has(term)) return null;
  const at = term.lastIndexOf("@");
  const suffix = at > 0 ? term.slice(at + 1) : undefined;
  const noun = w.nouns.get(term) ?? (suffix ? [...w.nouns.values()].find((n) => n.noun === term.slice(0, at) && n.function === suffix) : undefined);
  if (noun && noun.function === null) return null;
  const owning = noun?.function ? w.scopeOf.get(noun.function) : undefined;
  if (owning && (owning === used || (w.imports.get(used) ?? []).includes(owning))) return null;
  return { term, owning: owning ?? (suffix ? w.scopeOf.get(suffix) : undefined) ?? used };
}

/** TermCheck: the typed relations through the EE-095 term typed-link, over every idea with this label applied, and
 *  every term defined in the scope the label uses or one it imports. */
function termProblems(m: Machine, w: World): { problems: string[]; missing: Missing[] } {
  const ids = [...w.ideas.keys()].sort();
  const at = new Map(ids.map((id, k) => [id, k]));
  const scopes = [...w.scopes, "shared"];
  const value = valueOf(m);
  const links: LinkGraph["links"] = [];
  const named: string[] = [];
  for (const id of ids) {
    const idea = w.ideas.get(id)!;
    const mine = id === m.idea;
    const relations = mine && m.field === "relation" ? (value as { relation: string; to: string }[]) : idea.relations;
    const scope = mine && m.field === "scope" ? (value as { scope: string; via: string }) : idea.scope;
    for (const r of relations) { links.push({ type: r.relation, target: "idea", from: at.get(id)!, to: at.get(r.to) ?? -1 }); named.push(r.to); }
    if (scope) { links.push({ type: scope.via, target: "scope", from: at.get(id)!, to: scopes.indexOf(scope.scope) }); named.push(scope.scope); }
  }
  const facts: LinkGraph = { confirmed: true, ideas: ids.length, scopes: scopes.length, links };
  const verdict = run(typedLink, facts);
  const problems: string[] = [];
  const missing: Missing[] = [];
  if (!verdict.pass) links.forEach((l, k) => {
    const unresolved = l.to < 0 && !(l.target === "scope" && l.type === "creates");
    if (l.target === "scope" && unresolved) missing.push({ term: named[k], owning: named[k] });
    else if (unresolved) problems.push(`typed-link T3: ${ids[l.from]} names idea ${named[k]}, which does not exist`);
    else if (l.target === "idea" && l.from === l.to) problems.push(`typed-link T2: ${ids[l.from]} relates to itself`);
  });
  if (verdict.failed.includes("T4")) problems.push("typed-link T4: the label closes a cycle through broader, part-of or builds_on");
  if (!verdict.pass && !problems.length && !missing.length) problems.push(`typed-link failed ${verdict.failed.join(", ")}`);
  const used = usedScope(m, w);
  for (const t of termsOf(m)) { const gap = missingTerm(t, used, w); if (gap) missing.push(gap); }
  return { problems, missing };
}

/** The failures at the check the machine is in. Empty when that check passes. */
function failuresAt(m: Machine, w: World): { problems: string[]; missing: Missing[] } {
  if (m.state === "SchemaCheck") return { problems: metamodelProblems(m, w), missing: [] };
  if (m.state === "TermCheck") {
    const t = termProblems(m, w);
    return { problems: [...t.problems, ...t.missing.map((x) => `term ${x.term} is missing; owning scope ${x.owning}`)], missing: t.problems.length ? [] : t.missing };
  }
  if (m.state === "ProofCheck") return { problems: w.lean().map((d) => `Lean disagrees with the code: ${d}`), missing: [] };
  return { problems: [], missing: [] };
}

type Ctx = { w: World; status: Machine | undefined };
/** One arrow of Appendix E. go returns the machine after the step, or null when its condition does not hold. */
type Row = { from: StateName | "Checking"; to: StateName | "Checking"; when: string; go: Go };
type Go = (_machine: Machine, _context: Ctx) => Machine | null;

const fresh = (m: Machine, w: World): Line | null => {
  const line = w.lines.get(keyOf(m.idea, m.field));
  return line && line.hash !== m.taken ? line : null;
};
const take = (m: Machine, line: Line, retry?: string): Machine => ({ idea: m.idea, field: m.field, state: "Proposed", proposal: line.proposal, taken: line.hash, ...(retry ? { retry } : {}) });
const without = (m: Machine, ...keys: (keyof Machine)[]): Machine => Object.fromEntries(Object.entries(m).filter(([k]) => !keys.includes(k as keyof Machine))) as Machine;

/** The idea record statechart, Appendix E, row for row. The test checks this table against the design doc. */
export const TRANSITIONS: readonly Row[] = [
  { from: "Captured", to: "Proposed", when: "a model proposes status, importance, relations and scope", go: (m, { w }) => { const l = fresh(m, w); return l ? take(m, l) : null; } },
  { from: "Proposed", to: "Checking", when: "the change line is schema-valid", go: (m, { w }) => lineProblems(m.proposal ?? null, w.vocab).length ? null : { ...without(m, "reason"), state: "SchemaCheck" } },
  { from: "Proposed", to: "Captured", when: "the change line is not schema-valid", go: (m, { w }) => { const p = lineProblems(m.proposal ?? null, w.vocab); return p.length ? { ...m, state: "Captured", reason: p.join("; ") } : null; } },
  { from: "SchemaCheck", to: "TermCheck", when: "the line fits the metamodel", go: (m, { w }) => failuresAt(m, w).problems.length ? null : { ...m, state: "TermCheck" } },
  { from: "TermCheck", to: "ProofCheck", when: "every term is defined or imported through EE-095", go: (m, { w }) => failuresAt(m, w).problems.length ? null : { ...m, state: "ProofCheck" } },
  { from: "ProofCheck", to: "end of Checking", when: "Lean agrees with the code", go: (m, { w }) => failuresAt(m, w).problems.length ? null : { ...m, state: "end of Checking" } },
  { from: "Checking", to: "Rejected", when: "any check fails", go: (m, { w }) => {
    const f = failuresAt(m, w);
    return f.problems.length ? { ...without(m, "missing"), state: "Rejected", reason: f.problems.join("; "), ...(f.missing.length ? { missing: f.missing } : {}) } : null;
  } },
  { from: "Rejected", to: "Proposed", when: "a retry carries the reason", go: (m, { w }) => { const l = fresh(m, w); return l ? take(m, l, m.reason) : null; } },
  { from: "Rejected", to: "RoutedToScope", when: "a term is missing", go: (m) => m.missing?.length ? { ...m, state: "RoutedToScope" } : null },
  { from: "RoutedToScope", to: "Proposed", when: "the owning scope defines the term", go: (m, { w }) => termProblems(m, w).missing.length ? null : { ...without(m, "reason", "missing"), state: "Proposed" } },
  { from: "Checking", to: "Labeled", when: "all checks pass", go: (m) => m.state === "end of Checking" ? { ...without(m, "reason"), state: "Labeled" } : null },
  { from: "Labeled", to: "GoldenCompare", when: "a golden ruling exists for that field", go: (m, { w }) => { const r = w.ruling(m.idea, m.field); return r ? { ...m, state: "GoldenCompare", ruling: r.hash } : null; } },
  { from: "GoldenCompare", to: "Settled", when: "the label matches Torian's ruling", go: (m, { w }) => sameLabel(valueOf(m), w.ruling(m.idea, m.field)!.value) ? { ...m, state: "Settled", upstream: w.upstream(m) } : null },
  { from: "GoldenCompare", to: "Disputed", when: "the label differs", go: (m, { w }) => sameLabel(valueOf(m), w.ruling(m.idea, m.field)!.value) ? null : { ...m, state: "Disputed" } },
  { from: "Disputed", to: "Settled", when: "Torian rules, and the ruling becomes golden", go: (m, { w }) => { const r = w.ruling(m.idea, m.field); return r && r.hash !== m.ruling ? { ...m, state: "Settled", ruling: r.hash, upstream: w.upstream(m) } : null; } },
  { from: "Settled", to: "Proposed", when: "an upstream idea changes its hash", go: (m, { w, status }) => !w.ended(m.idea, status) && w.upstream(m) !== m.upstream ? { ...without(m, "ruling", "upstream"), state: "Proposed" } : null },
  { from: "Settled", to: "end", when: "the idea is dropped or shelved", go: (m, { w, status }) => w.ended(m.idea, status) ? { ...m, state: "end" } : null },
];

export type Step = { key: string; from: StateName; to: StateName; row: Row };

/** Steps one machine until no arrow out of its state holds. Rows are tried in table order. */
function settle(start: Machine, c: Ctx, steps: Step[]): Machine {
  let m = start;
  for (let n = 0; n < 64; n++) {
    let next: Machine | null = null;
    for (const row of TRANSITIONS) {
      if (row.from !== m.state && !(row.from === "Checking" && CHECKING.has(m.state))) continue;
      next = row.go(m, c);
      if (next) { steps.push({ key: keyOf(m.idea, m.field), from: m.state, to: next.state, row }); break; }
    }
    if (!next) {
      if (!RESTING.has(m.state)) throw new Error(`${keyOf(m.idea, m.field)} stopped in ${m.state}, which is not a resting state`);
      return m;
    }
    m = next;
  }
  throw new Error(`${keyOf(start.idea, start.field)} did not come to rest in 64 steps`);
}

/** Runs every machine until none moves, across machines too: a status settled as dropped ends the idea's other labels. */
export function reconcile(machines: Map<string, Machine>, w: World): { machines: Map<string, Machine>; steps: Step[] } {
  const out = new Map(machines);
  for (const key of w.lines.keys()) if (!out.has(key)) {
    const [idea, field] = [key.slice(0, key.lastIndexOf(".")), key.slice(key.lastIndexOf(".") + 1) as Field];
    out.set(key, { idea, field, state: "Captured" });
  }
  const steps: Step[] = [];
  for (let pass = 0; pass < 8; pass++) {
    const before = steps.length;
    for (const key of [...out.keys()].sort()) {
      const m = out.get(key)!;
      out.set(key, settle(m, { w, status: out.get(keyOf(m.idea, "status")) }, steps));
    }
    if (steps.length === before) return { machines: out, steps };
  }
  throw new Error("the machines did not come to rest in 8 passes");
}

/** Torian's queue: one line per label waiting on a ruling and per dispute. The runner writes no ruling itself. */
export function queue(machines: Map<string, Machine>, w: World): JsonObject[] {
  return [...machines.values()].filter((m) => m.state === "Labeled" || m.state === "Disputed").sort((a, b) => keyOf(a.idea, a.field).localeCompare(keyOf(b.idea, b.field))).map((m): JsonObject => {
    const r = w.ruling(m.idea, m.field);
    return m.state === "Labeled"
      ? { idea: m.idea, field: m.field, ask: "rule", label: valueOf(m), says: `No golden ruling for ${m.idea} ${m.field}. The gated label is ${canonical(valueOf(m))}.` }
      : { idea: m.idea, field: m.field, ask: "dispute", label: valueOf(m), ruling: r?.value ?? null, source: r?.source ?? null, says: `The gated label ${canonical(valueOf(m))} differs from Torian's ruling ${canonical(r?.value ?? null)}.` };
  });
}

/** Parses the proposals file. A line that names no known idea and field cannot reach a machine and is reported. */
export function readProposals(file: string | undefined, w: { ideas: Map<string, Idea> }): { lines: Map<string, Line>; unread: string[] } {
  const lines = new Map<string, Line>();
  const unread: string[] = [];
  if (!file || !existsSync(file)) return { lines, unread };
  readFileSync(file, "utf8").split("\n").forEach((text, k) => {
    if (!text.trim()) return;
    let p: unknown;
    try { p = JSON.parse(text); } catch (e) { unread.push(`line ${k + 1}: not JSON (${e instanceof Error ? e.message : String(e)})`); return; }
    if (!isObject(p) || typeof p.idea !== "string" || !w.ideas.has(p.idea)) { unread.push(`line ${k + 1}: names no idea in ${IDEAS}`); return; }
    if (typeof p.field !== "string" || !(FIELDS as readonly string[]).includes(p.field)) { unread.push(`line ${k + 1}: field ${JSON.stringify(isObject(p) ? p.field : null)} is not one of ${FIELDS.join(", ")}`); return; }
    lines.set(keyOf(p.idea, p.field as Field), { proposal: p, hash: hash(canonical(p)) });
  });
  return { lines, unread };
}

const ORDER: (keyof Machine)[] = ["idea", "field", "state", "reason", "missing", "retry", "proposal", "taken", "ruling", "upstream"];
const stateLine = (m: Machine): string => JSON.stringify(Object.fromEntries(ORDER.filter((k) => m[k] !== undefined).map((k) => [k, m[k]])));
const jsonl = (rows: string[]): string => rows.length ? `${rows.join("\n")}\n` : "";

export function readState(path: string): Map<string, Machine> {
  if (!existsSync(path)) return new Map();
  const rows = readFileSync(path, "utf8").split("\n").filter((l) => l.trim()).map((l) => JSON.parse(l) as Machine);
  return new Map(rows.map((m) => [keyOf(m.idea, m.field), m]));
}

/** Writes the file only when its content changed, through a rename so a crash never leaves half a file. An empty
 *  file that does not exist yet stays absent. */
function put(path: string, text: string): boolean {
  const now = existsSync(path) ? readFileSync(path, "utf8") : "";
  if (now === text) return false;
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(`${path}.tmp`, text);
  renameSync(`${path}.tmp`, path);
  return true;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const arg = (name: string): string | undefined => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : undefined; };
  const root = resolve(arg("--root") ?? join(dirname(new URL(import.meta.url).pathname), ".."));
  const proposalsFile = arg("--proposals") ? resolve(arg("--proposals")!) : join(root, PROPOSALS);
  let records: string;
  try { records = recordsFolder(); } catch (e) { console.error((e as Error).message); process.exit(2); }
  const world = new World(root, new Map(), resolve(arg("--naive") ?? naiveRoot), records);
  const { lines, unread } = readProposals(proposalsFile, world);
  world.lines = lines;
  const { machines, steps } = reconcile(readState(join(root, STATE)), world);
  for (const s of steps) console.log(`${s.key}: ${s.from} -> ${s.to} (${s.row.when})`);
  for (const [key, line] of lines) {
    const m = machines.get(key);
    if (m && m.taken !== line.hash) console.log(`HELD ${key}: ${m.state} takes no new proposal (Appendix E); the line waits`);
  }
  for (const u of unread) console.log(`UNREAD ${u}`);
  const stored = [...machines.values()].sort((a, b) => keyOf(a.idea, a.field).localeCompare(keyOf(b.idea, b.field)));
  const wroteState = put(join(root, STATE), jsonl(stored.map(stateLine)));
  const wroteQueue = put(join(root, QUEUE), jsonl(queue(machines, world).map((q) => JSON.stringify(q))));
  const tally = new Map<string, number>();
  for (const m of stored) tally.set(m.state, (tally.get(m.state) ?? 0) + 1);
  const counts = [...tally].map(([s, n]) => `${s} ${n}`).join(", ");
  console.log(`${world.ideas.size} ideas, ${lines.size} proposals, ${stored.length} labels${counts ? ` (${counts})` : ""}, ${steps.length} transitions; ${wroteState || wroteQueue ? `wrote ${[wroteState && STATE, wroteQueue && QUEUE].filter(Boolean).join(" and ")}` : "no change"}`);
  process.exit(unread.length ? 1 : 0);
}
