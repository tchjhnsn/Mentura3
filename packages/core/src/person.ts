// The person record: facts, relationships, holds and attributes (telos, ambitions and the rest of the founder's
// puzzle), each with its dates and the source of its value. Mirrors
// lean/NTS/Person.lean and thrivesight_core/nts/person.py (now in the NTS repository). Its JSON Schema is
// packages/core/schemas/person.schema.json (./person-schema.ts). A value's source is one of ./value-source.ts's
// kinds; the old `fromJournal` source reads as journal (`readPersonState`).
import { confirmSource, readValueSource, STATED, type SourceStatus, type ValueSource } from "./value-source.ts";

export type Brand<T, B extends string> = T & { readonly __brand: B };
export type IsoDate = Brand<string, "IsoDate">;

/** Where a value came from (./value-source.ts). */
export type Source = ValueSource;
export { STATED };

export type Fact = {
  key: string;
  value: string;
  validFrom: IsoDate;
  validTo: IsoDate | null;
  recordedAt: IsoDate;
  source: Source;
  status: "proposed" | "confirmed";
};

export type Relationship = {
  name: string;
  kind: "closest_friend";
  validFrom: IsoDate;
  validTo: IsoDate | null;
  recordedAt: IsoDate;
  source: Source;
};

/** How the person holds something (partnership, children): their picks and own words. Kept with beliefs and values. */
export type Hold = { subject: string; value: string; validFrom: IsoDate; validTo: IsoDate | null; source: Source };

/**
 * What a person is aiming at and made of, the attributes of the founder's puzzle (Torian's playbook, step one, know
 * the founder, 2026-10-30; Torian, 2026-11-20: the person schema shows telos, ambitions and the rest). Each kind is
 * a list: a person has several of each. Labels and lines are for people; `ref` is where Aristotle treats it.
 */
export const ATTRIBUTE_KINDS = [
  { id: "telos", label: "Telos", line: "The end everything else is for", ref: "Nicomachean Ethics I.7" },
  { id: "ambition", label: "Ambitions", line: "What you want to bring about, a goal with an end", ref: "Nicomachean Ethics III.4 (wish is for the end)" },
  { id: "passion", label: "Passions", line: "What you love doing or thinking about for its own sake", ref: "Nicomachean Ethics X.4-5 (pleasure completes the activity)" },
  { id: "value", label: "Values", line: "What you hold good and will not trade away", ref: "Nicomachean Ethics I.8 (goods of soul, body and external)" },
  { id: "strength", label: "Strengths", line: "What you do well, by nature or by habit", ref: "Nicomachean Ethics II.1, II.5 (a state, hexis)" },
  { id: "weakness", label: "Weaknesses", line: "Where you fall short or overdo it", ref: "Nicomachean Ethics II.6 (excess and deficiency)" },
  { id: "puzzle", label: "Puzzles", line: "The problem your life keeps working on", ref: "Metaphysics III.1 (aporia)" },
  { id: "unfair-advantage", label: "Unfair advantages", line: "What you have that others cannot easily get", ref: "Nicomachean Ethics I.8 (external goods as instruments)" },
  { id: "constraint", label: "Constraints", line: "What limits what you can do now: time, money, place, duties", ref: "Nicomachean Ethics III.3 (we deliberate about what is in our power)" },
] as const;
export type AttributeKind = (typeof ATTRIBUTE_KINDS)[number]["id"];
export const ATTRIBUTE_KIND_IDS: readonly AttributeKind[] = ATTRIBUTE_KINDS.map((k) => k.id);
export const isAttributeKind = (v: unknown): v is AttributeKind => (ATTRIBUTE_KIND_IDS as readonly unknown[]).includes(v);
export const CONFIDENCES = ["low", "medium", "high"] as const;
export type Confidence = (typeof CONFIDENCES)[number];

