// Courses drafted in Ask Reflect (@reflect/core/course-drafts), and the passages they are built from. A passage comes
// only from a text Reflect holds: a public-domain book's text, read as the reading page reads it (./passages), or a
// transcript the person pasted for a learn item. Nothing a model writes is kept as a passage: a model names a place
// (a reference), and the words are cut from the held text here. A course is kept as a learn item (medium course) with
// its plan on the item's notes, as the piano course is kept (./instruments): no table of its own.
import { randomUUID } from "node:crypto";
import {
  LIMITS, WORK_ID, cleanRef, clipPassage, madeCourseHref, madeCourseKey, planNotes, readHref, readPlan, refKey,
  type CoursePlan, type CourseUnit, type KeptPassage, type PassageRef, type WorkRef,
} from "@reflect/core/course-drafts";
import { instrumentByUrl, instrumentHref } from "@reflect/core/instruments";
import { courseSite } from "@reflect/core/courses";
import { clock, readTranscript, searchTranscript } from "@reflect/core/media";
import { searchBook } from "@reflect/core/reading";
import { searchBooks, workEntry } from "@reflect/core/openlibrary";
import { openLibrary } from "./browse";
import { heldText, type HeldWork } from "./passages";
import { siteUrl } from "./site";
import type { BookText } from "./texts";
import type { BookOut } from "./learn-store";
import { addItem, addItemNote, getItem, listItems, removeItem, type LearnItem } from "./ways-store";

/** What a work named by a model resolves to: a book in the catalog, or one of the person's learn items. */
export type Resolved = { kind: "book"; book: HeldWork } | { kind: "item"; item: LearnItem };

/** The person's records a lookup reads, read once by the caller. */
export type Records = { books: readonly BookOut[]; items: readonly LearnItem[] };

const shelvedWork = (b: BookOut): HeldWork | null => (b.catalog?.work ? { work: b.catalog.work, title: b.catalog.title, authors: b.catalog.authors } : null);

/**
 * A work named by its Open Library id or words of its title: a book on the person's shelves first, then one of their
 * learn items, then the open library's best match. Null when nothing matches.
 */
export async function resolveWork(r: Records, named: string, opts: { transcriptOnly?: boolean } = {}): Promise<Resolved | null> {
  const want = named.trim();
  if (!want) return null;
  if (WORK_ID.test(want)) {
    const shelved = r.books.map(shelvedWork).find((b) => b?.work === want);
    if (shelved) return { kind: "book", book: shelved };
    const e = await workEntry(want, openLibrary).catch(() => null);
    return e ? { kind: "book", book: { work: e.work, title: e.title, authors: e.authors } } : null;
  }
  const low = want.toLowerCase();
  const book = r.books.find((b) => b.catalog?.work && `${b.title} ${b.catalog.title}`.toLowerCase().includes(low));
  if (book) return { kind: "book", book: shelvedWork(book)! };
  const item = r.items.find((i) => (!opts.transcriptOnly || i.transcript) && i.title.toLowerCase().includes(low));
  if (item) return { kind: "item", item };
  const found = (await searchBooks(want, openLibrary, 3).catch(() => []))[0];
  return found ? { kind: "book", book: { work: found.work, title: found.title, authors: found.authors } } : null;
}

const workRefOf = (r: Resolved): WorkRef =>
  r.kind === "book" ? { kind: "book", work: r.book.work, title: r.book.title, author: r.book.authors[0] ?? "" } : { kind: "item", item: r.item.id, title: r.item.title, by: r.item.by };

/** A book's passage at a paragraph, cut from the held text, with its cite, edition and reading-page link. */
function bookPassage(b: HeldWork, text: BookText, chapter: number, p: number, at = 0, find?: string): KeptPassage | null {
  const para = text.chapters[chapter - 1]?.paragraphs[p];
  if (!para?.trim()) return null;
  const chapterTitle = text.chapters[chapter - 1]?.title ?? "";
  return {
    ref: { kind: "book", work: b.work, chapter, p },
    text: clipPassage(para, at),
    cite: [b.authors[0], b.title, chapterTitle].filter(Boolean).join(", "),
    source: `${text.credit.name} (${text.credit.href})`,
    href: readHref(b.work, chapter, p, find),
  };
}

const transcriptPassage = (i: Pick<LearnItem, "id" | "title" | "by">, part: { at: number; text: string }): KeptPassage => ({
  ref: { kind: "transcript", item: i.id, at: Math.floor(part.at) },
  text: clipPassage(part.text),
  cite: `${[i.by, i.title].filter(Boolean).join(", ")}, at ${clock(part.at)}`,
  source: "The transcript you pasted",
  href: `/schole/items/${i.id}`,
});

