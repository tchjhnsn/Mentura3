"use client";

import Link from "next/link";
import type { NewEpisode } from "@reflect/core/podcast-library";
import type { Track } from "../player";
import { EpisodeButtons } from "./episode-buttons";

/** A new episode as its card shows it: the episode, the day it came out as a person says it, and whether it is a favorite. */
export type NewCard = NewEpisode & { day: string; favorite: boolean };

const ROW = "-mx-6 flex snap-x scroll-px-6 gap-3 overflow-x-auto px-6 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-3 [&>li]:w-80 [&>li]:shrink-0 [&>li]:snap-start sm:[&>li]:w-auto";
const GRID = "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3";

/**
 * Episode cards (Torian, 2026-11-15 07:23Z): an episode's own picture, its show above its title, the day it came
 * out, and its acts on the card itself: play (saying how long it runs), up next and favorite. `row` swipes on a phone.
 */
export function NewEpisodeCards({ cards, row = false }: { cards: NewCard[]; row?: boolean }) {
  return (
    <ul className={row ? ROW : GRID}>
      {cards.map((e) => {
        const href = `/schole/items/${e.item}/episodes/${e.key}`;
        const track: Track = { id: `episode:${e.item}:${e.key}`, src: e.audio, title: e.title, show: e.show, image: e.image, href, item: e.item, unit: e.key, place: null, seconds: e.seconds, next: null };
        return (
          <li key={`${e.item}/${e.key}`}>
            <div className="bg-card flex h-full gap-3 rounded-xl border p-3 shadow-xs">
              <Link href={href} tabIndex={-1} aria-hidden className="shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {e.image ? <img src={e.image} alt="" loading="lazy" className="size-20 rounded-md border object-cover" /> : <span className="bg-muted block size-20 rounded-md" />}
              </Link>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <p className="text-muted-foreground truncate text-xs"><span className="text-foreground font-semibold">{e.day}</span> · {e.show}</p>
                <Link href={href} className="line-clamp-2 text-sm font-medium leading-snug underline-offset-4 hover:underline">{e.title}</Link>
                <div className="mt-auto pt-1.5">
                  {e.kind === "audio"
                    ? <EpisodeButtons track={track} status="new" favorite={e.favorite} />
                    : <Link href={href} className="text-sm underline underline-offset-4">Watch</Link>}
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
