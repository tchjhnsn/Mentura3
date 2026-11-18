import { beforeEach, describe, expect, it, vi } from "vitest";

// Settings, Account (2026-11-18): the handle, the name and the default audience, and Undo, over a stand-in for the rows.
const state = { handle: null as string | null, taken: new Set<string>(), name: "Ann", audience: "met" as string };
vi.mock("../profile-store", () => ({
  profileSettings: async () => ({ handle: state.handle, audience: state.audience, sections: {}, line: null, interests: [], builds: false }),
  setHandle: async (_u: string, h: string | null) => {
    const was = state.handle;
    if (h && state.taken.has(h)) throw new Error("That handle is taken.");
    state.handle = h;
    return was;
  },
  handleSuggestions: async (h: string) => [`${h}-26`, `${h}-atx`],
  setDefaultAudience: async (_u: string, a: string) => {
    const was = state.audience;
    state.audience = a;
    return was;
  },
}));
vi.mock("../account-store", () => ({
  NAME_MAX: 80,
  setName: async (_u: string, n: string) => {
    const was = state.name;
    state.name = n.trim();
    return was;
  },
}));

const { setDefaultAudienceAction, setHandleAction, setNameAction } = await import("./account");
const { signInLabel } = await vi.importActual<typeof import("../account-store")>("../account-store");
const ctx = { userId: "me" };
const logged = (before: unknown, after: unknown = null) => ({ id: "c", userId: "me", actionId: "x", source: "chat" as const, tier: "own" as const, input: {}, before, after, status: "done" as const, preview: null, createdAt: new Date(), undoneAt: null });

describe("set_handle", () => {
  beforeEach(() => {
    state.handle = null;
    state.taken = new Set(["ann"]);
  });

  it("sets the handle, and undo puts the old one back", async () => {
    const before = await setHandleAction.before!(ctx, { handle: "@Ann-Lee" });
    const r = await setHandleAction.run(ctx, { handle: "@Ann-Lee" });
    expect(r).toMatchObject({ handle: "ann-lee", was: null, href: "/p/ann-lee" });
    await setHandleAction.undo!(ctx, logged(before));
    expect(state.handle).toBeNull();
  });

  it("refuses a taken handle, naming two free ones", async () => {
    await expect(setHandleAction.run(ctx, { handle: "ann" })).rejects.toThrow("That handle is taken. Free: @ann-26, @ann-atx.");
  });
});

describe("set_name and set_default_audience", () => {
  it("undo puts the name back", async () => {
    const r = await setNameAction.run(ctx, { name: "Ann  Lee" });
    expect(r.name).toBe("Ann Lee");
    await setNameAction.undo!(ctx, logged(setNameAction.change!(r, { name: "Ann  Lee" }, null).before));
    expect(state.name).toBe("Ann");
  });

  it("undo puts the audience back", async () => {
    const r = await setDefaultAudienceAction.run(ctx, { audience: "everyone" });
    expect(r.audience).toBe("Everyone");
    await setDefaultAudienceAction.undo!(ctx, logged(setDefaultAudienceAction.change!(r, { audience: "everyone" }, null).before));
    expect(state.audience).toBe("met");
  });
});

describe("signInLabel", () => {
  it("names email and Google", () => {
    expect(signInLabel(["credential"])).toBe("Email");
    expect(signInLabel(["credential", "google"])).toBe("Email, Google");
  });
});
