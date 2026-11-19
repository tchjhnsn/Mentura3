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

/** Music's genres, each the tags it covers; the picker opens with these so the person starts from what they hear. */
export const GENRES = [
  { id: "pop", label: "Pop", tags: ["pop"] },
  { id: "hip-hop", label: "Hip hop", tags: ["hip hop"] },
  { id: "rnb", label: "R&B and soul", tags: ["r&b", "soul", "motown", "funk"] },
  { id: "rock", label: "Rock and indie", tags: ["rock", "alternative"] },
  { id: "country", label: "Country", tags: ["country"] },
  { id: "folk", label: "Folk", tags: ["folk"] },
  { id: "latin", label: "Latin", tags: ["latin", "reggaeton"] },
  { id: "afrobeats", label: "Afrobeats", tags: ["afrobeats"] },
  { id: "k-pop", label: "K-pop", tags: ["k-pop"] },
  { id: "electronic", label: "Electronic", tags: ["electronic", "dance"] },
  { id: "gospel", label: "Gospel and worship", tags: ["gospel", "worship"] },
  { id: "jazz", label: "Jazz", tags: ["jazz"] },
  { id: "blues", label: "Blues", tags: ["blues"] },
  { id: "classical", label: "Classical and film", tags: ["classical", "film"] },
] as const;
export type GenreId = (typeof GENRES)[number]["id"];

/** When a musician broke through, newest first; the decade is one of the item's tags. */
export const ERAS = [
  { id: "2020s", label: "2020s", tags: ["2020s"] },
  { id: "2010s", label: "2010s", tags: ["2010s"] },
  { id: "2000s", label: "2000s", tags: ["2000s"] },
  { id: "1990s", label: "1990s", tags: ["1990s"] },
  { id: "1980s", label: "1980s", tags: ["1980s"] },
  { id: "1970s", label: "1970s", tags: ["1970s"] },
  { id: "1960s", label: "1960s", tags: ["1960s"] },
  { id: "1950s", label: "1950s", tags: ["1950s"] },
  { id: "earlier", label: "Before 1950", tags: ["1940s", "1930s", "1920s", "before-1900"] },
] as const;
export type EraId = (typeof ERAS)[number]["id"];
const ERA_TAGS: ReadonlySet<string> = new Set(ERAS.flatMap((e) => e.tags));

/** The item's era index (0 is newest), or the end of the list when it has none. */
export const eraIndex = (c: CatalogItem) => {
  const i = ERAS.findIndex((e) => e.tags.some((t) => c.tags.includes(t)));
  return i < 0 ? ERAS.length : i;
};
/** The tags a person reads ("jazz, trumpet"), without the era tags. */
export const topicsOf = (c: CatalogItem) => c.tags.filter((t) => !ERA_TAGS.has(t));

/** Items in the chosen genres and eras (any of each; none chosen means all), newest first, catalogue order within. */
export function filterMusic(items: readonly CatalogItem[], genres: readonly string[], eras: readonly string[]): CatalogItem[] {
  const gt = GENRES.filter((g) => genres.includes(g.id)).flatMap((g) => g.tags as readonly string[]);
  const et = ERAS.filter((e) => eras.includes(e.id)).flatMap((e) => e.tags as readonly string[]);
  return items
    .map((c, i) => ({ c, i }))
    .filter(({ c }) => (!gt.length || c.tags.some((t) => gt.includes(t))) && (!et.length || c.tags.some((t) => et.includes(t))))
    .sort((a, b) => eraIndex(a.c) - eraIndex(b.c) || a.i - b.i)
    .map(({ c }) => c);
}
