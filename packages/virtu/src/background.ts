// virtu background check: decides the relations a background declaration
// states, under every permutation of every context. Each fill gives the
// colors it can show at a point; the field is every way those colors can be
// composited over the opaque base; each foreground must reach its minimum
// against the worst point of the field. Geometry is never read, so the result
// holds for any geometry. The design is docs/design/BACKGROUNDS.md.

import type { Analysis } from "./check.ts";
import { ANIMATED_COSTS, type Background, type BackgroundFill, type BackgroundPaint, type Finding, type Interpolation } from "./model.ts";
import { contrastOf, decode, encode, inGamut, linearP3ToLinearSrgb, linearSrgbToOklab, luminance, oklabToLinearSrgb, type LinearRgb } from "./oklch.ts";
import { backgroundFinding, perPermutation } from "./rules.ts";
import type { Resolution } from "./tokens.ts";

/** Points interpolated between each two neighbouring gradient stops, plus the stops themselves. */
export const GRADIENT_STEPS = 16;
/** Alphas sampled from 0 to a pattern's or noise's opacity, both ends included. */
export const ALPHA_STEPS = 8;
/** A field with more distinct points than this is not decided. */
export const FIELD_LIMIT = 200_000;

/** Encoded sRGB, extended: a Display P3 color outside sRGB has a channel below 0 or above 1. */
export type Rgb = readonly [number, number, number];
/** A color a fill can show at a point, with its alpha. */
export type Sample = { rgb: Rgb; alpha: number };

/** The screen a color is shown on: a P3 screen shows display-p3 colors, an sRGB screen their hex fallbacks. */
export type Screen = "p3" | "srgb";

// Color conversion between encoded sRGB and the interpolation spaces.

function toSpace(rgb: Rgb, space: Interpolation): [number, number, number] {
  if (space === "srgb") return [rgb[0], rgb[1], rgb[2]];
  const linear: LinearRgb = [decode(rgb[0]), decode(rgb[1]), decode(rgb[2])];
  if (space === "srgb-linear") return [linear[0], linear[1], linear[2]];
  const lab = linearSrgbToOklab(linear);
  if (space === "oklab") return lab;
  const c = Math.hypot(lab[1], lab[2]);
  const h = (Math.atan2(lab[2], lab[1]) * 180) / Math.PI;
  return [lab[0], c, h < 0 ? h + 360 : h];
}

function fromSpace(v: readonly [number, number, number], space: Interpolation): Rgb {
  if (space === "srgb") return v;
  let linear: LinearRgb;
  if (space === "srgb-linear") linear = v;
  else if (space === "oklab") linear = oklabToLinearSrgb(v[0], v[1], v[2]);
  else {
    const rad = (v[2] * Math.PI) / 180;
    linear = oklabToLinearSrgb(v[0], v[1] * Math.cos(rad), v[1] * Math.sin(rad));
  }
  return [encode(linear[0]), encode(linear[1]), encode(linear[2])];
}

/** Below this chroma a color's oklch hue is powerless, and the other stop's hue is used, as CSS Color 4 says. */
const ACHROMATIC = 1e-4;

/**
 * The colors a gradient shows between two stops, both included: interpolated
 * in the space with premultiplied alpha, as CSS interpolates gradients, and
 * the shorter hue arc in oklch.
 */
