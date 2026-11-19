// The relation-kind registry. Each kind is a predicate the validator knows how
// to decide over resolved tokens. A relation holds only if it holds under
// every permutation, so every kind runs once per permutation and its findings
// carry the contexts they depend on.

import type { Analysis } from "./check.ts";
import type { Finding, Permutation, Relation, RelationKind } from "./model.ts";
import { finding, perPermutation } from "./rules.ts";
import { decode, inGamut, linearP3ToLinearSrgb, luminance, luminanceP3 } from "./oklch.ts";
import { selectTokens, type Color, type Resolution, type ResolvedToken } from "./tokens.ts";

type KindCheck<K extends RelationKind> = (relation: Extract<Relation, { kind: K }>, r: Resolution, a: Analysis, p: Permutation) => Finding[];

export const RELATION_KINDS: { [K in RelationKind]: KindCheck<K> } = {
  contrast(rel, r) {
    const out: Finding[] = [];
    const fg = select(rel, rel.foreground, r, out);
    const bg = select(rel, rel.background, r, out);
    for (const f of fg) {
      for (const b of bg) {
        const why = undecidable(f) ?? undecidable(b);
        if (why !== null) {
          out.push(finding("L2.contrast-undecidable", `${rel.id}: contrast of ${f.path} on ${b.path} cannot be decided: ${why}`, [rel.id, f.path, b.path]));
          continue;
        }
        const fc = colorOf(f);
        const bc = colorOf(b);
        const ratio = contrastRatio(fc, bc);
        const wide = fc.space !== "srgb" || bc.space !== "srgb";
        if (ratio < rel.min) {
          const where = wide ? " in display-p3" : "";
          out.push(finding("L2.contrast", `${rel.id}: ${f.path} on ${b.path} is ${ratio.toFixed(2)}:1${where}, below ${rel.min}:1`, [rel.id, f.path, b.path]));
        }
        if (!wide) continue;
        // A screen that cannot show P3 shows each color's sRGB form, so the pair must hold there too.
        const fs = fallbackOf(f);
        const bs = fallbackOf(b);
        if (typeof fs === "string" || typeof bs === "string") {
          const reason = typeof fs === "string" ? fs : typeof bs === "string" ? bs : "";
          out.push(finding("L2.contrast-undecidable", `${rel.id}: contrast of ${f.path} on ${b.path} in the sRGB fallback cannot be decided: ${reason}`, [rel.id, f.path, b.path]));
          continue;
        }
        const fallback = contrastRatio(fs, bs);
        if (fallback < rel.min) {
          out.push(finding("L2.contrast", `${rel.id}: ${f.path} on ${b.path} is ${fallback.toFixed(2)}:1 in the sRGB fallback, below ${rel.min}:1`, [rel.id, f.path, b.path]));
        }
      }
    }
    return out;
  },

  ratio(rel, r) {
    const out: Finding[] = [];
    const tokens = select(rel, rel.tokens, r, out);
    if (tokens.length < 2) return out;
    const sizes: Array<{ value: number; unit: string }> = [];
    for (const t of tokens) {
      const s = sizeOf(t);
      if (s === null) {
        out.push(finding("L2.ratio-units", `${rel.id}: ${t.path} is not a dimension or number, so it has no size to compare`, [rel.id, t.path]));
        return out;
      }
      sizes.push(s);
    }
    const units = [...new Set(sizes.map((s) => s.unit || "number"))];
    if (units.length > 1) {
      out.push(finding("L2.ratio-units", `${rel.id}: entries mix ${units.join(" and ")}, so their ratio is not defined`, [rel.id]));
      return out;
    }
    for (let i = 1; i < tokens.length; i++) {
      const prev = sizes[i - 1];
      const cur = sizes[i];
      const prevToken = tokens[i - 1];
      const curToken = tokens[i];
      if (!prev || !cur || !prevToken || !curToken) continue;
      if (prev.value === 0) {
        out.push(finding("L2.ratio", `${rel.id}: ${prevToken.path} is 0, so ${curToken.path} cannot be a ratio of it`, [rel.id, prevToken.path, curToken.path]));
        continue;
      }
      const actual = offRatio(prev.value, cur.value, rel.ratio, rel.tolerance);
      if (actual !== null) {
        out.push(
          finding(
            "L2.ratio",
            `${rel.id}: ${curToken.path} is ${round(actual)} times ${prevToken.path}, expected ${rel.ratio} within ${rel.tolerance}`,
            [rel.id, prevToken.path, curToken.path],
          ),
        );
      }
    }
    return out;
  },

  count(rel, r, a) {
    const enumerated = a.loaded.vocabularies[rel.group];
    if (enumerated) {
      const n = Object.keys(enumerated.members).length;
      return n > rel.max ? [finding("L2.count", `${rel.id}: ${rel.group} has ${n} entries, more than ${rel.max}`, [rel.id, rel.group])] : [];
    }
    const out: Finding[] = [];
    const n = select(rel, [rel.group], r, out).length;
    if (n > rel.max) out.push(finding("L2.count", `${rel.id}: ${rel.group} has ${n} entries, more than ${rel.max}`, [rel.id, rel.group]));
    return out;
  },
};

