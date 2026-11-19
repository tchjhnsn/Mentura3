// virtu season check: decides what a season declaration states. That no two
// seasons share a day is about the declaration's own dates (src/calendar.ts,
// which an app runs to pick today's season); that every ornament a season
// wears exists and passes virtu ornament check is decided against the
// ornament declarations found beside it. It also holds the function that
// writes an item's CSS: each season's ornaments under
// :root[data-virtu-season=<season>]. The design is docs/design/SEASONS.md.

import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { overlaps } from "./calendar.ts";
import type { Analysis } from "./check.ts";
import { findOrnaments, loadOrnaments } from "./load.ts";
import type { Finding, OrnamentDecl, SeasonDecl } from "./model.ts";
import { checkUnder, checkValues, ornamentKeyframes, ornamentRules, readAsset } from "./ornament.ts";
import { perPermutation, seasonFinding } from "./rules.ts";

/**
 * The folders a season's ornaments are looked for in: the system's
 * ornaments folder, and the ornaments folder beside the seasons folder the
 * declaration sits in (design/seasons/x.season.json looks in design/ornaments).
 */
export function ornamentFolders(systemDir: string, decl: SeasonDecl): string[] {
  const out = [join(systemDir, "ornaments")];
  const parts = dirname(decl.path).split("/");
  const i = parts.lastIndexOf("seasons");
  if (i > 0) out.push(join(parts.slice(0, i).join("/") || "/", "ornaments"));
  return [...new Set(out)].filter((d) => existsSync(d));
}

/** The ornament declarations in the folders, by name; the first found wins. */
export function ornamentsIn(folders: string[]): Map<string, OrnamentDecl> {
  const out = new Map<string, OrnamentDecl>();
  if (folders.length === 0) return out;
  const found = findOrnaments(folders);
  if (!found.ok) return out;
  const loaded = loadOrnaments(found.files);
  if (!loaded.ok) return out;
  for (const o of loaded.ornaments) if (!out.has(o.name)) out.set(o.name, o);
  return out;
}

/** The findings about the declaration's own dates. */
export function checkDates(decl: SeasonDecl): Finding[] {
  return overlaps(decl.seasons).map((o) => seasonFinding("season.overlap", `${decl.name}: ${o.a} and ${o.b} both cover ${o.day}`, [decl.name, o.a, o.b]));
}

/** The findings about the ornaments the seasons wear. */
/** svgOf gives an ornament's SVG; by default it is read from beside the declaration. */
export function checkMembers(a: Analysis, decl: SeasonDecl, ornaments: Map<string, OrnamentDecl>, svgOf: (o: OrnamentDecl) => string | null = readAsset): Finding[] {
  const out: Finding[] = [];
  const verdict = new Map<string, Finding[]>();
  for (const s of decl.seasons) {
    for (const [slot, name] of Object.entries(s.slots)) {
      const o = ornaments.get(name);
      if (o === undefined) {
        out.push(seasonFinding("season.unknown", `${decl.name}: season ${s.name} puts ${name} on ${slot}, but no ornament declaration ${name}.ornament.json is found`, [decl.name, s.name, name]));
        continue;
      }
      if (!verdict.has(name)) verdict.set(name, [...checkValues(o, svgOf(o)), ...perPermutation(a, (_p, r) => checkUnder(o, r))].filter((f) => f.severity === "error"));
      const errors = verdict.get(name) ?? [];
      if (errors.length > 0) out.push(seasonFinding("season.member", `${decl.name}: season ${s.name} wears ${name}, which fails virtu ornament check (${errors.map((f) => f.rule).join(", ")})`, [decl.name, s.name, name]));
    }
  }
  return out;
}

export function checkSeasons(a: Analysis, decls: SeasonDecl[]): Finding[] {
  const out: Finding[] = [];
  for (const decl of decls) {
    out.push(...checkDates(decl));
    out.push(...checkMembers(a, decl, ornamentsIn(ornamentFolders(a.loaded.dir, decl))));
  }
  return out;
}

// What an implementation writes. The registry test compares each item's CSS
// with seasonCss.

/** The slots a declaration's seasons name, in first-seen order. */
export function slotsOf(decl: SeasonDecl): string[] {
  return [...new Set(decl.seasons.flatMap((s) => Object.keys(s.slots)))];
}

/**
 * The whole CSS file of a season item: for each season and slot, the slot's
 * ornament drawn on virtu-slot-<slot> while the root has
 * data-virtu-season="<season>", then the keyframes the ornaments use. The
 * file holds every drawing, so it needs no ornament file beside it.
 */
export function seasonCss(decl: SeasonDecl, ornaments: Map<string, OrnamentDecl>, svgOf: (o: OrnamentDecl) => string | null = readAsset): string {
  const header = [
    "/*",
    ` * ${decl.name}: a Virtu season calendar. Declaration: ${decl.name}.season.json.`,
    ` * Put virtu-slot-<slot> on the elements that wear a season's ornaments (slots: ${slotsOf(decl).join(", ")}),`,
    " * and set data-virtu-season on the root to today's season, which seasonOn in virtu/season picks:",
    ...decl.seasons.map((s) => ` *   ${s.name}: ${s.from} to ${s.to}, ${Object.entries(s.slots).map(([k, v]) => `${v} on ${k}`).join(", ")}.`),
    " * Outside every season nothing is drawn.",
    " */",
  ];
  const parts = [header.join("\n")];
  const used: OrnamentDecl[] = [];
  for (const s of decl.seasons) {
    for (const [slot, name] of Object.entries(s.slots)) {
      const o = ornaments.get(name);
      const svg = o === undefined ? null : svgOf(o);
      if (o === undefined || svg === null) continue;
      if (!used.includes(o)) used.push(o);
      parts.push(...ornamentRules(o, svg, `:root[data-virtu-season="${s.name}"] .virtu-slot-${slot}`));
    }
  }
  for (const o of used) {
    const k = ornamentKeyframes(o);
    if (k !== null) parts.push(k);
  }
  return `${parts.join("\n\n")}\n`;
}
