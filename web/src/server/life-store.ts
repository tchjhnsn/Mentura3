// The records of the apps behind the home screen's other tiles (migration 0029, `@reflect/core/life`). A record's
// fields are sealed together; each state set and each act kept is a new row, never changed, so the log can read
// them. Records belong to one person and are read only by them.
import { randomUUID } from "node:crypto";
import { cleanBody, isAct, isLifeApp, isState, kindOf, type ActFacts, type Body, type LifeAppId } from "@reflect/core/life";
import { isRecordAudience, type RecordAudience } from "@reflect/core/audience";
import { db } from "@/db/pool";
import { open, seal } from "./crypto";
import { tx } from "./learn-store";
import { auditBodies, checkLifeBody, checkLifeInput, storedProblems, type KindAudit } from "./life-validate";

export type LifeRecord = { id: string; app: LifeAppId; kind: string; state: string | null; body: Body; createdAt: string; updatedAt: string };
export type LifeAct = ActFacts & { id: string; note: string | null; at: string };
export type LifeStateChange = { record: string; state: string; at: string };

const UUID = /^[0-9a-f-]{36}$/;
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const iso = (d: unknown) => new Date(d as string).toISOString();

// Records whose body was already reported, so a record read on every page is reported once per process.
const reported = new Set<string>();

function row(userId: string, r: Record<string, unknown>): LifeRecord {
  const id = r.id as string, kind = r.kind as string;
  const body = JSON.parse(open(userId, r.body_ct as string)) as Body;
  // A body that does not match its kind's schema (./life-validate.ts) is a warning, by kind, id and field names only,
  // since bodies are sealed, and is still returned as it is. Only a new write is refused.
  const problems = storedProblems(r.app as string, kind, body);
  if (problems.length && !reported.has(id)) {
    reported.add(id);
    console.warn(`life_record ${id} of kind ${String(r.app)}.${kind} does not match its schema: ${problems.map((x) => `${x.field || "(body)"}: ${x.problem}`).join("; ")}`);
  }
  return { id, app: r.app as LifeAppId, kind, state: (r.state as string | null) ?? null, body, createdAt: iso(r.created_at), updatedAt: iso(r.updated_at) };
}

/** Every record the person keeps, in one app or in all of them, oldest first. */
export async function lifeRecords(userId: string, app?: LifeAppId): Promise<LifeRecord[]> {
  const r = await db().query(`SELECT id, app, kind, state, body_ct, created_at, updated_at FROM life_record WHERE user_id = $1 AND removed_at IS NULL${app ? " AND app = $2" : ""} ORDER BY created_at, id`, app ? [userId, app] : [userId]);
  return r.rows.map((x) => row(userId, x));
}

export async function lifeRecord(userId: string, id: string): Promise<LifeRecord | null> {
  if (!UUID.test(id)) return null;
  const r = await db().query("SELECT id, app, kind, state, body_ct, created_at, updated_at FROM life_record WHERE id = $1 AND user_id = $2 AND removed_at IS NULL", [id, userId]);
  return r.rows[0] ? row(userId, r.rows[0]) : null;
}

/** Keeps a new record of a kind, with its first state when the kind has states. A kind kept once is kept once. */
export async function addLifeRecord(userId: string, app: string, kind: string, raw: Record<string, unknown>, state?: string): Promise<string> {
  if (!isLifeApp(app)) throw new Error("No such app.");
  const k = kindOf(app, kind);
  if (!k) throw new Error("No such kind.");
  checkLifeInput(app, k, raw);
  const body = cleanBody(k, raw);
  checkLifeBody(app, k, body);
  if (!k.one && body[k.title] === undefined) throw new Error(`Give it a ${k.fields.find((f) => f.key === k.title)!.label.toLowerCase()}.`);
  const first = isState(k, state) ? state : k.states?.[0]?.id ?? null;
  return tx(async (c) => {
    if (k.one) {
      const had = await c.query("SELECT id FROM life_record WHERE user_id = $1 AND app = $2 AND kind = $3 AND removed_at IS NULL LIMIT 1", [userId, app, kind]);
      if (had.rows[0]) throw new Error("You keep one of these already.");
    }
    const id = randomUUID();
    await c.query("INSERT INTO life_record (id, user_id, app, kind, state, body_ct) VALUES ($1, $2, $3, $4, $5, $6)", [id, userId, app, kind, first, seal(userId, JSON.stringify(body))]);
    if (first) await c.query("INSERT INTO life_record_state (id, record_id, user_id, state) VALUES ($1, $2, $3, $4)", [randomUUID(), id, userId, first]);
    return id;
  });
}

