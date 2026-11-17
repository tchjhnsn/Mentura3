import { createHash, randomBytes } from "node:crypto";
import { addDays, type CalEvent, type Repeat } from "@reflect/core/calendar";
import { db } from "@/db/pool";
import { later } from "./calendar-feeds";
import { open, seal } from "./crypto";
import type { PushInput } from "./google-calendar";

// Outlook Calendar through Microsoft Graph, two-way (migration 0045). It mirrors Google Calendar
// (`google-calendar.ts`): built, and dormant until the deployment holds MICROSOFT_CLIENT_ID and
// MICROSOFT_CLIENT_SECRET (read by name only); until then the connector says it needs setup and nothing here runs.
//
// - Connect: the Microsoft identity platform's OAuth 2.0 authorization code flow with PKCE
//   (`/api/connect/microsoft/start` and `/callback`), the `common` endpoint so work, school and personal Microsoft
//   accounts all sign in. Scopes: offline_access (a refresh token), Calendars.ReadWrite, User.Read (sign-in), and
//   MailboxSettings.Read, only to read the mailbox's time zone, so times are read and written in the person's zone.
//   Tokens are sealed with the person's key; Microsoft rotates the refresh token on each refresh and the new one is kept.
// - Pull: the default calendar's events through /me/calendarView (Graph expands repeats), from two months back to a
//   year ahead, in the mailbox's zone, cached sealed and pulled again at most every 15 minutes. Read-only in Reflect.
// - Push: a Reflect event made after connecting is created with /me/events, marked with a single-value extended
//   property (`reflectId`) so the pull leaves it out; a change or removal in Reflect follows it there.
// Not built: changes made in Outlook to an event Reflect pushed do not come back into Reflect's own copy. Microsoft has
// no endpoint to revoke one app's refresh token, so Disconnect drops the tokens; the person removes Reflect's access
// at their Microsoft account's apps page.

const LOGIN = "https://login.microsoftonline.com/common/oauth2/v2.0";
const GRAPH = "https://graph.microsoft.com/v1.0";
export const SCOPE = "offline_access User.Read Calendars.ReadWrite MailboxSettings.Read";
/** A named MAPI property in Reflect's own property set: holds the Reflect event id on events Reflect pushed. */
export const REFLECT_PROP = "String {7c3f2a9e-5d41-4b8a-9e62-3f0d8c1b7a54} Name reflectId";
const REFETCH_MS = 15 * 60_000;
const TIMEOUT_MS = 8_000;

/** True when the deployment holds the app registration's client id and secret. */
export const microsoftReady = () => !!process.env.MICROSOFT_CLIENT_ID && !!process.env.MICROSOFT_CLIENT_SECRET;

/** Where Microsoft sends the person back: the deployment's own origin, so it matches the redirect URI registered in Azure. */
export const redirectUri = (origin: string) => `${origin}/api/connect/microsoft/callback`;

/** A PKCE pair (RFC 7636): the verifier stays in an httpOnly cookie, the S256 challenge goes to Microsoft. */
export function pkce(): { verifier: string; challenge: string } {
  const verifier = randomBytes(32).toString("base64url");
  return { verifier, challenge: createHash("sha256").update(verifier).digest("base64url") };
}

export function authUrl(origin: string, state: string, challenge: string): string {
  const p = new URLSearchParams({
    client_id: process.env.MICROSOFT_CLIENT_ID ?? "", response_type: "code", redirect_uri: redirectUri(origin), response_mode: "query",
    scope: SCOPE, state, code_challenge: challenge, code_challenge_method: "S256", prompt: "select_account",
  });
  return `${LOGIN}/authorize?${p}`;
}

type Tokens = { access_token: string; expires_in: number; refresh_token?: string };
type Fetch = typeof fetch;

async function tokenRequest(body: Record<string, string>, f: Fetch = fetch): Promise<Tokens> {
  const res = await f(`${LOGIN}/token`, {
    method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, signal: AbortSignal.timeout(TIMEOUT_MS),
    body: new URLSearchParams({ client_id: process.env.MICROSOFT_CLIENT_ID ?? "", client_secret: process.env.MICROSOFT_CLIENT_SECRET ?? "", scope: SCOPE, ...body }),
  });
  if (!res.ok) throw new Error(`Microsoft refused the sign-in (${res.status}).`);
  return (await res.json()) as Tokens;
}

/** The tokens as kept, opened. */
export type Held = { access: string | null; refresh: string | null; expiresAt: number | null };

/**
 * A live access token: the held one while it has more than a minute left, else a new one from the refresh token.
 * `renewed` carries what to keep when it refreshed (Microsoft may send a new refresh token; the old one is kept when it does not).
 */
