import { beforeEach, describe, expect, it, vi } from "vitest";

// Connections made at events (2026-11-18): who a Connect can reach, and Undo, over a stand-in for the rows.
const H = 60 * 60 * 1000;
const running = { id: "e1", source: "reflect", hostUser: "host", status: "published", title: "Builders night", startsAt: new Date(Date.now() - H).toISOString(), endsAt: new Date(Date.now() + 2 * H).toISOString(), hostName: "Host", doorTokenHash: null };
const over = { ...running, id: "e2", startsAt: new Date(Date.now() - 10 * H).toISOString(), endsAt: new Date(Date.now() - 6 * H).toISOString() };
const state = {
  checkins: new Map<string, string[]>(),
  incoming: [] as { id: string; from: { id: string; name: string }; event: { id: string; title: string; startsAt: string | null } | null; at: string }[],
  connected: [] as [string, string, string | null][],
  withdrawn: [] as string[],
  met: new Map<string, { name: string; eventId: string | null }>(),
  profile: { line: null as string | null, interests: [] as string[], builds: false },
};
const people: Record<string, string> = { me: "Me", ann: "Ann Lee", bo: "Bo" };
vi.mock("../connect-store", () => ({
  recentCheckins: async (u: string) => [running, over].filter((e) => state.checkins.get(e.id)?.includes(u)),
  isCheckedIn: async (e: string, u: string) => Boolean(state.checkins.get(e)?.includes(u)),
  checkedIn: async (e: string) => (state.checkins.get(e) ?? []).map((id) => ({ id, name: people[id]!, line: null, interests: [], builds: false })),
  incomingRequests: async () => state.incoming,
  connect: async (from: string, to: string, ev: string | null) => (state.connected.push([from, to, ev]), { state: "requested", requestId: "q1" }),
  metWith: async (_u: string, o: string) => state.met.get(o) ?? null,
  withdrawRequest: async (_u: string, id: string) => (state.withdrawn.push(id), true),
  friendsMet: async () => [],
  setFriendKind: async () => null,
  profileOf: async () => state.profile,
  saveProfile: async (_u: string, p: typeof state.profile) => (state.profile = p),
}));

const { connectWithAction, setProfileAction } = await import("./connections");
const ctx = { userId: "me" };
const logged = (after: unknown, before: unknown = null) => ({ id: "c", userId: "me", actionId: "x", source: "chat" as const, tier: "own" as const, input: {}, before, after, status: "done" as const, preview: null, createdAt: new Date(), undoneAt: null });

describe("connect_with", () => {
  beforeEach(() => {
    state.checkins = new Map();
    state.incoming = [];
    state.connected = [];
    state.withdrawn = [];
    state.met = new Map();
  });

  it("reaches someone checked in to the same running event, by name, with that event", async () => {
    state.checkins.set("e1", ["me", "ann"]);
    const r = await connectWithAction.run(ctx, { to: "ann lee" });
    expect(r).toMatchObject({ to: "Ann Lee", state: "requested", href: "/events/e1/here" });
    expect(state.connected).toEqual([["me", "ann", "e1"]]);
  });

  it("does not reach someone when the person is not checked in, or the event is over", async () => {
    state.checkins.set("e1", ["ann"]);
    state.checkins.set("e2", ["me", "bo"]);
    await expect(connectWithAction.run(ctx, { to: "Ann Lee" })).rejects.toThrow("checked in to the same event");
    await expect(connectWithAction.run(ctx, { to: "Bo" })).rejects.toThrow("checked in to the same event");
    expect(state.connected).toEqual([]);
  });

  it("connects back to someone who asked, after the event, at the event they asked from", async () => {
    state.incoming = [{ id: "q0", from: { id: "bo", name: "Bo" }, event: { id: "e2", title: "Earlier", startsAt: null }, at: "" }];
    await connectWithAction.run(ctx, { to: "bo" });
    expect(state.connected).toEqual([["me", "bo", "e2"]]);
  });

  it("reaches someone met at an earlier event by id only (Connect on a profile), at that event", async () => {
    state.met.set("bo", { name: "Bo", eventId: "e2" });
    await expect(connectWithAction.run(ctx, { to: "Bo" })).rejects.toThrow("people you've met");
    const r = await connectWithAction.run(ctx, { to: "bo" });
    expect(r).toMatchObject({ to: "Bo", state: "requested", href: "/events/e2/here" });
    expect(state.connected).toEqual([["me", "bo", "e2"]]);
  });

  it("undo withdraws a request not yet answered, and refuses once connected", async () => {
    await connectWithAction.undo!(ctx, logged({ request: "q1", state: "requested" }));
    expect(state.withdrawn).toEqual(["q1"]);
    await expect(connectWithAction.undo!(ctx, logged({ request: "q2", state: "connected" }))).rejects.toThrow("connected now");
  });
});

describe("set_profile", () => {
  it("changes only the fields given, cleans interests, and undo puts back the old profile", async () => {
    state.profile = { line: "Old line", interests: ["jazz"], builds: false };
    const before = await setProfileAction.before!(ctx, { builds: true });
    const r = await setProfileAction.run(ctx, { interests: [" Urban  Planning ", "jazz", "JAZZ"], builds: true });
    expect(r).toMatchObject({ line: "Old line", interests: ["urban planning", "jazz"], builds: true });
    const c = setProfileAction.change!(r, {}, before);
    await setProfileAction.undo!(ctx, logged(c.after, c.before));
    expect(state.profile).toEqual({ line: "Old line", interests: ["jazz"], builds: false });
  });
});
