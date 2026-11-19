// DTCG 2025.10 tokens: merge sources in resolution order, flatten groups,
// inherit $type from groups, resolve curly-brace aliases with cycle detection,
// and parse colors, dimensions, and the other types into typed values.

import { isObject } from "./json.ts";
import type { Json, JsonObject, Permutation, Resolver, Source } from "./model.ts";
import { valueOf } from "./permutations.ts";

export const TOKEN_TYPES = [
  "color",
  "dimension",
  "fontFamily",
  "fontWeight",
  "duration",
  "cubicBezier",
  "number",
  "strokeStyle",
  "border",
  "transition",
  "shadow",
  "gradient",
  "typography",
] as const;
export type TokenType = (typeof TOKEN_TYPES)[number];

export const COLOR_SPACES = [
  "srgb",
  "srgb-linear",
  "hsl",
  "hwb",
  "lab",
  "lch",
  "oklab",
  "oklch",
  "display-p3",
  "a98-rgb",
  "prophoto-rgb",
  "rec2020",
  "xyz-d65",
  "xyz-d50",
] as const;

/**
 * A parsed color. hex is DTCG's 6-digit fallback, kept only for a color that
 * is not in srgb, where it is the color an sRGB screen shows. For an srgb
 * color the components are the color, and a hex beside them is not read.
 */
export type Color = { space: string; components: Array<number | "none">; alpha: number; hex?: string };
export type Dimension = { value: number; unit: "px" | "rem" };
export type Duration = { value: number; unit: "ms" | "s" };

export type TokenValue =
  | { type: "color"; color: Color }
  | { type: "dimension"; dimension: Dimension }
  | { type: "duration"; duration: Duration }
  | { type: "number"; number: number }
  | { type: "fontFamily"; families: string[] }
  | { type: "fontWeight"; weight: number }
  | { type: "cubicBezier"; points: number[] }
  | { type: "typography"; fontSize: Dimension }
  | { type: "shadow" | "transition" | "strokeStyle" | "border" | "gradient" };

export type ResolvedToken = {
  path: string;
  /** Null when no type can be determined. */
  type: TokenType | null;
  /** The value with every alias replaced, or null when an alias does not resolve. */
  raw: Json | null;
  /** The parsed value, or null when the value is invalid or does not resolve. */
  value: TokenValue | null;
  /** The token this one aliases directly, if its value is an alias. */
  aliasOf: string | null;
};

export type TokenRule = "L1.alias-unresolved" | "L1.alias-cycle" | "L1.type-invalid" | "L1.value-invalid";
export type TokenProblem = { rule: TokenRule; message: string; entities: string[] };

export type Resolution = {
  /** Tokens by path, in document order. */
  tokens: Map<string, ResolvedToken>;
  /** Paths of groups. */
  groups: Set<string>;
  problems: TokenProblem[];
};

const ALIAS = /^\{([^{}]+)\}$/;

/** The token sources a permutation selects, in resolution order. */
export function sourcesFor(resolver: Resolver, permutation: Permutation): Source[] {
  const out: Source[] = [];
  for (const item of resolver.order) {
    if (item.kind === "set") {
      out.push(...item.sources);
      continue;
    }
    const modifier = resolver.modifiers[item.name];
    if (!modifier) continue;
    const value = permutation[item.name] ?? valueOf(modifier, null);
    const chosen = modifier.values.find((v) => v.name === value);
    if (chosen) out.push(...chosen.sources);
  }
  return out;
}

/** Deep-merges token trees. A later token replaces an earlier one whole; groups merge key by key. */
export function mergeTrees(trees: JsonObject[]): JsonObject {
  let merged: JsonObject = {};
  for (const tree of trees) merged = mergeObject(merged, tree);
  return merged;
}

function mergeObject(a: JsonObject, b: JsonObject): JsonObject {
  const out: JsonObject = { ...a };
  for (const [key, value] of Object.entries(b)) {
    const prev = out[key];
    if (isObject(prev) && isObject(value) && !("$value" in prev) && !("$value" in value)) {
      out[key] = mergeObject(prev, value);
    } else {
      out[key] = value;
    }
  }
  return out;
}

type Flat = { path: string; raw: Json; explicitType: string | null; groupType: string | null };

