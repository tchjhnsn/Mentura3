import { describe, expect, it } from "vitest";
import { AREAS, CATALOG, becauseOf, itemOf, itemsIn, related } from "./interest-catalogue";

describe("interest catalogue", () => {
  it("has real things in every area, each with a maker and tags, ids unique", () => {
    for (const a of AREAS) expect(itemsIn(a.id).length).toBeGreaterThanOrEqual(12);
    expect(new Set(CATALOG.map((c) => c.id)).size).toBe(CATALOG.length);
    for (const c of CATALOG) { expect(c.by).toBeTruthy(); expect(c.tags.length).toBeGreaterThan(0); }
  });

  it("finds related things in the same area, never the thing itself or one excluded", () => {
    const r = related("p-dan-carlin-s-hardcore-history", 3);
    expect(r.length).toBeGreaterThan(0);
    for (const x of r) { expect(x.area).toBe("podcasts"); expect(x.id).not.toBe("p-dan-carlin-s-hardcore-history"); }
    expect(related("p-dan-carlin-s-hardcore-history", 3, new Set(r.map((x) => x.id))).map((x) => x.id)).not.toContain(r[0]!.id);
    expect(itemOf("nope")).toBeUndefined();
  });

  it("says what picks lead to, each once and never a pick", () => {
    const picks = ["b-pride-and-prejudice", "b-middlemarch", "b-emma"];
    const out = becauseOf(picks, 6);
    expect(out.length).toBeGreaterThan(0);
    expect(new Set(out.map((o) => o.item.id)).size).toBe(out.length);
    for (const o of out) { expect(picks).not.toContain(o.item.id); expect(picks).toContain(o.because.id); }
  });
});

