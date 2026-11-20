// A JSON Schema (draft 2020-12) for every life record kind (`./life.ts`), derived from the kind's declared fields the
// same way `./life-body.ts` derives zod: text and long are strings within `cleanBody`'s lengths, number and money are
// numbers (money and unsigned numbers at least 0 and below 1e10, signed ones within 180 either way), day is YYYY-MM-DD,
// choice is one of the field's option ids, check is a boolean, origins is a comma list of origin ids. Every field is
// optional and keys the kind does not declare are allowed, as in `kindSchema`.
// A body may also name where each value came from under `_sources` (`SOURCES_KEY` in ./value-source.ts): an object from
// a declared field key to its source, one of stated, journal, conversation, import or noticed, each schema sharing
// the one source schema as `$defs.source`. The name starts with an underscore because it is data about the body, not a
// field: no field key starts with one, so it cannot clash, and it reads as metadata in front matter and JSON alike.
// (`x-` names belong to a schema's own annotations, such as `x-reflect`, not to the records it describes.)
// Each schema also carries, under `x-reflect`, the kind's app and id, its noun and Aristotelian category, its kind of
// good (Nicomachean Ethics I.8, 1098b12) and its community (Politics I.2), all read from `./terms/ontology.json`.
// `web/scripts/life-schemas.ts` writes them to `packages/core/schemas/life/<app>.<kind>.schema.json`. Pure: no I/O.
import { APPS, type Field, type Kind, type LifeAppId } from "./life.ts";
import { ORIGINS } from "./origins.ts";
import { SOURCE_JSON_SCHEMA, SOURCES_KEY, sourcesJsonSchema } from "./value-source.ts";
import { ONTOLOGY, categoryOfKind, communityOfKind, goodOfKind, nounOfKind, type Category, type Community, type Good, type Ontology } from "./terms/ontology.ts";

/** The subset of JSON Schema the life schemas use. */
export type FieldJsonSchema = {
  type: "string" | "number" | "boolean";
  title: string;
  description?: string;
  minimum?: number;
  maximum?: number;
  exclusiveMaximum?: number;
  maxLength?: number;
  pattern?: string;
  format?: "date";
  enum?: string[];
};

/** What a life schema says about its kind beyond the body's shape. */
export type ReflectAnnotation = {
  app: LifeAppId;
  kind: string;
  noun: string;
  category: Category;
  good: Good;
  community: Community;
};

/** The schema of a body's `_sources`: a declared field key to its source (./value-source.ts). */
export type SourcesJsonSchema = ReturnType<typeof sourcesJsonSchema>;

export type LifeSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema";
  $id: string;
  title: string;
  description: string;
  type: "object";
  /** Each declared field's schema, and `_sources`'s. `fieldSchemaOf` gives a field's alone. */
  properties: Record<string, FieldJsonSchema | SourcesJsonSchema>;
  additionalProperties: true;
  $defs: { source: typeof SOURCE_JSON_SCHEMA };
  "x-reflect": ReflectAnnotation;
};

/** A declared field's schema in a life schema, or undefined for `_sources` and keys the kind does not declare. */
export function fieldSchemaOf(schema: LifeSchema, key: string): FieldJsonSchema | undefined {
  if (key === SOURCES_KEY || !Object.hasOwn(schema.properties, key)) return undefined;
  const s = schema.properties[key];
  return s && s.type !== "object" ? s : undefined;
}

const ORIGIN = ORIGINS.map((o) => o.id).join("|");

/** The JSON Schema for one field, matching `fieldSchema` in `./life-body.ts`. */
export function fieldJsonSchema(f: Field): FieldJsonSchema {
  const base = { title: f.label, ...(f.hint ? { description: f.hint } : {}) };
  switch (f.kind) {
    case "number":
    case "money":
      return f.signed ? { type: "number", ...base, minimum: -180, maximum: 180 } : { type: "number", ...base, minimum: 0, exclusiveMaximum: 1e10 };
    case "check":
      return { type: "boolean", ...base };
    case "day":
      return { type: "string", ...base, format: "date", pattern: "^\\d{4}-\\d{2}-\\d{2}$" };
    case "choice":
      return { type: "string", ...base, enum: (f.options ?? []).map((o) => o.id) };
    case "origins":
      return { type: "string", ...base, pattern: `^(${ORIGIN})(,(${ORIGIN}))*$` };
    case "long":
      return { type: "string", ...base, maxLength: 20000 };
    case "text":
      return { type: "string", ...base, maxLength: f.internal ? 4000 : 300 };
  }
}

/** The file a kind's schema is written to, under `packages/core/schemas/life/`. */
export const schemaFileName = (app: string, kind: string): string => `${app}.${kind}.schema.json`;

/** The JSON Schema for one kind. Throws when the ontology does not place the kind, so a new kind cannot ship unfiled. */
export function lifeSchema(app: LifeAppId, k: Kind, o: Ontology = ONTOLOGY): LifeSchema {
  const noun = nounOfKind(app, k.id, o);
  const category = categoryOfKind(app, k.id, o);
  const good = goodOfKind(app, k.id, o);
  const community = communityOfKind(app, k.id, o);
  if (!noun || !category || !good || !community) throw new Error(`${app}:${k.id} has no noun, category, good or community in the ontology`);
  const odd = k.fields.find((f) => f.key.startsWith("_"));
  if (odd) throw new Error(`${app}:${k.id} declares the field ${odd.key}; a field key never starts with "_", which ${SOURCES_KEY} uses`);
  return {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: `urn:reflect:schema:life:${app}.${k.id}`,
    title: k.label,
    description: k.intro,
    type: "object",
    properties: { ...Object.fromEntries(k.fields.map((f) => [f.key, fieldJsonSchema(f)])), [SOURCES_KEY]: sourcesJsonSchema(k.fields.map((f) => f.key)) },
    additionalProperties: true,
    $defs: { source: SOURCE_JSON_SCHEMA },
    "x-reflect": { app, kind: k.id, noun: noun.noun, category, good, community },
  };
}

/** Every life schema as the text of its file, by file name, in the apps' and kinds' declared order. */
export function lifeSchemaFiles(o: Ontology = ONTOLOGY): Map<string, string> {
  return new Map(APPS.flatMap((a) => a.kinds.map((k) => [schemaFileName(a.id, k.id), `${JSON.stringify(lifeSchema(a.id, k, o), null, 2)}\n`] as const)));
}

/** Every life kind as `<app>.<kind>`, in the apps' and kinds' declared order. */
export const lifeKindRefs = (): string[] => APPS.flatMap((a) => a.kinds.map((k) => `${a.id}.${k.id}`));

/**
 * One kind's schema by `<app>.<kind>` ("home.meal"), `<app>:<kind>`, or the kind's id alone ("meal"), since kind ids
 * are unique across the apps; null when no kind matches. The `life_schema` action (./vault-actions.ts) answers with it.
 */
export function lifeSchemaOf(ref: string, o: Ontology = ONTOLOGY): LifeSchema | null {
  const m = /^([a-z]+)[.:]([a-z0-9-]+)$/.exec(ref.trim());
  for (const a of APPS) {
    for (const k of a.kinds) if (m ? a.id === m[1] && k.id === m[2] : k.id === ref.trim()) return lifeSchema(a.id, k, o);
  }
  return null;
}