export function interpolate(a: Sample, b: Sample, space: Interpolation, steps = GRADIENT_STEPS): Sample[] {
  const va = toSpace(a.rgb, space);
  const vb = toSpace(b.rgb, space);
  const polar = space === "oklch";
  if (polar) {
    if (va[1] < ACHROMATIC && vb[1] >= ACHROMATIC) va[2] = vb[2];
    if (vb[1] < ACHROMATIC && va[1] >= ACHROMATIC) vb[2] = va[2];
    if (vb[2] - va[2] > 180) va[2] += 360;
    else if (va[2] - vb[2] > 180) vb[2] += 360;
  }
  // Premultiply. In a polar space the hue is not premultiplied.
  const pre = (v: [number, number, number], alpha: number): [number, number, number] =>
    polar ? [v[0] * alpha, v[1] * alpha, v[2]] : [v[0] * alpha, v[1] * alpha, v[2] * alpha];
  const pa = pre(va, a.alpha);
  const pb = pre(vb, b.alpha);
  const out: Sample[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const alpha = a.alpha + (b.alpha - a.alpha) * t;
    const mix = [0, 1, 2].map((k) => (pa[k] ?? 0) + ((pb[k] ?? 0) - (pa[k] ?? 0)) * t) as [number, number, number];
    if (alpha <= 0) {
      out.push({ rgb: a.rgb, alpha: 0 });
      continue;
    }
    const un: [number, number, number] = polar ? [mix[0] / alpha, mix[1] / alpha, mix[2] % 360] : [mix[0] / alpha, mix[1] / alpha, mix[2] / alpha];
    out.push({ rgb: fromSpace(un, space), alpha });
  }
  return out;
}

/** Source over, per encoded channel, onto an opaque color. */
export function over(dst: Rgb, src: Sample): Rgb {
  const a = src.alpha;
  return [src.rgb[0] * a + dst[0] * (1 - a), src.rgb[1] * a + dst[1] * (1 - a), src.rgb[2] * a + dst[2] * (1 - a)];
}

export function luminanceOf(rgb: Rgb): number {
  return luminance([decode(rgb[0]), decode(rgb[1]), decode(rgb[2])]);
}

function hexOf(rgb: Rgb): string {
  return `#${rgb.map((x) => Math.round(Math.min(1, Math.max(0, x)) * 255).toString(16).padStart(2, "0")).join("")}`;
}

/** The colors one fill can show at a point, given each token's color. The base fill excepted, a fill may also leave a point uncovered. */
export function samplesOf(fill: BackgroundFill, color: (path: string) => Sample): Sample[] {
  const at = (p: BackgroundPaint): Sample => {
    const c = color(p.color);
    return { rgb: c.rgb, alpha: c.alpha * p.opacity };
  };
  switch (fill.type) {
    case "solid":
      return [at(fill)];
    case "gradient": {
      const stops = fill.stops.map(at);
      const out: Sample[] = [];
      for (let i = 1; i < stops.length; i++) {
        const a = stops[i - 1];
        const b = stops[i];
        if (a === undefined || b === undefined) continue;
        out.push(...interpolate(a, b, fill.interpolation));
      }
      return out.map((s) => ({ rgb: s.rgb, alpha: s.alpha * fill.opacity }));
    }
    case "pattern":
    case "noise": {
      const c = at(fill);
      return Array.from({ length: ALPHA_STEPS + 1 }, (_, i) => ({ rgb: c.rgb, alpha: (c.alpha * i) / ALPHA_STEPS }));
    }
  }
}

const key = (rgb: Rgb): string => rgb.map((x) => Math.round(x * 1000)).join(",");

/**
 * Every color the composited background can show: the base, then each fill
 * above it composited over every point so far with every color it can show,
 * or leaving the point uncovered. Points closer than 1/1000 per channel are
 * merged. Null when the field grows past FIELD_LIMIT.
 */
export function field(base: Rgb, fills: Sample[][], limit = FIELD_LIMIT): Rgb[] | null {
  let points = new Map<string, Rgb>([[key(base), base]]);
  for (const samples of fills) {
    const next = new Map(points);
    for (const p of points.values()) {
      for (const s of samples) {
        if (s.alpha <= 0) continue;
        const c = over(p, s);
        const k = key(c);
        if (!next.has(k)) next.set(k, c);
      }
      if (next.size > limit) return null;
    }
    points = next;
  }
  return [...points.values()];
}

/** The lowest contrast of a foreground against any point, and the point. */
export function worst(fg: Rgb, points: Rgb[]): { ratio: number; at: Rgb } {
  const y = luminanceOf(fg);
  let best = { ratio: Infinity, at: points[0] ?? fg };
  for (const p of points) {
    const ratio = contrastOf(y, luminanceOf(p));
    if (ratio < best.ratio) best = { ratio, at: p };
  }
  return best;
}

