import { beforeEach, describe, expect, it, vi } from "vitest";
import type { BuildCandidate, BuildStatus } from "@reflect/core/build";

// People to build with (Events and connections, 2026-11-18): the actions over in-memory stand-ins for the life records
// and the build store.
const ID = "11111111-1111-4111-8111-111111111111";
const REQ = "22222222-2222-4222-8222-222222222222";
const record = { id: ID, app: "ventures", kind: "venture", state: "starting", body: { name: "Rosa's Prints", what: "Prints" }, createdAt: "", updatedAt: "" };
const night = { event: "Founders Night", startsAt: "2026-11-21T00:30:00Z" };
const list: BuildCandidate[] = [
  { id: "ann", name: "Ann", image: null, interests: ["design"], via: "event", met: night },
  { id: "bo", name: "Bo", image: null, interests: ["design", "print"], via: "connection", met: null },
  { id: "cy", name: "Cy", image: null, interests: [], via: "connection", met: null },
];
const asked = new Map<string, BuildStatus>();
const answers = new Map<string, "yes" | "no" | null>();
let candidates = list;

vi.mock("../life-store", () => ({ lifeRecord: async (_u: string, id: string) => (id === ID ? record : null) }));
vi.mock("../build-store", () => ({
  buildCandidates: async () => ({ interests: ["design", "print"], list: candidates }),
  buildStatuses: async () => new Map(asked),
  askToBuild: async (_u: string, _v: string, to: string) => (asked.set(to, "requested"), { id: REQ }),
  withdrawBuildRequest: async (_u: string, id: string) => (id === REQ && asked.has("bo") && !answers.get(REQ) ? (asked.delete("bo"), true) : false),
  answerBuildRequest: async (_u: string, id: string, yes: boolean) => {
    if (answers.get(id)) throw new Error("That request was answered already, or is not for you.");
    answers.set(id, yes ? "yes" : "no");
    return { id, from: "rosa", linked: yes };
  },
  reopenBuildRequest: async (_u: string, id: string) => (answers.get(id) === "no" ? (answers.set(id, null), true) : false),
}));

const { answerBuildRequestAction, askToBuildAction, peopleToBuildWithAction } = await import("./build");
const ctx = { userId: "me" };
const logged = (actionId: string, after: unknown) => ({ id: "c", userId: "me", actionId, source: "page" as const, tier: "own" as const, input: {}, before: null, after, status: "done" as const, preview: null, createdAt: new Date(), undoneAt: null });

describe("people to build with", () => {
  beforeEach(() => void (asked.clear(), answers.clear(), (candidates = list)));

  it("ranks the people who build by shared interests, connections first, with why and where they met", async () => {
    const res = await peopleToBuildWithAction.run(ctx, { venture: ID });
    expect(res.people).toEqual([
      { id: "bo", name: "Bo", shared_interests: ["design", "print"], why: "Shares 2 of your interests", met: null, status: "none" },
      { id: "ann", name: "Ann", shared_interests: ["design"], why: "Shares one of your interests", met: "Met at Founders Night, Fri, Nov 20", status: "none" },
      { id: "cy", name: "Cy", shared_interests: [], why: "One of your connections", met: null, status: "none" },
    ]);
    await expect(peopleToBuildWithAction.run(ctx, { venture: "33333333-3333-4333-8333-333333333333" })).rejects.toThrow("No such venture");
  });

  it("points to events when no one builds yet", async () => {
    candidates = [];
    expect(await peopleToBuildWithAction.run(ctx, { venture: ID })).toMatchObject({ people: [], note: expect.stringContaining("/events") });
  });

  it("asks only someone shown, once, and undo takes back an unanswered request", async () => {
    await expect(askToBuildAction.run(ctx, { venture: ID, person: "stranger" })).rejects.toThrow("only someone shown");
    const res = await askToBuildAction.run(ctx, { venture: ID, person: "bo" });
    expect(res).toMatchObject({ request: REQ, to: "Bo", status: "requested" });
    expect((await peopleToBuildWithAction.run(ctx, { venture: ID })).people[0]!.status).toBe("requested");
    await expect(askToBuildAction.run(ctx, { venture: ID, person: "bo" })).rejects.toThrow("already asked Bo");

    const c = askToBuildAction.change!(res, { venture: ID, person: "bo" }, undefined);
    await askToBuildAction.undo!(ctx, logged("ask_to_build", c.after));
    expect(asked.has("bo")).toBe(false);
    await expect(askToBuildAction.undo!(ctx, logged("ask_to_build", c.after))).rejects.toThrow("cannot be taken back");
  });

  it("answers yes with a way to message, and a yes cannot be undone", async () => {
    const res = await answerBuildRequestAction.run(ctx, { request: REQ, answer: "yes" });
    expect(res).toEqual({ request: REQ, answer: "yes", message_href: "/life/friends/messages/rosa" });
    await expect(answerBuildRequestAction.run(ctx, { request: REQ, answer: "no" })).rejects.toThrow("answered already");
    const c = answerBuildRequestAction.change!(res, { request: REQ, answer: "yes" }, undefined);
    await expect(answerBuildRequestAction.undo!(ctx, logged("answer_build_request", c.after))).rejects.toThrow("A yes cannot be undone");
    expect(answerBuildRequestAction.description).toContain("cannot be undone");
  });

  it("answers Not now, and undo puts the request back", async () => {
    const res = await answerBuildRequestAction.run(ctx, { request: REQ, answer: "no" });
    expect(res).toEqual({ request: REQ, answer: "no" });
    const c = answerBuildRequestAction.change!(res, { request: REQ, answer: "no" }, undefined);
    await answerBuildRequestAction.undo!(ctx, logged("answer_build_request", c.after));
    expect(answers.get(REQ)).toBeNull();
  });
});
