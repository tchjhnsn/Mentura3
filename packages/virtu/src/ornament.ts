// virtu ornament check: decides what an ornament declaration states. Its SVG
// (present, safe, within its budget), how deep the drawing reaches into the
// element against the gutter, and its animation's flash rate and pace are
// about the declaration's own values and file, decided once; its color token
// is decided under every permutation. It also holds the function that writes
// an item's CSS, which a season's CSS reuses with its own selector. The design
// is docs/design/ORNAMENTS.md.

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { cssName } from "./build.ts";
import type { Analysis } from "./check.ts";
import type { Finding, OrnamentDecl } from "./model.ts";
import { ornamentFinding, perPermutation } from "./rules.ts";
import type { Resolution } from "./tokens.ts";

/** WCAG 2.3.1: no more than three flashes in any one second. */
export const FLASH_LIMIT = 3;
/** The shortest cycle of a looping decoration before it pulls the eye from the content, in ms. */
export const PACE_MINIMUM = 1000;

/** The SVG beside a declaration, or null when it cannot be read. */
export function readAsset(decl: OrnamentDecl): string | null {
  try {
    return readFileSync(join(dirname(decl.path), decl.asset), "utf8");
  } catch {
    return null;
  }
}

/** Why an SVG is not safe to draw, or null. CSS draws an SVG as an image, which runs no script, but a file meant for that should not carry one. */
export function unsafeSvg(svg: string): string | null {
  const body = svg.replace(/^﻿?\s*(<\?xml[^>]*\?>\s*)?(<!--[\s\S]*?-->\s*)*/, "");
  if (!/^<svg[\s>]/.test(body)) return "it does not start with an <svg> element";
  if (/<script[\s/>]/i.test(svg)) return "it holds a <script>";
  if (/<foreignObject[\s/>]/i.test(svg)) return "it holds a <foreignObject>";
  if (/\son[a-z]+\s*=/i.test(svg)) return "it holds an event handler attribute";
  if (/<!ENTITY/i.test(svg)) return "it declares an entity";
  const refs = [...svg.matchAll(/(?:xlink:)?href\s*=\s*["']([^"']*)["']/gi)].map((m) => m[1] ?? "");
  const outside = refs.find((h) => !h.startsWith("#"));
  if (outside !== undefined) return `it references ${outside.length > 40 ? `${outside.slice(0, 40)}...` : outside}, outside itself`;
  if (/url\(\s*["']?(?!#)/i.test(svg)) return "it references a url() outside itself";
  return null;
}

/** How deep, in px, the drawing reaches inside the element's border box. */
export function insideDepth(decl: OrnamentDecl): number {
  if (decl.anchor === "along") return Math.max(0, decl.size / 2 - decl.outset);
  return Math.max(0, decl.size - decl.outset);
}

/** Flashes a second of a twinkle: one dip and return each cycle. */
export function flashesPerSecond(decl: OrnamentDecl): number {
  return decl.motion?.kind === "twinkle" ? 1000 / decl.motion.duration : 0;
}

/** The findings about the declaration's own values and its SVG. */
export function checkValues(decl: OrnamentDecl, svg: string | null = readAsset(decl)): Finding[] {
  const out: Finding[] = [];
  if (svg === null) out.push(ornamentFinding("ornament.asset", `${decl.name}: ${decl.asset} is not beside the declaration`, [decl.name, decl.asset]));
  else {
    const why = unsafeSvg(svg);
    if (why !== null) out.push(ornamentFinding("ornament.asset", `${decl.name}: ${decl.asset} is not a safe SVG: ${why}`, [decl.name, decl.asset]));
    const bytes = new TextEncoder().encode(svg).length;
    if (bytes > decl.budget) out.push(ornamentFinding("ornament.budget", `${decl.name}: ${decl.asset} has ${bytes} bytes, more than its budget of ${decl.budget}`, [decl.name, decl.asset]));
  }
  const depth = insideDepth(decl);
  if (depth > decl.gutter) out.push(ornamentFinding("ornament.covers", `${decl.name}: the drawing reaches ${depth}px inside the element, deeper than its ${decl.gutter}px gutter, so it can cover the content`, [decl.name]));
  const flashes = flashesPerSecond(decl);
  if (flashes > FLASH_LIMIT) out.push(ornamentFinding("ornament.flash", `${decl.name}: the twinkle flashes ${flashes.toFixed(2)} times a second, more than ${FLASH_LIMIT}`, [decl.name]));
  if (decl.motion !== null && decl.motion.duration < PACE_MINIMUM) out.push(ornamentFinding("ornament.pace", `${decl.name}: a ${decl.motion.kind} cycle of ${decl.motion.duration}ms is shorter than ${PACE_MINIMUM}ms`, [decl.name]));
  return out;
}

export function checkUnder(decl: OrnamentDecl, r: Resolution): Finding[] {
  if (decl.color === null) return [];
  const t = r.tokens.get(decl.color);
  if (t === undefined) return [ornamentFinding("ornament.token-unknown", `${decl.name}: color names ${decl.color}, which the system does not have`, [decl.name, decl.color])];
  if (t.type !== "color" || t.value === null) return [ornamentFinding("ornament.token-type", `${decl.name}: color names ${decl.color}, a ${t.type ?? "untyped"} token, not a color`, [decl.name, decl.color])];
  return [];
}

export function checkOrnaments(a: Analysis, decls: OrnamentDecl[]): Finding[] {
  const out: Finding[] = [];
  for (const decl of decls) {
    out.push(...checkValues(decl));
    out.push(...perPermutation(a, (_p, r) => checkUnder(decl, r)));
  }
  return out;
}

// What an implementation writes. The registry test compares each item's CSS
// with ornamentCss.

/** An SVG as a CSS url(), percent-encoding only what a quoted data URI needs. */
export function svgUrl(svg: string): string {
  const s = svg
    .replace(/^﻿?\s*<\?xml[^>]*\?>/, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\s+/g, " ")
    .replace(/> </g, "><")
    .trim()
    .replace(/"/g, "'")
    .replace(/%/g, "%25")
    .replace(/#/g, "%23")
    .replace(/</g, "%3C")
    .replace(/>/g, "%3E");
  return `url("data:image/svg+xml,${s}")`;
}

const n = (x: number): string => String(Number(x.toFixed(3)));

/** The keyframes name of an ornament's motion. */
export const keyframesName = (decl: OrnamentDecl): string => `virtu-${decl.name}-${decl.motion?.kind ?? "still"}`;

function keyframes(decl: OrnamentDecl): string | null {
  const m = decl.motion;
  if (m === null) return null;
  const frames: Record<typeof m.kind, string> = {
    bob: `  0%,\n  100% {\n    translate: 0 0;\n  }\n  50% {\n    translate: 0 -${n(Math.max(1, Math.round(decl.size * 0.08)))}px;\n  }`,
    sway: `  0%,\n  100% {\n    rotate: -3deg;\n  }\n  50% {\n    rotate: 3deg;\n  }`,
    twinkle: `  0%,\n  100% {\n    opacity: 1;\n  }\n  50% {\n    opacity: 0.55;\n  }`,
    travel: `  to {\n    offset-distance: 100%;\n  }`,
    spin: `  to {\n    rotate: 360deg;\n  }`,
  };
  return `@keyframes ${keyframesName(decl)} {\n${frames[m.kind]}\n}`;
}

/**
 * The rules that draw an ornament on the elements a selector matches, without
 * a header or keyframes: what ornamentCss writes for the ornament's own class,
 * and what a season writes under its own selector.
 */
export function ornamentRules(decl: OrnamentDecl, svg: string, selector: string): string[] {
  const block = (sel: string, lines: string[]): string => `${sel} {\n${lines.map((l) => `  ${l}`).join("\n")}\n}`;
  const after = `${selector}::after`;
  const out: string[] = [];
  // Zero specificity, so an element that is already positioned or padded keeps its own; its padding should then be at least the gutter.
  out.push(block(`:where(${selector})`, decl.gutter > 0 ? ["position: relative;", `padding: ${n(decl.gutter)}px;`] : ["position: relative;"]));
  const lines = ['content: "";', "position: absolute;", "pointer-events: none;", `--ornament-image: ${svgUrl(svg)};`];
  const s = `${n(decl.size)}px`;
  // The image layer: masked and painted in the color token, or the SVG's own colors.
  const paint = (positions: string[], size: string): string[] => {
    const urls = positions.map(() => "var(--ornament-image)").join(", ");
    if (decl.color === null) return [`background-image: ${urls};`, `background-position: ${positions.join(", ")};`, `background-size: ${size};`, "background-repeat: no-repeat;"];
    return [`background-color: var(${cssName(decl.color)});`, `mask-image: ${urls};`, `mask-position: ${positions.join(", ")};`, `mask-size: ${size};`, "mask-repeat: no-repeat;"];
  };
  const inset = `inset: ${decl.outset === 0 ? "0" : `-${n(decl.outset)}px`};`;
  if (decl.anchor === "corners") lines.push(inset, ...paint(["top left", "top right", "bottom left", "bottom right"], `${s} ${s}`));
  else if (decl.anchor === "edges" && decl.color === null) lines.push(inset, `border: ${s} solid transparent;`, `border-image: var(--ornament-image) ${n(decl.slice ?? 1)} / ${s} round;`);
  else if (decl.anchor === "edges") {
    // Four strips, one along each edge, each repeating the drawing a whole number of times.
    lines.push(inset, ...paint(["top", "bottom", "left", "right"], `${s} ${s}`).map((l) => (l === "mask-repeat: no-repeat;" ? "mask-repeat: round no-repeat, round no-repeat, no-repeat round, no-repeat round;" : l)));
  }
  else if (decl.anchor === "around") lines.push(inset, ...paint(["center"], "100% 100%"));
  else lines.push(`top: -${n(decl.size / 2)}px;`, `left: -${n(decl.size / 2)}px;`, `inline-size: ${s};`, `block-size: ${s};`, ...paint(["center"], "contain"));
  const m = decl.motion;
  const timing = m === null ? null : `${keyframesName(decl)} ${m.duration}ms ${m.kind === "travel" || m.kind === "spin" ? "linear" : "ease-in-out"} infinite`;
  if (m !== null && m.kind !== "travel") lines.push(`animation: ${timing};`);
  out.push(block(after, lines));
  if (m?.kind === "travel") {
    // Without offset-path: border-box the traveller rests at the top left corner.
    out.push(`@supports (offset-path: border-box) {\n  ${after} {\n    top: 0;\n    left: 0;\n    offset-path: border-box;\n    offset-anchor: center;\n    animation: ${timing};\n  }\n}`);
  }
  if (m !== null) {
    const still = decl.still === "hide" ? ["animation: none;", "display: none;"] : ["animation: none;"];
    out.push(`@media (prefers-reduced-motion: reduce) {\n  ${after} {\n${still.map((l) => `    ${l}`).join("\n")}\n  }\n}`);
    out.push(block(`:root[data-virtu-motion="paused"] ${after}`, ["animation-play-state: paused;"]));
  }
  return out;
}

/** The whole CSS file of an ornament item: the rules for its class, virtu-ornament-<name>, and its keyframes. */
export function ornamentCss(decl: OrnamentDecl, svg: string): string {
  const header = [
    "/*",
    ` * ${decl.name}: a Virtu ornament. Declaration: ${decl.name}.ornament.json, drawing: ${decl.asset}.`,
    ` * Put virtu-ornament-${decl.name} on an element to draw it ${decl.anchor === "corners" ? "at its corners" : decl.anchor === "edges" ? "as a frame along its edges" : decl.anchor === "along" ? "travelling round its border" : "around it"}.`,
    " * The class draws in the element's ::after and makes the element a containing block",
  ];
  if (decl.gutter > 0) header.push(` * with ${n(decl.gutter)}px of padding, so the drawing stays off the content. An element's own`, ` * position and padding win, so keep its padding at least ${n(decl.gutter)}px.`);
  else header.push(" * unless it is already positioned.");
  if (decl.motion !== null) header.push(` * The ${decl.motion.kind} ${decl.still === "hide" ? "and the drawing stop" : "stops"} for reduced motion, and pauses while the root has data-virtu-motion="paused".`);
  header.push(" */");
  const parts = [header.join("\n"), ...ornamentRules(decl, svg, `.virtu-ornament-${decl.name}`)];
  const k = keyframes(decl);
  if (k !== null) parts.push(k);
  return `${parts.join("\n\n")}\n`;
}

/** The keyframes an ornament's rules use, for a file that writes ornamentRules itself. */
export function ornamentKeyframes(decl: OrnamentDecl): string | null {
  return keyframes(decl);
}