export function resolveTokens(resolver: Resolver, permutation: Permutation): Resolution {
  const tree = mergeTrees(sourcesFor(resolver, permutation).map((s) => s.tree));
  const flats = new Map<string, Flat>();
  const groups = new Set<string>();
  const problems: TokenProblem[] = [];
  const reported = new Set<string>();
  const problem = (rule: TokenRule, path: string, message: string, entities: string[] = [path]): void => {
    const key = `${rule}\u0000${path}`;
    if (reported.has(key)) return;
    reported.add(key);
    problems.push({ rule, message, entities });
  };

  const walk = (node: JsonObject, prefix: string[], inherited: string | null): void => {
    for (const [key, child] of Object.entries(node)) {
      if (key === "$extends") {
        problem("L1.value-invalid", prefix.join(".") || "(root)", `${prefix.join(".") || "the root group"} uses $extends, which version 0 does not support`);
        continue;
      }
      if (key.startsWith("$") && key !== "$root") continue;
      const segments = [...prefix, key];
      const path = segments.join(".");
      if (/[{}.]/.test(key)) {
        problem("L1.value-invalid", path, `"${key}" in ${prefix.join(".") || "the root group"} uses a character DTCG forbids in names ({, }, or .)`);
        continue;
      }
      if (!isObject(child)) {
        problem("L1.value-invalid", path, `${path} is neither a token (an object with $value) nor a group`);
        continue;
      }
      const ownType = typeof child["$type"] === "string" ? child["$type"] : null;
      if ("$ref" in child && !("$value" in child)) {
        problem("L1.value-invalid", path, `${path} uses a JSON Pointer $ref, which version 0 does not support; use a curly-brace alias`);
        continue;
      }
      if ("$value" in child) {
        flats.set(path, { path, raw: child["$value"] ?? null, explicitType: ownType, groupType: inherited });
      } else {
        groups.add(path);
        walk(child, segments, ownType ?? inherited);
      }
    }
  };
  walk(tree, [], typeof tree["$type"] === "string" ? tree["$type"] : null);

  type Outcome = { ok: true; raw: Json; type: string | null } | { ok: false };
  const memo = new Map<string, Outcome>();
  const cycleMembers = new Set<string>();

  const resolveValue = (raw: Json, stack: string[], owner: string): { ok: true; value: Json; type: string | null } | { ok: false } => {
    if (typeof raw === "string") {
      const m = ALIAS.exec(raw);
      if (!m || m[1] === undefined) return { ok: true, value: raw, type: null };
      const target = m[1];
      if (!flats.has(target)) {
        const why = groups.has(target) ? `${target} is a group, not a token` : `there is no token ${target}`;
        problem("L1.alias-unresolved", owner, `${owner} aliases {${target}}, which does not resolve: ${why}`, [owner, target]);
        return { ok: false };
      }
      const t = resolveToken(target, stack);
      if (!t.ok) {
        if (!cycleMembers.has(owner)) {
          problem("L1.alias-unresolved", owner, `${owner} aliases {${target}}, which does not resolve`, [owner, target]);
        }
        return { ok: false };
      }
      return { ok: true, value: t.raw, type: t.type };
    }
    if (Array.isArray(raw)) {
      const out: Json[] = [];
      for (const item of raw) {
        const r = resolveValue(item, stack, owner);
        if (!r.ok) return r;
        out.push(r.value);
      }
      return { ok: true, value: out, type: null };
    }
    if (isObject(raw)) {
      if ("$ref" in raw) {
        problem("L1.value-invalid", owner, `${owner} uses a JSON Pointer $ref in its value, which version 0 does not support`);
        return { ok: true, value: raw, type: null };
      }
      const out: JsonObject = {};
      for (const [k, v] of Object.entries(raw)) {
        const r = resolveValue(v, stack, owner);
        if (!r.ok) return r;
        out[k] = r.value;
      }
      return { ok: true, value: out, type: null };
    }
    return { ok: true, value: raw, type: null };
  };

  const resolveToken = (path: string, stack: string[]): Outcome => {
    const done = memo.get(path);
    if (done) return done;
    const at = stack.indexOf(path);
    if (at >= 0) {
      const cycle = stack.slice(at);
      for (const member of cycle) cycleMembers.add(member);
      const first = [...cycle].sort()[0] ?? path;
      problem("L1.alias-cycle", first, `circular alias: ${[...cycle, path].join(" -> ")}`, cycle);
      return { ok: false };
    }
    const flat = flats.get(path);
    if (!flat) return { ok: false };
    stack.push(path);
    const r = resolveValue(flat.raw, stack, path);
    stack.pop();
    const outcome: Outcome = r.ok ? { ok: true, raw: r.value, type: flat.explicitType ?? r.type ?? flat.groupType } : { ok: false };
    memo.set(path, outcome);
    return outcome;
  };

  const tokens = new Map<string, ResolvedToken>();
  for (const flat of flats.values()) {
    const outcome = resolveToken(flat.path, []);
    const direct = typeof flat.raw === "string" ? ALIAS.exec(flat.raw)?.[1] ?? null : null;
    const token: ResolvedToken = { path: flat.path, type: null, raw: null, value: null, aliasOf: direct };
    tokens.set(flat.path, token);
    // The type: explicit $type, else the aliased token's type, else the closest group's $type.
    let typeName = flat.explicitType;
    let targetType: string | null = null;
    if (direct !== null) {
      const t = memo.get(direct);
      targetType = t && t.ok ? t.type : null;
    }
    typeName ??= (direct !== null ? targetType : null) ?? flat.groupType;
    if (typeName === null) {
      if (outcome.ok) problem("L1.type-invalid", flat.path, `${flat.path} has no $type, and no group above it gives one`);
    } else if (!isTokenType(typeName)) {
      problem("L1.type-invalid", flat.path, `${flat.path} has $type "${typeName}", which DTCG 2025.10 does not define`);
    } else {
      token.type = typeName;
      if (direct !== null && targetType !== null && flat.explicitType !== null && targetType !== flat.explicitType) {
        problem("L1.value-invalid", flat.path, `${flat.path} is typed ${flat.explicitType} but aliases {${direct}}, a ${targetType} token`, [flat.path, direct]);
      }
    }
    if (!outcome.ok) continue;
    token.raw = outcome.raw;
    if (token.type === null) continue;
    const parsed = parseValue(token.type, outcome.raw);
    if (typeof parsed === "string") problem("L1.value-invalid", flat.path, `${flat.path}: ${parsed}`);
    else token.value = parsed;
  }
  return { tokens, groups, problems };
}

