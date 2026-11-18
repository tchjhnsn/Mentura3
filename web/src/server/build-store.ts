// People to build with (doc "Events and connections design guide", 2026-11-18; migration 0050): who wants to build,
// drawn from the person's connections (friend_link) and the people checked in at the events they went to, and the
// build requests between them. A request shows the person asked only the venture's name and what it sells, opened
// from the asker's sealed record here and nothing else of it. A yes makes the pair connected (friend_link), so they can
// message. The ranking and the words are in @reflect/core/build; the rules a run follows are in ./actions/build.ts.
import { randomUUID } from "node:crypto";
import type { BuildCandidate, BuildStatus } from "@reflect/core/build";
import { pairOf } from "@reflect/core/messages";
import { db } from "@/db/pool";
import { open } from "./crypto";
import { tx } from "./learn-store";

const nameOr = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : "A member");
const iso = (v: unknown) => (v ? new Date(v as string).toISOString() : null);
const text = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);

function candidate(x: Record<string, unknown>, via: BuildCandidate["via"]): BuildCandidate {
  return {
    id: x.id as string,
    name: nameOr(x.name),
    image: text(x.image),
    interests: Array.isArray(x.interests) ? (x.interests as string[]) : [],
    via,
    met: x.met_title ? { event: x.met_title as string, startsAt: iso(x.met_at) } : null,
  };
}

/** The person's own interests (member_profile), and everyone who wants to build among their connections and the people checked in where they were. */
export async function buildCandidates(userId: string): Promise<{ interests: string[]; list: BuildCandidate[] }> {
  const [mine, friends, met] = await Promise.all([
    db().query("SELECT interests FROM member_profile WHERE user_id = $1", [userId]),
    db().query(
      `SELECT u.id, u.name, u.image, p.interests, e.title AS met_title, e.starts_at AS met_at FROM friend_link f
         JOIN "user" u ON u.id = CASE WHEN f.user_a = $1 THEN f.user_b ELSE f.user_a END
         JOIN member_profile p ON p.user_id = u.id AND p.builds
         LEFT JOIN event e ON e.id = f.met_event
       WHERE f.user_a = $1 OR f.user_b = $1`,
      [userId],
    ),
    // One row a person: the latest event both were checked in at.
    db().query(
      `SELECT DISTINCT ON (u.id) u.id, u.name, u.image, p.interests, e.title AS met_title, e.starts_at AS met_at FROM event_checkin me
         JOIN event_checkin c ON c.event_id = me.event_id AND c.user_id <> me.user_id
         JOIN event e ON e.id = c.event_id
         JOIN "user" u ON u.id = c.user_id
         JOIN member_profile p ON p.user_id = u.id AND p.builds
       WHERE me.user_id = $1
       ORDER BY u.id, e.starts_at DESC NULLS LAST`,
      [userId],
    ),
  ]);
  const interests = (mine.rows[0]?.interests as string[] | undefined) ?? [];
  return { interests, list: [...friends.rows.map((x) => candidate(x, "connection")), ...met.rows.map((x) => candidate(x, "event"))] };
}

/**
 * Where the person stands with each person they asked to build this venture: yes once accepted, requested while it
 * waits and also after a Not now (the asker is not told no; they cannot ask again for this venture).
 */
export async function buildStatuses(userId: string, ventureId: string): Promise<Map<string, BuildStatus>> {
  const r = await db().query("SELECT to_user, accepted_at FROM build_request WHERE from_user = $1 AND venture_id = $2", [userId, ventureId]);
  const out = new Map<string, BuildStatus>();
  for (const x of r.rows) if (out.get(x.to_user) !== "yes") out.set(x.to_user as string, x.accepted_at ? "yes" : "requested");
  return out;
}

