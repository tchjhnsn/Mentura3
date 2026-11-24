// What the docket asks a founder to write, as data: one entry per foundation statement, naming the route
// it lands on, the fields to ask for and how they become the record. The bridge turns an entry into the
// form the page shows, then writes through the router, so the schema and provenance stay the framework's.

type Json = string | number | boolean | null | undefined | Json[] | { [k: string]: Json };
export type Rec = { [k: string]: Json };
export type Values = Record<string, string | string[]>;
export type FieldKind = "text" | "long" | "lines" | "choice" | "choices";
export type Option = { value: string; label: string };
/** path: where the value lives in the record, so a field already answered is not asked again.
 *  schema: where the schema describes it, for its help text and choices. */
type FieldSpec = { key: string; label: string; kind: FieldKind; path: string; schema?: string; required?: boolean; vocabulary?: true; quiet?: true };
export type Field = Pick<FieldSpec, "key" | "label" | "kind" | "required"> & { help?: string; options?: Option[] };
export type RecordForm = { fields: Field[] };
type Context = { venture: string; phase: string; by: string; today: string; id: string; current: Rec };
type Statement = {
  route: string;
  /** A collection: each item is a file. reuse fills the first item lacking attribute before starting a new one. */
  item?: { record: string; idFrom: string; reuse?: string };
  schema: string;
  /** A view of a larger record: only the patch is sent, so a value already there is not re-signed. */
  partial?: true;
  fields: FieldSpec[];
  patch: (v: Values, c: Context) => Rec;
};

const text = (v: Values, k: string) => (typeof v[k] === "string" ? v[k] : "") as string;
const lines = (v: Values, k: string) => text(v, k).split("\n").map((l) => l.trim()).filter(Boolean);
const some = (o: Rec) => Object.fromEntries(Object.entries(o).filter(([, x]) => x !== "" && x !== undefined));

export const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40).replace(/-$/, "");
/** One id per entry: words with no ASCII letters still get one, and a repeated line gets its own. */
function ids(items: string[], base: string) {
  const seen = new Set<string>();
  return items.map((s, i) => {
    const root = slug(s) || `${base}-${i + 1}`;
    let id = root;
    for (let n = 2; seen.has(id); n++) id = `${root}-${n}`;
    seen.add(id);
    return id;
  });
}

/** Criteria from the founder's lines, each serving the measures named. */
export const criteriaOf = (said: string[], serves: string[]) => {
  const id = ids(said, "criterion");
  return said.map((statement, i) => ({ id: id[i], statement, serves }));
};

const VISION: FieldSpec[] = [
  { key: "statement", label: "The end, in one sentence", kind: "long", path: "statement", schema: "properties.statement", required: true },
  { key: "end_state", label: "What is true when it is reached", kind: "long", path: "end_state", schema: "properties.end_state", required: true },
  { key: "measure", label: "How you will measure it", kind: "text", path: "measures", required: true },
  { key: "measure_kind", label: "Kind of measure", kind: "choice", path: "measures", schema: "properties.measures.items.properties.kind", required: true, quiet: true },
  { key: "outcome", label: "What the owners intend at the end", kind: "choice", path: "owner_outcome", schema: "properties.owner_outcome.properties.path", required: true },
];
const telosBase = (v: Values) => some({
  statement: text(v, "statement"), end_state: text(v, "end_state"),
  measures: text(v, "measure") ? [{ id: slug(text(v, "measure")) || "measure-1", statement: text(v, "measure"), kind: text(v, "measure_kind"), primary: true }] : undefined,
  owner_outcome: text(v, "outcome") ? { path: text(v, "outcome") } : undefined,
});
const PRODUCT: FieldSpec[] = [
  { key: "name", label: "Product name", kind: "text", path: "name", required: true },
  { key: "description", label: "What it is", kind: "long", path: "description", required: true },
];
const product = (v: Values, c: Context) => some({ id: c.current.id ? undefined : c.id, name: text(v, "name"), description: text(v, "description") });

