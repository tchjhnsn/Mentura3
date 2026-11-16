import { describe, expect, it } from "vitest";
import { COLLECTIONS, collectionById } from "./collections.ts";
import { ART_DEBATE_PLAYLISTS, DEBATE_COURSES, MACHINE_DEBATE_PLAYLISTS, debateCourse } from "./start-debates.ts";

describe("courses on quarrels over art and machines", () => {
  it("builds each unit from a playlist Scholē has", () => {
    for (const c of DEBATE_COURSES) {
      expect(c.units.length, c.id).toBeGreaterThanOrEqual(4);
      for (const u of c.units) {
        expect(collectionById(u.playlist), `${c.id}: ${u.playlist}`).toBeTruthy();
        expect(u.question.endsWith("?"), u.playlist).toBe(true);
      }
    }
    expect(debateCourse("art-debates")?.units[2]?.playlist).toBe("art-impressionism");
  });

  it("uses every playlist in a course, once, and adds them all to the collections", () => {
    const used = DEBATE_COURSES.flatMap((c) => c.units.map((u) => u.playlist));
    const all = [...ART_DEBATE_PLAYLISTS, ...MACHINE_DEBATE_PLAYLISTS];
    expect(new Set(used).size).toBe(used.length);
    expect(new Set(used)).toEqual(new Set(all.map((c) => c.id)));
    for (const c of all) expect(COLLECTIONS).toContain(c);
  });

  it("opens with an ancient quarrel and ends with one of today", () => {
    expect(DEBATE_COURSES.map((c) => c.units[0]!.playlist)).toEqual(["art-plato-poets", "machines-plato-aristotle"]);
    expect(DEBATE_COURSES.map((c) => c.units.at(-1)!.playlist)).toEqual(["art-ai", "machines-thinking"]);
  });

  it("gives a reason for every item, and plays each from a source Scholē plays", () => {
    for (const c of [...ART_DEBATE_PLAYLISTS, ...MACHINE_DEBATE_PLAYLISTS]) {
      for (const i of c.items) {
        expect(i.why, `${c.id}: ${i.title}`).toBeTruthy();
        if (i.kind === "find") expect(i.url, `${c.id}: ${i.title}`).toMatch(/^https:\/\/(www\.youtube\.com\/watch\?v=[\w-]{11}|www\.artic\.edu\/artworks\/\d+)$/);
      }
    }
  });
});
