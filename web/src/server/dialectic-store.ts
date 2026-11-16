// Dialectic (migration 0036): debates, rooms and threads. Shared between people, so nothing here is sealed with one
// person's key: what is said in a debate, a room or a thread is said in front of others. Reads return empty lists
// before the migration runs.
import { randomUUID } from "node:crypto";
import { LIMITS, clean, debateState, formatById, roomPeople, seated, type DebateState, type Side } from "@reflect/core/dialectic";
import { workById } from "@reflect/core/topic-pages";
import { db } from "@/db/pool";

export type Person = { id: string; name: string; image: string | null };
export type Debate = {
  id: string; host: Person; motion: string; workId: string | null; source: string | null; format: string; startsAt: string;
  seats: Partial<Record<Side, Person>>; roomId: string | null; state: DebateState;
  /** Turns written so far, in a written debate. */ turns: number;
};
export type Room = {
  id: string; host: Person; title: string; question: string | null; workId: string | null; debateId: string | null; createdAt: string; closed: boolean;
  speakers: Person[]; listeners: Person[]; hands: Person[];
};
export type RoomMessage = { id: string; who: Person; body: string; createdAt: string; mine: boolean };
export type Thread = { id: string; who: Person; question: string; workId: string | null; body: string | null; createdAt: string; replies: number };
export type Post = { id: string; parentId: string | null; who: Person; body: string; createdAt: string; mine: boolean; removed: boolean };

const isId = (s: string) => /^[0-9a-f-]{36}$/i.test(s);
const okWork = (w: unknown) => (typeof w === "string" && workById(w) ? w : null);
const person = (id: string, name: string | null, image: string | null): Person => ({ id, name: name?.trim() || "Someone", image });

async function people(ids: string[]): Promise<Map<string, Person>> {
  const uniq = [...new Set(ids)];
  if (!uniq.length) return new Map();
  const r = await db().query<{ id: string; name: string | null; image: string | null }>(`SELECT id, name, image FROM "user" WHERE id = ANY($1)`, [uniq]);
  return new Map(r.rows.map((u) => [u.id, person(u.id, u.name, u.image)]));
}
const who = (m: Map<string, Person>, id: string) => m.get(id) ?? person(id, null, null);

/* ---------- debates ---------- */

/** A written debate's progress, for its state: every step has a turn for each side. */
function written(format: string, turns: number): { written?: { turns: number; total: number } } {
  const f = formatById(format);
  return f?.written ? { written: { turns, total: f.steps.length * 2 } } : {};
}

type DRow = { id: string; host_id: string; motion: string; work_id: string | null; source: string | null; format: string; starts_at: Date; room_id: string | null; closed: boolean; turns: string | number | null };

async function loadDebates(where: string, args: unknown[], limit = 50): Promise<Debate[]> {
  try {
    const rows = (await db().query<DRow>(
      `SELECT d.id, d.host_id, d.motion, d.work_id, d.source, d.format, d.starts_at, r.id AS room_id, (c.room_id IS NOT NULL) AS closed,
              (SELECT count(*) FROM debate_turn t WHERE t.debate_id = d.id) AS turns
         FROM debate d LEFT JOIN dialectic_room r ON r.debate_id = d.id LEFT JOIN dialectic_room_closed c ON c.room_id = r.id
        WHERE ${where} ORDER BY d.starts_at LIMIT ${limit}`, args)).rows;
    if (!rows.length) return [];
    const seats = (await db().query<{ debate_id: string; user_id: string; side: Side; created_at: Date }>("SELECT debate_id, user_id, side, created_at FROM debate_seat WHERE debate_id = ANY($1)", [rows.map((r) => r.id)])).rows;
    const m = await people([...rows.map((r) => r.host_id), ...seats.map((s) => s.user_id)]);
    return rows.map((r) => {
      const s = seated(seats.filter((x) => x.debate_id === r.id).map((x) => ({ side: x.side, userId: x.user_id, at: x.created_at.toISOString() })));
      return {
        id: r.id, host: who(m, r.host_id), motion: r.motion, workId: r.work_id, source: r.source, format: r.format, startsAt: r.starts_at.toISOString(),
        seats: { ...(s.for ? { for: who(m, s.for) } : {}), ...(s.against ? { against: who(m, s.against) } : {}) },
        roomId: r.room_id, turns: Number(r.turns ?? 0),
        state: debateState({ startsAt: r.starts_at.toISOString(), roomOpen: Boolean(r.room_id && !r.closed), roomClosed: r.closed, ...written(r.format, Number(r.turns ?? 0)) }),
      };
    });
  } catch {
    return [];
  }
}