/**
 * The ratio relation's arithmetic: cur over prev when it is more than the
 * tolerance away from the stated ratio, else null. prev must not be 0. A type
 * declaration's scale uses it too (type.ts).
 */
export function offRatio(prev: number, cur: number, ratio: number, tolerance: number): number | null {
  const actual = cur / prev;
  return Math.abs(actual - ratio) > tolerance + 1e-9 ? actual : null;
}

/** Expands selectors in order, without repeats. A selector that matches nothing is an error. */
function select(rel: Relation, selectors: string[], r: Resolution, out: Finding[]): ResolvedToken[] {
  const seen = new Set<string>();
  const tokens: ResolvedToken[] = [];
  for (const selector of selectors) {
    const matched = selectTokens(r, selector);
    if (matched.length === 0) {
      out.push(finding("L2.selector-empty", `${rel.id}: ${selector} matches no token, and a rule over nothing is never false`, [rel.id, selector]));
    }
    for (const t of matched) {
      if (!seen.has(t.path)) {
        seen.add(t.path);
        tokens.push(t);
      }
    }
  }
  return tokens;
}

function selectorsOf(rel: Relation): string[] {
  switch (rel.kind) {
    case "contrast":
      return [...rel.foreground, ...rel.background];
    case "ratio":
      return rel.tokens;
    case "count":
      return [rel.group];
  }
}

/**
 * The domains a relation's entries belong to. One domain means the relation
 * is within a domain; two or more means it is across domains. Not declared:
 * read from the entries, so the fact has one owner.
 */
export function relationDomains(rel: Relation, a: Analysis): string[] {
  if (rel.kind === "count" && a.loaded.vocabularies[rel.group]) {
    return [a.loaded.vocabularies[rel.group]?.domain ?? ""].filter(Boolean);
  }
  const domains = new Set<string>();
  for (const selector of selectorsOf(rel)) {
    for (const path of a.allPaths) {
      if (path !== selector && !path.startsWith(`${selector}.`)) continue;
      const d = a.domainOfToken(path);
      if (d !== null) domains.add(d);
    }
  }
  return [...domains];
}

export function relationScope(rel: Relation, a: Analysis): "within" | "across" | "unknown" {
  const n = relationDomains(rel, a).length;
  return n === 0 ? "unknown" : n === 1 ? "within" : "across";
}

