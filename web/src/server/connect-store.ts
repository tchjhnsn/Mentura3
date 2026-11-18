// Check in, connect, member profiles and where friends met (migration 0050): the rows. The rules are in ./connect.ts;
// who may see whom is checked by the callers (the Here page, ./actions/connections.ts) before anything here is read.
// Names come from "user"; emails are never read.
import type { PoolClient } from "@neondatabase/serverless";
import { cleanInterests, type EventOut } from "@reflect/core/events";
import { db } from "@/db/pool";
import { connectWith, type ConnectResult, type ConnectTx, type HerePerson, type OpenRequest } from "./connect";

const nameOr = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : "A member");
const iso = (v: unknown) => (v ? new Date(v as string).toISOString() : null);

/** The part of an event check-in reads. */
export type EventDoor = Pick<EventOut, "id" | "source" | "hostUser" | "status" | "title" | "startsAt" | "endsAt"> & { hostName: string | null; doorTokenHash: string | null };

export async function eventDoor(id: string): Promise<EventDoor | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const r = await db().query(
    `SELECT e.id, e.source, e.host_user, e.status, e.title, e.starts_at, e.ends_at, e.door_token_hash, u.name AS host_name
     FROM event e LEFT JOIN "user" u ON u.id = e.host_user WHERE e.id = $1`,
    [id],
  );
  const x = r.rows[0];
  if (!x) return null;
  return { id: x.id, source: x.source, hostUser: x.host_user, status: x.status, title: x.title, startsAt: iso(x.starts_at), endsAt: iso(x.ends_at), hostName: x.host_user ? nameOr(x.host_name) : null, doorTokenHash: x.door_token_hash };
}

/** Replaces a hosted event's door token hash; only its host can. */
export async function setDoorHash(eventId: string, hostUser: string, hash: string): Promise<boolean> {
  const r = await db().query("UPDATE event SET door_token_hash = $3, updated_at = now() WHERE id = $1 AND host_user = $2 AND source = 'reflect'", [eventId, hostUser, hash]);
  return (r.rowCount ?? 0) > 0;
}

export async function checkIn(eventId: string, userId: string): Promise<void> {
  await db().query("INSERT INTO event_checkin (event_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", [eventId, userId]);
}

export async function isCheckedIn(eventId: string, userId: string): Promise<boolean> {
  const r = await db().query("SELECT 1 FROM event_checkin WHERE event_id = $1 AND user_id = $2", [eventId, userId]);
  return r.rows.length > 0;
}

export async function isGoing(eventId: string, userId: string): Promise<boolean> {
  const r = await db().query("SELECT 1 FROM event_rsvp WHERE event_id = $1 AND user_id = $2", [eventId, userId]);
  return r.rows.length > 0;
}

const person = (x: Record<string, unknown>): HerePerson => ({ id: x.id as string, name: nameOr(x.name), line: (x.line as string | null) ?? null, interests: (x.interests as string[] | null) ?? [], builds: x.builds === true });

/** Everyone checked in to an event, with what each chose to show. Only for a caller who is checked in, in the window. */
export async function checkedIn(eventId: string): Promise<HerePerson[]> {
  const r = await db().query(
    `SELECT u.id, u.name, p.line, p.interests, p.builds FROM event_checkin c JOIN "user" u ON u.id = c.user_id
     LEFT JOIN member_profile p ON p.user_id = u.id WHERE c.event_id = $1 ORDER BY c.created_at`,
    [eventId],
  );
  return r.rows.map(person);
}

/** Events the person is checked in to that started in the last day: where a Connect by name can reach someone. */
export async function recentCheckins(userId: string): Promise<EventDoor[]> {
  const r = await db().query("SELECT event_id FROM event_checkin c JOIN event e ON e.id = c.event_id WHERE c.user_id = $1 AND e.starts_at > now() - interval '1 day' ORDER BY e.starts_at DESC", [userId]);
  return (await Promise.all(r.rows.map((x) => eventDoor(x.event_id)))).filter((e): e is EventDoor => e !== null);
}

