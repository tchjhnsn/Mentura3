/** Searching the episode transcripts a person keeps (Torian, 2026-11-15 "Build all"). Pure: no fetching. */
import type { Passage } from "./courses";

/** Every place a phrase is found in a set of transcripts, with a little of what surrounds it. */
export function findInTranscripts<T>(sets: { of: T; passages: Passage[] }[], q: string, limit = 100): { of: T; at: number | null; who: string | null; text: string }[] {
  const w = q.trim().toLowerCase();
  if (w.length < 2) return [];
  const hits: { of: T; at: number | null; who: string | null; text: string }[] = [];
  for (const s of sets) {
    for (const p of s.passages) {
      const i = p.text.toLowerCase().indexOf(w);
      if (i < 0) continue;
      const from = Math.max(0, i - 120);
      hits.push({ of: s.of, at: p.at, who: p.who, text: `${from ? "…" : ""}${p.text.slice(from, i + w.length + 160)}${i + w.length + 160 < p.text.length ? "…" : ""}` });
      if (hits.length >= limit) return hits;
    }
  }
  return hits;
}
