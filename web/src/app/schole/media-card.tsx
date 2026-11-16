import Link from "next/link";
import { ChevronDownIcon, HeadphonesIcon, MicIcon, MusicIcon, PlayIcon, type LucideIcon } from "lucide-react";
import { itemHref, itemKey, type CollectionItem } from "@reflect/core/collections";
import { hoursOf } from "@reflect/core/audiobooks";
import { eraLine, formatOf } from "@reflect/core/dialectic-media";
import { artOf } from "@/server/collections";
import { cn } from "@/lib/utils";
import { Art } from "./art";

const ICON: Record<string, LucideIcon> = { Video: PlayIcon, Podcast: MicIcon, Audiobook: HeadphonesIcon, Course: PlayIcon, Music: MusicIcon };

/** What a thing is, on its picture's corner: an icon and Video, Podcast or Audiobook, with its length when known. */
export function FormatChip({ i, className }: { i: CollectionItem; className?: string }) {
  const f = formatOf(i);
  const Icon = ICON[f] ?? PlayIcon;
  const s = artOf(i).seconds;
  return (
    <span className={cn("absolute bottom-1.5 left-1.5 flex items-center gap-1 rounded-md bg-black/75 px-1.5 py-0.5 text-[11px] font-medium text-white", className)}>
      <Icon className={cn("size-3", f === "Video" && "fill-current")} aria-hidden />{f}{s ? <span className="text-white/80">· {hoursOf(s)}</span> : null}
    </span>
  );
}

/**
 * A recording as a card, the way video sites show one (Dialectic design guide, 2026-11-16): the picture on top with what
 * it is on its corner, a 16:9 frame for every card so a row lines up, with an audio cover square inside it so video and
 * audio differ by shape; then the title, who, its era, and why it is here. The whole card opens it.
 */
export function MediaCard({ i, className, big = false }: { i: CollectionItem; className?: string; big?: boolean }) {
  const a = artOf(i);
  const video = formatOf(i) === "Video";
  const era = eraLine(i);
  return (
    <Link href={itemHref(i)} className={cn("group block min-w-0 space-y-2", className)}>
      <span className="bg-muted relative block aspect-video overflow-hidden rounded-xl">
        {video
          ? <Art image={a.image} kind={a.kind} title={i.title} className="size-full rounded-none border-0" />
          : <Art image={a.image} kind={a.kind} title={i.title} small className="absolute inset-y-0 left-1/2 aspect-square h-full -translate-x-1/2 rounded-none border-0" />}
        <FormatChip i={i} />
      </span>
      <span className="block space-y-0.5">
        <span className={cn("line-clamp-2 leading-snug font-semibold group-hover:underline", big ? "text-lg" : "text-[15px]")}>{i.title}</span>
        <span className="text-muted-foreground line-clamp-1 block text-[13px]">{[i.by, era].filter(Boolean).join(" · ")}</span>
        {i.why ? <span className="text-foreground/80 line-clamp-2 block text-[13px]">{i.why}</span> : null}
      </span>
    </Link>
  );
}

/**
 * A shelf of cards: on a phone, one card and a bit, swiped sideways through all of them; on a wide screen a grid of the
 * first `limit`, with the rest under Show more.
 */
export function CardRow({ items, wide = false, limit = 8 }: { items: readonly CollectionItem[]; /** Three across instead of four. */ wide?: boolean; limit?: number }) {
  const grid = cn("-mx-6 flex snap-x scroll-px-6 gap-4 overflow-x-auto px-6 pb-1 sm:mx-0 sm:grid sm:gap-x-4 sm:gap-y-6 sm:overflow-visible sm:px-0", wide ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-3 lg:grid-cols-4");
  const rest = items.slice(limit);
  return (
    <div className="space-y-4">
      <ul className={grid}>
        {items.map((i, n) => <li key={itemKey(i)} className={cn("w-[78%] shrink-0 snap-start sm:w-auto", n >= limit && "sm:hidden")}><MediaCard i={i} /></li>)}
      </ul>
      {rest.length ? (
        <details className="group hidden sm:block">
          <summary className="text-muted-foreground hover:text-foreground flex cursor-pointer list-none items-center gap-1 text-sm font-medium [&::-webkit-details-marker]:hidden"><ChevronDownIcon className="size-4 transition group-open:rotate-180" />Show {rest.length} more</summary>
          <ul className={cn(grid, "mt-6")}>{rest.map((i) => <li key={itemKey(i)}><MediaCard i={i} /></li>)}</ul>
        </details>
      ) : null}
    </div>
  );
}
