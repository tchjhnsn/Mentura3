import { describe, expect, it } from "vitest";
import { matches } from "./prep-search";

describe("the prep panel's search", () => {
  it("finds text where every typed word starts a word", () => {
    expect(matches("fund use", "Use of funds")).toBe(true);
    expect(matches("burn rate", "What is your burn? Our rate is low")).toBe(true);
    expect(matches("burn moat", "What is your burn?")).toBe(false);
    expect(matches("  ", "anything")).toBe(false);
  });
});
