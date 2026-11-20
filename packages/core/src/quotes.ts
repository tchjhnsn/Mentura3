// Quotes and their tags (docs/design/REFLECT_QUOTES_2026-11-20.md; Torian, 2026-11-20 05:30Z "claims, instances, or
// these other things are actually just tags on a quote", 05:38Z "Yes, sounds good", 06:51Z "go"). A quote is the
// record: the exact words, who said them, where and when (schema.org Quotation: text, creator, isPartOf,
// dateCreated). Everything else is a tag on it, kept as a W3C Web Annotation (2017): a purpose (tagging, classifying,
// identifying, linking, commenting, assessing), a value from a vocabulary (a SKOS concept scheme) and, when the tag is
// about some of the words, a TextQuoteSelector (exact, prefix, suffix). A claim is one wording that many quotes say
// (schema.org Claim); its appearances are the quotes whose claim tag names it, worked out, never typed in. A few tags
// describe the claim itself (its domain, kind and origins), so they sit on the claim instead of on every quote.
//
// This keeps Reflect on its side of the boundary with NTS (REFLECT_FRAMEWORK_2026-11-19.md): what was said, and what
// the words do there (the illocution, named as Inference Anchoring Theory names it: ./argument-practice.ts), never a
// state of mind. "What you hold" is a view over the person's own quotes, labelled "you said".
//
// Nothing is edited or deleted. A tag is added; a tag is confirmed or withdrawn by a later status tag that names it; a
// quote is withdrawn by a status tag with no object. A tag an assistant adds, and a quote not stated by the person,
// count only once the person confirms them (the rule ./value-source.ts sets for every value). In a vault a quote is
// `quotes/<id>.json` and a claim `claims/<id>.json`, each holding its tags. Pure: no I/O.
import quoteSchema from "../schemas/quote.schema.json" with { type: "json" };
import claimSchema from "../schemas/claim.schema.json" with { type: "json" };
import { ACTS, RELATIONS } from "./argument-practice.ts";
import { BELIEF_KINDS, DOMAINS } from "./book.ts";
import { ORIGINS } from "./origins.ts";
import { schemaProblems, type Schema } from "./schema-check.ts";
import { SOURCE_KIND_IDS, type SourceKind } from "./value-source.ts";

/** Where a quote was said or written. `reflect` is inside Reflect itself, such as a stance given on a claim's page. */
export const QUOTE_SOURCE_KINDS = [
  { id: "journal", label: "Journal" },
  { id: "conversation", label: "Conversation with an AI" },
  { id: "book", label: "Book" },
  { id: "talk", label: "Talk or speech" },
  { id: "post", label: "Post" },
  { id: "letter", label: "Letter" },
  { id: "reflect", label: "Said in Reflect" },
  { id: "other", label: "Other" },
] as const;
export type QuoteSourceKind = (typeof QUOTE_SOURCE_KINDS)[number]["id"];

/** One concept of a vocabulary, as SKOS keeps it: an id, a preferred label, a definition and where it comes from. */
export type Concept = { id: string; label: string; definition: string };
export type Scheme = { id: SchemeId; label: string; source: string; purpose: Purpose; on: readonly ("quote" | "claim")[]; concepts: readonly Concept[] | "claim" | "text" | "subject"; object?: "required" | "optional" | "never" };

/** The Web Annotation motivations a tag can have. */
export const PURPOSES = ["tagging", "classifying", "identifying", "linking", "commenting", "assessing"] as const;
export type Purpose = (typeof PURPOSES)[number];

export const SCHEME_IDS = ["act", "claim", "relation", "subject", "domain", "kind", "origin", "note", "status"] as const;
export type SchemeId = (typeof SCHEME_IDS)[number];

const concepts = <T extends { id: string }>(list: readonly T[], label: (x: T) => string, definition: (x: T) => string): Concept[] => list.map((x) => ({ id: x.id, label: label(x), definition: definition(x) }));

