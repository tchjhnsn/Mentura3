import { db } from "@/db/pool";
import { open, seal } from "./crypto";
import type { ChangeLog, HeldChange, LoggedChange, NewChange } from "./actions/types";

// The change log (migration 0044, Ask Reflect plan step 2): every run of a non-read action. Input, before and after
// hold the person's words, so each is sealed with their key and kept as a JSON string. A held change (migration 0046,
// step 3) has not run: it keeps its input and a sealed preview until the person taps Keep or Send, or Decline.

const UUID = /^[0-9a-f-]{36}$/;
const sealed = (userId: string, v: unknown) => (v === undefined || v === null ? null : JSON.stringify(seal(userId, JSON.stringify(v))));
const opened = (userId: string, v: unknown): unknown => (typeof v === "string" ? JSON.parse(open(userId, v)) : null);

function row(x: Record<string, unknown>): LoggedChange {
  const userId = x.user_id as string;
  return {
    id: x.id as string,
    userId,
    actionId: x.action_id as string,
    source: x.source as LoggedChange["source"],
    tier: x.tier as LoggedChange["tier"],
    input: opened(userId, x.input),
    before: opened(userId, x.before),
    after: opened(userId, x.after),
    status: x.status as LoggedChange["status"],
    preview: (opened(userId, x.preview) as string | null) ?? null,
    createdAt: new Date(x.created_at as string),
    undoneAt: x.undone_at ? new Date(x.undone_at as string) : null,
  };
}

const COLUMNS = "id, user_id, action_id, source, tier, input, before, after, status, preview, created_at, undone_at";

export const postgresChanges: ChangeLog = {
  async add(c: NewChange) {
    const r = await db().query(
      "INSERT INTO action_change (user_id, action_id, source, tier, input, before, after) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id",
      [c.userId, c.actionId, c.source, c.tier, sealed(c.userId, c.input ?? {}), sealed(c.userId, c.before), sealed(c.userId, c.after)],
    );
    return r.rows[0].id as string;
  },
  async get(userId, id) {
    if (!UUID.test(id)) return null;
    const r = await db().query(`SELECT ${COLUMNS} FROM action_change WHERE id = $1 AND user_id = $2`, [id, userId]);
    return r.rows[0] ? row(r.rows[0]) : null;
  },
  async recent(userId, limit) {
    const r = await db().query(`SELECT ${COLUMNS} FROM action_change WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2`, [userId, Math.max(1, Math.min(limit, 100))]);
    return r.rows.map(row);
  },
  async markUndone(userId, id) {
    if (!UUID.test(id)) return false;
    const r = await db().query("UPDATE action_change SET status = 'undone', undone_at = now() WHERE id = $1 AND user_id = $2 AND status = 'done' RETURNING id", [id, userId]);
    return r.rows.length > 0;
  },
  async hold(c: HeldChange) {
    const r = await db().query(
      "INSERT INTO action_change (user_id, action_id, source, tier, input, preview, status) VALUES ($1, $2, $3, $4, $5, $6, 'held') RETURNING id",
      [c.userId, c.actionId, c.source, c.tier, sealed(c.userId, c.input ?? {}), sealed(c.userId, c.preview)],
    );
    return r.rows[0].id as string;
  },
  async held(userId, since, limit) {
    const r = await db().query(`SELECT ${COLUMNS} FROM action_change WHERE user_id = $1 AND status = 'held' AND created_at >= $2 ORDER BY created_at DESC LIMIT $3`, [userId, since, Math.max(1, Math.min(limit, 100))]);
    return r.rows.map(row);
  },
  async claim(userId, id, since) {
    if (!UUID.test(id)) return false;
    const r = await db().query("UPDATE action_change SET status = 'done', decided_at = now() WHERE id = $1 AND user_id = $2 AND status = 'held' AND created_at >= $3 RETURNING id", [id, userId, since]);
    return r.rows.length > 0;
  },
  async settle(userId, id, c) {
    if (!UUID.test(id)) return;
    await db().query("UPDATE action_change SET before = $3, after = $4 WHERE id = $1 AND user_id = $2 AND status = 'done'", [id, userId, sealed(userId, c.before), sealed(userId, c.after)]);
  },
  async release(userId, id) {
    if (!UUID.test(id)) return;
    await db().query("UPDATE action_change SET status = 'held', decided_at = NULL WHERE id = $1 AND user_id = $2 AND status = 'done' AND preview IS NOT NULL AND after IS NULL", [id, userId]);
  },
  async decline(userId, id) {
    if (!UUID.test(id)) return false;
    const r = await db().query("UPDATE action_change SET status = 'declined', decided_at = now() WHERE id = $1 AND user_id = $2 AND status = 'held' RETURNING id", [id, userId]);
    return r.rows.length > 0;
  },
};
