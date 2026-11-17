import { randomUUID } from "node:crypto";
import { isIP } from "node:net";
import { after } from "next/server";
import { isCalTile, type CalEvent, type CalTile } from "@reflect/core/calendar";
import { feedEvents as toCalEvents, feedUrl, parseIcs, type IcsCalendar } from "@reflect/core/ics";
import { db } from "@/db/pool";
import { open, seal } from "./crypto";

// Calendar subscriptions (migration 0043, `@reflect/core/ics`): calendars the person subscribes to by their iCalendar
// address, read-only in Reflect's calendar. The address is a secret, so it is sealed and never logged or shown after
// it is saved; only its host is. Each calendar is fetched on the server, https only, with a time limit and a size
// cap, and fetched again at most every 15 minutes; between fetches its parsed events are read from the sealed cache.

const REFETCH_MS = 15 * 60_000;
const TIMEOUT_MS = 8_000;
const MAX_BYTES = 3 * 1024 * 1024;
const MAX_FEEDS = 20;

export type Feed = { id: string; name: string; host: string; tile: CalTile | null; lastFetchedAt: string | null; lastError: string | null };

/** No address that names this machine or a private network, so a pasted address cannot reach inside the deployment. */
function privateHost(host: string): boolean {
  const h = host.replace(/^\[|\]$/g, "").toLowerCase();
  if (h === "localhost" || h.endsWith(".localhost") || h.endsWith(".local") || h.endsWith(".internal")) return true;
  if (isIP(h) === 4) {
    const [a, b] = h.split(".").map(Number) as [number, number];
    return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127);
  }
  if (isIP(h) === 6) return h === "::1" || h === "::" || h.startsWith("fc") || h.startsWith("fd") || h.startsWith("fe80") || h.startsWith("::ffff:");
  return false;
}

/**
 * Fetches a calendar's text: https only, no private hosts, at most three redirects (each checked again), a time
 * limit, and a size cap. Errors say what went wrong without the address.
 */
export async function fetchIcs(raw: string): Promise<string> {
  let url = feedUrl(raw);
  if (!url) throw new Error("Paste a calendar address that starts with https:// or webcal://.");
  for (let hop = 0; hop < 4; hop++) {
    if (privateHost(url.hostname)) throw new Error("That address is not a public calendar.");
    let res: Response;
    try {
      res = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(TIMEOUT_MS), headers: { accept: "text/calendar, text/plain;q=0.5" }, cache: "no-store" });
    } catch {
      throw new Error(`${url.hostname} did not answer in time.`);
    }
    if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
      const next = feedUrl(new URL(res.headers.get("location")!, url).href);
      if (!next) throw new Error(`${url.hostname} sent Reflect to an address that is not https.`);
      url = next;
      continue;
    }
    if (!res.ok || !res.body) throw new Error(res.status === 404 || res.status === 403 || res.status === 401 ? `${url.hostname} does not share a calendar at that address.` : `${url.hostname} answered with an error (${res.status}).`);
    if (Number(res.headers.get("content-length") ?? 0) > MAX_BYTES) throw new Error("That calendar is too large to read.");
    const reader = res.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BYTES) { await reader.cancel(); throw new Error("That calendar is too large to read."); }
      chunks.push(value);
    }
    const text = new TextDecoder().decode(Buffer.concat(chunks));
    if (!/BEGIN:VCALENDAR/i.test(text.slice(0, 4096))) throw new Error("That address does not give a calendar in iCal format.");
    return text;
  }
  throw new Error("That address redirects too many times.");
}

/** The parsed calendar, trimmed to what the view can show: events that end within the last year, and every repeat. */
function trim(cal: IcsCalendar): IcsCalendar {
  const yearAgo = new Date(Date.now() - 366 * 86400_000).toISOString().slice(0, 10);
  return { ...cal, events: cal.events.filter((e) => e.rule || e.recurrenceId || (e.end?.day ?? e.start.day) >= yearAgo) };
}

/** The person's subscribed calendars, newest last. */
export async function feeds(userId: string): Promise<Feed[]> {
  const r = await db().query(
    "SELECT id, name_ct, host, tile, last_fetched_at, last_error FROM calendar_feed WHERE user_id = $1 AND removed_at IS NULL ORDER BY created_at",
    [userId],
  );
  return r.rows.map((x) => ({
    id: x.id as string, name: open(userId, x.name_ct as string), host: x.host as string, tile: (x.tile as CalTile | null) ?? null,
    lastFetchedAt: x.last_fetched_at ? new Date(x.last_fetched_at as string).toISOString() : null, lastError: (x.last_error as string | null) ?? null,
  }));
}