/** Debates still to come or live now, soonest first, and those that ended in the last month. */
export async function listDebates(): Promise<{ live: Debate[]; upcoming: Debate[]; ended: Debate[] }> {
  const all = await loadDebates("d.starts_at > now() - interval '30 days'", [], 200);
  return { live: all.filter((d) => d.state === "live"), upcoming: all.filter((d) => d.state === "upcoming"), ended: all.filter((d) => d.state === "ended").reverse() };
}

export async function getDebate(id: string): Promise<Debate | null> {
  if (!isId(id)) return null;
  return (await loadDebates("d.id = $1", [id]))[0] ?? null;
}

/** Hosts a debate: a motion, the work it comes from, a format and a time. The host may take a side. */
export async function createDebate(userId: string, f: { motion: unknown; workId: unknown; source: unknown; format: unknown; startsAt: unknown; side: unknown }): Promise<string> {
  const motion = clean(f.motion, LIMITS.motion[1], LIMITS.motion[0]);
  if (!motion) throw new Error("Write the motion, a question or claim of 8 to 200 characters.");
  const format = typeof f.format === "string" && formatById(f.format) ? f.format : null;
  if (!format) throw new Error("Choose a format.");
  const at = typeof f.startsAt === "string" ? Date.parse(f.startsAt) : NaN;
  if (!Number.isFinite(at) || at < Date.now() - 3600_000 || at > Date.now() + 366 * 86400_000) throw new Error("Choose a time within the next year.");
  const id = randomUUID();
  await db().query("INSERT INTO debate (id, host_id, motion, work_id, source, format, starts_at) VALUES ($1, $2, $3, $4, $5, $6, $7)", [id, userId, motion, okWork(f.workId), clean(f.source, LIMITS.source), format, new Date(at)]);
  if (f.side === "for" || f.side === "against") await takeSeat(userId, id, f.side);
  return id;
}

/** Takes an open seat. Refused when the side is taken or the person already holds the other. */
export async function takeSeat(userId: string, debateId: string, side: Side): Promise<void> {
  const d = await getDebate(debateId);
  if (!d || d.state === "ended") throw new Error("That debate is over.");
  if (d.seats[side]) throw new Error("That seat is taken.");
  if (Object.values(d.seats).some((p) => p?.id === userId)) throw new Error("You already hold a seat.");
  await db().query("INSERT INTO debate_seat (id, debate_id, user_id, side) VALUES ($1, $2, $3, $4)", [randomUUID(), debateId, userId, side]);
}

/** The host opens the debate's room, which makes it live. Returns the room. */
export async function startDebate(userId: string, debateId: string): Promise<string> {
  const d = await getDebate(debateId);
  if (!d || d.host.id !== userId) throw new Error("Only the host can start the debate.");
  if (d.roomId) return d.roomId;
  const id = randomUUID();
  await db().query("INSERT INTO dialectic_room (id, host_id, title, question, work_id, debate_id) VALUES ($1, $2, $3, $4, $5, $6)", [id, userId, "Debate", d.motion, d.workId, d.id]);
  for (const p of Object.values(d.seats)) if (p) await db().query("INSERT INTO dialectic_room_event (id, room_id, user_id, kind, by_id) VALUES ($1, $2, $3, 'grant', $4)", [randomUUID(), id, p.id, userId]);
  return id;
}

/* ---------- rooms ---------- */

type RRow = { id: string; host_id: string; title: string; question: string | null; work_id: string | null; debate_id: string | null; created_at: Date; closed: boolean };

