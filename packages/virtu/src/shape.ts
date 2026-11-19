// virtu shape check: decides what a shape declaration states. The radius
// roles, their order, and how corners nest are about the declaration's own
// values, decided once; the edge's tokens and its contrast against the surface
// it sits on are decided under every permutation of every context. It also
// holds the function that writes an item's CSS for a declaration, so a test
// can hold the two together. The design is docs/design/SHAPE.md.

import { colorOn, interpolate, luminanceOf, type Rgb, type Sample, type Screen } from "./background.ts";
import { cssName } from "./build.ts";
import type { Analysis } from "./check.ts";
import { nestedRadius } from "./elevation.ts";
import { SHAPE_REQUIRED_ROLES, SHAPE_ROLES, type Finding, type ShapeDecl, type ShapeRadius, type ShapeRole } from "./model.ts";
import { contrastOf } from "./oklch.ts";
import { perPermutation, shapeFinding } from "./rules.ts";
import type { Resolution } from "./tokens.ts";

/** The least contrast a boundary edge needs against the surface it sits on (WCAG 1.4.11). */
export const EDGE_CONTRAST = 3;
/** The shortest turn of a spin edge, in ms. */
export const SPIN_MINIMUM = 1000;
/** How far a nested radius may be from the concentric one, in px. */
export const NEST_TOLERANCE = 1;

const px = (r: ShapeRadius): string => (r === "full" ? "full" : `${r}px`);

/** The color tokens an edge names: its color, the surface it sits on, then its paint's colors. */
export function edgeTokens(decl: ShapeDecl): string[] {
  const e = decl.edge;
  if (e === null) return [];
  return [...new Set([e.color, e.on, ...(e.paint.kind === "solid" ? [] : e.paint.colors)])];
}

/** The findings about the declaration's own values. */
export function checkValues(decl: ShapeDecl): Finding[] {
  const out: Finding[] = [];
  const missing = SHAPE_REQUIRED_ROLES.filter((r) => decl.radius[r] === undefined);
  if (missing.length > 0) out.push(shapeFinding("shape.roles", `${decl.name}: gives no radius to ${missing.join(", ")}`, [decl.name, ...missing]));
  // control, card, dialog grow in size, so their radii should not shrink; full is exempt, since it follows the element's size.
  const ladder: ShapeRole[] = ["control", "card", "dialog"];
  for (let i = 1; i < ladder.length; i++) {
    const lo = ladder[i - 1];
    const hi = ladder[i];
    if (lo === undefined || hi === undefined) continue;
    const a = decl.radius[lo];
    const b = decl.radius[hi];
    if (typeof a === "number" && typeof b === "number" && b < a) out.push(shapeFinding("shape.order", `${decl.name}: ${hi} has radius ${b}px, smaller than ${lo}'s ${a}px`, [decl.name, lo, hi]));
  }
  for (const n of decl.nest) {
    const outer = decl.radius[n.outer];
    const inner = decl.radius[n.inner];
    if (outer === undefined || inner === undefined) continue;
    if (outer === "full" || inner === "full") {
      if (outer !== inner) out.push(shapeFinding("shape.nest", `${decl.name}: ${n.inner} (${px(inner)}) inside ${n.outer} (${px(outer)}) cannot be concentric when only one of them is full`, [decl.name, n.outer, n.inner]));
      continue;
    }
    const want = nestedRadius(outer, n.inset, decl.edge?.width ?? 0);
    if (Math.abs(inner - want) > NEST_TOLERANCE) {
      out.push(shapeFinding("shape.nest", `${decl.name}: ${n.inner} inside ${n.outer} at inset ${n.inset}px has radius ${inner}px, but a concentric corner is ${want}px (${outer}px less the inset${decl.edge === null ? "" : ` and the ${decl.edge.width}px edge`})`, [decl.name, n.outer, n.inner]));
    }
  }
  const p = decl.edge?.paint;
  if (p?.kind === "spin" && p.duration < SPIN_MINIMUM) out.push(shapeFinding("shape.motion", `${decl.name}: the edge turns once in ${p.duration}ms, faster than once in ${SPIN_MINIMUM}ms`, [decl.name]));
  return out;
}

