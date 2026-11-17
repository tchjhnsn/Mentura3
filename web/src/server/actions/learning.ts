// What the person knows, as their own AI keeps it over MCP: books, subjects and grasps, courses, credentials,
// inputs and items. Every rating is the person's; suggestions are never kept without them.
import { z } from "zod";
import { BOOK_STATUS, FILM_KINDS, FILM_STATUS, GRASP, RESOURCE_KINDS, type BookStatus, type FilmStatus } from "@reflect/core/learning";
import { lookupIsbn, type Fetch } from "@reflect/core/openlibrary";
import { MEDIA, WAYS, placeOf } from "@reflect/core/ways";
import { addBook, addSubjects, bookStatusOf, getBook, keepRecall, learnView, rateSubject, restoreBookStatus, setBookStatus, type BookStatusWas } from "../learn-store";
import { addCourses, addCredential, listCourses, listCredentials } from "../learn-sources-store";
import { addInput, inputTitle, listInputs, markSubject } from "../ideas-store";
import { addItem, addItemSubjects, changeItem, listItems, removeItem } from "../ways-store";
import { action, idsIn } from "./types";

const openLibrary: Fetch = (url) => fetch(url, { headers: { "user-agent": "reflect-app" } });

/** Keep a book the person names. With an ISBN, Open Library fills the authors; its subjects come back as suggestions only. */
export async function toolAddBook(userId: string, b: { title: string; isbn?: string; status?: BookStatus; subjects?: string[] }, fetcher: Fetch = openLibrary) {
  const catalog = b.isbn ? await lookupIsbn(b.isbn, fetcher).catch(() => null) : null;
  const id = await addBook(userId, { ...b, authors: catalog?.authors ?? [], catalog });
  return { book_id: id, authors: catalog?.authors ?? [], suggested_subjects: catalog?.subjects ?? [], note: "Suggested subjects are Open Library's. Add only the ones the person says fit, with add_book_subjects." };
}

/** Keep what the person named of a book without looking, then the book's subjects to rate. */
export async function toolRecallCheck(userId: string, bookId: string, recalled: string) {
  const r = await keepRecall(userId, bookId, recalled);
  const book = await getBook(userId, bookId);
  return { ...r, contents: book?.catalog?.contents ?? [], grasp_levels: GRASP, next: "Show the person the subjects they named and the rest, then ask their grasp of each in their words and keep it with rate_subject. Do not rate for them." };
}

export async function toolLearning(userId: string) {
  const v = await learnView(userId);
  const [courses, credentials, inputs] = await Promise.all([listCourses(userId), listCredentials(userId), listInputs(userId)]);
  return {
    shown_not_rated: v.shown.map((s) => s.name),
    suggested_not_known: v.suggested.map((s) => s.name),
    inputs: inputs.map((i) => ({ id: i.id, kind: i.body.kind, title: inputTitle(i.body), subjects: i.subjects })),
    known: v.known.map((s) => ({ subject: s.name, grasp: s.grasp, vouched_for_by: s.vouches })),
    vouched_not_rated: v.vouched.map((s) => ({ subject: s.name, vouched_for_by: s.vouches })),
    courses: courses.map((c) => ({ ...c.row, your_grasp: c.subject.grasp?.grasp ?? null })),
    credentials: credentials.map((c) => ({ name: c.name, issuer: c.issuer, issued: c.issued ?? null, subjects: c.subjects, checked: c.checked ?? null })),
    books: v.books.map((b) => ({ id: b.id, title: b.title, authors: b.authors, status: b.status, finished: b.finishedOn, subjects: b.subjects.map((s) => s.name), not_yet_rated: b.unrated })),
    items: (await listItems(userId).catch(() => [])).map((i) => ({ id: i.id, medium: i.medium, way: placeOf(i), title: i.title, by: i.by, url: i.url, status: i.status, finished: i.finishedOn, lesson: i.lesson, subjects: i.subjects.map((x) => x.name) })),
  };
}

const ok = { ok: true };

export const learning = action({
  id: "learning",
  title: "What the person knows",
  description: "What the person took in: subjects they rated as known (could teach, explain or remember the gist), subjects shown but not rated, subjects suggested, their books (with subjects of read books not yet rated), films, talks, conversations, links, courses and credentials. Nothing is known until the person rates it. Their own ideas are under ideas.",
  tier: "read",
  on: ["mcp"],
  run: async ({ userId }) => toolLearning(userId),
});

export const addBookAction = action({
  id: "add_book",
  title: "Keep a book",
  description: "Keep a book the person names, where they are with it, and the key subjects as they name them. Give an ISBN to look it up in Open Library; its subjects come back as suggestions, never kept without the person.",
  tier: "own",
  on: ["mcp"],
  input: z.object({ title: z.string().min(1), isbn: z.string().optional(), status: z.enum(BOOK_STATUS as unknown as [string, ...string[]]).default("read"), subjects: z.array(z.string().min(1)).max(60).optional() }),
  run: async ({ userId }, { title, isbn, status, subjects }) => toolAddBook(userId, { title, ...(isbn ? { isbn } : {}), status: status as BookStatus, ...(subjects ? { subjects } : {}) }),
});