function isTokenType(value: string): value is TokenType {
  return (TOKEN_TYPES as readonly string[]).includes(value);
}

/** Tokens a selector names: the token at that path, or every token below a group at that path. */
export function selectTokens(resolution: Resolution, selector: string): ResolvedToken[] {
  const out: ResolvedToken[] = [];
  for (const token of resolution.tokens.values()) {
    if (token.path === selector || token.path.startsWith(`${selector}.`)) out.push(token);
  }
  return out;
}

// Value parsing. Each returns the parsed value, or a string saying what is wrong.

export function parseValue(type: TokenType, raw: Json): TokenValue | string {
  switch (type) {
    case "color": {
      const c = parseColor(raw);
      return typeof c === "string" ? c : { type, color: c };
    }
    case "dimension": {
      const d = parseDimension(raw);
      return typeof d === "string" ? d : { type, dimension: d };
    }
    case "duration": {
      const d = parseDuration(raw);
      return typeof d === "string" ? d : { type, duration: d };
    }
    case "number":
      return typeof raw === "number" && Number.isFinite(raw) ? { type, number: raw } : "a number token's value must be a JSON number";
    case "fontFamily": {
      if (typeof raw === "string" && raw !== "") return { type, families: [raw] };
      if (Array.isArray(raw) && raw.length > 0 && raw.every((f) => typeof f === "string" && f !== "")) {
        return { type, families: raw.filter((f): f is string => typeof f === "string") };
      }
      return "a fontFamily value must be a font name or a non-empty array of font names";
    }
    case "fontWeight": {
      const w = parseFontWeight(raw);
      return typeof w === "string" ? w : { type, weight: w };
    }
    case "cubicBezier": {
      if (Array.isArray(raw) && raw.length === 4 && raw.every((n) => typeof n === "number")) {
        const points = raw.filter((n): n is number => typeof n === "number");
        const [x1, , x2] = points;
        if (x1 !== undefined && x2 !== undefined && x1 >= 0 && x1 <= 1 && x2 >= 0 && x2 <= 1) return { type, points };
        return "a cubicBezier's x coordinates must be between 0 and 1";
      }
      return "a cubicBezier value must be an array of four numbers";
    }
    case "typography": {
      if (!isObject(raw)) return "a typography value must be an object";
      for (const key of ["fontFamily", "fontSize", "fontWeight", "lineHeight"]) {
        if (!(key in raw)) return `a typography value needs ${key}`;
      }
      const size = parseDimension(raw["fontSize"] ?? null);
      if (typeof size === "string") return `fontSize: ${size}`;
      const weight = parseFontWeight(raw["fontWeight"] ?? null);
      if (typeof weight === "string") return `fontWeight: ${weight}`;
      if (typeof raw["lineHeight"] !== "number") return "lineHeight must be a number";
      return { type, fontSize: size };
    }
    case "shadow": {
      const layers = Array.isArray(raw) ? raw : [raw];
      for (const layer of layers) {
        if (!isObject(layer)) return "a shadow value must be an object or an array of objects";
        const c = parseColor(layer["color"] ?? null);
        if (typeof c === "string") return `color: ${c}`;
        for (const key of ["offsetX", "offsetY", "blur", "spread"]) {
          const d = parseDimension(layer[key] ?? null);
          if (typeof d === "string") return `${key}: ${d}`;
        }
      }
      return { type };
    }
    case "transition": {
      if (!isObject(raw)) return "a transition value must be an object";
      for (const key of ["duration", "delay"]) {
        const d = parseDuration(raw[key] ?? null);
        if (typeof d === "string") return `${key}: ${d}`;
      }
      const tf = parseValue("cubicBezier", raw["timingFunction"] ?? null);
      if (typeof tf === "string") return `timingFunction: ${tf}`;
      return { type };
    }
    case "strokeStyle":
    case "border":
    case "gradient":
      return isObject(raw) || Array.isArray(raw) || typeof raw === "string" ? { type } : `a ${type} value must be an object, array, or keyword`;
  }
}

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