/** Findings for the edge's tokens and contrast under one permutation's tokens. */
export function checkUnder(decl: ShapeDecl, r: Resolution): Finding[] {
  const e = decl.edge;
  if (e === null) return [];
  const out: Finding[] = [];
  const tokens = edgeTokens(decl);
  for (const t of tokens) {
    const tok = r.tokens.get(t);
    if (tok === undefined) out.push(shapeFinding("shape.token-unknown", `${decl.name}: the edge names ${t}, which the system does not have`, [decl.name, t]));
    else if (tok.type !== "color" || tok.value === null) out.push(shapeFinding("shape.token-type", `${decl.name}: the edge names ${t}, a ${tok.type ?? "untyped"} token, not a color`, [decl.name, t]));
  }
  if (out.length > 0 || !e.boundary || e.style === "none" || e.width === 0) return out;
  const wide = tokens.some((t) => {
    const v = r.tokens.get(t)?.value;
    return v?.type === "color" && v.color.space === "display-p3";
  });
  const screens: Screen[] = wide ? ["p3", "srgb"] : ["srgb"];
  for (const screen of screens) {
    const where = !wide ? "" : screen === "p3" ? " in display-p3" : " in the sRGB fallback";
    const got = new Map<string, Sample>();
    let ok = true;
    for (const t of tokens) {
      const c = colorOn(r, t, screen);
      if (typeof c === "string") {
        out.push(shapeFinding("shape.undecidable", `${decl.name}: contrast cannot be decided${where}: ${c}`, [decl.name, t]));
        ok = false;
      } else if (c.alpha < 1) {
        out.push(shapeFinding("shape.undecidable", `${decl.name}: ${t} has alpha ${c.alpha}, so its color depends on what lies beneath`, [decl.name, t]));
        ok = false;
      } else got.set(t, c);
    }
    if (!ok) continue;
    const sample = (t: string): Sample => got.get(t) ?? { rgb: [0, 0, 0], alpha: 1 };
    const bg = luminanceOf(sample(e.on).rgb);
    // Every color the edge shows: the solid color, or each stop and the colors a gradient passes through between them.
    const stops = e.paint.kind === "solid" ? [e.color] : e.paint.kind === "spin" ? [...e.paint.colors, e.paint.colors[0] ?? e.color] : e.paint.colors;
    let worst = { ratio: Infinity, at: [0, 0, 0] as Rgb };
    const consider = (rgb: Rgb): void => {
      const ratio = contrastOf(luminanceOf(rgb), bg);
      if (ratio < worst.ratio) worst = { ratio, at: rgb };
    };
    // The solid color is also the fallback of a gradient or spin, so it must pass too.
    consider(sample(e.color).rgb);
    for (let i = 1; i < stops.length; i++) {
      for (const s of interpolate(sample(stops[i - 1] ?? e.color), sample(stops[i] ?? e.color), "oklab")) consider(s.rgb);
    }
    if (worst.ratio < EDGE_CONTRAST) {
      const what = e.paint.kind === "solid" ? e.color : `its ${e.paint.kind} paint (${e.paint.colors.join(", ")})`;
      out.push(shapeFinding("shape.edge-contrast", `${decl.name}: the edge ${what} reaches only ${worst.ratio.toFixed(2)}:1 against ${e.on}${where}, below ${EDGE_CONTRAST}:1`, [decl.name, e.on]));
    }
  }
  return out;
}

export function checkShapes(a: Analysis, decls: ShapeDecl[]): Finding[] {
  const out: Finding[] = [];
  for (const decl of decls) {
    out.push(...checkValues(decl));
    out.push(...perPermutation(a, (_p, r) => checkUnder(decl, r)));
  }
  return out;
}

// What an implementation writes. The registry test compares each item's CSS
// with shapeCss.

/** The custom property a role's radius sets. */
export const radiusProperty = (role: ShapeRole): string => `--shape-radius-${role}`;

/** A radius as CSS: px, or a large length that CSS clamps to half the shorter side. */
export const radiusValue = (r: ShapeRadius): string => (r === "full" ? "9999px" : `${Number(r.toFixed(3))}px`);

/** The roles a declaration gives a radius, in SHAPE_ROLES order. */
export function rolesOf(decl: ShapeDecl): ShapeRole[] {
  return SHAPE_ROLES.filter((r) => decl.radius[r] !== undefined);
}

