// Learn's (Scholē's) page acts as actions (Ask Reflect plan, step 4): books from the library, claims and stances,
// items and what is kept on them, excerpts, the reading goal, reactions, lists, follows and instruments. Learn's pages
// run these same entries, so their changes are in the change log; the ones a person can take back have Undo.
import { z } from "zod";
import { BOOK_STATUS, type BookStatus } from "@reflect/core/learning";
import { cleanEntry, searchBooks, workEntry, type Fetch } from "@reflect/core/openlibrary";
import { bestListMatch, listBookQuery, listById } from "@reflect/core/lists";
import { itemListById } from "@reflect/core/item-lists";
import { excerptsMarkdown, isHighlightColor } from "@reflect/core/excerpts";
import { instrumentById } from "@reflect/core/instruments";
import { addBook, goalFor, learnView, rankWant, setFinishedOn, setGoal } from "../learn-store";
import { keepClaim, setStance } from "../claims-store";
import { addExcerpt, allExcerpts, removeExcerpt, reviseExcerpt, cleanAnchor } from "../excerpt-store";
import { addItem, addItemNote, addItems, addItemSubjects, addSession, changeItem, editItem, getItem, linkItemClaim, listItems, removeItem, removeItemNote, removeItemSubject, removeSession, restoreItem, setBookWay, setItemDates, setItemFacts, setTranscript, setUnitDone } from "../ways-store";
import { highlightBooks } from "../highlights";
import { importWork } from "../work-store";
import { keepReason } from "../learn-reason-store";
import { setFavorite } from "../favorite-store";
import { reactionOf, setReaction } from "../reaction-store";
import { setFollow } from "../people";
import { makePlaylist, setSaved, setTopicFollow } from "../topics";
import { aimsOf } from "../collections";
import { logPractice, setPieceLearned } from "../instruments";
import { action, idsIn, type ActionContext } from "./types";
import { outsideFetch } from "../outside";

const openLibrary: Fetch = (url) => outsideFetch()(url, { cache: "no-store" });
const uuid = z.string().max(60);
const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const STATUS = BOOK_STATUS as unknown as [string, ...string[]];
const holders = z.array(z.object({ name: z.string().min(1).max(200), citation: z.string().max(300).optional() })).max(20);
const todayOf = (ctx: ActionContext) => ctx.today ?? new Date().toISOString().slice(0, 10);

export const keepLibraryBook = action({
  id: "keep_library_book",
  title: "Put a library book on the shelves",
  description: "Put a book from the open library (an entry as search_library or browse_category gave it, unchanged) on the person's shelves, where they are with it (want, reading, read). Only when they ask.",
  tier: "own",
  on: ["chat", "mcp"],
  input: z.object({ entry: z.record(z.string(), z.unknown()), status: z.enum(STATUS).default("want") }),
  run: async ({ userId }, { entry, status }) => {
    let clean = cleanEntry(entry);
    if (!clean) throw new Error("that library entry has no title");
    // Some lists (trending) carry no call numbers; look the work up so the book lands on its shelf.
    if (!clean.lcc?.length) {
      const full = await workEntry(clean.work, openLibrary).catch(() => null);
      if (full) clean = { ...full, ...(clean.cover ? { cover: clean.cover } : {}) };
    }
    return { book_id: await addBook(userId, { title: clean.title, authors: clean.authors, ...(clean.isbn ? { isbn: clean.isbn } : {}), status: status as BookStatus, subjects: [], catalog: clean }) };
  },
  change: (r) => ({ after: r }),
});

