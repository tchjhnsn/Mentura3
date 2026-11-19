import type { Metadata } from "next";
import Link from "next/link";
import { PlusIcon, SparklesIcon } from "lucide-react";
import { nextUp } from "@reflect/core/adventures";
import { SectionHeader } from "@/components/headers";
import { PAGE } from "@/components/page-header";
import { PinMap } from "@/components/map";
import { Button } from "@/components/ui/button";
import { adventuresOf } from "@/server/adventures";
import { requireUser } from "@/server/session";
import { restoreAdventureAction } from "./actions";
import { AdventureCard, Faces, Ideas, photoOf, shortDay, tileLabel, whenOf } from "./parts";

export const metadata: Metadata = { title: "Adventures" };
export const dynamic = "force-dynamic";
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
const PLAN = `/chat?q=${encodeURIComponent("Help me plan an adventure.")}`;

/**
 * The Adventures board (doc "Adventures design guide", 2026-11-17): the next adventure first as a large photo card,
 * the rest as photo cards, a map with a pin for each one that has a place, and what is done, small. The chat plans.
 */
export default async function AdventuresPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser();
  const removed = one((await searchParams).removed);
  const all = await adventuresOf(user.id);
  const today = new Date().toISOString().slice(0, 10);
  const next = nextUp(all, today);
  const notYet = all.filter((a) => !a.done && a.id !== next?.id), already = all.filter((a) => a.done);
  const pins = all.filter((a) => !a.done && a.lat !== null && a.lon !== null).map((a, i) => ({ lat: a.lat!, lon: a.lon!, label: a.name, href: `/adventures/${a.id}`, n: i + 1 }));
  const hero = next ? photoOf(next) : null;
  return (
    <main className={PAGE}>
      <SectionHeader back="/v" backLabel="Village and polis" title="Adventures" icons={
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm"><Link href="/adventures/new"><PlusIcon />Add</Link></Button>
          <Button asChild size="sm"><Link href={PLAN}><SparklesIcon />Plan with Reflect</Link></Button>
        </div>
      } />
      {removed ? (
        <form action={restoreAdventureAction.bind(null, removed)} className="bg-muted mt-4 flex max-w-xl items-center justify-between gap-3 rounded-lg px-4 py-2 text-sm">
          <span>Removed.</span><Button type="submit" variant="outline" size="sm">Undo</Button>
        </form>
      ) : null}

      {!all.length ? (
        <div className="mt-6 grid max-w-5xl gap-8">
          <div className="grid gap-2">
            <h2 className="text-2xl font-semibold tracking-tight">What do you want to do?</h2>
            <p className="text-muted-foreground">Pick one to start, or tell Reflect what you have in mind and it will plan it with you.</p>
          </div>
          <Ideas />
        </div>
      ) : (
        <div className="mt-6 grid max-w-6xl gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="grid content-start gap-8">
            {next ? (
              <Link href={`/adventures/${next.id}`} className="group bg-muted relative block aspect-[16/9] overflow-hidden rounded-2xl sm:aspect-[2/1]">
                {hero ? <img src={`/adventure-photos/${hero.image}`} alt="" className="absolute inset-0 size-full object-cover transition group-hover:scale-[1.01]" /> : null}
                <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <span className="absolute inset-x-0 bottom-0 grid gap-1 p-5 text-white">
                  <span className="text-sm text-white/80">Next up{whenOf(next, today) ? `, ${whenOf(next, today)}` : ""}</span>
                  <span className="text-2xl font-bold tracking-tight sm:text-3xl">{next.name}</span>
                  <span className="flex items-center gap-3 text-sm text-white/80">
                    <Faces people={next.people} />
                    {[next.place, next.tiles.map(tileLabel).join(", ")].filter(Boolean).join(" · ")}
                  </span>
                </span>
              </Link>
            ) : null}

            {notYet.length ? (
              <section aria-labelledby="not-yet" className="grid gap-3">
                <h2 id="not-yet" className="text-lg font-semibold">Not yet</h2>
                <ul className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3">
                  {notYet.map((a) => <li key={a.id}><AdventureCard a={a} sub={a.start ? shortDay(a.start) : a.tiles.map(tileLabel).join(", ") || null} /></li>)}
                </ul>
              </section>
            ) : null}

            <section aria-labelledby="ideas" className="grid gap-3">
              <h2 id="ideas" className="text-muted-foreground text-sm font-medium">Ideas to add</h2>
              <Ideas compact />
            </section>
          </div>

          <aside className="grid content-start gap-8">
            {pins.length ? <PinMap pins={pins} className="h-72 w-full overflow-hidden rounded-2xl border lg:h-96" /> : (
              <div className="bg-muted/50 text-muted-foreground grid h-40 place-items-center rounded-2xl border border-dashed p-6 text-center text-sm">Give an adventure a place and it shows here on a map.</div>
            )}
            {already.length ? (
              <section aria-labelledby="already" className="grid gap-3">
                <h2 id="already" className="text-lg font-semibold">Already</h2>
                <ul className="grid grid-cols-2 gap-3">
                  {already.map((a) => <li key={a.id}><AdventureCard a={a} small sub={a.end ?? a.start ? `Done ${shortDay((a.end ?? a.start)!)}` : "Done"} /></li>)}
                </ul>
              </section>
            ) : null}
          </aside>
        </div>
      )}
    </main>
  );
}
