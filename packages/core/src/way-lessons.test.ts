import { describe, expect, it } from "vitest";
import { WAYS, LEISURE } from "./ways";
import { WAY_LESSONS, wayLesson } from "./way-lessons";

describe("a lesson on each way", () => {
  it("teaches every way and play, each with places and examples", () => {
    for (const w of [...WAYS.map((x) => x.id), LEISURE.id]) {
      const l = wayLesson(w)!;
      expect(l.what.length).toBeGreaterThan(0);
      expect(l.already.length).toBeGreaterThan(0);
      expect(l.places.length).toBeGreaterThan(0);
    }
    expect(WAY_LESSONS.length).toBe(5);
  });
});