export type Profile = { line: string | null; interests: string[]; builds: boolean };

export async function profileOf(userId: string): Promise<Profile> {
  const r = await db().query("SELECT line, interests, builds FROM member_profile WHERE user_id = $1", [userId]);
  const x = r.rows[0];
  return x ? { line: x.line ?? null, interests: x.interests ?? [], builds: x.builds === true } : { line: null, interests: [], builds: false };
}

export async function saveProfile(userId: string, p: Profile): Promise<Profile> {
  const line = p.line?.trim() ? p.line.trim().slice(0, 120) : null;
  const interests = cleanInterests(p.interests);
  await db().query(
    `INSERT INTO member_profile (user_id, line, interests, builds) VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id) DO UPDATE SET line = $2, interests = $3, builds = $4, updated_at = now()`,
    [userId, line, interests, p.builds],
  );
  return { line, interests, builds: p.builds };
}

/** Replaces the hash of the person's personal QR token. */
export async function setPersonalHash(userId: string, hash: string): Promise<void> {
  await db().query(
    `INSERT INTO member_profile (user_id, personal_token_hash) VALUES ($1, $2)
     ON CONFLICT (user_id) DO UPDATE SET personal_token_hash = $2, updated_at = now()`,
    [userId, hash],
  );
}

export async function userByPersonalHash(hash: string): Promise<{ id: string; name: string } | null> {
  const r = await db().query(`SELECT u.id, u.name FROM member_profile p JOIN "user" u ON u.id = p.user_id WHERE p.personal_token_hash = $1`, [hash]);
  const x = r.rows[0];
  return x ? { id: x.id, name: nameOr(x.name) } : null;
}

/**
 * Whether two people have met: connected, or checked in to one event together. The event is the latest one they were
 * both checked in to (else where they connected), or null. Null when they have not met, or the other is no one.
 */
export async function metWith(userId: string, otherId: string): Promise<{ name: string; eventId: string | null } | null> {
  const u = await db().query(`SELECT name FROM "user" WHERE id = $1`, [otherId]);
  if (!u.rows[0]) return null;
  const name = nameOr(u.rows[0].name);
  const r = await db().query(
    `SELECT a.event_id FROM event_checkin a JOIN event_checkin b ON b.event_id = a.event_id JOIN event e ON e.id = a.event_id
     WHERE a.user_id = $1 AND b.user_id = $2 ORDER BY e.starts_at DESC NULLS LAST LIMIT 1`,
    [userId, otherId],
  );
  if (r.rows[0]) return { name, eventId: r.rows[0].event_id };
  const f = await db().query("SELECT met_event FROM friend_link WHERE (user_a, user_b) = (LEAST($1, $2), GREATEST($1, $2))", [userId, otherId]);
  return f.rows[0] ? { name, eventId: f.rows[0].met_event ?? null } : null;
}

