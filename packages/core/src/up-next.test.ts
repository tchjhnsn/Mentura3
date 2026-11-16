import { describe, expect, it } from "vitest";
import { upNext } from "./up-next";

describe("up next", () => {
  it("gives the recordings after this one on its shelf, never itself, none twice", () => {
    const url = "https://www.youtube.com/watch?v=oFeoS41xe7w";
    const next = upNext({ url });
    expect(next.length).toBeGreaterThan(3);
    expect(next.some((i) => i.kind === "find" && i.url === url)).toBe(false);
    expect(new Set(next.map((i) => i.title)).size).toBe(next.length);
  });
  it("gives nothing for a recording on no shelf", () => {
    expect(upNext({ url: "https://example.com/x", title: "Nothing like it" })).toEqual([]);
  });
});
