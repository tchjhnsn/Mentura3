import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import type { Action, ChangeLog, HeldChange, LoggedChange, NewChange } from "./types";
import type { Ran } from "./run";

// The change log and Undo (Ask Reflect plan, step 2), and held changes with Keep, Send and Decline (step 3). The pure tests use an in-memory log and stub the calendar store,
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

const kept: unknown[] = [];
vi.mock("../legacy-store", async (importOriginal) => {
  const real = await importOriginal<typeof import("../legacy-store")>();
  return { ...real, keepPlan: async (_u: string, plan: { trustees: { name: string }[] }) => (kept.push(plan), { trustees: plan.trustees.map((t) => ({ name: t.name, token: "tok" })), gifts: 1 }) };
});

const { runAction, undoChange, canUndo, approveChange, declineChange, pendingChanges, HOLD_DAYS } = await import("./run");
const { pendingChangesAction } = await import("./approvals");
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
      rows.push({ ...c, id, status: "done", preview: null, createdAt: new Date(), undoneAt: null });
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
    async hold(c: HeldChange) {
      const id = randomUUID();
      rows.push({ ...c, id, before: null, after: null, status: "held", createdAt: new Date(), undoneAt: null });
      return id;
    },
    async held(userId, since, limit) {
      return rows.filter((r) => r.userId === userId && r.status === "held" && r.createdAt >= since).reverse().slice(0, limit);
    },
    async claim(userId, id, since) {
      const r = rows.find((x) => x.id === id && x.userId === userId && x.status === "held" && x.createdAt >= since);
      if (!r) return false;
      r.status = "done";
      return true;
    },
    async settle(userId, id, c) {
      const r = rows.find((x) => x.id === id && x.userId === userId);
      if (r) Object.assign(r, c);
    },
    async release(userId, id) {
      const r = rows.find((x) => x.id === id && x.userId === userId && x.status === "done");
      if (r) r.status = "held";
    },
    async decline(userId, id) {
      const r = rows.find((x) => x.id === id && x.userId === userId && x.status === "held");
      if (!r) return false;
      r.status = "declined";
      return true;
    },
  };
}

/** A run that was not held, for the tests of own-tier runs. */
function ok<R>(r: Ran<R>): { result: R; changeId: string | null } {
  if (r.held) throw new Error("held");
  return r;
}

const readAction: Action<z.ZodObject<{ q: z.ZodString }>, string> = { id: "peek", title: "Peek", description: "d", tier: "read", on: ["chat"], input: z.object({ q: z.string() }), run: async (_c, { q }) => `saw ${q}` };

