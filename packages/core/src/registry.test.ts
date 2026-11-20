import { describe, expect, it } from "vitest";
import { int, object, str } from "./input.ts";
import { checkInput, holds, makeRunner, Refused, type Action, type ChangeLog, type LoggedChange, type RunContext } from "./registry.ts";

/** A change log in memory, as a host keeps one. */
function memoryLog(): ChangeLog & { rows: LoggedChange[] } {
  const rows: LoggedChange[] = [];
  let n = 0;
  const mine = (u: string, id: string) => rows.find((r) => r.id === id && r.userId === u) ?? null;
  return {
    rows,
    add: async (c) => (rows.push({ ...c, id: `c${++n}`, status: "done", preview: null, createdAt: new Date(), undoneAt: null }), `c${n}`),
    hold: async ({ preview, ...c }) => (rows.push({ ...c, before: null, after: null, id: `c${++n}`, status: "held", preview, createdAt: new Date(), undoneAt: null }), `c${n}`),
    get: async (u, id) => mine(u, id),
    recent: async (u, limit) => rows.filter((r) => r.userId === u).reverse().slice(0, limit),
    held: async (u, since, limit) => rows.filter((r) => r.userId === u && r.status === "held" && r.createdAt >= since).reverse().slice(0, limit),
    markUndone: async (u, id) => {
      const r = mine(u, id);
      if (!r || r.status !== "done") return false;
      Object.assign(r, { status: "undone", undoneAt: new Date() });
      return true;
    },
    claim: async (u, id, since) => {
      const r = mine(u, id);
      if (!r || r.status !== "held" || r.createdAt < since) return false;
      r.status = "done";
      return true;
    },
    settle: async (u, id, c) => void Object.assign(mine(u, id) ?? {}, c),
    release: async (u, id) => void Object.assign(mine(u, id) ?? {}, { status: "held" }),
    decline: async (u, id) => {
      const r = mine(u, id);
      if (!r || r.status !== "held") return false;
      r.status = "declined";
      return true;
    },
  };
}

type Ctx = RunContext & { log: ChangeLog; list: string[] };
const add: Action<Ctx, ReturnType<typeof addInput>, { added: string }> = {
  id: "add_item", title: "Add an item", description: "Adds one.", tier: "own", on: ["chat", "mcp"], input: addInput(),
  run: async ({ list }, { name }) => (list.push(name), { added: name }),
  change: (r) => ({ after: r }),
  undo: async ({ list }, c) => void list.splice(list.indexOf((c.after as { added: string }).added), 1),
};
function addInput() {
  return object({ name: str({ min: 1 }) });
}
const share: Action<Ctx, ReturnType<typeof addInput>, string> = { id: "share_item", title: "Share an item", description: "Shares one.", tier: "shared", on: ["chat"], input: addInput(), run: async ({ list }, { name }) => (list.push(`shared ${name}`), name) };
const read: Action<Ctx> = { id: "read_items", title: "Read", description: "Reads.", tier: "read", on: ["mcp"], run: async ({ list }) => list.slice() };
const never: Action<Ctx> = { id: "never", title: "Never", description: "Never.", tier: "never", on: [], run: async () => null };
const ALL = [add, share, read, never] as unknown as Action<Ctx>[];

