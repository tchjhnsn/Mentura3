// Where messages between members are kept (migration 0047): friend connections, friend invite links and the messages
// themselves. A message's text is sealed with its pair's key, so only its two members read it. The rules (who may
// message whom, who may read which thread) are in ./messages-store.ts; this module only reads and writes rows.
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { pairOf, type Contact, type Message } from "@reflect/core/messages";
import { db } from "@/db/pool";
import { open, seal } from "./crypto";

/** The rows behind messages: Postgres in the app, an in-memory stand-in in tests. Every call is for one person. */
export interface MessageDb {
  /** Everyone connected to the person: household members with their own login, and accepted friends. */
  contacts(userId: string): Promise<Contact[]>;
  insert(m: { from: string; to: string; text: string }): Promise<Message>;
  /** The last `limit` messages between the person and one other member, oldest first. */
  between(userId: string, other: string, limit: number): Promise<Message[]>;
  /** The newest message of each of the person's conversations. */
  latest(userId: string): Promise<Message[]>;
}

const keyOf = (a: string, b: string) => `message:${a}:${b}`;
const hash = (token: string) => createHash("sha256").update(token).digest("hex");
const INVITE_DAYS = 14;
const nameOr = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : "A member");

function row(x: Record<string, unknown>): Message {
  const a = x.user_a as string;
  const b = x.user_b as string;
  const from = x.from_user as string;
  return { id: x.id as string, from, to: from === a ? b : a, text: open(keyOf(a, b), x.body_ct as string), at: new Date(x.created_at as string).toISOString() };
}

export const postgresMessages: MessageDb = {
  async contacts(userId) {
    const r = await db().query(
      `SELECT u.id, u.name, 'household' AS via FROM household_member me
         JOIN household_member m ON m.household_id = me.household_id AND m.removed_at IS NULL AND m.user_id IS NOT NULL AND m.user_id <> me.user_id
         JOIN "user" u ON u.id = m.user_id
       WHERE me.user_id = $1 AND me.removed_at IS NULL
       UNION ALL
       SELECT u.id, u.name, 'friend' AS via FROM friend_link f
         JOIN "user" u ON u.id = CASE WHEN f.user_a = $1 THEN f.user_b ELSE f.user_a END
       WHERE f.user_a = $1 OR f.user_b = $1`,
      [userId],
    );
    const seen = new Map<string, Contact>();
    for (const x of r.rows) if (!seen.has(x.id) || x.via === "household") seen.set(x.id, { id: x.id, name: nameOr(x.name), via: x.via });
    return [...seen.values()].sort((p, q) => p.name.localeCompare(q.name));
  },
  async insert({ from, to, text }) {
    const [a, b] = pairOf(from, to);
    const r = await db().query("INSERT INTO member_message (id, user_a, user_b, from_user, body_ct) VALUES ($1, $2, $3, $4, $5) RETURNING id, user_a, user_b, from_user, body_ct, created_at", [randomUUID(), a, b, from, seal(keyOf(a, b), text)]);
    return row(r.rows[0]);
  },
  async between(userId, other, limit) {
    const [a, b] = pairOf(userId, other);
    const r = await db().query("SELECT id, user_a, user_b, from_user, body_ct, created_at FROM member_message WHERE user_a = $1 AND user_b = $2 ORDER BY created_at DESC, id DESC LIMIT $3", [a, b, limit]);
    return r.rows.map(row).reverse();
  },
  async latest(userId) {
    const r = await db().query("SELECT DISTINCT ON (user_a, user_b) id, user_a, user_b, from_user, body_ct, created_at FROM member_message WHERE user_a = $1 OR user_b = $1 ORDER BY user_a, user_b, created_at DESC, id DESC", [userId]);
    return r.rows.map(row);
  },
};

/** Makes a friend invite link's token. The link works once, for 14 days; only its hash is kept. */
export async function createFriendInvite(userId: string): Promise<string> {
  const token = randomBytes(24).toString("base64url");
  const expires = new Date(Date.now() + INVITE_DAYS * 86_400_000).toISOString();
  await db().query("INSERT INTO friend_invite (id, token_hash, invited_by, expires_at) VALUES ($1, $2, $3, $4)", [randomUUID(), hash(token), userId, expires]);
  return token;
}

async function findInvite(token: string): Promise<{ id: string; by: string; name: string } | null> {
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(token)) return null;
  const r = await db().query(
    `SELECT i.id, i.invited_by, u.name FROM friend_invite i JOIN "user" u ON u.id = i.invited_by
     WHERE i.token_hash = $1 AND i.accepted_at IS NULL AND i.revoked_at IS NULL AND i.expires_at > now()`,
    [hash(token)],
  );
  const x = r.rows[0];
  return x ? { id: x.id, by: x.invited_by, name: nameOr(x.name) } : null;
}

/** Who sent an invite link and whether it is the person's own, for its page; null when it has expired or was used. */
export async function friendInviteInfo(token: string, userId: string): Promise<{ inviter: string; own: boolean } | null> {
  const f = await findInvite(token);
  return f ? { inviter: f.name, own: f.by === userId } : null;
}

/** Connects the person with whoever sent the link. The link is used up, even when the two were already connected. */
export async function acceptFriendInvite(userId: string, token: string): Promise<{ name: string }> {
  const f = await findInvite(token);
  if (!f) throw new Error("This invite has expired or was already used.");
  if (f.by === userId) throw new Error("This is your own invite. Send it to the friend you want to message.");
  const [a, b] = pairOf(userId, f.by);
  const used = await db().query("UPDATE friend_invite SET accepted_by = $2, accepted_at = now() WHERE id = $1 AND accepted_at IS NULL", [f.id, userId]);
  if (!used.rowCount) throw new Error("This invite has expired or was already used.");
  await db().query("INSERT INTO friend_link (user_a, user_b) VALUES ($1, $2) ON CONFLICT DO NOTHING", [a, b]);
  return { name: f.name };
}
