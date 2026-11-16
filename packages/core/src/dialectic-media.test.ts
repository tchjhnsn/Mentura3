import { describe, expect, it } from "vitest";
import { itemKey } from "./collections";
import { DIALECTIC_SHELVES } from "./dialectic-media";

describe("dialectic to watch and listen to", () => {
  it("has shelves of recordings, none twice", () => {
    const keys = DIALECTIC_SHELVES.flatMap((s) => s.items.map(itemKey));
    expect(DIALECTIC_SHELVES.every((s) => s.items.length >= 5)).toBe(true);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe("questions and their recordings", () => {
  it("gives every curated question recordings", async () => {
    const { DIALECTICS } = await import("./dialectics");
    const { QUESTION_MEDIA } = await import("./dialectic-media");
    for (const d of DIALECTICS) expect(QUESTION_MEDIA[d.id]?.length ?? 0).toBeGreaterThanOrEqual(3);
    expect(Object.keys(QUESTION_MEDIA).every((id) => DIALECTICS.some((d) => d.id === id))).toBe(true);
  });
});

describe("debate records", () => {
  it("records only debates on the shelves, each with a source and either sides or speakers", async () => {
    const { DEBATE_RECORDS, debateRecord } = await import("./dialectic-media");
    const urls = new Set(DIALECTIC_SHELVES.flatMap((s) => s.items.map((i) => (i.kind === "find" ? i.url : ""))));
    for (const [url, r] of Object.entries(DEBATE_RECORDS)) {
      expect(urls.has(url)).toBe(true);
      expect(r.source.url).toMatch(/^https:\/\//);
      expect(Boolean(r.for?.length && r.against?.length) || Boolean(r.speakers?.length)).toBe(true);
    }
    expect(Object.keys(DEBATE_RECORDS).length).toBeGreaterThanOrEqual(5);
    expect(debateRecord(null)).toBeNull();
  });
});

describe("old and new", () => {
  it("gives every item on the shelves an era", async () => {
    const { eraOf, OLD_ARGUMENTS } = await import("./dialectic-media");
    for (const i of [...DIALECTIC_SHELVES.flatMap((s) => s.items), ...OLD_ARGUMENTS]) expect(eraOf(i)).not.toBeNull();
  });
  it("alternates new and old, the same all week, different the next", async () => {
    const { mixOldNew, eraOf, OLD_ARGUMENTS } = await import("./dialectic-media");
    const pool = [...DIALECTIC_SHELVES[0]!.items, ...OLD_ARGUMENTS];
    const a = mixOldNew(pool, 40);
    expect(a.length).toBe(pool.length);
    const fresh = (i: (typeof a)[number]) => eraOf(i)?.era === "contemporary";
    for (let k = 0; k < 10; k++) expect(fresh(a[k]!)).toBe(k % 2 === 0);
    expect(mixOldNew(pool, 40).map(itemKey)).toEqual(a.map(itemKey));
    expect(mixOldNew(pool, 41).map(itemKey)).not.toEqual(a.map(itemKey));
    expect(fresh(mixOldNew(pool, 40, "old")[0]!)).toBe(false);
  });
  it("draws preferred eras about twice as often as the 20th century would be drawn at half", async () => {
    const { mixOldNew, eraOf } = await import("./dialectic-media");
    const old = DIALECTIC_SHELVES.flatMap((s) => s.items).filter((i) => eraOf(i)?.era !== "contemporary");
    let firstPreferred = 0;
    for (let w = 0; w < 400; w++) { const e = eraOf(mixOldNew(old, w, "old")[0]!)!.era; if (["ancient", "medieval", "renaissance", "founding"].includes(e)) firstPreferred++; }
    expect(firstPreferred / 400).toBeGreaterThan(0.6);
  });
  it("counts the week from Monday 5 January 2026", async () => {
    const { weekOf } = await import("./dialectic-media");
    expect(weekOf(new Date("2026-01-05T12:00:00Z"))).toBe(0);
    expect(weekOf(new Date("2026-01-12T00:00:00Z"))).toBe(1);
  });
});

describe("subjects", () => {
  it("gives every recording on the shelves at least one subject, and every question one", async () => {
    const { subjectsOf, QUESTION_SUBJECTS, OLD_ARGUMENTS } = await import("./dialectic-media");
    const { DIALECTICS } = await import("./dialectics");
    for (const i of [...DIALECTIC_SHELVES.flatMap((s) => s.items), ...OLD_ARGUMENTS]) expect(subjectsOf(i).length, i.title).toBeGreaterThan(0);
    for (const d of DIALECTICS) expect(QUESTION_SUBJECTS[d.id]?.length ?? 0, d.id).toBeGreaterThan(0);
  });
  it("reads a new debate's subject from its title", async () => {
    const { subjectsOf } = await import("./dialectic-media");
    const { yt } = await import("./collections");
    expect(subjectsOf(yt("debate", "abcdefghijk", "1 Atheist vs 25 Christians in a new room", "Jubilee"))).toContain("theology");
    expect(subjectsOf(yt("debate", "abcdefghijk", "1 Millionaire Boss vs 20 Gen Z Workers", "Jubilee"))).toContain("economics");
    expect(subjectsOf(yt("debate", "abcdefghijk", "Something else entirely", "Jubilee"))).toEqual([]);
  });
});
