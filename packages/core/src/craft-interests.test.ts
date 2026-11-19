import { describe, expect, it } from "vitest";
import { craftAsInterest } from "./craft-interests";
import { sentence } from "./interests";

describe("a craft read as a Make interest", () => {
  it("maps state and stage onto Make's commitment and skill, and keeps the craft's own details", () => {
    const i = craftAsInterest(
      { ref: "baking", title: "Baking", state: "practising", body: { ref: "baking", title: "Baking", stage: "competent", how: "practice,school,nope", vouch: "f1,f2", why: "Bread on Sundays", made: "A sourdough loaf" } },
      [
        { kind: "tried", day: "2026-11-01", note: null },
        { kind: "made", day: "2026-11-03", note: "Focaccia" },
        { kind: "made", day: "2026-11-10", note: "Rye" },
        { kind: "tried", day: "2026-11-02", note: null },
      ],
    );
    expect(i).toMatchObject({ ref: "craft:baking", title: "Baking", make: { commitment: "regular", skill: "precise" }, source: "told" });
    expect(i.do).toBeUndefined();
    expect(i.know).toBeUndefined();
    expect(i.craft).toEqual({
      id: "baking", group: "food", state: "practising", stage: "competent", why: "Bread on Sundays", madeText: "A sourdough loaf",
      learned: ["practice", "school"], vouches: 2, tried: 2,
      made: [{ day: "2026-11-10", note: "Rye" }, { day: "2026-11-03", note: "Focaccia" }],
      firstProject: "Mug cake", href: "/schole/crafts/baking",
    });
    expect(sentence(i, "make")).toBe("You make Baking: regular practice, at Precise.");
  });

  it("reads a drawn craft as Curious with no skill, a stage kept by its label, and falls back to the catalogue label", () => {
    const drawn = craftAsInterest({ ref: "joinery", state: "drawn", body: { ref: "joinery" } });
    expect(drawn).toMatchObject({ title: "Joinery", make: { commitment: "curious" } });
    expect(drawn.make?.skill).toBeUndefined();
    expect(drawn.craft).toMatchObject({ state: "drawn", stage: null, why: null, learned: [], vouches: 0, tried: 0, made: [] });
    const labelled = craftAsInterest({ ref: "pottery", title: "Pottery", state: "trying", body: { stage: "Advanced beginner" } });
    expect(labelled.make).toEqual({ commitment: "tried", skill: "steady" });
    expect(labelled.craft.stage).toBe("advanced-beginner");
  });
});
