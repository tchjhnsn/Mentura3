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
