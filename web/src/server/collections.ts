import { COLLECTIONS, itemKey, type CollectionItem } from "@reflect/core/collections";
import { lifeRecords } from "./life-store";
import { audiobookById, coverOf } from "./audiobooks";
import { WANTED_KINDS } from "./work-space";
import type { LearnItem } from "./ways-store";

// Collections as Scholē shows them: what the person is working toward (from Work), which items they already have,
// and each item's art and length from the audiobook catalog.

/** What the person wants in Work (jobs, careers and imagined work they kept), newest first: the answers to "What are you working toward?". */
export async function aimsOf(userId: string): Promise<string[]> {
  const work = await lifeRecords(userId, "work").catch(() => []);
  const titles = work.filter((r) => WANTED_KINDS.has(r.kind) && r.state !== "let-go").reverse()
    .map((r) => String(r.kind === "imagined" ? r.body.name ?? "" : r.body.title ?? "").trim()).filter(Boolean);
  return [...new Set(titles)];
}

/** The collection keys of the things the person keeps: courses by their page, recordings by their LibriVox id. */
export function haveKeys(items: readonly LearnItem[]): Set<string> {
  const keys = new Set<string>();
  for (const i of items) {
    if (!i.url) continue;
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
  if (i.kind === "course") return { image: null, seconds: null, kind: "Course" };
  const a = audiobookById(i.id);
  return { image: a ? coverOf(a) : null, seconds: a?.seconds || null, kind: "Audiobook" };
}

/** A collection's length in hours, counting the recordings (courses add their lectures, not counted here), and its size. */
export function sizeLine(items: readonly CollectionItem[]): string {
  const seconds = items.reduce((n, i) => n + (artOf(i).seconds ?? 0), 0);
  const hours = Math.round(seconds / 3600);
  const courses = items.filter((i) => i.kind === "course").length;
  return [hours ? `${hours} hours` : null, courses ? `${courses} ${courses === 1 ? "course" : "courses"}` : null, `${items.length} items`].filter(Boolean).join(" · ");
}
