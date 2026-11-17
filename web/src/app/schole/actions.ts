"use server";

import { showFor, transcriptOf } from "@/server/podcasts";
import { keptTranscript } from "@/server/transcript-store";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { BOOK_STATUS, type BookStatus } from "@reflect/core/learning";
import { importGoodreads, type ImportReport } from "@/server/goodreads-import";
import { requireUser } from "@/server/session";
import { keepPlace, type BookPlace } from "@/server/learn-store";
import { importKindle, type KindleReport } from "@/server/kindle-import";
import { publishLesson, publishQuote, unpublishQuote } from "@/server/published-store";
import { addItems, getItem, keepItemPlace, keepUnitPlace } from "@/server/ways-store";
import { mediumOf } from "@reflect/core/ways";
import { lookLink, searchMedium, type Fetch, type Found, type Searched } from "@reflect/core/lookup";
import type { Candidate } from "@reflect/core/item-imports";
import { isHighlightColor } from "@reflect/core/excerpts";
import { definitionsOf, lookupWord, type Definition } from "@reflect/core/wiktionary";
import { lectureOf, lecturesOf } from "@/server/courses";
import { makeQuiz } from "@/server/quiz-maker";
import { checkAnswer, newQuiz, type Quiz } from "@/server/quiz-store";
import { courseHref } from "./courses/shell";
import { fromPage } from "@/server/actions/page";
import { setBookStatusAction as setBookStatusEntry, addItemAction as addItemEntry } from "@/server/actions/learning";
import {
  addItemNoteAction as addItemNoteEntry, addItemSubjectsAction as addItemSubjectsEntry, addSessionAction as addSessionEntry, changeItemAction as changeItemEntry, favoriteEpisodeAction as favoriteEntry,
  followListAction as followListEntry, highlightsToJournal, keepClaimAction as keepClaimEntry, keepExcerpt, keepLibraryBook, keepReasonAction as keepReasonEntry, orderWantAction, removeExcerptAction as removeExcerptEntry,
  removeItemAction as removeItemEntry, removeItemNoteAction as removeItemNoteEntry, removeItemSubjectAction as removeItemSubjectEntry, removeSessionAction as removeSessionEntry, restoreItemAction as restoreItemEntry,
  reviseExcerptAction as reviseExcerptEntry, setBookWayAction as setBookWayEntry, setFinishedAction as setFinishedEntry, setReactionAction, setReadingGoal, setStanceAction as setStanceEntry, setUnitDoneAction as setUnitDoneEntry, takeUpItem,
} from "@/server/actions/learn-page";

// Each change the person makes goes through the action registry (Ask Reflect plan, step 4), so it is in the change
// log and, where it can be taken back, undone. Imports, publishing, lookups, quizzes and the reader's own place are
// not registry entries (web/src/server/actions/page-actions.test.ts says why).

const openLibrary = (url: string) => fetch(url, { headers: { "user-agent": "reflect-app" }, cache: "no-store" });
const status = (v: FormDataEntryValue | null): BookStatus => ((BOOK_STATUS as readonly string[]).includes(String(v)) ? (String(v) as BookStatus) : "want");

/** Put a library book on the person's shelves. The entry comes back from the page, so it is cleaned again. */
export async function addFromLibraryAction(form: FormData): Promise<void> {
  const user = await requireUser();
  let raw: unknown;
  try {
    raw = JSON.parse(String(form.get("entry") ?? ""));
  } catch {
    throw new Error("that library entry could not be read");
  }
  if (!raw || typeof raw !== "object") throw new Error("that library entry could not be read");
  // No revalidation: Learn's pages render fresh on each visit, and refreshing the page the book was added from
  // would reshuffle its lists under the person.
  await fromPage(keepLibraryBook, user.id, { entry: raw as Record<string, unknown>, status: status(form.get("status")) });
}

/** Where the person is with a book: want to read, reading, read. */
export async function setBookStatusAction(form: FormData): Promise<void> {
  const user = await requireUser();
  await fromPage(setBookStatusEntry, user.id, { book_id: String(form.get("book") ?? ""), status: status(form.get("status")) });
  revalidatePath("/schole");
}

