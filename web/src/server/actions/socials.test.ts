import { beforeEach, describe, expect, it, vi } from "vitest";

// Socials (2026-11-18): adding, Undo putting back a replaced link, and Confirm refused where link-back cannot work,
// over a stand-in for the rows and the link-back fetch.
type Row = { id: string; service: string; label: string; url: string; handle: string | null; confirmedBy: string | null; position: number };
const state = { rows: [] as Row[], next: 1, confirmed: [] as [string, string | null][], linksBack: false };
vi.mock("../profile-store", () => ({
  socialsOf: async () => state.rows,
  profileSettings: async () => ({ handle: "ana" }),
  addSocial: async (_u: string, l: { service: string; url: string; handle: string | null }) => {
    const replaced = state.rows.find((r) => r.service === l.service) ?? null;
    state.rows = state.rows.filter((r) => r !== replaced);
    const added = { id: `s${state.next++}`, service: l.service, label: l.service, url: l.url, handle: l.handle, confirmedBy: null, position: 0 };
    state.rows.push(added);
    return { added, replaced };
  },
  removeSocial: async (_u: string, id: string) => {
    const s = state.rows.find((r) => r.id === id) ?? null;
    state.rows = state.rows.filter((r) => r.id !== id);
    return s;
  },
  restoreSocial: async (_u: string, s: Row) => void state.rows.push(s),
  setConfirmed: async (_u: string, id: string, by: string | null) => void state.confirmed.push([id, by]),
}));
vi.mock("../link-back", () => ({ checkLinkBack: async () => state.linksBack, relMeLine: (k: string) => `<a rel="me" href="https://reflect.example/p/${k}">Reflect</a>` }));

const { addSocialAction, confirmSocialAction, removeSocialAction } = await import("./socials");
const ctx = { userId: "me" };
const logged = (before: unknown, after: unknown = null) => ({ id: "c", userId: "me", actionId: "x", source: "chat" as const, tier: "own" as const, input: {}, before, after, status: "done" as const, preview: null, createdAt: new Date(), undoneAt: null });

describe("socials", () => {
  beforeEach(() => Object.assign(state, { rows: [], next: 1, confirmed: [], linksBack: false }));

  it("adds a link from a paste, and Undo removes it and puts back the one it replaced", async () => {
    await addSocialAction.run(ctx, { link: "github.com/old" });
    const r = await addSocialAction.run(ctx, { link: "https://github.com/ana" });
    expect(state.rows.map((x) => x.url)).toEqual(["https://github.com/ana"]);
    await addSocialAction.undo!(ctx, logged(r.replaced, { id: r.added.id }));
    expect(state.rows.map((x) => x.url)).toEqual(["https://github.com/old"]);
  });

  it("refuses what is not a link", async () => {
    await expect(addSocialAction.run(ctx, { link: "not a link" })).rejects.toThrow(/not a link/);
  });

  it("removes by service, and Undo restores it", async () => {
    await addSocialAction.run(ctx, { link: "ana", service: "github" });
    const r = await removeSocialAction.run(ctx, { link: "github" });
    expect(state.rows).toEqual([]);
    await removeSocialAction.undo!(ctx, logged(r.removed));
    expect(state.rows.map((x) => x.service)).toEqual(["github"]);
  });

  it("confirms by link-back, returns the line to paste when it fails, and never offers it for LinkedIn", async () => {
    const { added } = await addSocialAction.run(ctx, { link: "ana.dev" });
    const fail = await confirmSocialAction.run(ctx, { link: added.id });
    expect(fail).toMatchObject({ confirmed: false, line: '<a rel="me" href="https://reflect.example/p/ana">Reflect</a>' });
    state.linksBack = true;
    expect(await confirmSocialAction.run(ctx, { link: added.id })).toMatchObject({ confirmed: true });
    expect(state.confirmed).toEqual([[added.id, "rel-me"]]);
    await confirmSocialAction.undo!(ctx, logged({ id: added.id, confirmedBy: null }));
    expect(state.confirmed.at(-1)).toEqual([added.id, null]);
    await addSocialAction.run(ctx, { link: "linkedin.com/in/ana" });
    await expect(confirmSocialAction.run(ctx, { link: "linkedin" })).rejects.toThrow(/uploads their export/);
  });
});
