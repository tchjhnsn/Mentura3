import { addDays, type CalEvent, type Repeat } from "@reflect/core/calendar";
import { wallIn } from "@reflect/core/ics";
import { db } from "@/db/pool";
import { later } from "./calendar-feeds";
import { open, seal } from "./crypto";
import { outsideFetch } from "@/server/outside";

// Google Calendar, two-way (migration 0043). Built, and dormant until the deployment holds GOOGLE_CLIENT_ID and
// GOOGLE_CLIENT_SECRET (read by name only); until then the connector says it needs setup and nothing here runs.
//
// - Connect: the OAuth 2.0 web flow (`/api/connect/google/start` and `/callback`), scope calendar.events, offline
//   access so a refresh token comes back. Tokens are sealed with the person's key.
// - Pull: the primary calendar's events, expanded by Google (singleEvents), from two months back to a year ahead,
//   cached sealed and pulled again at most every 15 minutes. They show read-only in Reflect's calendar.
// - Push: a Reflect event made after connecting is created in the primary calendar, marked with a private extended
//   property (`reflectId`) so the pull leaves it out; a change or removal in Reflect follows it there.
// Not built: changes made in Google to an event Reflect pushed do not come back into Reflect's own copy.

const SCOPE = "https://www.googleapis.com/auth/calendar.events";
const API = "https://www.googleapis.com/calendar/v3/calendars/primary/events";
const REFETCH_MS = 15 * 60_000;
const TIMEOUT_MS = 8_000;

/** True when the deployment holds the OAuth client's id and secret. */
export const googleReady = () => !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET;

/** Where Google sends the person back: the deployment's own origin, so it matches the redirect URI registered with Google. */
export const redirectUri = (origin: string) => `${origin}/api/connect/google/callback`;

export function authUrl(origin: string, state: string): string {
  const p = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID ?? "", redirect_uri: redirectUri(origin), response_type: "code", scope: SCOPE,
    access_type: "offline", prompt: "consent", include_granted_scopes: "true", state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${p}`;
}

type Tokens = { access_token: string; expires_in: number; refresh_token?: string };

async function tokenRequest(body: Record<string, string>): Promise<Tokens> {
  const res = await outsideFetch({ timeoutMs: TIMEOUT_MS })("https://oauth2.googleapis.com/token", {
    method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: process.env.GOOGLE_CLIENT_ID ?? "", client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "", ...body }),
  });
  if (!res.ok) throw new Error(`Google refused the sign-in (${res.status}).`);
  return (await res.json()) as Tokens;
}

/** Trades the callback's code for tokens and keeps them sealed. Connecting again keeps the old refresh token if Google sends none. */
export async function connectGoogle(userId: string, code: string, origin: string): Promise<void> {
  const t = await tokenRequest({ code, grant_type: "authorization_code", redirect_uri: redirectUri(origin) });
  await db().query(
    `INSERT INTO google_calendar (user_id, access_ct, refresh_ct, expires_at, connected_at) VALUES ($1, $2, $3, now() + make_interval(secs => $4), now())
     ON CONFLICT (user_id) DO UPDATE SET access_ct = EXCLUDED.access_ct, refresh_ct = COALESCE(EXCLUDED.refresh_ct, CASE WHEN google_calendar.removed_at IS NULL THEN google_calendar.refresh_ct END),
       expires_at = EXCLUDED.expires_at, connected_at = CASE WHEN google_calendar.removed_at IS NULL THEN google_calendar.connected_at ELSE now() END,
       removed_at = NULL, last_error = NULL, events_ct = NULL, last_fetched_at = NULL`,
    [userId, seal(userId, t.access_token), t.refresh_token ? seal(userId, t.refresh_token) : null, t.expires_in],
  );
}

export async function disconnectGoogle(userId: string): Promise<void> {
  const row = await db().query("SELECT refresh_ct FROM google_calendar WHERE user_id = $1 AND removed_at IS NULL", [userId]);
  const refresh = row.rows[0]?.refresh_ct as string | null | undefined;
  if (refresh) await outsideFetch({ timeoutMs: TIMEOUT_MS })(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(open(userId, refresh))}`, { method: "POST" }).catch(() => undefined);
  await db().query("UPDATE google_calendar SET removed_at = now(), access_ct = NULL, refresh_ct = NULL, events_ct = NULL WHERE user_id = $1", [userId]);
}

type Row = { access_ct: string | null; refresh_ct: string | null; expires_at: string | null; time_zone: string | null; events_ct: string | null; last_fetched_at: string | null; last_error: string | null; connected_at: string };

async function row(userId: string): Promise<Row | null> {
  if (!googleReady()) return null;
  const r = await db().query("SELECT access_ct, refresh_ct, expires_at, time_zone, events_ct, last_fetched_at, last_error, connected_at FROM google_calendar WHERE user_id = $1 AND removed_at IS NULL", [userId]);
  return (r.rows[0] as Row | undefined) ?? null;
}

