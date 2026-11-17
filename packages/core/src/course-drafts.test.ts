import { describe, expect, it } from "vitest";
import { cleanRef, clipPassage, madeCourseHref, madeCourseKey, planNotes, readPlan, type CoursePlan } from "./course-drafts";

const KEY = "11111111-2222-4333-8444-555555555555";

describe("courses drafted in Ask Reflect", () => {
  it("checks a passage reference again and refuses words in its place", () => {
    expect(cleanRef({ kind: "book", work: "OL1W", chapter: 2, p: 0 })).toEqual({ kind: "book", work: "OL1W", chapter: 2, p: 0 });
    expect(cleanRef({ kind: "transcript", item: KEY, at: 65, text: "x" })).toEqual({ kind: "transcript", item: KEY, at: 65 });
    expect(cleanRef({ kind: "book", work: "Apology", chapter: 1, p: 0 })).toBeNull();
    expect(cleanRef({ kind: "book", work: "OL1W", chapter: 0, p: 0 })).toBeNull();
    expect(cleanRef({ text: "The unexamined life" })).toBeNull();
    expect(cleanRef("OL1W")).toBeNull();
  });

  it("cuts a long paragraph around the words looked for, at word boundaries", () => {
    expect(clipPassage("  short   text ")).toBe("short text");
    const long = Array.from({ length: 200 }, (_, i) => `w${i}`).join(" ");
    const at = long.indexOf("w150");
    const cut = clipPassage(long, at, 100);
    expect(cut.startsWith("…") && cut.endsWith("…")).toBe(true);
    expect(cut).toContain("w150");
    expect(cut.length).toBeLessThanOrEqual(102);
  });

  it("knows a drafted course's page from its learn item's link", () => {
    expect(madeCourseKey(`https://reflect.example${madeCourseHref(KEY)}`)).toBe(KEY);
    expect(madeCourseKey("https://en.wikipedia.org/wiki/Piano_pedagogy")).toBeNull();
    expect(madeCourseKey("https://x/schole/courses/made/not-a-key")).toBeNull();
    expect(madeCourseKey(null)).toBeNull();
  });

  it("keeps a plan on note rows and reads it back in order, whatever order the rows come in", () => {
    const plan: CoursePlan = {
      goal: "Read the Apology closely.",
      units: [
        { title: "Trial", works: [{ kind: "book", work: "OL1W", title: "Apology", author: "Plato" }], passages: [
          { ref: { kind: "book", work: "OL1W", chapter: 1, p: 2 }, text: "The unexamined life", cite: "Plato, Apology", source: "Project Gutenberg", href: "/schole/works/OL1W/read?c=1&p=2" },
          { ref: { kind: "book", work: "OL1W", chapter: 1, p: 1 }, text: "O men of Athens", cite: "Plato, Apology", source: "Project Gutenberg", href: "/schole/works/OL1W/read?c=1&p=1" },
        ] },
        { title: "Death", works: [], passages: [] },
      ],
    };
    const rows = planNotes(plan);
    expect(rows[0]!.unit).toBe("goal");
    expect(readPlan([...rows].reverse())).toEqual(plan);
    expect(readPlan([{ quote: null, note: "a note the person wrote" }])).toEqual({ goal: "", units: [] });
  });
});
