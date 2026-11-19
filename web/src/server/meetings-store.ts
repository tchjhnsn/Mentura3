// Meetings (doc "Mentura meetings and building-only Mentura design guide", 2026-11-19; tables in migration 0064): a
// meeting a person hosts, the guests they invite by email (each with an invite link), the agenda, notes and follow-ups,
// and the host's prep. Notes, follow-ups, prep and invite tokens are sealed with the host's key: the server opens notes
// and follow-ups for a guest only once the host shares them, and prep only ever for the host. A guest is a person whose
// meeting_guest row names their account and is not removed. Accounts made from an invite are marked in guest_user and
// see only their meetings (the guest wall, ./guest-wall.ts). Pure rules are in @reflect/core/meetings.
import { createHash, randomBytes, randomUUID } from "node:crypto";
import {
  cleanEmail, cleanFollowup, cleanMeetingPart, DEFAULT_MINUTES, DRAFT_MEETING_TITLE, emptyPrep, meetingState, readPrep,
  type Followup, type MeetingPart, type MeetingPrep, type MeetingState,
} from "@reflect/core/meetings";
import { db } from "@/db/pool";
import { open, seal } from "./crypto";
import { canSendMail, sendMail } from "./mail";
import { siteUrl } from "./site";

const UUID = /^[0-9a-f-]{36}$/;

/** Someone in a meeting, as faces show them. */
export type MeetingPerson = { id: string; name: string; image: string | null };

/** A guest as the host sees them: who was invited, whether they have joined Mentura from the invite, and their face. */
export type MeetingGuest = { id: string; email: string; name: string | null; acceptedAt: string | null; person: MeetingPerson | null };

/** A meeting as a page shows it to one person. `role` says whether they host it; `notes` and `followups` are null for
 * a guest until the host shares them; `prep` is only ever filled for the host. */
export type MeetingView = {
  id: string;
  role: "host" | "guest";
  host: MeetingPerson;
  title: string;
  startsAt: string | null;
  minutes: number;
  agenda: string | null;
  callUrl: string | null;
  ventureId: string | null;
  dailyRoom: string | null;
  cancelled: boolean;
  state: MeetingState;
  notes: string | null;
  notesSharedAt: string | null;
  followups: Followup[] | null;
  guests: MeetingGuest[];
  createdAt: string;
};

/** A meeting in a list: enough for a row. */
export type MeetingRow = Pick<MeetingView, "id" | "role" | "title" | "startsAt" | "minutes" | "cancelled" | "state" | "ventureId"> & { people: MeetingPerson[] };

type Row = {
  id: string; host_user: string; title: string; starts_at: Date | null; minutes: number; agenda: string | null; call_url: string | null;
  venture_id: string | null; notes_sealed: string | null; notes_shared_at: Date | null; prep_sealed: string | null; daily_room: string | null;
  status: string; created_at: Date;
};

const iso = (d: Date | null) => (d ? new Date(d).toISOString() : null);
const nameOr = (v: string | null | undefined) => v?.trim() || "A member";
export const hashInvite = (token: string) => createHash("sha256").update(token).digest("hex");

async function people(ids: string[]): Promise<Map<string, MeetingPerson>> {
  if (!ids.length) return new Map();
  const r = await db().query<{ id: string; name: string | null; image: string | null }>('SELECT id, name, image FROM "user" WHERE id = ANY($1)', [ids]);
  return new Map(r.rows.map((u) => [u.id, { id: u.id, name: nameOr(u.name), image: u.image ?? null }]));
}

/** The person's role in a meeting, or null when they are neither its host nor a guest on it. */
export async function roleIn(userId: string, meetingId: string): Promise<"host" | "guest" | null> {
  if (!UUID.test(meetingId)) return null;
  const r = await db().query<{ host_user: string; guest: boolean }>(
    `SELECT m.host_user, EXISTS (SELECT 1 FROM meeting_guest g WHERE g.meeting_id = m.id AND g.user_id = $2 AND g.removed_at IS NULL) AS guest
       FROM meeting m WHERE m.id = $1`, [meetingId, userId]);
  const row = r.rows[0];
  if (!row) return null;
  return row.host_user === userId ? "host" : row.guest ? "guest" : null;
}

