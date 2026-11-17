import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { freeIndex } from "./free";
import { checkLens, citeHref, citeLabel, firstPerson, ideasOut, lensAt, lensFor, lensGuidance, lensList, lensPersonHref, LENSES, type Lens } from "./thinker-lenses";

// Project Gutenberg's English texts, as Reflect's reader finds them (web/src/data/gutenberg.txt).
const GUTENBERG = freeIndex(readFileSync(new URL("../../../web/src/data/gutenberg.txt", import.meta.url), "utf8"));

const living = (over: Partial<Lens> = {}): Lens => ({
  id: "an-author", name: "An Author", living: true, works: [{ id: "OL1W", title: "A Book" }],
  ideas: [{ id: "one", text: "Small daily steps add up over a year.", cites: [{ kind: "book", title: "A Book", chapter: "Chapter 3" }] }],
  ...over,
});

describe("thinker lenses", () => {
  it("seeds only public-domain lenses that pass the check, with unique ids", () => {
    expect(new Set(LENSES.map((l) => l.id)).size).toBe(LENSES.length);
    for (const l of LENSES) {
      expect(checkLens(l)).toEqual([]);
      expect(l.living).toBe(false);
      expect(l.ideas.length).toBeGreaterThan(0);
    }
  });

  it("cites only texts Reflect can read: English Gutenberg texts in its catalog", () => {
    for (const l of LENSES) for (const w of l.works) expect(GUTENBERG.has(`#${w.gutenberg}`), `${l.id} ${w.title}`).toBe(true);
  });

  it("links a lens to its Scholē page when there is one", () => {
    expect(lensPersonHref(lensFor("marcus aurelius")!)).toBe("/schole/people/Marcus%20Aurelius");
    expect(lensPersonHref(lensFor("epictetus")!)).toBeNull();
  });

  it("rejects an idea with no citation", () => {
    const l = living({ ideas: [{ id: "bare", text: "Keep going.", cites: [] }] });
    expect(checkLens(l)).toContain("an-author/bare: no citation");
    const pd: Lens = { ...LENSES[0]!, ideas: [{ id: "bare", text: "Keep going.", cites: [] }] };
    expect(checkLens(pd)).toContain("marcus-aurelius/bare: no citation");
  });

  it("rejects the first person for a living person, and allows Reflect's voice", () => {
    expect(checkLens(living())).toEqual([]);
    for (const text of ["I want you to take massive action.", "My advice: decide now.", "We become what we repeat.", "Ask me anything."]) {
      expect(checkLens(living({ ideas: [{ id: "x", text, cites: [{ kind: "book", title: "A Book", chapter: "Chapter 1" }] }] }))).toContain("an-author/x: speaks in the first person for a living person");
    }
    expect(firstPerson("Decide what you want, then act on it.")).toBe(false);
  });

  it("rejects a quotation from a living author beyond a short phrase, and any held passage", () => {
    const long = living({ ideas: [{ id: "q", text: "Decisions shape a life.", cites: [{ kind: "book", title: "A Book", chapter: "Chapter 2", phrase: "it is in your moments of decision that your destiny is shaped" }] }] });
    expect(checkLens(long)).toContain("an-author/q: quotes more than a short phrase");
    const short = living({ ideas: [{ id: "q", text: "Decisions shape a life.", cites: [{ kind: "book", title: "A Book", chapter: "Chapter 2", phrase: "moments of decision" }] }] });
    expect(checkLens(short)).toEqual([]);
    const held = living({ works: [{ id: "OL1W", title: "A Book", gutenberg: "1" }], ideas: [{ id: "h", text: "Decide.", cites: [{ kind: "held", work: "OL1W", chapter: 1, p: 0, at: "1", words: "decide" }] }] });
    expect(checkLens(held)).toContain("an-author/h: quotes a living author; cite the book by title and chapter");
  });

  it("rejects a held citation to a work the lens does not have or a text Reflect does not hold", () => {
    const l: Lens = { ...LENSES[0]!, ideas: [{ id: "x", text: "Act well.", cites: [{ kind: "held", work: "OL9W", chapter: 1, p: 0, at: "I", words: "act" }] }] };
    expect(checkLens(l)).toContain("marcus-aurelius/x: cites OL9W, not one of the lens's works");
  });

  it("cites in words and opens the reader at the passage, inside Reflect", () => {
    const l = lensFor("Seneca")!;
    const c = l.ideas.find((i) => i.id === "postponement")!.cites[0]!;
    expect(citeLabel(l, c)).toBe("Minor Dialogues, Of the Shortness of Life, IX (tr. Aubrey Stewart)");
    expect(citeHref(l, c)).toBe("/schole/works/OL16876962W/read?t=64576&c=4&p=228&find=postponement+is+the+greatest+waste+of+life");
    for (const x of LENSES) for (const i of ideasOut(x)) for (const k of i.cites) expect(k.href).toMatch(/^\/(?!\/)[^\s]*$/);
    expect(citeHref(living(), living().ideas[0]!.cites[0]!)).toBe("/schole/browse?q=A%20Book");
  });

  it("finds a lens by id, name or work, and an idea by path", () => {
    expect(lensFor("The Enchiridion")?.id).toBe("epictetus");
    expect(lensFor("Benjamin Franklin")?.id).toBe("benjamin-franklin");
    expect(lensFor("Tony Robbins")).toBeUndefined();
    expect(lensAt("seneca")?.ideas.length).toBe(lensFor("seneca")!.ideas.length);
    expect(lensAt("seneca/postponement")?.ideas.map((i) => i.id)).toEqual(["postponement"]);
    expect(lensAt("seneca/nothing")).toBeNull();
    expect(lensList().map((l) => l.id)).toEqual(["marcus-aurelius", "epictetus", "seneca", "benjamin-franklin"]);
  });

  it("guides the model to Reflect's voice, and refuses to speak as someone it has no lens for", () => {
    const g = lensGuidance(lensFor("seneca"));
    expect(g).toContain("Reflect's own voice");
    expect(g).toContain("cite each idea");
    expect(g).toContain("never speak as Seneca");
    expect(lensGuidance(living())).toContain('say "ideas from A Book"');
    const none = lensGuidance(undefined, "Tony Robbins");
    expect(none).toContain("Reflect has no lens for Tony Robbins");
    expect(none).toContain("Do not speak as Tony Robbins");
  });
});
