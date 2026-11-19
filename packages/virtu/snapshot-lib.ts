import { fileURLToPath } from "node:url";
import { relative } from "node:path";
import { lookCatalog } from "./src/editor-io.ts";
import { load } from "./src/load.ts";
import type { LookCatalog } from "./src/looks.ts";
import type { Loaded } from "./src/model.ts";

export const SITE = fileURLToPath(new URL("./site", import.meta.url));
export const SNAPSHOT = fileURLToPath(new URL("./site/site.loaded.json", import.meta.url));
export const LOOKS_SNAPSHOT = fileURLToPath(new URL("./site/looks.loaded.json", import.meta.url));

/** The site system as load() reads it, with its paths made relative so the snapshot is the same on every machine. */
export function siteSnapshot(): Loaded {
  const r = load(SITE);
  if (!r.ok) throw new Error(r.error);
  return { ...r.loaded, dir: "site", resolver: { ...r.loaded.resolver, path: "site/tokens.resolver.json" } };
}

/** The site's looks (site/shapes, site/ornaments, site/seasons, each ornament with its SVG), with paths made relative. */
export function looksSnapshot(): LookCatalog {
  const c = lookCatalog(SITE);
  const rel = (p: string): string => `site/${relative(SITE, p)}`;
  return {
    shapes: c.shapes.map((s) => ({ ...s, path: rel(s.path) })),
    ornaments: c.ornaments.map((o) => ({ decl: { ...o.decl, path: rel(o.decl.path) }, svg: o.svg })),
    seasons: c.seasons.map((s) => ({ ...s, path: rel(s.path) })),
  };
}
