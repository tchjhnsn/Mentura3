// The chat's tools, built from the action registry (@/server/actions). Each action returns data; here the chat
// turns it into cards (show) and the words the model reads back. The tool names are the registry's ids.
import { tool, type Tool } from "ai";
import type { z } from "zod";
import { describeFor, type Action, type ActionContext } from "@/server/actions";
import { adventures, connections, household, householdPlan, meals, place, planAdventureAction } from "@/server/actions/life";
import { addEvent, addEventsAction, calendar } from "@/server/actions/calendar";
import { browseCategory, findItem, piano, practiceDialectic, quoteBook, quoteTranscript, searchLibrary, showShelves, showWays } from "@/server/actions/schole";
import { proposeClaim, showClaims } from "@/server/actions/ideas";
import { recentChanges, undoChangeAction } from "@/server/actions/changes";
import { runAction } from "@/server/actions/run";
import { addHomeCardAction, checkHomeItemAction, homeCardsAction, removeHomeCardAction } from "@/server/actions/home-cards";
import { cardLines, type HomeCard } from "@reflect/core/home-cards";
import { coursesAction, draftCourseAction, excerptAction } from "@/server/actions/courses";
import type { AddedEvent } from "@/server/calendar-tools";
import type { LearnView } from "@/server/learn-store";
import type { LearnItem } from "@/server/ways-store";
import type { ClaimOut } from "@/server/claims-store";
import { mediumOf } from "@reflect/core/ways";
import type { CatalogEntry } from "@reflect/core/openlibrary";
import type { Piece } from "../../chat/spec";

/** What one chat request has already read, and where its cards go. */
export type ChatDeps = { userId: string; today?: string; view: LearnView; claims: ClaimOut[] | null; items: LearnItem[]; show: (p: Piece) => void };