/** Every token a background names, in order of first mention. */
export function tokensOf(bg: Background): string[] {
  const out = new Set<string>();
  for (const fill of bg.fills) {
    if (fill.type === "gradient") for (const s of fill.stops) out.add(s.color);
    else out.add(fill.color);
  }
  for (const f of bg.foreground) out.add(f.token);
  out.add(bg.fallback);
  return [...out];
}

/** Version 0's tiers: 0 for one solid fill, 2 for an SVG pattern, 3 for the animated classes, else 1. */
export function tierOf(bg: Background): 0 | 1 | 2 | 3 {
  if (ANIMATED_COSTS.includes(bg.cost)) return 3;
  if (bg.cost === "static-asset") return 2;
  if (bg.fills.length === 1 && bg.fills[0]?.type === "solid") return 0;
  return 1;
}

/** A token's color as a screen shows it, or why it cannot be known. */
export function colorOn(r: Resolution, path: string, screen: Screen): Sample | string {
  const t = r.tokens.get(path);
  if (t?.value?.type !== "color") return `${path} is not a color`;
  const c = t.value.color;
  if (c.space !== "srgb" && c.space !== "display-p3") return `${path} is in ${c.space}; version 0 decides srgb and display-p3 only`;
  if (c.components.some((x) => x === "none")) return `${path} has a "none" component`;
  const [r0 = 0, g0 = 0, b0 = 0] = c.components.map((x) => (x === "none" ? 0 : x));
  if (c.space === "srgb") return { rgb: [r0, g0, b0], alpha: c.alpha };
  const linear = linearP3ToLinearSrgb([decode(r0), decode(g0), decode(b0)]);
  if (screen === "srgb") {
    const hex = c.hex;
    if (hex !== undefined) {
      const byte = (i: number): number => parseInt(hex.slice(i, i + 2), 16) / 255;
      return { rgb: [byte(1), byte(3), byte(5)], alpha: c.alpha };
    }
    if (!inGamut(linear, 1e-6)) return `${path} lies outside sRGB and has no hex fallback, so an sRGB screen shows whatever the browser's gamut mapping makes of it`;
  }
  return { rgb: [encode(linear[0]), encode(linear[1]), encode(linear[2])], alpha: c.alpha };
}

