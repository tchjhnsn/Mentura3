import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { blockFrameClass, blockLookCss, blockNames, blockShapeClass, blockShapeCss, blockSurfaceClasses } from "./src/blocks.ts";
import type { LookCatalog } from "./src/looks.ts";
import { ornamentRules } from "./src/ornament.ts";

const CATALOG = JSON.parse(readFileSync(new URL("./site/looks.loaded.json", import.meta.url), "utf8")) as LookCatalog;
const shape = (n: string) => CATALOG.shapes.find((s) => s.name === n)!;

describe("a block's shape and frame", () => {
  it("scopes a shape's properties and rules to the block", () => {
    const css = blockShapeCss(shape("round"));
    expect(css).not.toMatch(/:root \{/);
    expect(css).toMatch(/^\.virtu-block-shape-round \{[^}]*--shape-radius-card: 18px;/);
    expect(css).toContain(".virtu-block-shape-round .virtu-shape-card {\n  border-radius: var(--shape-radius-card);");
    expect(css).toContain(".virtu-block-shape-round .virtu-edge {");
    // Every rule that matches an element is inside the block.
    for (const sel of css.match(/^[^@\s{}][^{}]*(?=\s*\{)/gm) ?? []) if (!sel.startsWith("@") && !sel.startsWith(":root[")) expect(sel).toMatch(/^\.virtu-block-shape-round/);
    // The keyframes name is left alone.
    expect(css).not.toContain("virtu-block-shape-round virtu-edge-spin");
  });

  it("keeps a round block round under a squircle site, and a squircle block's own corner", () => {
    expect(blockShapeCss(shape("soft"))).toContain("corner-shape: round;");
    expect(blockShapeCss(shape("squircle"))).toContain("@supports (corner-shape: squircle) {\n  .virtu-block-shape-squircle .virtu-shape-control");
  });

  it("puts the edge on the surface only when the shape has one", () => {
    expect(blockSurfaceClasses(shape("round"))).toEqual(["virtu-shape-card", "virtu-edge"]);
    expect(blockSurfaceClasses(shape("soft"))).toEqual(["virtu-shape-card"]);
    expect(blockSurfaceClasses(undefined)).toEqual([]);
  });

  it("draws a frame with the ornament's own rules under the block's class", () => {
    const holly = CATALOG.ornaments.find((o) => o.decl.name === "holly-corners")!;
    const css = blockLookCss(CATALOG, { shapes: [], frames: ["holly-corners"] });
    for (const rule of ornamentRules(holly.decl, holly.svg, `.${blockFrameClass("holly-corners")}`)) expect(css).toContain(rule);
    expect(css).toContain("@keyframes virtu-holly-corners-sway");
  });

  it("writes each name once and leaves out names the catalog does not have", () => {
    const css = blockLookCss(CATALOG, { shapes: ["round", "round", "star"], frames: ["holly-corners", "holly-corners", "nope"] });
    expect(css.split(`.${blockShapeClass("round")} {`).length).toBe(2);
    expect(css.split("@keyframes virtu-holly-corners-sway").length).toBe(2);
    expect(css).not.toContain("star");
    expect(css).not.toContain("nope");
    expect(blockLookCss(CATALOG, { shapes: [], frames: [] })).toBe("");
  });

  it("names the catalog's shapes and ornaments", () => {
    expect(blockNames(CATALOG)).toEqual({ shapes: ["pill", "round", "sharp", "soft", "squircle"], frames: ["dotted-frame", "halo-around", "holly-corners", "leaf-corners", "snow-corners", "spark-traveller", "sprig-corners"] });
  });
});