/** The vocabularies, each a SKOS concept scheme, and what a tag from it may sit on. */
export const SCHEMES: readonly Scheme[] = [
  { id: "act", label: "What the words do", source: "Inference Anchoring Theory (Budzynska, Reed and others); retracting from Walton and Krabbe 1995", purpose: "classifying", on: ["quote"], concepts: concepts(ACTS, (a) => a.label, (a) => a.means), object: "never" },
  { id: "claim", label: "What is said", source: "schema.org Claim", purpose: "identifying", on: ["quote"], concepts: "claim", object: "never" },
  { id: "relation", label: "How it bears on another", source: "Argument Interchange Format; Prakken 2010", purpose: "linking", on: ["quote"], concepts: concepts(RELATIONS.filter((r) => r.id !== "neither"), (r) => r.label, (r) => r.means), object: "required" },
  { id: "subject", label: "Subject", source: "the person's Learn subjects", purpose: "tagging", on: ["quote", "claim"], concepts: "subject", object: "never" },
  { id: "domain", label: "Domain", source: "the Ventures of a Lifetime chart", purpose: "classifying", on: ["claim"], concepts: concepts(DOMAINS, (d) => d.title, (d) => d.about), object: "never" },
  { id: "kind", label: "Ideal or practical", source: "Nicomachean Ethics III.2-4, VI.1; Politics IV.1", purpose: "classifying", on: ["claim"], concepts: concepts(BELIEF_KINDS, (k) => k.label, (k) => k.about), object: "optional" },
  { id: "origin", label: "Where it comes from", source: "Rhetoric I.10", purpose: "classifying", on: ["claim"], concepts: concepts(ORIGINS, (o) => o.label, (o) => (o.from === "me" ? `${o.label}: from the person` : `${o.label}: not from the person`)), object: "never" },
  { id: "note", label: "Note", source: "W3C Web Annotation, commenting", purpose: "commenting", on: ["quote", "claim"], concepts: "text", object: "never" },
  {
    id: "status",
    label: "Confirmed or withdrawn",
    source: "Reflect (value-source.ts)",
    purpose: "assessing",
    on: ["quote", "claim"],
    concepts: [
      { id: "confirmed", label: "Confirmed", definition: "The person confirms the quote, or the tag it names, as theirs." },
      { id: "withdrawn", label: "Withdrawn", definition: "The quote, or the tag it names, no longer counts. Kept, never deleted." },
    ],
    object: "optional",
  },
];
export const schemeOf = (id: string): Scheme | undefined => SCHEMES.find((s) => s.id === id);

export type TextQuoteSelector = { type: "TextQuoteSelector"; exact: string; prefix?: string; suffix?: string };
export type TagCreator = "person" | "assistant";

/** One tag, a Web Annotation whose target is the quote or claim that holds it. */
export type Tag = {
  id: string;
  purpose: Purpose;
  scheme: SchemeId;
  value: string;
  /** The quote or claim it points at (relation), the ideal a practical claim serves (kind), or the tag it confirms or withdraws (status). */
  object?: string;
  selector?: TextQuoteSelector;
  created: string;
  creator: TagCreator;
};

export type Speaker = { self: true } | { name: string; person?: string };
export type QuoteSource = { kind: QuoteSourceKind; ref?: string; title?: string; locator?: string };

/** A quote as the vault keeps it, at `quotes/<id>.json`. */
export type QuoteRecord = {
  text: string;
  speaker: Speaker;
  source: QuoteSource;
  said_at?: string;
  recorded_at: string;
  /** How it came into Reflect (./value-source.ts): anything but stated is proposed until the person confirms it. */
  recorded_by: SourceKind;
  tags: Tag[];
};

/** A claim as the vault keeps it, at `claims/<id>.json`: one wording, and the tags about the claim itself. */
export type ClaimRecord = { text: string; created: string; tags: Tag[] };

export const QUOTE_SCHEMA = quoteSchema as unknown as Schema;
export const CLAIM_SCHEMA = claimSchema as unknown as Schema;
export const RECORD_ID = /^[a-z0-9](?:[a-z0-9-]{0,78}[a-z0-9])?$/;
export const TAG_ID = /^t[0-9]{1,4}$/;
export const QUOTES_DIR = "quotes";
export const CLAIMS_DIR = "claims";
export const quotePath = (id: string) => `${QUOTES_DIR}/${id}.json`;
export const claimPath = (id: string) => `${CLAIMS_DIR}/${id}.json`;

