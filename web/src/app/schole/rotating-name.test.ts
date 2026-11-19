import { describe, expect, it } from "vitest";
import { DOORS, CRAFT_GROUPS } from "@reflect/core/crafts";
import { groupNames, nextIndex, ordered } from "./names";

describe("rotating names", () => {
  it("turn English, Greek, Hebrew, Latin, French, German, whatever order they are given in", () => {
    const shuffled = [...DOORS[0]!.names].reverse();
    expect(ordered(shuffled).map((n) => n.lang)).toEqual(["en", "el", "he", "la", "fr", "de"]);
  });
  it("go back to the first after the last", () => {
    expect(nextIndex(0, 6)).toBe(1);
    expect(nextIndex(5, 6)).toBe(0);
    expect(nextIndex(0, 1)).toBe(0);
    expect(nextIndex(0, 0)).toBe(0);
  });
  it("give every door all six languages, and Greek and Hebrew a way to say them", () => {
    for (const d of DOORS) {
      expect(ordered(d.names).map((n) => n.lang)).toEqual(["en", "el", "he", "la", "fr", "de"]);
      for (const n of d.names) if (n.lang === "el" || n.lang === "he") expect(n.say).toBeTruthy();
    }
  });
  it("turn craft groups in English and Latin only", () => {
    for (const g of CRAFT_GROUPS) {
      const langs = groupNames(g).map((n) => n.lang);
      expect(langs).toEqual(g.latin ? ["en", "la"] : ["en"]);
    }
  });
});
