import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import type { Action, ChangeLog, LoggedChange, NewChange } from "./types";

// The change log and Undo (Ask Reflect plan, step 2). The pure tests use an in-memory log and stub the calendar store,
// so they reach no database; the Neon test at the end adds and undoes a real event, and skips without DATABASE_URL.
const removed: string[] = [];
const mocks = vi.hoisted(() => ({ live: false }));
vi.mock("../calendar-store", async (importOriginal) => {
  const real = await importOriginal<typeof import("../calendar-store")>();
  return { ...real, removeEvent: async (u: string, id: string, gone: boolean) => (mocks.live ? real.removeEvent(u, id, gone) : void removed.push(id)) };
});
vi.mock("../calendar-tools", async (importOriginal) => {
  const real = await importOriginal<typeof import("../calendar-tools")>();
  return {
    ...real,
    addEvents: async (u: string, list: { title: string; day: string }[]) =>
      mocks.live ? real.addEvents(u, list) : list.map((e) => ({ id: randomUUID(), title: e.title, day: e.day, when: "all day", tile: null, tile_label: "", repeat: "none", href: `/calendar?day=${e.day}` })),
  };
});

const { runAction, undoChange, canUndo } = await import("./run");
const { addEvent, addEventsAction } = await import("./calendar");
const { recentChanges, undoChangeAction } = await import("./changes");
const { ACTIONS } = await import("./index");

/** The change log in memory, as Postgres keeps it. */
function memoryLog(): ChangeLog & { rows: LoggedChange[] } {
  const rows: LoggedChange[] = [];
  return {
    rows,
    async add(c: NewChange) {
      const id = randomUUID();
      rows.push({ ...c, id, status: "done", createdAt: new Date(), undoneAt: null });
      return id;
    },
    async get(userId, id) {
      return rows.find((r) => r.id === id && r.userId === userId) ?? null;
    },
    async recent(userId, limit) {
      return rows.filter((r) => r.userId === userId).reverse().slice(0, limit);
    },
    async markUndone(userId, id) {
      const r = rows.find((x) => x.id === id && x.userId === userId && x.status === "done");
      if (!r) return false;
      r.status = "undone";
      r.undoneAt = new Date();
      return true;
    },
  };
}

const readAction: Action<z.ZodObject<{ q: z.ZodString }>, string> = { id: "peek", title: "Peek", description: "d", tier: "read", on: ["chat"], input: z.object({ q: z.string() }), run: async (_c, { q }) => `saw ${q}` };

