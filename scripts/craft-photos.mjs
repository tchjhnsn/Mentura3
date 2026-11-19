// Builds packages/core/src/craft-photos.json: a Wikipedia lead photo and page for every craft and world in
// packages/core/src/crafts.ts. Run with Node 22.18+ from the repo root: node scripts/craft-photos.mjs
// Lead images are mostly Wikimedia Commons free-licence files; `page` is kept for credit.
import { writeFileSync } from "node:fs";
import { register } from "node:module";

// packages/core imports siblings without an extension (the bundler resolves them); let Node find the .ts file.
register(`data:text/javascript,${encodeURIComponent(`
export async function resolve(spec, ctx, next) {
  try { return await next(spec, ctx); }
  catch (e) { if (spec.startsWith(".") && !/\\.[a-z]+$/.test(spec)) return next(spec + ".ts", ctx); throw e; }
}`)}`);
const { CRAFTS, WORLDS } = await import("../packages/core/src/crafts.ts");

/** Wikipedia titles where the craft label is ambiguous or its page has no lead image. */
const TITLES = {
  acting: "Theatre",
  bookkeeping: "Ledger",
  "data-analysis": "Data visualization",
  spinning: "Spinning wheel",
  tiling: "Tile",
  cooking: "Cooking",
  pastry: "Pastry",
  "preserving-and-canning": "Home canning",
  "coffee-roasting": "Coffee roasting",
  "vegetable-farming": "Vegetable farming",
  "orchard-keeping": "Orchard",
  "animal-husbandry": "Animal husbandry",
  dairying: "Dairy farming",
  horsemanship: "Horse training",
  farriery: "Farrier",
  "dog-training": "Dog training",
  landscaping: "Landscaping",
  joinery: "Joinery",
  cabinetmaking: "Cabinetry",
  "timber-framing": "Timber framing",
  stonecutting: "Stonemasonry",
  plastering: "Plasterwork",
  roofing: "Roofer",
  plumbing: "Plumbing",
  "electrical-wiring": "Electrical wiring",
  "painting-and-decorating": "House painter and decorator",
  jewellery: "Jewellery",
  leatherwork: "Leather crafting",
  saddlery: "Saddle",
  tailoring: "Tailor",
  dressmaking: "Dressmaker",
  upholstery: "Upholstery",
  shoemaking: "Shoemaking",
  hatmaking: "Hatmaking",
  painting: "Painting",
  illumination: "Illuminated manuscript",
  "film-making": "Filmmaking",
  electronics: "Electronics",
  "circuit-design": "Breadboard",
  programming: "Programmer",
  "web-development": "Website",
  networking: "Computer network",
  machining: "Machining",
  "engine-repair": "Internal combustion engine",
  "auto-mechanics": "Auto mechanic",
  hvac: "Heating, ventilation, and air conditioning",
  drafting: "Technical drawing",
  "3d-printing": "3D printing",
  "first-aid": "First aid",
  caregiving: "Caregiver",
  "nursing-care": "Nursing",
  barbering: "Barber",
  hairdressing: "Hairdresser",
  sailing: "Sailing",
  navigation: "Navigation",
  selling: "Sales",
  merchandising: "Visual merchandising",
  negotiating: "Negotiation",
  driving: "Driving",
  trucking: "Truck driver",
  "instrument-playing": "Musical instrument",
  composing: "Musical composition",
  dance: "Dance",
  "martial-arts": "Karate",
  fencing: "Fencing",
  marksmanship: "Shooting sport",
  "horse-riding": "Equestrianism",
};

/** The craft whose photo stands for each world. */
const WORLD_COVER = {
  food: "baking", growing: "gardening", building: "carpentry", materials: "pottery", textiles: "weaving",
  "fine-arts": "painting", technical: "electronics", healing: "massage", trade: "sailing", performance: "dance",
};

const UA = "reflect-app (craft photo index)";
async function summary(title) {
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/ /g, "_"))}?redirect=true`;
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" } });
    if (res.status === 429) { await new Promise((r) => setTimeout(r, 2000 * (attempt + 1))); continue; }
    if (!res.ok) return null;
    const j = await res.json();
    const src = j.thumbnail?.source ?? j.originalimage?.source;
    const page = j.content_urls?.desktop?.page;
    return src && page ? { src, page } : null;
  }
  return null;
}

const out = {};
const misses = [];
for (const c of CRAFTS) {
  const got = await summary(TITLES[c.id] ?? c.label);
  if (got) out[c.id] = got; else misses.push(`${c.id} (${TITLES[c.id] ?? c.label})`);
  await new Promise((r) => setTimeout(r, 250));
}
for (const w of WORLDS) {
  const cover = out[WORLD_COVER[w.id]] ?? Object.entries(out).find(([id]) => CRAFTS.find((c) => c.id === id)?.group === w.id)?.[1];
  if (cover) out[`world:${w.id}`] = cover; else misses.push(`world:${w.id}`);
}
writeFileSync(new URL("../packages/core/src/craft-photos.json", import.meta.url), JSON.stringify(out, null, 2) + "\n");
console.log(`${Object.keys(out).length - WORLDS.length}/${CRAFTS.length} crafts, misses: ${misses.join(", ") || "none"}`);