describe("the core runner", () => {
  const setup = () => {
    const log = memoryLog();
    const transactions: number[] = [];
    const runner = makeRunner<Ctx, Action<Ctx>>({ changes: (c) => c.log, transaction: (f) => (transactions.push(1), f()), actionById: (id) => ALL.find((a) => a.id === id) });
    return { log, transactions, runner, ctx: { userId: "u1", log, list: [] as string[] } };
  };

  it("runs a read without logging it, and logs an own change inside the host's transaction", async () => {
    const { runner, ctx, log, transactions } = setup();
    expect(await runner.runAction(read, ctx, undefined, "mcp")).toEqual({ held: false, result: [], changeId: null });
    const ran = await runner.runAction(add, ctx, { name: "milk" }, "cli");
    expect(ran).toEqual({ held: false, result: { added: "milk" }, changeId: "c1" });
    expect(transactions).toHaveLength(1);
    expect(log.rows.map((r) => [r.actionId, r.source, r.status])).toEqual([["add_item", "cli", "done"]]);
    expect(await runner.undoChange(ctx, "c1")).toEqual({ undone: "c1", title: "Add an item" });
    expect(ctx.list).toEqual([]);
    await expect(runner.undoChange(ctx, "c1")).rejects.toMatchObject({ _tag: "Refused", reason: "already-made" });
  });

  it("holds a shared action a model asks for, until the person approves or declines it", async () => {
    const { runner, ctx } = setup();
    const held = await runner.runAction(share, ctx, { name: "milk" }, "chat");
    expect(held).toMatchObject({ held: true, changeId: "c1", preview: "Share an item.\nname: milk" });
    expect(ctx.list).toEqual([]);
    expect((await runner.pendingChanges(ctx)).map((p) => p.id)).toEqual(["c1"]);
    expect(await runner.approveChange(ctx, "c1")).toEqual({ approved: "c1", title: "Share an item", result: "milk" });
    await expect(runner.approveChange(ctx, "c1")).rejects.toMatchObject({ reason: "already-made" });
    await runner.runAction(share, ctx, { name: "eggs" }, "mcp");
    expect(await runner.declineChange(ctx, "c2")).toEqual({ declined: "c2", title: "Share an item" });
    expect(ctx.list).toEqual(["shared milk"]);
    // Asked for from a page or the command line, the person is acting themself: it runs.
    expect((await runner.runAction(share, ctx, { name: "tea" }, "page")).held).toBe(false);
  });

  it("refuses a never-tier action and another person's change", async () => {
    const { runner, ctx } = setup();
    await expect(runner.runAction(never, ctx, undefined, "page")).rejects.toBeInstanceOf(Refused);
    await runner.runAction(add, ctx, { name: "milk" }, "page");
    await expect(runner.undoChange({ ...ctx, userId: "u2" }, "c1")).rejects.toMatchObject({ reason: "no-such-change", message: "No such change." });
  });

  it("holds shared and outside runs for the chat, MCP and a plan not started from a page", () => {
    expect([holds("shared", "chat"), holds("outside", "mcp"), holds("shared", "workflow"), holds("shared", "workflow", "page"), holds("shared", "cli"), holds("own", "mcp")]).toEqual([true, true, true, false, false, false]);
  });

  it("holds a publishing action from any source until its presentation is complete and the person approves", async () => {
    const log = memoryLog();
    const ready = { value: false };
    const asked: unknown[] = [];
    const post: Action<Ctx, ReturnType<typeof addInput>, string> = { id: "post_page", title: "Post a page", description: "Posts one.", tier: "outside", on: ["chat"], publishes: "personal-site", input: addInput(), run: async ({ list }, { name }) => (list.push(`posted ${name}`), name) };
    const runner = makeRunner<Ctx, Action<Ctx>>({
      changes: (c) => c.log,
      transaction: (f) => f(),
      actionById: (id) => (id === post.id ? (post as unknown as Action<Ctx>) : undefined),
      gate: async (_ctx, channel, input) => (asked.push([channel, input]), ready.value ? { ready: true } : { ready: false, missing: [{ item: "end", message: "the end: what this appearance is for" }] }),
    });
    const ctx = { userId: "u1", log, list: [] as string[] };
    // Even the person at the command line is held: what goes before others waits for its record and their tap.
    const held = await runner.runAction(post, ctx, { name: "about" }, "cli");
    expect(held).toEqual({ held: true, changeId: "c1", preview: "Post a page.\nname: about\nOn personal-site. Not ready to go out. Still needed: the end: what this appearance is for.", gate: { ready: false, missing: [{ item: "end", message: "the end: what this appearance is for" }] } });
    expect(asked).toEqual([["personal-site", { name: "about" }]]);
    await expect(runner.approveChange(ctx, "c1")).rejects.toMatchObject({ reason: "not-presented", message: "Not ready to go out. Still needed: the end: what this appearance is for." });
    expect(log.rows[0]!.status).toBe("held");
    ready.value = true;
    // An agent never approves, ready or not.
    for (const by of ["chat", "mcp", "workflow"] as const) await expect(runner.approveChange(ctx, "c1", by)).rejects.toMatchObject({ reason: "person-only" });
    expect(await runner.approveChange(ctx, "c1", "cli")).toEqual({ approved: "c1", title: "Post a page", result: "about" });
    expect(ctx.list).toEqual(["posted about"]);
  });

  it("refuses a publishing action on a host with no presentation gate", async () => {
    const { runner, ctx } = setup();
    const post: Action<Ctx> = { id: "post", title: "Post", description: "Posts.", tier: "outside", on: [], publishes: "social", run: async () => null };
    await expect(runner.runAction(post, ctx, undefined, "page")).rejects.toMatchObject({ reason: "not-presented", message: "Post puts something before others on social, and this host has no presentation gate." });
  });

  it("checks an input against its schema and refuses one that does not fit", async () => {
    const s = object({ limit: int({ min: 1, max: 200, default: 20 }), name: str({ min: 1 }) });
    expect(await checkInput({ title: "T", input: s }, { name: "a", extra: 1 })).toEqual({ limit: 20, name: "a" });
    await expect(checkInput({ title: "T", input: s }, { limit: 0 })).rejects.toMatchObject({ reason: "bad-input", message: "T: limit: expected at least 1; name: required" });
    expect(s.json).toEqual({ type: "object", properties: { limit: { type: "integer", minimum: 1, maximum: 200, default: 20 }, name: { type: "string", minLength: 1 } }, required: ["name"] });
  });
});