/** Asks someone to build one of the person's ventures. Throws when they were already asked for it. */
export async function askToBuild(userId: string, ventureId: string, toUser: string): Promise<{ id: string }> {
  const had = await db().query("SELECT 1 FROM build_request WHERE from_user = $1 AND venture_id = $2 AND to_user = $3 LIMIT 1", [userId, ventureId, toUser]);
  if (had.rows[0]) throw new Error("You already asked them to build this venture.");
  const id = randomUUID();
  const r = await db().query("INSERT INTO build_request (id, venture_id, from_user, to_user) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING", [id, ventureId, userId, toUser]);
  if (!r.rowCount) throw new Error("You already asked them to build this venture.");
  return { id };
}

/** Takes back a request the person made that has not been answered; false when it was answered or is not theirs. */
export async function withdrawBuildRequest(userId: string, id: string): Promise<boolean> {
  const r = await db().query("DELETE FROM build_request WHERE id = $1 AND from_user = $2 AND accepted_at IS NULL AND declined_at IS NULL", [id, userId]);
  return (r.rowCount ?? 0) > 0;
}

/** A request someone made of the person: who asked, and the venture's name and what it sells, nothing else of it. */
export type IncomingBuild = { id: string; from: { id: string; name: string; image: string | null }; venture: { name: string; what: string | null }; at: string };

/** The requests waiting on the person's answer, newest first. A request for a venture its asker removed is left out. */
export async function incomingBuildRequests(userId: string): Promise<IncomingBuild[]> {
  const r = await db().query(
    `SELECT b.id, b.from_user, u.name, u.image, l.body_ct, b.created_at FROM build_request b
       JOIN "user" u ON u.id = b.from_user
       JOIN life_record l ON l.id = b.venture_id AND l.user_id = b.from_user AND l.removed_at IS NULL
     WHERE b.to_user = $1 AND b.accepted_at IS NULL AND b.declined_at IS NULL
     ORDER BY b.created_at DESC, b.id`,
    [userId],
  );
  return r.rows.map((x) => {
    let body: Record<string, unknown> = {};
    try {
      body = JSON.parse(open(x.from_user as string, x.body_ct as string)) as Record<string, unknown>;
    } catch {
      body = {};
    }
    return { id: x.id as string, from: { id: x.from_user as string, name: nameOr(x.name), image: text(x.image) }, venture: { name: text(body.name) ?? "A venture", what: text(body.what) }, at: new Date(x.created_at as string).toISOString() };
  });
}

/**
 * Answers a request made of the person. Yes sets accepted_at and connects the pair (a friend_link, when they are not
 * connected yet) so they can message; Not now sets declined_at. Throws when it is not theirs or already answered.
 */
export async function answerBuildRequest(userId: string, id: string, yes: boolean): Promise<{ id: string; from: string; linked: boolean }> {
  return tx(async (c) => {
    const r = await c.query(
      `UPDATE build_request SET ${yes ? "accepted_at" : "declined_at"} = now() WHERE id = $1 AND to_user = $2 AND accepted_at IS NULL AND declined_at IS NULL RETURNING from_user`,
      [id, userId],
    );
    const from = r.rows[0]?.from_user as string | undefined;
    if (!from) throw new Error("That request was answered already, or is not for you.");
    let linked = false;
    if (yes) {
      const [a, b] = pairOf(userId, from);
      const l = await c.query("INSERT INTO friend_link (user_a, user_b) VALUES ($1, $2) ON CONFLICT DO NOTHING", [a, b]);
      linked = (l.rowCount ?? 0) > 0;
    }
    return { id, from, linked };
  });
}

/** Puts a Not now back to unanswered; false when it was not a Not now of the person's, or the asker asked again since. */
export async function reopenBuildRequest(userId: string, id: string): Promise<boolean> {
  const r = await db().query(
    `UPDATE build_request b SET declined_at = NULL WHERE b.id = $1 AND b.to_user = $2 AND b.declined_at IS NOT NULL AND b.accepted_at IS NULL
       AND NOT EXISTS (SELECT 1 FROM build_request o WHERE o.venture_id = b.venture_id AND o.to_user = b.to_user AND o.id <> b.id AND o.accepted_at IS NULL AND o.declined_at IS NULL)`,
    [id, userId],
  );
  return (r.rowCount ?? 0) > 0;
}