export const addBookSubjects = action({
  id: "add_book_subjects",
  title: "Add subjects to a book",
  description: "Add subjects the person says the book covers.",
  tier: "own",
  on: ["mcp"],
  input: z.object({ book_id: z.string().uuid(), subjects: z.array(z.string().min(1)).min(1).max(60) }),
  run: async ({ userId }, { book_id, subjects }) => addSubjects(userId, book_id, subjects).then(() => ok),
});

export const setBookStatusAction = action({
  id: "set_book_status",
  title: "Where the person is with a book",
  description: "want, reading, read, abandoned or referenced (cited or mentioned, how far read not said). Reading records when they started; read records when they finished.",
  tier: "own",
  on: ["mcp"],
  input: z.object({ book_id: z.string().uuid(), status: z.enum(BOOK_STATUS as unknown as [string, ...string[]]) }),
  run: async ({ userId }, { book_id, status }) => setBookStatus(userId, book_id, status as BookStatus).then(() => ok),
  // Undo puts back the status and its days; the status history keeps both changes.
  before: async ({ userId }, { book_id }) => bookStatusOf(userId, book_id),
  change: (_r, { book_id, status }, before) => ({ before, after: { book_id, status } }),
  undo: async ({ userId }, c) => {
    const [bookId] = idsIn(c.after, "book_id");
    const was = c.before as BookStatusWas | null;
    if (!bookId || !was?.status) throw new Error("This change cannot be undone.");
    await restoreBookStatus(userId, bookId, was);
  },
});

export const recallCheck = action({
  id: "recall_check",
  title: "What the person remembers of a book",
  description: "First ask the person, without showing them anything, to name the book's key subjects from memory. Send their words here as they said them. It keeps the recall and returns which of the book's subjects they named, the rest, and the book's contents if known.",
  tier: "own",
  on: ["mcp"],
  input: z.object({ book_id: z.string().uuid(), recalled: z.string().min(1).describe("the person's own words, before seeing any list") }),
  run: async ({ userId }, { book_id, recalled }) => toolRecallCheck(userId, book_id, recalled),
});

export const addCoursesAction = action({
  id: "add_courses",
  title: "Keep courses from the person's transcript",
  description: "Courses read from a transcript the person shared with you. Copy each row exactly as the transcript writes it, show the rows to the person, and send only the ones they confirmed. The grade is the school's; ask the person their own grasp of each and keep it with rate_subject (the course title is the subject).",
  tier: "own",
  on: ["mcp"],
  input: z.object({ institution: z.string().optional(), courses: z.array(z.object({ term: z.string(), code: z.string().optional(), title: z.string().min(1), credits: z.number().min(0).max(99).optional(), grade: z.string().optional() })).min(1).max(200) }),
  run: async ({ userId }, { institution, courses }) => ({ kept: await addCourses(userId, courses.map((c) => ({ ...c, ...(institution ? { institution } : {}) }))) }),
});

export const addCredentialAction = action({
  id: "add_credential",
  title: "Keep a credential",
  description: "A certificate, license or badge the person holds, as they state it, with the subjects it covers.",
  tier: "own",
  on: ["mcp"],
  input: z.object({ name: z.string().min(1), issuer: z.string().min(1), issued: z.string().optional().describe("YYYY, YYYY-MM or YYYY-MM-DD"), expires: z.string().optional(), url: z.string().url().optional(), subjects: z.array(z.string().min(1)).max(60).optional() }),
  run: async ({ userId }, { name, ...c }) => ({ credential_id: await addCredential(userId, name, c) }),
});

export const rateSubjectAction = action({
  id: "rate_subject",
  title: "Keep the person's grasp of a subject",
  description: "The person's own rating, never yours: teach (could teach it), explain (could explain the key ideas), gist (remember the gist) or forgot (don't remember it). A new rating never changes an old one; the latest counts.",
  tier: "own",
  on: ["mcp"],
  input: z.object({ subject: z.string().min(1), grasp: z.enum(["teach", "explain", "gist", "forgot"]), book_id: z.string().uuid().optional(), note: z.string().optional() }),
  run: async ({ userId }, { subject, grasp, book_id, note }) => rateSubject(userId, subject, grasp, { ...(book_id ? { bookId: book_id } : {}), ...(note ? { note } : {}) }).then(() => ok),
});

