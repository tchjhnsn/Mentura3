import Link from "next/link";
import type { Dialectic } from "@reflect/core/dialectics";
import { QUESTION_MEDIA } from "@reflect/core/dialectic-media";
import { workById } from "@reflect/core/topic-pages";

/** Questions as cards: the question, what it asks, and how many recordings argue it; the first one wide. */
export function QuestionsGrid({ ranked, row = false }: { ranked: { d: Dialectic; because: string | null }[]; /** One swiped row on a phone. */ row?: boolean }) {
  return (
    <ul className={row ? "-mx-6 flex snap-x scroll-px-6 gap-3 overflow-x-auto px-6 pb-1 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-3" : "grid gap-3 sm:grid-cols-2 lg:grid-cols-3"}>
      {ranked.map(({ d, because }, i) => {
        const n = QUESTION_MEDIA[d.id]?.length ?? 0;
        const w = because ? workById(because) : undefined;
        return (
          <li key={d.id} className={row ? "w-64 shrink-0 snap-start sm:w-auto" : i === 0 ? "sm:col-span-2 lg:col-span-1" : ""}>
            <Link href={`/schole/dialectic/questions/${d.id}`} className="hover:bg-muted/50 flex h-full flex-col gap-1.5 rounded-lg border p-4">
              {w ? <span className="text-xs font-medium">Because you keep the {w.title}</span> : <span className="text-muted-foreground text-xs">{d.subject}</span>}
              <span className="text-lg leading-snug font-semibold">{d.question}</span>
              <span className="text-muted-foreground line-clamp-2 text-sm">{d.about}</span>
              <span className="text-muted-foreground mt-auto pt-1 text-xs">{n} {n === 1 ? "recording" : "recordings"} · {d.positions.length} positions</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