export async function liveToken(held: Held, now: number, f: Fetch = fetch): Promise<{ token: string; renewed: { access: string; refresh: string; expiresIn: number } | null }> {
  if (held.access && held.expiresAt && held.expiresAt - now > 60_000) return { token: held.access, renewed: null };
  if (!held.refresh) throw new Error("Outlook Calendar needs connecting again.");
  const t = await tokenRequest({ grant_type: "refresh_token", refresh_token: held.refresh }, f);
  return { token: t.access_token, renewed: { access: t.access_token, refresh: t.refresh_token ?? held.refresh, expiresIn: t.expires_in } };
}

async function call(token: string, url: string, init: RequestInit = {}, f: Fetch = fetch): Promise<Response> {
  return f(url, { ...init, signal: AbortSignal.timeout(TIMEOUT_MS), headers: { authorization: `Bearer ${token}`, "content-type": "application/json", ...(init.headers ?? {}) } });
}

/** The mailbox's time zone (Windows or IANA name, as the mailbox keeps it); UTC when it cannot be read. */
async function mailboxZone(token: string): Promise<string> {
  const res = await call(token, `${GRAPH}/me/mailboxSettings/timeZone`).catch(() => null);
  if (!res?.ok) return "UTC";
  const b = (await res.json()) as { value?: string };
  return b.value?.trim() || "UTC";
}

/** Trades the callback's code (with the PKCE verifier) for tokens, reads the mailbox's zone, and keeps them sealed. */
export async function connectMicrosoft(userId: string, code: string, verifier: string, origin: string): Promise<void> {
  const t = await tokenRequest({ code, grant_type: "authorization_code", redirect_uri: redirectUri(origin), code_verifier: verifier });
  const zone = await mailboxZone(t.access_token);
  await db().query(
    `INSERT INTO microsoft_calendar (user_id, access_ct, refresh_ct, expires_at, time_zone, connected_at) VALUES ($1, $2, $3, now() + make_interval(secs => $4), $5, now())
     ON CONFLICT (user_id) DO UPDATE SET access_ct = EXCLUDED.access_ct, refresh_ct = COALESCE(EXCLUDED.refresh_ct, CASE WHEN microsoft_calendar.removed_at IS NULL THEN microsoft_calendar.refresh_ct END),
       expires_at = EXCLUDED.expires_at, time_zone = EXCLUDED.time_zone, connected_at = CASE WHEN microsoft_calendar.removed_at IS NULL THEN microsoft_calendar.connected_at ELSE now() END,
       removed_at = NULL, last_error = NULL, events_ct = NULL, last_fetched_at = NULL`,
    [userId, seal(userId, t.access_token), t.refresh_token ? seal(userId, t.refresh_token) : null, t.expires_in, zone],
  );
}

export async function disconnectMicrosoft(userId: string): Promise<void> {
  await db().query("UPDATE microsoft_calendar SET removed_at = now(), access_ct = NULL, refresh_ct = NULL, events_ct = NULL WHERE user_id = $1", [userId]);
}

type Row = { access_ct: string | null; refresh_ct: string | null; expires_at: string | null; time_zone: string | null; events_ct: string | null; last_fetched_at: string | null; last_error: string | null; connected_at: string };

async function row(userId: string): Promise<Row | null> {
  if (!microsoftReady()) return null;
  const r = await db().query("SELECT access_ct, refresh_ct, expires_at, time_zone, events_ct, last_fetched_at, last_error, connected_at FROM microsoft_calendar WHERE user_id = $1 AND removed_at IS NULL", [userId]);
  return (r.rows[0] as Row | undefined) ?? null;
}

/** Whether the person has connected Outlook Calendar, and its last error. Null when not connected or not set up. */
export async function microsoftState(userId: string): Promise<{ connectedAt: string; lastError: string | null } | null> {
  const r = await row(userId).catch(() => null);
  return r ? { connectedAt: new Date(r.connected_at).toISOString(), lastError: r.last_error } : null;
}

async function accessToken(userId: string, r: Row): Promise<string> {
  const held: Held = { access: r.access_ct ? open(userId, r.access_ct) : null, refresh: r.refresh_ct ? open(userId, r.refresh_ct) : null, expiresAt: r.expires_at ? new Date(r.expires_at).getTime() : null };
  const { token, renewed } = await liveToken(held, Date.now());
  if (renewed) {
    await db().query("UPDATE microsoft_calendar SET access_ct = $2, refresh_ct = $3, expires_at = now() + make_interval(secs => $4) WHERE user_id = $1",
      [userId, seal(userId, renewed.access), seal(userId, renewed.refresh), renewed.expiresIn]);
  }
  return token;
}

// ---- Pull ----

