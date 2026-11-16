import { describe, expect, it } from "vitest";
import { LEVELS, gradePrompt, parseGrade, parseTopic, pointsFor, topicKey } from "./argument";
import { DIALECTICS, dialecticWorks, rankDialectics } from "./dialectics";
import { workById } from "./topic-pages";

describe("argument levels", () => {
  it("has five levels and points up to 5", () => {
    expect(LEVELS.map((l) => l.level)).toEqual([1, 2, 3, 4, 5]);
    expect(pointsFor(3)).toBe(3);
    expect(pointsFor(9)).toBe(5);
    expect(pointsFor(null)).toBe(0);
  });

  it("reads a model's grade and refuses anything else", () => {
    expect(parseGrade('Here: {"stance":"opposes","level":4,"why":"cites Gorgias"}')).toEqual({ stance: "opposes", level: 4, why: "cites Gorgias" });
    expect(parseGrade('{"stance":"maybe","level":4}')).toBeNull();
    expect(parseGrade('{"stance":"supports","level":6}')).toBeNull();
    expect(parseGrade("no json")).toBeNull();
    expect(gradePrompt("x", { kind: "post", text: "y" })).toContain("Tested");
    expect(gradePrompt("x", null)).toContain("\"stance\": \"neither\"");
  });

  it("keys topics", () => {
    expect(parseTopic(topicKey("person", "Niccolò Machiavelli"))).toEqual({ kind: "person", id: "Niccolò Machiavelli" });
    expect(parseTopic("bad:x")).toBeNull();
  });
});

describe("curated dialectics", () => {
  it("point at works with pages and order by what the person keeps", () => {
    expect(new Set(DIALECTICS.map((d) => d.id)).size).toBe(DIALECTICS.length);
    for (const d of DIALECTICS) {
      expect(d.positions.length).toBeGreaterThanOrEqual(3);
      for (const p of d.positions) expect(Boolean(p.work ? workById(p.work) : p.title), `${d.id} ${p.who}`).toBe(true);
    }
    const r = rankDialectics(new Set(["prince"]));
    expect(r[0]!.d.id).toBe("feared-or-loved");
    expect(r[0]!.because).toBe("prince");
    expect(dialecticWorks(DIALECTICS[0]!)).toContain("meno");
  });
});