async function hostRow(hostId: string, meetingId: string): Promise<Row> {
  if (!UUID.test(meetingId)) throw new Error("No such meeting.");
  const r = await db().query<Row>("SELECT * FROM meeting WHERE id = $1 AND host_user = $2", [meetingId, hostId]);
  if (!r.rows[0]) throw new Error("No such meeting.");
  return r.rows[0];
}

const times = (r: Row) => ({ startsAt: iso(r.starts_at), minutes: r.minutes, cancelled: r.status === "cancelled" });

async function followupsOf(r: Row): Promise<Followup[]> {
  const f = await db().query<{ id: string; text_sealed: string; owner: string | null; due: string | null; done_at: Date | null }>(
    "SELECT id, text_sealed, owner, to_char(due, 'YYYY-MM-DD') AS due, done_at FROM meeting_followup WHERE meeting_id = $1 ORDER BY created_at", [r.id]);
  return f.rows.map((x) => ({ id: x.id, text: open(r.host_user, x.text_sealed), owner: x.owner, due: x.due, done: !!x.done_at }));
}

async function guestsOf(meetingId: string): Promise<MeetingGuest[]> {
  const g = await db().query<{ id: string; email: string; name: string | null; user_id: string | null; accepted_at: Date | null }>(
    "SELECT id, email, name, user_id, accepted_at FROM meeting_guest WHERE meeting_id = $1 AND removed_at IS NULL ORDER BY invited_at", [meetingId]);
  const who = await people(g.rows.flatMap((x) => (x.user_id ? [x.user_id] : [])));
  return g.rows.map((x) => ({ id: x.id, email: x.email, name: x.name, acceptedAt: iso(x.accepted_at), person: x.user_id ? who.get(x.user_id) ?? null : null }));
}

/** One meeting as the person may see it, or null when it is not theirs to see. */
export async function meetingFor(userId: string, meetingId: string, now = new Date()): Promise<MeetingView | null> {
  const role = await roleIn(userId, meetingId);
  if (!role) return null;
  const r = (await db().query<Row>("SELECT * FROM meeting WHERE id = $1", [meetingId])).rows[0]!;
  const shared = role === "host" || !!r.notes_shared_at;
  const [host, guests, followups] = await Promise.all([people([r.host_user]), guestsOf(r.id), shared ? followupsOf(r) : Promise.resolve(null)]);
  return {
    id: r.id,
    role,
    host: host.get(r.host_user) ?? { id: r.host_user, name: "A member", image: null },
    title: r.title,
    ...times(r),
    agenda: r.agenda,
    callUrl: r.call_url,
    ventureId: role === "host" ? r.venture_id : null,
    dailyRoom: r.daily_room,
    state: meetingState(times(r), now),
    notes: shared && r.notes_sealed ? open(r.host_user, r.notes_sealed) : null,
    notesSharedAt: iso(r.notes_shared_at),
    followups,
    guests: role === "host" ? guests : guests.map((g) => ({ ...g, email: "" })),
    createdAt: iso(r.created_at)!,
  };
}

/** The meetings a person hosts or is a guest on, soonest first, undated drafts last. */
export async function meetingsOf(userId: string, now = new Date()): Promise<MeetingRow[]> {
  const r = await db().query<Row & { guest_ids: string[] | null }>(
    `SELECT m.*, (SELECT array_agg(g.user_id) FROM meeting_guest g WHERE g.meeting_id = m.id AND g.removed_at IS NULL AND g.user_id IS NOT NULL) AS guest_ids
       FROM meeting m
      WHERE m.host_user = $1 OR EXISTS (SELECT 1 FROM meeting_guest g WHERE g.meeting_id = m.id AND g.user_id = $1 AND g.removed_at IS NULL)
      ORDER BY m.starts_at NULLS LAST, m.created_at DESC
      LIMIT 200`, [userId]);
  const who = await people([...new Set(r.rows.flatMap((x) => [x.host_user, ...(x.guest_ids ?? [])]))]);
  return r.rows.map((x) => ({
    id: x.id,
    role: x.host_user === userId ? "host" : "guest",
    title: x.title,
    ...times(x),
    state: meetingState(times(x), now),
    ventureId: x.host_user === userId ? x.venture_id : null,
    people: [x.host_user, ...(x.guest_ids ?? [])].flatMap((id) => (who.get(id) ? [who.get(id)!] : [])),
  }));
}

