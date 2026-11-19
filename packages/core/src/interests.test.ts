import { describe, expect, it } from "vitest";
import { COMMITMENT, DEPTH, MODES, SKILL, fromCraft, isStep, sentence, stepIndex, type Interest } from "./interests";

describe("interest levels", () => {
  it("keeps each ladder in order, low to high, with unique ids", () => {
    for (const steps of [MODES, COMMITMENT, DEPTH, SKILL]) expect(new Set(steps.map((s) => s.id)).size).toBe(steps.length);
    expect(COMMITMENT.map((s) => s.id)).toEqual(["curious", "tried", "now-and-then", "goal", "regular", "way-of-life"]);
    expect(DEPTH.map((s) => s.id)).toEqual(["heard-of", "follows", "appreciates", "understands", "studies", "explains", "teaches"]);
    expect(SKILL.map((s) => s.id)).toEqual(["copy", "steady", "precise", "adapts", "second-nature"]);
    expect(stepIndex(DEPTH, "teaches")).toBeGreaterThan(stepIndex(DEPTH, "follows"));
    expect(stepIndex(DEPTH, undefined)).toBe(-1);
    expect(isStep(SKILL, "steady")).toBe(true);
    expect(isStep(SKILL, "expert")).toBe(false);
  });

  it("tells the three runners apart", () => {
    const walker: Interest = { ref: "wd:Q1640", title: "running", do: { commitment: "now-and-then", role: "participant", skill: "copy" }, source: "told" };
    const once: Interest = { ref: "wd:Q1640", title: "running", do: { commitment: "goal", skill: "steady", goal: { what: "one marathon", by: "2027-04-19" } }, source: "told" };
    const lifer: Interest = { ref: "wd:Q1640", title: "running", do: { commitment: "way-of-life", role: "competitor", skill: "second-nature" }, source: "told" };
    expect(sentence(walker, "do")).toBe("You do running: now and then, at Copy, as a participant.");
    expect(sentence(once, "do")).toBe("You do running: toward a goal, at Steady, goal: one marathon by 2027-04-19.");
    expect(sentence(lifer, "do")).toBe("You do running: way of life, at Second nature, as a competitor.");
  });

  it("reads a boxing fan as Know, never as done", () => {
    const fan: Interest = { ref: "wd:Q32112", title: "boxing", know: { commitment: "now-and-then", ways: ["watching"], depth: "follows", details: { footwork: "studies" } }, source: "told" };
    expect(sentence(fan, "know")).toBe("You follow boxing: now and then, follows it.");
    expect(sentence(fan, "make")).toBeNull();
  });

  it("maps a Scholē craft onto commitment and skill", () => {
    expect(fromCraft({ ref: "baking", title: "Baking", state: "practising", stage: "Competent" })).toEqual({ ref: "craft:baking", title: "Baking", make: { commitment: "regular", skill: "precise" }, source: "told" });
    expect(fromCraft({ ref: "joinery", title: "Joinery", state: "drawn" }).make).toEqual({ commitment: "curious", skill: undefined });
  });
});
