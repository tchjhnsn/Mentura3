// The person record: facts, relationships and holds, each with its dates and the source of its value. Mirrors
// lean/NTS/Person.lean and thrivesight_core/nts/person.py (now in the NTS repository). Its JSON Schema is
// packages/core/schemas/person.schema.json (./person-schema.ts). A value's source is one of ./value-source.ts's
// kinds; the old `fromJournal` source reads as journal (`readPersonState`).
import { readValueSource, STATED, type SourceStatus, type ValueSource } from "./value-source.ts";

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

export type PersonState = {
  facts: readonly Fact[];
  relationships: readonly Relationship[];
  holds: readonly Hold[];
};

export const EMPTY_PERSON: PersonState = { facts: [], relationships: [], holds: [] };

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
  return { facts, relationships, holds };
}
