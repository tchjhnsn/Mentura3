/**
 * Scholē's knowledge types and the crafts catalogue (doc "Crafts catalogue" and "Scholē landing design guide",
 * Torian, 2026-11-19: "Let's go with your recommendations and continue").
 *
 * Three doors after Aristotle's division of knowledge by its end (Metaphysics VI.1; Nicomachean Ethics VI.2):
 * making (technē), doing (phronēsis) and knowing (epistēmē, nous, sophia), with experience (empeiria,
 * Metaphysics I.1) under all three. Their names rotate through six languages.
 *
 * The craft groups follow Hugh of St Victor's seven mechanical arts (Didascalicon II.20-27), with Vasari's arts of
 * design and a modern technical group for what he did not cover. Contests are crafts under theatrica.
 *
 * Interest comes before naming: short activities a person likes or not, after the O*NET Interest Profiler's method
 * (US Department of Labor), each tagged with a Holland interest type. Stage is the Dreyfus five-stage model.
 * Pure data and arithmetic: no I/O.
 */

import photos from "./craft-photos.json" with { type: "json" };
export { FIRST_PROJECTS, firstProjectOf, type FirstProject } from "./craft-projects";

export type Lang = "en" | "el" | "he" | "la" | "fr" | "de";
/** A name in one language, with a transliteration where the script is not Latin. */
export type Name = { lang: Lang; text: string; say?: string };

export type DoorId = "making" | "doing" | "knowing";
export type Door = { id: DoorId; label: string; names: readonly Name[]; line: string; about: string; source: string };

export const DOORS: readonly Door[] = [
  {
    id: "making", label: "Making",
    names: [{ lang: "en", text: "Making" }, { lang: "el", text: "τέχνη", say: "technē" }, { lang: "he", text: "מְלָאכָה", say: "melakhah" }, { lang: "la", text: "ars" }, { lang: "fr", text: "le métier" }, { lang: "de", text: "das Handwerk" }],
    line: "Ten craft groups, cooking to circuits",
    about: "Craft: making things, with a grasp of why it works.",
    source: "Nicomachean Ethics VI.4; Exodus 31:3-6",
  },
  {
    id: "doing", label: "Doing",
    names: [{ lang: "en", text: "Doing" }, { lang: "el", text: "φρόνησις", say: "phronēsis" }, { lang: "he", text: "תְּבוּנָה", say: "tevunah" }, { lang: "la", text: "prudentia" }, { lang: "fr", text: "la prudence" }, { lang: "de", text: "die Klugheit" }],
    line: "Living well: household, polis, qualities",
    about: "Practical wisdom: judging well how to live, at home and in the polis.",
    source: "Nicomachean Ethics VI.5; Proverbs 24:3",
  },
  {
    id: "knowing", label: "Knowing",
    names: [{ lang: "en", text: "Knowing" }, { lang: "el", text: "ἐπιστήμη", say: "epistēmē" }, { lang: "he", text: "דַּעַת", say: "da'at" }, { lang: "la", text: "scientia" }, { lang: "fr", text: "le savoir" }, { lang: "de", text: "das Wissen" }],
    line: "Science and wisdom: courses and dialectic",
    about: "Science and wisdom: knowing what is so, and why, for its own sake.",
    source: "Nicomachean Ethics VI.3, 6-7; Proverbs 1:7",
  },
];
export const doorOf = (id: string) => DOORS.find((d) => d.id === id);

export type GroupId = "food" | "growing" | "building" | "materials" | "textiles" | "fine-arts" | "technical" | "healing" | "trade" | "performance";
export type CraftGroup = { id: GroupId; label: string; latin?: string; after: string; work: readonly string[] };