export const keepClaimAction = action({
  id: "keep_claim",
  title: "Keep a claim with the person's stance",
  description: "Keep a claim the person accepted, with who holds it (each with a citation from a text Reflect holds, never invented) and the person's stance, under a subject; with an item's id, it is tied to that debate or discussion. Only what the person said yes to.",
  tier: "own",
  on: ["chat", "mcp"],
  input: z.object({ text: z.string().min(1).max(2000), holders: holders.default([]), stance: z.string().max(40), subject: z.string().max(200).optional(), item_id: uuid.optional() }),
  run: async ({ userId }, { text, holders, stance, subject, item_id }) => {
    const claim = await keepClaim(userId, { text, holders, stance, ...(subject ? { subject } : {}) });
    if (item_id) await linkItemClaim(userId, item_id, claim);
    return { claim_id: claim };
  },
  change: (r) => ({ after: r }),
});

export const setStanceAction = action({
  id: "set_stance",
  title: "Set the person's stance on a claim",
  description: "Set the person's stance on a claim they keep (by its id), only as they state it. Every stance is kept; the latest counts.",
  tier: "own",
  on: ["chat", "mcp"],
  input: z.object({ claim_id: uuid, stance: z.string().max(40) }),
  run: async ({ userId }, { claim_id, stance }) => {
    await setStance(userId, claim_id, stance);
    return { claim_id, stance };
  },
  change: (r) => ({ after: r }),
});

export const changeItemAction = action({
  id: "change_item",
  title: "Change an item on the shelves",
  description: "Change one of the person's items (by its id, from show_ways): its way of learning (empty follows its medium), status (want, doing, done), a new lesson in their words, its title, maker, link, picture or the book it adapts, the days started and finished, whether they took part, how many parts it has and which part they are on, or its transcript. Only what the person said.",
  tier: "own",
  on: ["chat", "mcp"],
  input: z.object({
    item_id: uuid,
    way: z.string().max(40).nullable().optional(), status: z.enum(["want", "doing", "done"]).optional(), lesson: z.string().max(4000).optional(), day: day.optional(),
    title: z.string().max(300).optional(), by: z.string().max(200).nullable().optional(), url: z.string().max(1000).nullable().optional(), image: z.string().max(1000).nullable().optional(), work: z.string().max(40).nullable().optional(),
    started: day.nullable().optional(), finished: day.nullable().optional(),
    took_part: z.boolean().optional(), parts: z.number().int().min(0).max(10000).nullable().optional(), part: z.number().int().min(0).max(10000).nullable().optional(), step: z.number().int().min(-1000).max(1000).optional().describe("Move the part on (or back) by this many"),
    transcript: z.string().max(400_000).nullable().optional(),
  }),
  run: async (ctx, i) => {
    const { userId } = ctx;
    const id = i.item_id;
    const has = (k: keyof typeof i) => i[k] !== undefined;
    if (has("way") || has("status") || has("lesson")) await changeItem(userId, id, { ...(has("way") ? { way: i.way || null } : {}), ...(i.status ? { status: i.status } : {}), ...(has("lesson") ? { lesson: i.lesson } : {}), day: i.day ?? todayOf(ctx) });
    if (has("title") || has("by") || has("url") || has("image") || has("work")) await editItem(userId, id, { ...(has("title") ? { title: i.title } : {}), ...(has("by") ? { by: i.by || null } : {}), ...(has("url") ? { url: i.url || null } : {}), ...(has("image") ? { image: i.image || null } : {}), ...(has("work") ? { work: i.work || null } : {}) });
    if (has("started") || has("finished")) await setItemDates(userId, id, { ...(has("started") ? { startedOn: i.started ?? null } : {}), ...(has("finished") ? { finishedOn: i.finished ?? null } : {}) });
    if (has("took_part") || has("parts") || has("part") || has("step")) {
      const cur = has("step") ? await getItem(userId, id) : null;
      if (has("step") && !cur) throw new Error("no such item");
      await setItemFacts(userId, id, { ...(has("took_part") ? { tookPart: i.took_part } : {}), ...(has("parts") ? { parts: i.parts ?? null } : {}), ...(has("part") ? { part: i.part ?? null } : {}), ...(cur ? { part: Math.max(0, (cur.part ?? 0) + (i.step ?? 0)) } : {}) });
    }
    if (has("transcript")) await setTranscript(userId, id, i.transcript || null);
    return { item_id: id };
  },
  change: (r) => ({ after: r }),
});

