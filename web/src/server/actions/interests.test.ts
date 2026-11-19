import { beforeEach, describe, expect, it, vi } from "vitest";

// Get to know you (design guide "Get to know you: person dashboard", 2026-11-19): pick, sort and areas over an
// in-memory stand-in for the life records, each undone.
type Rec = { id: string; app: string; kind: string; state: string | null; body: Record<string, unknown>; createdAt: string; updatedAt: string };
const recs = new Map<string, Rec>();
type Act = { id: string; record: string; kind: string; day: string; minutes: null; amount: null; note: string | null; at: string };
const acts: Act[] = [];
let n = 0;
vi.mock("../life-store", () => ({
  lifeRecords: async () => [...recs.values()],
  lifeActs: async (_u: string, record?: string) => acts.filter((a) => !record || a.record === record),
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

const { interests, pickInterest, setInterest, setInterestArea } = await import("./interests");
const { myAreas, myInterests } = await import("../interests-store");
const ctx = { userId: "me" };
const logged = (actionId: string, before: unknown, after: unknown) => ({ id: "c", userId: "me", actionId, source: "page" as const, tier: "own" as const, input: {}, before, after, status: "done" as const, preview: null, createdAt: new Date(), undoneAt: null });

describe("interests", () => {
  beforeEach(() => void (recs.clear(), (acts.length = 0), (n = 0)));

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
    await pickInterest.run(ctx, { ref: "p-dan-carlin-s-hardcore-history", picked: true });
    const input = { ref: "p-dan-carlin-s-hardcore-history", modes: ["do", "know"] as ("do" | "know")[], do_commitment: "regular" as const, do_skill: "steady" as const, know_depth: "appreciates" as const };
    const b = await setInterest.before!(ctx, input);
    const r = await setInterest.run(ctx, input);
    const i = (await myInterests("me"))[0]!;
    expect(i.modes).toEqual(["do", "know"]);
    expect(i.do).toEqual({ commitment: "regular", skill: "steady" });
    expect(i.know).toMatchObject({ depth: "appreciates" });
    expect(i.make).toBeUndefined();
    await setInterest.run(ctx, { ref: "p-dan-carlin-s-hardcore-history", do_skill: null });
    expect((await myInterests("me"))[0]!.do?.skill).toBeUndefined();
    await setInterest.undo!(ctx, logged("set_interest", b, r));
    expect((await myInterests("me"))[0]!.modes).toEqual(["know"]);
  });

  it("marks areas done or skipped, sorted, put off, and undoes", async () => {
    await setInterestArea.run(ctx, { area: "books", as: "done" });
    const b = await setInterestArea.before!(ctx, { area: "podcasts", as: "skipped" });
    const r = await setInterestArea.run(ctx, { area: "podcasts", as: "skipped" });
    await setInterestArea.run(ctx, { sorted: true, later: "2026-11-26" });
    expect(await myAreas("me")).toEqual({ done: ["books"], skipped: ["podcasts"], sorted: true, later: "2026-11-26" });
    await setInterestArea.undo!(ctx, logged("set_interest_area", b, r));
    expect(await myAreas("me")).toEqual({ done: ["books"], skipped: [], sorted: false, later: null });
  });

  it("reads interests by path: all, a mode, an area, one thing, and nothing", async () => {
    await pickInterest.run(ctx, { ref: "b-meditations", picked: true });
    await setInterest.run(ctx, { ref: "b-meditations", know_depth: "studies" });
    const all = await interests.run(ctx, { path: "" }) as { count: number; interests: { says: string[] }[]; areas: { offered: string[] } };
    expect(all.count).toBe(1);
    expect(all.interests[0]!.says).toEqual(["You follow Meditations: studies it."]);
    expect(all.areas.offered).toEqual(["books", "podcasts"]);
    expect(await interests.run(ctx, { path: "know" })).toMatchObject({ mode: "know", interests: [{ ref: "b-meditations" }] });
    expect(await interests.run(ctx, { path: "make" })).toMatchObject({ interests: [] });
    expect(await interests.run(ctx, { path: "books" })).toMatchObject({ area: "books", interests: [{ ref: "b-meditations" }] });
    const one = await interests.run(ctx, { path: "b-meditations" }) as { interest: { ref: string }; thing: { title: string }; more_like_it: unknown[] };
    expect(one.interest.ref).toBe("b-meditations");
    expect(one.thing.title).toBe("Meditations");
    expect(await interests.run(ctx, { path: "b-emma" })).toMatchObject({ interest: null, thing: { title: "Emma" } });
    expect(await interests.run(ctx, { path: "nope" })).toMatchObject({ error: expect.stringContaining("Nothing at 'nope'") });
  });

  it("reads a kept craft as a Make interest without writing anything, and leaves it out where only picks count", async () => {
    await pickInterest.run(ctx, { ref: "b-meditations", picked: true });
    recs.set("c1", { id: "c1", app: "work", kind: "craft", state: "practising", body: { ref: "baking", title: "Baking", stage: "proficient", how: "experience" }, createdAt: "", updatedAt: "" });
    recs.set("c2", { id: "c2", app: "work", kind: "craft", state: "let-go", body: { ref: "joinery", title: "Joinery" }, createdAt: "", updatedAt: "" });
    acts.push({ id: "a1", record: "c1", kind: "made", day: "2026-11-12", minutes: null, amount: null, note: "Focaccia", at: "" });
    acts.push({ id: "a2", record: "other", kind: "made", day: "2026-11-12", minutes: null, amount: null, note: "Not a craft", at: "" });
    const before = JSON.stringify([...recs.values()]);

    const mine = await myInterests("me");
    expect(mine.map((i) => i.ref)).toEqual(["b-meditations", "craft:baking"]);
    expect(mine[1]).toMatchObject({ id: "c1", modes: ["make"], area: null, item: null, source: "told", make: { commitment: "regular", skill: "adapts" }, craft: { id: "baking", state: "practising", learned: ["experience"], made: [{ day: "2026-11-12", note: "Focaccia" }] } });
    expect((await myInterests("me", { crafts: false })).map((i) => i.ref)).toEqual(["b-meditations"]);

    const all = await interests.run(ctx, { path: "" }) as { count: number; interests: { ref: string }[] };
    expect(all.count).toBe(2);
    const make = await interests.run(ctx, { path: "make" }) as { interests: { ref: string; says: string[]; href: string; craft: { firstProject: string } }[] };
    expect(make.interests).toHaveLength(1);
    expect(make.interests[0]).toMatchObject({ ref: "craft:baking", says: ["You make Baking: regular practice, at Adapts."], href: "/schole/crafts/baking", craft: { firstProject: "Mug cake" } });
    expect(await interests.run(ctx, { path: "know" })).toMatchObject({ interests: [{ ref: "b-meditations" }] });
    const one = await interests.run(ctx, { path: "craft:baking" }) as { interest: { ref: string }; thing: { title: string; group: string; first_project: { name: string } }; more_like_it: { ref: string }[] };
    expect(one.interest.ref).toBe("craft:baking");
    expect(one.thing).toMatchObject({ title: "Baking", group: "Food and drink", first_project: { name: "Mug cake" } });
    expect(one.more_like_it.length).toBeGreaterThan(0);
    expect(one.more_like_it.every((m) => m.ref.startsWith("craft:"))).toBe(true);
    expect(await interests.run(ctx, { path: "craft:joinery" })).toMatchObject({ interest: null, thing: { title: "Joinery" } });
    expect(await interests.run(ctx, { path: "craft:nope" })).toMatchObject({ error: expect.stringContaining("Nothing at") });

    expect(JSON.stringify([...recs.values()])).toBe(before);
  });
});
