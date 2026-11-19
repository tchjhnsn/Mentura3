// Scholē in the chat: the piano course, practice on the dialogues, the person's shelves and ways, the free
// catalogs, the open library, and words found in their transcripts and books.
import { z } from "zod";
import { INSTRUMENT_PATHS, PIANO } from "@reflect/core/instruments";
import { DIALOGUES } from "@reflect/core/practice-settled";
import { DIALECTIC_COURSE } from "@reflect/core/start-dialectic";
import { LEISURE, MEDIA, WAYS, bookWay, mediumOf, placeOf } from "@reflect/core/ways";
import { categoryOf, themaCategory, themaQuery, themaSection } from "@reflect/core/thema";
import { lookLink, searchMedium, type Fetch } from "@reflect/core/lookup";
import { clock, readTranscript, searchTranscript } from "@reflect/core/media";
import { browseQuery, searchBooks } from "@reflect/core/openlibrary";
import { themaCode } from "@reflect/core/ask";
import { instrumentPartOf } from "../instruments";
import { shelvesOf } from "../learn-shelves";
import { quoteFromShelves } from "../passages";
import { getItem } from "../ways-store";
import { action } from "./types";
import { itemsOf, viewOf } from "./loaded";
import { outsideFetch } from "../outside";

const openLibrary = (url: string) => outsideFetch()(url, { cache: "no-store" });
const catalogFetch: Fetch = (url) => outsideFetch({ userAgent: "reflect-app (learn items)" })(url, { next: { revalidate: 86400 } });
type Books = Awaited<ReturnType<typeof searchBooks>>;

export const piano = action({
  id: "piano",
  title: "Read the person's piano course",
  description: `Fetch one part of the person's piano course in Scholē: the piece to practise today with its recording and score, the graded pieces and which are learned, and minutes practised a day. Never log practice: the person logs it on the course page (/schole/courses/piano). Paths: ${INSTRUMENT_PATHS}.`,
  tier: "read",
  on: ["chat", "mcp"],
  input: z.object({ path: z.string().max(200).default("").describe("Such as 'pieces' or 'practice'") }),
  mcp: {
    description: `The person's piano course in Scholē: the piece to practise today with its recording and score, the graded pieces in order and which are learned, and minutes practised a day. Read only; practice is logged on the course page. Paths: ${INSTRUMENT_PATHS}.`,
    input: z.object({ path: z.string().max(200).default("") }),
  },
  run: async ({ userId }, { path }) => instrumentPartOf(userId, PIANO, path),
});

// Practice belongs to courses, or to what the person asks the chat for (Torian, 2026-11-16 21:53Z): a quiz on a
// dialogue opens a practice session, whose questions also label the argument; a course opens Reflect's course.
export const practiceDialectic = action({
  id: "practice_dialectic",
  title: "Open practice on a dialogue, or the course on dialectic",
  description: "When the person asks to be quizzed or to practise on Plato's Euthyphro, Laches or Meno, or on dialectic, arguments, rebuttals or stasis: open a practice session of ten questions on a dialogue, or Reflect's course on dialectic when they ask for a course.",
  tier: "read",
  on: ["chat"],
  input: z.object({ work: z.enum(["euthyphro", "laches", "meno", "course"]).describe("The dialogue, or course for the course on dialectic") }),
  run: async (_ctx, { work }) => (work === "course" ? { kind: "course" as const, course: DIALECTIC_COURSE } : { kind: "dialogue" as const, dialogue: DIALOGUES.find((x) => x.id === work)! }),
});

export const showShelves = action({
  id: "show_shelves",
  title: "Show the person's shelves",
  description: "Show the person's shelves: their books and subjects by Thema section.",
  tier: "read",
  on: ["chat"],
  input: z.object({}),
  run: async (ctx) => {
    const view = await viewOf(ctx);
    const names = new Map(view.books.flatMap((b) => b.subjects).map((x) => [x.id, x.name]));
    return shelvesOf(view).shelves.map((x) => ({ id: x.id, name: x.name, books: x.books.map((b) => b.title), subjects: x.subjects.map((y) => names.get(y.id) ?? y.name) }));
  },
});

export const showWays = action({
  id: "show_ways",
  title: "Show what the person learns from, by way",
  description: "Show what the person learns from by the ways of learning: books and items (lectures, debates, films, music, games) under teaching, dialectic, imitation, practice, and rest and leisure.",
  tier: "read",
  on: ["chat"],
  input: z.object({}),
  run: async (ctx) => {
    const [view, items] = await Promise.all([viewOf(ctx), itemsOf(ctx)]);
    const wayOf = (b: (typeof view.books)[number]) => b.way ?? bookWay(b.catalog ? categoryOf(b.catalog) : null, b.catalog?.subjects ?? []);
    return [...WAYS, LEISURE].map((w) => ({
      id: w.label.slice(0, 1), name: w.label,
      books: [...view.books.filter((b) => w.id !== "leisure" && wayOf(b) === w.id).map((b) => b.title), ...items.filter((i) => placeOf(i) === w.id).map((i) => `${i.title} (${mediumOf(i.medium).label.toLowerCase()})`)],
      subjects: [] as string[],
    })).filter((w) => w.books.length);
  },
});