const core = (key: string, label: string, kind: FieldKind): Statement => ({
  route: "foundation/core", schema: "venture-core.schema.json", partial: true,
  fields: [{ key, label, kind, path: key, schema: `properties.${key}`, required: true }],
  patch: (v) => ({ [key]: text(v, key) }),
});

export const STATEMENTS: Record<string, Statement> = {
  mission: core("promise", "Your mission", "long"),
  competence: core("competence", "Your core competence", "long"),
  tagline: core("tagline", "Your tagline", "text"),
  products: { route: "product", item: { record: "product", idFrom: "name", reuse: "name" }, schema: "product.schema.json", fields: PRODUCT, patch: product },
  alignment: {
    route: "foundation/alignment", schema: "alignment.schema.json",
    fields: [{ key: "principles", label: "Principles, one per line", kind: "lines", path: "principles", schema: "properties.principles.items.properties.statement", required: true }],
    patch(v, c) {
      const said = lines(v, "principles"), id = ids(said, "principle");
      return { venture: c.venture, principles: said.map((statement, i) => ({ id: id[i], statement, source: `${c.by}, ${c.today}`, check: null })) };
    },
  },
  problem: {
    route: "foundation/problem", schema: "validation-problem.schema.json",
    fields: [
      { key: "statement", label: "The problem", kind: "long", path: "statement", schema: "properties.statement", required: true },
      { key: "segment", label: "Who has it", kind: "text", path: "segment", schema: "properties.segment", required: true },
    ],
    patch: (v, c) => ({ venture: c.venture, evidence: c.current.evidence ?? [], ...some({ statement: text(v, "statement"), segment: text(v, "segment") }) }),
  },
  icp: {
    route: "foundation/icp", item: { record: "icp", idFrom: "who" }, schema: "icp-profile.schema.json",
    fields: [{ key: "who", label: "Who they are", kind: "long", path: "who", schema: "properties.who", required: true }],
    patch: (v, c) => ({ venture: c.venture, id: c.id, who: text(v, "who"), primary: true }),
  },
  vision: { route: "foundation/telos", schema: "telos.schema.json", fields: VISION, patch: telosBase },
  "exit-criteria": {
    route: "foundation/telos", schema: "telos.schema.json",
    fields: [...VISION, { key: "criteria", label: "What must be true to leave this phase, one per line", kind: "lines", path: "phases", schema: "properties.phases.items.properties.exit_criteria.items.properties.statement", required: true }],
    patch(v, c) {
      const base = telosBase(v), measures = (c.current.measures ?? base.measures ?? []) as Rec[];
      const serves = (measures.find((m) => m.primary) ?? measures[0])?.id;
      return { ...base, phases: [{ phase: c.phase, exit_criteria: criteriaOf(lines(v, "criteria"), [serves as string]) }] };
    },
  },
  "business-models": {
    route: "product", item: { record: "product", idFrom: "name", reuse: "business_model" }, schema: "product.schema.json",
    fields: [...PRODUCT, { key: "models", label: "Business models", kind: "choices", path: "business_model", schema: "properties.business_model", required: true, vocabulary: true, quiet: true }],
    patch: (v, c) => ({ ...product(v, c), business_model: Array.isArray(v.models) ? v.models : [] }),
  },
  markets: {
    route: "product", item: { record: "product", idFrom: "name", reuse: "market.geography" }, schema: "product.schema.json",
    fields: [...PRODUCT, { key: "geography", label: "Where you sell", kind: "text", path: "market.geography", required: true }],
    patch: (v, c) => ({ ...product(v, c), market: { geography: text(v, "geography") } }),
  },
  channels: {
    route: "validation/go-to-market", schema: "validation-go-to-market.schema.json",
    fields: [
      { key: "path", label: "Go-to-market path", kind: "choice", path: "path", schema: "properties.path", required: true },
      { key: "channels", label: "Channels, one per line", kind: "lines", path: "channels", schema: "properties.channels.items.properties.kind", required: true },
    ],
    patch(v, c) {
      const said = lines(v, "channels"), id = ids(said, "channel");
      return { venture: c.venture, evidence: c.current.evidence ?? [], ...some({ path: text(v, "path") }), channels: said.map((kind, i) => ({ id: id[i], kind })) };
    },
  },
};