export function parseColor(raw: Json): Color | string {
  if (typeof raw === "string") {
    const m = HEX.exec(raw);
    if (!m || m[1] === undefined) return `"${raw}" is not a color: use a DTCG color object or a hex string`;
    let hex = m[1];
    if (hex.length <= 4) hex = [...hex].map((ch) => ch + ch).join("");
    const byte = (i: number): number => parseInt(hex.slice(i, i + 2), 16) / 255;
    return { space: "srgb", components: [byte(0), byte(2), byte(4)], alpha: hex.length === 8 ? byte(6) : 1 };
  }
  if (!isObject(raw)) return "a color value must be a DTCG color object or a hex string";
  const space = raw["colorSpace"];
  if (typeof space !== "string" || !(COLOR_SPACES as readonly string[]).includes(space)) {
    return `colorSpace must be one of ${COLOR_SPACES.join(", ")}`;
  }
  const components = raw["components"];
  if (!Array.isArray(components) || components.length !== 3) return "components must be an array of three values";
  const parsed: Array<number | "none"> = [];
  for (const c of components) {
    if (c === "none") parsed.push("none");
    else if (typeof c === "number" && Number.isFinite(c)) {
      if ((space === "srgb" || space === "display-p3") && (c < 0 || c > 1)) return `${space} components must be between 0 and 1`;
      parsed.push(c);
    } else return 'each component must be a number or "none"';
  }
  const alpha = raw["alpha"] ?? 1;
  if (typeof alpha !== "number" || alpha < 0 || alpha > 1) return "alpha must be a number between 0 and 1";
  const hex = raw["hex"];
  if (hex !== undefined && (typeof hex !== "string" || !/^#[0-9a-f]{6}$/i.test(hex))) return "hex must be a 6-digit CSS hex color";
  if (space !== "srgb" && typeof hex === "string") return { space, components: parsed, alpha, hex: hex.toLowerCase() };
  return { space, components: parsed, alpha };
}

export function parseDimension(raw: Json): Dimension | string {
  if (typeof raw === "string") {
    const m = /^(-?\d*\.?\d+)(px|rem)$/.exec(raw);
    if (m && m[1] !== undefined && (m[2] === "px" || m[2] === "rem")) return { value: Number(m[1]), unit: m[2] };
    return `"${raw}" is not a dimension: use {"value": n, "unit": "px" | "rem"}`;
  }
  if (!isObject(raw)) return 'a dimension must be {"value": n, "unit": "px" | "rem"}';
  const value = raw["value"];
  const unit = raw["unit"];
  if (typeof value !== "number" || !Number.isFinite(value)) return "a dimension's value must be a number";
  if (unit !== "px" && unit !== "rem") return 'a dimension\'s unit must be "px" or "rem"';
  return { value, unit };
}

export function parseDuration(raw: Json): Duration | string {
  if (!isObject(raw)) return 'a duration must be {"value": n, "unit": "ms" | "s"}';
  const value = raw["value"];
  const unit = raw["unit"];
  if (typeof value !== "number" || !Number.isFinite(value)) return "a duration's value must be a number";
  if (unit !== "ms" && unit !== "s") return 'a duration\'s unit must be "ms" or "s"';
  return { value, unit };
}

const FONT_WEIGHTS: Record<string, number> = {
  thin: 100,
  hairline: 100,
  "extra-light": 200,
  "ultra-light": 200,
  light: 300,
  normal: 400,
  regular: 400,
  book: 400,
  medium: 500,
  "semi-bold": 600,
  "demi-bold": 600,
  bold: 700,
  "extra-bold": 800,
  "ultra-bold": 800,
  black: 900,
  heavy: 900,
  "extra-black": 950,
  "ultra-black": 950,
};

function parseFontWeight(raw: Json): number | string {
  if (typeof raw === "number" && raw >= 1 && raw <= 1000) return raw;
  if (typeof raw === "string" && raw in FONT_WEIGHTS) return FONT_WEIGHTS[raw] ?? 400;
  return "a fontWeight must be a number from 1 to 1000 or a DTCG weight keyword";
}

// Display.

export function colorToHex(color: Color): string | null {
  if (color.space !== "srgb" || color.components.some((c) => c === "none")) return null;
  const byte = (c: number | "none"): string => Math.round((c === "none" ? 0 : c) * 255).toString(16).padStart(2, "0");
  const alpha = color.alpha < 1 ? byte(color.alpha) : "";
  return `#${color.components.map(byte).join("")}${alpha}`;
}

/**
 * The value in its DTCG 2025.10 form. Legacy hex colors and "16px" strings
 * become objects, so a consumer reads one shape per type.
 */
export function canonicalValue(token: ResolvedToken): Json | null {
  const v = token.value;
  if (v === null) return token.raw;
  if (v.type === "color") {
    const out: JsonObject = {
      colorSpace: v.color.space,
      components: v.color.components.map((c) => (c === "none" ? c : Math.round(c * 10000) / 10000)),
    };
    if (v.color.alpha < 1) out["alpha"] = v.color.alpha;
    const hex = colorToHex({ ...v.color, alpha: 1 }) ?? v.color.hex ?? null;
    if (hex !== null) out["hex"] = hex;
    return out;
  }
  if (v.type === "dimension") return { value: v.dimension.value, unit: v.dimension.unit };
  return token.raw;
}

/** A short text form of a value, for the CLI and the docs page. */
export function formatValue(token: ResolvedToken): string {
  const v = token.value;
  if (v === null) return token.raw === null ? "(does not resolve)" : JSON.stringify(token.raw);
  switch (v.type) {
    case "color": {
      const hex = colorToHex(v.color);
      if (hex !== null) return hex;
      const named = ["hsl", "hwb", "lab", "lch", "oklab", "oklch"].includes(v.color.space);
      const args = `${v.color.components.join(" ")}${v.color.alpha < 1 ? ` / ${v.color.alpha}` : ""}`;
      const text = named ? `${v.color.space}(${args})` : `color(${v.color.space} ${args})`;
      return v.color.hex === undefined ? text : `${text}, sRGB fallback ${v.color.hex}`;
    }
    case "dimension":
      return `${v.dimension.value}${v.dimension.unit}`;
    case "duration":
      return `${v.duration.value}${v.duration.unit}`;
    case "number":
      return String(v.number);
    case "fontFamily":
      return v.families.join(", ");
    case "fontWeight":
      return String(v.weight);
    case "cubicBezier":
      return `cubic-bezier(${v.points.join(", ")})`;
    case "shadow":
      return formatShadow(token.raw) ?? JSON.stringify(token.raw);
    default:
      return JSON.stringify(token.raw);
  }
}

function formatShadow(raw: Json | null): string | null {
  const layers = Array.isArray(raw) ? raw : [raw];
  const parts: string[] = [];
  for (const layer of layers) {
    if (!isObject(layer)) return null;
    const color = parseColor(layer["color"] ?? null);
    if (typeof color === "string") return null;
    const sizes: string[] = [];
    for (const key of ["offsetX", "offsetY", "blur", "spread"]) {
      const d = parseDimension(layer[key] ?? null);
      if (typeof d === "string") return null;
      sizes.push(`${d.value}${d.unit}`);
    }
    const inset = layer["inset"] === true ? "inset " : "";
    parts.push(`${inset}${sizes.join(" ")} ${colorToHex(color) ?? color.space}`);
  }
  return parts.join(", ");
}
