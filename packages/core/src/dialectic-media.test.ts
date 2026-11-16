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
