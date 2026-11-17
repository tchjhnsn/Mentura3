import { beforeEach, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import type { Action, ChangeLog, HeldChange, LoggedChange, NewChange, Workflow, WorkflowStore } from "./types";

// Plans (Ask Reflect plan, step 9). An in-memory change log and plan store stand in for Postgres; the plan store keeps
// only JSON strings, as the table keeps sealed JSON, so a plan read back is a new object and never the runner's memory.
const { runAction, approveChange, declineChange, holds } = await import("./run");
const { startPlan, plansAction } = await import("./workflows");
const { ACTIONS } = await import("./index");

function memoryLog(): ChangeLog & { rows: LoggedChange[] } {
  const rows: LoggedChange[] = [];
  const find = (userId: string, id: string, status?: LoggedChange["status"]) => rows.find((r) => r.id === id && r.userId === userId && (!status || r.status === status));
  return {
    rows,
    async add(c: NewChange) {
      const id = randomUUID();
      rows.push({ ...c, id, status: "done", preview: null, createdAt: new Date(), undoneAt: null });
      return id;
    },
    get: async (userId, id) => find(userId, id) ?? null,
    recent: async (userId, limit) => rows.filter((r) => r.userId === userId).reverse().slice(0, limit),
    async markUndone(userId, id) {
      const r = find(userId, id, "done");
      return r ? ((r.status = "undone"), true) : false;
    },
    async hold(c: HeldChange) {
      const id = randomUUID();
      rows.push({ ...c, id, before: null, after: null, status: "held", createdAt: new Date(), undoneAt: null });
      return id;
    },
    held: async (userId, since, limit) => rows.filter((r) => r.userId === userId && r.status === "held" && r.createdAt >= since).reverse().slice(0, limit),
    async claim(userId, id, since) {
      const r = find(userId, id, "held");
      return r && r.createdAt >= since ? ((r.status = "done"), true) : false;
    },
    async settle(userId, id, c) {
      const r = find(userId, id);
      if (r) Object.assign(r, c);
    },
    async release(userId, id) {
      const r = find(userId, id, "done");
      if (r) r.status = "held";
    },
    async decline(userId, id) {
      const r = find(userId, id, "held");
      return r ? ((r.status = "declined"), true) : false;
    },
  };
}

/** Plans kept as JSON strings, shared by every store made over the same rows (a reload reads them again). */
function memoryPlans(rows = new Map<string, string>()): WorkflowStore & { rows: Map<string, string> } {
  const read = (s: string): Workflow => {
    const w = JSON.parse(s) as Workflow & { createdAt: string; updatedAt: string };
    return { ...w, createdAt: new Date(w.createdAt), updatedAt: new Date(w.updatedAt) };
  };
  const mine = (userId: string) => [...rows.values()].map(read).filter((w) => w.userId === userId);
  return {
    rows,
    async create(w) {
      const id = randomUUID();
      rows.set(id, JSON.stringify({ ...w, id, status: "running", current: 0, waitingChange: null, note: null, createdAt: new Date(), updatedAt: new Date() }));
      return id;
    },
    get: async (userId, id) => mine(userId).find((w) => w.id === id) ?? null,
    async save(w) {
      if (rows.has(w.id)) rows.set(w.id, JSON.stringify({ ...w, updatedAt: new Date() }));
    },
    waitingOn: async (userId, changeId) => mine(userId).find((w) => w.status === "waiting" && w.waitingChange === changeId) ?? null,
    async claim(userId, id, changeId, to) {
      const w = mine(userId).find((x) => x.id === id && x.status === "waiting" && x.waitingChange === changeId);
      if (!w) return false;
      rows.set(id, JSON.stringify({ ...w, status: to, waitingChange: null }));
      return true;
    },
    list: async (userId, statuses, limit) => mine(userId).filter((w) => statuses.includes(w.status)).reverse().slice(0, limit),
  };
}

// Three test actions: two on the person's own record and one shared, which a plan from the chat must hold.
const ran: string[] = [];
const make = (id: string, tier: Action["tier"], on: Action["on"] = ["chat", "mcp"]) =>
  ({ id, title: `Do ${id}`, description: "d", tier, on, input: z.object({ n: z.number() }), run: async (_c: unknown, { n }: { n: number }) => (ran.push(`${id}:${n}`), { n }), change: (r: unknown) => ({ after: r }) }) as unknown as Action;
const budgetStep = make("plan_test_budget", "own");
const sharedStep = make("plan_test_shared", "shared");
const homeStep = make("plan_test_home", "own");
const neverStep = make("plan_test_never", "never");
const chatOnly = make("plan_test_chat_only", "own", ["chat"]);
(ACTIONS as Action[]).push(budgetStep, sharedStep, homeStep, neverStep, chatOnly);

const three = { title: "Month's budget, reminders, total on Home", steps: [{ action: "plan_test_budget", input: { n: 1 } }, { action: "plan_test_shared", input: { n: 2 } }, { action: "plan_test_home", input: { n: 3 } }] };

async function start(ctx: Parameters<typeof runAction>[1], input: unknown = three, source: "chat" | "mcp" = "chat") {
  const r = await runAction(startPlan, ctx, input as z.output<NonNullable<typeof startPlan.input>>, source);
  if (r.held) throw new Error("start_plan was held");
  return r.result;
}

describe("plans of several actions", () => {
  beforeEach(() => void ran.splice(0));

  it("stops at a held middle step, resumes after Keep and finishes", async () => {
    const ctx = { userId: "u1", changes: memoryLog(), workflows: memoryPlans() };
    const plan = await start(ctx);
    expect(ran).toEqual(["plan_test_budget:1"]);
    expect(plan.status).toBe("waiting");
    expect(plan.steps.map((s) => s.status)).toEqual(["done", "waiting", "not_started"]);
    expect(plan.waiting).toMatchObject({ title: "Do plan_test_shared", tier: "shared" });
    const held = ctx.changes.rows.find((r) => r.status === "held")!;
    expect(held).toMatchObject({ actionId: "plan_test_shared", source: "workflow", input: { n: 2 } });
    expect(plan.waiting!.change).toBe(held.id);

    // The tap comes from the page: no origin on its context, but the plan carries its own.
    const approved = await approveChange({ userId: "u1", changes: ctx.changes, workflows: ctx.workflows }, held.id);
    expect(ran).toEqual(["plan_test_budget:1", "plan_test_shared:2", "plan_test_home:3"]);
    expect(approved.plan).toMatchObject({ id: plan.id, status: "done", waiting: null });
    expect(approved.plan!.steps.map((s) => s.status)).toEqual(["done", "done", "done"]);
    expect(approved.plan!.steps.every((s) => s.change)).toBe(true);
    expect(ctx.changes.rows.map((r) => [r.actionId, r.source, r.status])).toEqual([
      ["plan_test_budget", "workflow", "done"], ["plan_test_shared", "workflow", "done"], ["start_plan", "chat", "done"], ["plan_test_home", "workflow", "done"],
    ]);
    expect(await plansAction.run(ctx, { limit: 10 })).toEqual([]);
  });

  it("stops when the person declines the held step: nothing after it runs", async () => {
    const ctx = { userId: "u1", changes: memoryLog(), workflows: memoryPlans() };
    const plan = await start(ctx);
    await declineChange(ctx, plan.waiting!.change);
    expect(ran).toEqual(["plan_test_budget:1"]);
    const w = (await ctx.workflows.get("u1", plan.id))!;
    expect(w.status).toBe("failed");
    expect(w.steps.map((s) => s.status)).toEqual(["done", "declined", "not_started"]);
    expect(w.note).toMatch(/you declined step 2, Do plan_test_shared/);
    await expect(approveChange(ctx, plan.waiting!.change)).rejects.toThrow(/declined/);
    expect(ran).toEqual(["plan_test_budget:1"]);
  });

  it("resumes from the store after a reload, not from memory", async () => {
    const changes = memoryLog();
    const rows = new Map<string, string>();
    const plan = await start({ userId: "u1", changes, workflows: memoryPlans(rows) });
    // A new request: new contexts and stores, the same rows.
    const reloaded = { userId: "u1", changes, workflows: memoryPlans(rows) };
    const listed = await plansAction.run(reloaded, { limit: 10 });
    expect(listed).toHaveLength(1);
    expect(listed[0]).toMatchObject({ id: plan.id, status: "waiting", waiting: { change: plan.waiting!.change } });
    expect(listed[0]!.steps.map((s) => s.status)).toEqual(["done", "waiting", "not_started"]);
    const approved = await approveChange(reloaded, listed[0]!.waiting!.change);
    expect(approved.plan!.status).toBe("done");
    expect(ran).toEqual(["plan_test_budget:1", "plan_test_shared:2", "plan_test_home:3"]);
    expect(JSON.parse(rows.get(plan.id)!)).toMatchObject({ status: "done", current: 3 });
  });

  it("refuses an unknown, never-tier, unoffered or badly formed step before any step runs", async () => {
    const changes = memoryLog();
    const workflows = memoryPlans();
    const ctx = { userId: "u1", changes, workflows };
    const bad = (step: { action: string; input: unknown }) => ({ title: "x", steps: [{ action: "plan_test_budget", input: { n: 1 } }, step] });
    await expect(start(ctx, bad({ action: "no_such_action", input: {} }))).rejects.toThrow(/Nothing was run. Step 2: there is no action no_such_action/);
    await expect(start(ctx, bad({ action: "plan_test_never", input: { n: 1 } }))).rejects.toThrow(/Step 2: Do plan_test_never is never run/);
    await expect(start(ctx, bad({ action: "plan_test_home", input: { n: "three" } }))).rejects.toThrow(/Step 2 \(plan_test_home\): n:/);
    await expect(start(ctx, bad({ action: "start_plan", input: {} }))).rejects.toThrow(/cannot start or list plans/);
    await expect(start(ctx, bad({ action: "plan_test_chat_only", input: { n: 1 } }), "mcp")).rejects.toThrow(/plan_test_chat_only is not offered here/);
    expect(ran).toEqual([]);
    expect(changes.rows).toEqual([]);
    expect(workflows.rows.size).toBe(0);
  });

  it("stops at a step that fails, with a note, and runs nothing after it", async () => {
    const ctx = { userId: "u1", changes: memoryLog(), workflows: memoryPlans() };
    const run = homeStep.run;
    homeStep.run = async () => { throw new Error("store down"); };
    const plan = await start(ctx, { title: "x", steps: [{ action: "plan_test_home", input: { n: 1 } }, { action: "plan_test_budget", input: { n: 2 } }] });
    homeStep.run = run;
    expect(plan.status).toBe("failed");
    expect(plan.steps.map((s) => s.status)).toEqual(["failed", "not_started"]);
    expect(plan.note).toMatch(/Stopped at step 1, Do plan_test_home: store down/);
    expect(ran).toEqual([]);
  });

  it("holds a plan's shared and outside steps unless the plan was started from a page", () => {
    expect(holds("shared", "workflow", "chat")).toBe(true);
    expect(holds("outside", "workflow", "mcp")).toBe(true);
    expect(holds("shared", "workflow")).toBe(true);
    expect(holds("shared", "workflow", "page")).toBe(false);
    expect(holds("own", "workflow", "chat")).toBe(false);
    expect(holds("shared", "page")).toBe(false);
  });

  it("runs only once when two taps resume the same plan", async () => {
    const ctx = { userId: "u1", changes: memoryLog(), workflows: memoryPlans() };
    const plan = await start(ctx);
    const both = await Promise.allSettled([approveChange(ctx, plan.waiting!.change), approveChange(ctx, plan.waiting!.change)]);
    expect(both.map((b) => b.status).sort()).toEqual(["fulfilled", "rejected"]);
    expect(ran).toEqual(["plan_test_budget:1", "plan_test_shared:2", "plan_test_home:3"]);
  });

  it("offers start_plan (own) and plans (read) on both surfaces", () => {
    expect([startPlan.tier, plansAction.tier]).toEqual(["own", "read"]);
    expect(startPlan.on).toEqual(["chat", "mcp"]);
    expect(plansAction.on).toEqual(["chat", "mcp"]);
  });
});
