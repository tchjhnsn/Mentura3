// Where a field's value came from (Torian, 2026-11-20 04:15Z): journal entries, AI conversations, imports and what
// Reflect noticed are sources of field values, not nouns in the life ontology. Every value a person keeps, in a life
// record or the person record, names one source of a closed set, read with W3C PROV in mind: the value was derived
// from the source (prov:wasDerivedFrom), and the person is the agent it is attributed to once they confirm it.
//   stated        the person typed it into the field
//   journal       a journal entry: the entry's id and the words quoted from it
//   conversation  an AI chat: the conversation's id and the words quoted from it
//   import        a connector or an uploaded file: its name and the item's id there
//   noticed       Reflect proposed it from the person's own records, named by id
// A stated value is the person's from the start. Every other source starts proposed and stays proposed until the
// person confirms it (`startStatus`, `confirmSource`; lean/Reflect/Sources.lean proves the rule).
// Older values still read (`readValueSource`, `sourceKindOf`): a missing source is stated, person.ts's old
// `fromJournal` is journal, and the interest model's told and imported are stated and import.
// The records that are sources (journal entries, reflections, conversations, imports) are information, outside the
// ten Categories; the ontology says so under `sources` (./terms/ontology.json). Pure: no I/O.

/** The kinds of source, in order. `fields` names what each source carries beyond its kind and status. */
export const SOURCE_KINDS = [
  { id: "stated", label: "You typed it", fields: [] },
  { id: "journal", label: "From your journal", fields: ["entry", "quote"] },
  { id: "conversation", label: "From a conversation with your AI", fields: ["conversation", "quote"] },
  { id: "import", label: "Imported", fields: ["name", "item"] },
  { id: "noticed", label: "Reflect noticed", fields: ["records"] },
] as const satisfies readonly { id: string; label: string; fields: readonly string[] }[];
export type SourceKind = (typeof SOURCE_KINDS)[number]["id"];
export const SOURCE_KIND_IDS: readonly SourceKind[] = SOURCE_KINDS.map((k) => k.id);
export const isSourceKind = (v: unknown): v is SourceKind => typeof v === "string" && (SOURCE_KIND_IDS as readonly string[]).includes(v);

/** A value from any source but stated is proposed until the person confirms it. */
export const SOURCE_STATUSES = ["proposed", "confirmed"] as const;
export type SourceStatus = (typeof SOURCE_STATUSES)[number];

export type StatedSource = { kind: "stated" };
export type JournalSource = { kind: "journal"; entry: string; quote: string; status: SourceStatus; /** The read grant the quote was taken under, when one was. */ grant?: string };
export type ConversationSource = { kind: "conversation"; conversation: string; quote: string; status: SourceStatus };
export type ImportSource = { kind: "import"; name: string; item: string; status: SourceStatus };
export type NoticedSource = { kind: "noticed"; records: string[]; status: SourceStatus };
export type ValueSource = StatedSource | JournalSource | ConversationSource | ImportSource | NoticedSource;

export const STATED: StatedSource = { kind: "stated" };

/** The status a value from this kind of source starts with: confirmed only when the person typed it. */
export const startStatus = (kind: SourceKind): SourceStatus => (kind === "stated" ? "confirmed" : "proposed");

/** A source's status: a stated value is always confirmed. */
export const statusOf = (s: ValueSource): SourceStatus => (s.kind === "stated" ? "confirmed" : s.status);

/** The person confirms a proposed value; its source stays what it was. */
export const confirmSource = <S extends ValueSource>(s: S): S => (s.kind === "stated" ? s : { ...s, status: "confirmed" });

/** The key of a life record body's sources: one source per field key. A field key never starts with "_". */
export const SOURCES_KEY = "_sources";
export type FieldSources = Record<string, ValueSource>;

const text = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v : null);
const statusIn = (v: unknown, fallback: SourceStatus): SourceStatus => ((SOURCE_STATUSES as readonly unknown[]).includes(v) ? (v as SourceStatus) : fallback);

/**
 * A source as stored, older shapes included, or null when it cannot be read. Nothing (undefined or null) is stated,
 * since every value before sources was typed by the person; `{ kind: "fromJournal", entry, quote, grant }` (person.ts
 * before 2026-11-20) is journal, with `status` given by the fact that held it; the interest model's "told" and
 * "imported" are stated and import, read here as kinds with no detail. A source with no status starts proposed.
 */
