import { describe, expect, it } from "vitest";
import { GROUPS } from "@reflect/core/plan";
import { GLYPHS, hrefOf, MINE, toneOf, type Facts } from "./home-tiles";

const none: Facts = { learn: { underway: false, stated: false }, journal: { stated: false, open: false } };

describe("home tiles", () => {
  it("has 16 tiles (journal, ideas and legacy are a tool and lenses, not tiles), each with a glyph and in exactly one of the three groups", () => {
    expect(MINE).toHaveLength(16);
    expect(MINE.map((t) => t.id)).not.toContain("journal");
    for (const t of MINE) expect(GLYPHS[t.id], t.id).toBeTruthy();
    expect(GROUPS.flatMap((g) => g.tiles).sort()).toEqual(MINE.map((t) => t.id).sort());
  });

  it("opens every tile, at the part it names", () => {
    const links = Object.fromEntries(MINE.map((t) => [t.id, hrefOf(t)]));
    expect(links).toMatchObject({ learn: "/schole", food: "/meals", income: "/life/work?k=income", standing: "/life/polis?k=standing", ventures: "/life/ventures" });
    for (const t of MINE) expect(hrefOf(t), t.id).not.toBeNull();
  });

  it("takes tone from what the person has, unstated by default", () => {
    const learn = MINE.find((t) => t.id === "learn")!;
    expect(toneOf(learn, none)).toBe("unstated");
    expect(toneOf(learn, { ...none, learn: { underway: false, stated: true } })).toBe("thought");
    expect(toneOf(learn, { ...none, learn: { underway: true, stated: true } })).toBe("action");
    expect(toneOf(MINE.find((t) => t.id === "food")!, { learn: { underway: true, stated: true }, journal: { stated: true, open: true } })).toBe("unstated");
    expect(toneOf(MINE.find((t) => t.id === "food")!, { ...none, life: { food: "thought" } })).toBe("thought");
  });
});
