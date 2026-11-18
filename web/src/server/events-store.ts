import { createHash, randomBytes } from "node:crypto";
import { austinDay, EDDY, fromEddy, type EventInput, type EventOut } from "@reflect/core/events";
import type { CalEvent } from "@reflect/core/calendar";
import { db } from "@/db/pool";

// Events (doc "Events and connections design guide", 2026-11-18; tables in migration 0050): the published events of a
// city from now through four weeks, Eddy's Austin feed kept fresh, Going, the people a person knows who are going,
// and events hosted in Reflect (a draft set one part at a time, then published). A published event is public, so its
// fields are not sealed. Check-in (the door) is web/src/server/connect-store.ts.

const UUID = /^[0-9a-f-]{36}$/;
const WEEKS = 4;
/** How old Eddy's newest row may be before a page load refreshes the feed. */
export const EDDY_FRESH_MS = 6 * 60 * 60 * 1000;
/** The title a draft starts with from the + on the Events page; the host renames it before Publish. */
export const DRAFT_TITLE = "New event";

/** Someone a person knows, as faces show them. */
export type Person = { id: string; name: string; image: string | null };

/** The parts of a hosted event the host sets one at a time, as the page and set_event_part name them. */
export const EVENT_PARTS = ["title", "starts_at", "ends_at", "venue", "address", "cover_url", "description", "for_whom", "tags"] as const;
export type EventPart = (typeof EVENT_PARTS)[number];
export const isEventPart = (v: unknown): v is EventPart => EVENT_PARTS.includes(v as EventPart);

/**
 * A part's value as the row keeps it, from what the person gave: text trimmed and bounded (empty clears it, except
 * the title), an instant for a start or end, an http(s) link for the cover, and tags as a trimmed list. Throws a plain
 * error naming what is wrong.
 */
export function cleanPart(part: EventPart, value: unknown): string | string[] | null {
  const text = typeof value === "string" ? value.trim() : Array.isArray(value) ? value.join(",") : value == null ? "" : String(value);
  switch (part) {
    case "title": {
      const t = text.replace(/\s+/g, " ").slice(0, 200);
      if (!t) throw new Error("Name the event.");
      return t;
    }
    case "starts_at":
    case "ends_at": {
      if (!text) return null;
      const t = Date.parse(text);
      if (Number.isNaN(t)) throw new Error("That is not a date and time.");
      return new Date(t).toISOString();
    }
    case "cover_url": {
      if (!text) return null;
      let u: URL;
      try { u = new URL(text); } catch { throw new Error("Give a link to a picture (https://...)."); }
      if (u.protocol !== "https:" && u.protocol !== "http:") throw new Error("Give a link to a picture (https://...).");
      return u.toString().slice(0, 2000);
    }
    case "tags": {
      const out: string[] = [];
      for (const t of text.split(",").map((x) => x.replace(/\s+/g, " ").trim().slice(0, 40))) if (t && !out.some((o) => o.toLowerCase() === t.toLowerCase())) out.push(t);
      return out.slice(0, 12);
    }
    case "description":
      return text ? text.slice(0, 8000) : null;
    default:
      return text ? text.replace(/\s+/g, " ").slice(0, 300) : null;
  }
}

/** Whether a draft can be published: the host named it and gave its start. */
export const canPublish = (e: Pick<EventOut, "title" | "startsAt" | "status">) => e.status === "draft" && !!e.startsAt && !!e.title.trim() && e.title !== DRAFT_TITLE;

/** Whether an event is over: past its end, or six hours after a start with no end. */
export function isPast(e: Pick<EventOut, "startsAt" | "endsAt">, now = new Date()): boolean {
  if (!e.startsAt) return false;
  const end = e.endsAt ? Date.parse(e.endsAt) : Date.parse(e.startsAt) + 6 * 60 * 60 * 1000;
  return end < now.getTime();
}

/** A door token for the host's check-in QR: the token to show once, and the sha256 hex the row keeps. */
export function newDoorToken(): { token: string; hash: string } {
  const token = randomBytes(32).toString("base64url");
  return { token, hash: hashToken(token) };
}
export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

const iso = (v: unknown) => (v == null ? null : new Date(v as string).toISOString());

