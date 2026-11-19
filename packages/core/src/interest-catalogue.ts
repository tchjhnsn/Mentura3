/**
 * The real things the Get to know you picker shows (design guide "Get to know you: person dashboard", 2026-11-19):
 * books (Open Library covers, the author's Wikipedia page), podcast shows (Apple Podcasts artwork and feed) and
 * musicians (Wikipedia lead photos), from `interest-items.json` (built by scripts/interest-items.mjs). The areas the
 * dashboard card offers, the first guess of each pick's mode, and "more like this" by shared tags and maker. Pure.
 */
import items from "./interest-items.json" with { type: "json" };
import type { Mode } from "./interests";

export type CatalogPerson = { name: string; line: string | null; image: string | null; page: string | null; role: string };
export type CatalogItem = { id: string; area: AreaId; title: string; by: string; tags: string[]; image: string | null; link: string | null; feed?: string | null; year?: number | null; people: CatalogPerson[] };

export const AREAS = [
  { id: "books", label: "Books", pick: "Pick 3 books you love", row: "Your reading", promise: "Your reading row fills as you tap." },
  { id: "podcasts", label: "Podcasts", pick: "Pick 3 podcasts", row: "Your listening", promise: "Your listening row fills as you tap." },
  { id: "music", label: "Music", pick: "Pick 3 musicians", row: "Your music", promise: "Your music row fills as you tap." },
] as const;
export type AreaId = (typeof AREAS)[number]["id"];
export const areaOf = (id: unknown) => AREAS.find((a) => a.id === id);

export const CATALOG = items as CatalogItem[];
const BY_ID = new Map(CATALOG.map((c) => [c.id, c]));
export const itemOf = (id: unknown): CatalogItem | undefined => (typeof id === "string" ? BY_ID.get(id) : undefined);
export const itemsIn = (area: AreaId): CatalogItem[] => CATALOG.filter((c) => c.area === area);

/** The least the picker asks for in an area before its row fills. */
export const MIN_PICKS = 3;

/** Things like `id`: same maker first, then most shared tags, in catalogue order; never one in `not`. */
export function related(id: string, n = 3, not: ReadonlySet<string> = new Set()): CatalogItem[] {
  const me = itemOf(id);
  if (!me) return [];
  const score = (c: CatalogItem) => (c.by && c.by === me.by ? 10 : 0) + c.tags.filter((t) => me.tags.includes(t)).length;
  return CATALOG.filter((c) => c.area === me.area && c.id !== id && !not.has(c.id))
    .map((c, i) => ({ c, i, s: score(c) })).filter((x) => x.s > 0).sort((a, b) => b.s - a.s || a.i - b.i).slice(0, n).map((x) => x.c);
}

/** For a row: what the picks lead to, each with the pick it came from ("Because you picked ..."), no repeats. */
export function becauseOf(picks: readonly string[], n = 6): { item: CatalogItem; because: CatalogItem }[] {
  const not = new Set(picks), out: { item: CatalogItem; because: CatalogItem }[] = [];
  for (let round = 0; out.length < n && round < 6; round++) {
    for (const p of picks) {
      const from = itemOf(p);
      const next = from && related(p, 1, not).at(0);
      if (from && next) { out.push({ item: next, because: from }); not.add(next.id); }
      if (out.length >= n) break;
    }
  }
  return out;
}

/** The first guess of a pick's mode on Sort: books, shows and musicians are things one follows. The person moves it. */
export const firstMode = (_c: CatalogItem): Mode => "know";