export const removeItemAction = action({
  id: "remove_item",
  title: "Remove an item from the shelves",
  description: "Remove one of the person's items by its id, only when they ask. It is kept so Undo restores it.",
  tier: "own",
  on: ["chat", "mcp"],
  input: z.object({ item_id: uuid }),
  run: async ({ userId }, { item_id }) => {
    await removeItem(userId, item_id);
    return { item_id };
  },
  change: (r) => ({ after: r }),
  undo: async ({ userId }, c) => {
    for (const id of idsIn(c.after, "item_id")) await restoreItem(userId, id);
  },
});

export const restoreItemAction = action({
  id: "restore_item",
  title: "Restore a removed item",
  description: "Restore an item the person removed, by its id.",
  tier: "own",
  on: ["chat", "mcp"],
  input: z.object({ item_id: uuid }),
  run: async ({ userId }, { item_id }) => {
    await restoreItem(userId, item_id);
    return { item_id };
  },
  change: (r) => ({ after: r }),
  undo: async ({ userId }, c) => {
    for (const id of idsIn(c.after, "item_id")) await removeItem(userId, id);
  },
});

export const takeUpItem = action({
  id: "take_up_item",
  title: "Want to do, or start, a find",
  description: "Put a find (from find_item, or a course or lecture) on Want to; an item of the same medium and title already kept is used again. With start, it is started (doing) and opened, to do in Reflect.",
  tier: "own",
  on: ["chat", "mcp"],
  input: z.object({ medium: z.string().max(40), title: z.string().min(1).max(300), by: z.string().max(200).optional(), url: z.string().max(1000).optional(), image: z.string().max(1000).optional(), start: z.boolean().default(false), day: day.optional() }),
  run: async (ctx, a) => {
    const { userId } = ctx;
    const same = (await listItems(userId)).find((i) => i.medium === a.medium && i.title.toLowerCase() === a.title.trim().toLowerCase());
    const id = same?.id ?? await addItem(userId, { medium: a.medium, title: a.title, ...(a.by ? { by: a.by } : {}), ...(a.url ? { url: a.url } : {}), ...(a.image ? { image: a.image } : {}), status: a.start ? "doing" : "want", day: a.day ?? todayOf(ctx) });
    if (same && a.start && same.status === "want") await changeItem(userId, id, { status: "doing", day: a.day ?? todayOf(ctx) });
    return { item_id: id, created: !same, href: `/schole/items/${id}` };
  },
  change: (r) => ({ after: r }),
  undo: async ({ userId }, c) => {
    const a = c.after as { item_id?: unknown; created?: unknown } | null;
    if (typeof a?.item_id !== "string" || a.created !== true) throw new Error("It was already on the shelves; change its status instead.");
    await removeItem(userId, a.item_id);
  },
});

export const setBookWayAction = action({
  id: "set_book_way",
  title: "Move a book to another way of learning",
  description: "Move one of the person's books (by id) to another way of learning, or back to the way its catalog gives (null).",
  tier: "own",
  on: ["chat", "mcp"],
  input: z.object({ book_id: uuid, way: z.string().max(40).nullable() }),
  run: async ({ userId }, { book_id, way }) => {
    await setBookWay(userId, book_id, way || null);
    return { book_id, way };
  },
  change: (r) => ({ after: r }),
});

export const keepExcerpt = action({
  id: "keep_excerpt",
  title: "Keep an excerpt from a book",
  description: "Keep words from a book the person is reading (its Open Library work id) as an excerpt: only words found in a text Reflect holds (excerpt, quote_book), with the page or place, a note in their words and a highlight colour.",
  tier: "own",
  on: ["chat", "mcp"],
  input: z.object({ work: z.string().max(160), quote: z.string().min(1).max(4000), anchor: z.unknown().optional(), place: z.string().max(100).nullable().optional(), note: z.string().max(4000).nullable().optional(), color: z.string().max(20).nullable().optional() }),
  run: async ({ userId }, e) => ({ excerpt_id: await addExcerpt(userId, { work: e.work, quote: e.quote, anchor: cleanAnchor(e.anchor ?? null), place: e.place ?? null, note: e.note ?? null, color: isHighlightColor(e.color) ? e.color : null }) }),
  change: (r) => ({ after: r }),
  undo: async ({ userId }, c) => {
    for (const id of idsIn(c.after, "excerpt_id")) await removeExcerpt(userId, id);
  },
});

