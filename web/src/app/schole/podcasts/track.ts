import type { Episode } from "@reflect/core/podcasts";
import type { Track } from "../player";

type Unit = { unit: string; place: number | null; doneOn: string | null };

/**
 * An episode as Scholē's player plays it: on the person's shelves (`item`), its place and finishing are kept and
 * the show's next episode follows it; explored before keeping, nothing is kept.
 */
export function episodeTrack(o: { episodes: Episode[]; at: number; show: string; image: string | null; item: string | null; feed: string; units?: Unit[]; previewHref?: (key: string) => string }): Track {
  const one = (i: number): Omit<Track, "next"> => {
    const e = o.episodes[i]!;
    const u = o.units?.find((x) => x.unit === e.key);
    return {
      id: `episode:${o.item ?? o.feed}:${e.key}`, src: e.audio, title: e.title, show: o.show, image: e.image ?? o.image,
      href: o.item ? `/schole/items/${o.item}/episodes/${e.key}` : o.previewHref?.(e.key) ?? "/schole",
      item: o.item, unit: e.key, place: u?.doneOn ? 0 : u?.place ?? null, seconds: e.seconds, chapters: e.chapters,
    };
  };
  // What follows is the next one down the show's list, as the episode page's Next goes.
  const next = o.item && o.at + 1 < o.episodes.length ? one(o.at + 1) : null;
  return { ...one(o.at), next };
}

/** A show's episodes as its list shows them, with where the person is with each. */
export function episodeRows(episodes: Episode[], hrefOf: (key: string) => string, units: Unit[] = []): import("./episode-list").EpisodeRow[] {
  const by = new Map(units.map((u) => [u.unit, u]));
  return episodes.map((e) => {
    const u = by.get(e.key);
    return {
      key: e.key, title: e.title, date: e.date, seconds: e.seconds, about: e.about ? e.about.slice(0, 240) : null, audio: e.audio, image: e.image,
      season: e.season, number: e.number, type: e.type, kind: e.kind, href: hrefOf(e.key),
      status: u?.doneOn ? "heard" : u?.place ? "begun" : "new", place: u?.place ?? null,
    };
  });
}
