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
      id: `episode:${o.item ?? o.feed}:${e.key}`, src: e.audio, title: e.title, show: o.show, image: o.image,
      href: o.item ? `/schole/items/${o.item}/episodes/${e.key}` : o.previewHref?.(e.key) ?? "/schole",
      item: o.item, unit: e.key, place: u?.doneOn ? 0 : u?.place ?? null, seconds: e.seconds,
    };
  };
  // What follows is the next one down the show's list, as the episode page's Next goes.
  const next = o.item && o.at + 1 < o.episodes.length ? one(o.at + 1) : null;
  return { ...one(o.at), next };
}
