import Link from "next/link";
import { PlayIcon } from "lucide-react";
import { itemHref } from "@reflect/core/collections";
import type { WayLesson } from "@reflect/core/way-lessons";
import { artOf } from "@/server/collections";
import { Art } from "./art";

/**
 * A short lesson on a way of learning at the top of its page: what the way is (Aristotle, by places), where the person
 * has already done it, and a recording that teaches it when there is one. A card in a muted box, so it reads as an
 * introduction to the shelves under it rather than one of them.
 */
export function WayLessonCard({ l }: { l: WayLesson }) {
  const art = l.primer ? artOf(l.primer) : null;
  return (
    <section aria-labelledby={`lesson-${l.way}`} className="bg-muted/60 grid gap-5 rounded-xl p-4 sm:p-5 md:grid-cols-[minmax(0,1fr)_16rem]">
      <div className="min-w-0 space-y-3">
        <h2 id={`lesson-${l.way}`} className="text-lg font-semibold tracking-tight">{l.title}</h2>
        {l.what.map((p, i) => <p key={i} className="max-w-prose text-[15px] leading-relaxed">{p}</p>)}
        <div className="space-y-1.5">
          <p className="text-sm font-medium">You have already done it if</p>
          <ul className="text-muted-foreground max-w-prose list-disc space-y-1 pl-5 text-sm">{l.already.map((a) => <li key={a}>{a}</li>)}</ul>
        </div>
        <p className="text-muted-foreground text-xs">Aristotle, {l.places.join("; ")}</p>
      </div>
      {l.primer && art ? (
        <Link href={itemHref(l.primer)} className="group block space-y-2 self-start">
          <span className="relative block overflow-hidden rounded-lg">
            <Art image={art.image} kind={art.kind} title={l.primer.title} className="aspect-video w-full rounded-lg border-0" />
            <span className="absolute inset-0 flex items-center justify-center"><span className="flex size-11 items-center justify-center rounded-full bg-black/70 text-white"><PlayIcon className="ml-0.5 size-5 fill-current" /></span></span>
          </span>
          <span className="block text-sm leading-snug font-medium group-hover:underline">{l.primer.title}</span>
          <span className="text-muted-foreground block text-xs">{l.primer.by}</span>
        </Link>
      ) : null}
    </section>
  );
}
