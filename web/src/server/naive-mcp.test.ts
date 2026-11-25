// The web side of Naive's mcp connector: who may ask, and what comes back (src/server/naive-mcp.ts).
import { describe, expect, it } from "vitest";
import { sourceIdOf } from "@/components/studio/integrations-sources";
import { answerMcp, signBody, verifyMcpRequest, type McpListRequest } from "./naive-mcp";

const key = "k".repeat(64);
const req = (over: Partial<McpListRequest> = {}): McpListRequest => ({ op: "list", user: "u1", venture: "biz", source: sourceIdOf("stripe", "Conn1"), api: "stripe", at: 1_000_000, ...over });
const conn = (over: Record<string, unknown> = {}) => ({ id: "Conn1", connector: "stripe", status: "connected", businesses: null, ...over });
const calls: string[] = [];
const deps = (connections = [conn()]) => ({
  connections: async () => connections as never,
  call: async (_u: string, id: string, tool: string) => { calls.push(`${id}:${tool}`); return { text: JSON.stringify({ data: [{ id: "cus_1", name: "Ada" }, { id: "nope" }] }), structured: null }; },
});

describe("verifyMcpRequest", () => {
  it("takes a fresh request signed with the bridge key", () => {
    const body = JSON.stringify(req());
    expect(verifyMcpRequest(body, signBody(body, key), key, 1_000_500).user).toBe("u1");
  });
  it("refuses another key, a changed body, an old request and a stray folder", () => {
    const body = JSON.stringify(req());
    expect(() => verifyMcpRequest(body, signBody(body, "other"), key, 1_000_500)).toThrow(/not signed/);
    expect(() => verifyMcpRequest(body.replace("u1", "u2"), signBody(body, key), key, 1_000_500)).toThrow(/not signed/);
    expect(() => verifyMcpRequest(body, null, key, 1_000_500)).toThrow(/not signed/);
    expect(() => verifyMcpRequest(body, signBody(body, key), key, 1_000_000 + 61_000)).toThrow(/too old/);
    const bad = JSON.stringify(req({ folder: "../x" }));
    expect(() => verifyMcpRequest(bad, signBody(bad, key), key, 1_000_500)).toThrow(/folder/);
  });
});

describe("answerMcp", () => {
  it("returns the adapter's records as files and drops what is not a customer", async () => {
    const items = await answerMcp(req(), deps());
    expect(items.map((i) => i.path)).toEqual(["customers/cus_1.json"]);
    expect(JSON.parse(items[0]!.content)).toMatchObject({ id: "cus_1", name: "Ada" });
    expect(calls.at(-1)).toBe("Conn1:list_customers");
  });
  it("refuses a source that is not this person's live connection open to the business (M4 unreachable)", async () => {
    await expect(answerMcp(req({ source: sourceIdOf("stripe", "Other") }), deps())).rejects.toThrow(/not available/);
    await expect(answerMcp(req(), deps([conn({ status: "expired" })]))).rejects.toThrow(/not available/);
    await expect(answerMcp(req(), deps([conn({ businesses: ["elsewhere"] })]))).rejects.toThrow(/not available/);
    await expect(answerMcp(req({ api: "gmail" }), deps())).rejects.toThrow(/not available/);
  });
});
