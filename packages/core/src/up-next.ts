/**
 * Up next on a watch page (Torian, 2026-11-16 18:45Z: "It should look like you're on YouTube preparing to watch a
 * video"): the other recordings beside this one on the shelves and playlists that hold it, in their order starting
 * after it, then from the top. Pure: no I/O.
 */
import { COLLECTIONS, itemKey, type CollectionItem } from "./collections";
import { DIALECTIC_SHELVES, QUESTION_MEDIA } from "./dialectic-media";

const urlOf = (i: CollectionItem): string => (i.kind === "find" ? i.url ?? "" : "");

/** Every list a recording sits in: the Dialectic shelves, the questions' recordings, and every playlist. */
const LISTS: readonly (readonly CollectionItem[])[] = [
  ...DIALECTIC_SHELVES.map((s) => s.items),
  ...Object.values(QUESTION_MEDIA),
  ...COLLECTIONS.map((c) => c.items),
];

/** What plays after the recording at `url` (or with `title`), up to `max`, none twice and never itself. */
export function upNext(at: { url?: string | null; title?: string | null }, max = 10): CollectionItem[] {
  const url = at.url ?? "";
  const title = (at.title ?? "").trim().toLowerCase();
  const self = (i: CollectionItem) => (url && urlOf(i) === url) || (title && i.title.trim().toLowerCase() === title);
  const seen = new Set<string>();
  const out: CollectionItem[] = [];
  for (const list of LISTS) {
    const n = list.findIndex(self);
    if (n < 0) continue;
    for (const i of [...list.slice(n + 1), ...list.slice(0, n)]) {
      const k = itemKey(i);
      if (self(i) || seen.has(k)) continue;
      seen.add(k);
      out.push(i);
      if (out.length >= max) return out;
    }
  }
  return out;
}

/** The curated entry for a recording, by its link, with its line on why it is there, when one holds it. */
export function curated(url: string | null | undefined): CollectionItem | null {
  if (!url) return null;
  for (const list of LISTS) for (const i of list) if (urlOf(i) === url && i.why) return i;
  return null;
}
