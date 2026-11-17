import { db } from "@/db/pool";
import { open, seal } from "./crypto";
import type { ChangeLog, LoggedChange, NewChange } from "./actions/types";

// The change log (migration 0044, Ask Reflect plan step 2): every run of a non-read action. Input, before and after
// hold the person's words, so each is sealed with their key and kept as a JSON string.

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
    createdAt: new Date(x.created_at as string),
    undoneAt: x.undone_at ? new Date(x.undone_at as string) : null,
  };
}

const COLUMNS = "id, user_id, action_id, source, tier, input, before, after, status, created_at, undone_at";

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
};
