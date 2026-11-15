// Podcasts heard in Reflect: a show's episodes read from its own feed (@reflect/core/podcasts), never stored in the
// database. Feeds are kept in this server's memory: fresh for 15 minutes, then served as they were while they are
// read again in the background, for up to a day, so a slow host does not hold up the page.
import { episodeChapters, episodeTranscript, showOf, type Chapter, type Episode, type Show } from "@reflect/core/podcasts";
import type { Passage } from "@reflect/core/courses";

const page = async (url: string): Promise<string | null> => {
  try {
    const r = await fetch(url, { headers: { "user-agent": "Reflect podcast player" }, cache: "no-store", signal: AbortSignal.timeout(12000) });
    return r.ok ? await r.text() : null;
  } catch {
    return null;
  }
};

const FRESH = 15 * 60_000;
const KEEP = 24 * 3600_000;
const kept = new Map<string, { at: number; show: Show | null; reading?: Promise<Show | null> }>();

function read(url: string): Promise<Show | null> {
  const k = kept.get(url);
  if (k?.reading) return k.reading;
  const reading = showOf(url, page).then((show) => {
    // A failed read keeps the last good one.
    const prev = kept.get(url);
    kept.set(url, { at: Date.now(), show: show ?? prev?.show ?? null });
    if (kept.size > 200) kept.delete(kept.keys().next().value!);
    return show ?? prev?.show ?? null;
  });
  kept.set(url, { at: k?.at ?? 0, show: k?.show ?? null, reading });
  return reading;
}

export async function showFor(url: string | null): Promise<Show | null> {
  if (!url) return null;
  const k = kept.get(url);
  const age = k ? Date.now() - k.at : Infinity;
  if (k?.show && age < FRESH) return k.show;
  if (k?.show && age < KEEP) { void read(url); return k.show; }
  return read(url);
}

export const transcriptOf = (e: Episode): Promise<Passage[]> => episodeTranscript(e, page);
export const chaptersOf = (e: Episode): Promise<Chapter[]> => episodeChapters(e, page);