/** Keep a claim with who holds it and the person's stance. Holders come one per line: "name | citation". */
export async function keepClaimAction(form: FormData): Promise<void> {
  const user = await requireUser();
  const holders = String(form.get("holders") ?? "")
    .split("\n")
    .map((l) => l.split("|"))
    .map(([name, ...cite]) => ({ name: (name ?? "").trim(), citation: cite.join("|").trim() }))
    .filter((h) => h.name)
    .map((h) => (h.citation ? h : { name: h.name }));
  const subject = String(form.get("subject") ?? "");
  await fromPage(keepClaimEntry, user.id, { text: String(form.get("claim") ?? ""), holders, stance: String(form.get("stance") ?? ""), ...(subject ? { subject } : {}) });
  revalidatePath("/schole");
}

export async function setStanceAction(form: FormData): Promise<void> {
  const user = await requireUser();
  await fromPage(setStanceEntry, user.id, { claim_id: String(form.get("claim") ?? ""), stance: String(form.get("stance") ?? "") });
  revalidatePath("/schole");
}

/** Bring a Goodreads export in: the browser reads the file and sends its text. */
export async function importGoodreadsAction(text: string): Promise<{ error: string } | ImportReport> {
  const user = await requireUser();
  if (new TextEncoder().encode(text).length > 5_000_000) return { error: "That file is larger than 5 MB." };
  try {
    const r = await importGoodreads(user.id, text, openLibrary);
    revalidatePath("/schole");
    return r;
  } catch (e) {
    return { error: (e as Error).message };
  }
}


/** Keep where the person is in a book on their shelves that they are reading in Reflect. Nothing is revalidated: the reader keeps its own place. */
export async function keepPlaceAction(bookId: string, place: BookPlace, day?: string): Promise<void> {
  const user = await requireUser();
  await keepPlace(user.id, bookId, { chapter: Number(place?.chapter), chapters: Number(place?.chapters), at: Number(place?.at) }, typeof day === "string" ? day : undefined);
}

/** Set the day the person finished a read book. */
export async function setFinishedAction(bookId: string, day: string): Promise<void> {
  const user = await requireUser();
  await fromPage(setFinishedEntry, user.id, { book_id: String(bookId), day: String(day) });
  revalidatePath("/schole/reading");
}

/** Order Want to read as the person dragged it. */
export async function rankWantAction(ids: string[]): Promise<void> {
  const user = await requireUser();
  await fromPage(orderWantAction, user.id, { book_ids: Array.isArray(ids) ? ids.map(String) : [] });
  revalidatePath("/schole/reading");
}

/** Set or clear the person's reading goal for a year. */
export async function setGoalAction(year: number, books: number | null): Promise<void> {
  const user = await requireUser();
  await fromPage(setReadingGoal, user.id, { year: Number(year), books: books === null ? null : Number(books) });
  revalidatePath("/schole/reading");
}

/** Keep an excerpt from a book: a highlight in a text read in Reflect, or words typed with a page or place. Returns its id. */
export async function addExcerptAction(e: { work: string; quote: string; anchor?: unknown; place?: string; note?: string; color?: string }): Promise<string> {
  const user = await requireUser();
  const { excerpt_id: id } = await fromPage(keepExcerpt, user.id, { work: String(e?.work ?? ""), quote: String(e?.quote ?? ""), anchor: e?.anchor ?? null, place: e?.place ? String(e.place) : null, note: e?.note ? String(e.note) : null, color: isHighlightColor(e?.color) ? e.color : null });
  revalidatePath(`/schole/works/${String(e.work)}`);
  return id;
}

/** Remove one of the person's excerpts. */
export async function removeExcerptAction(id: string, work: string): Promise<void> {
  const user = await requireUser();
  await fromPage(removeExcerptEntry, user.id, { excerpt_id: String(id) });
  revalidatePath(`/schole/works/${String(work)}`);
}