/** A row of `event` as every page and action reads it. */
export function rowToEvent(x: Record<string, unknown>): EventOut {
  return {
    id: x.id as string,
    source: x.source as EventOut["source"],
    hostUser: (x.host_user as string | null) ?? null,
    status: x.status as EventOut["status"],
    title: x.title as string,
    description: (x.description as string | null) ?? null,
    startsAt: iso(x.starts_at),
    endsAt: iso(x.ends_at),
    venue: (x.venue as string | null) ?? null,
    address: (x.address as string | null) ?? null,
    url: (x.url as string | null) ?? null,
    coverUrl: (x.cover_url as string | null) ?? null,
    tags: Array.isArray(x.tags) ? (x.tags as string[]) : [],
    price: (x.price as string | null) ?? null,
    city: (x.city as string) ?? "austin",
    forWhom: (x.for_whom as string | null) ?? null,
  };
}

/** The muted line under an event: its price and tags, each once, without "In-Person" (every event here is). */
export function tagLine(e: Pick<EventOut, "tags" | "price">): string {
  const out: string[] = [];
  for (const t of [e.price, ...e.tags]) if (t && t !== "In-Person" && !out.some((o) => o.toLowerCase() === t.toLowerCase())) out.push(t);
  return out.join(" · ");
}

/** Whether an event carries a tag, ignoring case ("Free" also matches an event whose price is Free). */
export const hasTag = (e: Pick<EventOut, "tags" | "price">, tag: string) => {
  const t = tag.toLowerCase();
  return e.tags.some((x) => x.toLowerCase() === t) || (t === "free" && e.price === "Free");
};

/**
 * Events grouped by Austin day, in order, with hosted-in-Reflect events first in each day. With `today`, an event that
 * started on an earlier day and is still running is under today.
 */
export function byDay<E extends Pick<EventOut, "startsAt" | "source">>(list: readonly E[], today?: string): { day: string; events: E[] }[] {
  const days = new Map<string, E[]>();
  for (const e of list) {
    if (!e.startsAt) continue;
    const start = austinDay(e.startsAt);
    const d = today && start < today ? today : start;
    days.set(d, [...(days.get(d) ?? []), e]);
  }
  return [...days.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([day, events]) => ({
    day,
    events: [...events].sort((a, b) => (a.source === b.source ? Date.parse(a.startsAt!) - Date.parse(b.startsAt!) : a.source === "reflect" ? -1 : 1)),
  }));
}

