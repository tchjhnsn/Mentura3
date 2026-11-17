import type { ReactNode } from "react";
import Link from "next/link";
import { itemHref, itemKey, type CollectionItem } from "@reflect/core/collections";
import { artOf } from "@/server/collections";
import { Art } from "./art";

/*
 * A watch page, laid out the way video sites lay one out (Torian, 2026-11-16 18:45Z: "It should look like you're on
 * YouTube preparing to watch a video"). Visual hierarchy: the player is the hero and the largest thing, edge to edge on
 * a phone; the title is next, bold; then the channel line with the page's actions as round buttons on the same row;
 * then the description in a muted box; and Up next, a column beside the player on a wide screen and below it on a
 * phone. Nothing on the page asks the person to write: notes belong in the journal.
 */

/** One thing in Up next, with the ranker's reason when it moved up for the person (recommend.ts). */
export type NextItem = { item: CollectionItem; reason: string | null };

/** The page: the main column (player first) and Up next beside it on a wide screen, below it on a phone. */
export function WatchView({ main, upNext }: { main: ReactNode; upNext?: readonly NextItem[] }) {
  return (
    <div className="mt-2 grid gap-x-6 gap-y-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="min-w-0 space-y-3">{main}</div>
      {upNext?.length ? <UpNext items={upNext} /> : null}
    </div>
  );
}

/** Under the player: the title, the channel line with the actions, the description box, and anything after. */
export function WatchDetails({ title, channel, detail, actions, meta, description, after }: {
  title: string;
  /** Who made it: the channel, speakers or programme. */
  channel?: string | null;
  /** A muted second line under the channel, such as "Debate · Dialectic". */
  detail?: string | null;
  /** Round buttons beside the channel line: Save and the like. */
  actions?: ReactNode;
  /** The description box's bold first line, such as the year and kind. */
  meta?: string | null;
  description?: ReactNode;
  after?: ReactNode;
}) {
  return (
    <>
      <h1 id="page-title" className="pt-1 text-xl leading-snug font-semibold tracking-tight sm:text-2xl">{title}</h1>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          {channel ? <p className="truncate text-[15px] font-medium">{channel}</p> : null}
          {detail ? <p className="text-muted-foreground text-xs">{detail}</p> : null}
        </div>
        {actions ? <div className="flex min-w-0 flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      {meta || description ? (
        <div className="bg-muted/70 space-y-2 rounded-xl p-3 text-sm leading-relaxed">
          {meta ? <p className="font-semibold">{meta}</p> : null}
          {description}
        </div>
      ) : null}
      {after}
    </>
  );
}

function UpNext({ items }: { items: readonly NextItem[] }) {
  return (
    <aside aria-labelledby="up-next" className="min-w-0 space-y-3">
      <h2 id="up-next" className="text-base font-semibold">Up next</h2>
      <ul className="space-y-3">
        {items.map(({ item: i, reason }) => {
          const art = artOf(i);
          return (
            <li key={itemKey(i)}>
              <Link href={itemHref(i)} className="group flex gap-3">
                <Art image={art.image} kind={art.kind} title={i.title} small className="aspect-video w-40 shrink-0 rounded-lg" />
                <span className="min-w-0 space-y-0.5">
                  <span className="line-clamp-2 text-sm leading-snug font-medium group-hover:underline">{i.title}</span>
                  <span className="text-muted-foreground line-clamp-1 block text-xs">{i.by}</span>
                  <span className="text-muted-foreground line-clamp-1 block text-xs">{reason ?? art.kind}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}

export { ROUND_ACTION } from "./watch-classes";

/** A video in its own player, for a recording not yet saved (no place to keep): edge to edge on a phone. */
export function VideoFrame({ src, title }: { src: string; title: string }) {
  return (
    <div className="-mx-6 aspect-video overflow-hidden bg-black sm:mx-0 sm:rounded-xl">
      <iframe src={src} title={title} className="size-full" allow="autoplay; encrypted-media; fullscreen; picture-in-picture" allowFullScreen />
    </div>
  );
}