const wiktionary = (word: string) => fetch(`https://en.wiktionary.org/w/index.php?title=${encodeURIComponent(word)}&action=raw`, { headers: { "user-agent": "reflect-app" }, next: { revalidate: 604800 } });

/**
 * A word looked up while reading, from Wiktionary: its English senses with their labels, the word as written
 * first and then in lower case; a word that is only a form of another ("acknowledged") also brings that word's senses.
 */
export async function defineAction(selection: string): Promise<{ word: string; definitions: Definition[]; lemma?: { word: string; definitions: Definition[] } } | null> {
  await requireUser();
  const word = lookupWord(selection);
  if (!word) return null;
  const look = async (w: string) => {
    const r = await wiktionary(w).catch(() => null);
    return r?.ok ? definitionsOf(await r.text()) : [];
  };
  let found = word;
  let defs = await look(word);
  if (!defs.length && word !== word.toLowerCase()) {
    found = word.toLowerCase();
    defs = await look(found);
  }
  if (!defs.length) return null;
  const forms = defs.flatMap((d) => d.senses).filter((s) => s.formOf).map((s) => s.formOf!);
  const lemma = forms[0] && forms[0] !== found ? { word: forms[0], definitions: await look(forms[0]) } : null;
  return { word: found, definitions: defs, ...(lemma?.definitions.length ? { lemma } : {}) };
}

/** Give an excerpt a new colour or note (an empty note removes it). Returns the excerpt's new id. */
export async function reviseExcerptAction(id: string, work: string, change: { color?: string; note?: string | null }): Promise<string> {
  const user = await requireUser();
  const { excerpt_id: next } = await fromPage(reviseExcerptEntry, user.id, { excerpt_id: String(id), ...(isHighlightColor(change?.color) ? { color: change.color } : {}), ...(change && "note" in change ? { note: change.note == null ? null : String(change.note) } : {}) });
  revalidatePath(`/schole/works/${String(work)}`);
  revalidatePath("/schole/highlights");
  return next;
}

/** Keep a highlight restated in the person's own words as its note, from Learn's Today row. */
export async function restateAction(id: string, work: string, form: FormData): Promise<void> {
  const user = await requireUser();
  const words = String(form.get("words") ?? "").trim();
  if (words) await fromPage(reviseExcerptEntry, user.id, { excerpt_id: String(id), note: words });
  revalidatePath(`/schole/works/${String(work)}`);
  revalidatePath("/schole/highlights");
  redirect("/schole");
}

/** Bring Kindle highlights in: the browser reads My Clippings.txt and sends its text. */
export async function importKindleAction(text: string): Promise<{ error: string } | KindleReport> {
  const user = await requireUser();
  if (new TextEncoder().encode(String(text)).length > 10_000_000) return { error: "That file is larger than 10 MB." };
  try {
    const r = await importKindle(user.id, String(text), openLibrary);
    revalidatePath("/schole/highlights");
    return r;
  } catch (e) {
    return { error: (e as Error).message };
  }
}

/** Put all the person's highlights into their journal as one Markdown work. Returns the work's id. */
export async function highlightsToJournalAction(): Promise<string> {
  const user = await requireUser();
  const { work_id: id } = await fromPage(highlightsToJournal, user.id, {});
  revalidatePath("/journal");
  return id;
}

/** Publish one quote, with its author, book and place, at its own public page. Returns its id. */
export async function publishQuoteAction(q: { quote: string; author: string; title: string; place?: string | null; work?: string | null }): Promise<string> {
  const user = await requireUser();
  const id = await publishQuote(user.id, { quote: String(q?.quote ?? ""), author: String(q?.author ?? ""), title: String(q?.title ?? ""), place: q?.place ? String(q.place) : null, work: q?.work ? String(q.work) : null });
  revalidatePath("/schole/highlights");
  return id;
}

/** Take a published quote down. */
export async function unpublishQuoteAction(id: string): Promise<void> {
  const user = await requireUser();
  await unpublishQuote(user.id, String(id));
  revalidatePath("/schole/highlights");
}

