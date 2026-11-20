// Checks a life record's body against its kind's JSON Schema (`@reflect/core/life-schemas`) with the core's
// package-free validator (`schemaProblems` in `@reflect/core/life-check`), the same one `reflect check` runs over a
// vault. ../life-store.ts runs it before every write and on every read.
//
// A write is checked twice. First the fields as sent: `cleanBody` drops a value it cannot keep (a choice outside the
// field's options, text where a number belongs) and cuts long text, so without this check a bad value vanished without
// a word. A field sent with such a value is refused (bad-input), naming the kind and the field and what was expected,
// never the value. Then the body `cleanBody` made, so nothing reaches the database that its schema refuses.
// A stored body that no longer matches (an option since removed) is only a warning on read, and saving the record again
// refuses only the fields the save changes: a field sent back as it is stored is not refused, and `cleanBody` drops it.
// Keys the kind does not declare are allowed, as in the schemas (`additionalProperties: true`). Pure: no I/O.
import { APPS, type Kind, type LifeAppId } from "@reflect/core/life";
import { schemaProblems, type SchemaProblem } from "@reflect/core/life-check";
import { lifeSchema, type LifeSchema } from "@reflect/core/life-schemas";
import { ORIGINS } from "@reflect/core/origins";
import { Refused } from "@reflect/core/registry";

const SCHEMAS = new Map<string, LifeSchema>();
const ORIGIN_IDS: readonly string[] = ORIGINS.map((o) => o.id);

/** A kind's schema, built once. */
export function schemaOfKind(app: LifeAppId, k: Kind): LifeSchema {
  const ref = `${app}.${k.id}`;
  let s = SCHEMAS.get(ref);
  if (!s) {
    s = lifeSchema(app, k);
    SCHEMAS.set(ref, s);
  }
  return s;
}

const blank = (v: unknown): boolean => v === undefined || v === null || (typeof v === "string" && v.trim() === "");

/** Whether a value sent for a field is the value stored there, so a save that sends it back changes nothing in it. */
const same = (a: unknown, b: unknown): boolean => a === b || (a !== undefined && a !== null && b !== undefined && b !== null && String(a).trim() === String(b));

/**
 * What is wrong with the fields as sent, read the way `cleanBody` reads them: a number may come as text ("12",
 * "$1,200"), a check as "on", "true", "false" or "off", origins as a list or a comma list. A blank value clears the
 * field and is never a problem. With `stored`, a field sent with the value it already holds is left out.
 */
export function inputProblems(app: LifeAppId, k: Kind, raw: Record<string, unknown>, stored?: Record<string, unknown>): SchemaProblem[] {
  const schema = schemaOfKind(app, k);
  const out: SchemaProblem[] = [];
  for (const f of k.fields) {
    if (!Object.hasOwn(raw, f.key)) continue;
    const v = raw[f.key];
    if (stored && same(v, stored[f.key])) continue;
    if (f.kind === "check") {
      if (v === undefined || v === null || v === true || v === false || ["on", "off", "true", "false", ""].includes(String(v))) continue;
      out.push({ field: f.key, problem: "expected true or false" });
      continue;
    }
    if (blank(v)) continue;
    let value: unknown;
    if (f.kind === "number" || f.kind === "money") {
      const s = typeof v === "number" ? v : String(v).replace(/[$,\s]/g, "");
      value = typeof s === "number" ? s : /^-?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/i.test(s) ? Number(s) : s;
    } else if (f.kind === "origins") {
      const given = (Array.isArray(v) ? v : String(v).split(",")).map((x) => String(x).trim()).filter(Boolean);
      if (given.some((o) => !ORIGIN_IDS.includes(o))) {
        out.push({ field: f.key, problem: "expected a comma list of origin ids" });
        continue;
      }
      value = given.join(",");
    } else value = String(v).trim();
    out.push(...schemaProblems(schema, { [f.key]: value }));
  }
  return out;
}

/** The problems as one message for the person or a model: the kind, then each field and what was expected. */
export const problemsText = (k: Kind, ps: readonly SchemaProblem[]): string => `${k.label}: ${ps.map((p) => `${p.field || "the record"}: ${p.problem}`).join("; ")}`;

/** Refuses (bad-input) a write whose fields as sent do not fit the kind's schema. */
export function checkLifeInput(app: LifeAppId, k: Kind, raw: Record<string, unknown>, stored?: Record<string, unknown>): void {
  const ps = inputProblems(app, k, raw, stored);
  if (ps.length) throw new Refused({ reason: "bad-input", message: problemsText(k, ps) });
}

/** Refuses (bad-input) a cleaned body that its kind's schema does not accept, so nothing it refuses is written. */
export function checkLifeBody(app: LifeAppId, k: Kind, body: Record<string, unknown>): void {
  const ps = schemaProblems(schemaOfKind(app, k), body);
  if (ps.length) throw new Refused({ reason: "bad-input", message: problemsText(k, ps) });
}

/** What a stored body does not match: its schema's problems, or one problem when its app and kind are not declared. */
export function storedProblems(app: string, kind: string, body: unknown): SchemaProblem[] {
  const a = APPS.find((x) => x.id === app);
  const k = a?.kinds.find((x) => x.id === kind);
  if (!a || !k) return [{ field: "", problem: "is of no declared kind" }];
  return schemaProblems(schemaOfKind(a.id, k), body);
}

/** One kind in the audit: how many stored bodies it read, how many pass, and per failing field what was expected and how often. */
export type KindAudit = { app: string; kind: string; records: number; pass: number; fields: { field: string; problem: string; records: number }[] };

/**
 * Counts stored bodies per kind: every declared kind, in the apps' order, with none kept as 0, then any kind found
 * that is not declared. Says which fields fail and what they expected, never a value.
 */
export function auditBodies(rows: Iterable<{ app: string; kind: string; body: unknown }>): KindAudit[] {
  const by = new Map<string, KindAudit>();
  for (const a of APPS) for (const k of a.kinds) by.set(`${a.id}.${k.id}`, { app: a.id, kind: k.id, records: 0, pass: 0, fields: [] });
  for (const r of rows) {
    const ref = `${r.app}.${r.kind}`;
    let k = by.get(ref);
    if (!k) by.set(ref, (k = { app: r.app, kind: r.kind, records: 0, pass: 0, fields: [] }));
    k.records += 1;
    const ps = storedProblems(r.app, r.kind, r.body);
    if (!ps.length) k.pass += 1;
    for (const p of ps) {
      const f = k.fields.find((x) => x.field === p.field && x.problem === p.problem);
      if (f) f.records += 1;
      else k.fields.push({ field: p.field, problem: p.problem, records: 1 });
    }
  }
  return [...by.values()];
}

/** The audit as lines to print: one per kind, then a total. */
export function auditLines(audit: readonly KindAudit[]): string[] {
  const lines = audit.map((k) => {
    const fails = k.fields.map((f) => `${f.field || "(body)"} ${f.problem} (${f.records})`).join("; ");
    return `${k.app}.${k.kind}: ${k.pass} of ${k.records} pass${fails ? `; ${fails}` : ""}`;
  });
  const n = audit.reduce((s, k) => s + k.records, 0), pass = audit.reduce((s, k) => s + k.pass, 0);
  const failing = audit.filter((k) => k.pass < k.records).map((k) => `${k.app}.${k.kind}`);
  lines.push(`life records: ${pass} of ${n} stored bodies pass their schemas${failing.length ? `; kinds with failures: ${failing.join(", ")}` : ""}`);
  return lines;
}
