import type { Metadata } from "next";
import Link from "next/link";
import { craftOf, craftPhoto, firstProjectOf, matchCrafts, worldName, type MatchResult } from "@reflect/core/crafts";
import { PAGE } from "@/components/page-header";
import { TaskHeader } from "@/components/headers";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/server/session";
import { myCrafts, myPicks } from "@/server/crafts-store";
import { Photo } from "../photo";
import { KeepOnOpen, ShareCrafts } from "./parts";

export const metadata: Metadata = { title: "Your three crafts" };
export const dynamic = "force-dynamic";

/** Skip's starter set: one craft from each of three far-apart worlds, and a fourth as the surprise. */
const RANGE: MatchResult = {
  top: [{ id: "cooking", because: [] }, { id: "pottery", because: [] }, { id: "drawing", because: [] }],
  surprise: { id: "singing", because: "Something new: Stage and sport" },
};

const label = (id: string) => craftOf(id)?.label ?? id;
/** "A", "A and B", "A, B and C". */
const and = (xs: string[]) => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs.at(-1)}`);

/**
 * Your three crafts (picker design guide, Screen 3): the best match with its first project and Start, two more,
 * and a surprise, each saying which picks led to it. Opening it keeps the three as Drawn to it.
 */
export default async function MatchesPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const user = await requireUser();
  const [{ worlds, picks }, mine, sp] = await Promise.all([myPicks(user.id), myCrafts(user.id), searchParams]);
  const range = sp.range === "1" || !picks.length;
  const result = range ? RANGE : matchCrafts(picks);
  const kept = new Set(mine.map((c) => c.ref));
  const why = (m: { id: string; because: string[] }) =>
    range ? `From ${worldName(craftOf(m.id)?.group ?? "")}` : m.because.length ? `Because you picked ${and(m.because.slice(0, 2).map(label))}` : "A good place to start";
  const sub = range
    ? "Picked for range. Tune them any time."
    : `From your ${picks.length} ${picks.length === 1 ? "pick" : "picks"}: ${picks.length <= 3 ? and(picks.map(label)) : `${picks.slice(0, 3).map(label).join(", ")} and ${picks.length - 3} more`}`;
  const [first, ...rest] = result.top;
  const firstCraft = first ? craftOf(first.id) : undefined;
  const project = first ? firstProjectOf(first.id) : undefined;
  const change = worlds.length ? "/life/work/discover?step=crafts" : "/life/work/discover";

  return (
    <main className={PAGE}>
      <TaskHeader back={{ href: "/life/work", label: "Back to Work" }} title="Work" position="Your three crafts" />
      <KeepOnOpen ids={result.top.map((m) => m.id).filter((id) => !kept.has(id))} />
      <div className="mx-auto mt-4 grid w-full max-w-2xl grid-cols-[minmax(0,1fr)] gap-5">
        <div className="grid gap-1">
          <h1 className="text-xl leading-tight font-bold">Your three crafts</h1>
          <p className="text-muted-foreground text-sm text-pretty">{sub}</p>
        </div>

        {first && firstCraft ? (
          <article className="bg-card overflow-hidden rounded-2xl border">
            <Link href={`/life/work/crafts/${first.id}`} className="block">
              <Photo src={craftPhoto(first.id)?.src} name={firstCraft.label} eager className="aspect-[16/10] w-full sm:aspect-[2/1]" />
            </Link>
            <div className="grid gap-3 p-4">
              <div className="grid gap-0.5">
                <h2 className="text-lg leading-tight font-bold"><Link href={`/life/work/crafts/${first.id}`} className="hover:underline">{firstCraft.label}</Link></h2>
                <p className="text-muted-foreground text-sm">{why(first)}</p>
              </div>
              <div className="flex items-end justify-between gap-3 border-t pt-3">
                {project ? (
                  <>
                    <div className="grid min-w-0 gap-0.5">
                      <span className="text-muted-foreground text-xs">First project, {project.minutes} minutes</span>
                      <span className="font-medium">{project.name}</span>
                    </div>
                    <Button asChild size="lg" className="shrink-0"><Link href={`/life/work/crafts/${first.id}/project`}>Start</Link></Button>
                  </>
                ) : (
                  <Button asChild size="lg" className="ml-auto"><Link href={`/life/work/crafts/${first.id}`}>Open {firstCraft.label}</Link></Button>
                )}
              </div>
            </div>
          </article>
        ) : null}

        {rest.length ? (
          <ul className="grid gap-3 sm:grid-cols-2">
            {rest.map((m) => {
              const c = craftOf(m.id)!;
              const p = firstProjectOf(m.id);
              return (
                <li key={m.id}>
                  <Link href={`/life/work/crafts/${m.id}`} className="bg-card hover:bg-accent grid h-full grid-cols-[5.5rem_minmax(0,1fr)] items-start gap-3 rounded-2xl border p-3 transition-colors">
                    <Photo src={craftPhoto(m.id)?.src} name={c.label} className="aspect-square w-full rounded-xl" />
                    <span className="grid gap-0.5">
                      <span className="font-semibold leading-tight">{c.label}</span>
                      <span className="text-muted-foreground text-sm leading-snug">{why(m)}</span>
                      {p ? <span className="mt-1 text-xs">First project: {p.name}, {p.minutes} min</span> : null}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : null}

        {result.surprise && craftOf(result.surprise.id) ? (
          <Link href={`/life/work/crafts/${result.surprise.id}`} className="border-primary/60 hover:bg-primary/5 grid grid-cols-[minmax(0,1fr)_3.5rem] items-center gap-3 rounded-2xl border-2 border-dashed p-4 transition-colors">
            <span className="grid gap-0.5">
              <span className="text-primary text-xs font-semibold">A surprise</span>
              <span className="font-semibold">{label(result.surprise.id)}</span>
              <span className="text-muted-foreground text-sm">{result.surprise.because}</span>
            </span>
            <Photo src={craftPhoto(result.surprise.id)?.src} name={label(result.surprise.id)} className="size-14 rounded-full" />
          </Link>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
          <ShareCrafts names={result.top.map((m) => label(m.id))} />
          <Button asChild variant="ghost" className="-mr-3"><Link href={change}>Change picks</Link></Button>
        </div>
      </div>
    </main>
  );
}
