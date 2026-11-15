// LibriVox's recordings as a listener browses them (src/data/audiobooks.txt, made by scripts/audiobook-catalog.ts),
// read once per server. Audiobooks first (Torian, 2026-11-15 08:24Z).
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { appleChart, audiobookLanguages, findAudiobooks, readAudiobook, type Audiobook, type AudiobookQuery } from "@reflect/core/audiobooks";
import { librivoxBook } from "@reflect/core/librivox";

let all: Audiobook[] | null = null;
let byId: Map<string, Audiobook> | null = null;

/** Every recording in the catalog. */
export function audiobooks(): Audiobook[] {
  if (!all) {
    const file = [join(process.cwd(), "src/data/audiobooks.txt"), join(process.cwd(), "web/src/data/audiobooks.txt")].find((f) => existsSync(f));
    all = (file ? readFileSync(file, "utf8") : "").split("\n").map(readAudiobook).filter((a): a is Audiobook => a !== null);
    byId = new Map(all.map((a) => [a.id, a]));
  }
  return all;
}

/** One recording from the catalog by its LibriVox id, or undefined. */
export const audiobookById = (id: string): Audiobook | undefined => (audiobooks(), byId!.get(id));
export const listAudiobooks = (o: AudiobookQuery, limit?: number, offset?: number) => findAudiobooks(audiobooks(), o, limit, offset);
export const languages = () => audiobookLanguages(audiobooks());
/** The recording's cover, from the Internet Archive item that keeps it. */
export const coverOf = (a: { item: string }): string | null => (a.item ? `https://archive.org/services/img/${a.item}` : null);

const slow = (url: string) => fetch(url, { headers: { "user-agent": "reflect-app" }, next: { revalidate: 86400 }, signal: AbortSignal.timeout(8000) });
/** The recording's parts to play, from LibriVox, in any language. */
export const recordingOf = (id: string) => librivoxBook([id], slow, { anyLanguage: true }).catch(() => null);

/** The top podcasts on Apple in a topic's genres (the first genre; Apple's chart is per genre). */
export async function topPodcasts(genres: readonly number[], limit = 24) {
  if (!genres.length) return [];
  const r = await fetch(`https://itunes.apple.com/us/rss/toppodcasts/limit=${limit}/genre=${genres[0]}/json`, { next: { revalidate: 86400 }, signal: AbortSignal.timeout(6000) }).catch(() => null);
  return appleChart(r?.ok ? await r.text() : null);
}