/** Changes a record's fields to what the person sent. */
export async function saveLifeRecord(userId: string, id: string, raw: Record<string, unknown>): Promise<void> {
  const r = await lifeRecord(userId, id);
  if (!r) throw new Error("No such record.");
  const k = kindOf(r.app, r.kind)!;
  // Only the fields this save changes are refused: one sent back as stored, in an older shape, is dropped by cleanBody.
  checkLifeInput(r.app, k, raw, r.body);
  const body = cleanBody(k, raw);
  checkLifeBody(r.app, k, body);
  if (!k.one && body[k.title] === undefined) throw new Error(`Give it a ${k.fields.find((f) => f.key === k.title)!.label.toLowerCase()}.`);
  await db().query("UPDATE life_record SET body_ct = $3, updated_at = now() WHERE id = $1 AND user_id = $2", [id, userId, seal(userId, JSON.stringify(body))]);
}

/**
 * Sets one field of a kind kept once (Food's cost, Water's gallons), keeping the rest; the record is kept first when
 * there is none. A value of null clears the field. This is how a tile changes one fact without a form.
 */
export async function setLifeField(userId: string, app: string, kind: string, key: string, value: string | number | boolean | null): Promise<void> {
  if (!isLifeApp(app)) throw new Error("No such app.");
  const k = kindOf(app, kind);
  if (!k?.one || !k.fields.some((f) => f.key === key)) throw new Error("No such field.");
  const r = (await lifeRecords(userId, app)).find((x) => x.kind === kind);
  const body: Record<string, unknown> = { ...(r?.body ?? {}) };
  if (value === null || value === false) delete body[key];
  else body[key] = value;
  if (r) await saveLifeRecord(userId, r.id, body);
  else await addLifeRecord(userId, app, kind, body);
}

/** Sets a record's state, keeping the change. Setting the state it is in keeps nothing. */
export async function setLifeState(userId: string, id: string, state: string): Promise<void> {
  const r = await lifeRecord(userId, id);
  if (!r) throw new Error("No such record.");
  if (!isState(kindOf(r.app, r.kind)!, state)) throw new Error("No such state.");
  if (r.state === state) return;
  await tx(async (c) => {
    await c.query("UPDATE life_record SET state = $3, updated_at = now() WHERE id = $1 AND user_id = $2", [id, userId, state]);
    await c.query("INSERT INTO life_record_state (id, record_id, user_id, state) VALUES ($1, $2, $3, $4)", [randomUUID(), id, userId, state]);
  });
}

/**
 * The audiences the person set on their records (migration 0063, `@reflect/core/audience`), by record id; a record
 * with none is left out, so `audienceOf(kind, map.get(id))` gives its kind's default. Empty before 0063 runs.
 */
export async function recordAudiences(userId: string): Promise<Map<string, string>> {
  try {
    const r = await db().query("SELECT id, audience FROM life_record WHERE user_id = $1 AND removed_at IS NULL AND audience IS NOT NULL", [userId]);
    return new Map(r.rows.map((x) => [x.id as string, x.audience as string]));
  } catch (e) {
    if ((e as { code?: string }).code === "42703") return new Map();
    throw e;
  }
}

/** Sets who sees one of the person's records on the shared side; null puts it back to its kind's default. */
export async function setRecordAudience(userId: string, id: string, audience: RecordAudience | null): Promise<void> {
  if (!UUID.test(id)) throw new Error("No such record.");
  if (audience !== null && !isRecordAudience(audience)) throw new Error("No such audience.");
  const r = await db().query("UPDATE life_record SET audience = $3, updated_at = now() WHERE id = $1 AND user_id = $2 AND removed_at IS NULL", [id, userId, audience]);
  if (!r.rowCount) throw new Error("No such record.");
}

/** Removes a record from view; it is kept with its removal time so it can be restored. */
export async function removeLifeRecord(userId: string, id: string): Promise<void> {
  if (!UUID.test(id)) throw new Error("No such record.");
  await db().query("UPDATE life_record SET removed_at = now() WHERE id = $1 AND user_id = $2 AND removed_at IS NULL", [id, userId]);
}

