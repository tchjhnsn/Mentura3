import { describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import type { Action, ChangeLog, LoggedChange, NewChange } from "./actions/types";
import { actionsOn } from "./actions";
import { callMcpAction, heldOverMcp, mcpAllows } from "./mcp-call";

// The one way MCP runs an action (Ask Reflect plan, step 11): read and own run, shared and outside are held for the
// person's tap in Reflect and do not run. Fake actions and an in-memory change log, so no database is reached.
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
      return rows.filter((r) => r.userId === userId).slice(0, limit);
    },
    async markUndone() {
      return false;
    },
  };
}

const fake = (tier: Action["tier"], ran: string[]): Action<z.ZodType, string> => ({
  id: `fake_${tier}`,
  title: `Fake ${tier}`,
  description: "",
  tier,
  on: ["mcp"],
  input: z.object({ x: z.string() }),
  run: async (_ctx, input) => {
    ran.push(tier);
    return `ran ${(input as { x: string }).x}`;
  },
});

describe("callMcpAction", () => {
  it("runs read and own actions, logging only the own one", async () => {
    const ran: string[] = [];
    const changes = memoryLog();
    const read = await callMcpAction(fake("read", ran), { userId: "u1", changes }, { x: "a" });
    const own = await callMcpAction(fake("own", ran), { userId: "u1", changes }, { x: "b" });
    expect(read).toEqual({ kind: "done", result: "ran a", changeId: null });
    expect(own.kind).toBe("done");
    expect(own.kind === "done" && own.changeId).toBe(changes.rows[0]!.id);
    expect(changes.rows.map((r) => [r.actionId, r.source, r.tier])).toEqual([["fake_own", "mcp", "own"]]);
    expect(ran).toEqual(["read", "own"]);
  });

  it("holds shared and outside actions for the person's tap and runs nothing", async () => {
    const ran: string[] = [];
    const changes = memoryLog();
    for (const tier of ["shared", "outside"] as const) {
      const call = await callMcpAction(fake(tier, ran), { userId: "u1", changes }, { x: "c" });
      expect(call.kind).toBe("held");
      expect(call.kind === "held" && call.message).toMatch(tier === "outside" ? /tap Send in Reflect/ : /tap Keep in Reflect/);
      expect(call.kind === "held" && call.message).toMatch(/Nothing has been done yet/);
    }
    expect(ran).toEqual([]);
    expect(changes.rows).toEqual([]);
  });

  it("refuses a never-tier action", async () => {
    await expect(callMcpAction(fake("never", []), { userId: "u1", changes: memoryLog() }, { x: "d" })).rejects.toThrow(/not offered/);
  });
});

describe("what the consent page shows", () => {
  it("sorts MCP's actions by tier, and every shared or outside one is held", () => {
    const list = actionsOn("mcp");
    const allows = mcpAllows(list);
    expect(allows.read.length + allows.own.length + allows.held.length).toBe(list.length);
    expect(allows.held).toEqual(list.filter(heldOverMcp).map((a) => a.title));
    expect(allows.held).toContain("Keep the person's legacy release plan");
    expect(allows.read).toContain("The legacy release plan and any release");
  });
});
