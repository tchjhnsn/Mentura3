// What a person's kept shows add up to: the new episodes they have not begun, and what they heard in a year.
// Pure: the feeds and the places kept are read elsewhere.

import type { Episode } from "./podcasts";

export type UnitMark = { unit: string; place: number | null; doneOn: string | null };
export type KeptShow = { item: string; title: string; image: string | null; episodes: readonly Episode[]; units: readonly UnitMark[] };
export type NewEpisode = { item: string; show: string; key: string; title: string; date: string; seconds: number | null; image: string | null; audio: string; kind: "audio" | "video" };

/** Episodes published on or after `since` that the person has neither begun nor heard, newest first, a few per show. */
export function newEpisodes(shows: readonly KeptShow[], since: string, opts: { perShow?: number; limit?: number } = {}): NewEpisode[] {
  const out: NewEpisode[] = [];
  for (const s of shows) {
    const touched = new Set(s.units.filter((u) => u.doneOn || (u.place ?? 0) > 0).map((u) => u.unit));
    const fresh = s.episodes.filter((e) => e.date && e.date >= since && !touched.has(e.key) && e.type !== "trailer").slice(0, opts.perShow ?? 3);
    for (const e of fresh) out.push({ item: s.item, show: s.title, key: e.key, title: e.title, date: e.date!, seconds: e.seconds, image: e.image ?? s.image, audio: e.audio, kind: e.kind });
  }
  return out.sort((a, b) => b.date.localeCompare(a.date)).slice(0, opts.limit ?? 12);
}

export type Heard = { episodes: number; seconds: number; shows: { item: string; title: string; episodes: number; seconds: number }[] };

/**
 * The episodes heard to the end in a year and their length: an episode's own length from its feed, else the
 * place kept in it. Shows most heard first.
 */
export function heardIn(year: number, shows: readonly KeptShow[]): Heard {
  const by: Heard["shows"] = [];
  for (const s of shows) {
    const len = new Map(s.episodes.map((e) => [e.key, e.seconds]));
    const done = s.units.filter((u) => u.doneOn?.startsWith(`${year}-`));
    if (!done.length) continue;
    const seconds = done.reduce((n, u) => n + (len.get(u.unit) ?? u.place ?? 0), 0);
    by.push({ item: s.item, title: s.title, episodes: done.length, seconds });
  }
  by.sort((a, b) => b.seconds - a.seconds || b.episodes - a.episodes);
  return { episodes: by.reduce((n, s) => n + s.episodes, 0), seconds: by.reduce((n, s) => n + s.seconds, 0), shows: by };
}