export const reviseExcerptAction = action({
  id: "revise_excerpt",
  title: "Give an excerpt a new colour or note",
  description: "Give one of the person's excerpts (by id) a new highlight colour or note in their words; an empty note removes it. Returns the excerpt's new id.",
  tier: "own",
  on: ["chat", "mcp"],
  input: z.object({ excerpt_id: uuid, color: z.string().max(20).optional(), note: z.string().max(4000).nullable().optional() }),
  run: async ({ userId }, { excerpt_id, color, note }) => ({ excerpt_id: await reviseExcerpt(userId, excerpt_id, { ...(isHighlightColor(color) ? { color } : {}), ...(note !== undefined ? { note } : {}) }) }),
  change: (r) => ({ after: r }),
});

export const removeExcerptAction = action({
  id: "remove_excerpt",
  title: "Remove an excerpt",
  description: "Remove one of the person's excerpts by its id, only when they ask. It cannot be undone.",
  tier: "own",
  on: ["chat", "mcp"],
  input: z.object({ excerpt_id: uuid }),
  run: async ({ userId }, { excerpt_id }) => {
    await removeExcerpt(userId, excerpt_id);
    return { excerpt_id };
  },
  change: (r) => ({ after: r }),
});

export const setFinishedAction = action({
  id: "set_finished",
  title: "Set the day a book was finished",
  description: "Set the day the person finished a book they have read (by id), as they state it.",
  tier: "own",
  on: ["chat", "mcp"],
  input: z.object({ book_id: uuid, day }),
  run: async ({ userId }, { book_id, day }) => {
    await setFinishedOn(userId, book_id, day);
    return { book_id, day };
  },
  change: (r) => ({ after: r }),
});

export const orderWantAction = action({
  id: "order_want",
  title: "Order Want to read",
  description: "Put the person's Want to read books in the order they give, by book id, first to last.",
  tier: "own",
  on: ["chat", "mcp"],
  input: z.object({ book_ids: z.array(uuid).max(1000) }),
  run: async ({ userId }, { book_ids }) => {
    const before = (await learnView(userId)).books.filter((b) => b.status === "want").sort((a, b) => (a.wantRank ?? 1e9) - (b.wantRank ?? 1e9)).map((b) => b.id);
    await rankWant(userId, book_ids);
    return { before, order: book_ids };
  },
  change: (r) => ({ before: { order: r.before }, after: { order: r.order } }),
  undo: async ({ userId }, c) => {
    await rankWant(userId, idsIn(c.before, "order"));
  },
});

export const setReadingGoal = action({
  id: "set_reading_goal",
  title: "Set the reading goal for a year",
  description: "Set the person's goal of books to read in a year, or clear it (null), as they state it.",
  tier: "own",
  on: ["chat", "mcp"],
  input: z.object({ year: z.number().int().min(1900).max(3000), books: z.number().int().min(0).max(10000).nullable() }),
  run: async ({ userId }, { year, books }) => {
    await setGoal(userId, year, books);
    return { year, books };
  },
  before: async ({ userId }, { year }) => ({ year, books: await goalFor(userId, year) }),
  change: (r, _i, before) => ({ before, after: r }),
  undo: async ({ userId }, c) => {
    const b = c.before as { year?: unknown; books?: unknown } | null;
    if (typeof b?.year !== "number") throw new Error("This change cannot be undone.");
    await setGoal(userId, b.year, typeof b.books === "number" ? b.books : null);
  },
});

