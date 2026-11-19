// A JSON Schema (draft 2020-12) for every life record kind (`./life.ts`), derived from the kind's declared fields the
// same way `./life-body.ts` derives zod: text and long are strings within `cleanBody`'s lengths, number and money are
// numbers (money and unsigned numbers at least 0 and below 1e10, signed ones within 180 either way), day is YYYY-MM-DD,
// choice is one of the field's option ids, check is a boolean, origins is a comma list of origin ids. Every field is
// optional and keys the kind does not declare are allowed, as in `kindSchema`.
// Each schema also carries, under `x-reflect`, the kind's app and id, its noun and Aristotelian category, its kind of
// good (Nicomachean Ethics I.8, 1098b12) and its community (Politics I.2), all read from `./terms/ontology.json`.
// `web/scripts/life-schemas.ts` writes them to `packages/core/schemas/life/<app>.<kind>.schema.json`. Pure: no I/O.
import { APPS, type Field, type Kind, type LifeAppId } from "./life";
import { ORIGINS } from "./origins";
import { ONTOLOGY, categoryOfKind, communityOfKind, goodOfKind, nounOfKind, type Category, type Community, type Good, type Ontology } from "./terms/ontology";

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

export type LifeSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema";
  $id: string;
  title: string;
  description: string;
  type: "object";
  properties: Record<string, FieldJsonSchema>;
  additionalProperties: true;
  "x-reflect": ReflectAnnotation;
};

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
  return {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: `urn:reflect:schema:life:${app}.${k.id}`,
    title: k.label,
    description: k.intro,
    type: "object",
    properties: Object.fromEntries(k.fields.map((f) => [f.key, fieldJsonSchema(f)])),
    additionalProperties: true,
    "x-reflect": { app, kind: k.id, noun: noun.noun, category, good, community },
  };
}

/** Every life schema as the text of its file, by file name, in the apps' and kinds' declared order. */
export function lifeSchemaFiles(o: Ontology = ONTOLOGY): Map<string, string> {
  return new Map(APPS.flatMap((a) => a.kinds.map((k) => [schemaFileName(a.id, k.id), `${JSON.stringify(lifeSchema(a.id, k, o), null, 2)}\n`] as const)));
}
