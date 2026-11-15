"use client";

import Link from "next/link";
import { MicIcon, PauseIcon, PlayIcon } from "lucide-react";
import { useListen, type Track } from "../player";

/** One show a person hosts, as a tile in their hero, with its latest episode to play from the art. */
export type ShowTile = { title: string; href: string | null; image: string | null; latest: Track | null };

/**
 * The podcasts a person hosts (Scholē page priority guides, person page, 2026-11-15): tiles in the hero, art 96 px
 * with the title under it; the filled play button on the art plays the show's latest episode, the page's main act
 * when they host a show.
 */
export function ShowTiles({ tiles }: { tiles: ShowTile[] }) {
  const listen = useListen();
  return (
    <ul className="flex flex-wrap gap-4">
      {tiles.map((t) => {
        const on = Boolean(t.latest && listen?.track?.id === t.latest.id);
        const art = t.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={t.image} alt="" loading="lazy" className="size-24 rounded-lg border object-cover shadow-sm transition-opacity group-hover:opacity-90" />
        ) : <span className="bg-muted text-muted-foreground flex size-24 items-center justify-center rounded-lg border"><MicIcon className="size-5" /></span>;
        return (
          <li key={t.title} className="w-24">
            <div className="group relative">
              {t.href ? <Link href={t.href} aria-label={t.title}>{art}</Link> : art}
              {t.latest && listen ? (
                <button type="button" onClick={() => (on ? listen.toggle() : listen.playTrack(t.latest!))} aria-label={on && listen.playing ? "Pause" : `Play the latest episode of ${t.title}`}
                  className="bg-primary text-primary-foreground absolute right-1.5 bottom-1.5 flex size-9 items-center justify-center rounded-full shadow-md transition-transform hover:scale-105">
                  {on && listen.playing ? <PauseIcon className="size-4" /> : <PlayIcon className="size-4 fill-current" />}
                </button>
              ) : null}
            </div>
            {t.href ? <Link href={t.href} className="mt-1.5 line-clamp-2 block text-xs font-medium leading-tight underline-offset-4 hover:underline">{t.title}</Link> : <p className="mt-1.5 line-clamp-2 text-xs font-medium leading-tight">{t.title}</p>}
          </li>
        );
      })}
    </ul>
  );
}
