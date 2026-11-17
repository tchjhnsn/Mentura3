import { db } from "@/db/pool";
import { open, seal } from "./crypto";
import type { PlanStep, Workflow, WorkflowStore } from "./actions/types";

// Plans (migration 0048, Ask Reflect plan step 9): an ordered list of registry calls, run by ./actions/workflows.ts.
// The title and the steps hold the person's words, so each is sealed with their key and kept as a JSON string.

const UUID = /^[0-9a-f-]{36}$/;
const sealed = (userId: string, v: unknown) => JSON.stringify(seal(userId, JSON.stringify(v)));
const opened = (userId: string, v: unknown): unknown => (typeof v === "string" ? JSON.parse(open(userId, v)) : null);

function row(x: Record<string, unknown>): Workflow {
  const userId = x.user_id as string;
  return {
    id: x.id as string,
    userId,
    origin: x.origin as Workflow["origin"],
    title: (opened(userId, x.title) as string | null) ?? "",
    status: x.status as Workflow["status"],
    current: Number(x.current),
    steps: (opened(userId, x.steps) as PlanStep[] | null) ?? [],
    waitingChange: (x.waiting_change as string | null) ?? null,
    note: (x.note as string | null) ?? null,
    createdAt: new Date(x.created_at as string),
    updatedAt: new Date(x.updated_at as string),
  };
}

const COLUMNS = "id, user_id, origin, title, status, current, steps, waiting_change, note, created_at, updated_at";

export const postgresWorkflows: WorkflowStore = {
  async create(w) {
    const r = await db().query("INSERT INTO workflow (user_id, origin, title, steps) VALUES ($1, $2, $3, $4) RETURNING id", [w.userId, w.origin, sealed(w.userId, w.title), sealed(w.userId, w.steps)]);
    return r.rows[0].id as string;
  },
  async get(userId, id) {
    if (!UUID.test(id)) return null;
    const r = await db().query(`SELECT ${COLUMNS} FROM workflow WHERE id = $1 AND user_id = $2`, [id, userId]);
    return r.rows[0] ? row(r.rows[0]) : null;
  },
  async save(w) {
    await db().query(
      "UPDATE workflow SET status = $3, current = $4, steps = $5, waiting_change = $6, note = $7, updated_at = now() WHERE id = $1 AND user_id = $2",
      [w.id, w.userId, w.status, w.current, sealed(w.userId, w.steps), w.waitingChange, w.note],
    );
  },
  async waitingOn(userId, changeId) {
    if (!UUID.test(changeId)) return null;
    const r = await db().query(`SELECT ${COLUMNS} FROM workflow WHERE user_id = $1 AND status = 'waiting' AND waiting_change = $2 LIMIT 1`, [userId, changeId]);
    return r.rows[0] ? row(r.rows[0]) : null;
  },
  async claim(userId, id, changeId, to) {
    if (!UUID.test(id) || !UUID.test(changeId)) return false;
    const r = await db().query("UPDATE workflow SET status = $4, waiting_change = NULL, updated_at = now() WHERE id = $1 AND user_id = $2 AND status = 'waiting' AND waiting_change = $3 RETURNING id", [id, userId, changeId, to]);
    return r.rows.length > 0;
  },
  async list(userId, statuses, limit) {
    const r = await db().query(`SELECT ${COLUMNS} FROM workflow WHERE user_id = $1 AND status = ANY($2) ORDER BY created_at DESC LIMIT $3`, [userId, [...statuses], Math.max(1, Math.min(limit, 50))]);
    return r.rows.map(row);
  },
};