/** Findings for one background under one permutation's tokens. */
export function checkUnder(bg: Background, r: Resolution): Finding[] {
  const out: Finding[] = [];
  const tokens = tokensOf(bg);

  // Every named token exists and is a color.
  for (const path of tokens) {
    const t = r.tokens.get(path);
    if (t === undefined) out.push(backgroundFinding("background.token-unknown", `${bg.name} names ${path}, which the system does not have`, [bg.name, path]));
    else if (t.value?.type !== "color") {
      const what = t.value === null ? "has no valid value" : `is a ${t.value.type} token, not a color`;
      out.push(backgroundFinding("background.token-type", `${bg.name} names ${path}, which ${what}`, [bg.name, path]));
    }
  }
  if (out.length > 0) return out;

  const wide = tokens.some((p) => {
    const v = r.tokens.get(p)?.value;
    return v?.type === "color" && v.color.space === "display-p3";
  });
  const screens: Screen[] = wide ? ["p3", "srgb"] : ["srgb"];

  for (const screen of screens) {
    const where = !wide ? "" : screen === "p3" ? " in display-p3" : " in the sRGB fallback";
    const colors = new Map<string, Sample>();
    const reasons = new Set<string>();
    for (const path of tokens) {
      const c = colorOn(r, path, screen);
      if (typeof c === "string") reasons.add(c);
      else colors.set(path, c);
    }
    for (const reason of reasons) {
      out.push(backgroundFinding("background.undecidable", `${bg.name}: contrast cannot be decided${where}: ${reason}`, [bg.name]));
    }
    if (reasons.size > 0) continue;
    const color = (path: string): Sample => colors.get(path) ?? { rgb: [0, 0, 0], alpha: 1 };

    const foregrounds: Array<{ token: string; min: number; rgb: Rgb }> = [];
    for (const f of bg.foreground) {
      const c = color(f.token);
      if (c.alpha < 1) {
        out.push(backgroundFinding("background.undecidable", `${bg.name}: ${f.token} has alpha ${c.alpha}, so its color as text depends on what lies beneath`, [bg.name, f.token]));
      } else foregrounds.push({ token: f.token, min: f.min, rgb: c.rgb });
    }

    // The fallback: opaque, and every foreground reaches its minimum on it.
    const fb = color(bg.fallback);
    if (fb.alpha < 1) {
      if (screen === screens[0]) out.push(backgroundFinding("background.fallback", `${bg.name}: the fallback ${bg.fallback} has alpha ${fb.alpha}; a fallback must be opaque`, [bg.name, bg.fallback]));
    } else {
      for (const f of foregrounds) {
        const ratio = contrastOf(luminanceOf(f.rgb), luminanceOf(fb.rgb));
        if (ratio < f.min) {
          out.push(
            backgroundFinding("background.fallback", `${bg.name}: ${f.token} on the fallback ${bg.fallback} is ${ratio.toFixed(2)}:1${where}, below ${f.min}:1`, [bg.name, f.token, bg.fallback]),
          );
        }
      }
    }

    // The base: an opaque solid. Without one the field has nothing to composite onto.
    const [baseFill, ...rest] = bg.fills;
    const base = baseFill?.type === "solid" ? samplesOf(baseFill, color)[0] : undefined;
    if (base === undefined || base.alpha < 1) {
      if (screen === screens[0]) {
        const why = base === undefined ? `is a ${baseFill?.type ?? "missing"} fill` : `has alpha ${base.alpha}`;
        out.push(backgroundFinding("background.base", `${bg.name}: the first fill ${why}; the base must be an opaque solid, because nothing is known about what lies beneath`, [bg.name]));
      }
      continue;
    }

    const points = field(base.rgb, rest.map((f) => samplesOf(f, color)));
    if (points === null) {
      out.push(backgroundFinding("background.undecidable", `${bg.name}: the fills can show more than ${FIELD_LIMIT} colors together, too many to sample${where}`, [bg.name]));
      continue;
    }
    for (const f of foregrounds) {
      const w = worst(f.rgb, points);
      if (w.ratio < f.min) {
        out.push(
          backgroundFinding(
            "background.contrast",
            `${bg.name}: ${f.token} reaches ${w.ratio.toFixed(2)}:1 against the worst sampled point (${hexOf(w.at)}) of the composited background${where}, below ${f.min}:1`,
            [bg.name, f.token],
          ),
        );
      }
    }
  }
  return out;
}

/** The cost rule, which no context changes. */
export function checkCost(bg: Background): Finding[] {
  if (ANIMATED_COSTS.includes(bg.cost)) {
    return [
      backgroundFinding(
        "background.cost",
        `${bg.name} is ${bg.cost}, an animated cost class; version 0 checks static backgrounds only, because an animated one needs a reduced-motion static frame and Tier 3 is not built`,
        [bg.name],
      ),
    ];
  }
  if (bg.fills.some((f) => f.type === "noise") && bg.cost !== "filter") {
    return [backgroundFinding("background.cost", `${bg.name} has a noise fill, which an SVG filter draws, so its cost class is filter, not ${bg.cost}`, [bg.name])];
  }
  return [];
}

/** Every finding for the backgrounds against the system, each with only the contexts it depends on. */
export function checkBackgrounds(a: Analysis, backgrounds: Background[]): Finding[] {
  const out: Finding[] = [];
  for (const bg of backgrounds) {
    out.push(...checkCost(bg));
    out.push(...perPermutation(a, (_p, r) => checkUnder(bg, r)));
  }
  return out;
}
