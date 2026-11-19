import { describe, expect, it } from "vitest";
import { blockNames } from "@reflect/virtu/blocks";
import { BLOCK_FRAMES, BLOCK_SHAPES } from "@reflect/core/site-page";
import { blockCss, blockSurface, CATALOG, EDGED_SHAPES } from "./site-design";

describe("a block's shape and frame on a site page", () => {
  it("offers exactly the catalog's shapes and ornaments, so the parser refuses what the renderer cannot draw", () => {
    expect([...BLOCK_SHAPES]).toEqual(blockNames(CATALOG).shapes);
    expect([...BLOCK_FRAMES]).toEqual(blockNames(CATALOG).frames);
  });

  it("gives a surface its corner, and the edge only where the shape has one", () => {
    expect(blockSurface("round")).toEqual(["virtu-shape-card", "virtu-edge"]);
    expect(blockSurface("soft")).toEqual(["virtu-shape-card"]);
    expect(blockSurface("star")).toEqual([]);
    expect(EDGED_SHAPES).toEqual(["pill", "round", "sharp"]);
  });

  it("writes the CSS for what a page names", () => {
    const css = blockCss({ shapes: ["round"], frames: ["holly-corners"] });
    expect(css).toContain(".virtu-block-shape-round {");
    expect(css).toContain(".virtu-block-frame-holly-corners::after");
  });
});