export const CRAFT_GROUPS: readonly CraftGroup[] = [
  { id: "food", label: "Food and drink", latin: "venatio", after: "Hugh's hunting art, which includes preparing food", work: ["Cooks", "Bakers", "Butchers and Meat Cutters", "Chefs and Head Cooks"] },
  { id: "growing", label: "Growing and animals", latin: "agricultura", after: "Hugh's art of agriculture", work: ["Farmers, Ranchers, and Other Agricultural Managers", "Landscaping and Groundskeeping Workers", "Farriers"] },
  { id: "building", label: "Building", latin: "armatura", after: "the building half of Hugh's armament", work: ["Carpenters", "Brickmasons and Blockmasons", "Plumbers", "Electricians"] },
  { id: "materials", label: "Materials", latin: "armatura", after: "the forging half of Hugh's armament", work: ["Welders", "Jewelers", "Potters", "Bookbinders"] },
  { id: "textiles", label: "Textiles", latin: "lanificium", after: "Hugh's art of fabric making", work: ["Tailors, Dressmakers, and Custom Sewers", "Upholsterers", "Shoe and Leather Workers"] },
  { id: "fine-arts", label: "Fine arts", after: "Vasari's arts of design (painting, sculpture, architecture)", work: ["Fine Artists", "Photographers", "Architects", "Graphic Designers"] },
  { id: "technical", label: "Technical", after: "machines and computing, after Hugh's list", work: ["Electrical and Electronics Repairers", "Software Developers", "Machinists", "Automotive Service Technicians"] },
  { id: "healing", label: "Healing and care", latin: "medicina", after: "Hugh's art of medicine", work: ["Home Health Aides", "Massage Therapists", "Barbers", "Childcare Workers"] },
  { id: "trade", label: "Trade and travel", latin: "navigatio", after: "Hugh's art of commerce and travel", work: ["Sales Representatives", "Bookkeeping Clerks", "Ship Captains", "Heavy Truck Drivers"] },
  { id: "performance", label: "Performance and contest", latin: "theatrica", after: "Hugh's art of shows, games and contests", work: ["Musicians and Singers", "Dancers", "Actors", "Athletes and Sports Competitors", "Coaches and Scouts"] },
];
export const groupOf = (id: string) => CRAFT_GROUPS.find((g) => g.id === id);

export type Craft = { id: string; label: string; group: GroupId };

const LIST: Record<GroupId, readonly string[]> = {
  food: ["Cooking", "Baking", "Pastry", "Butchery", "Charcuterie", "Cheesemaking", "Brewing", "Winemaking", "Distilling", "Fermenting", "Preserving and canning", "Coffee roasting", "Hunting", "Fishing"],
  growing: ["Gardening", "Vegetable farming", "Orchard keeping", "Viticulture", "Beekeeping", "Animal husbandry", "Dairying", "Horsemanship", "Farriery", "Dog training", "Forestry", "Landscaping", "Floristry"],
  building: ["Carpentry", "Joinery", "Cabinetmaking", "Timber framing", "Masonry", "Bricklaying", "Stonecutting", "Plastering", "Roofing", "Tiling", "Plumbing", "Electrical wiring", "Painting and decorating"],
  materials: ["Blacksmithing", "Welding", "Metal casting", "Jewellery", "Woodturning", "Woodcarving", "Leatherwork", "Saddlery", "Pottery", "Glassblowing", "Stained glass", "Bookbinding", "Basketry"],
  textiles: ["Sewing", "Tailoring", "Dressmaking", "Weaving", "Spinning", "Knitting", "Crochet", "Embroidery", "Quilting", "Dyeing", "Upholstery", "Shoemaking", "Hatmaking"],
  "fine-arts": ["Drawing", "Painting", "Sculpture", "Printmaking", "Calligraphy", "Illumination", "Photography", "Film-making", "Architecture", "Graphic design", "Illustration"],
  technical: ["Electronics", "Circuit design", "Soldering", "Programming", "Web development", "Data analysis", "Networking", "Machining", "Engine repair", "Auto mechanics", "HVAC", "Drafting", "3D printing", "Robotics"],
  healing: ["First aid", "Caregiving", "Nursing care", "Midwifery", "Massage", "Herbalism", "Barbering", "Hairdressing", "Cosmetology", "Childcare"],
  trade: ["Sailing", "Navigation", "Boatbuilding", "Selling", "Merchandising", "Bookkeeping", "Negotiating", "Driving", "Trucking", "Logistics"],
  performance: ["Singing", "Instrument playing", "Composing", "Dance", "Acting", "Storytelling", "Juggling", "Boxing", "Wrestling", "Martial arts", "Fencing", "Archery", "Marksmanship", "Horse riding"],
};
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export const CRAFTS: readonly Craft[] = CRAFT_GROUPS.flatMap((g) => LIST[g.id].map((label) => ({ id: slug(label), label, group: g.id })));
export const craftOf = (id: string) => CRAFTS.find((c) => c.id === id);
export const craftsIn = (g: GroupId) => CRAFTS.filter((c) => c.group === g);
/** Crafts whose training belongs to the Fitness tile too: their end is the performance itself. */
export const CONTESTS: readonly string[] = ["boxing", "wrestling", "martial-arts", "fencing", "archery", "marksmanship", "horse-riding", "dance"];

