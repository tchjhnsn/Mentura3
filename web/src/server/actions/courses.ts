// Scholē courses in the chat and over MCP: passages from texts Reflect holds (excerpt), a course drafted from them
// (draft_course), and the person's courses (courses). A passage is never a model's words: the model names a place
// with the excerpt tool's ref, and Reflect cuts the words from the held text. Examiners stay people: a drafted course
// has no grades and no quizzes.
import { z } from "zod";
import { coursesOf, draftCourse, excerpt } from "../course-drafts";
import { action } from "./types";
import { itemsOf, viewOf } from "./loaded";
import type { ActionContext } from "./types";

const recordsOf = async (ctx: ActionContext) => {
  const [view, items] = await Promise.all([viewOf(ctx), itemsOf(ctx)]);
  return { books: view.books, items };
};

const ref = z.union([
  z.object({ kind: z.literal("book"), work: z.string().regex(/^OL\d+W$/), chapter: z.number().int().min(1), p: z.number().int().min(0) }),
  z.object({ kind: z.literal("transcript"), item: z.string().uuid(), at: z.number().int().min(0) }),
]).describe("A passage's ref exactly as the excerpt tool returned it");

export const excerptAction = action({
  id: "excerpt",
  title: "Fetch a passage from a text Reflect holds",
  description:
    "Fetch a passage from a work whose text Reflect holds: a public-domain book's text (Standard Ebooks or Project Gutenberg) or a transcript the person pasted. Give the work (words of its title, or its Open Library id such as OL12345W) and either a query (words as written in the text) or a place (chapter and paragraph in a book, a second in a transcript). Returns each passage with its cite, edition, ref and reading-page link. When the text is not held it returns nothing: say so, and never quote from memory.",
  tier: "read",
  on: ["chat", "mcp"],
  input: z.object({
    work: z.string().min(1).max(200).describe("Words of the title, or an Open Library work id"),
    query: z.string().min(2).max(100).optional().describe("Words that occur in the text"),
    chapter: z.number().int().min(1).max(10000).optional().describe("A book's chapter, from 1"),
    paragraph: z.number().int().min(0).max(100000).optional().describe("The paragraph in the chapter, from 0"),
    at: z.number().int().min(0).max(100000).optional().describe("A second in a transcript"),
  }),
  run: async (ctx, input) => excerpt(ctx.userId, await recordsOf(ctx), input),
});

export const draftCourseAction = action({
  id: "draft_course",
  title: "Draft a course in Scholē",
  description:
    "Draft a course in Scholē when the person asks for one: a title, a goal, and units, each with the works it reads (words of a title or an Open Library id; each must be a book in the catalog or one of the person's learn items) and passages chosen first with the excerpt tool (pass each passage's ref, never its words). Reflect keeps the course on the person's shelves and gives its page. Nothing is kept if a work or passage is not held; fix what it names and try again. Do not grade, and do not write quizzes or questions: examiners are people.",
  tier: "own",
  on: ["chat", "mcp"],
  input: z.object({
    title: z.string().min(1).max(300),
    goal: z.string().min(1).max(1000).describe("What the person will be able to do or understand by the end, in their words where they gave them"),
    units: z.array(z.object({
      title: z.string().min(1).max(200),
      works: z.array(z.string().min(1).max(200)).max(6).default([]),
      passages: z.array(z.object({ ref, words: z.string().max(100).optional().describe("The words the excerpt was found by, to centre the passage on") })).max(6).default([]),
    })).min(1).max(12),
  }),
  run: async (ctx, input) => draftCourse(ctx.userId, await recordsOf(ctx), input),
});

export const coursesAction = action({
  id: "courses",
  title: "List the person's courses",
  description: "List the courses the person keeps in Scholē: ones drafted in Ask Reflect, an instrument, lectures from Open Yale or MIT, and ones they added, each with how far they are and its page.",
  tier: "read",
  on: ["chat", "mcp"],
  input: z.object({}),
  run: async (ctx) => coursesOf(await itemsOf(ctx)),
});
