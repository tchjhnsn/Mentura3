import { describe, expect, it } from "vitest";
import { COURSES, SUBJECTS, courseOf, lessonsOf } from "./aristotle/index";

const words = (s: string) => s.trim().split(/\s+/).length;
const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;

describe("Aristotle courses", () => {
  it("every subject's path names courses that exist, in that subject, once", () => {
    const seen = new Set<string>();
    for (const s of SUBJECTS) for (const id of s.path) {
      const c = courseOf(id);
      expect(c, `${s.id} path names ${id}`).toBeTruthy();
      expect(c!.subject).toBe(s.id);
      expect(seen.has(id)).toBe(false);
      seen.add(id);
    }
    for (const c of COURSES) expect(seen.has(c.id), `${c.id} is on its subject's path`).toBe(true);
  });

  for (const c of COURSES) {
    describe(c.id, () => {
      it("is well formed", () => {
        expect(c.id).toMatch(KEBAB);
        expect(c.units.length).toBeGreaterThan(0);
        expect(c.translation.url).toMatch(/^https:\/\//);
        expect(c.translation.year).toBeLessThan(1931);
        for (const b of c.before) expect(courseOf(b), `${c.id} before ${b}`).toBeTruthy();
        const units = new Set<string>();
        for (const u of c.units) { expect(units.has(u.id)).toBe(false); units.add(u.id); expect(u.lessons.length).toBeGreaterThan(0); }
      });
      it("has lessons a person can read and check", () => {
        const ids = new Set<string>();
        for (const { lesson: l } of lessonsOf(c)) {
          expect(l.id).toMatch(KEBAB);
          expect(ids.has(l.id), `duplicate lesson ${l.id}`).toBe(false);
          ids.add(l.id);
          expect(words(l.summary), `${l.id} summary`).toBeGreaterThanOrEqual(40);
          expect(words(l.summary), `${l.id} summary`).toBeLessThanOrEqual(200);
          expect(words(l.passage.text), `${l.id} passage`).toBeGreaterThanOrEqual(12);
          expect(words(l.passage.text), `${l.id} passage`).toBeLessThanOrEqual(110);
          if (c.bekker) expect(l.passage.ref).toMatch(/\d{1,4}[ab]/);
          expect(l.checks.length).toBeGreaterThanOrEqual(2);
          for (const k of l.checks) {
            expect(k.options.length).toBeGreaterThanOrEqual(3);
            expect(k.answer).toBeGreaterThanOrEqual(0);
            expect(k.answer).toBeLessThan(k.options.length);
            expect(new Set(k.options).size).toBe(k.options.length);
          }
          expect(l.journal.endsWith("?")).toBe(true);
          expect(l.minutes).toBeGreaterThan(0);
        }
      });
    });
  }
});