export function checkRelations(a: Analysis): Finding[] {
  const out: Finding[] = [];
  for (const rel of a.loaded.relations) {
    // Every entry a relation names must be in a governed vocabulary, or its scope cannot be read.
    if (!(rel.kind === "count" && a.loaded.vocabularies[rel.group])) {
      const outside = new Set<string>();
      for (const selector of selectorsOf(rel)) {
        for (const path of a.allPaths) {
          if ((path === selector || path.startsWith(`${selector}.`)) && a.domainOfToken(path) === null) outside.add(path);
        }
      }
      if (outside.size > 0) {
        const list = [...outside];
        out.push(finding("L2.selector-ungoverned", `${rel.id} names ${list.join(", ")}, which no governed domain's vocabulary holds`, [rel.id, ...list]));
      }
    }
    out.push(...perPermutation(a, (p, r) => runKind(rel, r, a, p)));
  }
  return out;
}

function runKind(rel: Relation, r: Resolution, a: Analysis, p: Permutation): Finding[] {
  switch (rel.kind) {
    case "contrast":
      return RELATION_KINDS.contrast(rel, r, a, p);
    case "ratio":
      return RELATION_KINDS.ratio(rel, r, a, p);
    case "count":
      return RELATION_KINDS.count(rel, r, a, p);
  }
}

// Contrast: WCAG 2 relative luminance, for srgb and display-p3 colors.

function undecidable(t: ResolvedToken): string | null {
  if (t.value === null) return `${t.path} has no valid value`;
  if (t.value.type !== "color") return `${t.path} is a ${t.value.type} token, not a color`;
  const c = t.value.color;
  if (c.space !== "srgb" && c.space !== "display-p3") return `${t.path} is in ${c.space}; version 0 decides contrast for srgb and display-p3 only`;
  if (c.components.some((x) => x === "none")) return `${t.path} has a "none" component`;
  if (c.alpha < 1) return `${t.path} has alpha ${c.alpha}, so its color depends on what lies beneath`;
  return null;
}

function colorOf(t: ResolvedToken): Color {
  if (t.value?.type !== "color") throw new Error(`${t.path} is not a color`);
  return t.value.color;
}

function channel(c: number | "none"): number {
  return decode(c === "none" ? 0 : c);
}

/**
 * The color an sRGB screen shows for a token: an srgb color itself; a
 * display-p3 color's hex fallback; a display-p3 color with no fallback when
 * it lies inside sRGB (it is then an sRGB color with the same luminance).
 * Otherwise why it cannot be known.
 */
function fallbackOf(t: ResolvedToken): Color | string {
  const c = colorOf(t);
  if (c.space === "srgb") return c;
  if (c.hex !== undefined) return { space: "srgb", components: [1, 3, 5].map((i) => parseInt(c.hex?.slice(i, i + 2) ?? "00", 16) / 255), alpha: 1 };
  const [r = 0, g = 0, b = 0] = c.components.map(channel);
  if (inGamut(linearP3ToLinearSrgb([r, g, b]), 1e-6)) return c;
  return `${t.path} lies outside sRGB and has no hex fallback, so an sRGB screen shows whatever the browser's gamut mapping makes of it`;
}

/** WCAG 2 relative luminance of an srgb or display-p3 color. For display-p3, see luminanceP3 in oklch.ts. */
export function relativeLuminance(color: Color): number {
  const [r = 0, g = 0, b = 0] = color.components.map(channel);
  return color.space === "display-p3" ? luminanceP3([r, g, b]) : luminance([r, g, b]);
}

export function contrastRatio(a: Color, b: Color): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

// Ratio: the size of a dimension, a number, or a typography token's fontSize.

function sizeOf(t: ResolvedToken): { value: number; unit: string } | null {
  const v = t.value;
  if (v === null) return null;
  if (v.type === "dimension") return { value: v.dimension.value, unit: v.dimension.unit };
  if (v.type === "typography") return { value: v.fontSize.value, unit: v.fontSize.unit };
  if (v.type === "number") return { value: v.number, unit: "" };
  return null;
}

function round(n: number): string {
  return String(Math.round(n * 1000) / 1000);
}
