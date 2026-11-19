import { Effect, Exit } from "effect";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { LoggedChange, NewChange } from "./actions/types";

// The change log as an Effect service: the service over the memory Layer; the live Layer turning a driver error into
// StoreFailed without the values; and the Promise edge (`postgresChanges`) inside `transaction(f)`, on the real
// @/db/pool over a fake Neon driver that records which connection each statement went to. Nothing reaches a database;
// action-change-store.live.test.ts runs against Neon when DATABASE_URL is set.

const fake = vi.hoisted(() => ({
  log: [] as [string, string][],
  clients: 0,
  fail: null as { match: string; err: unknown } | null,
}));

vi.mock("@neondatabase/serverless", () => {
  const answer = async (conn: string, text: string) => {
    fake.log.push([conn, text]);
    if (fake.fail && text.includes(fake.fail.match)) throw fake.fail.err;
    return { rows: text.includes("RETURNING id") ? [{ id: "00000000-0000-4000-8000-000000000001" }] : [] };
  };
  class Pool {
    query(text: string) {
      return answer("pool", text);
    }
    async connect() {
      const id = `client${++fake.clients}`;
      return { query: (text: string) => answer(id, text), release: () => void fake.log.push([id, "release"]) };
    }
    async end() {}
  }
  return { Pool, neonConfig: {} };
});
vi.mock("./crypto", () => ({ seal: (_u: string, t: string) => `sealed:${t}`, open: (_u: string, s: string) => s.slice("sealed:".length) }));

const { ChangeLog, ChangeLogLive, ChangeLogMemory, postgresChanges } = await import("./action-change-store");
const { StoreFailed } = await import("./store-effect");
const { transaction } = await import("@/db/pool");

const change = (userId: string, words = "dinner with Ann"): NewChange => ({ userId, actionId: "add_event", source: "chat", tier: "own", input: { title: words }, before: null, after: { events: ["e1"] } });
const held = (userId: string) => ({ userId, actionId: "send_message", source: "chat" as const, tier: "outside" as const, input: { to: "Ben" }, preview: "Send Ben: hello" });

/** A clock that moves a minute on each read, so rows have an order. */
function clock(start = Date.parse("2026-11-19T12:00:00Z")) {
  let t = start;
  return () => new Date((t += 60_000));
}

describe("the ChangeLog service over memory", () => {
  it("adds, gets and lists the person's changes, newest first, and undoes a done one once", async () => {
    const rows: LoggedChange[] = [];
    const r = await Effect.runPromise(
      Effect.gen(function* () {
        const log = yield* ChangeLog;
        const a = yield* log.add(change("u1", "first"));
        const b = yield* log.add(change("u1", "second"));
        yield* log.add(change("u2", "not yours"));
        return {
          a,
          got: yield* log.get("u1", a),
          other: yield* log.get("u2", a),
          recent: (yield* log.recent("u1", 10)).map((c) => c.id),
          one: (yield* log.recent("u1", 0)).map((c) => c.id),
          b,
          undone: yield* log.markUndone("u1", a),
          again: yield* log.markUndone("u1", a),
          byOther: yield* log.markUndone("u2", b),
        };
      }).pipe(Effect.provide(ChangeLogMemory(rows, clock()))),
    );
    expect(r.got).toMatchObject({ userId: "u1", actionId: "add_event", input: { title: "first" }, status: "done", preview: null });
    expect(r.other).toBeNull();
    expect(r.recent).toEqual([r.b, r.a]);
    expect(r.one).toEqual([r.b]);
    expect([r.undone, r.again, r.byOther]).toEqual([true, false, false]);
    expect(rows.find((x) => x.id === r.a)).toMatchObject({ status: "undone" });
    expect(rows.find((x) => x.id === r.a)!.undoneAt).toBeInstanceOf(Date);
  });

  it("holds a change, lists held ones since a time, claims it once, settles it, and releases only an unsettled claim", async () => {
    const rows: LoggedChange[] = [];
    const now = clock();
    const r = await Effect.runPromise(
      Effect.gen(function* () {
        const log = yield* ChangeLog;
        const old = yield* log.hold(held("u1"));
        const since = now();
        const h = yield* log.hold(held("u1"));
        const listed = (yield* log.held("u1", since, 10)).map((c) => c.id);
        const oldClaim = yield* log.claim("u1", old, since);
        const otherClaim = yield* log.claim("u2", h, since);
        const first = yield* log.claim("u1", h, since);
        const second = yield* log.claim("u1", h, since);
        yield* log.release("u1", h);
        const released = (yield* log.get("u1", h))!.status;
        const reclaimed = yield* log.claim("u1", h, since);
        yield* log.settle("u1", h, { before: null, after: { sent: true } });
        yield* log.release("u1", h);
        return { h, listed, oldClaim, otherClaim, first, second, released, reclaimed, settled: yield* log.get("u1", h) };
      }).pipe(Effect.provide(ChangeLogMemory(rows, now))),
    );
    expect(r.listed).toEqual([r.h]);
    expect([r.oldClaim, r.otherClaim, r.first, r.second]).toEqual([false, false, true, false]);
    expect(r.released).toBe("held");
    expect(r.reclaimed).toBe(true);
    expect(r.settled).toMatchObject({ status: "done", after: { sent: true }, preview: "Send Ben: hello" });
  });

  it("declines a held change once, and not a done one", async () => {
    const r = await Effect.runPromise(
      Effect.gen(function* () {
        const log = yield* ChangeLog;
        const h = yield* log.hold(held("u1"));
        const d = yield* log.add(change("u1"));
        return {
          byOther: yield* log.decline("u2", h),
          first: yield* log.decline("u1", h),
          second: yield* log.decline("u1", h),
          done: yield* log.decline("u1", d),
          claimDeclined: yield* log.claim("u1", h, new Date(0)),
          status: (yield* log.get("u1", h))!.status,
        };
      }).pipe(Effect.provide(ChangeLogMemory([], clock()))),
    );
    expect(r).toEqual({ byOther: false, first: true, second: false, done: false, claimDeclined: false, status: "declined" });
  });
});