/**
 * Put a list's books that are not on the person's shelves on Want to read, in the list's order, after the books
 * already there. Returns how many were added.
 */
export async function followListAction(id: string): Promise<number> {
  const user = await requireUser();
  const { added } = await fromPage(followListEntry, user.id, { list: String(id), kind: "book" });
  revalidatePath("/schole/reading");
  revalidatePath(`/schole/lists/${String(id)}`);
  return added;
}

const catalog: Fetch = (url) => fetch(url, { headers: { "user-agent": "reflect-app (learn items)" }, next: { revalidate: 86400 }, signal: AbortSignal.timeout(8000) });
const field = (form: FormData, k: string) => String(form.get(k) ?? "");
const has = (form: FormData, k: string) => form.has(k);

/** Reads a pasted link into an item to add (title, maker, picture), from the site's own endpoint. */
export async function lookLinkAction(url: string): Promise<{ found: Found | null; error?: string }> {
  await requireUser();
  return lookLink(url, catalog);
}

/** Searches the free catalog for a medium. */
export async function searchItemsAction(medium: string, q: string): Promise<Searched> {
  await requireUser();
  return searchMedium(medium, q, catalog);
}

/** Keep a lecture, course, article, debate, discussion, podcast, film, music, art or game. */
export async function addItemAction(form: FormData): Promise<void> {
  const user = await requireUser();
  const parts = Number(field(form, "parts"));
  const opt = (k: string) => (field(form, k) ? { [k]: field(form, k) } : {});
  await fromPage(addItemEntry, user.id, {
    medium: field(form, "medium"), title: field(form, "title"), status: (["want", "doing", "done"].includes(field(form, "status")) ? field(form, "status") : "done") as "done",
    ...opt("way"), ...opt("by"), ...opt("url"), ...opt("image"), ...opt("work"), ...opt("lesson"), ...opt("day"),
    ...(field(form, "took_part") === "on" ? { took_part: true } : {}), ...(parts ? { parts } : {}),
  });
  revalidatePath("/schole");
}

/**
 * Adds a find from Browse to Want to, once (an item of the same medium and title already kept is reused); with
 * `go` it is started and its page opened, so it can be done straight away in Reflect.
 */
export async function browseAddAction(form: FormData): Promise<void> {
  const user = await requireUser();
  await addFromForm(user.id, form);
}

/**
 * Keeps what is causing the person to learn a course and for the sake of what, as a work of their journal.
 * With go=start it then starts the course; otherwise it returns to the course.
 */
export async function keepReasonAction(form: FormData): Promise<void> {
  const user = await requireUser();
  const url = field(form, "url");
  const title = field(form, "title");
  await fromPage(keepReasonEntry, user.id, { course_url: url, course_title: title, cause: field(form, "cause"), end: field(form, "end"), origins: form.getAll("origin").map(String), end_kind: field(form, "endKind") });
  revalidatePath("/schole/courses");
  revalidatePath("/journal");
  if (field(form, "go") === "start") await addFromForm(user.id, form);
  redirect(courseHref(url, title));
}

async function addFromForm(userId: string, form: FormData): Promise<void> {
  const go = field(form, "go") === "start";
  const opt = (k: string) => (field(form, k) ? { [k]: field(form, k) } : {});
  const { item_id: id } = await fromPage(takeUpItem, userId, { medium: field(form, "medium"), title: field(form, "title"), ...opt("by"), ...opt("url"), ...opt("image"), ...opt("day"), start: go });
  revalidatePath("/schole");
  revalidatePath("/schole/browse");
  revalidatePath("/schole/find");
  if (go) redirect(`/schole/items/${id}`);
}

/** Keeps the candidates the person picked from an import; returns how many were new. */
export async function importItemsAction(list: Candidate[]): Promise<number> {
  const user = await requireUser();
  const n = await addItems(user.id, list.slice(0, 500));
  revalidatePath("/schole");
  return n;
}

