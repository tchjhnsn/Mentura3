import { COLLECTIONS, itemKey, kindOf, type CollectionItem } from "@reflect/core/collections";
import { lifeRecords } from "./life-store";
import { audiobookById, coverOf } from "./audiobooks";
import { WANTED_KINDS } from "./work-space";
import type { LearnItem } from "./ways-store";

// Collections as Scholē shows them: what the person is working toward (from Work), which items they already have,
// and each item's art and length from the audiobook catalog.

/** What the person wants in Work (jobs, careers, roles and imagined work they kept), the main aim first, then newest first: the answers to "What are you working toward?". */
export async function aimsOf(userId: string): Promise<string[]> {
  const work = await lifeRecords(userId, "work").catch(() => []);
  const aims = work.filter((r) => WANTED_KINDS.has(r.kind) && r.state !== "let-go").reverse();
  // The main aim first (starred, else the newest), so the ranker serves it before the others.
  const titles = [...aims.filter((r) => r.body.main === "1"), ...aims.filter((r) => r.body.main !== "1")]
    .map((r) => String(r.kind === "imagined" ? r.body.name ?? "" : r.body.title ?? "").trim()).filter(Boolean);
  return [...new Set(titles)];
}

/** The collection keys of the things the person keeps: courses by their page, recordings by their LibriVox id. */
export function haveKeys(items: readonly LearnItem[]): Set<string> {
  const keys = new Set<string>();
  for (const i of items) {
    keys.add(`${i.medium}|${i.title.toLowerCase()}`);
    if (!i.url) continue;
    const ab = /\/audiobooks\/(\d+)/.exec(i.url);
    if (ab) keys.add(`audiobook:${ab[1]}`);
    for (const c of COLLECTIONS) for (const x of c.items) {
      if (x.kind === "course" && i.url.replace(/\/$/, "") === x.url.replace(/\/$/, "")) keys.add(itemKey(x));
      if (x.kind === "audiobook" && (i.url.includes(`/audiobooks/${x.id}`) || new RegExp(`[?&/=]${x.id}(\\D|$)`).test(i.url) && /librivox/.test(i.url))) keys.add(itemKey(x));
    }
  }
  return keys;
}

export type ItemArt = { image: string | null; seconds: number | null; kind: string };

/** An item's cover and length: recordings from the catalog, courses with neither (they show a type tile). */
export function artOf(i: CollectionItem): ItemArt {
  if (i.kind === "audiobook") {
    const a = audiobookById(i.id);
    return { image: a ? coverOf(a) : null, seconds: a?.seconds || null, kind: kindOf(i) };
  }
  return { image: i.kind === "episode" ? i.image : i.kind === "find" ? i.image ?? null : null, seconds: null, kind: kindOf(i) };
}

/** A collection's size and the kinds it holds, in the order they first appear: "15 items · audiobooks, podcasts, lectures, art". */
export function sizeLine(items: readonly CollectionItem[]): string {
  const plural: Record<string, string> = { Audiobook: "audiobooks", Course: "courses", "Podcast episode": "podcasts", Film: "film", Lecture: "lectures", Debate: "debates", Discussion: "discussions", Music: "music", Art: "art", Play: "a play", Game: "games" };
  const kinds = [...new Set(items.map(kindOf))].map((k) => plural[k] ?? k.toLowerCase());
  return `${items.length} items · ${kinds.join(", ")}`;
}
