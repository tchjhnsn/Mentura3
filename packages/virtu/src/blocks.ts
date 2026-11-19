// virtu blocks: a shape and a frame for one block of a page, not the whole
// site. A site's look (looks.ts) sets its shape at :root and draws its
// ornaments on the slots a page marks; a block's look scopes the same CSS to
// one element instead, so a page can hold a round photo and a framed quote
// beside the site's own look. Nothing here decides a look: the CSS is
// shapeCss and ornamentRules, scoped. A host puts the scope class on a block's
// wrapper and the role classes on the surface inside it:
//
//   <div class="virtu-block-shape-round virtu-block-frame-holly-corners">
//     <img class="virtu-shape-card virtu-edge" ...>
//   </div>
//
// virtu-edge goes on the surface only when the shape has an edge
// (blockSurfaceClasses says which). The plan is Reflect's "Appearance, Virtu
// and the site editor", per-block shape and frame.

import type { LookCatalog } from "./looks.ts";
import type { ShapeDecl } from "./model.ts";
import { ornamentKeyframes, ornamentRules } from "./ornament.ts";
import { rolesOf, shapeCss } from "./shape.ts";

/** The class on a block's wrapper that gives it a shape from the catalog. */
export const blockShapeClass = (name: string): string => `virtu-block-shape-${name}`;
/** The class on a block's wrapper that draws an ornament from the catalog round it. */
export const blockFrameClass = (name: string): string => `virtu-block-frame-${name}`;

/** The role a block's surface takes from its shape. */
export const BLOCK_ROLE = "card";

/** The classes for a block's surface under a shape: its role's corner, and the edge when the shape has one. */
export function blockSurfaceClasses(decl: ShapeDecl | undefined): string[] {
  if (decl === undefined) return [];
  return [`virtu-shape-${BLOCK_ROLE}`, ...(decl.edge === null ? [] : ["virtu-edge"])];
}

/**
 * A shape's CSS scoped to one block: shapeCss with its :root properties set on
 * the wrapper and every role and edge rule matching only inside it. Where the
 * shape's corners are round, a corner-shape the site's own shape sets does not
 * reach into the block.
 */
export function blockShapeCss(decl: ShapeDecl): string {
  const scope = `.${blockShapeClass(decl.name)}`;
  let css = shapeCss(decl)
    .replace(/^\/\*[\s\S]*?\*\/\n\n/, "")
    .replace(/^:root \{/m, `${scope} {`)
    .replace(/\.virtu-(?:shape-[a-z]+|edge)(?![\w-])/g, (m) => `${scope} ${m}`);
  if (decl.corner === "round") {
    const shaped = rolesOf(decl).map((r) => `${scope} .virtu-shape-${r}`);
    if (shaped.length > 0) css += `\n@supports (corner-shape: round) {\n  ${shaped.join(",\n  ")} {\n    corner-shape: round;\n  }\n}\n`;
  }
  return css;
}

/** The CSS for the blocks of a page: each named shape and frame once, from the catalog. Names it does not have are left out. */
export function blockLookCss(catalog: LookCatalog, used: { shapes: readonly string[]; frames: readonly string[] }): string {
  const parts: string[] = [];
  for (const name of [...new Set(used.shapes)].sort()) {
    const decl = catalog.shapes.find((s) => s.name === name);
    if (decl !== undefined) parts.push(blockShapeCss(decl).trim());
  }
  const frames = [...new Set(used.frames)].sort();
  const keyframes = new Set<string>();
  for (const name of frames) {
    const o = catalog.ornaments.find((x) => x.decl.name === name);
    if (o === undefined) continue;
    parts.push(...ornamentRules(o.decl, o.svg, `.${blockFrameClass(name)}`));
    const k = ornamentKeyframes(o.decl);
    if (k !== null && !keyframes.has(k)) {
      keyframes.add(k);
      parts.push(k);
    }
  }
  return parts.length === 0 ? "" : `${parts.join("\n\n")}\n`;
}

/** The names a catalog has for blocks: its shapes, and its ornaments as frames. */
export function blockNames(catalog: LookCatalog): { shapes: string[]; frames: string[] } {
  return { shapes: catalog.shapes.map((s) => s.name), frames: catalog.ornaments.map((o) => o.decl.name) };
}
