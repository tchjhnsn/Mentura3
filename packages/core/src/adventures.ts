// Adventures (Torian, 2026-11-17 10:38Z; decided 11:02Z as a lens across tiles): camping, a sports league,
// travel, a game night, skydiving, starting a band. Learning an instrument belongs to Scholē, not here (Torian, 11-17 20:11Z). One adventure can touch several tiles and
// move between them over time, so it is not a tile: it is a lens, beside Legacy and Qualities. Each adventure is
// Not yet until the person marks it done, when it moves to Already. Kept as the hidden kind "adventure" in the legacy
// app (`./life.ts`); its tiles are a comma list of tile ids. Pure data: no I/O.
import { audienceOf, type RecordAudience } from "./audience";
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

/** One stop of a day's plan: a time, what it is, a note, a link out (AllTrails, Recreation.gov) and where on the map. */
export type Stop = { time: string | null; title: string; note: string | null; link: string | null; lat: number | null; lon: number | null };
export type Day = { day: string | null; title: string | null; stops: Stop[] };
export type Task = { text: string; done: boolean };

export type Adventure = {
  id: string; name: string; tiles: string[]; with: string | null; done: boolean; ref: string | null;
  place: string | null; lat: number | null; lon: number | null; start: string | null; end: string | null;
  plan: Day[]; drafted: boolean; checklist: Task[]; budget: number | null; people: string[];
  /** Who sees it on the shared side (`./audience.ts`): by default its owner and the people on it. */
  audience: RecordAudience;
};

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
const str = (v: unknown, n: number) => (typeof v === "string" && v.trim() ? v.replace(/\s+/g, " ").trim().slice(0, n) : null);
const num = (v: unknown, lo: number, hi: number) => (typeof v === "number" && Number.isFinite(v) && v >= lo && v <= hi ? v : typeof v === "string" && v.trim() && Number.isFinite(Number(v)) && Number(v) >= lo && Number(v) <= hi ? Number(v) : null);
const day = (v: unknown) => (typeof v === "string" && DAY_RE.test(v) && !Number.isNaN(Date.parse(v)) ? v : null);
const link = (v: unknown) => { const s = str(v, 500); return s && /^https:\/\//.test(s) ? s : null; };
const json = (v: unknown): unknown => { if (typeof v !== "string") return v; try { return JSON.parse(v); } catch { return null; } };

/** A plan as kept: at most 14 days of at most 12 stops, every field cleaned. */
export function cleanPlan(raw: unknown): Day[] {
  const v = json(raw);
  if (!Array.isArray(v)) return [];
  return v.slice(0, 14).map((d): Day => {
    const o = (d ?? {}) as Record<string, unknown>;
    const stops = Array.isArray(o.stops) ? o.stops.slice(0, 12).map((s): Stop | null => {
      const x = (s ?? {}) as Record<string, unknown>;
      const title = str(x.title, 140);
      if (!title) return null;
      const time = typeof x.time === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(x.time) ? x.time : null;
      return { time, title, note: str(x.note, 300), link: link(x.link), lat: num(x.lat, -90, 90), lon: num(x.lon, -180, 180) };
    }).filter((s): s is Stop => s !== null) : [];
    return { day: day(o.day), title: str(o.title, 100), stops };
  }).filter((d) => d.stops.length || d.title);
}

/** A checklist as kept: at most 60 items. */
export function cleanChecklist(raw: unknown): Task[] {
  const v = json(raw);
  if (!Array.isArray(v)) return [];
  return v.slice(0, 60).map((t) => { const o = (typeof t === "string" ? { text: t } : t ?? {}) as Record<string, unknown>; const text = str(o.text, 140); return text ? { text, done: o.done === true } : null; }).filter((t): t is Task => t !== null);
}

/** Names of the people going, as the person gave them; never accounts. */
export const peopleOf = (raw: unknown): string[] => String(raw ?? "").split(",").map((s) => s.trim()).filter(Boolean).slice(0, 30);

/** An adventure from its kept record, with the audience set on it (`life_record.audience`) when there is one. */
export function adventureOf(r: { id: string; state: string | null; body: Record<string, unknown>; audience?: unknown }): Adventure {
  const b = r.body;
  const w = typeof b.with === "string" && WITH.some((x) => x.id === b.with) ? b.with : null;
  const start = day(b.start), end = day(b.end);
  return {
    id: r.id, name: String(b.name ?? "An adventure"), tiles: tilesOf(b.tiles), with: w, done: r.state === "done", ref: str(b.ref, 60),
    place: str(b.place, 200), lat: num(b.lat, -90, 90), lon: num(b.lon, -180, 180), start, end: end && start && end >= start ? end : null,
    plan: cleanPlan(b.plan), drafted: b.drafted === true, checklist: cleanChecklist(b.checklist), budget: num(b.budget, 0, 1e7), people: peopleOf(b.people),
    audience: audienceOf("adventure", r.audience),
  };
}

/** Whole days from today to the start, or null without a start or once it has passed. */
export function daysUntil(a: Adventure, today: string): number | null {
  if (!a.start) return null;
  const n = Math.round((Date.parse(a.start) - Date.parse(today)) / 86400_000);
  return n >= 0 ? n : null;
}

/** The soonest adventure still ahead, else the newest not done. */
export function nextUp(all: readonly Adventure[], today: string): Adventure | null {
  const ahead = all.filter((a) => !a.done && daysUntil(a, today) !== null).sort((a, b) => String(a.start).localeCompare(String(b.start)));
  return ahead[0] ?? all.find((a) => !a.done) ?? null;
}

/** The adventures that touch a tile, Not yet first. */
export function adventuresIn(all: readonly Adventure[], tile: string): Adventure[] {
  return all.filter((a) => a.tiles.includes(tile)).sort((a, b) => Number(a.done) - Number(b.done) || a.name.localeCompare(b.name));
}
