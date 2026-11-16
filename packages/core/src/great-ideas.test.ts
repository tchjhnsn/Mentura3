import { describe, expect, it } from "vitest";
import { articleTitles } from "./articles";
import { IDEAS, TERMS, ideaById, ideasByCount, ideasIn, termById, termPrompts, worksDiscussing } from "./great-ideas";
import { workById } from "./topic-pages";
import { templateById } from "./works";

const passages = [...IDEAS.flatMap((i) => i.passages.map((x) => x.at)), ...TERMS.flatMap((t) => [...t.before.map((x) => x.at), ...t.stories.map((s) => s.at)])];

describe("great ideas and terms", () => {
  it("ids are unique and linked both ways", () => {
    expect(new Set(IDEAS.map((i) => i.id)).size).toBe(IDEAS.length);
    expect(new Set(TERMS.map((t) => t.id)).size).toBe(TERMS.length);
    for (const t of TERMS) expect(ideaById(t.idea)?.terms).toContain(t.id);
    for (const i of IDEAS) for (const id of i.terms) expect(termById(id)?.idea).toBe(i.id);
  });

  it("every quote names its translator or was written in English, and every idea starts on a work with a page", () => {
    for (const a of passages) if (a.words) expect(Boolean(a.tr || a.en), `${a.work} ${a.at}`).toBe(true);
    for (const i of IDEAS) expect(workById(i.start), i.id).toBeDefined();
    for (const i of IDEAS) for (const x of i.passages) expect(workById(x.at.work), `${i.id}: ${x.at.work}`).toBeDefined();
  });

  it("counts works, not passages, and finds ideas in a work", () => {
    const justice = ideaById("justice")!;
    expect(worksDiscussing(justice)).toBe(6);
    expect(ideasByCount()[0]).toBeDefined();
    expect(ideasIn("republic").map((i) => i.id)).toContain("justice");
    expect(ideasIn("nothing")).toEqual([]);
  });

  it("reads every article an idea or term names, and opens journal prompts that exist", () => {
    for (const t of TERMS) {
      for (const title of [t.originSource, ...t.articles.map((a) => a.title), ...t.cases.map((c) => c.article)]) expect(articleTitles()).toContain(title);
      const pr = termPrompts(t);
      expect(pr.own).toContain(t.name);
      for (const s of [...t.stories, ...t.cases]) expect(pr.spot(s)).toContain("Who acts");
    }
    expect(templateById("own-case")?.body).toContain("When it was done to me");
    expect(templateById("spot-it")).toBeDefined();
    expect(templateById("essay")).toBeDefined();
  });
});
