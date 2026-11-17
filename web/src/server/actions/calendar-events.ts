// The calendar's own page acts as actions (Ask Reflect plan, step 4): change, remove and restore an event. Adding is
// add_event and add_events (./calendar.ts). /calendar runs these same entries, so its changes are in the change log.
import { z } from "zod";
import { eventSchema } from "../calendar-tools";
import { eventOf, removeEvent, saveEvent } from "../calendar-store";
import { action, idsIn } from "./types";

const id = z.string().uuid();

export const changeEvent = action({
  id: "change_event",
  title: "Change an event on the calendar",
  description: "Change one of the person's events (by its id from calendar), only when they ask: give it whole, as it should be, with the day and times they said. Say the new day and time.",
  tier: "own",
  on: ["chat", "mcp"],
  input: eventSchema.extend({ id }),
  run: async ({ userId }, { id, ...e }) => {
    await saveEvent(userId, id, e);
    return { id, title: e.title, day: e.day };
  },
  before: async ({ userId }, { id }) => ({ id, event: await eventOf(userId, id) }),
  change: (r, _i, before) => ({ before, after: r }),
  undo: async ({ userId }, c) => {
    const b = c.before as { id?: unknown; event?: Parameters<typeof saveEvent>[2] | null } | null;
    if (typeof b?.id !== "string" || !b.event) throw new Error("This change cannot be undone.");
    await saveEvent(userId, b.id, b.event);
  },
});

export const removeEventAction = action({
  id: "remove_event",
  title: "Remove an event from the calendar",
  description: "Remove one of the person's events by its id (from calendar), only when they ask. Undo puts it back.",
  tier: "own",
  on: ["chat", "mcp"],
  input: z.object({ id }),
  run: async ({ userId }, { id }) => {
    await removeEvent(userId, id, true);
    return { id };
  },
  change: (r) => ({ after: r }),
  undo: async ({ userId }, c) => {
    for (const e of idsIn(c.after, "id")) await removeEvent(userId, e, false);
  },
});

export const restoreEventAction = action({
  id: "restore_event",
  title: "Put back a removed event",
  description: "Put back an event the person removed, by its id.",
  tier: "own",
  on: ["chat", "mcp"],
  input: z.object({ id }),
  run: async ({ userId }, { id }) => {
    await removeEvent(userId, id, false);
    return { id };
  },
  change: (r) => ({ after: r }),
  undo: async ({ userId }, c) => {
    for (const e of idsIn(c.after, "id")) await removeEvent(userId, e, true);
  },
});