/** One attribute: its kind and text, its dates and source; evidence and confidence when an assistant proposed it. */
export type Attribute = {
  kind: AttributeKind;
  text: string;
  validFrom: IsoDate;
  validTo: IsoDate | null;
  recordedAt: IsoDate;
  source: Source;
  status: "proposed" | "confirmed";
  evidence?: string;
  confidence?: Confidence;
};

export type PersonState = {
  facts: readonly Fact[];
  relationships: readonly Relationship[];
  holds: readonly Hold[];
  attributes: readonly Attribute[];
};

export const EMPTY_PERSON: PersonState = { facts: [], relationships: [], holds: [], attributes: [] };

/** The person states an attribute in their own words: confirmed at once. An identical open one is kept, not doubled. */
export function stateAttribute(p: PersonState, kind: AttributeKind, text: string, at: IsoDate): PersonState {
  const t = text.trim();
  if (!t) throw new Error("say it in your own words");
  if (p.attributes.some((a) => a.kind === kind && a.text === t && a.validTo === null && a.status === "confirmed")) return p;
  return { ...p, attributes: [...p.attributes, { kind, text: t, validFrom: at, validTo: null, recordedAt: at, source: STATED, status: "confirmed" }] };
}

/** Add proposed attributes (from an import or a conversation), leaving out any whose kind and text are already open. */
export function proposeAttributes(p: PersonState, list: readonly Attribute[]): { person: PersonState; added: number } {
  const open = new Set(p.attributes.filter((a) => a.validTo === null).map((a) => `${a.kind}\u0000${a.text}`));
  const fresh = list.filter((a) => !open.has(`${a.kind}\u0000${a.text}`) && (open.add(`${a.kind}\u0000${a.text}`), true));
  return { person: { ...p, attributes: [...p.attributes, ...fresh] }, added: fresh.length };
}

/** The person confirms a proposed attribute (by its place in the list); its source stays what it was. */
export function confirmAttribute(p: PersonState, index: number): PersonState {
  const a = p.attributes[index];
  if (!a) throw new Error(`no attribute ${index + 1}`);
  if (a.validTo !== null) throw new Error("that attribute no longer holds");
  return { ...p, attributes: p.attributes.map((x, i) => (i === index ? { ...x, status: "confirmed", source: confirmSource(x.source) } : x)) };
}

/** The person says an attribute no longer holds (or was never theirs): it is closed, never deleted. */
export function closeAttribute(p: PersonState, index: number, at: IsoDate): PersonState {
  const a = p.attributes[index];
  if (!a) throw new Error(`no attribute ${index + 1}`);
  if (a.validTo !== null) throw new Error("that attribute is already closed");
  return { ...p, attributes: p.attributes.map((x, i) => (i === index ? { ...x, validTo: at } : x)) };
}

/** The attributes that hold now and the person has confirmed, of one kind or all. */
export const currentAttributes = (p: PersonState, kind?: AttributeKind): Attribute[] =>
  p.attributes.filter((a) => a.validTo === null && a.status === "confirmed" && (!kind || a.kind === kind));

export function stateHold(p: PersonState, subject: string, value: string, at: IsoDate): PersonState {
  const holds = p.holds.map((h) => (h.subject === subject && h.validTo === null ? { ...h, validTo: at } : h));
  return { ...p, holds: [...holds, { subject, value, validFrom: at, validTo: null, source: STATED }] };
}

