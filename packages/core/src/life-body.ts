// Typed bodies for the life records (`./life.ts`): a zod schema derived from each kind's declared fields, and a
// parse that says what in a stored body does not match its kind, so code reading a record's fields stops casting
// untyped JSON. Field types follow `cleanBody`, the one writer: text and long are strings within its lengths, number
// and money are numbers (money and unsigned numbers at least 0, signed ones within 180 either way), day is
// YYYY-MM-DD, choice is one of the field's option ids, check is a boolean, origins is a comma list of origin ids.
// Keys the kind does not declare are kept as they are and typed unknown. Problems name the field and what was
// expected, never the value, since bodies are sealed personal data. Pure: no I/O.
import { z } from "zod";
import { APPS, type DeclaredKind, type Field, type Kind } from "./life";
import { ORIGINS } from "./origins";

/** The id of a declared life kind ("work", "receipt", "interest"). Kind ids are unique across the apps. */
export type LifeKindId = DeclaredKind["id"];
/** The declared fields of one kind, with their keys and kinds as literal types. */
export type KindFields<K extends LifeKindId> = Extract<DeclaredKind, { id: K }>["fields"][number];

/** What one field holds once parsed: a choice declared inline gives its option ids, one built at run time a string. */
export type FieldValue<F extends Field> = string extends F["key"]
  ? string | number | boolean
  : F extends { kind: "number" | "money" }
    ? number
    : F extends { kind: "check" }
      ? boolean
      : F extends { kind: "choice"; options: readonly { id: infer I extends string }[] }
        ? I
        : string;

/** A parsed body of kind K: each declared field optional and typed, any other key kept and typed unknown. */
export type BodyOf<K extends LifeKindId> = { [F in KindFields<K> as F["key"]]?: FieldValue<F> } & { readonly [extra: string]: unknown };

/** One thing in a body that does not match its kind: the field's key ("" for the body itself) and what was expected. */
export type BodyProblem = { field: string; problem: string };
export type ParsedBody<K extends LifeKindId> = { ok: true; body: BodyOf<K> } | { ok: false; problems: BodyProblem[] };

const KINDS: ReadonlyMap<string, Kind> = new Map(APPS.flatMap((a) => a.kinds.map((k) => [k.id, k] as const)));
const ORIGIN_IDS: readonly string[] = ORIGINS.map((o) => o.id);
const DAY = /^\d{4}-\d{2}-\d{2}$/;

export const isLifeKind = (s: unknown): s is LifeKindId => typeof s === "string" && KINDS.has(s);

/** The schema for one field, matching what `cleanBody` keeps for its kind. */
export function fieldSchema(f: Field): z.ZodType {
  switch (f.kind) {
    case "number":
    case "money":
      return f.signed ? z.number().min(-180).max(180) : z.number().min(0).lt(1e10);
    case "check":
      return z.boolean();
    case "day":
      return z.string().refine((s) => DAY.test(s) && !Number.isNaN(Date.parse(s)), "Expected a day as YYYY-MM-DD");
    case "choice": {
      const ids = (f.options ?? []).map((o) => o.id);
      return z.string().refine((s) => ids.includes(s), `Expected one of the field's choices (${ids.join(", ")})`);
    }
    case "origins":
      return z.string().refine((s) => s.split(",").every((o) => ORIGIN_IDS.includes(o)), "Expected a comma list of origin ids");
    case "long":
      return z.string().max(20000);
    case "text":
      return z.string().max(f.internal ? 4000 : 300);
  }
}

/** The schema for a kind's body: every declared field optional, unknown keys kept. */
export function kindSchema(k: Kind): z.ZodType<Record<string, unknown>> {
  return z.looseObject(Object.fromEntries(k.fields.map((f) => [f.key, fieldSchema(f).optional()])));
}

const SCHEMAS = new Map<string, z.ZodType<Record<string, unknown>>>();

/** The schema for a kind by its id, built once; null for a kind life.ts does not declare. */
export function bodySchema(kindId: string): z.ZodType<Record<string, unknown>> | null {
  const k = KINDS.get(kindId);
  if (!k) return null;
  let s = SCHEMAS.get(kindId);
  if (!s) {
    s = kindSchema(k);
    SCHEMAS.set(kindId, s);
  }
  return s;
}

/** A stored body checked against its kind: the typed body, or every problem found. Never throws. */
export function parseBody<K extends LifeKindId>(kindId: K, body: unknown): ParsedBody<K>;
export function parseBody(kindId: string, body: unknown): ParsedBody<LifeKindId>;
export function parseBody(kindId: string, body: unknown): ParsedBody<LifeKindId> {
  const schema = bodySchema(kindId);
  if (!schema) return { ok: false, problems: [{ field: "", problem: "No such kind" }] };
  const r = schema.safeParse(body);
  if (r.success) return { ok: true, body: r.data as BodyOf<LifeKindId> };
  return { ok: false, problems: r.error.issues.map((i) => ({ field: typeof i.path[0] === "string" ? i.path[0] : "", problem: i.message })) };
}

/**
 * A stored body as its kind's type for code that reads its fields: a field that does not match its kind is left out
 * (read as missing), so a reader never sees a value of the wrong type. A body that is not an object reads as empty.
 * The record itself is untouched; `parseBody` is how to find out what was left out.
 */
export function bodyOf<K extends LifeKindId>(kindId: K, body: unknown): BodyOf<K> {
  const p = parseBody(kindId, body);
  if (p.ok) return p.body;
  if (typeof body !== "object" || body === null || Array.isArray(body)) return {};
  const bad = new Set(p.problems.map((x) => x.field));
  const kept = Object.fromEntries(Object.entries(body).filter(([key]) => !bad.has(key)));
  const again = parseBody(kindId, kept);
  return again.ok ? again.body : {};
}