/** Statements a migrated venture keeps in canonical records. Null: the phase page states them, one phase at a time. */
export const CANONICAL_STATEMENTS: Record<string, Statement | null> = {
  vision: {
    route: "foundation/goals/telos", schema: "goal.schema.json", fields: VISION.filter((f) => f.key !== "measure_kind" && f.key !== "outcome"),
    patch: (v, c) => ({ id: "telos", venture: c.venture, kind: "venture", ...some({ statement: text(v, "statement"), end_state: text(v, "end_state"),
      measures: text(v, "measure") ? [{ id: slug(text(v, "measure")) || "measure-1", statement: text(v, "measure"), primary: true }] : undefined }) }),
  },
  "exit-criteria": null,
};

/** The record type behind each schema, as the foundation report names it. */
export const STATEMENT_RECORD: Record<string, string> = {
  "alignment.schema.json": "alignment", "validation-problem.schema.json": "validation-problem", "icp-profile.schema.json": "icp",
  "telos.schema.json": "telos", "product.schema.json": "product", "validation-go-to-market.schema.json": "validation-go-to-market",
};

export const get = (o: Json, path: string) => path.split(".").reduce<Json>((x, k) => (x && typeof x === "object" && !Array.isArray(x) ? x[k] : undefined), o);
export const filled = (v: unknown) => v !== undefined && v !== null && v !== "" && !(Array.isArray(v) && !v.length);
/** Whether a dotted path crosses a list on the way, where the record holds several entries one form cannot answer for. */
export const throughArray = (o: Json, path: string) => {
  let x = o;
  for (const k of path.split(".")) {
    if (Array.isArray(x)) return true;
    x = x && typeof x === "object" ? x[k] : undefined;
  }
  return false;
};
const open = (s: Statement, current: Rec) => s.fields.filter((f) => !filled(get(current, f.path)));

/** The form for a statement over the record as it stands. describe reads a field's part of the schema. */
export function formOf(s: Statement, current: Rec, describe: (f: FieldSpec) => { help?: string; options?: Option[] }): RecordForm {
  return { fields: open(s, current).map((f) => ({ key: f.key, label: f.label, kind: f.kind, ...(f.required ? { required: true } : {}), ...describe(f) })) };
}

type Decision = { action: { kind: string; form?: unknown; confirm_first?: boolean; held?: unknown } | null };
/** Whether the founder can settle this decision on its card. */
export const settlesHere = (d: Decision) => d.action?.kind === "decide" || d.action?.kind === "confirm" || (d.action?.kind === "accept" && !!d.action.held) || (d.action?.kind === "write" && !!d.action.form && !d.action.confirm_first);
/** The highest-ranked decision the founder can act on here, or nothing, so a card with no way forward is never next. */
export const CONFIRM_FIRST = "Part of this record has not been confirmed by a person. Confirm that first.";
export const nextDecision = <D extends Decision>(functions: { decisions: D[] }[]) => functions.flatMap((f) => f.decisions).find(settlesHere);

/** The decisions a function shows: the first few by rank, and every draft waiting past them, since a draft is finished work held for one click. */
export function shownDecisions<D extends Decision>(decisions: D[], first: number) {
  const shown = decisions.filter((d, i) => i < first || d.action?.kind === "accept");
  return { shown, more: decisions.length - shown.length };
}

