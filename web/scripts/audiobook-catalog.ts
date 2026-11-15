// Reflect: LibriVox's recordings, in every language, with what a listener browses by (Torian, 2026-11-15 08:24Z, audiobooks
// first): length, LibriVox's genres, how many readers (one, many) and whether it is a dramatic reading, and how often
// each is downloaded from the Internet Archive (the only measure of interest either offers). Writes
// src/data/audiobooks.txt, one recording a line:
//   id|title|author|seconds|readers|dramatic(0/1)|downloads|genre;genre|language|archive item
// Run: npx tsx scripts/audiobook-catalog.ts (about ten minutes; LibriVox's API is slow).
import { writeFileSync } from "node:fs";

const UA = { headers: { "user-agent": "reflect-app" } };
const cell = (s: string) => s.replace(/[|\n\r;]+/g, " ").replace(/\s+/g, " ").trim();

type Book = {
  id?: string; title?: string; language?: string; totaltimesecs?: number; url_iarchive?: string;
  authors?: { first_name?: string; last_name?: string }[]; genres?: { name?: string }[];
  sections?: { readers?: { reader_id?: string }[] }[];
};

const downloads = new Map<string, number>();
const ia = await fetch("https://archive.org/advancedsearch.php?q=collection%3Alibrivoxaudio&fl%5B%5D=identifier&fl%5B%5D=downloads&rows=40000&output=json", UA);
for (const d of ((await ia.json()) as { response: { docs: { identifier: string; downloads?: number }[] } }).response.docs) downloads.set(d.identifier, d.downloads ?? 0);
console.log(`archive: ${downloads.size} items`);

const out: string[] = [];
for (let offset = 0; ; offset += 200) {
  let body: { books?: Book[] } = {};
  for (let tries = 0; tries < 4; tries++) {
    const r = await fetch(`https://librivox.org/api/feed/audiobooks?format=json&extended=1&limit=200&offset=${offset}`, UA).catch(() => null);
    body = r ? ((await r.json().catch(() => ({}))) as { books?: Book[] }) : {};
    if (body.books) break;
    await new Promise((res) => setTimeout(res, 3000 * (tries + 1)));
  }
  if (!body.books?.length) break;
  for (const b of body.books) {
    if (!b.id || !b.title) continue;
    const readers = new Set((b.sections ?? []).flatMap((s) => (s.readers ?? []).map((x) => x.reader_id)).filter(Boolean)).size;
    const genres = (b.genres ?? []).map((g) => cell(g.name ?? "")).filter(Boolean);
    const dramatic = genres.some((g) => /dramatic/i.test(g)) || /dramatic reading/i.test(b.title) ? 1 : 0;
    const item = (b.url_iarchive ?? "").match(/\/details\/([^/?#]+)/)?.[1] ?? "";
    const by = (b.authors ?? []).map((a) => `${a.first_name ?? ""} ${a.last_name ?? ""}`.trim()).join(", ");
    out.push([b.id, cell(b.title), cell(by), b.totaltimesecs ?? 0, readers, dramatic, downloads.get(item) ?? 0, genres.join(";"), cell(b.language ?? ""), item].join("|"));
  }
  if (offset % 2000 === 0) console.log(`librivox: ${offset} read, ${out.length} kept`);
}
writeFileSync(new URL("../src/data/audiobooks.txt", import.meta.url), out.join("\n") + "\n");
console.log(`audiobooks: ${out.length} recordings`);
