import { describe, expect, it } from "vitest";
import { ACTIVITIES, CONTESTS, CRAFTS, CRAFT_GROUPS, DOORS, ENOUGH, HOLLAND, STAGES, answersBody, answersFrom, craftOf, craftsIn, discover, nextActivity, type Answer } from "./crafts";
import { kindOf } from "./life";

describe("crafts catalogue", () => {
  it("has unique ids for crafts, groups and activities", () => {
    for (const ids of [CRAFTS.map((c) => c.id), CRAFT_GROUPS.map((g) => g.id), ACTIVITIES.map((a) => a.id), DOORS.map((d) => d.id)]) expect(new Set(ids).size).toBe(ids.length);
  });

  it("gives every group crafts and every activity crafts that exist", () => {
    for (const g of CRAFT_GROUPS) expect(craftsIn(g.id).length, g.id).toBeGreaterThan(0);
    for (const a of ACTIVITIES) {
      expect(a.crafts.length, a.id).toBeGreaterThan(0);
      for (const c of a.crafts) expect(craftOf(c), `${a.id} -> ${c}`).toBeDefined();
      expect(HOLLAND[a.type]).toBeDefined();
    }
    expect(ACTIVITIES.length).toBeGreaterThanOrEqual(ENOUGH);
  });

  it("keeps contests as crafts that exist, under performance", () => {
    for (const c of CONTESTS) expect(craftOf(c)?.group, c).toBe("performance");
  });

  it("names each door in six languages, with a transliteration where the script is not Latin", () => {
    for (const d of DOORS) {
      expect(d.names.map((x) => x.lang)).toEqual(["en", "el", "he", "la", "fr", "de"]);
      for (const x of d.names) if (x.lang === "el" || x.lang === "he") expect(x.say, `${d.id} ${x.lang}`).toBeTruthy();
    }
  });

  it("matches the craft record's stage choices to the Dreyfus stages", () => {
    const stage = kindOf("work", "craft")!.fields.find((f) => f.key === "stage")!;
    expect(stage.options!.map((o) => o.id)).toEqual(STAGES.map((s) => s.id));
  });
});

describe("discover", () => {
  it("ranks the crafts liked activities point at most, with why, and leads with their group and type", () => {
    const r = discover({ "plane-a-board": "like", "cut-a-joint": "like", "fix-a-tap": "not", "cook-a-meal": "unsure" });
    expect(r.answered).toBe(4);
    expect(r.crafts.slice(0, 2).map((x) => x.craft.id)).toEqual(["joinery", "cabinetmaking"]);
    expect(r.crafts[0]!.because.map((a) => a.id)).toEqual(["plane-a-board", "cut-a-joint"]);
    expect(r.crafts.some((x) => x.craft.id === "plumbing" || x.craft.id === "cooking")).toBe(false);
    expect(r.groups[0]!.id).toBe("building");
    expect(r.type).toBe("R");
  });

  it("finds nothing with nothing liked", () => {
    expect(discover({ "fix-a-tap": "not" })).toMatchObject({ crafts: [], groups: [], type: null, answered: 1 });
  });

  it("round-trips answers through the record's comma lists, dropping unknown ids", () => {
    const a: Record<string, Answer> = { "cook-a-meal": "like", "knit-a-scarf": "like", "fix-a-tap": "unsure", "sail-a-boat": "not" };
    const body = answersBody({ ...a, bogus: "like" });
    expect(body).toEqual({ likes: "cook-a-meal,knit-a-scarf", unsure: "fix-a-tap", nots: "sail-a-boat" });
    expect(answersFrom(body)).toEqual(a);
    expect(answersFrom({})).toEqual({});
  });

  it("asks the next activity not yet answered, and none when all are", () => {
    expect(nextActivity({})).toBe(ACTIVITIES[0]);
    expect(nextActivity({ [ACTIVITIES[0]!.id]: "like" })).toBe(ACTIVITIES[1]);
    expect(nextActivity(Object.fromEntries(ACTIVITIES.map((x) => [x.id, "not" as Answer])))).toBeNull();
  });
});
