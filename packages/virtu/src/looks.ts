// virtu looks: the shape, ornaments, and season a site picks from a catalog,
// what they cost the page in CSS, and whether they pass against the system.
// The editor (editor.ts) shows them in the panel's Look tab beside the
// tokens; a host keeps the choice beside its tokens (virtu editor writes
// looks.json) and renders lookCss on the page. It reads no file: the host
// hands it the catalog, so a server can run it from a snapshot. The designs
// are docs/design/SHAPE.md, docs/design/ORNAMENTS.md, docs/design/SEASONS.md,
// and docs/design/EDITOR.md.

import { seasonOn } from "./calendar.ts";
import type { Analysis } from "./check.ts";
import { isObject } from "./json.ts";
import type { Finding, Json, OrnamentDecl, SeasonDecl, ShapeDecl } from "./model.ts";
import { checkUnder as ornamentUnder, checkValues as ornamentValues, ornamentKeyframes, ornamentRules } from "./ornament.ts";
import { perPermutation } from "./rules.ts";
import { checkDates, checkMembers, seasonCss } from "./season.ts";
import { checkShapes, radiusValue, shapeCss } from "./shape.ts";

/** The looks a host offers: shape, ornament (with its SVG), and season declarations. */
export type LookCatalog = { shapes: ShapeDecl[]; ornaments: Array<{ decl: OrnamentDecl; svg: string }>; seasons: SeasonDecl[] };

/** What a site picked: one shape or none, an ornament per slot, and one season calendar or none. */
export type LookChoice = { shape: string | null; ornaments: Record<string, string>; season: string | null };

export const NO_LOOK: LookChoice = { shape: null, ornaments: {}, season: null };

/** The slots a page marks with virtu-slot-<slot> for ornaments, before any a season calendar adds. */
export const LOOK_SLOTS = ["card", "avatar"] as const;

export type LookState = {
  shapes: Array<{ name: string; description: string | null; corner: string; card: string; control: string; edge: string | null }>;
  ornaments: Array<{ name: string; description: string | null; anchor: string; motion: string | null }>;
  seasons: Array<{ name: string; description: string | null; seasons: Array<{ name: string; from: string; to: string; slots: Record<string, string> }> }>;
  slots: string[];
  choice: LookChoice;
  /** The season of the chosen calendar that is on today, for data-virtu-season on the page's root, or null. */
  today: string | null;
  /** The CSS the choice adds to the page. */
  css: string;
  findings: Finding[];
  /** Names in the choice the catalog does not have; they are left out. */
  refused: string[];
};

/** Reads a choice from JSON: {shape?, ornaments?, season?}. */
export function readLookChoice(raw: Json | undefined): { ok: true; choice: LookChoice } | { ok: false; error: string } {
  if (raw === undefined || raw === null) return { ok: true, choice: NO_LOOK };
  if (!isObject(raw)) return { ok: false, error: "looks must be an object" };
  const name = (v: Json | undefined, where: string): string | null | Error => {
    if (v === undefined || v === null) return null;
    return typeof v === "string" && /^[A-Za-z0-9_-]+$/.test(v) ? v : new Error(`looks.${where} must be a name or null`);
  };
  const shape = name(raw["shape"], "shape");
  const season = name(raw["season"], "season");
  if (shape instanceof Error) return { ok: false, error: shape.message };
  if (season instanceof Error) return { ok: false, error: season.message };
  const ornaments: Record<string, string> = {};
  const o = raw["ornaments"];
  if (o !== undefined && o !== null) {
    if (!isObject(o)) return { ok: false, error: "looks.ornaments must map slots to ornament names" };
    for (const [slot, v] of Object.entries(o)) {
      const n = name(v, `ornaments.${slot}`);
      if (n instanceof Error || !/^[A-Za-z0-9_-]+$/.test(slot)) return { ok: false, error: `looks.ornaments.${slot} must be an ornament name` };
      if (n !== null) ornaments[slot] = n;
    }
  }
  return { ok: true, choice: { shape, ornaments, season } };
}

/** The choice as JSON, with keys in a fixed order. */
export function lookJson(choice: LookChoice): Json {
  const ornaments: Record<string, Json> = {};
  for (const k of Object.keys(choice.ornaments).sort()) ornaments[k] = choice.ornaments[k] ?? null;
  return { shape: choice.shape, ornaments, season: choice.season };
}

