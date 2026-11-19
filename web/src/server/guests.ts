// Guests and books mentioned in podcast episodes (Torian, 2026-11-15 16:20Z), from the feed, Wikipedia, Apple's
// episode search and Open Library. Nothing here calls a model.
import { appleAppearances, bareName, sameBook, wikiBio, type Appearance, type Bio, type BookMention } from "@reflect/core/guests";
import { searchBooks, type CatalogEntry } from "@reflect/core/openlibrary";
import { outsideFetch, outsideText } from "./outside";

const day = (url: string) => outsideFetch({ timeoutMs: 6000 })(url, { next: { revalidate: 86400 } });
const text = (url: string) => outsideText(url, { next: { revalidate: 86400 } }, { timeoutMs: 6000 });

/** A guest's Wikipedia summary: the page the show notes link, else the page by the guest's name; null when there is none. */
export async function bioFor(name: string, wiki?: string | null): Promise<Bio | null> {
  const title = wiki?.match(/^https:\/\/en\.wikipedia\.org\/wiki\/([^?#]+)/)?.[1] ?? encodeURIComponent(bareName(name).replace(/ /g, "_"));
  return wikiBio(await text(`https://en.wikipedia.org/api/rest_v1/page/summary/${title}`));
}

/** Episodes on any show that name the guest, from Apple's podcast search, newest first. */
export async function appearancesOf(name: string, limit = 40): Promise<Appearance[]> {
  const found = appleAppearances(await text(`https://itunes.apple.com/search?media=podcast&entity=podcastEpisode&limit=100&term=${encodeURIComponent(`"${bareName(name)}"`)}`), name);
  return found.sort((a, b) => (b.date ?? "").localeCompare(a.date ?? "")).slice(0, limit);
}

/** The books named in show notes that Open Library has, each its catalog entry, in the order named. */
export async function booksFound(mentions: readonly BookMention[], limit = 12): Promise<CatalogEntry[]> {
  const found = await Promise.all(mentions.slice(0, limit * 2).map(async (m) => {
    if (m.isbn) { const byIsbn = (await searchBooks(`isbn:${m.isbn}`, day, 1).catch((): CatalogEntry[] => []))[0]; if (byIsbn) return byIsbn; }
    const hits = await searchBooks(`${m.title}${m.author ? ` ${m.author}` : ""}`, day, 3).catch((): CatalogEntry[] => []);
    return hits.find((h) => sameBook(m.title, h.title) && (!m.author || h.authors.some((a) => a.toLowerCase().includes(m.author!.split(" ").at(-1)!.toLowerCase())))) ?? null;
  }));
  const seen = new Set<string>();
  return found.filter((b): b is CatalogEntry => b !== null && !seen.has(b.work) && Boolean(seen.add(b.work))).slice(0, limit);
}