describe("running an action through the change log", () => {
  beforeEach(() => void removed.splice(0));

  it("logs a non-read run with its input and what it made, and returns the change id", async () => {
    const changes = memoryLog();
    const { result, changeId } = ok(await runAction(addEvent, { userId: "u1", changes }, { title: "Dinner", day: "2026-11-20" }, "chat"));
    expect(result[0]!.title).toBe("Dinner");
    expect(changeId).toBe(changes.rows[0]!.id);
    expect(changes.rows[0]).toMatchObject({ userId: "u1", actionId: "add_event", source: "chat", tier: "own", input: { title: "Dinner", day: "2026-11-20" }, status: "done" });
    expect(changes.rows[0]!.after).toMatchObject({ events: [result[0]!.id] });
  });

  it("does not log a read", async () => {
    const changes = memoryLog();
    const { result, changeId } = ok(await runAction(readAction, { userId: "u1", changes }, { q: "x" }, "mcp"));
    expect(result).toBe("saw x");
    expect(changeId).toBeNull();
    expect(changes.rows).toEqual([]);
  });

  it("still returns the result when the log cannot be written", async () => {
    const changes = { ...memoryLog(), add: async () => { throw new Error("no table"); } };
    const err = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { result, changeId } = ok(await runAction(addEvent, { userId: "u1", changes }, { title: "Dinner", day: "2026-11-20" }, "mcp"));
    expect(result).toHaveLength(1);
    expect(changeId).toBeNull();
    err.mockRestore();
  });

  it("undoes added events: removes each, marks the change undone, and refuses a second undo", async () => {
    const changes = memoryLog();
    const { result, changeId } = ok(await runAction(addEventsAction, { userId: "u1", changes }, { events: [{ title: "A", day: "2026-11-20" }, { title: "B", day: "2026-11-21" }] }, "chat"));
    await expect(undoChange({ userId: "u1", changes }, changeId!)).resolves.toMatchObject({ undone: changeId });
    expect(removed).toEqual(result.map((e) => e.id));
    expect(changes.rows[0]!.status).toBe("undone");
    await expect(undoChange({ userId: "u1", changes }, changeId!)).rejects.toThrow(/already undone/);
  });

  it("undoes only the same person's change, within 30 days, of an action that has undo", async () => {
    const changes = memoryLog();
    const { changeId } = ok(await runAction(addEvent, { userId: "u1", changes }, { title: "Dinner", day: "2026-11-20" }, "chat"));
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
    const { changeId } = ok(await runAction(addEvent, { userId: "u1", changes }, { title: "Dinner", day: "2026-11-20" }, "mcp"));
    const list = await recentChanges.run({ userId: "u1", changes }, { limit: 10 });
    expect(list).toMatchObject([{ id: changeId, action: "add_event", source: "mcp", status: "done", can_undo: true }]);
    const undone = ok(await runAction(undoChangeAction, { userId: "u1", changes }, { change_id: changeId! }, "chat"));
    expect(undone.result.undone).toBe(changeId);
    expect(changes.rows.map((r) => [r.actionId, r.status])).toEqual([["add_event", "undone"], ["undo_change", "done"]]);
  });

  it("gives undo only to own-tier actions", () => {
    for (const a of ACTIONS) if (a.undo) expect(a.tier).toBe("own");
    expect(ACTIONS.filter((a) => a.undo).map((a) => a.id)).toEqual([
      "plan_adventure", "add_event", "add_events", "set_book_status", "add_item", "remove_home_card", "check_home_item",
      // The page acts (Ask Reflect plan, step 4) whose change can be put back.
      "write_venture_file", "connect_with", "set_friend_kind", "set_profile", "set_section_audience", "add_social", "remove_social", "confirm_social", "import_linkedin", "add_record", "change_record", "set_record_state", "set_record_field", "remove_record", "restore_record", "change_event", "remove_event", "restore_event",
      "add_meal", "plan_meal", "unplan_meal", "plan_week", "start_meal_plan", "add_to_basket", "keep_recipe", "set_receipt", "save_work", "file_work",
      "toggle_quality", "take_off_quality", "main_aim", "adventure_to_calendar", "start_naive_venture", "ask_to_build", "answer_build_request", "going_to_event", "host_event", "set_event_part", "take_up_item", "remove_item", "restore_item", "keep_excerpt", "order_want",
      "set_reading_goal", "set_unit_done", "add_item_note", "set_reaction", "favorite_episode", "follow_list", "follow_topic", "follow_person", "save_playlist", "learned_piece",
    ]);
  });
});

