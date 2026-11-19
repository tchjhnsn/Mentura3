import { describe, expect, it } from "vitest";
import { AREAS, CATALOG, becauseOf, itemOf, itemsIn, related } from "./interest-catalogue";

describe("interest catalogue", () => {
  it("has real things in every area, books and shows with a maker, all with tags, ids unique", () => {
    for (const a of AREAS) expect(itemsIn(a.id).length).toBeGreaterThanOrEqual(12);
    expect(new Set(CATALOG.map((c) => c.id)).size).toBe(CATALOG.length);
    for (const c of CATALOG) { if (c.area !== "music") expect(c.by).toBeTruthy(); expect(c.tags.length).toBeGreaterThan(0); }
  });

  it("finds related things in the same area, never the thing itself or one excluded", () => {
    const r = related("m-miles-davis", 3);
    expect(r.length).toBeGreaterThan(0);
    for (const x of r) { expect(x.area).toBe("music"); expect(x.id).not.toBe("m-miles-davis"); }
    expect(related("m-miles-davis", 3, new Set(r.map((x) => x.id))).map((x) => x.id)).not.toContain(r[0]!.id);
    expect(itemOf("nope")).toBeUndefined();
  });

  it("says what picks lead to, each once and never a pick", () => {
    const picks = ["m-miles-davis", "m-the-beatles", "m-johann-sebastian-bach"];
    const out = becauseOf(picks, 6);
    expect(out.length).toBeGreaterThan(0);
    expect(new Set(out.map((o) => o.item.id)).size).toBe(out.length);
    for (const o of out) { expect(picks).not.toContain(o.item.id); expect(picks).toContain(o.because.id); }
  });
});

describe("music genres and eras", () => {
  it("opens newest first, filters by genre and era, and every musician has an era and a genre", async () => {
    const { ERAS, GENRES, eraIndex, filterMusic, topicsOf } = await import("./interest-catalogue");
    const music = itemsIn("music");
    for (const m of music) {
      expect(eraIndex(m)).toBeLessThan(ERAS.length);
      expect(GENRES.some((g) => g.tags.some((t) => m.tags.includes(t)))).toBe(true);
      expect(topicsOf(m).some((t) => /\d0s|before/.test(t))).toBe(false);
    }
    const all = filterMusic(music, [], []);
    expect(eraIndex(all[0]!)).toBe(0);
    const hip = filterMusic(music, ["hip-hop"], ["2010s"]);
    expect(hip.length).toBeGreaterThan(2);
    for (const m of hip) { expect(m.tags).toContain("hip hop"); expect(m.tags).toContain("2010s"); }
  });
});
