import { describe, expect, it } from "vitest";
import { descriptionPrompt, readAiText, readingMinutes, summaryBlocks, summaryPrompt } from "./ai-text";

const src = [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/X", text: "X is a debate held in 1965." }];

describe("AI text", () => {
  it("asks for facts from the sources only, with a way to decline", () => {
    for (const p of [descriptionPrompt({ title: "X", kind: "debate" }, src), summaryPrompt({ title: "X" }, src)]) {
      expect(p).toContain("SOURCE 1 (Wikipedia, https://en.wikipedia.org/wiki/X)");
      expect(p).toContain("NONE");
    }
  });
  it("keeps a fitting answer and refuses a declined or empty one", () => {
    expect(readAiText("NONE", "description")).toBeNull();
    expect(readAiText("", "summary")).toBeNull();
    expect(readAiText("A debate at the Cambridge Union in 1965 between two writers on whether the American dream came at the expense of Black Americans.", "description")).not.toBeNull();
    expect(readAiText("too short", "summary")).toBeNull();
  });
  it("reads a summary into headings and paragraphs", () => {
    const b = summaryBlocks("Intro para.\n\n## First idea\nLine one\nline two.\n\n## In short\nEnd.");
    expect(b.map((x) => x.heading)).toEqual([false, true, false, true, false]);
    expect(b[2]!.text).toBe("Line one line two.");
    expect(readingMinutes("word ".repeat(2000))).toBe(10);
  });

  it("drops rules, numbering and emphasis from a summary", () => {
    const b = summaryBlocks("*Meditations* is notes.\n\n---\n\n## 1. A **handbook**\nIt is *short*.");
    expect(b).toEqual([{ heading: false, text: "Meditations is notes." }, { heading: true, text: "A handbook" }, { heading: false, text: "It is short." }]);
  });
});
