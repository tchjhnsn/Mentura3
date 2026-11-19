import { beforeEach, describe, expect, it, vi } from "vitest";

// Get to know you (design guide "Get to know you: person dashboard", 2026-11-19): pick, sort and areas over an
// in-memory stand-in for the life records, each undone.
type Rec = { id: string; app: string; kind: string; state: string | null; body: Record<string, unknown>; createdAt: string; updatedAt: string };
const recs = new Map<string, Rec>();
let n = 0;
vi.mock("../life-store", () => ({
  lifeRecords: async () => [...recs.values()],
  addLifeRecord: async (_u: string, app: string, kind: string, body: Record<string, unknown>, state?: string) => {
    const id = `r${++n}`;
    recs.set(id, { id, app, kind, state: state ?? null, body: { ...body }, createdAt: "", updatedAt: "" });
    return id;
  },
  saveLifeRecord: async (_u: string, id: string, body: Record<string, unknown>) => void (recs.get(id)!.body = { ...body }),
  setLifeState: async (_u: string, id: string, state: string) => void (recs.get(id)!.state = state),
  removeLifeRecord: async (_u: string, id: string) => void recs.delete(id),
  setLifeField: async (_u: string, _app: string, kind: string, key: string, value: string | null) => {
    let r = [...recs.values()].find((x) => x.kind === kind);
    if (!r) { r = { id: `r${++n}`, app: "work", kind, state: null, body: {}, createdAt: "", updatedAt: "" }; recs.set(r.id, r); }
    if (value === null) delete r.body[key]; else r.body[key] = value;
  },
}));

const { pickInterest, setInterest, setInterestArea } = await import("./interests");
const { myAreas, myInterests } = await import("../interests-store");
const ctx = { userId: "me" };
const logged = (actionId: string, before: unknown, after: unknown) => ({ id: "c", userId: "me", actionId, source: "page" as const, tier: "own" as const, input: {}, before, after, status: "done" as const, preview: null, createdAt: new Date(), undoneAt: null });

describe("interests", () => {
  beforeEach(() => void (recs.clear(), (n = 0)));

  it("picks a book as something followed, unpicks it, picks it again, and undoes the first pick", async () => {
    const b = await pickInterest.before!(ctx, { ref: "b-meditations", picked: true });
    const r = await pickInterest.run(ctx, { ref: "b-meditations", picked: true });
    expect((await myInterests("me"))[0]).toMatchObject({ ref: "b-meditations", area: "books", modes: ["know"], source: "told" });
    await pickInterest.run(ctx, { ref: "b-meditations", picked: false });
    expect(await myInterests("me")).toHaveLength(0);
    await pickInterest.run(ctx, { ref: "b-meditations", picked: true });
    expect(await myInterests("me")).toHaveLength(1);
    await pickInterest.undo!(ctx, logged("pick_interest", b, r));
    expect(recs.size).toBe(0);
    await expect(pickInterest.run(ctx, { ref: "nope", picked: true })).rejects.toThrow("No such thing");
  });

  it("sorts into Make, Do, Know with levels, clears one, and undoes", async () => {
    await pickInterest.run(ctx, { ref: "m-miles-davis", picked: true });
    const input = { ref: "m-miles-davis", modes: ["do", "know"] as ("do" | "know")[], do_commitment: "regular" as const, do_skill: "steady" as const, know_depth: "appreciates" as const };
    const b = await setInterest.before!(ctx, input);
    const r = await setInterest.run(ctx, input);
    const i = (await myInterests("me"))[0]!;
    expect(i.modes).toEqual(["do", "know"]);
    expect(i.do).toEqual({ commitment: "regular", skill: "steady" });
    expect(i.know).toMatchObject({ depth: "appreciates" });
    expect(i.make).toBeUndefined();
    await setInterest.run(ctx, { ref: "m-miles-davis", do_skill: null });
    expect((await myInterests("me"))[0]!.do?.skill).toBeUndefined();
    await setInterest.undo!(ctx, logged("set_interest", b, r));
    expect((await myInterests("me"))[0]!.modes).toEqual(["know"]);
  });

  it("marks areas done or skipped, sorted, put off, and undoes", async () => {
    await setInterestArea.run(ctx, { area: "books", as: "done" });
    const b = await setInterestArea.before!(ctx, { area: "music", as: "skipped" });
    const r = await setInterestArea.run(ctx, { area: "music", as: "skipped" });
    await setInterestArea.run(ctx, { sorted: true, later: "2026-11-26" });
    expect(await myAreas("me")).toEqual({ done: ["books"], skipped: ["music"], sorted: true, later: "2026-11-26" });
    await setInterestArea.undo!(ctx, logged("set_interest_area", b, r));
    expect(await myAreas("me")).toEqual({ done: ["books"], skipped: [], sorted: false, later: null });
  });
});
