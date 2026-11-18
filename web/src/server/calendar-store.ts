import { randomUUID } from "node:crypto";
import { isCalTile, isRepeat, recordEvents, type CalEvent, type CalTile } from "@reflect/core/calendar";
import { isLifeApp } from "@reflect/core/life";
import { db } from "@/db/pool";
import { feedCalEvents } from "./calendar-feeds";
import { goingCalEvents } from "./events-store";
import { open, seal } from "./crypto";
import { googleCalEvents, mirrorToGoogle } from "./google-calendar";
import { lifeRecords } from "./life-store";
import { microsoftCalEvents, mirrorToMicrosoft } from "./microsoft-calendar";

// The calendar's events (migration 0030): sealed titles and notes, tagged with a tile, removable with undo.

type Mirror = Parameters<typeof mirrorToGoogle>[2];
/** Follows a change in the calendars the person connected two-way (Google, Outlook); each does nothing unless connected. */
const mirror = (userId: string, id: string, e: Mirror) => Promise.all([mirrorToGoogle(userId, id, e), mirrorToMicrosoft(userId, id, e)]);

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const UUID = /^[0-9a-f-]{36}$/;

export type EventInput = { title: unknown; tile?: unknown; day: unknown; starts?: unknown; ends?: unknown; repeat?: unknown; until?: unknown; note?: unknown; recordId?: unknown };

/** An event as the store keeps it, or an error that names what is missing. */
export function cleanEvent(e: EventInput) {
  const title = typeof e.title === "string" ? e.title.replace(/\s+/g, " ").trim().slice(0, 200) : "";
  if (!title) throw new Error("Name the event.");
  const day = String(e.day ?? "");
  if (!DAY.test(day) || Number.isNaN(Date.parse(day))) throw new Error("Give the day.");
  const time = (v: unknown) => (typeof v === "string" && TIME.test(v) ? v : null);
  const starts = time(e.starts);
  const ends = starts ? time(e.ends) : null;
  if (starts && ends && ends <= starts) throw new Error("An event ends after it starts.");
  const until = typeof e.until === "string" && DAY.test(e.until) && e.until >= day ? e.until : null;
  const note = typeof e.note === "string" && e.note.trim() ? e.note.trim().slice(0, 4000) : null;
  return { title, tile: isCalTile(e.tile) ? e.tile : null, day, starts, ends, repeat: isRepeat(e.repeat) ? e.repeat : "none", until, note, recordId: typeof e.recordId === "string" && UUID.test(e.recordId) ? e.recordId : null };
}

export async function addEvent(userId: string, e: EventInput): Promise<string> {
  const c = cleanEvent(e);
  const id = randomUUID();
  await db().query(
    "INSERT INTO calendar_event (id, user_id, tile, title_ct, note_ct, day, starts, ends, repeat, until, record_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)",
    [id, userId, c.tile, seal(userId, c.title), c.note ? seal(userId, c.note) : null, c.day, c.starts, c.ends, c.repeat, c.until, c.recordId],
  );
  await mirror(userId, id, c); // does nothing unless Google or Outlook Calendar is connected
  return id;
}

export async function saveEvent(userId: string, id: string, e: EventInput): Promise<void> {
  const c = cleanEvent(e);
  await db().query(
    "UPDATE calendar_event SET tile = $3, title_ct = $4, note_ct = $5, day = $6, starts = $7, ends = $8, repeat = $9, until = $10, updated_at = now() WHERE id = $1 AND user_id = $2",
    [id, userId, c.tile, seal(userId, c.title), c.note ? seal(userId, c.note) : null, c.day, c.starts, c.ends, c.repeat, c.until],
  );
  await mirror(userId, id, c);
}

