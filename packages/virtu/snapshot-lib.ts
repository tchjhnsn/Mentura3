import { fileURLToPath } from "node:url";
import { load } from "./src/load.ts";
import type { Loaded } from "./src/model.ts";

export const SITE = fileURLToPath(new URL("./site", import.meta.url));
export const SNAPSHOT = fileURLToPath(new URL("./site/site.loaded.json", import.meta.url));

/** The site system as load() reads it, with its paths made relative so the snapshot is the same on every machine. */
export function siteSnapshot(): Loaded {
  const r = load(SITE);
  if (!r.ok) throw new Error(r.error);
  return { ...r.loaded, dir: "site", resolver: { ...r.loaded.resolver, path: "site/tokens.resolver.json" } };
}
