// A person's works sorted by their end (Torian, 2026-11-20 04:32Z and 04:35Z, in the founder scholarship thread:
// the personal site fetches from Reflect and follows Making, Knowing and Doing). Each work is sorted by what it is
// for (Nicomachean Ethics VI.4; Metaphysics VI.1): Making (poiesis) has a product as its end, Doing (praxis) the
// action itself, Knowing (theoria) truth. Research goes under Knowing. Writing is split by its end: an essay or a story
// meant to move a reader is Making (section writing); a paper meant to establish a finding is Knowing (section
// research). Projects is a section of Making.
//
// In a vault a work is one record, `<end>/<id>.json` (making/, knowing/ or doing/), so the folder says its end and
// moving the file moves the work. The record says its section, summary, the problem it addresses, that problem's root
// cause and the proposed solution (one sentence each), where it shows (sources: GitHub, Etsy, Behance,
// Substack, the reading list, the calendar), its status, and how much of it may be shown (disclosure). What goes out is
// published/works.json (./published.ts), through the presentation gate: a public work in full, a foreshadowed work as
// its end, section and one line only (no id, no title, no source), and a private work never. Pure: no I/O.
// The schemas are packages/core/schemas/work-record.schema.json and published-works.schema.json.
import recordSchema from "../schemas/work-record.schema.json" with { type: "json" };
import { schemaProblems, type Schema } from "./schema-check.ts";

export const ENDS = [
  { id: "making", label: "Making", line: "A product is the end: code, products, art, things sold, finished texts" },
  { id: "knowing", label: "Knowing", line: "Truth is the end: research, study, reading" },
  { id: "doing", label: "Doing", line: "The action itself is the end: service, care, civic work, talks, events" },
] as const;
export type End = (typeof ENDS)[number]["id"];
export const END_IDS: readonly End[] = ENDS.map((e) => e.id);
export const isEnd = (v: unknown): v is End => (END_IDS as readonly unknown[]).includes(v);

/** The sections of each end, a closed list. A section belongs to exactly one end. */
export const SECTIONS = {
  projects: "making",
  products: "making",
  writing: "making",
  art: "making",
  crafts: "making",
  research: "knowing",
  study: "knowing",
  reading: "knowing",
  service: "doing",
  care: "doing",
  civic: "doing",
  talks: "doing",
  events: "doing",
} as const satisfies Record<string, End>;
export type Section = keyof typeof SECTIONS;
export const SECTION_IDS = Object.keys(SECTIONS) as Section[];
export const sectionsOf = (end: End): Section[] => SECTION_IDS.filter((s) => SECTIONS[s] === end);

/**
 * What kind of thing a work is, as a schema.org type (Torian, 2026-11-20 22:03Z). A closed list: the CreativeWork
 * types a person's works fall under, Product for things sold, and Action and Event for doing, whose end is the act
 * itself, so neither standard counts it as a work. LCGFT (the Library of Congress Genre/Form Terms) gives the finer
 * `genre`, as the journal's kinds already do (./works.ts).
 */
export const WORK_TYPES = [
  "CreativeWork", "Article", "BlogPosting", "Book", "Thesis", "ScholarlyArticle", "Report", "Dataset",
  "SoftwareSourceCode", "SoftwareApplication", "WebSite", "VisualArtwork", "Photograph", "MusicComposition",
  "MusicRecording", "VideoObject", "PodcastSeries", "Course", "LearningResource", "PresentationDigitalDocument",
  "Message", "Product", "Action", "Event",
] as const;
export type WorkType = (typeof WORK_TYPES)[number];
/** The types whose end is the act itself: a doing section takes only these, and the other ends never take them. */
export const ACT_TYPES: readonly WorkType[] = ["Action", "Event"];
/** A section's type when its work names none. */
export const SECTION_TYPES: Record<Section, WorkType> = {
  projects: "CreativeWork",
  products: "Product",
  writing: "Article",
  art: "VisualArtwork",
  crafts: "VisualArtwork",
  research: "ScholarlyArticle",
  study: "Course",
  reading: "Book",
  service: "Action",
  care: "Action",
  civic: "Action",
  talks: "Event",
  events: "Event",
};
/** A work's schema.org type: its own, else its section's. */
export const typeOf = (r: Pick<WorkRecord, "section" | "type">): WorkType => r.type ?? SECTION_TYPES[r.section];

/** How a work stands, from its sources' evidence where a source gives it (the site's own status words). */
export const STATUSES = ["active", "quiet", "dormant", "archived"] as const;
export type Status = (typeof STATUSES)[number];

/** How much of a work may be shown: in full, as one line, or not at all. */
export const DISCLOSURES = ["public", "foreshadow", "private"] as const;
export type Disclosure = (typeof DISCLOSURES)[number];

export type WorkSource = { connector: string; url: string };
export type WorkLink = { label: string; href: string };

/** A work as the vault keeps it, at `<end>/<id>.json`. */
export type WorkRecord = {
  title: string;
  section: Section;
  disclosure: Disclosure;
  summary?: string;
  /** Its schema.org type (`WORK_TYPES`); when missing, its section's (`SECTION_TYPES`). */
  type?: WorkType;
  /** Its genre or form, as an LCGFT term such as "Essays" or "Computer programs". */
  genre?: string;
  /** The problem the work addresses, in one sentence. */
  problem?: string;
  /** The problem's root cause, in one sentence. */
  cause?: string;
  /** The proposed solution, in one sentence. */
  solution?: string;
  sources?: WorkSource[];
  status?: Status;
  last_activity?: string;
  foreshadow?: string;
  pinned?: boolean;
  links?: WorkLink[];
};

