// The dashboard over the chat and MCP (dashboard, 2026-11-18): the same facts /dashboard shows, as JSON, and the
// morning brief's opt-in, which Settings, Dashboard runs too so the change is in the change log and can be undone.
import { z } from "zod";
import { todayFacts } from "../dashboard-today";
import { setMorningBrief } from "../dashboard-event-store";
import { action } from "./types";

export const dashboardToday = action({
  id: "dashboard_today",
  title: "Read the dashboard",
  description:
    "What the person's dashboard shows now, as facts: the next calendar item and the rest of today and tomorrow, the people waiting on them (connect requests and messages they have not answered), what is left to allot in their monthly budget, the next event they are going to and a few nearby, and the cards Ask Reflect placed for today. Use it for 'what's on my day' or a morning summary.",
  tier: "read",
  on: ["chat", "mcp"],
  input: z.object({}),
  run: async ({ userId, now }) => todayFacts(userId, now ?? new Date()),
});

export const setMorningBriefAction = action({
  id: "set_morning_brief",
  title: "Turn the morning brief on or off",
  description: "Turn the person's morning brief on or off: a short message each morning with their next item, the people waiting on them and their money left. Sending it by email or notification is not built yet, so turning it on only keeps their choice. Only when the person asks.",
  tier: "own",
  on: ["chat", "mcp"],
  input: z.object({ on: z.boolean() }),
  run: async ({ userId }, { on }) => ({ on, was: await setMorningBrief(userId, on), href: "/settings/dashboard" }),
  change: (r) => ({ before: { on: r.was }, after: { on: r.on } }),
  undo: async ({ userId }, c) => {
    const b = c.before as { on?: unknown } | null;
    if (typeof b?.on !== "boolean") throw new Error("This change cannot be undone.");
    await setMorningBrief(userId, b.on);
  },
});