/** The id of a quote or claim from its path, or null when the path is not one. */
export function recordOfPath(path: string): { dir: "quotes" | "claims"; id: string } | null {
  const m = /^(quotes|claims)\/([a-z0-9](?:[a-z0-9-]{0,78}[a-z0-9])?)\.json$/.exec(path);
  return m ? { dir: m[1] as "quotes" | "claims", id: m[2]! } : null;
}

/** What is wrong with the tags of one quote or claim: schemes, values, objects and the order of status tags. */
function tagProblems(on: "quote" | "claim", tags: readonly Tag[], at: string, known?: Known): string[] {
  const out: string[] = [];
  const seen = new Map<string, Tag>();
  for (const t of tags) {
    const where = `${at}: tag ${t.id}`;
    if (seen.has(t.id)) out.push(`${where} is used twice`);
    const s = schemeOf(t.scheme)!;
    if (!s.on.includes(on)) out.push(`${where}: ${/^[aeiou]/.test(t.scheme) ? "an" : "a"} ${t.scheme} tag goes on a ${s.on.join(" or ")}, not a ${on}`);
    if (t.purpose !== s.purpose) out.push(`${where}: a ${t.scheme} tag's purpose is ${s.purpose}`);
    if (Array.isArray(s.concepts) && !s.concepts.some((c) => c.id === t.value)) out.push(`${where}: ${t.value} is not in ${t.scheme} (${s.concepts.map((c) => c.id).join(", ")})`);
    if (s.concepts === "claim" && !RECORD_ID.test(t.value)) out.push(`${where}: a claim tag's value is a claim's id`);
    if (s.concepts === "claim" && known && !known.claims.has(t.value)) out.push(`${where}: no claim ${t.value} in claims/`);
    if (s.object === "required" && !t.object) out.push(`${where}: a ${t.scheme} tag names what it points at (object)`);
    if (s.object === "never" && t.object) out.push(`${where}: a ${t.scheme} tag points at nothing`);
    if (t.scheme === "kind" && t.value === "practical" && !t.object) out.push(`${where}: a practical claim names the ideal it serves (object)`);
    if (t.scheme === "kind" && t.value === "ideal" && t.object) out.push(`${where}: an ideal serves nothing`);
    if (t.scheme === "kind" && t.object && known && !known.claims.has(t.object)) out.push(`${where}: no claim ${t.object} in claims/`);
    if (t.scheme === "relation" && t.object && known && !known.claims.has(t.object) && !known.quotes.has(t.object)) out.push(`${where}: no quote or claim ${t.object}`);
    if (t.scheme === "status") {
      if (t.creator !== "person") out.push(`${where}: only the person confirms or withdraws`);
      if (t.object) {
        const named = seen.get(t.object);
        if (!named) out.push(`${where} names ${t.object}, which is not an earlier tag here`);
        else if (named.scheme === "status") out.push(`${where} names another status tag`);
      }
    }
    if (t.selector && !t.selector.exact) out.push(`${where}: a selector names the exact words`);
    seen.set(t.id, t);
  }
  return out;
}

/** The ids a cross-file check knows: every quote and claim in the vault. */
export type Known = { quotes: ReadonlySet<string>; claims: ReadonlySet<string> };

/** What is wrong with a quote record: its schema, its selectors' words and its tags. */
export function quoteProblems(raw: unknown, at = "quote", known?: Known): string[] {
  const out = schemaProblems(QUOTE_SCHEMA, raw, at);
  if (out.length) return out;
  const q = raw as QuoteRecord;
  for (const t of q.tags) if (t.selector && !q.text.includes(t.selector.exact)) out.push(`${at}: tag ${t.id}'s selector "${t.selector.exact}" is not in the quote's words`);
  if (q.speaker && "self" in q.speaker && q.source.kind === "book") out.push(`${at}: a quote from a book names its author as the speaker, not the person`);
  return [...out, ...tagProblems("quote", q.tags, at, known)];
}

/** What is wrong with a claim record: its schema and its tags. */
export function claimProblems(raw: unknown, at = "claim", known?: Known): string[] {
  const out = schemaProblems(CLAIM_SCHEMA, raw, at);
  if (out.length) return out;
  const c = raw as ClaimRecord;
  return [...out, ...tagProblems("claim", c.tags, at, known)];
}