/** Lays the patch over the record. A field holding many values is never flattened into one. */
export function merge(a: Rec, b: Rec): Rec {
  const out = { ...a };
  for (const [k, v] of Object.entries(b)) {
    if (Array.isArray(a[k]) && !Array.isArray(v)) throw new Error("This record already holds several entries here, which this form cannot change, so nothing was saved.");
    const was = a[k];
    out[k] = v && typeof v === "object" && !Array.isArray(v) && was && typeof was === "object" && !Array.isArray(was) ? merge(was, v) : v;
  }
  return out;
}

export const MAX_CHARS = 20_000;
/** Only the fields this statement still asks for, with every required one answered. */
export function cleaned(s: Statement, current: Rec, input: unknown): Values {
  const given = (input && typeof input === "object" ? input : {}) as Record<string, unknown>, out: Values = {};
  for (const f of open(s, current)) {
    const v = given[f.key];
    const value = f.kind === "choices" ? (Array.isArray(v) ? v.filter((x) => typeof x === "string") : []) : typeof v === "string" ? v.trim() : "";
    if (f.required && !value.length) throw new Error(`${f.label}: this needs an answer.`);
    if (JSON.stringify(value).length > MAX_CHARS) throw new Error(`${f.label}: this is too long.`);
    out[f.key] = value;
  }
  return out;
}

export type Change = { field: string; now: string; draft: string };
const said = (v: unknown) => (v === undefined || v === null || v === "" ? "nothing" : typeof v === "string" ? v : JSON.stringify(v));
/** Every field of the record, changed or not: accepting confirms all of it, so all of it is shown. */
export const changesOf = (now: Rec, draft: Rec): Change[] => [...new Set([...Object.keys(now), ...Object.keys(draft)])]
  .map((k) => ({ field: k.replaceAll("_", " "), now: said(now[k]), draft: said(draft[k]) }));

/** Whether a write landed only as a draft: a pull-request source holds the record, or one of its attributes, until someone merges. */
export const landedAsDraft = (r: { draft?: boolean; attributes?: { pull_request?: string }[] }) => !!r.draft || !!r.attributes?.some((a) => a.pull_request);

/** A router refusal in the founder's terms. Its text names files, routes and schema paths. */
export function plainWriteRefusal(s: Statement | null, error: string): string {
  if (/does not match/.test(error)) return s ? plainRefusal(s, error) : "Nothing was saved, because this record does not fit its format. Open it from the file tree to see what it holds.";
  if (/changed while this was being checked/.test(error)) return "This record changed while it was being saved, so nothing was written. Try again.";
  if (/read-only/.test(error)) return "This record lives in a system Naive can only read, so change it there.";
  if (/keeps its goals and exit criteria as canonical records/.test(error)) return "This venture keeps its goals in separate records, so this form cannot save here.";
  if (/^only a person writes/.test(error)) return "This record can only be written in the venture's own folder.";
  return "Naive could not save this, so nothing changed. Try again, and if it happens twice, open the record from the file tree.";
}

/** approve()'s refusal in the founder's terms. Its text names CLI flags and files. */
export function plainDecideRefusal(error: string): string {
  if (/^only a person approves/.test(error)) return error;
  if (/already decided as worded/.test(error)) return "This is already decided in these words. Change the answer to make a new version.";
  if (/^no decision/.test(error)) return "This is already settled, or is no longer asked for. Refresh the page.";
  if (/has no wording to approve/.test(error)) return "This needs an answer in your words.";
  return "Naive could not save this decision, so nothing changed. Try again.";
}

/** The router's schema refusal, in the founder's terms. Its text names files and schema paths. */
export function plainRefusal(s: Statement, error: string): string {
  const named = error.split("\n").slice(1).map((l) => l.split(": ")[0].replaceAll("/", ".")).flatMap((p) => s.fields.filter((f) => p === f.path || p.startsWith(`${f.path}.`)));
  const labels = [...new Set(named.map((f) => f.label))];
  return labels.length ? `Nothing was saved. Check: ${labels.join("; ")}.` : "Nothing was saved, because this record does not fit its format. Open it from the file tree to see what it holds.";
}