export async function restoreLifeRecord(userId: string, id: string): Promise<void> {
  if (!UUID.test(id)) throw new Error("No such record.");
  await db().query("UPDATE life_record SET removed_at = NULL WHERE id = $1 AND user_id = $2", [id, userId]);
}

/** Keeps an act on a record: what was done, on what day, for how long or how much, with a note. Returns the act's id. */
export async function keepLifeAct(userId: string, id: string, a: { kind: string; day: string; minutes?: unknown; amount?: unknown; note?: unknown }, now = new Date()): Promise<string> {
  const r = await lifeRecord(userId, id);
  if (!r) throw new Error("No such record.");
  const k = kindOf(r.app, r.kind)!;
  if (!isAct(k, a.kind)) throw new Error("No such act.");
  const ak = k.acts!.find((x) => x.id === a.kind)!;
  const latest = new Date(now.getTime() + 36 * 3600 * 1000).toISOString().slice(0, 10);
  if (!DAY.test(a.day) || Number.isNaN(Date.parse(a.day)) || a.day > latest || a.day < "1900-01-01") throw new Error("Give the day it happened.");
  const minutes = ak.minutes && a.minutes !== undefined && a.minutes !== "" ? Math.round(Number(a.minutes)) : null;
  if (minutes !== null && !(minutes >= 1 && minutes <= 1440)) throw new Error("Minutes run from 1 to 1440.");
  const amount = ak.amount && a.amount !== undefined && a.amount !== "" ? Number(String(a.amount).replace(/[$,\s]/g, "")) : null;
  if (amount !== null && !(Number.isFinite(amount) && amount >= 0 && amount < 1e10)) throw new Error("Give an amount in dollars.");
  const note = typeof a.note === "string" && a.note.trim() ? seal(userId, a.note.trim().slice(0, 4000)) : null;
  const actId = randomUUID();
  await db().query("INSERT INTO life_act (id, record_id, user_id, kind, day, minutes, amount, note_ct) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)", [actId, id, userId, a.kind, a.day, minutes, amount, note]);
  return actId;
}

/** The person's acts, on one record or on all of them, newest first. */
export async function lifeActs(userId: string, recordId?: string): Promise<LifeAct[]> {
  const r = await db().query(
    `SELECT a.id, a.record_id, a.kind, a.day::text AS day, a.minutes, a.amount, a.note_ct, a.created_at FROM life_act a JOIN life_record r ON r.id = a.record_id
     WHERE a.user_id = $1 AND r.removed_at IS NULL${recordId ? " AND a.record_id = $2" : ""} ORDER BY a.day DESC, a.created_at DESC`,
    recordId ? [userId, recordId] : [userId],
  );
  return r.rows.map((x) => ({ id: x.id as string, record: x.record_id as string, kind: x.kind as string, day: x.day as string, minutes: (x.minutes as number | null) ?? null, amount: x.amount === null ? null : Number(x.amount), note: x.note_ct ? open(userId, x.note_ct as string) : null, at: iso(x.created_at) }));
}

/**
 * A read-only audit of every stored life record, removed ones included (Restore puts them back unchecked): per kind,
 * how many bodies pass their schema and which fields fail. It opens each body to check it and returns no value. For
 * `web/scripts/check-life-records.ts`, run by whoever holds the database and the data key.
 */
export async function auditLifeRecords(): Promise<KindAudit[]> {
  const r = await db().query("SELECT user_id, app, kind, body_ct FROM life_record ORDER BY app, kind, id");
  return auditBodies(r.rows.map((x) => {
    let body: unknown;
    try {
      body = JSON.parse(open(x.user_id as string, x.body_ct as string));
    } catch {
      body = null;
    }
    return { app: x.app as string, kind: x.kind as string, body };
  }));
}

/** Every state change the person kept, for the log. */
export async function lifeStateChanges(userId: string): Promise<LifeStateChange[]> {
  const r = await db().query("SELECT s.record_id, s.state, s.created_at FROM life_record_state s JOIN life_record r ON r.id = s.record_id WHERE s.user_id = $1 AND r.removed_at IS NULL", [userId]);
  return r.rows.map((x) => ({ record: x.record_id as string, state: x.state as string, at: iso(x.created_at) }));
}