export function chatTools({ userId, today, view, claims, items, show }: ChatDeps): Record<string, Tool> {
  const ctx: ActionContext = { userId, ...(today ? { today } : {}), loaded: { view, claims, items } };
  const kept = new Set(view.books.map((b) => b.catalog?.work).filter((w): w is string => Boolean(w)));
  // One registry action as a chat tool: the registry's id, description and input; the chat's own reply. It runs
  // through runAction, so every change is logged; a change the person can undo gets an Undo chip under its card.
  const use = <S extends z.ZodType, R>(a: Action<S, R>, say: (r: R, input: z.output<S>) => unknown): [string, Tool] => [
    a.id,
    tool({
      description: describeFor(a as Action, "chat"),
      inputSchema: a.input as z.ZodType<z.output<S>>,
      execute: async (input: z.output<S>) => {
        const { result, changeId } = await runAction(a, ctx, input, "chat");
        const said = say(result, input);
        if (!changeId || a.tier !== "own" || !a.undo) return said;
        show({ kind: "undo", change: changeId, title: a.title });
        return typeof said === "string" ? `${said} Change ${changeId}: the person can tap Undo, or ask you (undo_change).` : said;
      },
    }) as Tool,
  ];

  const library = (r: { label: string; href: string; books: CatalogEntry[] | null }) => {
    const books = r.books;
    if (!books) {
      show({ kind: "note", text: "The open library did not answer." });
      return "The open library did not answer.";
    }
    show({ kind: "library", label: r.label, books, kept, href: r.href });
    return books.length ? `Shown: ${books.map((b) => `${b.title} by ${b.authors.join(", ") || "unknown"}${kept.has(b.work) ? " (already on their shelves)" : ""}`).join("; ")}` : "Nothing found.";
  };
  const added = (list: AddedEvent[]) => {
    for (const e of list) show({ kind: "event", title: e.title, day: e.day, when: e.when, tile: e.tile ? e.tile_label : "", href: e.href });
    return `Added to the calendar: ${list.map((e) => `${e.title}, ${e.day}, ${e.when}${e.tile ? `, ${e.tile_label}` : ""}${e.repeat !== "none" ? `, repeats ${e.repeat}` : ""} (id ${e.id})`).join("; ")}. The person changes or removes them on /calendar.`;
  };

  const day = today ?? new Date().toISOString().slice(0, 10);
  const card = (c: HomeCard & { summary: string }, said: string) => {
    show({ kind: "home_card", title: c.title, tile: c.tile, lines: cardLines(c, day), until: c.end });
    return `${said}: ${c.summary} (id ${c.id}). The person removes it with the x on Home.`;
  };

  return Object.fromEntries([
    use(practiceDialectic, (r) => {
      if (r.kind === "course") {
        show({ kind: "quote", text: r.course.about, cite: `Course: ${r.course.name}`, href: "/schole/courses/dialectic" });
        return `Shown: the course ${r.course.name}, four units, each a playlist and then practice. To make a course for the person, use draft_course.`;
      }
      const d = r.dialogue;
      show({ kind: "quote", text: `Ten questions on ${d.title} (${d.question}), one passage at a time: what the words do, what they support or attack, and how good the argument is.`, cite: `Practice: ${d.title}`, href: `/schole/dialectic/practice/${d.id}` });
      return `Shown: a practice session on ${d.title}. Do not write quiz questions about it yourself; the session asks them.`;
    }),
    use(adventures, (r) => r),
    use(planAdventureAction, (r) => {
      show({ kind: "quote", text: [r.adventure.place, r.adventure.start, `${r.adventure.plan.length} days planned`].filter(Boolean).join(" · "), cite: `Adventure: ${r.adventure.name}`, href: r.href });
      return `Saved as a draft on ${r.href}. The person keeps or changes it there.`;
    }),
    use(calendar, (r) => JSON.stringify(r).slice(0, 12000)),
    use(addEvent, (r) => added(r)),
    use(addEventsAction, (r) => added(r)),
    use(householdPlan, (r, { path }) => {
      if (!r.summary) return "No such part of the plan. Do not guess a figure.";
      const stage = path.split("/")[0] || "";
      show({ kind: "quote", text: r.summary, cite: "Your household plan", href: stage && stage !== "already" ? `/plan?step=${encodeURIComponent(stage)}` : "/plan" });
      return JSON.stringify(r.part);
    }),
    use(household, (r) => (r === null ? "No such part of the household. Do not guess." : JSON.stringify(r))),
    use(place, (r) => {
      if (!r.set) return "The person has not said where they live. They can set it at Settings, Where you live.";
      return r.part === null ? "No such part, or the source could not be read. Do not guess." : JSON.stringify(r.part);
    }),
    use(connections, (r) => (r === null ? "No such connector. Do not guess." : JSON.stringify(r))),
    use(meals, (r) => (r === null ? "No such part of the meals. Do not guess." : JSON.stringify(r))),
    use(piano, (r) => (r === null ? "No such part of the piano course. Do not guess." : JSON.stringify(r))),
    use(showShelves, (sh) => {
      show({ kind: "shelves", shelves: sh });
      return sh.length ? `Shown: ${sh.map((s) => `${s.id} ${s.name}: ${[...s.books, ...s.subjects].join(", ")}`).join("; ")}` : "No shelves yet.";
    }),
    use(showWays, (ways) => {
      show({ kind: "shelves", shelves: ways });
      return ways.length ? `Shown: ${ways.map((w) => `${w.name}: ${w.books.join(", ")}`).join("; ")}` : "Nothing on their shelves yet.";
    }),
    use(findItem, (r, { query }) => {
      if (!r.found.length) {
        show({ kind: "note", text: r.error ?? `Nothing found for “${query}”.` });
        return `Nothing found${r.error ? `: ${r.error}` : ""}. Do not name one from memory.`;
      }
      r.found.forEach((f, i) => show({ kind: "found_item", medium: f.medium, label: mediumOf(f.medium).label, title: f.title, ...(f.by ? { by: f.by } : {}), ...(f.image ? { image: f.image } : {}), source: f.source, kept: r.kept[i] ?? false, item: JSON.stringify(f) }));
      return `Shown: ${r.found.map((f) => `${f.title}${f.by ? ` (${f.by})` : ""} from ${f.source}`).join("; ")}. Not kept unless the person taps Add.`;
    }),
    use(quoteTranscript, (places, { words }) => {
      if (!places.length) {
        show({ kind: "note", text: `“${words}” was not found in your transcripts.` });
        return "Not found. Do not quote from memory; say it was not found.";
      }
      for (const p of places) show({ kind: "quote", text: p.text, cite: p.cite, href: p.href });
      return `Shown: ${places.map((p) => `"${p.text}" (${p.cite})`).join("; ")}`;
    }),
    use(showClaims, (list) => {
      if (!list) {
        show({ kind: "note", text: "Claims are not set up here yet." });
        return "Claims are not set up.";
      }
      show({ kind: "claims", claims: list.map((c) => ({ text: c.text, stance: c.stance?.stance ?? null, holders: c.holders })) });
      return list.length ? `Shown: ${list.map((c) => `${c.text} (${c.stance?.stance ?? "no stance"})`).join("; ")}` : "They keep no claims yet.";
    }),
    use(searchLibrary, (r) => library(r)),
    use(browseCategory, (r) => (r ? library(r) : "That is not a Thema section or category Reflect knows.")),
    use(quoteBook, (r, { words, book }) => {
      if (!r) {
        show({ kind: "note", text: book ? `“${words}” was not found in ${book} in Reflect.` : `“${words}” was not found in the books you are reading in Reflect.` });
        return "Not found. Do not quote from memory; say it was not found.";
      }
      const cites = r.hits.map((h, i) => {
        const text = `${h.before}${h.match}${h.after}`.trim();
        const cite = [r.author, r.title, r.chapters[i]].filter(Boolean).join(", ");
        show({ kind: "quote", text, cite, href: `/schole/works/${r.work}/read?c=${h.chapter}&find=${encodeURIComponent(words)}&p=${h.p}` });
        return `"${text}" (${cite})`;
      });
      return `Shown, ${r.total} ${r.total === 1 ? "place" : "places"} in all: ${cites.join("; ")}`;
    }),
    use(proposeClaim, (p) => {
      if (!p) return "That claim could not be proposed.";
      show({ kind: "propose_claim", ...p });
      return "Proposed. It is not kept unless the person taps Accept.";
    }),
    use(recentChanges, (list) => (list.length ? JSON.stringify(list).slice(0, 12000) : "No changes yet.")),
    use(undoChangeAction, (r) => {
      show({ kind: "note", text: `Undone: ${r.title}.` });
      return `Undone: ${r.title} (change ${r.undone}).`;
    }),
    use(homeCardsAction, (r) => JSON.stringify(r).slice(0, 12000)),
    use(addHomeCardAction, (c) => card(c, "Placed on Home")),
    use(removeHomeCardAction, () => "Removed from Home."),
    use(checkHomeItemAction, (c) => card(c, "Checked")),
    use(excerptAction, (r) => {
      if (!r.held) {
        show({ kind: "note", text: r.reason });
        return `${r.reason} Nothing is quoted. Do not quote from memory.`;
      }
      if (!r.passages.length) {
        show({ kind: "note", text: r.reason ?? "Nothing found in the text." });
        return `${r.reason ?? "Nothing found."} Do not quote from memory.`;
      }
      for (const p of r.passages) show({ kind: "quote", text: p.text, cite: p.cite, href: p.href });
      return `Shown, ${r.total} ${r.total === 1 ? "place" : "places"} in all, from ${r.source}${r.chapters ? `, ${r.chapters} chapters` : ""}: ${JSON.stringify(r.passages.map((p) => ({ ref: p.ref, cite: p.cite, text: p.text })))}. Quote only these words.`;
    }),
    use(draftCourseAction, (r, input) => {
      if (!r.ok) return `Nothing was kept: ${r.errors.join(" ")}`;
      show({ kind: "course", title: r.title, goal: input.goal, units: `${r.units} ${r.units === 1 ? "unit" : "units"}, ${r.passages} ${r.passages === 1 ? "passage" : "passages"}`, href: r.href });
      return `Kept on the person's shelves as a course, at ${r.href}. Do not grade or write quizzes for it; examiners are people.`;
    }),
    use(coursesAction, (list) => (list.length ? JSON.stringify(list) : "The person keeps no courses yet.")),
  ]);
}
