// Input schemas for the core's own actions (./vault-actions.ts), with no package imports: each is a Standard Schema
// (./registry.ts), so the runner checks it the way it checks the app's zod schemas, and carries its JSON Schema, which
// the CLI lists and an MCP server over a vault offers as a tool's input. Only the field kinds the core's actions use.
import type { StandardIssue, StandardResult, StandardSchema } from "./registry.ts";

/** A JSON Schema object, as MCP's tools/list gives a tool's input. */
export type JsonSchema = { type: string; description?: string; [k: string]: unknown };

/** One field: its JSON Schema, whether it may be left out, and its check. */
export type Field<T> = { readonly json: JsonSchema; readonly optional: boolean; check(v: unknown): { value: T } | { message: string } };

/** An object input: a Standard Schema with its JSON Schema. Fields it does not name are dropped, as zod's objects do. */
export type InputSchema<O> = StandardSchema<unknown, O> & { readonly json: JsonSchema & { type: "object"; properties: Record<string, JsonSchema>; required: string[] } };

/** A string, with a least length, a pattern it must match and a description. */
export function str(o: { min?: number; pattern?: RegExp; format?: string; describe?: string } = {}): Field<string> {
  const json: JsonSchema = { type: "string", ...(o.min !== undefined ? { minLength: o.min } : {}), ...(o.format ? { format: o.format } : o.pattern ? { pattern: o.pattern.source } : {}), ...(o.describe ? { description: o.describe } : {}) };
  return {
    json,
    optional: false,
    check: (v) => {
      if (typeof v !== "string") return { message: "expected a string" };
      if (o.min !== undefined && v.length < o.min) return { message: `expected at least ${o.min} character${o.min === 1 ? "" : "s"}` };
      if (o.pattern && !o.pattern.test(v)) return { message: o.format ? `expected a ${o.format}` : `expected to match ${o.pattern.source}` };
      return { value: v };
    },
  };
}

/** A whole number between `min` and `max`; with `default`, it may be left out. */
export function int(o: { min?: number; max?: number; default?: number; describe?: string } = {}): Field<number> {
  const json: JsonSchema = { type: "integer", ...(o.min !== undefined ? { minimum: o.min } : {}), ...(o.max !== undefined ? { maximum: o.max } : {}), ...(o.default !== undefined ? { default: o.default } : {}), ...(o.describe ? { description: o.describe } : {}) };
  return {
    json,
    optional: o.default !== undefined,
    check: (v) => {
      if (v === undefined && o.default !== undefined) return { value: o.default };
      if (typeof v !== "number" || !Number.isInteger(v)) return { message: "expected a whole number" };
      if (o.min !== undefined && v < o.min) return { message: `expected at least ${o.min}` };
      if (o.max !== undefined && v > o.max) return { message: `expected at most ${o.max}` };
      return { value: v };
    },
  };
}

/** One of a fixed list of strings. */
export function oneOf<T extends string>(values: readonly T[], o: { describe?: string } = {}): Field<T> {
  return {
    json: { type: "string", enum: [...values], ...(o.describe ? { description: o.describe } : {}) },
    optional: false,
    check: (v) => (typeof v === "string" && (values as readonly string[]).includes(v) ? { value: v as T } : { message: `expected one of ${values.join(", ")}` }),
  };
}

/** A field that may be left out. Left out, the checked input does not have it. */
export function optional<T>(f: Field<T>): Field<T | undefined> {
  return { json: f.json, optional: true, check: (v) => (v === undefined ? { value: undefined } : f.check(v)) };
}

/** The RFC 9562 form of a uuid, as zod's `z.string().uuid()` reads it. */
export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type Out<F> = { [K in keyof F]: F[K] extends Field<infer T> ? T : never };

/** An object of fields. */
export function object<F extends Record<string, Field<unknown>>>(fields: F): InputSchema<Out<F>> {
  const properties: Record<string, JsonSchema> = {};
  const required: string[] = [];
  for (const [k, f] of Object.entries(fields)) {
    properties[k] = f.json;
    if (!f.optional) required.push(k);
  }
  const validate = (value: unknown): StandardResult<Out<F>> => {
    if (typeof value !== "object" || value === null || Array.isArray(value)) return { issues: [{ message: "expected an object" }] };
    const given = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    const issues: StandardIssue[] = [];
    for (const [k, f] of Object.entries(fields)) {
      if (given[k] === undefined && !f.optional) {
        issues.push({ message: "required", path: [k] });
        continue;
      }
      const r = f.check(given[k]);
      if ("message" in r) issues.push({ message: r.message, path: [k] });
      else if (r.value !== undefined) out[k] = r.value;
    }
    return issues.length ? { issues } : { value: out as Out<F> };
  };
  return { "~standard": { version: 1, vendor: "reflect", validate }, json: { type: "object", properties, required } };
}
