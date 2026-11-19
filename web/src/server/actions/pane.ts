// Not offered (2026-11-19: the third pane is off until the sidebar is right; Torian). Kept for when it returns.
// The second pane (Panes design guide, PR 2): the chat opens one of Reflect's own pages beside itself, so "show me my
// calendar" puts the calendar next to the conversation. The client opens it when this tool's call finishes
// (src/app/chat/chat.tsx); nothing is stored and nothing changes.
import { z } from "zod";
import { action } from "./types";

/** A path inside Reflect: starts with one slash, no scheme, no API route. */
export const panePath = z
  .string()
  .max(300)
  .regex(/^\/(?!\/)[^\s]*$/, "a path inside Reflect, starting with /")
  .refine((p) => !p.startsWith("/api/") && p !== "/api", "not an API route");

export const openPaneAction = action({
  id: "open_pane",
  title: "Open a page beside the chat",
  description: "Open one of Reflect's own pages in a tab of the pane beside the chat, by its path (such as /calendar, /journal, /life/food, or a record's href from another tool). Use it when the person asks to see, open or show something, or when looking at the page would help more than words. Paths only, never an outside address; the page opens as the person would see it.",
  tier: "read",
  on: ["chat"],
  input: z.object({
    path: panePath.describe("A path inside Reflect, such as /calendar"),
    title: z.string().max(60).optional().describe("A short name for the tab, such as 'Calendar'"),
  }),
  run: async (_ctx, input) => ({ opened: input.path, title: input.title ?? null }),
});
