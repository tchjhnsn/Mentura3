import Link from "next/link";
import type { Collection } from "@reflect/core/collections";
import { artOf, sizeLine } from "@/server/collections";
import { Art } from "../art";
import { cn } from "@/lib/utils";

/** Up to four covers fanned out, the first in front; type tiles where a cover is missing. */
export function Fan({ c, className }: { c: Collection; className?: string }) {
  const four = c.items.slice(0, 4);
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

/** A collection: fanned covers, its name, who chose it and how long it is, and why it is suggested when it is. */
export function CollectionCard({ c, reason, className }: { c: Collection; reason?: string | null; className?: string }) {
  return (
    <Link href={`/schole/collections/${c.id}`} className={cn("group block space-y-2", className)}>
      <Fan c={c} />
      <div className="space-y-0.5">
        <p className="leading-snug font-semibold group-hover:underline group-hover:underline-offset-2">{c.name}</p>
        <p className="text-muted-foreground line-clamp-1 text-[13px]">{sizeLine(c.items)} · by {c.by}</p>
        {reason ? <p className="text-muted-foreground line-clamp-1 text-xs">{reason}</p> : null}
      </div>
    </Link>
  );
}