/** How a craft was learned, all counted equally (Metaphysics I.1: experience often succeeds better than theory alone). */
export const LEARNED = [
  { id: "experience", label: "Experience" },
  { id: "apprenticeship", label: "Apprenticeship" },
  { id: "practice", label: "Practice on my own" },
  { id: "school", label: "School or a course" },
] as const;
export type Learned = (typeof LEARNED)[number]["id"];

/** Dreyfus and Dreyfus, "A Five-Stage Model of the Mental Activities Involved in Directed Skill Acquisition" (1980). */
export const STAGES = [
  { id: "novice", label: "Novice" },
  { id: "advanced-beginner", label: "Advanced beginner" },
  { id: "competent", label: "Competent" },
  { id: "proficient", label: "Proficient" },
  { id: "expert", label: "Expert" },
] as const;
export type Stage = (typeof STAGES)[number]["id"];
export const stageIndex = (s: string | undefined) => STAGES.findIndex((x) => x.id === s);

/** A craft's place for the person, after Already and Not yet: drawn to it and trying it are Not yet. */
export const CRAFT_STATES = [
  { id: "drawn", label: "Drawn to it", already: false },
  { id: "trying", label: "Trying it", already: false },
  { id: "practising", label: "Practising", already: true },
] as const;
export type CraftState = (typeof CRAFT_STATES)[number]["id"];
export const isAlready = (s: string | null | undefined) => s === "practising";

/** Holland's six interest types, as the O*NET Interest Profiler names them, in plain words. */
export const HOLLAND = {
  R: { label: "Realistic", plain: "hands-on work with tools, materials and animals" },
  I: { label: "Investigative", plain: "working out how things work" },
  A: { label: "Artistic", plain: "making things that express something" },
  S: { label: "Social", plain: "helping, teaching and caring for people" },
  E: { label: "Enterprising", plain: "leading, persuading and trading" },
  C: { label: "Conventional", plain: "keeping things orderly and exact" },
} as const;
export type Holland = keyof typeof HOLLAND;

export type Activity = { id: string; text: string; crafts: readonly string[]; type: Holland };

