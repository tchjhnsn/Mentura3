import Link from "next/link";
import { itemHref, itemKey, type Collection, type CollectionItem } from "@reflect/core/collections";
import { hoursOf } from "@reflect/core/audiobooks";
import { audioOf } from "@reflect/core/media";
import { PlayButton } from "../play-button";
import { artOf, sizeLine } from "@/server/collections";
import { Art } from "../art";
import { cn } from "@/lib/utils";

/** Up to four covers fanned out, the first in front; type tiles where a cover is missing. */
export function Fan({ items, className }: { items: readonly CollectionItem[]; className?: string }) {
  const four = items.slice(0, 4);
  return (
    <div className={cn("bg-muted/60 relative flex h-32 items-end justify-center overflow-hidden rounded-lg border", className)}>
      {four.map((i, n) => {
        const mid = (four.length - 1) / 2;
        const a = artOf(i);
        return (
          <div key={n} className="absolute bottom-[-8px] w-[72px] shadow-sm" style={{ transform: `translateX(${(n - mid) * 40}px) rotate(${(n - mid) * 5}deg)`, zIndex: four.length - n }}>
            <Art image={a.image} kind={a.kind} title={i.title} small className="aspect-square w-full rounded-sm" />
          </div>
        );
      })}
    </div>
  );
}

/** A playlist chosen by a person: fanned covers, its name, who chose it and how long it is, and why it is suggested when it is. */
export function CollectionCard({ c, reason, className }: { c: Collection; reason?: string | null; className?: string }) {
  return (
    <Link href={`/schole/playlists/${c.id}`} className={cn("group block space-y-2", className)}>
      <Fan items={c.items} />
      <div className="space-y-0.5">
        <p className="leading-snug font-semibold group-hover:underline group-hover:underline-offset-2">{c.name}</p>
        <p className="text-muted-foreground line-clamp-1 text-[13px]">{sizeLine(c.items)} · by {c.by}</p>
        {reason ? <p className="text-muted-foreground line-clamp-1 text-xs">{reason}</p> : null}
      </div>
    </Link>
  );
}

/** A playlist Reflect made for the person: the same card, marked as Reflect's, never as a person's choice. */
export function MadeCard({ id, name, items, className }: { id: string; name: string; items: readonly CollectionItem[]; className?: string }) {
  return (
    <Link href={`/schole/playlists/made/${id}`} className={cn("group block space-y-2", className)}>
      <Fan items={items} />
      <div className="space-y-0.5">
        <p className="leading-snug font-semibold group-hover:underline group-hover:underline-offset-2">{name}</p>
        <p className="text-muted-foreground line-clamp-1 text-[13px]">{sizeLine(items)} · made for you by Reflect</p>
      </div>
    </Link>
  );
}

/** A playlist's things in order: number, art, kind, who and how long, and why it is there. */
export function PlaylistRows({ items, have, numbered = true }: { items: readonly CollectionItem[]; have: ReadonlySet<string>; /** False for things in no order (a topic's music or art). */ numbered?: boolean }) {
  return (
    <ol className="max-w-3xl divide-y">
      {items.map((i, n) => {
        const a = artOf(i);
        // A free recording plays here, in Scholē's own player; the row still opens its page.
        const free = i.kind === "find" && i.medium === "music" ? audioOf(i.url) : null;
        return (
          <li key={itemKey(i)} className="flex items-center gap-2">
            <Link href={itemHref(i)} className="hover:bg-muted/60 -mx-2 flex min-w-0 flex-1 items-start gap-3 rounded-lg px-2 py-3">
              {numbered ? <span className="text-muted-foreground w-5 shrink-0 pt-3.5 text-right text-sm tabular-nums">{n + 1}</span> : null}
              <Art image={a.image} kind={a.kind} title={i.title} tiny className="size-14 shrink-0" />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{i.title}</span>
                <span className="text-muted-foreground block truncate text-[13px]">{[a.kind, i.by, a.seconds ? hoursOf(a.seconds) : null].filter(Boolean).join(" · ")}</span>
                {i.why ? <span className="text-foreground/80 mt-0.5 line-clamp-2 block text-sm">{i.why}</span> : null}
              </span>
              {have.has(itemKey(i)) ? <span className="text-muted-foreground shrink-0 text-xs">Kept</span> : null}
            </Link>
            {free ? <PlayButton src={free.src} title={i.title} by={i.by} href={itemHref(i)} image={a.image} className="shrink-0" /> : null}
          </li>
        );
      })}
    </ol>
  );
}