/** ConnectTx over one Postgres client inside a transaction. */
function clientTx(c: PoolClient): ConnectTx {
  const open = (x: Record<string, unknown>): OpenRequest => ({ id: x.id as string, from: x.from_user as string, to: x.to_user as string, eventId: (x.event_id as string | null) ?? null });
  return {
    async openRequest(from, to, now) {
      // A lapsed request still holds the open-pair index; it is cleared so a new tap can be made.
      await c.query("DELETE FROM connect_request WHERE from_user = $1 AND to_user = $2 AND accepted_at IS NULL AND declined_at IS NULL AND expires_at <= $3", [from, to, now]);
      const r = await c.query("SELECT id, from_user, to_user, event_id FROM connect_request WHERE from_user = $1 AND to_user = $2 AND accepted_at IS NULL AND declined_at IS NULL FOR UPDATE", [from, to]);
      return r.rows[0] ? open(r.rows[0]) : null;
    },
    async insertRequest({ from, to, eventId, expiresAt }) {
      const r = await c.query("INSERT INTO connect_request (from_user, to_user, event_id, expires_at) VALUES ($1, $2, $3, $4) RETURNING id, from_user, to_user, event_id", [from, to, eventId, expiresAt]);
      return open(r.rows[0]);
    },
    async accept(ids, now) {
      await c.query("UPDATE connect_request SET accepted_at = $2 WHERE id = ANY($1::uuid[]) AND accepted_at IS NULL", [ids, now]);
    },
    async link(a, b, metEvent) {
      await c.query("INSERT INTO friend_link (user_a, user_b, met_event) VALUES ($1, $2, $3) ON CONFLICT (user_a, user_b) DO UPDATE SET met_event = COALESCE(friend_link.met_event, EXCLUDED.met_event)", [a, b, metEvent]);
    },
    async kindIfMissing(userId, otherId, kind) {
      await c.query("INSERT INTO friend_kind (user_id, other_id, kind) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING", [userId, otherId, kind]);
    },
  };
}

/** One Connect tap, in one transaction (the pair is locked so two taps at once cannot both miss each other). */
export async function connect(from: string, to: string, eventId: string | null): Promise<ConnectResult> {
  const c = await db().connect();
  try {
    await c.query("BEGIN");
    const [a, b] = from < to ? [from, to] : [to, from];
    await c.query("SELECT pg_advisory_xact_lock(hashtext($1))", [`connect:${a}:${b}`]);
    const res = await connectWith(clientTx(c), from, to, eventId);
    await c.query("COMMIT");
    return res;
  } catch (e) {
    await c.query("ROLLBACK");
    throw e;
  } finally {
    c.release();
  }
}

/** Takes back a request the person made, if it has not been answered. False when it was accepted (or is gone). */
export async function withdrawRequest(userId: string, requestId: string): Promise<boolean> {
  const r = await db().query("DELETE FROM connect_request WHERE id = $1 AND from_user = $2 AND accepted_at IS NULL", [requestId, userId]);
  return (r.rowCount ?? 0) > 0;
}

/** Not now: the person turns down a request made to them. */
export async function declineRequest(userId: string, requestId: string): Promise<boolean> {
  const r = await db().query("UPDATE connect_request SET declined_at = now() WHERE id = $1 AND to_user = $2 AND accepted_at IS NULL AND declined_at IS NULL", [requestId, userId]);
  return (r.rowCount ?? 0) > 0;
}

export type Incoming = { id: string; from: { id: string; name: string }; event: { id: string; title: string; startsAt: string | null } | null; at: string };

/** Requests made to the person that are still open and have not lapsed, newest first. */
export async function incomingRequests(userId: string): Promise<Incoming[]> {
  const r = await db().query(
    `SELECT q.id, q.from_user, u.name, q.created_at, e.id AS event_id, e.title, e.starts_at FROM connect_request q
       JOIN "user" u ON u.id = q.from_user LEFT JOIN event e ON e.id = q.event_id
     WHERE q.to_user = $1 AND q.accepted_at IS NULL AND q.declined_at IS NULL AND q.expires_at > now()
       AND NOT EXISTS (SELECT 1 FROM friend_link f WHERE (f.user_a, f.user_b) = (LEAST(q.from_user, q.to_user), GREATEST(q.from_user, q.to_user)))
     ORDER BY q.created_at DESC LIMIT 50`,
    [userId],
  );
  return r.rows.map((x) => ({ id: x.id, from: { id: x.from_user, name: nameOr(x.name) }, event: x.event_id ? { id: x.event_id, title: x.title, startsAt: iso(x.starts_at) } : null, at: iso(x.created_at)! }));
}