/** Change an item's way (empty follows its medium), status, or add what it taught the person. */
export async function changeItemAction(form: FormData): Promise<void> {
  const user = await requireUser();
  const id = field(form, "item");
  await fromPage(changeItemEntry, user.id, {
    item_id: id,
    ...(has(form, "way") ? { way: field(form, "way") || null } : {}),
    ...(has(form, "status") ? { status: field(form, "status") as "done" } : {}),
    ...(has(form, "lesson") ? { lesson: field(form, "lesson") } : {}),
    ...(field(form, "day") ? { day: field(form, "day") } : {}),
  });
  revalidatePath("/schole");
  revalidatePath(`/schole/items/${id}`);
}

/** Change an item's title, maker, link, picture or the book it adapts. */
export async function editItemAction(form: FormData): Promise<void> {
  const user = await requireUser();
  await fromPage(changeItemEntry, user.id, {
    item_id: field(form, "item"),
    ...(has(form, "title") ? { title: field(form, "title") } : {}),
    ...(has(form, "by") ? { by: field(form, "by") || null } : {}),
    ...(has(form, "url") ? { url: field(form, "url") || null } : {}),
    ...(has(form, "image") ? { image: field(form, "image") || null } : {}),
    ...(has(form, "work") ? { work: field(form, "work") || null } : {}),
  });
  revalidatePath("/schole");
  revalidatePath(`/schole/items/${field(form, "item")}`);
}

/** Remove an item; the page then offers to undo it. */
export async function removeItemAction(form: FormData): Promise<void> {
  const user = await requireUser();
  const id = field(form, "item");
  await fromPage(removeItemEntry, user.id, { item_id: id });
  revalidatePath("/schole");
  redirect(`/schole/shelves?removed=${id}`);
}

export async function restoreItemAction(form: FormData): Promise<void> {
  const user = await requireUser();
  const id = field(form, "item");
  await fromPage(restoreItemEntry, user.id, { item_id: id });
  revalidatePath("/schole");
  redirect(`/schole?item=${id}`);
}

/** Move a book to another way of learning, or back to the way its catalog gives (empty). */
export async function setBookWayAction(form: FormData): Promise<void> {
  const user = await requireUser();
  await fromPage(setBookWayEntry, user.id, { book_id: field(form, "book"), way: field(form, "way") || null });
  revalidatePath("/schole");
}

/** Add a list's items (or one, by title) to Want to, skipping what the person keeps. */
export async function addFromItemListAction(form: FormData): Promise<void> {
  const user = await requireUser();
  const title = field(form, "title");
  const list = field(form, "list");
  await fromPage(followListEntry, user.id, { list, kind: "item", ...(title ? { title } : {}) });
  revalidatePath(`/schole/lists/items/${list}`);
}

const itemPath = (id: string) => `/schole/items/${id}`;
const num = (v: string) => (v.trim() === "" ? null : Number(v));

/** Where the person is in a video or recording, kept as they watch or listen. */
export async function keepItemPlaceAction(id: string, seconds: number, day?: string): Promise<void> {
  const user = await requireUser();
  await keepItemPlace(user.id, id, seconds, day);
}

/** Where the person is in a lecture or episode. */
export async function keepUnitPlaceAction(id: string, unit: string, seconds: number, day?: string): Promise<void> {
  const user = await requireUser();
  await keepUnitPlace(user.id, id, unit, seconds, day);
}

/** A lecture or episode finished, or not; `of` is how many the item has. */
export async function setUnitDoneAction(id: string, unit: string, done: boolean, of: number | null, day?: string): Promise<void> {
  const user = await requireUser();
  await fromPage(setUnitDoneEntry, user.id, { item_id: id, unit, done, of, ...(typeof day === "string" && day ? { day } : {}) });
  revalidatePath(itemPath(id));
}

