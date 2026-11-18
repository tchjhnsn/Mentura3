// The dashboard's layout as actions (Dashboard, 2026-11-18): Ask Reflect reads which cards the dashboard (/dashboard)
// shows and adds, moves, sizes or hides one, so "hide Events" or "put Money at the top" works. The layout is kept in
// ../dashboard-layout.ts (migration 0055); Undo puts back the layout as it was before.
import { z } from "zod";
import { CARD_SIZES, arrange, dashCards, layoutOf, orderOf, putLayout, readLayout, setLayout, type DashLayout } from "../dashboard-layout";
import { action } from "./types";

/** The dashboard as the model reads it: every card with whether it shows, where and its size. */
async function cardsOut(layout: DashLayout) {
  const cards = await dashCards();
  const shown = arrange(cards, layout);
  const at = new Map(shown.map((c, i) => [c.id, i]));
  return orderOf(cards.map((c) => c.id), layout).map((id) => {
    const c = cards.find((x) => x.id === id)!;
    return { id, title: c.title, column: c.column, shown: at.has(id), position: at.get(id) ?? null, size: layout.sizes[id] ?? "medium" };
  });
}

export const dashboardAction = action({
  id: "dashboard",
  title: "Read the dashboard's cards",
  description: "List every card the person's dashboard (/dashboard) can show, in their order: each card's id, title, whether it is shown or hidden, its position among the shown cards (from 0, top first) and its size. Call it before set_dashboard_card to find a card's id from its title.",
  tier: "read",
  on: ["chat", "mcp"],
  input: z.object({}),
  run: async ({ userId }) => ({ href: "/dashboard", cards: await cardsOut(await layoutOf(userId)) }),
});

const to = z.union([
  z.enum(["top", "bottom"]),
  z.number().int().min(0).max(99),
  z.object({ before: z.string().max(60) }),
  z.object({ after: z.string().max(60) }),
]);

export const setDashboardCardAction = action({
  id: "set_dashboard_card",
  title: "Change the dashboard",
  description: `Show, hide, move or size cards on the person's dashboard (/dashboard), by card id from dashboard. Give a card's id with hidden true to hide it or false to show it; to to move it ("top", "bottom", a position from 0, or { before: id } / { after: id }); size (${CARD_SIZES.join(", ")}, or null for its default). Several changes apply in order. Only the cards dashboard lists exist; you cannot make a new one. Only when the person asked.`,
  tier: "own",
  on: ["chat", "mcp"],
  input: z.object({
    changes: z.array(z.object({
      id: z.string().max(60).describe("A card id from dashboard, such as 'events'"),
      hidden: z.boolean().optional(),
      to: to.optional(),
      size: z.enum(CARD_SIZES).nullable().optional(),
    })).min(1).max(20),
  }),
  // The layout before, so Undo can put it back.
  before: async ({ userId }) => layoutOf(userId),
  run: async ({ userId }, { changes }) => {
    const { after } = await setLayout(userId, changes);
    return { href: "/dashboard", cards: await cardsOut(after) };
  },
  change: (r, _i, before) => ({ before, after: { href: r.href } }),
  undo: async ({ userId }, c) => putLayout(userId, readLayout(c.before)),
});