async function loadRooms(where: string, args: unknown[], limit = 50): Promise<Room[]> {
  try {
    const rows = (await db().query<RRow>(
      `SELECT r.id, r.host_id, r.title, r.question, r.work_id, r.debate_id, r.created_at, (c.room_id IS NOT NULL) AS closed
         FROM dialectic_room r LEFT JOIN dialectic_room_closed c ON c.room_id = r.id WHERE ${where} ORDER BY r.created_at DESC LIMIT ${limit}`, args)).rows;
    if (!rows.length) return [];
    const ev = (await db().query<{ room_id: string; user_id: string; kind: "join" | "leave" | "hand" | "grant"; created_at: Date }>(
      "SELECT room_id, user_id, kind, created_at FROM dialectic_room_event WHERE room_id = ANY($1) AND created_at > now() - interval '1 day'", [rows.map((r) => r.id)])).rows;
    const m = await people([...rows.map((r) => r.host_id), ...ev.map((e) => e.user_id)]);
    return rows.map((r) => {
      const mine = ev.filter((e) => e.room_id === r.id).map((e) => ({ userId: e.user_id, kind: e.kind, at: e.created_at.toISOString() }));
      const p = roomPeople({
        host: r.host_id,
        moves: mine.filter((e) => e.kind === "join" || e.kind === "leave") as { userId: string; kind: "join" | "leave"; at: string }[],
        hands: mine.filter((e) => e.kind === "hand"), grants: mine.filter((e) => e.kind === "grant"),
      });
      return {
        id: r.id, host: who(m, r.host_id), title: r.title, question: r.question, workId: r.work_id, debateId: r.debate_id, createdAt: r.created_at.toISOString(), closed: r.closed,
        speakers: p.speakers.map((u) => who(m, u)), listeners: p.listeners.map((u) => who(m, u)), hands: p.hands.map((u) => who(m, u)),
      };
    });
  } catch {
    return [];
  }
}

/** Rooms open now (debates' rooms apart), newest first. */
export const openRooms = (): Promise<Room[]> => loadRooms("c.room_id IS NULL AND r.debate_id IS NULL AND r.created_at > now() - interval '1 day'", []);

export async function getRoom(id: string): Promise<Room | null> {
  if (!isId(id)) return null;
  return (await loadRooms("r.id = $1", [id]))[0] ?? null;
}

/** Opens a room on a work or a question; the person who opens it hosts it and joins it. */
export async function createRoom(userId: string, f: { title: unknown; question: unknown; workId: unknown }): Promise<string> {
  const work = okWork(f.workId);
  const title = clean(f.title, LIMITS.title[1], LIMITS.title[0]) ?? (work ? workById(work)!.title : null);
  if (!title) throw new Error("Name the room, or choose a work.");
  const id = randomUUID();
  await db().query("INSERT INTO dialectic_room (id, host_id, title, question, work_id) VALUES ($1, $2, $3, $4, $5)", [id, userId, title, clean(f.question, LIMITS.question[1], LIMITS.question[0]), work]);
  await roomEvent(userId, id, "join");
  return id;
}

/** Joins, leaves or raises a hand in an open room. */
export async function roomEvent(userId: string, roomId: string, kind: "join" | "leave" | "hand"): Promise<void> {
  const r = await getRoom(roomId);
  if (!r || r.closed) throw new Error("That room has closed.");
  await db().query("INSERT INTO dialectic_room_event (id, room_id, user_id, kind) VALUES ($1, $2, $3, $4)", [randomUUID(), roomId, userId, kind]);
}

/** The host lets someone speak. */
export async function letSpeak(hostId: string, roomId: string, userId: string): Promise<void> {
  const r = await getRoom(roomId);
  if (!r || r.closed || r.host.id !== hostId) throw new Error("Only the host can let someone speak.");
  await db().query("INSERT INTO dialectic_room_event (id, room_id, user_id, kind, by_id) VALUES ($1, $2, $3, 'grant', $4)", [randomUUID(), roomId, userId, hostId]);
}

/** The host closes the room; a debate's room closing ends the debate. */
export async function closeRoom(hostId: string, roomId: string): Promise<void> {
  const r = await getRoom(roomId);
  if (!r || r.host.id !== hostId) throw new Error("Only the host can close the room.");
  await db().query("INSERT INTO dialectic_room_closed (room_id, user_id) VALUES ($1, $2) ON CONFLICT (room_id) DO NOTHING", [roomId, hostId]);
}

export async function roomMessages(userId: string, roomId: string): Promise<RoomMessage[]> {
  if (!isId(roomId)) return [];
  try {
    const rows = (await db().query<{ id: string; user_id: string; body: string; created_at: Date }>("SELECT id, user_id, body, created_at FROM dialectic_room_message WHERE room_id = $1 ORDER BY created_at DESC LIMIT 200", [roomId])).rows.reverse();
    const m = await people(rows.map((r) => r.user_id));
    return rows.map((r) => ({ id: r.id, who: who(m, r.user_id), body: r.body, createdAt: r.created_at.toISOString(), mine: r.user_id === userId }));
  } catch {
    return [];
  }
}