/** The page's CSS for a choice: the shape, each slot's ornament, then the season calendar, whose ornaments replace a slot's own while a season lasts. */
export function lookCss(catalog: LookCatalog, choice: LookChoice): string {
  const parts: string[] = [];
  const shape = catalog.shapes.find((s) => s.name === choice.shape);
  if (shape !== undefined) parts.push(shapeCss(shape));
  const used: OrnamentDecl[] = [];
  for (const slot of Object.keys(choice.ornaments).sort()) {
    const o = catalog.ornaments.find((x) => x.decl.name === choice.ornaments[slot]);
    if (o === undefined) continue;
    parts.push(...ornamentRules(o.decl, o.svg, `.virtu-slot-${slot}`));
    if (!used.includes(o.decl)) used.push(o.decl);
  }
  for (const d of used) {
    const k = ornamentKeyframes(d);
    if (k !== null) parts.push(k);
  }
  const season = catalog.seasons.find((s) => s.name === choice.season);
  if (season !== undefined) {
    const byName = new Map(catalog.ornaments.map((o) => [o.decl.name, o.decl]));
    const svg = new Map(catalog.ornaments.map((o) => [o.decl, o.svg]));
    parts.push(seasonCss(season, byName, (d) => svg.get(d) ?? null));
  }
  return parts.length === 0 ? "" : `${parts.join("\n\n").trim()}\n`;
}

/** The Look tab's view of a choice against the system: what can be picked, the CSS, and the findings. */
export function lookState(a: Analysis, catalog: LookCatalog, choice: LookChoice, now: Date = new Date(), timeZone?: string): LookState {
  const refused: string[] = [];
  const findings: Finding[] = [];
  const kept: LookChoice = { shape: null, ornaments: {}, season: null };
  const shape = catalog.shapes.find((s) => s.name === choice.shape);
  if (choice.shape !== null && shape === undefined) refused.push(`no shape is named ${choice.shape}`);
  if (shape !== undefined) {
    kept.shape = shape.name;
    findings.push(...checkShapes(a, [shape]));
  }
  const checked = new Set<string>();
  for (const [slot, name] of Object.entries(choice.ornaments)) {
    const o = catalog.ornaments.find((x) => x.decl.name === name);
    if (o === undefined) {
      refused.push(`no ornament is named ${name}`);
      continue;
    }
    kept.ornaments[slot] = name;
    if (checked.has(name)) continue;
    checked.add(name);
    findings.push(...ornamentValues(o.decl, o.svg), ...perPermutation(a, (_p, r) => ornamentUnder(o.decl, r)));
  }
  const season = catalog.seasons.find((s) => s.name === choice.season);
  if (choice.season !== null && season === undefined) refused.push(`no season calendar is named ${choice.season}`);
  if (season !== undefined) {
    kept.season = season.name;
    const svg = new Map(catalog.ornaments.map((o) => [o.decl, o.svg]));
    findings.push(...checkDates(season), ...checkMembers(a, season, new Map(catalog.ornaments.map((o) => [o.decl.name, o.decl])), (d) => svg.get(d) ?? null));
  }
  const slots = [...new Set([...LOOK_SLOTS, ...catalog.seasons.flatMap((s) => s.seasons.flatMap((x) => Object.keys(x.slots)))])];
  return {
    shapes: catalog.shapes.map((s) => ({
      name: s.name,
      description: s.description,
      corner: s.corner,
      card: radiusValue(s.radius.card ?? 0),
      control: radiusValue(s.radius.control ?? 0),
      edge: s.edge?.paint.kind ?? null,
    })),
    ornaments: catalog.ornaments.map((o) => ({ name: o.decl.name, description: o.decl.description, anchor: o.decl.anchor, motion: o.decl.motion?.kind ?? null })),
    seasons: catalog.seasons.map((s) => ({ name: s.name, description: s.description, seasons: s.seasons.map((x) => ({ name: x.name, from: x.from, to: x.to, slots: x.slots })) })),
    slots,
    choice: kept,
    today: season === undefined ? null : (seasonOn(season.seasons, now, timeZone)?.name ?? null),
    css: lookCss(catalog, kept),
    findings,
    refused,
  };
}
