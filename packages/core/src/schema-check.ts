// A small JSON Schema checker for the subset Reflect's own schemas use (packages/core/schemas/published-*.schema.json):
// type, const, enum, required, properties, additionalProperties false, items, minItems, minLength, pattern and the
// formats date-time and uri. The core imports no packages, so it checks its schemas itself; a keyword outside the
// subset is ignored. Pure.

export type Schema = {
  type?: string;
  const?: unknown;
  enum?: readonly unknown[];
  required?: readonly string[];
  properties?: Record<string, Schema>;
  additionalProperties?: boolean;
  items?: Schema;
  minItems?: number;
  minLength?: number;
  pattern?: string;
  format?: string;
  [k: string]: unknown;
};

const DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;

function typeOk(type: string, v: unknown): boolean {
  if (type === "object") return typeof v === "object" && v !== null && !Array.isArray(v);
  if (type === "array") return Array.isArray(v);
  if (type === "integer") return Number.isInteger(v);
  if (type === "number") return typeof v === "number";
  return typeof v === type;
}

/** Each way `value` does not match `schema`, said with where it is (`where`, then `.field` or `[i]`). */
export function schemaProblems(schema: Schema, value: unknown, where = "value"): string[] {
  const out: string[] = [];
  if (schema.const !== undefined && value !== schema.const) out.push(`${where} is ${JSON.stringify(schema.const)}`);
  if (schema.enum && !schema.enum.includes(value)) out.push(`${where} is one of ${schema.enum.join(", ")}`);
  if (schema.type && !typeOk(schema.type, value)) return [...out, `${where} is ${schema.type === "array" || schema.type === "object" ? "an" : "a"} ${schema.type}`];
  if (typeof value === "string") {
    if (schema.minLength !== undefined && value.length < schema.minLength) out.push(`${where} is empty`);
    if (schema.pattern && !new RegExp(schema.pattern, "u").test(value)) out.push(`${where} does not match ${schema.pattern}`);
    if (schema.format === "date-time" && !(DATE_TIME.test(value) && !Number.isNaN(Date.parse(value)))) out.push(`${where} is a date and time, such as 2026-11-20T03:16:00.000Z`);
    if (schema.format === "uri" && !/^[a-z][a-z0-9+.-]*:\S+$/i.test(value)) out.push(`${where} is a URI`);
  }
  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) out.push(`${where} has at least ${schema.minItems}`);
    if (schema.items) value.forEach((x, i) => out.push(...schemaProblems(schema.items!, x, `${where}[${i}]`)));
  }
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    const o = value as Record<string, unknown>;
    for (const k of schema.required ?? []) if (!(k in o)) out.push(`${where}.${k} is required`);
    for (const [k, v] of Object.entries(o)) {
      const s = schema.properties?.[k];
      if (s) out.push(...schemaProblems(s, v, `${where}.${k}`));
      else if (schema.additionalProperties === false) out.push(`${where}.${k} is not a field here`);
    }
  }
  return out;
}