/** One work in published/works.json. */
export type PublishedWork =
  | ({ disclosure: "public"; id: string; title: string; end: End; section: Section; type: WorkType } & Pick<WorkRecord, "genre" | "summary" | "problem" | "cause" | "solution" | "sources" | "status" | "last_activity" | "pinned" | "links">)
  | { disclosure: "foreshadow"; end: End; section: Section; foreshadow: string };

export const RECORD_SCHEMA = recordSchema as unknown as Schema;
export const WORK_ID = /^[a-z0-9](?:[a-z0-9-]{0,58}[a-z0-9])?$/;
const WORK_PATH = /^(making|knowing|doing)\/([a-z0-9](?:[a-z0-9-]{0,58}[a-z0-9])?)\.json$/;

/** A work's record path in the vault. */
export const workPath = (end: End, id: string): string => `${end}/${id}.json`;
/** The end and id of a work's record path, or null when it is not one. */
export function workOfPath(path: string): { end: End; id: string } | null {
  const m = WORK_PATH.exec(path);
  return m ? { end: m[1] as End, id: m[2]! } : null;
}

/** The one-sentence fields of a work: its problem, the problem's root cause and the proposed solution. */
export const SENTENCE_FIELDS = ["problem", "cause", "solution"] as const;

/**
 * Whether a text is one sentence, by a simple rule: it ends with `.`, `?` or `!`, and nowhere before that end does one
 * of those marks come before a space and a capital letter (which would start a second sentence). Known limitation: an
 * abbreviation before a capital, as in "e.g. Paris" or "Dr. Smith", reads as two sentences; reword it.
 */
export function isOneSentence(text: string): boolean {
  const t = text.trim();
  if (!/[.?!]["')\]]*$/.test(t)) return false;
  return !/[.?!]["')\]]*\s+["'(]*[A-Z]/.test(t);
}

/** What is wrong with a work record: its schema, and a section of another end than its folder's. */
export function workRecordProblems(end: End, raw: unknown, at = "work"): string[] {
  const out = schemaProblems(RECORD_SCHEMA, raw, at);
  if (out.length) return out;
  const r = raw as WorkRecord;
  if (SECTIONS[r.section] !== end) out.push(`${at}: ${r.section} is a section of ${SECTIONS[r.section]}, not ${end}; move the file to ${SECTIONS[r.section]}/`);
  if (r.disclosure === "foreshadow" && !r.foreshadow?.trim()) out.push(`${at}: a foreshadowed work needs its one line (foreshadow)`);
  for (const f of SENTENCE_FIELDS) {
    const v = r[f];
    if (v !== undefined && !isOneSentence(v)) out.push(`${at}: ${f} must be one sentence, ending with ".", "?" or "!"`);
  }
  if (r.type) {
    const act = ACT_TYPES.includes(r.type);
    if (end === "doing" && !act) out.push(`${at}: a doing work is an act, so its type is Action or Event, not ${r.type}`);
    if (end !== "doing" && act) out.push(`${at}: ${r.type} is for doing; a ${end} work is a thing made or known`);
  }
  return out;
}

const ORDER = new Map(END_IDS.map((e, i) => [e, i]));
const SECTION_ORDER = new Map(SECTION_IDS.map((s, i) => [s, i]));

/**
 * What a work shows on the site: a public work in full; a foreshadowed one as its end, section and line only, so its
 * name never goes out; a private one never (null).
 */
export function shownWork(end: End, id: string, r: WorkRecord): PublishedWork | null {
  if (r.disclosure === "private") return null;
  if (r.disclosure === "foreshadow") return { disclosure: "foreshadow", end, section: r.section, foreshadow: r.foreshadow!.trim() };
  return {
    disclosure: "public",
    id,
    title: r.title.trim(),
    end,
    section: r.section,
    type: typeOf(r),
    ...(r.genre?.trim() ? { genre: r.genre.trim() } : {}),
    ...(r.summary?.trim() ? { summary: r.summary.trim() } : {}),
    ...(r.problem?.trim() ? { problem: r.problem.trim() } : {}),
    ...(r.cause?.trim() ? { cause: r.cause.trim() } : {}),
    ...(r.solution?.trim() ? { solution: r.solution.trim() } : {}),
    ...(r.sources?.length ? { sources: r.sources } : {}),
    ...(r.status ? { status: r.status } : {}),
    ...(r.last_activity ? { last_activity: r.last_activity } : {}),
    ...(r.pinned ? { pinned: true } : {}),
    ...(r.links?.length ? { links: r.links } : {}),
  };
}

/** A work read from the vault, by its end and id. */
export type VaultWorkRecord = { end: End; id: string; record: WorkRecord };

/** The works that go out, in order: by end (making, knowing, doing), then section, pinned first, then title. */
export function shownWorks(works: readonly VaultWorkRecord[]): PublishedWork[] {
  const key = (w: VaultWorkRecord) => [ORDER.get(w.end)!, SECTION_ORDER.get(w.record.section)!, w.record.pinned ? 0 : 1] as const;
  return [...works]
    .sort((a, b) => {
      const ka = key(a);
      const kb = key(b);
      for (let i = 0; i < ka.length; i++) if (ka[i] !== kb[i]) return ka[i]! - kb[i]!;
      return a.record.title.localeCompare(b.record.title) || a.id.localeCompare(b.id);
    })
    .map((w) => shownWork(w.end, w.id, w.record))
    .filter((w): w is PublishedWork => w !== null);
}
