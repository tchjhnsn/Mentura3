import { beforeEach, describe, expect, it, vi } from "vitest";

// Scholē's crafts (Scholē landing design guide, 2026-11-19): the actions over an in-memory stand-in for the life
// records, with undo putting each change back.
type Rec = { id: string; app: string; kind: string; state: string | null; body: Record<string, unknown>; createdAt: string; updatedAt: string };
const recs = new Map<string, Rec>();
const acts: { record: string; kind: string; day: string; note?: unknown }[] = [];
let n = 0;

vi.mock("../life-store", () => ({
  lifeRecords: async () => [...recs.values()],
  addLifeRecord: async (_u: string, app: string, kind: string, body: Record<string, unknown>, state?: string) => {
    const id = `r${++n}`;
    recs.set(id, { id, app, kind, state: state ?? (kind === "craft" ? "drawn" : null), body: Object.fromEntries(Object.entries(body).filter(([, v]) => v !== undefined && v !== "")), createdAt: "", updatedAt: "" });
    return id;
  },
  saveLifeRecord: async (_u: string, id: string, body: Record<string, unknown>) => void (recs.get(id)!.body = Object.fromEntries(Object.entries(body).filter(([, v]) => v !== undefined && v !== ""))),
  setLifeState: async (_u: string, id: string, state: string) => void (recs.get(id)!.state = state),
  removeLifeRecord: async (_u: string, id: string) => void recs.delete(id),
  keepLifeAct: async (_u: string, record: string, a: { kind: string; day: string; note?: unknown }) => (acts.push({ record, ...a }), `a${acts.length}`),
  setLifeField: async (_u: string, _app: string, kind: string, key: string, value: string | null) => {
    let r = [...recs.values()].find((x) => x.kind === kind);
    if (!r) { r = { id: `r${++n}`, app: "work", kind, state: null, body: {}, createdAt: "", updatedAt: "" }; recs.set(r.id, r); }
    if (value === null) delete r.body[key]; else r.body[key] = value;
  },
}));
vi.mock("../connect-store", () => ({ friendsMet: async () => [{ id: "ann", name: "Ann" }, { id: "bo", name: "Bo" }] }));

const { craftAct, keepCraft, saveCraftAnswers, setCraftLearned, setCraftStage, setCraftState, setCraftVouch } = await import("./crafts");
const ctx = { userId: "me", today: "2026-11-19" };
const logged = (actionId: string, before: unknown, after: unknown) => ({ id: "c", userId: "me", actionId, source: "page" as const, tier: "own" as const, input: {}, before, after, status: "done" as const, preview: null, createdAt: new Date(), undoneAt: null });
const craft = (ref: string) => [...recs.values()].find((r) => r.kind === "craft" && r.body.ref === ref);

describe("crafts", () => {
  beforeEach(() => void (recs.clear(), (acts.length = 0), (n = 0)));

  it("keeps a craft as drawn with its catalogue title, sets the state when kept already, and undoes both", async () => {
    const b1 = await keepCraft.before!(ctx, { ref: "baking" });
    const r1 = await keepCraft.run(ctx, { ref: "baking" });
    expect(craft("baking")).toMatchObject({ state: "drawn", body: { ref: "baking", title: "Baking" } });
    expect(r1.href).toBe("/schole/crafts/baking");
    const b2 = await keepCraft.before!(ctx, { ref: "baking", state: "practising" });
    const r2 = await keepCraft.run(ctx, { ref: "baking", state: "practising" });
    expect(craft("baking")!.state).toBe("practising");
    await keepCraft.undo!(ctx, logged("keep_craft", b2, r2));
    expect(craft("baking")!.state).toBe("drawn");
    await keepCraft.undo!(ctx, logged("keep_craft", b1, r1));
    expect(craft("baking")).toBeUndefined();
    await expect(keepCraft.run(ctx, { ref: "no-such" })).rejects.toThrow("No such craft");
  });

  it("sets state, stage, how learned and vouches, each undone", async () => {
    await keepCraft.run(ctx, { ref: "joinery", state: "practising" });
    const b = await setCraftStage.before!(ctx, { ref: "joinery", stage: "competent" });
    const r = await setCraftStage.run(ctx, { ref: "joinery", stage: "competent" });
    expect(craft("joinery")!.body.stage).toBe("competent");
    await setCraftStage.undo!(ctx, logged("set_craft_stage", b, r));
    expect(craft("joinery")!.body.stage).toBeUndefined();

    await setCraftLearned.run(ctx, { ref: "joinery", how: ["school", "experience"] });
    expect(craft("joinery")!.body.how).toBe("experience,school");
    await setCraftLearned.run(ctx, { ref: "joinery", how: [] });
    expect(craft("joinery")!.body.how).toBeUndefined();

    await setCraftVouch.run(ctx, { ref: "joinery", friends: ["bo"] });
    expect(craft("joinery")!.body.vouch).toBe("bo");
    await expect(setCraftVouch.run(ctx, { ref: "joinery", friends: ["stranger"] })).rejects.toThrow("Only your Reflect friends");

    const bs = await setCraftState.before!(ctx, { ref: "joinery", state: "let-go" });
    const rs = await setCraftState.run(ctx, { ref: "joinery", state: "let-go" });
    expect(craft("joinery")!.state).toBe("let-go");
    await setCraftState.undo!(ctx, logged("set_craft_state", bs, rs));
    expect(craft("joinery")!.state).toBe("practising");
    await expect(setCraftStage.run(ctx, { ref: "pottery", stage: "novice" })).rejects.toThrow("You do not keep that craft");
  });

  it("keeps tried and made acts; trying a craft not kept keeps it as trying", async () => {
    await craftAct.run(ctx, { ref: "pottery", kind: "tried" });
    expect(craft("pottery")!.state).toBe("trying");
    expect(acts).toEqual([{ record: craft("pottery")!.id, kind: "tried", day: "2026-11-19", note: undefined }]);
    await keepCraft.run(ctx, { ref: "knitting" });
    await craftAct.run(ctx, { ref: "knitting", kind: "tried" });
    expect(craft("knitting")!.state).toBe("trying");
    await craftAct.run(ctx, { ref: "knitting", kind: "made", note: "A scarf" });
    expect(acts.at(-1)).toMatchObject({ kind: "made", note: "A scarf" });
    await expect(craftAct.run(ctx, { ref: "sewing", kind: "made" })).rejects.toThrow("You do not keep that craft");
  });

  it("merges Discover crafts answers into comma lists and undoes to what was there", async () => {
    await saveCraftAnswers.run(ctx, { answers: { "cook-a-meal": "like", "fix-a-tap": "not" } });
    const likes = () => [...recs.values()].find((r) => r.kind === "craft-likes")!.body;
    expect(likes()).toEqual({ likes: "cook-a-meal", nots: "fix-a-tap" });
    const b = await saveCraftAnswers.before!(ctx, { answers: { "fix-a-tap": "unsure", "knit-a-scarf": "like", bogus: "like" } });
    const r = await saveCraftAnswers.run(ctx, { answers: { "fix-a-tap": "unsure", "knit-a-scarf": "like", bogus: "like" } });
    expect(likes()).toEqual({ likes: "cook-a-meal,knit-a-scarf", unsure: "fix-a-tap" });
    expect(r.answered).toBe(3);
    await saveCraftAnswers.undo!(ctx, logged("save_craft_answers", b, r));
    expect(likes()).toEqual({ likes: "cook-a-meal", nots: "fix-a-tap" });
  });
});
