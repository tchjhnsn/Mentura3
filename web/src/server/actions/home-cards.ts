// Home cards (`@reflect/core/home-cards`): small cards Ask Reflect places on Home for a time, such as a word a day
// or a checklist. Kept as hidden `card` life records in the home app (../home-cards-store.ts); Home shows today's
// cards above the tiles, at most three, newest first.
import { z } from "zod";
import { DEFAULT_DAYS, HOME_CARD_TILES, MAX_SHOWN, cardSummary, cardsToday, type HomeCard } from "@reflect/core/home-cards";
import { addHomeCard, checkHomeItem, homeCards, removeHomeCard } from "../home-cards-store";
import { action, type ActionContext } from "./types";

const dayOf = (ctx: ActionContext) => ctx.today ?? new Date().toISOString().slice(0, 10);
const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

/** A card as the model reads it back: the card and its summary in words. */
export const cardOut = (c: HomeCard, today: string) => ({ ...c, summary: cardSummary(c, today) });

export const homeCardsAction = action({
  id: "home_cards",
  title: "Read the cards on Home",
  description: `List the person's Home cards: the ones showing today (at most ${MAX_SHOWN}, newest first) and the rest not yet ended, each with its id, tile, days and content.`,
  tier: "read",
  on: ["chat", "mcp"],
  input: z.object({}),
  run: async (ctx) => {
    const today = dayOf(ctx);
    const all = (await homeCards(ctx.userId)).filter((c) => c.end >= today);
    const shown = cardsToday(all, today);
    const ids = new Set(shown.map((c) => c.id));
    return { today: shown.map((c) => cardOut(c, today)), later: all.filter((c) => !ids.has(c.id)).map((c) => cardOut(c, today)) };
  },
});

const word = z.object({
  word: z.string().max(80),
  meaning: z.string().max(400),
  example: z.string().max(400).optional().describe("A sentence using the word"),
  source: z.string().max(200).optional().describe("The dictionary the meaning comes from, only if you actually have one; never invent a source"),
});

export const addHomeCardAction = action({
  id: "add_home_card",
  title: "Place a card on Home",
  description: `Place a small card on the person's Home screen for a time, such as a word a day, a checklist, a figure or a streak. It belongs to one tile (${HOME_CARD_TILES.join(", ")}), starts today unless a start is given, and shows ${DEFAULT_DAYS} days unless an end is given. For a word card you supply the words and meanings; with schedule 'daily' it shows one word a day from the list, going round. Give a word's source only if you actually have a dictionary source for it; never name one you do not have. Home shows at most ${MAX_SHOWN} cards, newest first.`,
  tier: "own",
  on: ["chat", "mcp"],
  input: z.object({
    tile: z.enum(HOME_CARD_TILES as [string, ...string[]]).describe("The tile it belongs to, such as 'learn'"),
    title: z.string().max(80).describe("Such as 'Word of the day'"),
    kind: z.enum(["word", "checklist", "figure", "streak"]),
    words: z.array(word).max(60).optional().describe("For a word card"),
    items: z.array(z.string().max(140)).max(30).optional().describe("For a checklist card"),
    value: z.string().max(40).optional().describe("For a figure card: the figure, such as '12'"),
    label: z.string().max(140).optional().describe("For a figure card, what the figure counts; for a streak, what is done each day"),
    source: z.string().max(200).optional().describe("For a figure card, where the figure comes from, if anywhere"),
    schedule: z.enum(["daily"]).optional().describe("For a word card: one word a day from the list"),
    start: day.optional(),
    end: day.optional(),
  }),
  run: async (ctx, d) => {
    const today = dayOf(ctx);
    const content = d.kind === "word" ? { kind: "word", words: d.words ?? [] }
      : d.kind === "checklist" ? { kind: "checklist", items: (d.items ?? []).map((text) => ({ text, done: false })) }
      : d.kind === "figure" ? { kind: "figure", value: d.value, label: d.label, source: d.source }
      : { kind: "streak", label: d.label, days: [] };
    const c = await addHomeCard(ctx.userId, { tile: d.tile, title: d.title, content, ...(d.start ? { start: d.start } : {}), ...(d.end ? { end: d.end } : {}), schedule: d.schedule ?? null }, today);
    return cardOut(c, today);
  },
});

export const removeHomeCardAction = action({
  id: "remove_home_card",
  title: "Remove a card from Home",
  description: "Remove one of the person's Home cards by its id (from home_cards).",
  tier: "own",
  on: ["chat", "mcp"],
  input: z.object({ id: z.string().max(60) }),
  run: async ({ userId }, { id }) => {
    await removeHomeCard(userId, id);
    return { removed: id };
  },
});

export const checkHomeItemAction = action({
  id: "check_home_item",
  title: "Check an item on a Home card",
  description: "Check or uncheck one item of a checklist card on Home, by the card's id and the item's number counted from 0; on a streak card, mark or unmark today. Only when the person says they did it.",
  tier: "own",
  on: ["chat", "mcp"],
  input: z.object({ id: z.string().max(60), item: z.number().int().min(0).max(29).optional().describe("The item's number, from 0; left out for a streak card") }),
  run: async (ctx, { id, item }) => {
    const today = dayOf(ctx);
    return cardOut(await checkHomeItem(ctx.userId, id, item ?? null, today), today);
  },
});