export const setUnitDoneAction = action({
  id: "set_unit_done",
  title: "Mark a lecture or episode finished",
  description: "Mark a lecture or episode (its unit key) of one of the person's items finished, or not; of is how many the item has. Only when they say so.",
  tier: "own",
  on: ["chat", "mcp"],
  input: z.object({ item_id: uuid, unit: z.string().max(200), done: z.boolean(), of: z.number().int().min(0).max(10000).nullable().default(null), day: day.optional() }),
  run: async (ctx, { item_id, unit, done, of, day: on }) => {
    await setUnitDone(ctx.userId, item_id, unit, done, of, on ?? todayOf(ctx));
    return { item_id, unit, done, of };
  },
  change: (r) => ({ after: r }),
  undo: async ({ userId }, c) => {
    const a = c.after as { item_id?: unknown; unit?: unknown; done?: unknown; of?: unknown } | null;
    if (typeof a?.item_id !== "string" || typeof a.unit !== "string") throw new Error("This change cannot be undone.");
    await setUnitDone(userId, a.item_id, a.unit, a.done !== true, typeof a.of === "number" ? a.of : null);
  },
});

export const addItemNoteAction = action({
  id: "add_item_note",
  title: "Keep a note on an item",
  description: "Keep a note in the person's words on one of their items, at a moment (seconds) when given, with words quoted from its transcript (only words the transcript holds).",
  tier: "own",
  on: ["chat", "mcp"],
  input: z.object({ item_id: uuid, at: z.number().min(0).nullable().optional(), quote: z.string().max(4000).optional(), note: z.string().max(4000).optional(), unit: z.string().max(200).nullable().optional() }),
  run: async ({ userId }, { item_id, ...n }) => ({ item_id, note_id: await addItemNote(userId, item_id, n) }),
  change: (r) => ({ after: r }),
  undo: async ({ userId }, c) => {
    for (const id of idsIn(c.after, "note_id")) await removeItemNote(userId, id);
  },
});

export const removeItemNoteAction = action({
  id: "remove_item_note",
  title: "Remove a note from an item",
  description: "Remove one of the person's notes on an item, by the note's id, only when they ask.",
  tier: "own",
  on: ["chat", "mcp"],
  input: z.object({ note_id: uuid }),
  run: async ({ userId }, { note_id }) => {
    await removeItemNote(userId, note_id);
    return { note_id };
  },
  change: (r) => ({ after: r }),
});

export const addSessionAction = action({
  id: "add_session",
  title: "Keep a practice session on an item",
  description: "Keep a practice session on one of the person's items: the day, minutes if given, and a note in their words. Only what they said they did.",
  tier: "own",
  on: ["chat", "mcp"],
  input: z.object({ item_id: uuid, day: day.optional(), minutes: z.number().int().min(1).max(1440).nullable().optional(), note: z.string().max(4000).optional() }),
  run: async (ctx, { item_id, day: on, minutes, note }) => {
    await addSession(ctx.userId, item_id, { day: on ?? todayOf(ctx), ...(minutes ? { minutes } : {}), ...(note ? { note } : {}) });
    return { item_id };
  },
  change: (r) => ({ after: r }),
});

export const removeSessionAction = action({
  id: "remove_session",
  title: "Remove a practice session",
  description: "Remove one of the person's practice sessions, by its id, only when they ask. It cannot be undone.",
  tier: "own",
  on: ["chat", "mcp"],
  input: z.object({ session_id: uuid }),
  run: async ({ userId }, { session_id }) => {
    await removeSession(userId, session_id);
    return { session_id };
  },
  change: (r) => ({ after: r }),
});

export const addItemSubjectsAction = action({
  id: "add_item_subjects",
  title: "Add subjects to an item",
  description: "Add subjects the person says one of their items is about.",
  tier: "own",
  on: ["chat", "mcp"],
  input: z.object({ item_id: uuid, subjects: z.array(z.string().min(1).max(200)).min(1).max(30) }),
  run: async ({ userId }, { item_id, subjects }) => {
    await addItemSubjects(userId, item_id, subjects);
    return { item_id, subjects };
  },
  change: (r) => ({ after: r }),
});