/** Graph's dateTimeTimeZone; read with `Prefer: outlook.timezone`, so dateTime is a wall time in the mailbox's zone. */
type MTime = { dateTime: string; timeZone?: string };
export type GraphEvent = {
  id: string; subject?: string | null; body?: { contentType?: string; content?: string | null } | null; bodyPreview?: string | null;
  start?: MTime | null; end?: MTime | null; isAllDay?: boolean; isCancelled?: boolean;
  singleValueExtendedProperties?: { id: string; value: string }[];
};
/** A pulled event, as cached: only what the calendar shows. */
type Pulled = { id: string; title: string; note: string | null; allDay: boolean; start: string; end: string | null };

/** What Reflect keeps of a Graph event, or null for one it leaves out (cancelled, timeless, or pushed by Reflect itself). */
export function pulledOf(e: GraphEvent): Pulled | null {
  if (e.isCancelled || !e.start?.dateTime) return null;
  if (e.singleValueExtendedProperties?.some((p) => p.id.toLowerCase() === REFLECT_PROP.toLowerCase() && p.value)) return null; // Reflect's own pushes show from Reflect
  const note = (e.body?.contentType === "text" ? e.body.content : e.bodyPreview) ?? null;
  return {
    id: e.id, title: (e.subject ?? "Busy").replace(/\s+/g, " ").trim().slice(0, 200) || "Busy", note: note?.trim().slice(0, 2000) || null,
    allDay: !!e.isAllDay, start: e.start.dateTime, end: e.end?.dateTime ?? null,
  };
}

/** A pulled event as Reflect calendar events: a whole-day event over several days one a day; a timed one on its start day. */
export function toCal(e: Pulled): CalEvent[] {
  const base = { tile: null, title: e.title, note: e.note, repeat: "none" as Repeat, until: null, recordId: null, feed: { id: "microsoft", name: "Outlook Calendar" } };
  const day = e.start.slice(0, 10);
  if (e.allDay) {
    const end = e.end ? e.end.slice(0, 10) : addDays(day, 1);
    const out: CalEvent[] = [];
    for (let d = day, i = 0; (d < end || i === 0) && i < 60; d = addDays(d, 1), i++) out.push({ ...base, id: `microsoft:${e.id}${i ? `:${i}` : ""}`, day: d, starts: null, ends: null });
    return out;
  }
  const starts = e.start.slice(11, 16);
  const ends = e.end && e.end.slice(0, 10) === day && e.end.slice(11, 16) > starts ? e.end.slice(11, 16) : null;
  return [{ ...base, id: `microsoft:${e.id}`, day, starts, ends }];
}

async function pull(userId: string, r: Row): Promise<Pulled[]> {
  const token = await accessToken(userId, r);
  const now = Date.now();
  const p = new URLSearchParams({
    startDateTime: new Date(now - 62 * 86400_000).toISOString(), endDateTime: new Date(now + 366 * 86400_000).toISOString(),
    $top: "500", $select: "id,subject,body,bodyPreview,start,end,isAllDay,isCancelled",
    $expand: `singleValueExtendedProperties($filter=id eq '${REFLECT_PROP}')`,
  });
  const prefer = `outlook.timezone="${r.time_zone ?? "UTC"}", outlook.body-content-type="text"`;
  const events: Pulled[] = [];
  let url: string | undefined = `${GRAPH}/me/calendarView?${p}`;
  for (let i = 0; i < 10 && url; i++) {
    const res = await call(token, url, { headers: { prefer } });
    if (!res.ok) throw new Error(`Outlook Calendar answered with an error (${res.status}).`);
    const body = (await res.json()) as { value?: GraphEvent[]; "@odata.nextLink"?: string };
    for (const e of body.value ?? []) { const x = pulledOf(e); if (x) events.push(x); }
    url = body["@odata.nextLink"];
  }
  return events;
}

/** The person's Outlook Calendar events from `from` through `to`, read-only; pulled again when the cache is over 15 minutes old. None when not connected. */
export async function microsoftCalEvents(userId: string, from: string, to: string): Promise<CalEvent[]> {
  const r = await row(userId);
  if (!r) return [];
  let cached: Pulled[] | null = null;
  if (r.events_ct) { try { cached = JSON.parse(open(userId, r.events_ct)) as Pulled[]; } catch { cached = null; } }
  const refresh = async (): Promise<Pulled[] | null> => {
    try {
      const fresh = await pull(userId, r);
      await db().query("UPDATE microsoft_calendar SET events_ct = $2, last_fetched_at = now(), last_error = NULL WHERE user_id = $1", [userId, seal(userId, JSON.stringify(fresh))]);
      return fresh;
    } catch (e) {
      await db().query("UPDATE microsoft_calendar SET last_fetched_at = now(), last_error = $2 WHERE user_id = $1", [userId, e instanceof Error ? e.message.slice(0, 300) : "Could not read Outlook Calendar."]).catch(() => undefined);
      return null;
    }
  };
  // As with Google Calendar: a stale cache shows now and is pulled again after the response; no cache is pulled now.
  if (!r.last_fetched_at || Date.now() - new Date(r.last_fetched_at).getTime() > REFETCH_MS) {
    if (!(cached && later(refresh))) cached = (await refresh()) ?? cached;
  }
  if (!cached) return [];
  return cached.flatMap(toCal).filter((e) => e.day >= from && e.day <= to);
}