/** Whether the person has an open request to another, not yet answered or lapsed: what a profile's Connect shows as Requested. */
export async function requestedTo(userId: string, otherId: string): Promise<boolean> {
  const r = await db().query("SELECT 1 FROM connect_request WHERE from_user = $1 AND to_user = $2 AND accepted_at IS NULL AND declined_at IS NULL AND expires_at > now()", [userId, otherId]);
  return r.rows.length > 0;
}

/** The person's open requests at one event, by who they are to: what the Connect buttons show as Requested. */
export async function requestedAt(userId: string, eventId: string): Promise<Map<string, string>> {
  const r = await db().query("SELECT id, to_user FROM connect_request WHERE from_user = $1 AND event_id = $2 AND accepted_at IS NULL AND declined_at IS NULL AND expires_at > now()", [userId, eventId]);
  return new Map(r.rows.map((x) => [x.to_user as string, x.id as string]));
}

/** Everyone the person is already friends with (friend_link), by id. */
export async function friendIds(userId: string): Promise<Set<string>> {
  const r = await db().query("SELECT CASE WHEN user_a = $1 THEN user_b ELSE user_a END AS other FROM friend_link WHERE user_a = $1 OR user_b = $1", [userId]);
  return new Set(r.rows.map((x) => x.other as string));
}

/** Who the person connected with at one event (both tapped), newest first. */
export async function connectedAt(userId: string, eventId: string): Promise<{ id: string; name: string }[]> {
  const r = await db().query(
    `SELECT DISTINCT ON (u.id) u.id, u.name, q.accepted_at FROM connect_request q
       JOIN "user" u ON u.id = CASE WHEN q.from_user = $1 THEN q.to_user ELSE q.from_user END
     WHERE q.event_id = $2 AND q.accepted_at IS NOT NULL AND (q.from_user = $1 OR q.to_user = $1)
     ORDER BY u.id, q.accepted_at DESC`,
    [userId, eventId],
  );
  return r.rows.map((x) => ({ id: x.id, name: nameOr(x.name) }));
}

export type Met = { id: string; name: string; event: { id: string; title: string; startsAt: string | null } | null; kind: string | null; since: string };

/** The person's friends from friend_link with where they met and how the person sees each, newest first. */
export async function friendsMet(userId: string, other?: string): Promise<Met[]> {
  const r = await db().query(
    `SELECT u.id, u.name, f.created_at, e.id AS event_id, e.title, e.starts_at, k.kind FROM friend_link f
       JOIN "user" u ON u.id = CASE WHEN f.user_a = $1 THEN f.user_b ELSE f.user_a END
       LEFT JOIN event e ON e.id = f.met_event
       LEFT JOIN friend_kind k ON k.user_id = $1 AND k.other_id = u.id
     WHERE (f.user_a = $1 OR f.user_b = $1) AND ($2::text IS NULL OR u.id = $2)
     ORDER BY f.created_at DESC LIMIT 100`,
    [userId, other ?? null],
  );
  return r.rows.map((x) => ({ id: x.id, name: nameOr(x.name), event: x.event_id ? { id: x.event_id, title: x.title, startsAt: iso(x.starts_at) } : null, kind: x.kind ?? null, since: iso(x.created_at)! }));
}

/** Sets (or, with null, clears) how the person sees one friendship. Returns what it was. */
export async function setFriendKind(userId: string, otherId: string, kind: string | null): Promise<string | null> {
  const was = await db().query("SELECT kind FROM friend_kind WHERE user_id = $1 AND other_id = $2", [userId, otherId]);
  if (kind) await db().query("INSERT INTO friend_kind (user_id, other_id, kind) VALUES ($1, $2, $3) ON CONFLICT (user_id, other_id) DO UPDATE SET kind = $3, updated_at = now()", [userId, otherId, kind]);
  else await db().query("DELETE FROM friend_kind WHERE user_id = $1 AND other_id = $2", [userId, otherId]);
  return (was.rows[0]?.kind as string | undefined) ?? null;
}
