import { describe, expect, it } from "vitest";
import { verdictBody } from "./verdict";

describe("a verdict note", () => {
  it("names what it is about first, as Notes reads it, then the motion, the side and why", () => {
    const b = verdictBody({ title: "Baldwin and Buckley", motion: "The motion.", side: "For the motion", why: "Because." });
    expect(b).toBe("> Baldwin and Buckley\n\nThe motion: The motion.\n\nWon me over: For the motion\n\nBecause.");
    expect(/^>\s*(.+)\n/.exec(b)?.[1]).toBe("Baldwin and Buckley");
  });
  it("leaves out what was not given", () => {
    expect(verdictBody({ title: "X", motion: null, side: "", why: "Only why." })).toBe("> X\n\nOnly why.");
  });
});
