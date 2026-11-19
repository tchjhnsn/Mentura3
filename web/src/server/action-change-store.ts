import { Context, Effect, Layer } from "effect";
import { randomUUID } from "node:crypto";
import { open, seal } from "./crypto";
import { query, type StoreFailed } from "./store-effect";
import type { ChangeLog as ChangeLogPromises, HeldChange, LoggedChange, NewChange } from "./actions/types";

// The change log (migration 0044, Ask Reflect plan step 2): every run of a non-read action. Input, before and after
// hold the person's words, so each is sealed with their key and kept as a JSON string. A held change (migration 0046,
// step 3) has not run: it keeps its input and a sealed preview until the person taps Keep or Send, or Decline.
//
// The store is an Effect service (the trial of moving stores to Effect, step 3): `ChangeLog` is its key, with every
// method of the Promise ChangeLog in ./actions/types.ts as an Effect that fails with StoreFailed (./store-effect.ts).
// `ChangeLogLive` is the Postgres Layer over db(); `ChangeLogMemory` is a Layer over memory for tests.
// `postgresChanges`, the Promise ChangeLog that ./actions/run.ts uses, runs the live Layer with Effect.runPromise, so
// callers do not change. db() is called when each Effect runs, inside the caller's async context, so a call made
// inside `transaction(f)` (@/db/pool) is part of that transaction.

/** The Promise ChangeLog's methods, each as an Effect that fails with StoreFailed instead of throwing. */
export type ChangeLogEffects = {
  readonly [K in keyof ChangeLogPromises]: ChangeLogPromises[K] extends (...args: infer P) => Promise<infer R> ? (...args: P) => Effect.Effect<R, StoreFailed> : never;
};

/** The change log as an Effect service. */
export class ChangeLog extends Context.Service<ChangeLog, ChangeLogEffects>()("reflect/ChangeLog") {}

const STORE = "action_change";
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
const clamp = (limit: number) => Math.max(1, Math.min(limit, 100));
const firstId = (rows: Record<string, unknown>[]) => rows[0]!.id as string;

/** The change log in Postgres, through db(). */
const live: ChangeLogEffects = {
  add: (c: NewChange) =>
    query(STORE, "add", "INSERT INTO action_change (user_id, action_id, source, tier, input, before, after) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id", () => [
      c.userId, c.actionId, c.source, c.tier, sealed(c.userId, c.input ?? {}), sealed(c.userId, c.before), sealed(c.userId, c.after),
    ]).pipe(Effect.map(firstId)),
  get: (userId, id) =>
    !UUID.test(id) ? Effect.succeed(null) : query(STORE, "get", `SELECT ${COLUMNS} FROM action_change WHERE id = $1 AND user_id = $2`, () => [id, userId]).pipe(Effect.map((rows) => (rows[0] ? row(rows[0]) : null))),
  recent: (userId, limit) =>
    query(STORE, "recent", `SELECT ${COLUMNS} FROM action_change WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2`, () => [userId, clamp(limit)]).pipe(Effect.map((rows) => rows.map(row))),
  markUndone: (userId, id) =>
    !UUID.test(id) ? Effect.succeed(false) : query(STORE, "markUndone", "UPDATE action_change SET status = 'undone', undone_at = now() WHERE id = $1 AND user_id = $2 AND status = 'done' RETURNING id", () => [id, userId]).pipe(Effect.map((rows) => rows.length > 0)),
  hold: (c: HeldChange) =>
    query(STORE, "hold", "INSERT INTO action_change (user_id, action_id, source, tier, input, preview, status) VALUES ($1, $2, $3, $4, $5, $6, 'held') RETURNING id", () => [
      c.userId, c.actionId, c.source, c.tier, sealed(c.userId, c.input ?? {}), sealed(c.userId, c.preview),
    ]).pipe(Effect.map(firstId)),
  held: (userId, since, limit) =>
    query(STORE, "held", `SELECT ${COLUMNS} FROM action_change WHERE user_id = $1 AND status = 'held' AND created_at >= $2 ORDER BY created_at DESC LIMIT $3`, () => [userId, since, clamp(limit)]).pipe(Effect.map((rows) => rows.map(row))),
  claim: (userId, id, since) =>
    !UUID.test(id) ? Effect.succeed(false) : query(STORE, "claim", "UPDATE action_change SET status = 'done', decided_at = now() WHERE id = $1 AND user_id = $2 AND status = 'held' AND created_at >= $3 RETURNING id", () => [id, userId, since]).pipe(Effect.map((rows) => rows.length > 0)),
  settle: (userId, id, c) =>
    !UUID.test(id) ? Effect.void : query(STORE, "settle", "UPDATE action_change SET before = $3, after = $4 WHERE id = $1 AND user_id = $2 AND status = 'done'", () => [id, userId, sealed(userId, c.before), sealed(userId, c.after)]).pipe(Effect.asVoid),
  release: (userId, id) =>
    !UUID.test(id) ? Effect.void : query(STORE, "release", "UPDATE action_change SET status = 'held', decided_at = NULL WHERE id = $1 AND user_id = $2 AND status = 'done' AND preview IS NOT NULL AND after IS NULL", () => [id, userId]).pipe(Effect.asVoid),
  decline: (userId, id) =>
    !UUID.test(id) ? Effect.succeed(false) : query(STORE, "decline", "UPDATE action_change SET status = 'declined', decided_at = now() WHERE id = $1 AND user_id = $2 AND status = 'held' RETURNING id", () => [id, userId]).pipe(Effect.map((rows) => rows.length > 0)),
};

