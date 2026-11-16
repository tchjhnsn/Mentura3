import { describe, expect, it } from "vitest";
import { articleOfSlug, articleSlug, readArticle, readExtract, readsArticle } from "./articles";

describe("articles", () => {
  it("reads headings and paragraphs, leaving out references and empty headings", () => {
    const text = "A Gregorian mode is one of eight.\n\n\n== History ==\nThe name of Pope Gregory.\n=== Early ===\n\n== Names ==\nGreek names.\n\n== See also ==\nList\n=== More ===\nx\n== References ==\n1. A book";
    expect(readExtract(text)).toEqual([
      { kind: "p", text: "A Gregorian mode is one of eight." },
      { kind: "h", level: 2, text: "History" },
      { kind: "p", text: "The name of Pope Gregory." },
      { kind: "h", level: 2, text: "Names" },
      { kind: "p", text: "Greek names." },
    ]);
  });

  it("reads only articles a person page names", () => {
    expect(readsArticle("Gregorian mode")).toBe(true);
    expect(readsArticle("Main Page")).toBe(false);
    expect(articleOfSlug(articleSlug("Musical system of ancient Greece"))).toBe("Musical system of ancient Greece");
  });

  it("reads the MediaWiki answer, null when missing", () => {
    expect(readArticle(JSON.stringify({ query: { pages: [{ title: "Aulos", fullurl: "https://en.wikipedia.org/wiki/Aulos", extract: "An aulos is a pipe." }] } }))?.blocks).toEqual([{ kind: "p", text: "An aulos is a pipe." }]);
    expect(readArticle(JSON.stringify({ query: { pages: [{ title: "X", missing: true }] } }))).toBeNull();
    expect(readArticle("not json")).toBeNull();
  });
});
