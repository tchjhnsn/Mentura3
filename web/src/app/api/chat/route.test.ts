import { beforeEach, describe, expect, it, vi } from "vitest";
import type { UIMessage } from "ai";
import { CRISIS_REPLY } from "@reflect/core/crisis";

const kept: string[] = [];
vi.mock("@/server/session", () => ({ currentUser: async () => ({ id: "u1" }) }));
vi.mock("@/server/journal-store", () => ({ keepChatMessage: async (_u: string, _c: string, _d: string, part: string) => void kept.push(part) }));
// No model at all: the crisis reply must not need one.
vi.mock("@/server/chat-model", () => ({ chatModel: () => null }));
vi.mock("@/server/learn-store", () => ({ learnView: async () => { throw new Error("the crisis reply reads no records"); } }));
vi.mock("@/server/claims-store", () => ({ listClaims: async () => [] }));
vi.mock("@/server/ways-store", () => ({ listItems: async () => [] }));
vi.mock("./tools", () => ({ chatTools: () => ({}) }));

const { POST } = await import("./route");
const { inCrisis } = await import("./crisis");

const say = (text: string): UIMessage => ({ id: crypto.randomUUID(), role: "user", parts: [{ type: "text", text }] });
const today = () => new Date().toISOString().slice(0, 10);
const post = (text: string) =>
  POST(new Request("http://x/api/chat", { method: "POST", body: JSON.stringify({ id: crypto.randomUUID(), localDate: today(), messages: [say(text)] }) }));

describe("chat crisis protocol", () => {
  beforeEach(() => void (kept.length = 0));

  it("answers a crisis signal with the 988 Lifeline and its card, without a model, and keeps it in the chat", async () => {
    const res = await post("I don't want to be alive anymore");
    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body).toContain(JSON.stringify(CRISIS_REPLY).slice(1, -1));
    expect(body).toContain('"Lifeline"');
    expect(kept).toEqual(["You: I don't want to be alive anymore", `Reflect: ${CRISIS_REPLY}`]);
  });

  it("sends anything else on to the model, which here is missing", async () => {
    const res = await post("What's on my shelves?");
    expect(res.status).toBe(503);
  });

  it("looks only at the person's latest message", () => {
    const answer: UIMessage = { id: "a", role: "assistant", parts: [{ type: "text", text: "Durkheim's Suicide is on your shelves." }] };
    expect(inCrisis([say("I want to die"), answer])).toBe(false);
    expect(inCrisis([answer, say("i want to kill myself")])).toBe(true);
  });
});