/** One of the person's own events as it is kept (removed or not), for Undo to put back; null when there is none. */
export async function eventOf(userId: string, id: string): Promise<{ title: string; tile: string | null; day: string; starts: string | null; ends: string | null; repeat: string; until: string | null; note: string | null } | null> {
  if (!UUID.test(id)) return null;
  const [e] = (await db().query("SELECT tile, title_ct, note_ct, day::text AS day, to_char(starts, 'HH24:MI') AS starts, to_char(ends, 'HH24:MI') AS ends, repeat, until::text AS until FROM calendar_event WHERE id = $1 AND user_id = $2", [id, userId])).rows;
  return e ? { title: open(userId, e.title_ct as string), tile: (e.tile as string | null) ?? null, day: e.day as string, starts: (e.starts as string | null) ?? null, ends: (e.ends as string | null) ?? null, repeat: e.repeat as string, until: (e.until as string | null) ?? null, note: e.note_ct ? open(userId, e.note_ct as string) : null } : null;
}

export async function removeEvent(userId: string, id: string, removed: boolean): Promise<void> {
  await db().query(`UPDATE calendar_event SET removed_at = ${removed ? "now()" : "NULL"} WHERE id = $1 AND user_id = $2`, [id, userId]);
  if (removed) await mirror(userId, id, null);
  else {
    const [e] = (await db().query("SELECT title_ct, note_ct, day::text AS day, to_char(starts, 'HH24:MI') AS starts, to_char(ends, 'HH24:MI') AS ends, repeat, until::text AS until FROM calendar_event WHERE id = $1 AND user_id = $2", [id, userId])).rows;
    if (e) await mirror(userId, id, { title: open(userId, e.title_ct as string), note: e.note_ct ? open(userId, e.note_ct as string) : null, day: e.day as string, starts: (e.starts as string | null) ?? null, ends: (e.ends as string | null) ?? null, repeat: e.repeat as CalEvent["repeat"], until: (e.until as string | null) ?? null });
  }
}

/** Events that can fall between two days: those starting by `to` that are repeating or start from `from` on. Filtered to a tile when given. */
export async function events(userId: string, from: string, to: string, tile?: CalTile | null): Promise<CalEvent[]> {
  const r = await db().query(
    `SELECT id, tile, title_ct, note_ct, day::text AS day, to_char(starts, 'HH24:MI') AS starts, to_char(ends, 'HH24:MI') AS ends, repeat, until::text AS until, record_id
     FROM calendar_event WHERE user_id = $1 AND removed_at IS NULL AND day <= $3 AND (day >= $2 OR (repeat <> 'none' AND (until IS NULL OR until >= $2)))${tile ? " AND tile = $4" : ""}`,
    tile ? [userId, from, to, tile] : [userId, from, to],
  );
  return r.rows.map((x) => ({
    id: x.id as string, tile: (x.tile as CalTile | null) ?? null, title: open(userId, x.title_ct as string), note: x.note_ct ? open(userId, x.note_ct as string) : null,
    day: x.day as string, starts: (x.starts as string | null) ?? null, ends: (x.ends as string | null) ?? null, repeat: x.repeat as CalEvent["repeat"], until: (x.until as string | null) ?? null, recordId: (x.record_id as string | null) ?? null,
  }));
}

/**
 * A calendar's events with the days the person's records hold (a date planned, an election, a duty due, a goal's
 * day, a birthday), so nothing is entered twice, and the events of the calendars they sync (subscribed calendars,
 * Google Calendar, migration 0043, and Outlook Calendar, migration 0045), read-only and marked with `feed`. Filtered
 * to a tile when given; the events the person said Going to in Events (migration 0050) show the same way. Google's and Outlook's events have no tile, so they show on the master calendar only. A synced calendar that cannot be read leaves the
 * rest showing.
 */
export async function calendar(userId: string, from: string, to: string, tile?: CalTile | null): Promise<CalEvent[]> {
  const none = () => [] as CalEvent[];
  const [own, records, subscribed, google, microsoft, going] = await Promise.all([
    events(userId, from, to, tile),
    !tile ? lifeRecords(userId) : isLifeApp(tile) ? lifeRecords(userId, tile) : Promise.resolve([]),
    feedCalEvents(userId, from, to, tile).catch(none),
    tile ? Promise.resolve([]) : googleCalEvents(userId, from, to).catch(none),
    tile ? Promise.resolve([]) : microsoftCalEvents(userId, from, to).catch(none),
    tile ? Promise.resolve([]) : goingCalEvents(userId, from, to).catch(none),
  ]);
  return [...own, ...recordEvents(records), ...subscribed, ...google, ...microsoft, ...going];
}