/** A new meeting the person hosts, with the parts given (each cleaned), else a draft named "New meeting". */
export async function createMeeting(hostId: string, parts: Partial<Record<MeetingPart, unknown>> = {}): Promise<{ id: string }> {
  const id = randomUUID();
  const v = (p: MeetingPart) => (parts[p] === undefined ? null : cleanMeetingPart(p, parts[p]));
  await db().query(
    `INSERT INTO meeting (id, host_user, title, starts_at, minutes, agenda, call_url, venture_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [id, hostId, (v("title") as string | null) ?? DRAFT_MEETING_TITLE, v("starts_at"), (v("minutes") as number | null) ?? DEFAULT_MINUTES, v("agenda"), v("call_url"), v("venture_id")],
  );
  return { id };
}

const COLUMN: Record<MeetingPart, string> = { title: "title", starts_at: "starts_at", minutes: "minutes", agenda: "agenda", call_url: "call_url", venture_id: "venture_id" };

/** Sets one part of a meeting the person hosts; returns the value before, for undo. */
export async function setMeetingPart(hostId: string, meetingId: string, part: MeetingPart, value: unknown): Promise<{ before: unknown; after: unknown }> {
  const r = await hostRow(hostId, meetingId);
  const after = cleanMeetingPart(part, value);
  const before = part === "starts_at" ? iso(r.starts_at) : (r as unknown as Record<string, unknown>)[COLUMN[part]] ?? null;
  await db().query(`UPDATE meeting SET ${COLUMN[part]} = $3, updated_at = now() WHERE id = $1 AND host_user = $2`, [meetingId, hostId, after]);
  return { before, after };
}

/** Cancels (or, with false, restores) a meeting the person hosts. */
export async function setCancelled(hostId: string, meetingId: string, cancelled: boolean): Promise<void> {
  await hostRow(hostId, meetingId);
  await db().query("UPDATE meeting SET status = $3, updated_at = now() WHERE id = $1 AND host_user = $2", [meetingId, hostId, cancelled ? "cancelled" : "active"]);
}

/** Sets the Daily room a meeting's call runs in (./daily.ts makes it). */
export async function setDailyRoom(hostId: string, meetingId: string, room: string | null): Promise<void> {
  await hostRow(hostId, meetingId);
  await db().query("UPDATE meeting SET daily_room = $3, updated_at = now() WHERE id = $1 AND host_user = $2", [meetingId, hostId, room]);
}

/** The invite link for a token. */
export const inviteUrl = (token: string) => `${siteUrl().replace(/\/$/, "")}/m/${token}`;

/**
 * Invites a guest by email: a new row with its own invite token, or the existing row (its token kept) when that email
 * is already invited; a removed guest is invited again. Sends the link by email when the deployment can send mail.
 * Returns the link so the host can copy it either way.
 */
export async function inviteGuest(hostId: string, meetingId: string, input: { email: unknown; name?: unknown }): Promise<{ guestId: string; url: string; emailed: boolean }> {
  const r = await hostRow(hostId, meetingId);
  const email = cleanEmail(input.email);
  const name = typeof input.name === "string" && input.name.trim() ? input.name.replace(/\s+/g, " ").trim().slice(0, 100) : null;
  const had = await db().query<{ id: string; token_sealed: string }>("SELECT id, token_sealed FROM meeting_guest WHERE meeting_id = $1 AND email = $2", [meetingId, email]);
  let guestId: string;
  let token: string;
  if (had.rows[0]) {
    guestId = had.rows[0].id;
    token = open(hostId, had.rows[0].token_sealed);
    await db().query("UPDATE meeting_guest SET removed_at = NULL, name = COALESCE($2, name) WHERE id = $1", [guestId, name]);
  } else {
    guestId = randomUUID();
    token = randomBytes(24).toString("base64url");
    await db().query("INSERT INTO meeting_guest (id, meeting_id, email, name, token_hash, token_sealed) VALUES ($1, $2, $3, $4, $5, $6)",
      [guestId, meetingId, email, name, hashInvite(token), seal(hostId, token)]);
  }
  const url = inviteUrl(token);
  let emailed = false;
  if (canSendMail()) {
    const host = (await people([hostId])).get(hostId)?.name ?? "Your host";
    const when = r.starts_at ? new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", weekday: "long", month: "long", day: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short" }).format(r.starts_at) : null;
    emailed = await sendMail(email, `${host} invited you: ${r.title}`,
      `${host} invited you to a meeting on Mentura.\n\n${r.title}${when ? `\n${when}` : ""}\n\nOpen the meeting: ${url}\n\nThe link opens this meeting only.`);
  }
  return { guestId, url, emailed };
}

/** The invite link of a guest on a meeting the person hosts. */
export async function inviteLinkOf(hostId: string, meetingId: string, guestId: string): Promise<string> {
  await hostRow(hostId, meetingId);
  const g = await db().query<{ token_sealed: string }>("SELECT token_sealed FROM meeting_guest WHERE id = $1 AND meeting_id = $2", [guestId, meetingId]);
  if (!g.rows[0]) throw new Error("No such guest.");
  return inviteUrl(open(hostId, g.rows[0].token_sealed));
}

/** Removes a guest from a meeting the person hosts; their link stops opening it. */
export async function removeGuest(hostId: string, meetingId: string, guestId: string): Promise<void> {
  await hostRow(hostId, meetingId);
  await db().query("UPDATE meeting_guest SET removed_at = now() WHERE id = $1 AND meeting_id = $2", [guestId, meetingId]);
}

/** What an invite link shows before anyone signs in: the meeting's title, time, host and state. Null when the link is
 * unknown or the guest was removed. Never the guest's email. */
export type InviteView = { meetingId: string; title: string; startsAt: string | null; minutes: number; state: MeetingState; host: MeetingPerson; acceptedBy: string | null };

export async function inviteByToken(token: string, now = new Date()): Promise<InviteView | null> {
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(token)) return null;
  const r = await db().query<Row & { user_id: string | null }>(
    `SELECT m.*, g.user_id FROM meeting_guest g JOIN meeting m ON m.id = g.meeting_id WHERE g.token_hash = $1 AND g.removed_at IS NULL`, [hashInvite(token)]);
  const x = r.rows[0];
  if (!x) return null;
  const host = (await people([x.host_user])).get(x.host_user) ?? { id: x.host_user, name: "A member", image: null };
  return { meetingId: x.id, title: x.title, ...times(x), state: meetingState(times(x), now), host, acceptedBy: x.user_id };
}

/**
 * Ties an invite to the signed-in person, so the meeting opens for them. `newGuest` marks the account a guest account
 * (only an account made in the last 15 minutes, so an existing member is never walled in). A link already taken by
 * another account is refused. Returns the meeting's id.
 */
export async function acceptInvite(token: string, userId: string, newGuest: boolean): Promise<string> {
  const g = await db().query<{ id: string; meeting_id: string; user_id: string | null; host_user: string }>(
    `SELECT g.id, g.meeting_id, g.user_id, m.host_user FROM meeting_guest g JOIN meeting m ON m.id = g.meeting_id WHERE g.token_hash = $1 AND g.removed_at IS NULL`, [hashInvite(token)]);
  const row = g.rows[0];
  if (!row) throw new Error("This invite link no longer works. Ask your host for a new one.");
  if (row.host_user === userId) return row.meeting_id;
  if (row.user_id && row.user_id !== userId) throw new Error("This invite was already used by another account. Sign in with that account, or ask your host for a new link.");
  await db().query("UPDATE meeting_guest SET user_id = $2, accepted_at = COALESCE(accepted_at, now()) WHERE id = $1", [row.id, userId]);
  if (newGuest) {
    await db().query(
      `INSERT INTO guest_user (user_id, via_meeting)
         SELECT $1, $2 WHERE EXISTS (SELECT 1 FROM "user" WHERE id = $1 AND "createdAt" > now() - interval '15 minutes')
       ON CONFLICT (user_id) DO NOTHING`, [userId, row.meeting_id]);
  }
  return row.meeting_id;
}

/** Whether the account is a guest account (made from an invite), which sees only its meetings. */
export async function isGuestAccount(userId: string): Promise<boolean> {
  const r = await db().query("SELECT 1 FROM guest_user WHERE user_id = $1", [userId]);
  return (r.rowCount ?? 0) > 0;
}

/** Turns a guest account into a full member account (Settings). */
export async function becomeMember(userId: string): Promise<void> {
  await db().query("DELETE FROM guest_user WHERE user_id = $1", [userId]);
}

/** Sets the notes of a meeting the person hosts. Returns the notes before, for undo. */
export async function setNotes(hostId: string, meetingId: string, text: string): Promise<{ before: string | null }> {
  const r = await hostRow(hostId, meetingId);
  const t = text.slice(0, 50_000);
  await db().query("UPDATE meeting SET notes_sealed = $3, updated_at = now() WHERE id = $1 AND host_user = $2", [meetingId, hostId, t.trim() ? seal(hostId, t) : null]);
  return { before: r.notes_sealed ? open(hostId, r.notes_sealed) : null };
}

/** Shares the notes and follow-ups with the guests (or, with false, takes them back). */
export async function setNotesShared(hostId: string, meetingId: string, shared: boolean): Promise<void> {
  await hostRow(hostId, meetingId);
  await db().query("UPDATE meeting SET notes_shared_at = CASE WHEN $3 THEN COALESCE(notes_shared_at, now()) ELSE NULL END, updated_at = now() WHERE id = $1 AND host_user = $2", [meetingId, hostId, shared]);
}

/** Adds a follow-up to a meeting the person hosts. */
export async function addFollowup(hostId: string, meetingId: string, input: { text: unknown; owner?: unknown; due?: unknown }): Promise<Followup> {
  await hostRow(hostId, meetingId);
  const f = cleanFollowup(input);
  const id = randomUUID();
  await db().query("INSERT INTO meeting_followup (id, meeting_id, text_sealed, owner, due) VALUES ($1, $2, $3, $4, $5)", [id, meetingId, seal(hostId, f.text), f.owner, f.due]);
  return { id, ...f, done: false };
}

/** Ticks (or unticks) a follow-up on a meeting the person hosts. */
export async function setFollowupDone(hostId: string, meetingId: string, followupId: string, done: boolean): Promise<void> {
  await hostRow(hostId, meetingId);
  await db().query("UPDATE meeting_followup SET done_at = CASE WHEN $3 THEN now() ELSE NULL END WHERE id = $1 AND meeting_id = $2", [followupId, meetingId, done]);
}

/** Removes a follow-up from a meeting the person hosts. */
export async function removeFollowup(hostId: string, meetingId: string, followupId: string): Promise<void> {
  await hostRow(hostId, meetingId);
  await db().query("DELETE FROM meeting_followup WHERE id = $1 AND meeting_id = $2", [followupId, meetingId]);
}

/** The host's prep for a meeting (host only), or the empty prep. */
export async function prepOf(hostId: string, meetingId: string): Promise<MeetingPrep> {
  const r = await hostRow(hostId, meetingId);
  if (!r.prep_sealed) return emptyPrep();
  try { return readPrep(JSON.parse(open(hostId, r.prep_sealed))); } catch { return emptyPrep(); }
}

/** Keeps the host's prep whole (read through readPrep, so nothing malformed is kept). Returns the prep before. */
export async function setPrep(hostId: string, meetingId: string, prep: unknown): Promise<{ before: MeetingPrep; after: MeetingPrep }> {
  const before = await prepOf(hostId, meetingId);
  const after = readPrep(prep);
  await db().query("UPDATE meeting SET prep_sealed = $3, updated_at = now() WHERE id = $1 AND host_user = $2", [meetingId, hostId, seal(hostId, JSON.stringify(after))]);
  return { before, after };
}

/**
 * Takes back a meeting the person just scheduled (Undo of schedule_meeting): removed while nothing else was put in it
 * (no guest invited, no notes, follow-ups or prep), else cancelled, so nothing a guest was sent or the host wrote is lost.
 */
export async function unscheduleMeeting(hostId: string, meetingId: string): Promise<"removed" | "cancelled"> {
  await hostRow(hostId, meetingId);
  const r = await db().query(
    `DELETE FROM meeting m WHERE m.id = $1 AND m.host_user = $2 AND m.notes_sealed IS NULL AND m.prep_sealed IS NULL
        AND NOT EXISTS (SELECT 1 FROM meeting_guest g WHERE g.meeting_id = m.id)
        AND NOT EXISTS (SELECT 1 FROM meeting_followup f WHERE f.meeting_id = m.id)`, [meetingId, hostId]);
  if ((r.rowCount ?? 0) > 0) return "removed";
  await setCancelled(hostId, meetingId, true);
  return "cancelled";
}
