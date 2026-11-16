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