/** Thirty short activities across the ten groups, each pointing at the crafts it belongs to. */
export const ACTIVITIES: readonly Activity[] = [
  { id: "cook-a-meal", text: "Cook a meal for friends", crafts: ["cooking"], type: "R" },
  { id: "knead-a-loaf", text: "Knead and bake a loaf of bread", crafts: ["baking", "pastry"], type: "R" },
  { id: "brew-a-batch", text: "Brew a batch of beer or cider", crafts: ["brewing", "fermenting", "winemaking"], type: "R" },
  { id: "cast-a-line", text: "Cast a line on a quiet river", crafts: ["fishing", "hunting"], type: "R" },
  { id: "plant-a-bed", text: "Plant and tend a vegetable bed", crafts: ["gardening", "vegetable-farming"], type: "R" },
  { id: "keep-bees", text: "Open a hive and check the bees", crafts: ["beekeeping", "animal-husbandry"], type: "R" },
  { id: "train-a-dog", text: "Teach a dog to come when called", crafts: ["dog-training", "horsemanship"], type: "S" },
  { id: "plane-a-board", text: "Plane a rough board smooth", crafts: ["carpentry", "joinery", "cabinetmaking"], type: "R" },
  { id: "cut-a-joint", text: "Cut a dovetail joint by hand", crafts: ["joinery", "cabinetmaking", "timber-framing"], type: "R" },
  { id: "lay-bricks", text: "Lay a course of bricks straight and level", crafts: ["bricklaying", "masonry", "stonecutting"], type: "R" },
  { id: "fix-a-tap", text: "Fix a leaking tap", crafts: ["plumbing"], type: "R" },
  { id: "wire-a-light", text: "Wire a light switch safely", crafts: ["electrical-wiring", "electronics"], type: "R" },
  { id: "forge-a-hook", text: "Forge a hook at an anvil", crafts: ["blacksmithing", "metal-casting", "welding"], type: "R" },
  { id: "throw-a-pot", text: "Throw a pot on a wheel", crafts: ["pottery"], type: "A" },
  { id: "carve-a-spoon", text: "Carve a spoon from green wood", crafts: ["woodcarving", "woodturning"], type: "A" },
  { id: "sew-a-shirt", text: "Sew a shirt from a pattern", crafts: ["sewing", "tailoring", "dressmaking"], type: "A" },
  { id: "knit-a-scarf", text: "Knit a scarf", crafts: ["knitting", "crochet", "spinning", "weaving"], type: "A" },
  { id: "draw-a-face", text: "Draw a face from life", crafts: ["drawing", "painting", "illustration"], type: "A" },
  { id: "shape-clay", text: "Shape a figure in clay", crafts: ["sculpture", "pottery"], type: "A" },
  { id: "take-a-photo", text: "Take a portrait in good light", crafts: ["photography", "film-making"], type: "A" },
  { id: "solder-a-circuit", text: "Solder a small circuit that blinks", crafts: ["soldering", "electronics", "circuit-design"], type: "I" },
  { id: "write-a-program", text: "Write a program that does a chore for you", crafts: ["programming", "web-development", "data-analysis"], type: "I" },
  { id: "fix-an-engine", text: "Find why an engine will not start", crafts: ["engine-repair", "auto-mechanics", "machining"], type: "I" },
  { id: "dress-a-wound", text: "Clean and dress a wound", crafts: ["first-aid", "nursing-care", "caregiving"], type: "S" },
  { id: "cut-hair", text: "Give someone a good haircut", crafts: ["barbering", "hairdressing", "cosmetology"], type: "S" },
  { id: "sell-at-market", text: "Sell what you made at a market stall", crafts: ["selling", "merchandising", "negotiating"], type: "E" },
  { id: "keep-the-books", text: "Keep a small business's books", crafts: ["bookkeeping", "logistics"], type: "C" },
  { id: "sail-a-boat", text: "Sail a small boat across a lake", crafts: ["sailing", "navigation", "boatbuilding"], type: "R" },
  { id: "play-a-song", text: "Play a song for people", crafts: ["instrument-playing", "singing", "composing"], type: "A" },
  { id: "spar-a-round", text: "Spar a round in a boxing gym", crafts: ["boxing", "wrestling", "martial-arts"], type: "R" },
  { id: "hit-the-target", text: "Hit the centre of a target", crafts: ["archery", "marksmanship"], type: "R" },
  { id: "tell-a-story", text: "Tell a story that holds a room", crafts: ["storytelling", "acting"], type: "A" },
];
export const activityOf = (id: string) => ACTIVITIES.find((a) => a.id === id);