/** An event the person is going to, as the calendar shows it: read-only, on its Austin day and time, opening its page. */
export function toCalEvent(e: Pick<EventOut, "id" | "title" | "startsAt" | "endsAt" | "venue">): CalEvent | null {
  if (!e.startsAt) return null;
  const hm = (v: string) => new Intl.DateTimeFormat("en-GB", { timeZone: "America/Chicago", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(v));
  const day = austinDay(e.startsAt);
  const ends = e.endsAt && austinDay(e.endsAt) === day ? hm(e.endsAt) : null;
  return { id: `event:${e.id}`, tile: null, title: e.title, note: e.venue, day, starts: hm(e.startsAt), ends, repeat: "none", until: null, recordId: null, feed: { id: "events", name: "Events" } };
}

const COLUMNS = "id, source, host_user, status, title, description, starts_at, ends_at, venue, address, url, cover_url, tags, price, city, for_whom";

/** Published events in a city from `from` through four weeks on, by start; filtered to a tag or an Austin day when given. */
export async function upcomingEvents(opts: { city?: string; from?: Date; tag?: string | null; day?: string | null; limit?: number } = {}): Promise<EventOut[]> {
  const from = opts.from ?? new Date();
  const to = new Date(from.getTime() + WEEKS * 7 * 86400_000);
  const r = await db().query(
    `SELECT ${COLUMNS} FROM event WHERE city = $1 AND status = 'published' AND starts_at IS NOT NULL
       AND COALESCE(ends_at, starts_at + interval '6 hours') >= $2 AND starts_at <= $3 ORDER BY starts_at LIMIT $4`,
    [opts.city ?? "austin", from.toISOString(), to.toISOString(), Math.max(1, Math.min(opts.limit ?? 500, 1000))],
  );
  let list = r.rows.map(rowToEvent);
  if (opts.tag) list = list.filter((e) => hasTag(e, opts.tag!));
  if (opts.day) list = list.filter((e) => austinDay(e.startsAt!) === opts.day);
  return list;
}

/** One event: any published or cancelled event, and a draft only for its host. */
export async function eventById(id: string, viewer: string | null): Promise<EventOut | null> {
  if (!UUID.test(id)) return null;
  const r = await db().query(`SELECT ${COLUMNS} FROM event WHERE id = $1`, [id]);
  const e = r.rows[0] ? rowToEvent(r.rows[0]) : null;
  return e && (e.status !== "draft" || e.hostUser === viewer) ? e : null;
}

/** The person's own drafts, newest first. */
export async function draftsOf(userId: string): Promise<EventOut[]> {
  const r = await db().query(`SELECT ${COLUMNS} FROM event WHERE host_user = $1 AND status = 'draft' ORDER BY created_at DESC LIMIT 20`, [userId]);
  return r.rows.map(rowToEvent);
}

/** A member's name and face. */
export async function personOf(userId: string): Promise<Person | null> {
  const r = await db().query<{ id: string; name: string | null; image: string | null }>('SELECT id, name, image FROM "user" WHERE id = $1', [userId]);
  const u = r.rows[0];
  return u ? { id: u.id, name: u.name?.trim() || "A member", image: u.image ?? null } : null;
}

// Eddy's feed.

type Fetch = (url: string, init?: RequestInit) => Promise<Response>;

/** Every event of Eddy's feed, page by page while it says hasMore (at most 20 pages of 200). */
export async function fetchEddy(fetcher: Fetch = fetch): Promise<EventInput[]> {
  const out: EventInput[] = [];
  for (let offset = 0, page = 0; page < 20; page++) {
    const res = await fetcher(`${EDDY.api}?limit=200&offset=${offset}`, { headers: { accept: "application/json" }, signal: AbortSignal.timeout(10_000) });
    if (!res.ok) throw new Error(`Eddy's feed answered ${res.status}.`);
    const body = (await res.json()) as { events?: unknown[]; hasMore?: boolean };
    const events = Array.isArray(body.events) ? body.events : [];
    for (const raw of events) {
      const e = fromEddy(raw);
      if (e) out.push(e);
    }
    if (!body.hasMore || !events.length) break;
    offset += events.length;
  }
  return out;
}

/** Fetches Eddy's feed and upserts each event on (source, source_id), updating its fields. Returns how many it kept. */
export async function syncEddy(fetcher: Fetch = fetch): Promise<number> {
  const list = await fetchEddy(fetcher);
  if (!list.length) return 0;
  const rows = list.map((e) => ({
    source_id: e.sourceId, title: e.title, description: e.description, starts_at: e.startsAt, ends_at: e.endsAt, venue: e.venue, address: e.address,
    url: e.url, cover_url: e.coverUrl, tags: e.tags, price: e.price, city: e.city,
  }));
  await db().query(
    `INSERT INTO event (source, source_id, title, description, starts_at, ends_at, venue, address, url, cover_url, tags, price, city)
     SELECT 'eddy', x.source_id, x.title, x.description, x.starts_at, x.ends_at, x.venue, x.address, x.url, x.cover_url, COALESCE(x.tags, '{}'), x.price, x.city
       FROM jsonb_to_recordset($1::jsonb) AS x(source_id text, title text, description text, starts_at timestamptz, ends_at timestamptz, venue text, address text, url text, cover_url text, tags text[], price text, city text)
     ON CONFLICT (source, source_id) WHERE source_id IS NOT NULL DO UPDATE SET
       title = EXCLUDED.title, description = EXCLUDED.description, starts_at = EXCLUDED.starts_at, ends_at = EXCLUDED.ends_at, venue = EXCLUDED.venue,
       address = EXCLUDED.address, url = EXCLUDED.url, cover_url = EXCLUDED.cover_url, tags = EXCLUDED.tags, price = EXCLUDED.price, city = EXCLUDED.city, updated_at = now()`,
    [JSON.stringify(rows)],
  );
  await db().query("UPDATE event SET updated_at = now() WHERE source = 'eddy'"); // the feed was read now, even where nothing changed
  return rows.length;
}

let inFlight: Promise<number> | null = null;

/**
 * Refreshes Eddy's feed when its newest row is older than six hours, waiting at most `waitMs`. Never throws: it says
 * whether the feed could not be reached, so the page shows hosted events and one line saying so.
 */
export async function refreshEddy(waitMs = 3000): Promise<{ down: boolean }> {
  try {
    const r = await db().query<{ at: string | null }>("SELECT max(updated_at) AS at FROM event WHERE source = 'eddy'");
    const at = r.rows[0]?.at ? Date.parse(r.rows[0].at) : 0;
    if (Date.now() - at < EDDY_FRESH_MS) return { down: false };
    inFlight ??= syncEddy().finally(() => { inFlight = null; });
    const run = inFlight.then(() => ({ down: false }), () => ({ down: true }));
    // Still running after the wait: the page shows what it has, and the feed lands for the next load.
    return await Promise.race([run, new Promise<{ down: boolean }>((ok) => setTimeout(() => ok({ down: at === 0 }), waitMs))]);
  } catch {
    return { down: true };
  }
}

// Going.

/** Whether the person said Going to an event. */
export async function isGoing(userId: string, eventId: string): Promise<boolean> {
  if (!UUID.test(eventId)) return false;
  const r = await db().query("SELECT 1 FROM event_rsvp WHERE event_id = $1 AND user_id = $2", [eventId, userId]);
  return r.rows.length > 0;
}

/** The ids of the events the person said Going to, of those given. */
export async function goingAmong(userId: string, eventIds: readonly string[]): Promise<Set<string>> {
  const ids = eventIds.filter((i) => UUID.test(i));
  if (!ids.length) return new Set();
  const r = await db().query<{ event_id: string }>("SELECT event_id FROM event_rsvp WHERE user_id = $1 AND event_id = ANY($2::uuid[])", [userId, ids]);
  return new Set(r.rows.map((x) => x.event_id));
}

/** Says Going (or takes it back) for a published event that is not over. */
export async function setGoing(userId: string, eventId: string, going: boolean): Promise<void> {
  if (going) {
    const e = await eventById(eventId, userId);
    if (!e || e.status !== "published") throw new Error(e?.status === "cancelled" ? "This event was cancelled." : "No such event.");
    if (isPast(e)) throw new Error("This event is over.");
    await db().query("INSERT INTO event_rsvp (event_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", [eventId, userId]);
  } else if (UUID.test(eventId)) {
    await db().query("DELETE FROM event_rsvp WHERE event_id = $1 AND user_id = $2", [eventId, userId]);
  }
}

/** For each event given, the people the person is friends with (friend_link, migration 0047) who said Going. */
export async function knownGoing(userId: string, eventIds: readonly string[]): Promise<Map<string, Person[]>> {
  const ids = eventIds.filter((i) => UUID.test(i));
  const out = new Map<string, Person[]>();
  if (!ids.length) return out;
  const r = await db().query<{ event_id: string; id: string; name: string | null; image: string | null }>(
    `SELECT DISTINCT r.event_id, u.id, u.name, u.image FROM event_rsvp r
       JOIN friend_link f ON (f.user_a = $1 AND f.user_b = r.user_id) OR (f.user_b = $1 AND f.user_a = r.user_id)
       JOIN "user" u ON u.id = r.user_id
     WHERE r.event_id = ANY($2::uuid[]) ORDER BY u.name`,
    [userId, ids],
  );
  for (const x of r.rows) out.set(x.event_id, [...(out.get(x.event_id) ?? []), { id: x.id, name: x.name?.trim() || "A member", image: x.image ?? null }]);
  return out;
}

/** The person's next published event they said Going to that is not over. */
export async function nextGoing(userId: string): Promise<EventOut | null> {
  const r = await db().query(
    `SELECT ${COLUMNS.split(", ").map((c) => `e.${c}`).join(", ")} FROM event_rsvp r JOIN event e ON e.id = r.event_id
     WHERE r.user_id = $1 AND e.status = 'published' AND e.starts_at IS NOT NULL AND COALESCE(e.ends_at, e.starts_at + interval '6 hours') >= now()
     ORDER BY e.starts_at LIMIT 1`,
    [userId],
  );
  return r.rows[0] ? rowToEvent(r.rows[0]) : null;
}

/** The events the person is going to between two days, as calendar events (the calendar reads them from here). */
export async function goingCalEvents(userId: string, from: string, to: string): Promise<CalEvent[]> {
  const r = await db().query(
    `SELECT e.id, e.title, e.starts_at, e.ends_at, e.venue FROM event_rsvp r JOIN event e ON e.id = r.event_id
     WHERE r.user_id = $1 AND e.status = 'published' AND e.starts_at >= ($2::date - interval '1 day') AND e.starts_at < ($3::date + interval '2 days')`,
    [userId, from, to],
  );
  return r.rows.map((x) => toCalEvent({ id: x.id, title: x.title, startsAt: iso(x.starts_at), endsAt: iso(x.ends_at), venue: x.venue })).filter((e): e is CalEvent => !!e && e.day >= from && e.day <= to);
}

// Hosting.

/** Creates a draft for the host; returns its id. */
export async function createDraft(userId: string, d: { title?: string | null; startsAt?: string | null }): Promise<string> {
  const title = d.title ? (cleanPart("title", d.title) as string) : DRAFT_TITLE;
  const starts = d.startsAt ? (cleanPart("starts_at", d.startsAt) as string) : null;
  const r = await db().query("INSERT INTO event (source, host_user, status, title, starts_at) VALUES ('reflect', $1, 'draft', $2, $3) RETURNING id", [userId, title, starts]);
  return r.rows[0].id as string;
}

/** Removes the host's draft (Undo of host_event); a published event is not removed. */
export async function removeDraft(userId: string, id: string): Promise<void> {
  if (!UUID.test(id)) return;
  await db().query("DELETE FROM event WHERE id = $1 AND host_user = $2 AND status = 'draft'", [id, userId]);
}

/** One of the host's own events (draft or published), or an error. */
export async function hostedEvent(userId: string, id: string): Promise<EventOut> {
  const e = await eventById(id, userId);
  if (!e || e.hostUser !== userId) throw new Error("No such event of yours.");
  return e;
}

const partOf = (e: EventOut, part: EventPart): string | string[] | null => {
  const map: Record<EventPart, string | string[] | null> = { title: e.title, starts_at: e.startsAt, ends_at: e.endsAt, venue: e.venue, address: e.address, cover_url: e.coverUrl, description: e.description, for_whom: e.forWhom, tags: e.tags };
  return map[part];
};

/** Sets one part of the host's event; returns the part's value before, for Undo. */
export async function setEventPart(userId: string, id: string, part: EventPart, value: unknown): Promise<{ before: string | string[] | null; after: string | string[] | null }> {
  if (!isEventPart(part)) throw new Error("No such part.");
  const e = await hostedEvent(userId, id);
  if (e.status === "cancelled") throw new Error("This event was cancelled.");
  const after = cleanPart(part, value);
  if (part === "starts_at" && !after && e.status !== "draft") throw new Error("Give the start.");
  const startsAt = part === "starts_at" ? (after as string) : e.startsAt;
  const endsAt = part === "ends_at" ? (after as string | null) : e.endsAt;
  if (startsAt && endsAt && Date.parse(endsAt) <= Date.parse(startsAt)) throw new Error("An event ends after it starts.");
  // The column name comes from EVENT_PARTS only.
  await db().query(`UPDATE event SET ${part} = $3, updated_at = now() WHERE id = $1 AND host_user = $2`, [id, userId, after]);
  return { before: partOf(e, part), after };
}

/** Publishes the host's draft and makes its door token; returns the token, which is shown once (only its hash is kept). */
export async function publishEvent(userId: string, id: string): Promise<string> {
  const e = await hostedEvent(userId, id);
  if (!canPublish(e)) throw new Error(e.status !== "draft" ? "This event is already published." : "Name the event and give its start first.");
  const { token, hash } = newDoorToken();
  await db().query("UPDATE event SET status = 'published', door_token_hash = $3, updated_at = now() WHERE id = $1 AND host_user = $2 AND status = 'draft'", [id, userId, hash]);
  return token;
}

/** Makes a new door token for the host's published event (the old QR stops working); returns it, or null when not theirs. */
export async function resetDoorToken(userId: string, id: string): Promise<string | null> {
  if (!UUID.test(id)) return null;
  const { token, hash } = newDoorToken();
  const r = await db().query("UPDATE event SET door_token_hash = $3, updated_at = now() WHERE id = $1 AND host_user = $2 AND status = 'published' RETURNING id", [id, userId, hash]);
  return r.rows.length ? token : null;
}

/** Cancels the host's published event; it stays visible with a line saying so. */
export async function cancelEvent(userId: string, id: string): Promise<void> {
  await hostedEvent(userId, id);
  await db().query("UPDATE event SET status = 'cancelled', door_token_hash = NULL, updated_at = now() WHERE id = $1 AND host_user = $2 AND status = 'published'", [id, userId]);
}

// Times as the host types them: a date and time on Austin's clock.

/** An instant as Austin's clock reads it, as a datetime-local input takes it ("2026-12-03T18:00"). */
export function austinLocal(isoValue: string): string {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: "America/Chicago", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date(isoValue)).map((x) => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}

/** A date and time on Austin's clock ("2026-12-03T18:00") as an instant, or null when it is not one. */
export function fromAustinLocal(local: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(local)) return null;
  const asUtc = Date.parse(`${local}:00Z`);
  if (Number.isNaN(asUtc)) return null;
  // Austin is UTC-5 or UTC-6; take the offset that reads back as the same clock time.
  for (const h of [6, 5]) {
    const t = new Date(asUtc + h * 3600_000).toISOString();
    if (austinLocal(t) === local) return t;
  }
  return new Date(asUtc + 6 * 3600_000).toISOString();
}
