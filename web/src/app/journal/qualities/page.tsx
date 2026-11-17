import type { Metadata } from "next";
import Link from "next/link";
import { PlusIcon } from "lucide-react";
import { keptQualities, suggestedQualities } from "@reflect/core/formation";
import { PAGE } from "@/components/page-header";
import { requireUser } from "@/server/session";
import { admiredOf } from "@/server/admired";
import { signalsOf } from "@/server/recommend";
import { entryCounts } from "@/server/qualities";
import { JournalHeader } from "../header";
import { toggleQualityAction } from "./actions";
import { Faces } from "./faces";

export const metadata: Metadata = { title: "Qualities" };
export const dynamic = "force-dynamic";

/**
 * The Qualities lens (doc "Qualities design guide"): the qualities the person is building, each with who they saw it
 * in and how much they wrote about it; then those named by the authors of what they finished in Scholē, to add.
 */
export default async function QualitiesPage() {
  const user = await requireUser();
  const [admired, signals, counts] = await Promise.all([admiredOf(user.id), signalsOf(user.id), entryCounts(user.id)]);
  const kept = keptQualities(admired);
  const finished = new Set([...signals.finished].filter((k) => k.startsWith("audiobook:")).map((k) => k.slice("audiobook:".length)));
  const suggested = suggestedQualities(admired, finished);
  return (
    <main className={PAGE}>
      <JournalHeader on="qualities" />
      <div className="mt-6 grid max-w-3xl grid-cols-[minmax(0,1fr)] gap-10">
        <section aria-labelledby="building" className="grid gap-3">
          <h2 id="building" className="font-semibold">What you are building</h2>
          {kept.length ? (
            <ul className="divide-y border-y">
              {kept.map((q) => {
                const n = counts.get(q.trait.id) ?? 0;
                return (
                  <li key={q.trait.id}>
                    <Link href={`/journal/qualities/${q.trait.id}`} className="hover:bg-accent grid gap-1.5 py-3 transition">
                      <span className="font-semibold">{q.trait.name}</span>
                      <span className="text-muted-foreground flex items-center gap-2 text-sm"><Faces people={q.from} />Seen in {q.from.map((e) => e.name).join(", ")} · {n ? `${n} ${n === 1 ? "entry" : "entries"}` : "nothing written yet"}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : <p className="text-muted-foreground text-sm">Qualities you want to build, from the people you admire. Meet them in <Link href="/schole/browse#lives" className="underline underline-offset-2">Scholē&apos;s Lives</Link> and press + on a quality they name.</p>}
        </section>

        {suggested.length ? (
          <section aria-labelledby="finished" className="grid gap-2">
            <h2 id="finished" className="text-muted-foreground text-sm">From what you finished</h2>
            <ul className="grid gap-1">
              {suggested.map((q) => (
                <li key={q.trait.id} className="flex items-center justify-between gap-3 py-1.5">
                  <span className="grid min-w-0">
                    <span>{q.trait.name}</span>
                    <span className="text-muted-foreground truncate text-sm">{q.from.book.title}, {q.from.name}</span>
                  </span>
                  <form action={toggleQualityAction.bind(null, q.from.id, q.trait.id, "/journal/qualities")}>
                    <button type="submit" aria-label={`Add ${q.trait.name.toLowerCase()}`} title="Add it" className="hover:bg-accent flex size-8 shrink-0 items-center justify-center rounded-full border"><PlusIcon className="size-4" /></button>
                  </form>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <p className="text-sm"><Link href="/schole/browse#lives" className="text-muted-foreground hover:text-foreground underline-offset-2 hover:underline">Find more in Scholē&apos;s Lives</Link></p>
      </div>
    </main>
  );
}