/** A note at a moment, with words quoted from the transcript if any. */
export async function addItemNoteAction(id: string, n: { at?: number | null; quote?: string; note?: string; unit?: string | null }): Promise<string> {
  const user = await requireUser();
  const { note_id: nid } = await fromPage(addItemNoteEntry, user.id, { item_id: id, ...(n?.at !== undefined ? { at: n.at } : {}), ...(n?.quote ? { quote: String(n.quote) } : {}), ...(n?.note ? { note: String(n.note) } : {}), ...(n?.unit !== undefined ? { unit: n.unit } : {}) });
  revalidatePath(itemPath(id));
  return nid;
}

export async function removeItemNoteAction(id: string, noteId: string): Promise<void> {
  const user = await requireUser();
  await fromPage(removeItemNoteEntry, user.id, { note_id: noteId });
  revalidatePath(itemPath(id));
}

export async function setTranscriptAction(form: FormData): Promise<void> {
  const user = await requireUser();
  const id = field(form, "item");
  await fromPage(changeItemEntry, user.id, { item_id: id, transcript: field(form, "transcript") || null });
  revalidatePath(itemPath(id));
}

export async function setItemDatesAction(form: FormData): Promise<void> {
  const user = await requireUser();
  const id = field(form, "item");
  await fromPage(changeItemEntry, user.id, { item_id: id, started: field(form, "started") || null, finished: field(form, "finished") || null });
  revalidatePath(itemPath(id));
}

/** Took part or only heard it; how far through a course and of how many parts. */
export async function setItemFactsAction(form: FormData): Promise<void> {
  const user = await requireUser();
  const id = field(form, "item");
  const step = field(form, "step");
  await fromPage(changeItemEntry, user.id, {
    item_id: id,
    ...(has(form, "took_part") ? { took_part: field(form, "took_part") === "yes" } : {}),
    ...(has(form, "parts") ? { parts: num(field(form, "parts")) } : {}),
    ...(has(form, "part") ? { part: num(field(form, "part")) } : {}),
    ...(step ? { step: Number(step) } : {}),
  });
  revalidatePath(itemPath(id));
}

/** A practice session: the day, minutes if given, and a note. */
export async function addSessionAction(form: FormData): Promise<void> {
  const user = await requireUser();
  const id = field(form, "item");
  const minutes = num(field(form, "minutes"));
  const on = field(form, "on") || field(form, "day");
  await fromPage(addSessionEntry, user.id, { item_id: id, ...(on ? { day: on } : {}), ...(minutes ? { minutes } : {}), ...(field(form, "note") ? { note: field(form, "note") } : {}) });
  revalidatePath(itemPath(id));
}

export async function removeSessionAction(form: FormData): Promise<void> {
  const user = await requireUser();
  await fromPage(removeSessionEntry, user.id, { session_id: field(form, "session") });
  revalidatePath(itemPath(field(form, "item")));
}

/** Subjects the item is about, comma separated. */
export async function addItemSubjectsAction(form: FormData): Promise<void> {
  const user = await requireUser();
  const id = field(form, "item");
  const subjects = field(form, "subjects").split(",").map((x) => x.trim()).filter(Boolean);
  if (subjects.length) await fromPage(addItemSubjectsEntry, user.id, { item_id: id, subjects });
  revalidatePath(itemPath(id));
}

export async function removeItemSubjectAction(form: FormData): Promise<void> {
  const user = await requireUser();
  const id = field(form, "item");
  await fromPage(removeItemSubjectEntry, user.id, { item_id: id, subject_id: field(form, "subject") });
  revalidatePath(itemPath(id));
}

/** A claim argued in a debate or discussion: its words, who argued it (the sides), and the person's stance. */
export async function keepItemClaimAction(form: FormData): Promise<void> {
  const user = await requireUser();
  const id = field(form, "item");
  const item = await getItem(user.id, id);
  if (!item) throw new Error("no such item");
  // Kept from a passage of a transcript, the citation names the episode or lecture and the moment.
  const citation = (field(form, "cite") || item.title).slice(0, 300);
  const names = field(form, "holders").split("\n").map((l) => l.trim()).filter(Boolean);
  // From a transcript with no one named, the show or lecture itself is the holder, so the citation is kept.
  if (!names.length && field(form, "cite")) names.push(item.by || item.title);
  const holders = names.map((name) => ({ name: name.slice(0, 200), citation }));
  await fromPage(keepClaimEntry, user.id, { text: field(form, "claim"), holders, ...(field(form, "subject") ? { subject: field(form, "subject") } : {}), stance: field(form, "stance"), item_id: id });
  revalidatePath(itemPath(id));
  const back = field(form, "back");
  if (back.startsWith(`${itemPath(id)}/`)) revalidatePath(back);
}