export type Answer = "like" | "unsure" | "not";
export type DiscoveryResult = {
  crafts: { craft: Craft; because: Activity[] }[];
  groups: CraftGroup[];
  type: Holland | null;
  answered: number;
};

/** What drew the person: crafts ranked by how many liked activities point at them, the leading groups, the leading type. */
export function discover(answers: Record<string, Answer>): DiscoveryResult {
  const liked = ACTIVITIES.filter((a) => answers[a.id] === "like");
  const by = new Map<string, Activity[]>();
  for (const a of liked) for (const c of a.crafts) by.set(c, [...(by.get(c) ?? []), a]);
  const crafts = [...by.entries()]
    .map(([id, because]) => ({ craft: craftOf(id)!, because }))
    .filter((x) => x.craft)
    .sort((a, b) => b.because.length - a.because.length || CRAFTS.indexOf(a.craft) - CRAFTS.indexOf(b.craft));
  const score = new Map<GroupId, number>();
  for (const x of crafts) score.set(x.craft.group, (score.get(x.craft.group) ?? 0) + x.because.length);
  const groups = [...score.entries()].sort((a, b) => b[1] - a[1]).map(([g]) => groupOf(g)!).slice(0, 2);
  const types = new Map<Holland, number>();
  for (const a of liked) types.set(a.type, (types.get(a.type) ?? 0) + 1);
  const type = [...types.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  return { crafts, groups, type, answered: Object.keys(answers).filter((k) => activityOf(k)).length };
}

/** Answers kept as three comma lists (the record keeps text fields), read back and written. */
export function answersFrom(body: { likes?: unknown; unsure?: unknown; nots?: unknown }): Record<string, Answer> {
  const out: Record<string, Answer> = {};
  const read = (v: unknown, a: Answer) => { for (const id of String(v ?? "").split(",").map((s) => s.trim()).filter((s) => activityOf(s))) out[id] = a; };
  read(body.likes, "like");
  read(body.unsure, "unsure");
  read(body.nots, "not");
  return out;
}
export function answersBody(answers: Record<string, Answer>): { likes: string; unsure: string; nots: string } {
  const of = (a: Answer) => Object.entries(answers).filter(([k, v]) => v === a && activityOf(k)).map(([k]) => k).join(",");
  return { likes: of("like"), unsure: of("unsure"), nots: of("not") };
}
/** The next activity not yet answered, in catalogue order. */
export const nextActivity = (answers: Record<string, Answer>) => ACTIVITIES.find((a) => !answers[a.id]) ?? null;
/** Discovery shows a result once this many are answered. */
export const ENOUGH = 8;

/* ---------- The photo picker (Scholē picker design guide: worlds, then crafts, then three matches). ---------- */


/** A world is a craft group under a warmer display name, for the picker's first screen. */
export type World = { id: GroupId; name: string };
export const WORLDS: readonly World[] = [
  { id: "food", name: "Food and drink" },
  { id: "growing", name: "Plants and animals" },
  { id: "building", name: "Building" },
  { id: "materials", name: "Wood, metal and clay" },
  { id: "textiles", name: "Fibre and fabric" },
  { id: "fine-arts", name: "Art and image" },
  { id: "technical", name: "Machines and code" },
  { id: "healing", name: "Healing and care" },
  { id: "trade", name: "Travel and trade" },
  { id: "performance", name: "Stage and sport" },
];
export const worldName = (g: string) => WORLDS.find((w) => w.id === g)?.name ?? groupOf(g)?.label ?? g;

/** A lead photo from Wikipedia (mostly Wikimedia Commons, free licence), with the page to credit. */
export type CraftPhoto = { src: string; page: string };
const PHOTOS = photos as Record<string, CraftPhoto>;
export const craftPhoto = (id: string): CraftPhoto | undefined => PHOTOS[id];
export const worldPhoto = (g: string): CraftPhoto | undefined => PHOTOS[`world:${g}`];

const order = (id: string) => CRAFTS.findIndex((c) => c.id === id);
const sharedActivities = (a: string, b: string) => ACTIVITIES.filter((x) => x.crafts.includes(a) && x.crafts.includes(b)).length;

/** Up to four crafts most like this one: same group or sharing an activity, most shared activities first, then contests with contests. */
export function related(id: string): string[] {
  const self = craftOf(id);
  if (!self) return [];
  const near = new Set<string>(craftsIn(self.group).map((c) => c.id));
  for (const a of ACTIVITIES) if (a.crafts.includes(id)) for (const c of a.crafts) near.add(c);
  near.delete(id);
  return [...near]
    .filter((c) => craftOf(c))
    .map((c) => ({ c, shared: sharedActivities(id, c), same: craftOf(c)!.group === self.group ? 1 : 0, kind: CONTESTS.includes(c) === CONTESTS.includes(id) ? 1 : 0 }))
    .sort((a, b) => b.shared - a.shared || b.same - a.same || b.kind - a.kind || order(a.c) - order(b.c))
    .slice(0, 4)
    .map((x) => x.c);
}

export type Match = { id: string; because: string[] };
export type MatchResult = { top: Match[]; surprise: { id: string; because: string } | null };

/**
 * Three matches from the crafts a person picked: 3 points for a picked craft, 1 for each pick it is related to.
 * Ties go to picked crafts, then the closest relation, then catalogue order. `because` lists the picked craft ids that led to it (a picked
 * craft lists itself first). The surprise is the best match outside every picked group, else the first craft of an
 * unpicked world.
 */
export function matchCrafts(picks: readonly string[]): MatchResult {
  const picked = [...new Set(picks)].filter((p) => craftOf(p));
  const isPicked = new Set(picked);
  const why = new Map<string, string[]>();
  const score = new Map<string, number>();
  const nearest = new Map<string, number>();
  for (const p of picked) {
    score.set(p, (score.get(p) ?? 0) + 3);
    why.set(p, [p, ...(why.get(p) ?? [])]);
    for (const [i, r] of related(p).entries()) {
      score.set(r, (score.get(r) ?? 0) + 1);
      nearest.set(r, Math.min(nearest.get(r) ?? 9, i));
      why.set(r, [...(why.get(r) ?? []), p]);
    }
  }
  const ranked = CRAFTS.map((c) => c.id).sort(
    (a, b) => (score.get(b) ?? 0) - (score.get(a) ?? 0) || Number(isPicked.has(b)) - Number(isPicked.has(a)) ||
      (nearest.get(a) ?? 9) - (nearest.get(b) ?? 9) || order(a) - order(b),
  );
  const top = ranked.slice(0, 3).map((id) => ({ id, because: why.get(id) ?? [] }));
  const pickedGroups = new Set(picked.map((p) => craftOf(p)!.group));
  const topIds = new Set(top.map((t) => t.id));
  const near = ranked.find((id) => (score.get(id) ?? 0) > 0 && !topIds.has(id) && !pickedGroups.has(craftOf(id)!.group));
  if (near) return { top, surprise: { id: near, because: `Close to ${craftOf(why.get(near)![0]!)!.label}` } };
  // Varied but stable: the picks choose which unpicked world, and which of its crafts, the surprise comes from.
  const seed = [...picked].sort().join(",").split("").reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7);
  const open = WORLDS.filter((w) => !pickedGroups.has(w.id));
  const world = open.at(seed % Math.max(1, open.length));
  const pool = world ? craftsIn(world.id).filter((c) => !topIds.has(c.id)) : [];
  const first = pool.at(Math.floor(seed / 7) % Math.max(1, pool.length));
  return { top, surprise: first && world ? { id: first.id, because: `Something new: ${world.name}` } : null };
}