export const removeItemSubjectAction = action({
  id: "remove_item_subject",
  title: "Take a subject off an item",
  description: "Take one subject (by its id) off one of the person's items.",
  tier: "own",
  on: ["chat", "mcp"],
  input: z.object({ item_id: uuid, subject_id: uuid }),
  run: async ({ userId }, { item_id, subject_id }) => {
    await removeItemSubject(userId, item_id, subject_id);
    return { item_id, subject_id };
  },
  change: (r) => ({ after: r }),
});

export const setReactionAction = action({
  id: "set_reaction",
  title: "Like or dislike a thing, privately",
  description: "Keep the person's private Like or Dislike of a thing (by its key, as a page gives it), or take it off (none). Only as they say.",
  tier: "own",
  on: ["chat", "mcp"],
  input: z.object({ key: z.string().max(400), reaction: z.enum(["like", "dislike", "none"]) }),
  run: async ({ userId }, { key, reaction }) => {
    await setReaction(userId, key, reaction);
    return { key, reaction };
  },
  before: async ({ userId }, { key }) => ({ key, reaction: (await reactionOf(userId, key)) ?? "none" }),
  change: (r, _i, before) => ({ before, after: r }),
  undo: async ({ userId }, c) => {
    const b = c.before as { key?: unknown; reaction?: unknown } | null;
    if (typeof b?.key !== "string") throw new Error("This change cannot be undone.");
    await setReaction(userId, b.key, b.reaction === "like" || b.reaction === "dislike" ? b.reaction : "none");
  },
});

export const favoriteEpisodeAction = action({
  id: "favorite_episode",
  title: "Mark an episode a favorite",
  description: "Mark an episode (its unit key) of one of the person's podcasts a favorite, or take the mark off.",
  tier: "own",
  on: ["chat", "mcp"],
  input: z.object({ item_id: uuid, unit: z.string().max(200), favorite: z.boolean() }),
  run: async ({ userId }, { item_id, unit, favorite }) => {
    await setFavorite(userId, item_id, unit, favorite);
    return { item_id, unit, favorite };
  },
  change: (r) => ({ after: r }),
  undo: async ({ userId }, c) => {
    const a = c.after as { item_id?: unknown; unit?: unknown; favorite?: unknown } | null;
    if (typeof a?.item_id !== "string" || typeof a.unit !== "string") throw new Error("This change cannot be undone.");
    await setFavorite(userId, a.item_id, a.unit, a.favorite !== true);
  },
});

export const followListAction = action({
  id: "follow_list",
  title: "Add a list's books or items to Want to",
  description: "Add a reading list's books (kind book) or an item list's items (kind item; one, by title, when given) that are not on the person's shelves to Want to, in the list's order. Only when they ask.",
  tier: "own",
  on: ["chat", "mcp"],
  input: z.object({ list: z.string().max(120), kind: z.enum(["book", "item"]).default("book"), title: z.string().max(300).optional() }),
  run: async ({ userId }, { list: listId, kind, title }) => {
    if (kind === "item") {
      const list = itemListById(listId);
      if (!list) throw new Error("no such list");
      const pick = list.items.filter((i) => !title || i.title === title);
      const was = new Set((await listItems(userId)).map((i) => i.id));
      const added = await addItems(userId, pick.map((i) => ({ medium: i.medium, title: i.title, ...(i.by ? { by: i.by } : {}), ...(i.url ? { url: i.url } : {}), status: "want" as const })));
      const items = (await listItems(userId)).map((i) => i.id).filter((id) => !was.has(id));
      return { added, items, books: [] as string[], order: [] as string[] };
    }
    const list = listById(listId);
    if (!list) throw new Error("no such list");
    const found = await Promise.all(list.books.map((b) => searchBooks(listBookQuery(b), openLibrary, 6).then((r) => bestListMatch(b, r)).catch(() => null)));
    const view = await learnView(userId);
    const have = new Set(view.books.map((b) => b.catalog?.work).filter(Boolean));
    const added: string[] = [];
    for (const b of found) {
      if (!b || have.has(b.work)) continue;
      have.add(b.work);
      added.push(await addBook(userId, { title: b.title, authors: b.authors, status: "want", subjects: [], catalog: b }));
    }
    const before = view.books.filter((b) => b.status === "want").sort((a, b) => (a.wantRank ?? 1e9) - (b.wantRank ?? 1e9)).map((b) => b.id);
    await rankWant(userId, [...before, ...added]);
    return { added: added.length, items: [] as string[], books: added, order: before };
  },
  // Undo removes the items it added; books stay (a book on the shelves is taken off on its page).
  change: (r) => ({ after: { added: r.added, items: r.items, books: r.books } }),
  undo: async ({ userId }, c) => {
    if (idsIn(c.after, "books").length) throw new Error("Books added from a list are taken off on their pages.");
    for (const id of idsIn(c.after, "items")) await removeItem(userId, id);
  },
});

