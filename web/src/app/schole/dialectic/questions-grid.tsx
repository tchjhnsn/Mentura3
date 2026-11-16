import Link from "next/link";
import type { Dialectic } from "@reflect/core/dialectics";
import { itemKey } from "@reflect/core/collections";
import { QUESTION_MEDIA, formatOf, mixOldNew } from "@reflect/core/dialectic-media";
import { workById } from "@reflect/core/topic-pages";
import { artOf } from "@/server/collections";
import { Art } from "../art";

const count = (n: number, one: string) => `${n} ${one}${n === 1 ? "" : "s"}`;

/** What a question holds, by kind: "2 videos, 2 podcasts, 2 audiobooks". */
export function holds(media: readonly Parameters<typeof formatOf>[0][]): string {
  const by = (f: string) => media.filter((i) => formatOf(i) === f).length;
  return [[by("Video"), "video"], [by("Podcast"), "podcast"], [by("Audiobook"), "audiobook"]].filter(([n]) => (n as number) > 0).map(([n, w]) => count(n as number, w as string)).join(", ");
}

/**
 * Questions as cards that show what is inside before a tap (Torian, 2026-11-16 19:56Z: "not clear what I would gain by
 * pressing one of the questions"): three of the recordings that argue it, new and old in turn, the question, and what
 * it holds by kind. The whole card opens the question's playlist.
 */
export function QuestionsGrid({ ranked, row = false, week = 0 }: { ranked: { d: Dialectic; because: string | null }[]; /** One swiped row on a phone. */ row?: boolean; week?: number }) {
  return (
    <ul className={row ? "-mx-6 flex snap-x scroll-px-6 gap-3 overflow-x-auto px-6 pb-1 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-3" : "grid gap-3 sm:grid-cols-2 lg:grid-cols-3"}>
      {ranked.map(({ d, because }) => {
        const media = QUESTION_MEDIA[d.id] ?? [];
        const three = mixOldNew(media, week).slice(0, 3);
        const w = because ? workById(because) : undefined;
        return (
          <li key={d.id} className={row ? "w-72 shrink-0 snap-start sm:w-auto" : ""}>
            <Link href={`/schole/dialectic/questions/${d.id}`} className="group hover:bg-muted/50 flex h-full flex-col gap-3 rounded-xl border p-3">
              <span className="grid grid-cols-3 gap-1.5" aria-hidden>
                {three.map((i) => { const a = artOf(i); return <Art key={itemKey(i)} image={a.image} kind={formatOf(i)} title={i.title} tiny className="aspect-video w-full rounded-md" />; })}
              </span>
              <span className="space-y-1 px-1 pb-1">
                {w ? <span className="block text-xs font-medium">Because you keep the {w.title}</span> : null}
                <span className="block text-lg leading-snug font-semibold group-hover:underline">{d.question}</span>
                <span className="text-muted-foreground block text-[13px]">{holds(media)}</span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