describe("the live ChangeLog Layer", () => {
  beforeAll(() => void vi.stubEnv("NEXT_PHASE", "phase-production-build"));
  beforeEach(() => {
    fake.log.length = 0;
    fake.fail = null;
  });

  it("fails with StoreFailed carrying the SQLSTATE and never the driver's message, detail or values", async () => {
    fake.fail = {
      match: "INSERT INTO action_change",
      err: Object.assign(new Error('insert or update on table "action_change" violates foreign key constraint: Key (user_id)=(secret-user) is not present'), {
        code: "23503",
        detail: "Key (user_id)=(secret-user) is not present in table \"user\".",
        severity: "ERROR",
      }),
    };
    const exit = await Effect.runPromiseExit(ChangeLog.use((log) => log.add(change("secret-user", "my secret words"))).pipe(Effect.provide(ChangeLogLive)));
    expect(Exit.isFailure(exit)).toBe(true);
    const err = await postgresChanges.add(change("secret-user", "my secret words")).then(() => null, (e: unknown) => e);
    expect(err).toBeInstanceOf(StoreFailed);
    const f = err as InstanceType<typeof StoreFailed>;
    expect({ tag: f._tag, store: f.store, op: f.op, code: f.code, message: f.message }).toEqual({ tag: "StoreFailed", store: "action_change", op: "add", code: "23503", message: "action_change.add failed (SQLSTATE 23503)" });
    expect(f.cause).toBeUndefined();
    for (const text of [f.message, String(f), String(f.stack), JSON.stringify(f), JSON.stringify(exit)]) expect(text).not.toMatch(/secret|violates|Key \(/);
  });

  it("gives a null code for a failure with no SQLSTATE, and Effect callers catch it by tag", async () => {
    fake.fail = { match: "FROM action_change", err: new Error("socket closed while reading secret rows") };
    const caught = await Effect.runPromise(
      ChangeLog.use((log) => log.recent("u1", 5)).pipe(
        Effect.provide(ChangeLogLive),
        Effect.map(() => "read"),
        Effect.catchTag("StoreFailed", (e) => Effect.succeed(`${e.op}: ${e.code}: ${e.message}`)),
      ),
    );
    expect(caught).toBe("recent: null: action_change.recent failed");
  });

  it("does not query for an id that is not a uuid", async () => {
    expect(await postgresChanges.get("u1", "nope")).toBeNull();
    expect(await postgresChanges.claim("u1", "nope", new Date())).toBe(false);
    expect(fake.log).toEqual([]);
  });

  it("goes to the pool outside a transaction, and to the transaction's connection inside one", async () => {
    await postgresChanges.add(change("u1"));
    expect(fake.log.map(([c]) => c)).toEqual(["pool"]);

    fake.log.length = 0;
    const id = await transaction(() => postgresChanges.add(change("u1")));
    expect(id).toBe("00000000-0000-4000-8000-000000000001");
    const conns = new Set(fake.log.map(([c]) => c));
    expect(conns.size).toBe(1);
    expect(conns.has("pool")).toBe(false);
    const statements = fake.log.map(([, t]) => t.split(" ")[0]);
    expect(statements[0]).toBe("BEGIN");
    expect(statements).toContain("INSERT");
    expect(statements.slice(-2)).toEqual(["COMMIT", "release"]);
  });

  it("keeps two transactions at once on their own connections, through the Promise edge and the service", async () => {
    await Promise.all([
      transaction(() => postgresChanges.add(change("u1"))),
      transaction(() => Effect.runPromise(ChangeLog.use((log) => log.hold(held("u2"))).pipe(Effect.provide(ChangeLogLive)))),
    ]);
    const add = fake.log.find(([, t]) => t.includes("(user_id, action_id, source, tier, input, before, after)"))!;
    const hold = fake.log.find(([, t]) => t.includes("'held'"))!;
    expect(add[0]).not.toBe("pool");
    expect(hold[0]).not.toBe("pool");
    expect(add[0]).not.toBe(hold[0]);
    for (const conn of [add[0], hold[0]]) expect(fake.log.filter(([c]) => c === conn).map(([, t]) => t.split(" ")[0]).slice(-2)).toEqual(["COMMIT", "release"]);
  });

  it("rolls the change back with the transaction when the work after it throws", async () => {
    await expect(transaction(async () => {
      await postgresChanges.add(change("u1"));
      throw new Error("the run failed");
    })).rejects.toThrow("the run failed");
    const statements = fake.log.map(([, t]) => t.split(" ")[0]);
    expect(statements).toContain("INSERT");
    expect(statements.slice(-2)).toEqual(["ROLLBACK", "release"]);
  });
});