// ---- Push ----

const DAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const;

/** Graph's recurrence for a Reflect repeat (iCalendar's plain frequencies), starting on the event's day. */
function recurrence(e: PushInput) {
  if (e.repeat === "none") return null;
  const [y, m, d] = e.day.split("-").map(Number) as [number, number, number];
  const pattern =
    e.repeat === "daily" ? { type: "daily", interval: 1 }
    : e.repeat === "weekly" ? { type: "weekly", interval: 1, daysOfWeek: [DAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]], firstDayOfWeek: "sunday" }
    : e.repeat === "monthly" ? { type: "absoluteMonthly", interval: 1, dayOfMonth: d }
    : { type: "absoluteYearly", interval: 1, dayOfMonth: d, month: m };
  return { pattern, range: e.until ? { type: "endDate", startDate: e.day, endDate: e.until } : { type: "noEnd", startDate: e.day } };
}

/** The Graph event for a Reflect event, in the mailbox's zone. A new one carries the `reflectId` property; a change also clears a dropped repeat. */
export function graphBody(e: PushInput, zone: string, reflectId: string, isNew: boolean) {
  const plusHour = (t: string) => { const h = Number(t.slice(0, 2)) + 1; return h > 23 ? "23:59" : `${String(h).padStart(2, "0")}${t.slice(2)}`; };
  const timed = !!e.starts;
  const start = { dateTime: `${e.day}T${timed ? e.starts : "00:00"}:00`, timeZone: zone };
  const end = timed ? { dateTime: `${e.day}T${e.ends ?? plusHour(e.starts!)}:00`, timeZone: zone } : { dateTime: `${addDays(e.day, 1)}T00:00:00`, timeZone: zone };
  const rec = recurrence(e);
  return {
    subject: e.title, body: { contentType: "text", content: e.note ?? "" }, start, end, isAllDay: !timed,
    ...(rec ? { recurrence: rec } : isNew ? {} : { recurrence: null }),
    ...(isNew ? { singleValueExtendedProperties: [{ id: REFLECT_PROP, value: reflectId }] } : {}),
  };
}

/**
 * Mirrors one Reflect event in Outlook Calendar: creates it (when it was made after connecting and has no Outlook
 * event yet), updates it, or deletes it when it is removed. Does nothing when Outlook Calendar is not connected.
 * Failures are kept as the connection's last error and never stop the change in Reflect.
 */
export async function mirrorToMicrosoft(userId: string, id: string, e: PushInput | null): Promise<void> {
  const r = await row(userId).catch(() => null);
  if (!r) return;
  try {
    const ev = await db().query("SELECT microsoft_id, created_at FROM calendar_event WHERE id = $1 AND user_id = $2", [id, userId]);
    const msId = (ev.rows[0]?.microsoft_id as string | null | undefined) ?? null;
    const token = await accessToken(userId, r);
    const at = (x: string) => `${GRAPH}/me/events/${encodeURIComponent(x)}`;
    if (!e) {
      if (msId) {
        await call(token, at(msId), { method: "DELETE" });
        await db().query("UPDATE calendar_event SET microsoft_id = NULL WHERE id = $1 AND user_id = $2", [id, userId]);
      }
      return;
    }
    const zone = r.time_zone ?? "UTC";
    if (msId) {
      const res = await call(token, at(msId), { method: "PATCH", body: JSON.stringify(graphBody(e, zone, id, false)) });
      if (!res.ok) throw new Error(`Outlook Calendar did not take the change (${res.status}).`);
      return;
    }
    if (!ev.rows[0] || new Date(ev.rows[0].created_at as string).getTime() < new Date(r.connected_at).getTime()) return; // only events made after connecting
    const res = await call(token, `${GRAPH}/me/events`, { method: "POST", body: JSON.stringify(graphBody(e, zone, id, true)) });
    if (!res.ok) throw new Error(`Outlook Calendar did not take the event (${res.status}).`);
    const made = (await res.json()) as { id: string };
    await db().query("UPDATE calendar_event SET microsoft_id = $3 WHERE id = $1 AND user_id = $2", [id, userId, made.id]);
  } catch (err) {
    await db().query("UPDATE microsoft_calendar SET last_error = $2 WHERE user_id = $1", [userId, err instanceof Error ? err.message.slice(0, 300) : "Could not reach Outlook Calendar."]).catch(() => undefined);
  }
}