/** Subscribes to a calendar: fetches it once to check it is one, then keeps its address sealed. Named by the person, or by the calendar itself, or by its host. */
export async function addFeed(userId: string, input: { url: unknown; name?: unknown; tile?: unknown }): Promise<string> {
  const raw = typeof input.url === "string" ? input.url.trim() : "";
  const url = feedUrl(raw);
  if (!url) throw new Error("Paste a calendar address that starts with https:// or webcal://.");
  const count = await db().query("SELECT count(*)::int AS n FROM calendar_feed WHERE user_id = $1 AND removed_at IS NULL", [userId]);
  if ((count.rows[0]?.n as number) >= MAX_FEEDS) throw new Error(`Reflect keeps up to ${MAX_FEEDS} calendars. Remove one first.`);
  const cal = trim(parseIcs(await fetchIcs(url.href)));
  const given = typeof input.name === "string" ? input.name.replace(/\s+/g, " ").trim().slice(0, 100) : "";
  const name = given || cal.name || url.hostname;
  const id = randomUUID();
  await db().query(
    "INSERT INTO calendar_feed (id, user_id, name_ct, url_ct, host, tile, events_ct, last_fetched_at) VALUES ($1, $2, $3, $4, $5, $6, $7, now())",
    [id, userId, seal(userId, name), seal(userId, url.href), url.hostname, isCalTile(input.tile) ? input.tile : null, seal(userId, JSON.stringify(cal))],
  );
  return id;
}

export async function removeFeed(userId: string, id: string): Promise<void> {
  // The sealed address and events are dropped with the subscription; only the row's removal is kept.
  await db().query("UPDATE calendar_feed SET removed_at = now(), url_ct = '', events_ct = NULL WHERE id = $1 AND user_id = $2", [id, userId]);
}

/** Runs work after the response is sent (Next's `after`); false outside a request, where the caller does it now. */
export function later(work: () => Promise<unknown>): boolean {
  try {
    after(() => work().then(() => undefined));
    return true;
  } catch {
    return false;
  }
}

/** Fetches one calendar again and caches it; on failure the old events stay and the error is kept to show. */
async function refresh(userId: string, id: string, urlCt: string): Promise<IcsCalendar | null> {
  try {
    const cal = trim(parseIcs(await fetchIcs(open(userId, urlCt))));
    await db().query("UPDATE calendar_feed SET events_ct = $3, last_fetched_at = now(), last_error = NULL WHERE id = $1 AND user_id = $2", [id, userId, seal(userId, JSON.stringify(cal))]);
    return cal;
  } catch (e) {
    const msg = e instanceof Error ? e.message.slice(0, 300) : "Could not read the calendar.";
    await db().query("UPDATE calendar_feed SET last_fetched_at = now(), last_error = $3 WHERE id = $1 AND user_id = $2", [id, userId, msg]).catch(() => undefined);
    return null;
  }
}

/**
 * The events of the person's subscribed calendars from `from` through `to`, read-only, each marked with its calendar.
 * A calendar fetched more than 15 minutes ago is fetched again first. Filtered to a tile when given: a calendar
 * tagged with that tile.
 */
export async function feedCalEvents(userId: string, from: string, to: string, tile?: CalTile | null): Promise<CalEvent[]> {
  const r = await db().query(
    `SELECT id, name_ct, url_ct, tile, events_ct, last_fetched_at FROM calendar_feed WHERE user_id = $1 AND removed_at IS NULL${tile ? " AND tile = $2" : ""}`,
    tile ? [userId, tile] : [userId],
  );
  const lists = await Promise.all(r.rows.map(async (x) => {
    const stale = !x.last_fetched_at || Date.now() - new Date(x.last_fetched_at as string).getTime() > REFETCH_MS;
    let cal: IcsCalendar | null = null;
    if (x.events_ct) { try { cal = JSON.parse(open(userId, x.events_ct as string)) as IcsCalendar; } catch { cal = null; } }
    // A stale calendar with a cache shows the cache now and is fetched after the response; one with none is fetched now.
    if (stale) {
      const again = () => refresh(userId, x.id as string, x.url_ct as string);
      if (!(cal && later(again))) cal = (await again()) ?? cal;
    }
    if (!cal) return [];
    return toCalEvents(cal, { id: x.id as string, name: open(userId, x.name_ct as string), tile: (x.tile as CalTile | null) ?? null }, from, to);
  }));
  return lists.flat();
}
