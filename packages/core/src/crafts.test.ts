import { describe, expect, it } from "vitest";
import { ACTIVITIES, CONTESTS, CRAFTS, CRAFT_GROUPS, DOORS, ENOUGH, FIRST_PROJECTS, HOLLAND, STAGES, WORLDS, answersBody, answersFrom, craftOf, craftPhoto, craftsIn, discover, matchCrafts, nextActivity, related, worldName, worldPhoto, type Answer } from "./crafts";
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

describe("the photo picker", () => {
  it("names a world for every group", () => {
    expect(WORLDS.map((w) => w.id)).toEqual(CRAFT_GROUPS.map((g) => g.id));
    for (const g of CRAFT_GROUPS) expect(worldName(g.id)).toBeTruthy();
  });

  it("gives every craft a first project of 5 to 15 minutes in 3 to 6 steps, without em dashes", () => {
    expect(Object.keys(FIRST_PROJECTS).sort()).toEqual(CRAFTS.map((c) => c.id).sort());
    for (const c of CRAFTS) {
      const fp = FIRST_PROJECTS[c.id]!;
      expect(fp.minutes, c.id).toBeGreaterThanOrEqual(5);
      expect(fp.minutes, c.id).toBeLessThanOrEqual(15);
      expect(fp.steps.length, c.id).toBeGreaterThanOrEqual(3);
      expect(fp.steps.length, c.id).toBeLessThanOrEqual(6);
      expect(fp.name && fp.needs, c.id).toBeTruthy();
      expect(JSON.stringify(fp), c.id).not.toMatch(/\u2014|\u2013/);
    }
  });

  it("relates each craft to up to four other crafts that exist", () => {
    for (const c of CRAFTS) {
      const r = related(c.id);
      expect(r.length, c.id).toBeGreaterThan(0);
      expect(r.length, c.id).toBeLessThanOrEqual(4);
      expect(r, c.id).not.toContain(c.id);
      expect(new Set(r).size).toBe(r.length);
      for (const x of r) expect(craftOf(x), `${c.id} -> ${x}`).toBeDefined();
    }
    expect(related("joinery")[0]).toBe("cabinetmaking");
    expect(related("nope")).toEqual([]);
  });

  it("matches three distinct crafts with the picks among them, and a surprise from another world", () => {
    const picks = ["joinery", "baking", "knitting"];
    const r = matchCrafts(picks);
    const ids = r.top.map((t) => t.id);
    expect(ids).toHaveLength(3);
    expect(new Set(ids).size).toBe(3);
    for (const p of picks) expect(ids).toContain(p);
    for (const t of r.top) expect(t.because[0]).toBe(t.id);
    const groups = new Set(picks.map((p) => craftOf(p)!.group));
    expect(r.surprise).not.toBeNull();
    expect(groups.has(craftOf(r.surprise!.id)!.group)).toBe(false);
    expect(r.surprise!.because).toBeTruthy();
    expect(matchCrafts(picks)).toEqual(r);
  });

  it("fills the top with related crafts when few are picked, and says why", () => {
    const r = matchCrafts(["joinery"]);
    expect(r.top[0]).toEqual({ id: "joinery", because: ["joinery"] });
    expect(r.top.slice(1).every((t) => t.because.includes("joinery"))).toBe(true);
    expect(matchCrafts(["fishing"]).surprise?.id).toBeDefined();
  });

  it("has a photo for every craft and world (or a tinted tile where no photo shows the work: at most 15)", () => {
    const misses = [...CRAFTS.filter((c) => !craftPhoto(c.id)?.src).map((c) => c.id), ...WORLDS.filter((w) => !worldPhoto(w.id)?.src).map((w) => `world:${w.id}`)];
    expect(misses.length, `missing photos: ${misses.join(", ")}`).toBeLessThanOrEqual(15);
    for (const c of CRAFTS) { const ph = craftPhoto(c.id); if (ph) expect(ph.page).toMatch(/^https:\/\/en\.wikipedia\.org\//); }
  });
});