export const keepReasonAction = action({
  id: "keep_reason",
  title: "Keep why the person is learning a course",
  description: "Keep, as a work of the person's journal, what is causing them to learn a course and for the sake of what, in their words, with the origins they mark. Never write it for them.",
  tier: "own",
  on: ["chat", "mcp"],
  input: z.object({ course_url: z.string().max(1000), course_title: z.string().max(300), cause: z.string().max(4000), end: z.string().max(4000), end_kind: z.string().max(40).optional(), origins: z.array(z.string().max(60)).max(20).default([]) }),
  run: async ({ userId }, r) => ({ work_id: await keepReason(userId, { courseUrl: r.course_url, courseTitle: r.course_title, cause: r.cause, end: r.end, origins: r.origins, endKind: r.end_kind ?? "" }) }),
  change: (r) => ({ after: r }),
});

export const highlightsToJournal = action({
  id: "highlights_to_journal",
  title: "Put the highlights in the journal",
  description: "Put all the person's highlights into their journal as one Markdown work. Returns the work's id.",
  tier: "own",
  on: ["chat", "mcp"],
  input: z.object({}),
  run: async ({ userId }) => ({ work_id: await importWork(userId, "Highlights.md", excerptsMarkdown(await highlightBooks(userId, await allExcerpts(userId)))) }),
  change: (r) => ({ after: r }),
});

export const followTopic = action({
  id: "follow_topic",
  title: "Follow a topic",
  description: "Follow a topic in Learn, or stop following it (follow false).",
  tier: "own",
  on: ["chat", "mcp"],
  input: z.object({ topic: z.string().max(120), follow: z.boolean().default(true) }),
  run: async ({ userId }, { topic, follow }) => {
    await setTopicFollow(userId, topic, follow);
    return { topic, follow };
  },
  change: (r) => ({ after: r }),
  undo: async ({ userId }, c) => {
    const a = c.after as { topic?: unknown; follow?: unknown } | null;
    if (typeof a?.topic !== "string") throw new Error("This change cannot be undone.");
    await setTopicFollow(userId, a.topic, a.follow !== true);
  },
});

export const followPerson = action({
  id: "follow_person",
  title: "Follow a guest or host",
  description: "Follow a podcast guest or host in Learn (by name, with their Wikidata id when known), or stop following them. It reaches no one: it only shows their episodes to the person.",
  tier: "own",
  on: ["chat", "mcp"],
  input: z.object({ name: z.string().min(1).max(200), qid: z.string().max(20).nullable().optional(), follow: z.boolean().default(true) }),
  run: async ({ userId }, { name, qid, follow }) => {
    await setFollow(userId, { name, qid: qid ?? null }, follow);
    return { name, qid: qid ?? null, follow };
  },
  change: (r) => ({ after: r }),
  undo: async ({ userId }, c) => {
    const a = c.after as { name?: unknown; qid?: unknown; follow?: unknown } | null;
    if (typeof a?.name !== "string") throw new Error("This change cannot be undone.");
    await setFollow(userId, { name: a.name, qid: typeof a.qid === "string" ? a.qid : null }, a.follow !== true);
  },
});

