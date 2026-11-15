// Browse beyond books: finds for each medium from free catalogs (@reflect/core/browse-media), cached by Next's fetch
// cache, and the lists' items of a medium.
import { findMedium, freeFilmsToWatch, type Fetch } from "@reflect/core/browse-media";
import { ITEM_LISTS } from "@reflect/core/item-lists";
import type { Found } from "@reflect/core/lookup";
import { fyydSearchUrl, gpodderSearchUrl, mergeShowFinds, podcastIndexHeaders, podcastIndexSearchUrl, readFyyd, readGpodder, readPodcastIndex } from "@reflect/core/podcastindex";
import type { Medium } from "@reflect/core/ways";

export const textFetch: Fetch = async (url) => {
  try {
    const r = await fetch(url, { headers: { "user-agent": "reflect-app" }, next: { revalidate: 21600 }, signal: AbortSignal.timeout(8000) });
    return r.ok ? await r.text() : null;
  } catch {
    return null;
  }
};

/** Finds for a medium: a search, or the catalog's own list when there is no search. */
export async function finds(m: Medium, q = ""): Promise<{ found: Found[]; error?: string }> {
  const oycHtml = m === "course" ? await textFetch("https://oyc.yale.edu/courses") : null;
  const more = m === "podcast" && q.trim();
  const [apple, ...others] = await Promise.all([findMedium(m, q, textFetch, { oycHtml }), ...(more ? [openShows(fyydSearchUrl(q), readFyyd), openShows(gpodderSearchUrl(q), readGpodder), indexShows(q)] : [])]);
  return others.some((o) => o.length) ? { ...apple, found: mergeShowFinds(apple.found, others) } : apple;
}

/** Shows from an open index that needs no key (fyyd, gpodder.net); none when it does not answer. */
async function openShows(url: string, read: (body: unknown) => Found[]): Promise<Found[]> {
  const t = await textFetch(url);
  try { return t ? read(JSON.parse(t)) : []; } catch { return []; }
}

/** Shows from Podcast Index, when its key and secret are set (`PODCASTINDEX_KEY`, `PODCASTINDEX_SECRET`); else none. */
async function indexShows(term: string): Promise<Found[]> {
  const key = process.env.PODCASTINDEX_KEY, secret = process.env.PODCASTINDEX_SECRET;
  if (!key || !secret) return [];
  try {
    const r = await fetch(podcastIndexSearchUrl(term), { headers: await podcastIndexHeaders(key, secret), next: { revalidate: 21600 }, signal: AbortSignal.timeout(8000) });
    return r.ok ? readPodcastIndex(await r.json()) : [];
  } catch {
    return [];
  }
}

export const filmsToWatch = (): Promise<Found[]> => freeFilmsToWatch(textFetch).catch(() => []);

/** The items of the lists beyond books in one medium, credited to their list. */
export function listFinds(m: Medium): (Found & { list: string })[] {
  return ITEM_LISTS.flatMap((l) => l.items.filter((i) => i.medium === m).map((i) => ({ medium: i.medium, title: i.title, ...(i.by ? { by: i.by } : {}), ...(i.url ? { url: i.url } : {}), source: l.name, list: l.name })));
}