/** Whether the person has connected Google Calendar, and its last error. Null when not connected or not set up. */
export async function googleState(userId: string): Promise<{ connectedAt: string; lastError: string | null } | null> {
  const r = await row(userId).catch(() => null);
  return r ? { connectedAt: new Date(r.connected_at).toISOString(), lastError: r.last_error } : null;
}

/** A live access token, refreshed when it is within a minute of expiring. */
async function accessToken(userId: string, r: Row): Promise<string> {
  if (r.access_ct && r.expires_at && new Date(r.expires_at).getTime() - Date.now() > 60_000) return open(userId, r.access_ct);
  if (!r.refresh_ct) throw new Error("Google Calendar needs connecting again.");
  const t = await tokenRequest({ grant_type: "refresh_token", refresh_token: open(userId, r.refresh_ct) });
  await db().query("UPDATE google_calendar SET access_ct = $2, expires_at = now() + make_interval(secs => $3) WHERE user_id = $1", [userId, seal(userId, t.access_token), t.expires_in]);
  return t.access_token;
}

async function call(token: string, url: string, init: RequestInit = {}): Promise<Response> {
  return outsideFetch({ timeoutMs: TIMEOUT_MS })(url, { ...init, headers: { authorization: `Bearer ${token}`, "content-type": "application/json", ...(init.headers ?? {}) } });
}

// ---- Pull ----

type GTime = { date?: string; dateTime?: string };
type GEvent = { id: string; status?: string; summary?: string; description?: string; start?: GTime; end?: GTime; extendedProperties?: { private?: Record<string, string> } };
/** A pulled event, as cached: only what the calendar shows. */
type Pulled = { id: string; title: string; note: string | null; start: GTime; end: GTime | null };

async function pull(userId: string, r: Row): Promise<{ zone: string | null; events: Pulled[] }> {
  const token = await accessToken(userId, r);
  const now = Date.now();
  const events: Pulled[] = [];
  let zone: string | null = null;
  let page: string | undefined;
  for (let i = 0; i < 5; i++) {
    const p = new URLSearchParams({ singleEvents: "true", orderBy: "startTime", maxResults: "2500", timeMin: new Date(now - 62 * 86400_000).toISOString(), timeMax: new Date(now + 366 * 86400_000).toISOString() });
    if (page) p.set("pageToken", page);
    const res = await call(token, `${API}?${p}`);
    if (!res.ok) throw new Error(`Google Calendar answered with an error (${res.status}).`);
    const body = (await res.json()) as { timeZone?: string; items?: GEvent[]; nextPageToken?: string };
    zone = body.timeZone ?? zone;
    for (const e of body.items ?? []) {
      if (e.status === "cancelled" || !e.start || e.extendedProperties?.private?.reflectId) continue; // Reflect's own pushes show from Reflect
      events.push({ id: e.id, title: (e.summary ?? "Busy").replace(/\s+/g, " ").trim().slice(0, 200) || "Busy", note: e.description?.trim().slice(0, 2000) || null, start: e.start, end: e.end ?? null });
    }
    page = body.nextPageToken;
    if (!page) break;
  }
  return { zone, events };
}

/** A pulled event as Reflect calendar events: times in the calendar's zone, a whole-day event over several days one a day. */
function toCal(e: Pulled, zone: string | null): CalEvent[] {
  const base = { tile: null, title: e.title, note: e.note, repeat: "none" as Repeat, until: null, recordId: null, feed: { id: "google", name: "Google Calendar" } };
  if (e.start.date) {
    const end = e.end?.date ?? addDays(e.start.date, 1);
    const out: CalEvent[] = [];
    for (let d = e.start.date, i = 0; d < end && i < 60; d = addDays(d, 1), i++) out.push({ ...base, id: `google:${e.id}${i ? `:${i}` : ""}`, day: d, starts: null, ends: null });
    return out;
  }
  const at = (iso: string) => (zone ? wallIn(Date.parse(iso), zone) : { day: iso.slice(0, 10), time: iso.slice(11, 19) });
  const s = at(e.start.dateTime!);
  const en = e.end?.dateTime ? at(e.end.dateTime) : null;
  return [{ ...base, id: `google:${e.id}`, day: s.day, starts: s.time.slice(0, 5), ends: en && en.day === s.day && en.time > s.time ? en.time.slice(0, 5) : null }];
}

