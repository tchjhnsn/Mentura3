// Adventures (Torian, 2026-11-17 10:38Z; decided 11:02Z as a lens across tiles): camping, a sports league,
// travel, a game night, skydiving, learning piano and then starting a band. One adventure can touch several tiles and
// move between them over time, so it is not a tile: it is a lens, beside Legacy and Qualities. Each adventure is
// Not yet until the person marks it done, when it moves to Already. Kept as the hidden kind "adventure" in the legacy
// app (`./life.ts`); its tiles are a comma list of tile ids. Pure data: no I/O.
import { GROUPS } from "./plan";

/** Every tile an adventure can touch: the tiles of the three groups on Home. */
export const ADVENTURE_TILES: readonly string[] = GROUPS.flatMap((g) => g.tiles);

/** Who the person means to do it with. */
export const WITH = [
  { id: "alone", label: "On my own" },
  { id: "partner", label: "With a spouse or partner" },
  { id: "family", label: "With family" },
  { id: "friends", label: "With friends" },
  { id: "others", label: "With others" },
] as const;

export type Idea = { id: string; name: string; tiles: readonly string[]; with?: (typeof WITH)[number]["id"] };

/** Ideas to start from, in Torian's examples' terms; the person changes the tiles and who it is with after adding one. */
export const IDEAS: readonly { label: string; ideas: readonly Idea[] }[] = [
  { label: "Outdoors", ideas: [
    { id: "camping", name: "Go camping", tiles: ["fitness", "friends"] },
    { id: "trail", name: "Hike a long trail", tiles: ["fitness"] },
    { id: "mountain-bike", name: "Ride a mountain bike trail", tiles: ["fitness"] },
    { id: "skydiving", name: "Go skydiving", tiles: ["fitness"] },
  ] },
  { label: "Travel", ideas: [
    { id: "abroad", name: "Travel abroad", tiles: ["learn"] },
    { id: "national-park", name: "Visit a national park", tiles: ["kin"], with: "family" },
  ] },
  { label: "Play", ideas: [
    { id: "league", name: "Join a sports league", tiles: ["fitness", "friends"], with: "others" },
    { id: "game-night", name: "Host a game night", tiles: ["friends"], with: "friends" },
    { id: "marathon", name: "Run a marathon", tiles: ["fitness"] },
  ] },
  { label: "Music and dance", ideas: [
    { id: "piano", name: "Learn to play piano", tiles: ["learn"], with: "alone" },
    { id: "dance", name: "Learn to dance", tiles: ["mate", "fitness"], with: "partner" },
    { id: "band", name: "Start or join a band", tiles: ["friends", "standing"], with: "others" },
  ] },
];

export const ideaById = (id: string): Idea | null => IDEAS.flatMap((g) => g.ideas).find((i) => i.id === id) ?? null;

/** The tile ids kept on an adventure, in Home's order, dropping any that are not tiles. */
export function tilesOf(raw: unknown): string[] {
  const given = new Set(String(raw ?? "").split(",").map((s) => s.trim()).filter(Boolean));
  return ADVENTURE_TILES.filter((t) => given.has(t));
}

/** The tile list with one tile turned on or off, as it is kept. */
export function toggleTile(raw: unknown, tile: string): string {
  if (!ADVENTURE_TILES.includes(tile)) return tilesOf(raw).join(",");
  const now = new Set(tilesOf(raw));
  if (now.has(tile)) now.delete(tile); else now.add(tile);
  return ADVENTURE_TILES.filter((t) => now.has(t)).join(",");
}

export type Adventure = { id: string; name: string; tiles: string[]; with: string | null; done: boolean };

/** An adventure from its kept record. */
export function adventureOf(r: { id: string; state: string | null; body: Record<string, unknown> }): Adventure {
  const w = typeof r.body.with === "string" && WITH.some((x) => x.id === r.body.with) ? r.body.with : null;
  return { id: r.id, name: String(r.body.name ?? "An adventure"), tiles: tilesOf(r.body.tiles), with: w, done: r.state === "done" };
}

/** The adventures that touch a tile, Not yet first. */
export function adventuresIn(all: readonly Adventure[], tile: string): Adventure[] {
  return all.filter((a) => a.tiles.includes(tile)).sort((a, b) => Number(a.done) - Number(b.done) || a.name.localeCompare(b.name));
}