export const addInputAction = action({
  id: "add_input",
  title: "Keep a film, talk, conversation or link",
  description: "Something the person took in beside books: a film, documentary or series; a talk (someone they saw speak); a conversation (with whom, what about); or a link (a post or thread on X, Substack or Reddit, a video, an article). Keep only what the person confirms, as they state it.",
  tier: "own",
  on: ["mcp"],
  input: z.object({
    kind: z.enum(["film", "talk", "conversation", "link"]),
    title: z.string().optional().describe("the title; for a conversation, what it was about"),
    who: z.array(z.string().min(1)).optional().describe("the speaker, the people in the conversation, or the author"),
    url: z.string().url().optional(),
    on: z.string().optional().describe("YYYY, YYYY-MM or YYYY-MM-DD"),
    film: z.enum(FILM_KINDS as unknown as [string, ...string[]]).optional(),
    status: z.enum(FILM_STATUS as unknown as [string, ...string[]]).optional(),
    year: z.number().int().optional(),
    link: z.enum(RESOURCE_KINDS as unknown as [string, ...string[]]).optional(),
    subjects: z.array(z.string().min(1)).max(60).optional(),
  }),
  run: async ({ userId }, a) => {
    const title = a.title ?? "";
    const who = a.who ?? [];
    const body = a.kind === "film" ? { kind: "film" as const, title, film: a.film ?? "film", ...(a.year ? { year: a.year } : {}), status: (a.status ?? "watched") as FilmStatus }
      : a.kind === "talk" ? { kind: "talk" as const, title, speaker: who.join(", "), ...(a.on ? { on: a.on } : {}), ...(a.url ? { url: a.url } : {}) }
      : a.kind === "conversation" ? { kind: "conversation" as const, with: who, on: a.on ?? new Date().toISOString().slice(0, 10), about: title }
      : { kind: "link" as const, title: title || a.url || "", link: a.link ?? "article", ...(a.url ? { url: a.url } : {}), ...(who.length ? { by: who.join(", ") } : {}) };
    return { input_id: await addInput(userId, body, a.subjects ?? []) };
  },
});

export const addItemAction = action({
  id: "add_item",
  title: "Keep a lecture, debate, film, music, game or the like",
  description: `Something the person learned from, or keeps for rest, beside books, by its medium: ${MEDIA.map((m) => m.id).join(", ")}. Its way of learning follows the medium unless the person names one (${WAYS.map((w) => w.id).join(", ")}). A game, music or art counts as learning only with a lesson, in the person's own words. Keep only what the person confirms, as they state it.`,
  tier: "own",
  on: ["mcp"],
  input: z.object({
    medium: z.enum(MEDIA.map((m) => m.id) as [string, ...string[]]),
    title: z.string().min(1),
    by: z.string().optional(),
    url: z.string().url().optional(),
    status: z.enum(["want", "doing", "done"]).default("done"),
    way: z.enum(WAYS.map((w) => w.id) as [string, ...string[]]).optional(),
    lesson: z.string().optional().describe("what it taught the person, in their words"),
    took_part: z.boolean().optional().describe("for a debate or discussion: the person took part"),
    subjects: z.array(z.string().min(1)).max(30).optional(),
  }),
  run: async ({ userId }, a) => {
    const id = await addItem(userId, { medium: a.medium, title: a.title, ...(a.by ? { by: a.by } : {}), ...(a.url ? { url: a.url } : {}), status: a.status, ...(a.way ? { way: a.way } : {}), ...(a.lesson ? { lesson: a.lesson } : {}), ...(a.took_part ? { tookPart: true } : {}) });
    if (a.subjects?.length) await addItemSubjects(userId, id, a.subjects);
    return { item_id: id };
  },
  // Undo removes the item, kept so it can be restored, as Remove on its page does.
  change: (r) => ({ after: r }),
  undo: async ({ userId }, c) => {
    for (const id of idsIn(c.after, "item_id")) await removeItem(userId, id);
  },
});

export const addLesson = action({
  id: "add_lesson",
  title: "Keep what an item taught the person",
  description: "A lesson in the person's own words, added to an item with the date; earlier lessons are kept. Never write it for them.",
  tier: "own",
  on: ["mcp"],
  input: z.object({ item_id: z.string().uuid(), lesson: z.string().min(1) }),
  run: async ({ userId }, { item_id, lesson }) => changeItem(userId, item_id, { lesson }).then(() => ok),
});

export const markSubjectAction = action({
  id: "mark_subject",
  title: "Note that the person showed knowledge of a subject, or suggest one",
  description: "shown: you saw the person display knowledge of an established subject (they explained it, applied it, corrected you, taught it); say what you saw. suggested: you think a subject relates to them. Neither is a grasp; only the person rates their grasp (rate_subject). A framing of the person's own is an idea (keep_idea), not a subject. Mark only with the person's yes.",
  tier: "own",
  on: ["mcp"],
  input: z.object({ subject: z.string().min(1), kind: z.enum(["shown", "suggested"]), by: z.string().min(1).describe("your product name"), evidence: z.string().optional() }),
  run: async ({ userId }, { subject, kind, by, evidence }) => markSubject(userId, subject, kind, by, evidence).then(() => ok),
});