const nextTagId = (tags: readonly Tag[]) => `t${tags.reduce((n, t) => Math.max(n, Number(t.id.slice(1))), 0) + 1}`;

/** What a new tag says; its id, purpose and time are filled in. */
export type NewTag = { scheme: SchemeId; value: string; object?: string; selector?: Omit<TextQuoteSelector, "type">; creator?: TagCreator };

/** A record with one more tag. Pure: the record given is not changed. */
export function addTag<R extends { tags: Tag[] }>(record: R, t: NewTag, now = new Date()): R {
  const s = schemeOf(t.scheme);
  if (!s) throw new Error(`no tag scheme ${t.scheme}; the schemes are ${SCHEME_IDS.join(", ")}`);
  const tag: Tag = {
    id: nextTagId(record.tags),
    purpose: s.purpose,
    scheme: t.scheme,
    value: t.value.trim(),
    ...(t.object ? { object: t.object } : {}),
    ...(t.selector ? { selector: { type: "TextQuoteSelector", ...t.selector } } : {}),
    created: now.toISOString(),
    creator: t.creator ?? "person",
  };
  return { ...record, tags: [...record.tags, tag] };
}

/** A new quote, with no tags yet. */
export function newQuote(f: { text: string; speaker?: Speaker; source: QuoteSource; said_at?: string; recorded_by?: SourceKind }, now = new Date()): QuoteRecord {
  const text = f.text.trim();
  if (!text) throw new Error("a quote needs its words");
  if (f.recorded_by && !SOURCE_KIND_IDS.includes(f.recorded_by)) throw new Error(`recorded_by is one of ${SOURCE_KIND_IDS.join(", ")}`);
  return { text, speaker: f.speaker ?? { self: true }, source: f.source, ...(f.said_at ? { said_at: f.said_at } : {}), recorded_at: now.toISOString(), recorded_by: f.recorded_by ?? "stated", tags: [] };
}

/** A new id for a quote said on a day: `<day>-<n>`, the first n not taken. */
export function newQuoteId(day: string, taken: ReadonlySet<string>): string {
  for (let n = 1; ; n++) if (!taken.has(`${day}-${n}`)) return `${day}-${n}`;
}

/** A new id for a claim from its wording: lowercase words joined by hyphens, numbered when taken. */
export function newClaimId(text: string, taken: ReadonlySet<string>): string {
  const base =
    text
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60)
      .replace(/-+$/, "") || "claim";
  if (!taken.has(base)) return base;
  for (let n = 2; ; n++) if (!taken.has(`${base}-${n}`)) return `${base}-${n}`;
}

export type TagStatus = "proposed" | "confirmed";

/** Whether a quote counts: confirmed, proposed, or withdrawn by the person. */
export function quoteStatus(q: QuoteRecord): TagStatus | "withdrawn" {
  const own = q.tags.filter((t) => t.scheme === "status" && !t.object);
  const last = own.at(-1);
  if (last) return last.value === "withdrawn" ? "withdrawn" : "confirmed";
  return q.recorded_by === "stated" ? "confirmed" : "proposed";
}

/** The tags that count now, each with its status: status tags applied, withdrawn tags left out. */
export function liveTags(record: { tags: readonly Tag[] }): (Tag & { status: TagStatus })[] {
  const verdict = new Map<string, string>();
  for (const t of record.tags) if (t.scheme === "status" && t.object) verdict.set(t.object, t.value);
  return record.tags
    .filter((t) => t.scheme !== "status" && verdict.get(t.id) !== "withdrawn")
    .map((t) => ({ ...t, status: t.creator === "person" || verdict.get(t.id) === "confirmed" ? ("confirmed" as const) : ("proposed" as const) }));
}

/** How the view shows the person's latest act on a claim (SEP, "Belief"; Friedman 2013 on suspension). */
export const SAID_AS = [
  { id: "said-so", label: "You said so", acts: ["asserting", "agreeing", "assertive-questioning", "rhetorical-questioning", "restating"], attitude: "belief" },
  { id: "said-not", label: "You said not", acts: ["disagreeing"], attitude: "disbelief" },
  { id: "asked", label: "You asked", acts: ["pure-questioning", "challenging"], attitude: "suspension" },
  { id: "took-back", label: "You took it back", acts: ["retracting"], attitude: null },
] as const;
export type SaidAs = (typeof SAID_AS)[number]["id"];
export const saidAsOf = (act: string): SaidAs | null => SAID_AS.find((s) => (s.acts as readonly string[]).includes(act))?.id ?? null;