export const findItem = action({
  id: "find_item",
  title: "Look up a lecture, film, music, game or the like",
  description: "Look up a lecture, debate, podcast, film, series, play, music, art or game for the person to add: a link, or a search of the free catalog for its medium.",
  tier: "read",
  on: ["chat"],
  input: z.object({ medium: z.enum(MEDIA.map((m) => m.id) as [string, ...string[]]), query: z.string().min(1).max(300).describe("A link, or words of its title") }),
  /** Up to five found, each with whether the person already keeps it. */
  run: async (ctx, { medium, query }) => {
    const r = /^https?:\/\//i.test(query.trim()) ? await lookLink(query.trim(), catalogFetch).then((x) => ({ found: x.found ? [x.found] : [], error: x.error })) : await searchMedium(medium, query, catalogFetch);
    const found = r.found.slice(0, 5);
    const have = new Set(found.length ? (await itemsOf(ctx)).map((i) => `${i.medium}|${i.title.toLowerCase()}`) : []);
    return { found, kept: found.map((f) => have.has(`${f.medium}|${f.title.toLowerCase()}`)), error: r.error };
  },
});

export const quoteTranscript = action({
  id: "quote_transcript",
  title: "Find words in the person's transcripts",
  description: "Find words in the transcripts the person pasted for their videos and recordings, and show each place with its moment.",
  tier: "read",
  on: ["chat"],
  input: z.object({ words: z.string().min(2).max(100), item: z.string().max(200).optional().describe("Words of the item's title, when the person names one") }),
  /** Up to five places, each with its cite and link. */
  run: async (ctx, { words, item }) => {
    const withText = (await itemsOf(ctx)).filter((i) => i.transcript && (!item || i.title.toLowerCase().includes(item.toLowerCase())));
    const out: { text: string; cite: string; href: string }[] = [];
    for (const i of withText.slice(0, 10)) {
      const full = await getItem(ctx.userId, i.id).catch(() => null);
      if (!full?.transcriptText) continue;
      for (const part of searchTranscript(readTranscript(full.transcriptText), words, 3)) {
        out.push({ text: part.text, cite: `${[i.by, i.title].filter(Boolean).join(", ")}, at ${clock(part.at)}`, href: `/schole/items/${i.id}` });
        if (out.length >= 5) break;
      }
      if (out.length >= 5) break;
    }
    return out;
  },
});

export const searchLibrary = action({
  id: "search_library",
  title: "Search the open library",
  description: "Search the open library by title, author or topic; the person can add a result to their shelves.",
  tier: "read",
  on: ["chat"],
  input: z.object({ query: z.string().min(1).max(200) }),
  /** `books` is null when the open library did not answer. */
  run: async (_ctx, { query }) => ({ label: `"${query}"`, href: `/schole/browse?q=${encodeURIComponent(query)}`, books: await searchBooks(query, openLibrary, 5).catch((): Books | null => null) }),
});

export const browseCategory = action({
  id: "browse_category",
  title: "Browse one Thema section or category",
  description: "Show the best rated books in one Thema section (one letter) or category (two letters).",
  tier: "read",
  on: ["chat"],
  input: z.object({ code: z.string().min(1).max(2).describe("A Thema code, such as F (fiction), FM (fantasy), JM (psychology), JH (sociology), QR (religion)") }),
  /** Null when the code is not a section or category Reflect knows; `books` is null when the open library did not answer. */
  run: async (_ctx, input) => {
    const c = themaCode(input.code);
    const q = c ? themaQuery(c) : null;
    if (!c || !q) return null;
    return { label: (themaCategory(c) ?? themaSection(c))!.short, href: `/schole/browse?cat=${c}`, books: await browseQuery(q, openLibrary, { limit: 5 }).catch((): Books | null => null) };
  },
});

export const quoteBook = action({
  id: "quote_book",
  title: "Find words in a book the person reads in Reflect",
  description: "Find words in the text of a book the person reads in Reflect (one they are reading, or the one named) and show each place with its chapter, to quote and cite.",
  tier: "read",
  on: ["chat"],
  input: z.object({ words: z.string().min(2).max(100).describe("A few words that occur in the book, as they would be written in it"), book: z.string().max(200).optional().describe("Words of the book's title, when the person names one") }),
  /** Null when the words were not found. */
  run: async (ctx, { words, book }) => quoteFromShelves((await viewOf(ctx)).books, words, book).catch(() => null),
});
