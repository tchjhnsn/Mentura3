import { beforeEach, describe, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";
import type { Contact, Message } from "@reflect/core/messages";
import type { ChangeLog, HeldChange, LoggedChange, NewChange } from "./types";

// Messages between members (Ask Reflect plan, step 10). The rows are an in-memory stand-in for ./messages-db, so the
// rules in ../messages-store.ts run as written: Ann and Ben share a household, Ann and Cy are friends by invite, and
// Ben and Cy are not connected. The change log is in memory too, so nothing here reaches a database.
const m = vi.hoisted(() => ({
  links: new Map<string, Contact[]>(),
  sent: [] as Message[],
  log: null as unknown as ChangeLog & { rows: LoggedChange[] },
}));
vi.mock("../messages-db", () => ({
  postgresMessages: {
    contacts: async (userId: string) => m.links.get(userId) ?? [],
    insert: async ({ from, to, text }: { from: string; to: string; text: string }) => {
      const msg = { id: randomUUID(), from, to, text, at: new Date(Date.now() + m.sent.length).toISOString() };
      m.sent.push(msg);
      return msg;
    },
    between: async (userId: string, other: string, limit: number) => m.sent.filter((x) => (x.from === userId && x.to === other) || (x.from === other && x.to === userId)).slice(-limit),
    latest: async (userId: string) => {
      const last = new Map<string, Message>();
      for (const x of m.sent) if (x.from === userId || x.to === userId) last.set(x.from === userId ? x.to : x.from, x);
      return [...last.values()];
    },
  },
  createFriendInvite: async () => "tok",
  friendInviteInfo: async () => null,
  acceptFriendInvite: async () => ({ name: "" }),
}));
vi.mock("../action-change-store", () => ({ get postgresChanges() { return m.log; } }));

function memoryLog(): ChangeLog & { rows: LoggedChange[] } {
  const rows: LoggedChange[] = [];
  const find = (userId: string, id: string) => rows.find((r) => r.id === id && r.userId === userId);
  return {
    rows,
    async add(c: NewChange) { const id = randomUUID(); rows.push({ ...c, id, status: "done", preview: null, createdAt: new Date(), undoneAt: null }); return id; },
    async get(userId, id) { return find(userId, id) ?? null; },
    async recent(userId, limit) { return rows.filter((r) => r.userId === userId).reverse().slice(0, limit); },
    async markUndone() { return false; },
    async hold(c: HeldChange) { const id = randomUUID(); rows.push({ ...c, id, before: null, after: null, status: "held", createdAt: new Date(), undoneAt: null }); return id; },
    async held(userId, since, limit) { return rows.filter((r) => r.userId === userId && r.status === "held" && r.createdAt >= since).reverse().slice(0, limit); },
    async claim(userId, id, since) { const r = find(userId, id); if (!r || r.status !== "held" || r.createdAt < since) return false; r.status = "done"; return true; },
    async settle(userId, id, c) { const r = find(userId, id); if (r) Object.assign(r, c); },
    async release(userId, id) { const r = find(userId, id); if (r) r.status = "held"; },
    async decline(userId, id) { const r = find(userId, id); if (!r || r.status !== "held") return false; r.status = "declined"; return true; },
  };
}

const { runAction, approveChange, declineChange } = await import("./run");
const { messagesAction, sendMessageAction } = await import("./messages");
const { conversation, sendMessage } = await import("../messages-store");
const { reflectServer } = await import("../mcp-tools");

const ANN = "u-ann", BEN = "u-ben", CY = "u-cy";
const contact = (id: string, name: string, via: Contact["via"]): Contact => ({ id, name, via });

beforeEach(() => {
  m.sent.length = 0;
  m.log = memoryLog();
  m.links = new Map([
    [ANN, [contact(BEN, "Ben Cole", "household"), contact(CY, "Cy Park", "friend")]],
    [BEN, [contact(ANN, "Ann Lee", "household")]],
    [CY, [contact(ANN, "Ann Lee", "friend")]],
  ]);
});

describe("send_message", () => {
  it("is an outside action on both surfaces that says it can never be undone", () => {
    expect(sendMessageAction.tier).toBe("outside");
    expect(sendMessageAction.on).toEqual(["chat", "mcp"]);
    expect(sendMessageAction.undo).toBeUndefined();
    expect(sendMessageAction.description).toMatch(/never be undone/);
    expect(messagesAction.tier).toBe("read");
  });

  it("sends nothing from the chat or MCP until the person taps Send on the exact text and recipient", async () => {
    for (const source of ["chat", "mcp"] as const) {
      const ran = await runAction(sendMessageAction, { userId: ANN }, { to: "Ben", text: "  Dinner at six? " }, source);
      expect(ran).toMatchObject({ held: true, preview: "To Ben Cole: Dinner at six?" });
    }
    expect(m.sent).toEqual([]);
    const [first, second] = m.log.rows;
    await declineChange({ userId: ANN }, second!.id);
    const approved = await approveChange({ userId: ANN }, first!.id);
    expect(approved.result).toMatchObject({ to: "Ben Cole", text: "Dinner at six?" });
    expect(m.sent).toMatchObject([{ from: ANN, to: BEN, text: "Dinner at six?" }]);
    await expect(approveChange({ userId: ANN }, first!.id)).rejects.toThrow(/already made/);
    await expect(approveChange({ userId: ANN }, second!.id)).rejects.toThrow(/declined/);
    expect(m.sent).toHaveLength(1);
  });

  it("holds over the MCP server too, telling the person's own AI it waits for Send", async () => {
    type Tools = Record<string, { handler: (args: unknown, extra: unknown) => Promise<{ content: { text: string }[] }> }>;
    const tools = (reflectServer(ANN) as unknown as { _registeredTools: Tools })._registeredTools;
    const out = await tools.send_message!.handler({ to: "Cy", text: "See you Sunday." }, {});
    const said = out.content.map((c) => c.text).join("\n");
    expect(said).toMatch(/^Not done yet\. This waits for the person to tap Send inside Reflect/);
    expect(said).toContain("To Cy Park: See you Sunday.");
    expect(m.sent).toEqual([]);
  });

  it("sends at once from the conversation page, and keeps it in the change log", async () => {
    const ran = await runAction(sendMessageAction, { userId: ANN }, { to: CY, text: "Hello" }, "page");
    expect(ran).toMatchObject({ held: false, result: { to: "Cy Park", text: "Hello" } });
    expect(m.sent).toMatchObject([{ from: ANN, to: CY, text: "Hello" }]);
    expect(m.log.rows).toMatchObject([{ actionId: "send_message", source: "page", status: "done", tier: "outside" }]);
  });

  it("refuses someone the person is not connected to, before anything is held or sent", async () => {
    await expect(runAction(sendMessageAction, { userId: BEN }, { to: "Cy", text: "Hi" }, "chat")).rejects.toThrow(/not someone you can message/);
    await expect(runAction(sendMessageAction, { userId: BEN }, { to: CY, text: "Hi" }, "page")).rejects.toThrow(/not someone you can message/);
    await expect(sendMessage(BEN, CY, "Hi")).rejects.toThrow(/not someone you can message/);
    expect(m.log.rows).toEqual([]);
    expect(m.sent).toEqual([]);
  });

  it("refuses a held message on Send if the two are no longer connected", async () => {
    const ran = await runAction(sendMessageAction, { userId: ANN }, { to: "Cy", text: "Hi" }, "chat");
    m.links.set(ANN, [contact(BEN, "Ben Cole", "household")]);
    await expect(approveChange({ userId: ANN }, ran.changeId!)).rejects.toThrow(/not someone you can message/);
    expect(m.sent).toEqual([]);
  });
});

describe("messages", () => {
  it("lets each member read only their own conversations", async () => {
    await sendMessage(ANN, BEN, "For Ben only.");
    await sendMessage(ANN, CY, "For Cy only.");
    await sendMessage(CY, ANN, "Thanks, Ann.");

    const cy = await conversation(CY, "Ann");
    expect(cy.messages.map((x) => [x.from, x.text])).toEqual([["Ann Lee", "For Cy only."], ["You", "Thanks, Ann."]]);
    // Cy is not connected to Ben, so has no conversation with him, and Ann and Ben's never reaches Cy.
    await expect(conversation(CY, BEN)).rejects.toThrow(/not someone you can message/);
    await expect(conversation(CY, "Ben")).rejects.toThrow(/not someone you can message/);
    const ben = await runAction(messagesAction, { userId: BEN }, { with: "Ann", limit: 30 }, "chat");
    expect(ben.held).toBe(false);
    expect(JSON.stringify(ben)).not.toContain("For Cy only.");
    expect(JSON.stringify(ben)).toContain("For Ben only.");
  });

  it("lists the people the person can message, the latest conversation first", async () => {
    await sendMessage(ANN, CY, "First");
    const ran = await runAction(messagesAction, { userId: ANN }, { limit: 30 }, "mcp");
    if (ran.held || ran.result.kind !== "threads") throw new Error("expected threads");
    expect(ran.result.threads.map((t) => [t.name, t.last?.text ?? null, t.href])).toEqual([
      ["Cy Park", "First", "/life/friends/messages/u-cy"],
      ["Ben Cole", null, "/life/friends/messages/u-ben"],
    ]);
  });
});
