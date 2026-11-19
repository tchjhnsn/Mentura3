// Checks a vault's life records against their kinds' JSON Schemas (./life-schemas.ts), for `reflect check`. A vault
// keeps life records of three kinds as notes, one note each (`LIFE_NOTE_KINDS` in ./lifetime.ts): friends in
// belonging/friends, groups in belonging/groups and offices in belonging/standing. A note's front matter is its body.
// The other life kinds are kept by the web app in its database, so a vault has none of them.
// The validator covers the subset of JSON Schema the life schemas use (type, minimum, maximum, exclusiveMaximum,
// maxLength, pattern, format date and enum), so the core still imports no package and the CLI runs under plain Node.
// It agrees with `parseBody` in ./life-body.ts, which reads the same declarations (life-check.test.ts checks this).
// A problem names the record, its kind and the field, never the value, since bodies are personal data.
import { join } from "node:path";
import type { RecordPaths } from "./layout.ts";
import { kindOf, type LifeAppId } from "./life.ts";
import { lifeSchema, type LifeSchema } from "./life-schemas.ts";
import { headOf, LIFE_NOTE_KINDS, notesIn } from "./lifetime.ts";
import { readRecord } from "./record-io.ts";

/** One thing in a body that does not match its schema: the field's key ("" for the body itself) and what was expected. */
export type SchemaProblem = { field: string; problem: string };

/** A problem in one of a vault's life records: the record's id (its path in the vault), its app and kind, and the field. */
export type LifeProblem = { id: string; app: LifeAppId; kind: string } & SchemaProblem;

/** What `checkLifeRecords` looked at: each kind a vault keeps, its folder, its schema's id and how many records it read. */
export type LifeCheck = {
  kinds: { app: LifeAppId; kind: string; dir: string; schema: string; records: number }[];
  problems: LifeProblem[];
};

const DAY = /^\d{4}-\d{2}-\d{2}$/;

/** What one value does not match in its field's schema, or null when it matches. Never names the value. */
function fieldProblem(s: LifeSchema["properties"][string], v: unknown): string | null {
  if (s.type === "boolean") return typeof v === "boolean" ? null : "expected true or false";
  if (s.type === "number") {
    if (typeof v !== "number" || !Number.isFinite(v)) return "expected a number";
    if (s.minimum !== undefined && v < s.minimum) return `expected at least ${s.minimum}`;
    if (s.maximum !== undefined && v > s.maximum) return `expected at most ${s.maximum}`;
    if (s.exclusiveMaximum !== undefined && v >= s.exclusiveMaximum) return `expected less than ${s.exclusiveMaximum}`;
    return null;
  }
  if (typeof v !== "string") return "expected text";
  if (s.maxLength !== undefined && v.length > s.maxLength) return `expected at most ${s.maxLength} characters`;
  if (s.enum && !s.enum.includes(v)) return `expected one of the field's choices (${s.enum.join(", ")})`;
  if (s.format === "date" && (!DAY.test(v) || Number.isNaN(Date.parse(v)))) return "expected a day as YYYY-MM-DD";
  if (s.pattern && !new RegExp(s.pattern).test(v)) return "expected to match the field's pattern";
  return null;
}

/** Every field of a body that does not match its kind's schema. Keys the schema does not name are allowed, as in the schema. */
export function schemaProblems(schema: LifeSchema, body: unknown): SchemaProblem[] {
  if (typeof body !== "object" || body === null || Array.isArray(body)) return [{ field: "", problem: "expected an object" }];
  const out: SchemaProblem[] = [];
  for (const [key, v] of Object.entries(body)) {
    const s = Object.hasOwn(schema.properties, key) ? schema.properties[key] : undefined;
    if (!s || v === undefined) continue;
    const p = fieldProblem(s, v);
    if (p) out.push({ field: key, problem: p });
  }
  return out;
}

/**
 * A note's front matter as a body: front matter is text, so a value is read as a number or a boolean where the field's
 * schema says so and it is written as one ("4", "true"). Anything else stays text, so the check can say it is wrong.
 */
export function bodyFromFrontMatter(schema: LifeSchema, head: Record<string, string>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, v] of Object.entries(head)) {
    const type = Object.hasOwn(schema.properties, key) ? schema.properties[key]?.type : undefined;
    out[key] = type === "number" && /^-?\d+(\.\d+)?$/.test(v) ? Number(v) : type === "boolean" && (v === "true" || v === "false") ? v === "true" : v;
  }
  return out;
}

/** Check every life record a vault keeps against its kind's schema. An instance in the older people layout keeps none. */
export async function checkLifeRecords(root: string, paths: RecordPaths): Promise<LifeCheck> {
  const check: LifeCheck = { kinds: [], problems: [] };
  if (paths.person) return check;
  for (const k of LIFE_NOTE_KINDS) {
    const kind = kindOf(k.app, k.kind);
    if (!kind) throw new Error(`${k.app}:${k.kind} is not a life kind`);
    const schema = lifeSchema(k.app, kind);
    const notes = await notesIn(root, k.dir);
    check.kinds.push({ app: k.app, kind: k.kind, dir: k.dir, schema: schema.$id, records: notes.length });
    for (const f of notes) {
      const id = join(k.dir, f);
      let head: Record<string, string>;
      try {
        head = headOf((await readRecord(root, id)) ?? "");
      } catch {
        check.problems.push({ id, app: k.app, kind: k.kind, field: "", problem: "has front matter that cannot be read" });
        continue;
      }
      const body = bodyFromFrontMatter(schema, head);
      for (const p of schemaProblems(schema, body)) check.problems.push({ id, app: k.app, kind: k.kind, ...p });
    }
  }
  return check;
}

/** A problem as `reflect check` prints it: the record, its kind and the field, never the value. */
export const lifeProblemLine = (p: LifeProblem): string => `${p.id} (${p.app}.${p.kind}): ${p.field ? `field ${p.field}: ${p.problem}` : `the note ${p.problem}`}`;

/** What the check read, in one line, so a vault with no life records still says what was checked. */
export function lifeCheckLine(c: LifeCheck): string {
  const n = c.kinds.reduce((sum, k) => sum + k.records, 0);
  if (!c.kinds.length) return "life records: none, since this instance uses the older people layout";
  if (n === 0) return `life records: none kept; checked ${c.kinds.map((k) => `${k.dir} (${k.app}.${k.kind})`).join(", ")}`;
  return `life records: ${n} checked against their schemas (${c.kinds.map((k) => `${k.app}.${k.kind} ${k.records}`).join(", ")})`;
}