export const makePlaylistAction = action({
  id: "make_playlist",
  title: "Make a playlist from a topic",
  description: "Make the person a playlist from a topic in Learn: from what they told Work, changed by what they ask, and different from one they want replaced (its id). Returns its id and page.",
  tier: "own",
  on: ["chat", "mcp"],
  input: z.object({ topic: z.string().max(120), ask: z.string().max(1000).optional(), instead: z.string().max(60).optional() }),
  run: async ({ userId }, { topic, ask, instead }) => {
    const id = await makePlaylist(userId, topic, { aims: await aimsOf(userId), ...(ask ? { ask } : {}), ...(instead ? { instead } : {}) });
    return { id, href: `/schole/playlists/made/${id}` };
  },
  change: (r) => ({ after: r }),
});

export const savePlaylist = action({
  id: "save_playlist",
  title: "Save a made playlist to Lists",
  description: "Save a playlist made for the person (by id) to the library's Lists, or take it out (saved false).",
  tier: "own",
  on: ["chat", "mcp"],
  input: z.object({ id: z.string().max(60), saved: z.boolean().default(true) }),
  run: async ({ userId }, { id, saved }) => {
    await setSaved(userId, id, saved);
    return { id, saved };
  },
  change: (r) => ({ after: r }),
  undo: async ({ userId }, c) => {
    const a = c.after as { id?: unknown; saved?: unknown } | null;
    if (typeof a?.id !== "string") throw new Error("This change cannot be undone.");
    await setSaved(userId, a.id, a.saved !== true);
  },
});

const instrument = (id: string) => {
  const x = instrumentById(id);
  if (!x) throw new Error("No such instrument.");
  return x;
};

export const logPracticeAction = action({
  id: "log_practice",
  title: "Log instrument practice",
  description: "Log the minutes the person says they practised an instrument (such as 'piano'): on a piece (its id, from piano) or on scales and exercises ('technique'). Practice is kept as it happened and is not undone.",
  tier: "own",
  on: ["chat", "mcp"],
  input: z.object({ instrument: z.string().max(40), kind: z.string().max(80).describe("A piece's id, or 'technique'"), minutes: z.number().min(0).max(1440) }),
  run: async ({ userId }, { instrument: id, kind, minutes }) => {
    const x = instrument(id);
    const piece = x.pieces.find((p) => p.id === kind);
    if (!piece && kind !== "technique") throw new Error("No such piece.");
    await logPractice(userId, x, minutes, piece ? piece.title : "Scales and exercises");
    return { instrument: x.id, kind, minutes };
  },
  change: (r) => ({ after: r }),
});

export const learnedPiece = action({
  id: "learned_piece",
  title: "Mark a piece learned",
  description: "Mark a piece of an instrument course (its id, from piano) learned, or take that back, only when the person says so.",
  tier: "own",
  on: ["chat", "mcp"],
  input: z.object({ instrument: z.string().max(40), piece: z.string().max(80), learned: z.boolean().default(true) }),
  run: async ({ userId }, { instrument: id, piece, learned }) => {
    const x = instrument(id);
    await setPieceLearned(userId, x, piece, learned);
    return { instrument: x.id, piece, learned };
  },
  change: (r) => ({ after: r }),
  undo: async ({ userId }, c) => {
    const a = c.after as { instrument?: unknown; piece?: unknown; learned?: unknown } | null;
    if (typeof a?.instrument !== "string" || typeof a.piece !== "string") throw new Error("This change cannot be undone.");
    await setPieceLearned(userId, instrument(a.instrument), a.piece, a.learned !== true);
  },
});