export function readValueSource(v: unknown, status?: SourceStatus): ValueSource | null {
  if (v === undefined || v === null || v === "told" || v === "stated") return STATED;
  if (typeof v !== "object" || Array.isArray(v)) return null;
  const o = v as Record<string, unknown>;
  const st = statusIn(o.status, status ?? "proposed");
  switch (o.kind) {
    case "stated":
      return STATED;
    case "fromJournal":
    case "journal": {
      const entry = text(o.entry), quote = text(o.quote), grant = text(o.grant);
      return entry && quote ? { kind: "journal", entry, quote, status: st, ...(grant ? { grant } : {}) } : null;
    }
    case "conversation": {
      const conversation = text(o.conversation), quote = text(o.quote);
      return conversation && quote ? { kind: "conversation", conversation, quote, status: st } : null;
    }
    case "import": {
      const name = text(o.name), item = text(o.item);
      return name && item ? { kind: "import", name, item, status: st } : null;
    }
    case "noticed": {
      const records = Array.isArray(o.records) ? o.records.filter((r): r is string => typeof r === "string" && r.trim() !== "") : [];
      return records.length ? { kind: "noticed", records, status: st } : null;
    }
    default:
      return null;
  }
}

/** Only the kind of a stored source, for models that keep no detail (the interest model): missing, told or unknown is stated. */
export function sourceKindOf(v: unknown): SourceKind {
  const k = typeof v === "object" && v !== null ? (v as { kind?: unknown }).kind : v;
  if (k === "told" || k === undefined || k === null) return "stated";
  if (k === "imported") return "import";
  if (k === "fromJournal") return "journal";
  return isSourceKind(k) ? k : "stated";
}

/** One kind's JSON Schema branch: its kind, what it carries and, for every kind but stated, its status. */
type JsonSchemaPart = Record<string, unknown>;
type Branch = { type: "object"; title: string; properties: Record<string, JsonSchemaPart>; required: string[]; additionalProperties: false };
export type SourceJsonSchema = { title: string; description: string; oneOf: Branch[] };
const id = { type: "string", minLength: 1, maxLength: 300 };
const quote = { type: "string", minLength: 1, maxLength: 2000, description: "The words the value was taken from, quoted exactly." };
const status = { enum: [...SOURCE_STATUSES], description: "Proposed until the person confirms it." };
const branch = (kind: SourceKind, title: string, props: Record<string, JsonSchemaPart>): Branch => ({
  type: "object",
  title,
  properties: { kind: { const: kind }, ...props, ...(kind === "stated" ? {} : { status }) },
  required: ["kind", ...Object.keys(props).filter((k) => k !== "grant"), ...(kind === "stated" ? [] : ["status"])],
  additionalProperties: false,
});

/** The JSON Schema of one source, shared by every life schema and the person schema as `$defs.source`. */
export const SOURCE_JSON_SCHEMA: SourceJsonSchema = {
  title: "Where a value came from",
  description: "The source a field's value was derived from (W3C PROV, wasDerivedFrom). Every kind but stated is proposed until the person confirms it.",
  oneOf: [
    branch("stated", "The person typed it into the field", {}),
    branch("journal", "A journal entry", { entry: { ...id, description: "The entry's id." }, quote, grant: { ...id, description: "The read grant the quote was taken under." } }),
    branch("conversation", "A conversation with an AI", { conversation: { ...id, description: "The conversation's id." }, quote }),
    branch("import", "A connector or an uploaded file", { name: { ...id, description: "The connector's or the file's name." }, item: { ...id, description: "The item's id there." } }),
    branch("noticed", "Reflect proposed it from the person's own records", { records: { type: "array", minItems: 1, items: id, description: "The ids of the records it was noticed in." } }),
  ],
};

/** The JSON Schema of a body's `_sources`: an object from a declared field key to its source. */
export const sourcesJsonSchema = (keys: readonly string[]) => ({
  type: "object" as const,
  title: "Where each value came from",
  description: "One source per field key. A field with no source here was typed by the person.",
  propertyNames: { enum: [...keys] },
  additionalProperties: { $ref: "#/$defs/source" as const },
});
