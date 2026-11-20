// A small JSON Schema checker for the subset Reflect's own schemas use (packages/core/schemas/published-*.schema.json):
// type (one or a list), const, enum, required, properties, additionalProperties (false or a schema), propertyNames,
// items, minItems, minLength, maxLength, pattern, oneOf, $ref to the schema's own $defs ("#/$defs/<name>") and the
// formats date, date-time and uri. The core imports no packages, so it checks its schemas itself; a keyword outside
// the subset is ignored. Pure.

export type Schema = {
  type?: string | readonly string[];
  const?: unknown;
  enum?: readonly unknown[];
  required?: readonly string[];
  properties?: Record<string, Schema>;
  additionalProperties?: boolean | Schema;
  propertyNames?: Schema;
  items?: Schema;
  minItems?: number;
  minLength?: number;
  maxLength?: number;
  oneOf?: readonly Schema[];
  $ref?: string;
  $defs?: Record<string, Schema>;
  pattern?: string;
  format?: string;
  [k: string]: unknown;
};

const DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;

function typeOk(type: string, v: unknown): boolean {
  if (type === "null") return v === null;
  if (type === "object") return typeof v === "object" && v !== null && !Array.isArray(v);
  if (type === "array") return Array.isArray(v);
  if (type === "integer") return Number.isInteger(v);
  if (type === "number") return typeof v === "number";
  return typeof v === type;
}

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const article = (t: string) => (t === "array" || t === "object" || t === "integer" ? "an" : "a");

/**
 * Each way `value` does not match `schema`, said with where it is (`where`, then `.field` or `[i]`). `root` is the
 * schema whose `$defs` a `$ref` names, the outermost one unless given.
 */
export function schemaProblems(schema: Schema, value: unknown, where = "value", root: Schema = schema): string[] {
  if (schema.$ref !== undefined) {
    const m = /^#\/\$defs\/(.+)$/.exec(schema.$ref);
    const target = m ? root.$defs?.[m[1]!] : undefined;
    if (!target) return [`${where}: the schema names ${schema.$ref}, which it does not define`];
    return schemaProblems(target, value, where, root);
  }
  const out: string[] = [];
  if (schema.oneOf) {
    const each = schema.oneOf.map((s) => schemaProblems(s, value, where, root));
    const passed = each.filter((p) => p.length === 0).length;
    if (passed > 1) out.push(`${where} matches more than one of its forms`);
    // None passed: report the problems of the closest form, the one with the fewest.
    if (passed === 0) out.push(...each.reduce((a, b) => (b.length < a.length ? b : a)));
  }
  if (schema.const !== undefined && value !== schema.const) out.push(`${where} is ${JSON.stringify(schema.const)}`);
  if (schema.enum && !schema.enum.includes(value)) out.push(`${where} is one of ${schema.enum.join(", ")}`);
  const types = schema.type === undefined ? [] : typeof schema.type === "string" ? [schema.type] : schema.type;
  if (types.length && !types.some((t) => typeOk(t, value))) return [...out, `${where} is ${types.map((t) => `${article(t)} ${t}`).join(" or ")}`];
  if (typeof value === "string") {
    if (schema.minLength !== undefined && value.length < schema.minLength) out.push(`${where} is empty`);
    if (schema.maxLength !== undefined && value.length > schema.maxLength) out.push(`${where} is at most ${schema.maxLength} characters`);
    if (schema.pattern && !new RegExp(schema.pattern, "u").test(value)) out.push(`${where} does not match ${schema.pattern}`);
    if (schema.format === "date" && !(DAY.test(value) && !Number.isNaN(Date.parse(value)))) out.push(`${where} is a day, such as 2026-11-20`);
    if (schema.format === "date-time" && !(DATE_TIME.test(value) && !Number.isNaN(Date.parse(value)))) out.push(`${where} is a date and time, such as 2026-11-20T03:16:00.000Z`);
    if (schema.format === "uri" && !/^[a-z][a-z0-9+.-]*:\S+$/i.test(value)) out.push(`${where} is a URI`);
  }
  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) out.push(`${where} has at least ${schema.minItems}`);
    if (schema.items) value.forEach((x, i) => out.push(...schemaProblems(schema.items!, x, `${where}[${i}]`, root)));
  }
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    const o = value as Record<string, unknown>;
    for (const k of schema.required ?? []) if (!(k in o)) out.push(`${where}.${k} is required`);
    for (const [k, v] of Object.entries(o)) {
      if (schema.propertyNames?.enum && !schema.propertyNames.enum.includes(k)) {
        out.push(`${where}.${k} is not a field here`);
        continue;
      }
      const s = schema.properties?.[k];
      if (s) out.push(...schemaProblems(s, v, `${where}.${k}`, root));
      else if (schema.additionalProperties === false) out.push(`${where}.${k} is not a field here`);
      else if (typeof schema.additionalProperties === "object") out.push(...schemaProblems(schema.additionalProperties, v, `${where}.${k}`, root));
    }
  }
  return out;
}
