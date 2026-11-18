import { describe, expect, it, vi } from "vitest";

vi.mock("@/db/pool", () => ({ db: () => ({ query: async () => ({ rows: [] }) }) }));
const { cleanSkill, skillsBlock } = await import("./skills");

describe("skills", () => {
  it("checks a skill's fields", () => {
    expect(cleanSkill({ name: "  Plain  words ", description: "Any writing", instructions: "Use short sentences." })).toEqual({ name: "Plain words", description: "Any writing", instructions: "Use short sentences." });
    expect(() => cleanSkill({ name: "", description: "x", instructions: "long enough" })).toThrow("name");
    expect(() => cleanSkill({ name: "a", description: "", instructions: "long enough" })).toThrow("when");
    expect(() => cleanSkill({ name: "a", description: "b", instructions: "short" })).toThrow("Write");
  });
  it("puts only the skills that are on into Ask Reflect's instructions", () => {
    const base = { updatedAt: "", description: "Planning a week", instructions: "Start with the hardest task.\nThen rest." };
    expect(skillsBlock([])).toBe("");
    const text = skillsBlock([{ ...base, id: "1", name: "Week plan", enabled: true }, { ...base, id: "2", name: "Off", enabled: false }]);
    expect(text).toContain("- Week plan (use when: Planning a week): Start with the hardest task. Then rest.");
    expect(text).not.toContain("Off");
    expect(text).toContain("never override");
  });
});
