import Link from "next/link";
import { CheckIcon, PlusIcon } from "lucide-react";
import { traitById, type Exemplar } from "@reflect/core/formation";
import { admiredOf } from "@/server/admired";
import { toggleQualityAction } from "@/app/journal/qualities/actions";

/**
 * Qualities in their own words (doc "Qualities design guide"): the qualities a person names in their own book, each
 * quoted with where it is, and + to keep it in the Qualities lens with this person as where it was seen. No writing here.
 */
export async function QualitiesInTheirWords({ e, userId, back }: { e: Exemplar; userId: string; back: string }) {
  const kept = new Set((await admiredOf(userId)).find((a) => a.exemplar === e.id)?.traits ?? []);
  return (
    <section aria-labelledby="qualities" className="grid gap-2">
      <div>
        <h2 id="qualities" className="text-base font-semibold">Qualities in their own words</h2>
        <p className="text-muted-foreground text-sm">From {e.book.title}. Press + to keep one in your <Link href="/journal/qualities" className="underline underline-offset-2">Qualities</Link>.</p>
      </div>
      <ul className="divide-y border-y">
        {e.traits.map((t) => {
          const trait = traitById(t.trait)!;
          const on = kept.has(t.trait);
          return (
            <li key={t.trait} className="flex items-start justify-between gap-4 py-3">
              <span className="grid min-w-0 gap-1">
                <Link href={`/journal/qualities/${t.trait}`} className="font-medium hover:underline">{trait.name}</Link>
                <q className="text-muted-foreground text-sm">{t.quote}</q>
                <span className="text-muted-foreground text-xs">{t.where}</span>
              </span>
              <form action={toggleQualityAction.bind(null, e.id, t.trait, back)} className="shrink-0">
                <button type="submit" aria-pressed={on} aria-label={on ? `Kept: ${trait.name}. Take it off` : `Keep ${trait.name.toLowerCase()}`} title={on ? "Kept. Tap to take it off" : "Keep it"} className={on ? "bg-foreground text-background flex size-8 items-center justify-center rounded-full" : "hover:bg-accent flex size-8 items-center justify-center rounded-full border"}>
                  {on ? <CheckIcon className="size-4" /> : <PlusIcon className="size-4" />}
                </button>
              </form>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
