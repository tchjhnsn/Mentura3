// Putting an adventure on the calendar (Ask Reflect plan, step 4): the adventure page's button as an action, so the
// chat can do it too. The other changes on an adventure's page are the tiles' record actions (./records.ts).
import { z } from "zod";
import { adventureOf } from "@reflect/core/adventures";
import { lifeRecord, saveLifeRecord } from "../life-store";
import { addEvent, removeEvent } from "../calendar-store";
import { action, idsIn } from "./types";

export const adventureToCalendar = action({
  id: "adventure_to_calendar",
  title: "Put an adventure on the calendar",
  description: "Put one of the person's adventures (by its id, from adventures) on their calendar: one event a day from its start to its end, each day's plan as the note. Run again, it replaces the events it put there before. Only when the person asks; the adventure needs its dates first.",
  tier: "own",
  on: ["chat", "mcp"],
  input: z.object({ id: z.string().max(60) }),
  run: async ({ userId }, { id }) => {
    const r = await lifeRecord(userId, id);
    if (!r || r.app !== "legacy" || r.kind !== "adventure") throw new Error("No such adventure.");
    const a = adventureOf(r);
    if (!a.start) throw new Error("Pick the dates first.");
    const old = String(r.body.events ?? "").split(",").filter(Boolean);
    for (const e of old) await removeEvent(userId, e, true).catch(() => {});
    const ids: string[] = [];
    const last = a.end ?? a.start;
    for (let t = Date.parse(a.start), n = 0; t <= Date.parse(last) && n < 31; t += 86400_000, n++) {
      const d = new Date(t).toISOString().slice(0, 10);
      const plan = a.plan.find((p) => p.day === d) ?? (a.plan.every((p) => !p.day) ? a.plan.at(n) : undefined);
      const note = plan ? plan.stops.map((s) => `${s.time ? `${s.time} ` : ""}${s.title}`).join("\n") : null;
      ids.push(await addEvent(userId, { title: a.name, tile: null, day: d, note, recordId: id }));
    }
    await saveLifeRecord(userId, id, { ...r.body, events: ids.join(",") });
    return { id, events: ids, replaced: old, body: r.body };
  },
  change: (r) => ({ before: { id: r.id, body: r.body, events: r.replaced }, after: { id: r.id, events: r.events } }),
  // Undo takes the new events off, puts back the ones it replaced and the adventure's fields.
  undo: async ({ userId }, c) => {
    const b = c.before as { id?: unknown; body?: unknown } | null;
    if (typeof b?.id !== "string" || !b.body || typeof b.body !== "object") throw new Error("This change cannot be undone.");
    for (const e of idsIn(c.after, "events")) await removeEvent(userId, e, true);
    for (const e of idsIn(c.before, "events")) await removeEvent(userId, e, false);
    await saveLifeRecord(userId, b.id, b.body as Record<string, unknown>);
  },
});