/** What the excerpt action gives back: the passages found, or why there are none. Never words not in the held text. */
export type ExcerptResult =
  | { held: false; reason: string }
  | { held: true; work: WorkRef; source: string; chapters: number | null; total: number; passages: KeptPassage[]; reason?: string };

export type ExcerptInput = { work: string; query?: string | undefined; chapter?: number | undefined; paragraph?: number | undefined; at?: number | undefined };

/**
 * A passage from a work Reflect holds: the places a query occurs (at most three), or the passage at a place (a
 * chapter and paragraph in a book, a second in a transcript). A work whose text Reflect does not hold gives nothing.
 */
export async function excerpt(userId: string, r: Records, input: ExcerptInput): Promise<ExcerptResult> {
  const found = await resolveWork(r, input.work, { transcriptOnly: true });
  if (!found) return { held: false, reason: `No work named “${input.work}” was found on the person's shelves or in the open library.` };
  const query = input.query?.trim();
  if (found.kind === "item") {
    const full = found.item.transcript ? await getItem(userId, found.item.id).catch(() => null) : null;
    if (!full?.transcriptText) return { held: false, reason: `Reflect holds no transcript of ${found.item.title}.` };
    const parts = readTranscript(full.transcriptText);
    const base = { held: true as const, work: workRefOf(found), source: "The transcript you pasted", chapters: null };
    if (query) {
      const hits = searchTranscript(parts, query, 3);
      return { ...base, total: hits.length, passages: hits.map((h) => transcriptPassage(found.item, h)), ...(hits.length ? {} : { reason: `“${query}” is not in the transcript.` }) };
    }
    const at = input.at ?? 0;
    const part = [...parts].reverse().find((x) => x.at <= at) ?? parts[0];
    return part ? { ...base, total: 1, passages: [transcriptPassage(found.item, part)] } : { ...base, total: 0, passages: [], reason: "The transcript is empty." };
  }
  const b = found.book;
  const text = await heldText(b);
  if (!text) return { held: false, reason: `Reflect does not hold the text of ${b.title}: it has no free edition Reflect can read.` };
  if (text === "unread") return { held: false, reason: `The text of ${b.title} did not come just now. Say so; do not quote it from memory.` };
  const base = { held: true as const, work: workRefOf(found), source: `${text.credit.name} (${text.credit.href})`, chapters: text.chapters.length };
  if (query) {
    const s = searchBook(text.chapters, query, 3);
    const passages = s.hits.map((h) => bookPassage(b, text, h.chapter, h.p, h.c, query)).filter((x): x is KeptPassage => x !== null);
    return { ...base, total: s.total, passages, ...(passages.length ? {} : { reason: `“${query}” is not in the text of ${b.title}.` }) };
  }
  const chapter = input.chapter ?? 1;
  const p = input.paragraph ?? text.chapters[chapter - 1]?.paragraphs.findIndex((x) => x.trim()) ?? 0;
  const one = bookPassage(b, text, chapter, Math.max(0, p));
  return one ? { ...base, total: 1, passages: [one] } : { ...base, total: 0, passages: [], reason: `${b.title} has ${text.chapters.length} chapters; there is no paragraph ${p} in chapter ${chapter}.` };
}

/** A passage's place checked against the held text, and its words cut from it: null when the text is not held there. */
async function verifyRef(userId: string, r: Records, ref: PassageRef, texts: Map<string, Promise<{ b: HeldWork; text: BookText | null | "unread" } | null>>, find?: string): Promise<KeptPassage | null> {
  if (ref.kind === "transcript") {
    const full = await getItem(userId, ref.item).catch(() => null);
    if (!full?.transcriptText) return null;
    const part = readTranscript(full.transcriptText).find((x) => Math.floor(x.at) === ref.at);
    return part ? transcriptPassage(full, part) : null;
  }
  if (!texts.has(ref.work)) {
    texts.set(ref.work, resolveWork(r, ref.work).then(async (x) => (x?.kind === "book" ? { b: x.book, text: await heldText(x.book) } : null)));
  }
  const got = await texts.get(ref.work)!;
  if (!got?.text || got.text === "unread") return null;
  const para = got.text.chapters[ref.chapter - 1]?.paragraphs[ref.p] ?? "";
  const at = find ? para.toLowerCase().indexOf(find.toLowerCase()) : 0;
  if (find && at < 0) return null;
  return bookPassage(got.b, got.text, ref.chapter, ref.p, at, find);
}

export type DraftUnitInput = { title: string; works: string[]; passages: { ref: unknown; words?: string | undefined }[] };
export type DraftInput = { title: string; goal: string; units: DraftUnitInput[] };
export type DraftResult = { ok: true; href: string; title: string; units: number; passages: number } | { ok: false; errors: string[] };

/**
 * A course built from what Reflect holds. Every work must resolve to a book in the catalog or one of the person's
 * learn items, and every passage to a place in a held text, or nothing is kept and each problem is named.
 */