/** A quote read from the vault, by its id. */
export type VaultQuote = { id: string; record: QuoteRecord };
export type VaultClaim = { id: string; record: ClaimRecord };

export type Saying = { quote: string; when: string; text: string; act: string | null; said: SaidAs | null; source: QuoteSource };
export type ClaimView = {
  claim: string;
  text: string;
  /** The person's own confirmed quotes that say it, oldest first. */
  mine: Saying[];
  /** The latest of them with an act that the view can show, or null when there is none. */
  now: Saying | null;
  /** Others' confirmed quotes that say it: who else says so. */
  others: (Saying & { speaker: string })[];
};

const when = (q: QuoteRecord) => q.said_at ?? q.recorded_at.slice(0, 10);

/**
 * What the person has said about a claim, over time. Only confirmed quotes and confirmed tags count; the person's own
 * quotes make "mine", and the latest with an act is "now". The view says what was said, never what is believed.
 */
export function claimView(claimId: string, claim: ClaimRecord, quotes: readonly VaultQuote[]): ClaimView {
  const mine: Saying[] = [];
  const others: (Saying & { speaker: string })[] = [];
  for (const { id, record: q } of quotes) {
    if (quoteStatus(q) !== "confirmed") continue;
    const live = liveTags(q).filter((t) => t.status === "confirmed");
    if (!live.some((t) => t.scheme === "claim" && t.value === claimId)) continue;
    const act = live.filter((t) => t.scheme === "act").at(-1)?.value ?? null;
    const s: Saying = { quote: id, when: when(q), text: q.text, act, said: act ? saidAsOf(act) : null, source: q.source };
    if ("self" in q.speaker) mine.push(s);
    else others.push({ ...s, speaker: q.speaker.name });
  }
  // By the day it was said, then by when it was kept, so two quotes of one day keep their order.
  const at = new Map(quotes.map(({ id, record }) => [id, record.recorded_at]));
  const order = (a: Saying, b: Saying) => a.when.localeCompare(b.when) || (at.get(a.quote) ?? "").localeCompare(at.get(b.quote) ?? "") || a.quote.localeCompare(b.quote);
  mine.sort(order);
  others.sort(order);
  return { claim: claimId, text: claim.text, mine, now: mine.filter((s) => s.said !== null).at(-1) ?? null, others };
}

/** Every quote whose confirmed claim tag names the claim, oldest first: schema.org's appearance, the first its firstAppearance. */
export function appearances(claimId: string, quotes: readonly VaultQuote[]): VaultQuote[] {
  return quotes
    .filter(({ record }) => quoteStatus(record) === "confirmed" && liveTags(record).some((t) => t.status === "confirmed" && t.scheme === "claim" && t.value === claimId))
    .sort((a, b) => when(a.record).localeCompare(when(b.record)) || a.record.recorded_at.localeCompare(b.record.recorded_at) || a.id.localeCompare(b.id));
}

/**
 * What a rewrite of a quote or claim would change that it may not: its words and fields stay, and its tags may only
 * grow, the old ones kept as they were and in order. A correction is a new quote; a wrong tag is withdrawn.
 */
export function appendOnlyProblems(old: QuoteRecord | ClaimRecord, next: QuoteRecord | ClaimRecord, at: string): string[] {
  const { tags: oldTags, ...oldRest } = old;
  const { tags: nextTags, ...nextRest } = next;
  const out: string[] = [];
  if (JSON.stringify(oldRest) !== JSON.stringify(nextRest)) out.push(`${at}: its words and fields never change; keep a new one and withdraw this one`);
  if (nextTags.length < oldTags.length || oldTags.some((t, i) => JSON.stringify(t) !== JSON.stringify(nextTags[i]))) out.push(`${at}: tags are only added; withdraw a tag with a status tag instead`);
  return out;
}
