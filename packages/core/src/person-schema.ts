// The person record's JSON Schema (draft 2020-12), from `PersonState` in ./person.ts: facts, relationships and holds,
// each with its dates and the source of its value (./value-source.ts, shared as `$defs.source`). Under `x-reflect` it
// carries the noun person with its category, kind of good and community, read from ./terms/ontology.json as the life
// schemas do. `web/scripts/life-schemas.ts` writes it to packages/core/schemas/person.schema.json (`pnpm schemas`,
// `--check`). The key lists are typed against person.ts, so a key added there and not here fails the type check.
// `personProblems` checks a record against it with ./schema-check.ts, for `reflect check` and tests. Pure: no I/O.
import type { Fact, Hold, PersonState, Relationship } from "./person.ts";
import { schemaProblems, type Schema } from "./schema-check.ts";
import { categoryOfNoun, nounNamed, ONTOLOGY, type Category, type Community, type Good, type Ontology } from "./terms/ontology.ts";
import { SOURCE_JSON_SCHEMA } from "./value-source.ts";

export const PERSON_SCHEMA_FILE = "person.schema.json";

/** Every key of T, once each: a key person.ts adds and this list leaves out is a type error. */
const keysOf =
  <T>() =>
  <const K extends readonly (keyof T & string)[]>(keys: K & ([keyof T] extends [K[number]] ? unknown : never)): K =>
    keys;

const day = { type: "string", format: "date", pattern: "^\\d{4}-\\d{2}-\\d{2}$" } as const;
const openDay = { type: ["string", "null"], format: "date", pattern: "^\\d{4}-\\d{2}-\\d{2}$", description: "The day the value stopped holding; null while it holds." } as const;
const textOf = (description: string) => ({ type: "string", minLength: 1, description });
const source = { $ref: "#/$defs/source" } as const;

const FACT = keysOf<Fact>()(["key", "value", "validFrom", "validTo", "recordedAt", "source", "status"]);
const RELATIONSHIP = keysOf<Relationship>()(["name", "kind", "validFrom", "validTo", "recordedAt", "source"]);
const HOLD = keysOf<Hold>()(["subject", "value", "validFrom", "validTo", "source"]);
const PERSON = keysOf<PersonState>()(["facts", "relationships", "holds"]);

export type PersonSchema = Schema & {
  $schema: "https://json-schema.org/draft/2020-12/schema";
  $id: string;
  "x-reflect": { noun: string; category: Category; good: Good; community: Community };
};

/** The person record's schema. Throws when the ontology has no noun person, so the schema cannot ship unfiled. */
export function personSchema(o: Ontology = ONTOLOGY): PersonSchema {
  const noun = nounNamed("person", o);
  const category = categoryOfNoun("person", o);
  if (!noun || !category) throw new Error("the ontology has no noun person with a category");
  return {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: "urn:reflect:schema:person",
    title: "Person",
    description: "What the person has said about themselves: facts, relationships and holds. Nothing is overwritten: a new value closes the open one by giving it validTo. Each value names its source.",
    type: "object",
    required: [...PERSON],
    additionalProperties: false,
    properties: {
      facts: {
        type: "array",
        description: "Facts about the person (name, birthday, work), one open value per key.",
        items: {
          type: "object",
          required: [...FACT],
          additionalProperties: false,
          properties: {
            key: textOf("What the fact is about, such as name or birthday."),
            value: { type: "string" },
            validFrom: { ...day, description: "The day the value began to hold." },
            validTo: openDay,
            recordedAt: { ...day, description: "The day Reflect recorded it." },
            source,
            status: { enum: ["proposed", "confirmed"], description: "Confirmed when stated or when the person confirmed its source; only a confirmed fact is current." },
          },
        },
      },
      relationships: {
        type: "array",
        description: "The person's named relationships, one open value per kind.",
        items: {
          type: "object",
          required: [...RELATIONSHIP],
          additionalProperties: false,
          properties: {
            name: textOf("The other person's name."),
            kind: { enum: ["closest_friend"] },
            validFrom: { ...day, description: "The day it began." },
            validTo: openDay,
            recordedAt: { ...day, description: "The day Reflect recorded it." },
            source,
          },
        },
      },
      holds: {
        type: "array",
        description: "How the person holds something, such as partnership or children: their picks and own words. Kept with beliefs and values.",
        items: {
          type: "object",
          required: [...HOLD],
          additionalProperties: false,
          properties: {
            subject: textOf("What is held, such as partnership."),
            value: { type: "string" },
            validFrom: { ...day, description: "The day it was said." },
            validTo: openDay,
            source,
          },
        },
      },
    },
    $defs: { source: SOURCE_JSON_SCHEMA as unknown as Schema },
    "x-reflect": { noun: noun.noun, category, good: noun.good, community: noun.community },
  };
}

/** The schema as the text of its file. */
export const personSchemaFile = (o: Ontology = ONTOLOGY): string => `${JSON.stringify(personSchema(o), null, 2)}\n`;

/**
 * Each way a person record does not match its schema, plus what the schema cannot say: a stated fact is confirmed,
 * and a fact's status agrees with its source's. A problem names the place, never the value.
 */
export function personProblems(raw: unknown, where = "person"): string[] {
  const out = schemaProblems(personSchema(), raw, where);
  if (out.length) return out;
  const facts = (raw as { facts: { source: { kind: string; status?: string }; status: string }[] }).facts;
  facts.forEach((f, i) => {
    const want = f.source.kind === "stated" ? "confirmed" : f.source.status;
    if (f.status !== want) out.push(`${where}.facts[${i}].status is ${want}, as its source is`);
  });
  return out;
}

/** The keys of person.json that hold the person record. A vault's person.json also keeps its id and name. */
export const PERSON_RECORD_KEYS: readonly string[] = PERSON;

/**
 * What `reflect check` says about a vault's person.json. `reflect init` writes it with the person's id and name only,
 * and the files host keeps no facts, relationships or holds (the web app keeps them in Postgres), so most vaults have
 * nothing to check. When person.json does hold any of the three, they are checked against the person schema, a
 * missing one read as empty. `rel` is its path in the vault; null text means the vault has no person.json.
 */
export function personFileProblems(text: string | null, rel = "person.json"): string[] {
  if (text === null) return [];
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return [`${rel} is not JSON`];
  }
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return [`${rel} is not a JSON object`];
  const o = raw as Record<string, unknown>;
  if (!PERSON.some((k) => k in o)) return [];
  return personProblems(Object.fromEntries(PERSON.map((k) => [k, o[k] ?? []])), rel);
}