/**
 * The whole CSS file of a shape item: each role's radius at :root, a class per
 * role, the corner shape where the browser has corner-shape, and the edge
 * class, which turns only while motion is allowed.
 */
export function shapeCss(decl: ShapeDecl): string {
  const block = (selector: string, lines: string[]): string => `${selector} {\n${lines.map((l) => `  ${l}`).join("\n")}\n}`;
  const roles = rolesOf(decl);
  const header = [
    "/*",
    ` * ${decl.name}: a Virtu shape. Declaration: ${decl.name}.shape.json.`,
    " * It sets --shape-radius-<role> at :root; put virtu-shape-<role> on an element to give it that",
    ` * role's corner (roles: ${roles.join(", ")}).`,
  ];
  if (decl.corner !== "round") header.push(` * Corners are ${decl.corner} where the browser supports corner-shape, and round elsewhere.`);
  if (decl.edge !== null) {
    header.push(" * Put virtu-edge on an element to give it the shape's edge.");
    if (decl.edge.paint.kind !== "solid") header.push(` * A ${decl.edge.paint.kind} edge paints the surface it sits on inside the border, so the element shows that surface.`);
    if (decl.edge.paint.kind === "spin") header.push(' * It stops turning for reduced motion, and while the root has data-virtu-motion="paused".');
  }
  header.push(" */");
  const parts = [header.join("\n")];
  const rootLines = roles.map((r) => `${radiusProperty(r)}: ${radiusValue(decl.radius[r] ?? 0)};`);
  if (decl.edge !== null) rootLines.push(`--shape-edge-width: ${decl.edge.width}px;`);
  parts.push(block(":root", rootLines));
  for (const r of roles) parts.push(block(`.virtu-shape-${r}`, [`border-radius: var(${radiusProperty(r)});`]));
  if (decl.corner !== "round") {
    const shaped = roles.filter((r) => decl.radius[r] !== "full").map((r) => `.virtu-shape-${r}`);
    if (shaped.length > 0) parts.push(`@supports (corner-shape: ${decl.corner}) {\n  ${shaped.join(",\n  ")} {\n    corner-shape: ${decl.corner};\n  }\n}`);
  }
  const e = decl.edge;
  if (e !== null) {
    const v = (t: string): string => `var(${cssName(t)})`;
    if (e.paint.kind === "solid") {
      parts.push(block(".virtu-edge", [`border: var(--shape-edge-width) ${e.style} ${v(e.color)};`]));
    } else {
      const fill = `linear-gradient(${v(e.on)}, ${v(e.on)}) padding-box`;
      const paint = e.paint.kind === "gradient"
        ? `linear-gradient(in oklab ${e.paint.angle}deg, ${e.paint.colors.map(v).join(", ")}) border-box`
        : `conic-gradient(in oklab from var(--shape-edge-angle), ${[...e.paint.colors, e.paint.colors[0] ?? e.color].map(v).join(", ")}) border-box`;
      if (e.paint.kind === "spin") parts.push(`@property --shape-edge-angle {\n  syntax: "<angle>";\n  inherits: false;\n  initial-value: 0deg;\n}`);
      // The solid color is the fallback: a browser without oklab gradients keeps it.
      parts.push(block(".virtu-edge", [`border: var(--shape-edge-width) solid ${v(e.color)};`]));
      const inner = ["border-color: transparent;", `background: ${fill}, ${paint};`];
      if (e.paint.kind === "spin") inner.push(`animation: virtu-edge-spin ${e.paint.duration}ms linear infinite;`);
      parts.push(`@supports (background: linear-gradient(in oklab 0deg, red, blue)) {\n  .virtu-edge {\n${inner.map((l) => `    ${l}`).join("\n")}\n  }\n}`);
      if (e.paint.kind === "spin") {
        parts.push(`@keyframes virtu-edge-spin {\n  to {\n    --shape-edge-angle: 360deg;\n  }\n}`);
        parts.push(`@media (prefers-reduced-motion: reduce) {\n  .virtu-edge {\n    animation: none;\n  }\n}`);
        parts.push(block(':root[data-virtu-motion="paused"] .virtu-edge', ["animation-play-state: paused;"]));
      }
    }
  }
  return `${parts.join("\n\n")}\n`;
}