export async function sayInRoom(userId: string, roomId: string, body: unknown): Promise<void> {
  const text = clean(body, LIMITS.chat);
  if (!text) throw new Error("Write something first.");
  const r = await getRoom(roomId);
  if (!r || r.closed) throw new Error("That room has closed.");
  await db().query("INSERT INTO dialectic_room_message (id, room_id, user_id, body) VALUES ($1, $2, $3, $4)", [randomUUID(), roomId, userId, text]);
}

/* ---------- threads ---------- */

export async function listThreads(limit = 30): Promise<Thread[]> {
  try {
    const rows = (await db().query<{ id: string; user_id: string; question: string; work_id: string | null; body: string | null; created_at: Date; replies: string }>(
      `SELECT t.id, t.user_id, t.question, t.work_id, t.body, t.created_at, (SELECT count(*) FROM dialectic_post p WHERE p.thread_id = t.id) AS replies
         FROM dialectic_thread t ORDER BY t.created_at DESC LIMIT ${Math.min(100, limit)}`)).rows;
    const m = await people(rows.map((r) => r.user_id));
    return rows.map((r) => ({ id: r.id, who: who(m, r.user_id), question: r.question, workId: r.work_id, body: r.body, createdAt: r.created_at.toISOString(), replies: Number(r.replies) }));
  } catch {
    return [];
  }
}

export async function getThread(userId: string, id: string): Promise<{ thread: Thread; posts: Post[] } | null> {
  if (!isId(id)) return null;
  try {
    const t = (await db().query<{ id: string; user_id: string; question: string; work_id: string | null; body: string | null; created_at: Date }>("SELECT id, user_id, question, work_id, body, created_at FROM dialectic_thread WHERE id = $1", [id])).rows[0];
    if (!t) return null;
    const rows = (await db().query<{ id: string; parent_id: string | null; user_id: string; body: string; created_at: Date; removed: boolean }>(
      `SELECT p.id, p.parent_id, p.user_id, p.body, p.created_at, (r.post_id IS NOT NULL) AS removed FROM dialectic_post p LEFT JOIN dialectic_post_removed r ON r.post_id = p.id WHERE p.thread_id = $1 ORDER BY p.created_at LIMIT 2000`, [id])).rows;
    const m = await people([t.user_id, ...rows.map((r) => r.user_id)]);
    const posts = rows.map((r) => ({ id: r.id, parentId: r.parent_id, who: who(m, r.user_id), body: r.removed ? "" : r.body, createdAt: r.created_at.toISOString(), mine: r.user_id === userId, removed: r.removed }));
    const answered = new Set(posts.filter((p) => !p.removed && p.parentId).map((p) => p.parentId));
    return { thread: { id: t.id, who: who(m, t.user_id), question: t.question, workId: t.work_id, body: t.body, createdAt: t.created_at.toISOString(), replies: rows.length }, posts: posts.filter((p) => !p.removed || answered.has(p.id)) };
  } catch {
    return null;
  }
}

export async function createThread(userId: string, f: { question: unknown; workId: unknown; body: unknown }): Promise<string> {
  const question = clean(f.question, LIMITS.question[1], LIMITS.question[0]);
  if (!question) throw new Error("Ask a question of 8 to 300 characters.");
  const id = randomUUID();
  await db().query("INSERT INTO dialectic_thread (id, user_id, question, work_id, body) VALUES ($1, $2, $3, $4, $5)", [id, userId, question, okWork(f.workId), clean(f.body, LIMITS.body)]);
  return id;
}

export async function addPost(userId: string, threadId: string, body: unknown, parentId?: string | null): Promise<void> {
  const text = clean(body, LIMITS.body);
  if (!text) throw new Error("Write something first.");
  if (!isId(threadId)) throw new Error("No such thread.");
  const parent = parentId && isId(parentId) ? parentId : null;
  if (parent && !(await db().query("SELECT 1 FROM dialectic_post WHERE id = $1 AND thread_id = $2", [parent, threadId])).rowCount) throw new Error("That reply is not in this thread.");
  await db().query("INSERT INTO dialectic_post (id, thread_id, user_id, parent_id, body) VALUES ($1, $2, $3, $4, $5)", [randomUUID(), threadId, userId, parent, text]);
}

export async function removePost(userId: string, postId: string): Promise<void> {
  if (!isId(postId) || !(await db().query("SELECT 1 FROM dialectic_post WHERE id = $1 AND user_id = $2", [postId, userId])).rowCount) throw new Error("Only its author can take a reply down.");
  await db().query("INSERT INTO dialectic_post_removed (post_id, user_id) VALUES ($1, $2) ON CONFLICT (post_id) DO NOTHING", [postId, userId]);
}