/** The person's Google Calendar events from `from` through `to`, read-only; pulled again when the cache is over 15 minutes old. None when not connected. */
export async function googleCalEvents(userId: string, from: string, to: string): Promise<CalEvent[]> {
  const r = await row(userId);
  if (!r) return [];
  type Cache = { zone: string | null; events: Pulled[] };
  let cached: Cache | null = null;
  if (r.events_ct) { try { cached = JSON.parse(open(userId, r.events_ct)) as Cache; } catch { cached = null; } }
  const refresh = async (): Promise<Cache | null> => {
    try {
      const fresh = await pull(userId, r);
      await db().query("UPDATE google_calendar SET events_ct = $2, time_zone = COALESCE($3, time_zone), last_fetched_at = now(), last_error = NULL WHERE user_id = $1", [userId, seal(userId, JSON.stringify(fresh)), fresh.zone]);
      return fresh;
    } catch (e) {
      await db().query("UPDATE google_calendar SET last_fetched_at = now(), last_error = $2 WHERE user_id = $1", [userId, e instanceof Error ? e.message.slice(0, 300) : "Could not read Google Calendar."]).catch(() => undefined);
      return null;
    }
  };
  // As with subscribed calendars: a stale cache shows now and is pulled again after the response; no cache is pulled now.
  if (!r.last_fetched_at || Date.now() - new Date(r.last_fetched_at).getTime() > REFETCH_MS) {
    if (!(cached && later(refresh))) cached = (await refresh()) ?? cached;
  }
  if (!cached) return [];
  return cached.events.flatMap((e) => toCal(e, cached.zone ?? r.time_zone)).filter((e) => e.day >= from && e.day <= to);
}

// ---- Push ----

/** What Reflect sends for an event. */
export type PushInput = { title: string; note: string | null; day: string; starts: string | null; ends: string | null; repeat: Repeat; until: string | null };

function body(e: PushInput, zone: string, reflectId: string) {
  const plusHour = (t: string) => { const h = Number(t.slice(0, 2)) + 1; return h > 23 ? "23:59" : `${String(h).padStart(2, "0")}${t.slice(2)}`; };
  const start = e.starts ? { dateTime: `${e.day}T${e.starts}:00`, timeZone: zone } : { date: e.day };
  const end = e.starts ? { dateTime: `${e.day}T${e.ends ?? plusHour(e.starts)}:00`, timeZone: zone } : { date: addDays(e.day, 1) };
  const until = e.until ? (e.starts ? `;UNTIL=${e.until.replace(/-/g, "")}T235959Z` : `;UNTIL=${e.until.replace(/-/g, "")}`) : "";
  return {
    summary: e.title, description: e.note ?? undefined, start, end,
    ...(e.repeat !== "none" ? { recurrence: [`RRULE:FREQ=${e.repeat.toUpperCase()}${until}`] } : {}),
    extendedProperties: { private: { reflectId } },
  };
}

/**
 * Mirrors one Reflect event in Google Calendar: creates it (when it was made after connecting and has no Google
 * event yet), updates it, or deletes it when it is removed. Does nothing when Google Calendar is not connected.
 * Failures are kept as the connection's last error and never stop the change in Reflect.
 */
export async function mirrorToGoogle(userId: string, id: string, e: PushInput | null): Promise<void> {
  const r = await row(userId).catch(() => null);
  if (!r) return;
  try {
    const ev = await db().query("SELECT google_id, created_at FROM calendar_event WHERE id = $1 AND user_id = $2", [id, userId]);
    const googleId = (ev.rows[0]?.google_id as string | null | undefined) ?? null;
    const token = await accessToken(userId, r);
    if (!e) {
      if (googleId) {
        await call(token, `${API}/${encodeURIComponent(googleId)}`, { method: "DELETE" });
        await db().query("UPDATE calendar_event SET google_id = NULL WHERE id = $1 AND user_id = $2", [id, userId]);
      }
      return;
    }
    const payload = JSON.stringify(body(e, r.time_zone ?? "UTC", id));
    if (googleId) {
      const res = await call(token, `${API}/${encodeURIComponent(googleId)}`, { method: "PATCH", body: payload });
      if (!res.ok) throw new Error(`Google Calendar did not take the change (${res.status}).`);
      return;
    }
    if (!ev.rows[0] || new Date(ev.rows[0].created_at as string).getTime() < new Date(r.connected_at).getTime()) return; // only events made after connecting
    const res = await call(token, API, { method: "POST", body: payload });
    if (!res.ok) throw new Error(`Google Calendar did not take the event (${res.status}).`);
    const made = (await res.json()) as { id: string };
    await db().query("UPDATE calendar_event SET google_id = $3 WHERE id = $1 AND user_id = $2", [id, userId, made.id]);
  } catch (err) {
    await db().query("UPDATE google_calendar SET last_error = $2 WHERE user_id = $1", [userId, err instanceof Error ? err.message.slice(0, 300) : "Could not reach Google Calendar."]).catch(() => undefined);
  }
}