describe("held changes: Keep, Send and Decline", () => {
  const DAY = 24 * 60 * 60 * 1000;
  const plan = { confirmations: 2, wait_days: 30, trustees: [{ name: "Ann", contact: "ann@example.test" }, { name: "Bo", contact: "bo@example.test" }], gifts: [{ to: "Cy", contact: "cy@example.test", items: [{ title: "Letter", text: "Dear Cy, thank you." }] }] };
  // A shared-tier action, as a household entry will be; the registry has none yet, so this file adds one.
  const shared: string[] = [];
  const sharedAction: Action<z.ZodObject<{ item: z.ZodString }>, { added: string }> = {
    id: "add_shared_test", title: "Add to the household list", description: "d", tier: "shared", on: ["chat", "mcp"], input: z.object({ item: z.string() }),
    run: async (_c, { item }) => (shared.push(item), { added: item }), change: (r) => ({ after: r }),
  };
  (ACTIONS as Action[]).push(sharedAction as unknown as Action);
  const keepLegacy = ACTIONS.find((a) => a.id === "keep_legacy_plan")!;
  beforeEach(() => void (kept.splice(0), shared.splice(0)));

  it("holds an outside action from MCP or the chat: nothing runs, the input and an exact preview are kept", async () => {
    const changes = memoryLog();
    for (const source of ["mcp", "chat"] as const) {
      const ran = await runAction(keepLegacy, { userId: "u1", changes }, plan, source);
      expect(ran.held).toBe(true);
      if (!ran.held) return;
      expect(ran.preview).toContain("Dear Cy, thank you.");
      expect(ran.preview).toContain("Ann (ann@example.test)");
      expect(ran.preview).toMatch(/2 of them must confirm/);
    }
    expect(kept).toEqual([]);
    expect(changes.rows.map((r) => [r.status, r.source, r.tier])).toEqual([["held", "mcp", "outside"], ["held", "chat", "outside"]]);
    expect(changes.rows[0]!.input).toEqual(plan);
  });

  it("runs a held change from a page at once: only the chat and MCP wait", async () => {
    const changes = memoryLog();
    const ran = await runAction(sharedAction, { userId: "u1", changes }, { item: "milk" }, "page");
    expect(ran.held).toBe(false);
    expect(shared).toEqual(["milk"]);
  });

  it("runs an approved change once, as the same person, and marks it done with what it made", async () => {
    const changes = memoryLog();
    const ran = await runAction(sharedAction, { userId: "u1", changes }, { item: "milk" }, "chat");
    expect(shared).toEqual([]);
    const r = await approveChange({ userId: "u1", changes }, ran.changeId!);
    expect(r).toMatchObject({ approved: ran.changeId, title: "Add to the household list", result: { added: "milk" } });
    expect(shared).toEqual(["milk"]);
    expect(changes.rows[0]).toMatchObject({ status: "done", after: { added: "milk" } });
  });

  it("refuses a second approval, also when two taps arrive together", async () => {
    const changes = memoryLog();
    const ran = await runAction(keepLegacy, { userId: "u1", changes }, plan, "mcp");
    const both = await Promise.allSettled([approveChange({ userId: "u1", changes }, ran.changeId!), approveChange({ userId: "u1", changes }, ran.changeId!)]);
    expect(both.map((b) => b.status).sort()).toEqual(["fulfilled", "rejected"]);
    await expect(approveChange({ userId: "u1", changes }, ran.changeId!)).rejects.toThrow(/already made/);
    expect(kept).toHaveLength(1);
  });

  it("refuses another person's approval or decline", async () => {
    const changes = memoryLog();
    const ran = await runAction(keepLegacy, { userId: "u1", changes }, plan, "mcp");
    await expect(approveChange({ userId: "u2", changes }, ran.changeId!)).rejects.toThrow(/No such change/);
    await expect(declineChange({ userId: "u2", changes }, ran.changeId!)).rejects.toThrow(/No such change/);
    expect(kept).toEqual([]);
    expect(changes.rows[0]!.status).toBe("held");
    expect(await pendingChanges({ userId: "u2", changes })).toEqual([]);
  });

  it("declines: the change never runs and cannot be approved after", async () => {
    const changes = memoryLog();
    const ran = await runAction(keepLegacy, { userId: "u1", changes }, plan, "mcp");
    await expect(declineChange({ userId: "u1", changes }, ran.changeId!)).resolves.toMatchObject({ declined: ran.changeId });
    expect(changes.rows[0]!.status).toBe("declined");
    await expect(approveChange({ userId: "u1", changes }, ran.changeId!)).rejects.toThrow(/declined/);
    await expect(declineChange({ userId: "u1", changes }, ran.changeId!)).rejects.toThrow(/declined/);
    expect(kept).toEqual([]);
  });

  it(`cannot approve a held change older than ${HOLD_DAYS} days, and no longer lists it`, async () => {
    const changes = memoryLog();
    const ran = await runAction(keepLegacy, { userId: "u1", changes }, plan, "mcp");
    const later = new Date(Date.now() + (HOLD_DAYS + 1) * DAY);
    expect(await pendingChanges({ userId: "u1", changes, now: later })).toEqual([]);
    await expect(approveChange({ userId: "u1", changes, now: later }, ran.changeId!)).rejects.toThrow(/7 days/);
    expect(kept).toEqual([]);
    expect(changes.rows[0]!.status).toBe("held");
  });

  it("puts a change back to held when its run fails, so the person can tap again", async () => {
    const changes = memoryLog();
    const ran = await runAction(sharedAction, { userId: "u1", changes }, { item: "milk" }, "chat");
    const run = sharedAction.run;
    sharedAction.run = async () => { throw new Error("store down"); };
    await expect(approveChange({ userId: "u1", changes }, ran.changeId!)).rejects.toThrow(/store down/);
    sharedAction.run = run;
    expect(changes.rows[0]!.status).toBe("held");
    await approveChange({ userId: "u1", changes }, ran.changeId!);
    expect(shared).toEqual(["milk"]);
  });

  it("lists what waits, newest first, with the preview, for the chat and MCP (pending_changes)", async () => {
    const changes = memoryLog();
    const a = await runAction(keepLegacy, { userId: "u1", changes }, plan, "mcp");
    const b = await runAction(sharedAction, { userId: "u1", changes }, { item: "milk" }, "chat");
    const list = await pendingChangesAction.run({ userId: "u1", changes }, { limit: 10 });
    expect(list.map((p) => [p.id, p.tier, p.source])).toEqual([[b.changeId, "shared", "chat"], [a.changeId, "outside", "mcp"]]);
    expect(list[0]!.preview).toBe("Add to the household list.\nitem: milk");
    expect(pendingChangesAction.tier).toBe("read");
    expect(pendingChangesAction.on).toEqual(["chat", "mcp"]);
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
    const { result, changeId } = ok(await runAction(addEvent, { userId: user, changes }, { title: "Dinner", day: "2026-11-20" }, "chat"));
    expect((await events(user, "2026-11-20", "2026-11-20")).map((e) => e.id)).toEqual([result[0]!.id]);
    await undoChange({ userId: user, changes }, changeId!);
    expect(await events(user, "2026-11-20", "2026-11-20")).toEqual([]);
  });
});
