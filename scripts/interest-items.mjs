// Builds packages/core/src/interest-items.json from scripts/interest-seed.json: the real books, podcast shows and
// musicians the Get to know you picker shows (design guide "Get to know you: person dashboard", 2026-11-19).
// Books: Open Library (cover, work page) and the author's Wikipedia page. Podcasts: Apple's podcast search (artwork,
// feed, page). Music: the musician's Wikipedia page (lead photo, one line). Run from the repo root with Node 22.18+:
// node scripts/interest-items.mjs
import { readFileSync, writeFileSync } from "node:fs";

const seed = JSON.parse(readFileSync("scripts/interest-seed.json", "utf8"));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
/** JSON from a URL, tried up to four times with a growing pause (Wikipedia answers 429 to quick runs). */
const get = async (u) => {
  for (let i = 0; i < 4; i++) {
    try {
      const r = await fetch(u, { headers: { "user-agent": "reflect-interest-items/1.0" } });
      if (r.ok) return await r.json();
      if (r.status === 404) return null;
    } catch { /* try again */ }
    await wait(800 * (i + 1));
  }
  return null;
};
const slug = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
const wiki = async (title) => {
  const j = await get(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/ /g, "_"))}`);
  if (!j || j.type === "disambiguation") return null;
  // A lead image that is a signature or a drawing (SVG) is no picture of the person; a tinted tile is better.
  const img = j.thumbnail?.source ?? null;
  return { name: j.title, line: j.description ?? null, image: img && !/ignature|\.svg/i.test(img) ? img : null, page: j.content_urls?.desktop?.page ?? null };
};
// --only music (or books, podcasts) rebuilds that area and keeps the others as they are.
const only = process.argv.includes("--only") ? process.argv[process.argv.indexOf("--only") + 1] : null;
const kept = only ? JSON.parse(readFileSync("packages/core/src/interest-items.json", "utf8")).filter((x) => x.area !== only) : [];
const out = [];
for (const [title, by, tags] of only && only !== "books" ? [] : seed.books) {
  const j = await get(`https://openlibrary.org/search.json?title=${encodeURIComponent(title)}&author=${encodeURIComponent(by)}&limit=1&fields=key,cover_i,first_publish_year`);
  const d = j?.docs?.[0];
  const person = await wiki(by);
  out.push({ id: `b-${slug(title)}`, area: "books", title, by, tags: tags.split(","), image: d?.cover_i ? `https://covers.openlibrary.org/b/id/${d.cover_i}-M.jpg` : null, link: d?.key ? `https://openlibrary.org${d.key}` : null, year: d?.first_publish_year ?? null, people: person ? [{ ...person, role: "author" }] : [] });
  process.stdout.write(d?.cover_i ? "." : "x");
}
for (const [title, by, tags] of only && only !== "podcasts" ? [] : seed.podcasts) {
  const j = await get(`https://itunes.apple.com/search?term=${encodeURIComponent(title)}&media=podcast&entity=podcast&limit=3`);
  const d = j?.results?.find((r) => r.collectionName?.toLowerCase().includes(title.toLowerCase().slice(0, 12))) ?? j?.results?.[0];
  out.push({ id: `p-${slug(title)}`, area: "podcasts", title, by, tags: tags.split(","), image: d?.artworkUrl600 ?? null, link: d?.collectionViewUrl?.split("?")[0] ?? null, feed: d?.feedUrl ?? null, people: [] });
  process.stdout.write(d ? "." : "x");
}
for (const [name, page, tags] of only && only !== "music" ? [] : seed.music) {
  await wait(250);
  const w = await wiki(page || name);
  out.push({ id: `m-${slug(name)}`, area: "music", title: name, by: w?.line ?? "", tags: tags.split(","), image: w?.image ?? null, link: w?.page ?? null, people: w ? [{ ...w, role: "musician" }] : [] });
  process.stdout.write(w?.image ? "." : "x");
}
const all = [...kept.filter((x) => x.area === "books"), ...out.filter((x) => x.area === "books"), ...kept.filter((x) => x.area === "podcasts"), ...out.filter((x) => x.area === "podcasts"), ...kept.filter((x) => x.area === "music"), ...out.filter((x) => x.area === "music")];
writeFileSync("packages/core/src/interest-items.json", JSON.stringify(all, null, 1) + "\n");
console.log(`\n${all.length} items, ${all.filter((x) => !x.image).length} without an image`);