describe("running an action through the change log", () => {
  beforeEach(() => void removed.splice(0));

  it("logs a non-read run with its input and what it made, and returns the change id", async () => {
    const changes = memoryLog();
    const { result, changeId } = await runAction(addEvent, { userId: "u1", changes }, { title: "Dinner", day: "2026-11-20" }, "chat");
    expect(result[0]!.title).toBe("Dinner");
    expect(changeId).toBe(changes.rows[0]!.id);
    expect(changes.rows[0]).toMatchObject({ userId: "u1", actionId: "add_event", source: "chat", tier: "own", input: { title: "Dinner", day: "2026-11-20" }, status: "done" });
    expect(changes.rows[0]!.after).toMatchObject({ events: [result[0]!.id] });
  });

  it("does not log a read", async () => {
    const changes = memoryLog();
    const { result, changeId } = await runAction(readAction, { userId: "u1", changes }, { q: "x" }, "mcp");
    expect(result).toBe("saw x");
    expect(changeId).toBeNull();
    expect(changes.rows).toEqual([]);
  });

  it("still returns the result when the log cannot be written", async () => {
    const changes = { ...memoryLog(), add: async () => { throw new Error("no table"); } };
    const err = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { result, changeId } = await runAction(addEvent, { userId: "u1", changes }, { title: "Dinner", day: "2026-11-20" }, "mcp");
    expect(result).toHaveLength(1);
    expect(changeId).toBeNull();
    err.mockRestore();
  });

  it("undoes added events: removes each, marks the change undone, and refuses a second undo", async () => {
    const changes = memoryLog();
    const { result, changeId } = await runAction(addEventsAction, { userId: "u1", changes }, { events: [{ title: "A", day: "2026-11-20" }, { title: "B", day: "2026-11-21" }] }, "chat");
    await expect(undoChange({ userId: "u1", changes }, changeId!)).resolves.toMatchObject({ undone: changeId });
    expect(removed).toEqual(result.map((e) => e.id));
    expect(changes.rows[0]!.status).toBe("undone");
    await expect(undoChange({ userId: "u1", changes }, changeId!)).rejects.toThrow(/already undone/);
  });

  it("undoes only the same person's change, within 30 days, of an action that has undo", async () => {
    const changes = memoryLog();
    const { changeId } = await runAction(addEvent, { userId: "u1", changes }, { title: "Dinner", day: "2026-11-20" }, "chat");
    await expect(undoChange({ userId: "u2", changes }, changeId!)).rejects.toThrow(/No such change/);
    const later = new Date(Date.now() + 31 * 24 * 60 * 60 * 1000);
    expect(canUndo(changes.rows[0]!, later)).toBe(false);
    await expect(undoChange({ userId: "u1", changes, now: later }, changeId!)).rejects.toThrow(/30 days/);
    const noUndo = { ...changes.rows[0]!, id: randomUUID(), actionId: "keep_idea" };
    changes.rows.push(noUndo);
    await expect(undoChange({ userId: "u1", changes }, noUndo.id)).rejects.toThrow(/cannot be undone/);
    expect(removed).toEqual([]);
  });

  it("lists recent changes with whether each can be undone, and undoes one as an action", async () => {
    const changes = memoryLog();
    const { changeId } = await runAction(addEvent, { userId: "u1", changes }, { title: "Dinner", day: "2026-11-20" }, "mcp");
    const list = await recentChanges.run({ userId: "u1", changes }, { limit: 10 });
    expect(list).toMatchObject([{ id: changeId, action: "add_event", source: "mcp", status: "done", can_undo: true }]);
    const undone = await runAction(undoChangeAction, { userId: "u1", changes }, { change_id: changeId! }, "chat");
    expect(undone.result.undone).toBe(changeId);
    expect(changes.rows.map((r) => [r.actionId, r.status])).toEqual([["add_event", "undone"], ["undo_change", "done"]]);
  });

  it("gives undo only to own-tier actions", () => {
    for (const a of ACTIONS) if (a.undo) expect(a.tier).toBe("own");
    expect(ACTIONS.filter((a) => a.undo).map((a) => a.id)).toEqual(["plan_adventure", "add_event", "add_events", "set_book_status", "add_item"]);
  });
});

const live = Boolean(process.env.DATABASE_URL && process.env.REFLECT_DATA_KEY);

describe.skipIf(!live)("undo on Neon", () => {
  afterAll(async () => {
    mocks.live = false;
    const { db } = await import("@/db/pool");
    await db().end();
  });

  it("undo of add_event removes the event from the calendar", async () => {
    mocks.live = true;
    const { db } = await import("@/db/pool");
    const { events } = await import("../calendar-store");
    const user = randomUUID();
    await db().query(`INSERT INTO "user" (id, name, email, "emailVerified", "createdAt", "updatedAt") VALUES ($1, $2, $3, false, now(), now())`, [user, "Undo Test", `${user}@example.test`]);
    const changes = memoryLog();
    const { result, changeId } = await runAction(addEvent, { userId: user, changes }, { title: "Dinner", day: "2026-11-20" }, "chat");
    expect((await events(user, "2026-11-20", "2026-11-20")).map((e) => e.id)).toEqual([result[0]!.id]);
    await undoChange({ userId: user, changes }, changeId!);
    expect(await events(user, "2026-11-20", "2026-11-20")).toEqual([]);
  });
});