/** The change log in Postgres. */
export const ChangeLogLive: Layer.Layer<ChangeLog> = Layer.succeed(ChangeLog, live);

/**
 * The change log in memory, for tests: the same rules as the Postgres one (the person's rows only, newest first,
 * limits held to 1 to 100, claim and decline only of a held change, release only of a claimed one that has not
 * settled). Nothing is sealed. `rows` is the table; `now` is the clock for created_at.
 */
export function ChangeLogMemory(rows: LoggedChange[] = [], now: () => Date = () => new Date()): Layer.Layer<ChangeLog> {
  const mine = (userId: string) => rows.filter((r) => r.userId === userId).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  const find = (userId: string, id: string, ok: (r: LoggedChange) => boolean) => rows.find((r) => r.id === id && r.userId === userId && ok(r));
  // A read gives a copy, as a query gives new objects, so a later write does not change what was read.
  const copy = <T extends LoggedChange | undefined>(r: T): T => (r ? { ...r } : r);
  return Layer.succeed(ChangeLog, {
    add: (c) =>
      Effect.sync(() => {
        const id = randomUUID();
        rows.push({ ...c, input: c.input ?? {}, id, status: "done", preview: null, createdAt: now(), undoneAt: null });
        return id;
      }),
    get: (userId, id) => Effect.sync(() => copy(find(userId, id, () => true)) ?? null),
    recent: (userId, limit) => Effect.sync(() => mine(userId).slice(0, clamp(limit)).map(copy)),
    markUndone: (userId, id) =>
      Effect.sync(() => {
        const r = find(userId, id, (x) => x.status === "done");
        if (r) Object.assign(r, { status: "undone", undoneAt: now() });
        return Boolean(r);
      }),
    hold: (c) =>
      Effect.sync(() => {
        const id = randomUUID();
        rows.push({ ...c, input: c.input ?? {}, id, before: null, after: null, status: "held", createdAt: now(), undoneAt: null });
        return id;
      }),
    held: (userId, since, limit) => Effect.sync(() => mine(userId).filter((r) => r.status === "held" && r.createdAt >= since).slice(0, clamp(limit)).map(copy)),
    claim: (userId, id, since) =>
      Effect.sync(() => {
        const r = find(userId, id, (x) => x.status === "held" && x.createdAt >= since);
        if (r) r.status = "done";
        return Boolean(r);
      }),
    settle: (userId, id, c) =>
      Effect.sync(() => {
        const r = find(userId, id, (x) => x.status === "done");
        if (r) Object.assign(r, { before: c.before, after: c.after });
      }),
    release: (userId, id) =>
      Effect.sync(() => {
        const r = find(userId, id, (x) => x.status === "done" && x.preview !== null && (x.after === null || x.after === undefined));
        if (r) r.status = "held";
      }),
    decline: (userId, id) =>
      Effect.sync(() => {
        const r = find(userId, id, (x) => x.status === "held");
        if (r) r.status = "declined";
        return Boolean(r);
      }),
  });
}

/** Runs one ChangeLog method through the live Layer, as a Promise that rejects with StoreFailed. */
const run = <A>(f: (log: ChangeLogEffects) => Effect.Effect<A, StoreFailed>): Promise<A> => Effect.runPromise(ChangeLog.use(f).pipe(Effect.provide(ChangeLogLive)));

/** The change log in Postgres for Promise callers (./actions/run.ts). */
export const postgresChanges: ChangeLogPromises = {
  add: (c) => run((log) => log.add(c)),
  get: (userId, id) => run((log) => log.get(userId, id)),
  recent: (userId, limit) => run((log) => log.recent(userId, limit)),
  markUndone: (userId, id) => run((log) => log.markUndone(userId, id)),
  hold: (c) => run((log) => log.hold(c)),
  held: (userId, since, limit) => run((log) => log.held(userId, since, limit)),
  claim: (userId, id, since) => run((log) => log.claim(userId, id, since)),
  settle: (userId, id, c) => run((log) => log.settle(userId, id, c)),
  release: (userId, id) => run((log) => log.release(userId, id)),
  decline: (userId, id) => run((log) => log.decline(userId, id)),
};