export async function draftCourse(userId: string, r: Records, input: DraftInput): Promise<DraftResult> {
  const errors: string[] = [];
  const title = input.title.replace(/\s+/g, " ").trim().slice(0, 300);
  const goal = input.goal.replace(/\s+/g, " ").trim().slice(0, 1000);
  if (!title) errors.push("The course needs a title.");
  if (!goal) errors.push("The course needs a goal.");
  if (!input.units.length || input.units.length > LIMITS.units) errors.push(`A course has 1 to ${LIMITS.units} units.`);
  const texts = new Map<string, Promise<{ b: HeldWork; text: BookText | null | "unread" } | null>>();
  const units: CourseUnit[] = [];
  for (const [n, u] of input.units.slice(0, LIMITS.units).entries()) {
    const name = u.title.replace(/\s+/g, " ").trim().slice(0, 200);
    if (!name) errors.push(`Unit ${n + 1} needs a title.`);
    if (u.works.length > LIMITS.works || u.passages.length > LIMITS.passages) errors.push(`Unit ${n + 1} has at most ${LIMITS.works} works and ${LIMITS.passages} passages.`);
    const works: WorkRef[] = [];
    for (const w of u.works.slice(0, LIMITS.works)) {
      const got = await resolveWork(r, w);
      if (got) works.push(workRefOf(got));
      else errors.push(`Unit ${n + 1}: “${w}” is not a work Reflect holds or can find in the catalog.`);
    }
    const passages: KeptPassage[] = [];
    const seen = new Set<string>();
    for (const [i, p] of u.passages.slice(0, LIMITS.passages).entries()) {
      const ref = cleanRef(p.ref);
      const kept = ref ? await verifyRef(userId, r, ref, texts, p.words?.trim() || undefined) : null;
      if (!ref || !kept) {
        errors.push(`Unit ${n + 1}, passage ${i + 1}: not a place in a text Reflect holds. Choose passages with the excerpt tool and pass its ref.`);
        continue;
      }
      if (seen.has(refKey(ref))) continue;
      seen.add(refKey(ref));
      passages.push(kept);
      // A passage's work is a work the unit reads.
      const held = ref.kind === "book" ? await texts.get(ref.work) : null;
      const it = ref.kind === "transcript" ? r.items.find((x) => x.id === ref.item) : undefined;
      const pw: WorkRef | null = held ? workRefOf({ kind: "book", book: held.b }) : it ? workRefOf({ kind: "item", item: it }) : null;
      if (pw && !works.some((w) => (w.kind === "book" && pw.kind === "book" ? w.work === pw.work : w.kind === "item" && pw.kind === "item" && w.item === pw.item))) works.push(pw);
    }
    units.push({ title: name, works, passages });
  }
  if (errors.length) return { ok: false, errors };
  const plan: CoursePlan = { goal, units };
  const key = randomUUID();
  const href = madeCourseHref(key);
  const id = await addItem(userId, { medium: "course", way: "teaching", status: "want", title, url: `${siteUrl()}${href}`, parts: units.length });
  try {
    for (const note of planNotes(plan)) await addItemNote(userId, id, { unit: note.unit, note: note.note, ...(note.quote ? { quote: note.quote } : {}) });
  } catch (e) {
    await removeItem(userId, id).catch(() => undefined);
    throw e;
  }
  return { ok: true, href, title, units: units.length, passages: units.reduce((s, u) => s + u.passages.length, 0) };
}

/** A drafted course by its key: its learn item and its plan, or null. */
export async function madeCourseOf(userId: string, key: string): Promise<{ item: LearnItem; plan: CoursePlan } | null> {
  const item = (await listItems(userId)).find((i) => i.medium === "course" && madeCourseKey(i.url) === key);
  const full = item ? await getItem(userId, item.id) : null;
  return item && full ? { item, plan: readPlan(full.notes) } : null;
}

export type CourseRow = { title: string; by: string | null; kind: "drafted" | "instrument" | "lectures" | "kept"; status: string; part: number | null; parts: number | null; href: string };

/** Every course the person keeps: drafted in Ask Reflect, an instrument, lectures from Open Yale or MIT, or one they added. */
export function coursesOf(items: readonly LearnItem[]): CourseRow[] {
  return items.filter((i) => i.medium === "course").map((i) => {
    const key = madeCourseKey(i.url);
    const instrument = key ? undefined : instrumentByUrl(i.url);
    const kind = key ? "drafted" : instrument ? "instrument" : courseSite(i.url) ? "lectures" : "kept";
    return { title: i.title, by: i.by, kind, status: i.status, part: i.part, parts: i.parts, href: key ? madeCourseHref(key) : instrument ? instrumentHref(instrument) : `/schole/items/${i.id}` };
  });
}
