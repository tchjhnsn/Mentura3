// The calendar as the chat and the person's own AI (MCP) read and add to it: one place for both, so they agree.
import { CAL_TILES, REPEATS, agenda, calendarHref, calendarRange, eventInputOf, isCalTile, occurrences, tileLabel, whenOf, type EventToolInput } from "@reflect/core/calendar";
import { z } from "zod";
import { addEvent, calendar, cleanEvent } from "./calendar-store";

const DAY = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const TIME = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const TILES = CAL_TILES.map((t) => t.id) as [string, ...string[]];

/** What the calendar tools take, for the chat and MCP alike. */
export const calendarSchema = z.object({
  from: DAY.describe("The first day, YYYY-MM-DD"),
  to: DAY.optional().describe("The last day, YYYY-MM-DD; a week after the first when left out, at most 92 days"),
  tile: z.enum(TILES).optional().describe(`Only one tile's events: ${CAL_TILES.map((t) => `${t.id} (${t.label})`).join(", ")}`),
});
export const eventSchema = z.object({
  title: z.string().min(1).max(200),
  day: DAY.describe("YYYY-MM-DD"),
  starts: TIME.optional().describe("HH:MM, 24-hour; left out for all day"),
  ends: TIME.optional().describe("HH:MM, after starts"),
  tile: z.enum(TILES).optional().describe(`The tile it belongs to: ${CAL_TILES.map((t) => `${t.id} (${t.label})`).join(", ")}`),
  repeat: z.enum(REPEATS.map((r) => r.id) as [string, ...string[]]).optional().describe("none, daily, weekly, monthly or yearly"),
  until: DAY.optional().describe("The last day it repeats, YYYY-MM-DD"),
  note: z.string().max(4000).optional(),
});

/** The person's calendar from one day through another (a week when `to` is left out, at most 92 days), optionally one tile's. */
export async function calendarPart(userId: string, from: string, to?: string, tile?: string) {
  const range = calendarRange(from, to);
  if (!range) throw new Error("Give the first day as YYYY-MM-DD.");
  if (tile && !isCalTile(tile)) throw new Error("No such tile.");
  const t = tile && isCalTile(tile) ? tile : null;
  return { ...range, tile: t, events: agenda(occurrences(await calendar(userId, range.from, range.to, t), range.from, range.to)) };
}

export type AddedEvent = { id: string; title: string; day: string; when: string; tile: string | null; tile_label: string; repeat: string; href: string };

/** Add events to the person's calendar. Every one is checked before any is added, so a bad one adds none. */
export async function addEvents(userId: string, list: readonly EventToolInput[]): Promise<AddedEvent[]> {
  const checked = list.map((e, i) => {
    try {
      return cleanEvent(eventInputOf(e));
    } catch (err) {
      throw new Error(list.length > 1 ? `Event ${i + 1}: ${(err as Error).message}` : (err as Error).message);
    }
  });
  const out: AddedEvent[] = [];
  for (const c of checked) {
    const id = await addEvent(userId, c);
    out.push({ id, title: c.title, day: c.day, when: whenOf(c), tile: c.tile, tile_label: tileLabel(c.tile), repeat: c.repeat, href: calendarHref(c.day) });
  }
  return out;
}
