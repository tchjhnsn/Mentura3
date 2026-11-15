"use client";

import Link from "next/link";
import type { Track } from "../player";
import { EpisodeButtons } from "../podcasts/episode-buttons";

/** An episode of one of the person's own shows, as its card shows it. */
export type LatestCard = { feed: string; item: string | null; key: string; show: string; title: string; day: string; seconds: number | null; image: string | null; audio: string; kind: "audio" | "video"; href: string };

/** The newest episodes of the shows a person hosts, each with play and up next on its card, as Scholē's new episodes are. */
export function LatestCards({ cards }: { cards: LatestCard[] }) {
  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {cards.map((e) => {
        const track: Track = { id: `episode:${e.item ?? e.feed}:${e.key}`, src: e.audio, title: e.title, show: e.show, image: e.image, href: e.href, item: e.item, unit: e.key, place: null, seconds: e.seconds, next: null };
        return (
          <li key={`${e.feed}/${e.key}`}>
            <div className="bg-card flex h-full gap-3 rounded-xl border p-3 shadow-xs">
              <Link href={e.href} tabIndex={-1} aria-hidden className="shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {e.image ? <img src={e.image} alt="" loading="lazy" className="size-20 rounded-md border object-cover" /> : <span className="bg-muted block size-20 rounded-md" />}
              </Link>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <p className="text-muted-foreground truncate text-xs"><span className="text-foreground font-semibold">{e.day}</span> · {e.show}</p>
                <Link href={e.href} className="line-clamp-2 text-sm font-medium leading-snug underline-offset-4 hover:underline">{e.title}</Link>
                <div className="mt-auto pt-1.5">
                  {e.kind === "audio" ? <EpisodeButtons track={track} status="new" favorite={null} /> : <Link href={e.href} className="text-sm underline underline-offset-4">Watch</Link>}
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