export function isoDate(text: string): IsoDate | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return null;
  const d = new Date(`${text}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === text ? (text as IsoDate) : null;
}

/** A stated fact closes the open value for its key; nothing is overwritten. */
export function stateFact(p: PersonState, key: string, value: string, at: IsoDate): PersonState {
  const facts = p.facts.map((f) =>
    f.key === key && f.status === "confirmed" && f.validTo === null ? { ...f, validTo: at } : f,
  );
  const fact: Fact = { key, value, validFrom: at, validTo: null, recordedAt: at, source: STATED, status: "confirmed" };
  return { ...p, facts: [...facts, fact] };
}

export function stateRelationship(p: PersonState, name: string, kind: Relationship["kind"], at: IsoDate): PersonState {
  const relationships = p.relationships.map((r) => (r.kind === kind && r.validTo === null ? { ...r, validTo: at } : r));
  const rel: Relationship = { name, kind, validFrom: at, validTo: null, recordedAt: at, source: STATED };
  return { ...p, relationships: [...relationships, rel] };
}

export function currentFact(p: PersonState, key: string): string | null {
  const live = p.facts.filter((f) => f.key === key && f.status === "confirmed" && f.validTo === null);
  return live.at(-1)?.value ?? null;
}

export function currentRelationship(p: PersonState, kind: Relationship["kind"]): string | null {
  return p.relationships.filter((r) => r.kind === kind && r.validTo === null).at(-1)?.name ?? null;
}

const RELATIONSHIP_KINDS: readonly Relationship["kind"][] = ["closest_friend"];
const str = (v: unknown): string | null => (typeof v === "string" ? v : null);
const day = (v: unknown): IsoDate | null => (typeof v === "string" ? isoDate(v) : null);
const list = (v: unknown): Record<string, unknown>[] => (Array.isArray(v) ? v.filter((x): x is Record<string, unknown> => typeof x === "object" && x !== null && !Array.isArray(x)) : []);

/**
 * A stored person record, older shapes included, as a PersonState. A value with no source was stated; a fact's old
 * `fromJournal` source is journal, with the fact's status. A fact's status is its source's when it has none: stated
 * is confirmed and every other source proposed. Entries that cannot be read (a missing key, a bad day) are left out.
 */
export function readPersonState(raw: unknown): PersonState {
  const o = typeof raw === "object" && raw !== null && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  const facts: Fact[] = [];
  for (const f of list(o.facts)) {
    const key = str(f.key), value = str(f.value), validFrom = day(f.validFrom), recordedAt = day(f.recordedAt) ?? validFrom;
    const given: SourceStatus | undefined = f.status === "proposed" || f.status === "confirmed" ? f.status : undefined;
    const source = readValueSource(f.source, given);
    if (key === null || value === null || !validFrom || !recordedAt || !source) continue;
    const status = given ?? (source.kind === "stated" ? "confirmed" : source.status);
    facts.push({ key, value, validFrom, validTo: day(f.validTo), recordedAt, source, status });
  }
  const relationships: Relationship[] = [];
  for (const r of list(o.relationships)) {
    const name = str(r.name), validFrom = day(r.validFrom), recordedAt = day(r.recordedAt) ?? validFrom, source = readValueSource(r.source);
    const kind = RELATIONSHIP_KINDS.find((k) => k === r.kind);
    if (name === null || !kind || !validFrom || !recordedAt || !source) continue;
    relationships.push({ name, kind, validFrom, validTo: day(r.validTo), recordedAt, source });
  }
  const holds: Hold[] = [];
  for (const h of list(o.holds)) {
    const subject = str(h.subject), value = str(h.value), validFrom = day(h.validFrom), source = readValueSource(h.source);
    if (subject === null || value === null || !validFrom || !source) continue;
    holds.push({ subject, value, validFrom, validTo: day(h.validTo), source });
  }
  const attributes: Attribute[] = [];
  for (const a of list(o.attributes)) {
    const kind = isAttributeKind(a.kind) ? a.kind : null, text = str(a.text), validFrom = day(a.validFrom), recordedAt = day(a.recordedAt) ?? validFrom;
    const given: SourceStatus | undefined = a.status === "proposed" || a.status === "confirmed" ? a.status : undefined;
    const source = readValueSource(a.source, given);
    if (!kind || text === null || !validFrom || !recordedAt || !source) continue;
    const status = given ?? (source.kind === "stated" ? "confirmed" : source.status);
    const evidence = str(a.evidence), confidence = CONFIDENCES.find((c) => c === a.confidence);
    attributes.push({ kind, text, validFrom, validTo: day(a.validTo), recordedAt, source, status, ...(evidence ? { evidence } : {}), ...(confidence ? { confidence } : {}) });
  }
  return { facts, relationships, holds, attributes };
}