export async function setItemStanceAction(form: FormData): Promise<void> {
  const user = await requireUser();
  await fromPage(setStanceEntry, user.id, { claim_id: field(form, "claim"), stance: field(form, "stance") });
  revalidatePath(itemPath(field(form, "item")));
}

/** Publish the item's latest lesson at its own page, once the person confirms. */
export async function publishLessonAction(id: string): Promise<string> {
  const user = await requireUser();
  const item = await getItem(user.id, id);
  if (!item?.lesson) throw new Error("this item has no lesson to publish");
  return publishLesson(user.id, { lesson: item.lesson, title: item.title, by: item.by, medium: mediumOf(item.medium).label });
}

/** Take a published quote or lesson down, from a form. */
export async function unpublishQuoteFormAction(form: FormData): Promise<void> {
  const user = await requireUser();
  await unpublishQuote(user.id, field(form, "id"));
  if (field(form, "item")) revalidatePath(`/schole/items/${field(form, "item")}`);
}

/** Writes a new quiz from a lecture's transcript for a course the person keeps, and keeps it. */
export async function quizAction(itemId: string, unit: string): Promise<Quiz | { error: string }> {
  const user = await requireUser();
  try {
    const item = await getItem(user.id, itemId);
    if (item?.medium === "podcast") {
      // An episode: its published transcript, else the one made for the person.
      const e = (await showFor(item.url))?.episodes.find((x) => x.key === unit);
      if (!e) return { error: "That episode is not in the show's feed just now." };
      const published = await transcriptOf(e);
      const transcript = published.length ? published : (await keptTranscript(user.id, itemId, unit))?.passages ?? [];
      if (!transcript.length) return { error: "This episode has no transcript to write questions from." };
      return await newQuiz(user.id, itemId, unit, await makeQuiz(e.title, transcript));
    }
    const course = item?.medium === "course" ? await lecturesOf(item.url) : null;
    const ref = course?.lectures.find((l) => String(l.n) === unit);
    if (!course || !ref) return { error: "That lecture is not on your shelves." };
    const lecture = await lectureOf(course.site, ref);
    if (!lecture) return { error: "The lecture did not load just now. Try again in a moment." };
    return await newQuiz(user.id, itemId, unit, await makeQuiz(ref.title, lecture.transcript));
  } catch (e) {
    return { error: e instanceof Error ? e.message : "The quiz could not be written just now." };
  }
}

/** Keeps the person's answer to a quiz question and whether they knew it. */
export async function checkAnswerAction(quizId: string, seq: number, answer: string, knew: boolean): Promise<boolean> {
  const user = await requireUser();
  return checkAnswer(user.id, quizId, seq, answer, knew);
}

/** Marks an episode as a favorite, or takes the mark off (Torian, 2026-11-15 06:46Z). */
export async function favoriteEpisodeAction(itemId: string, unit: string, favorite: boolean): Promise<void> {
  const user = await requireUser();
  await fromPage(favoriteEntry, user.id, { item_id: itemId, unit, favorite });
  revalidatePath(itemPath(itemId));
}

/** Like or Dislike a thing, privately, or take the reaction off (the same button again). */
export async function reactAction(form: FormData): Promise<void> {
  const user = await requireUser();
  const r = field(form, "reaction");
  await fromPage(setReactionAction, user.id, { key: field(form, "key"), reaction: r === "like" || r === "dislike" ? r : "none" });
  const back = field(form, "back");
  if (back.startsWith("/schole/")) revalidatePath(back.split("?")[0]!);
}
