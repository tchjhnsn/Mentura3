import Link from "next/link";
import { collectionById, itemHref } from "@reflect/core/collections";
import { DIALOGUES } from "@reflect/core/practice-settled";
import { Button } from "@/components/ui/button";
import { ThingHeader } from "@/components/headers";
import { sizeLine } from "@/server/collections";
import { currentUser } from "@/server/session";
import { recordOf } from "@/server/practice";
import { Fan } from "../playlists/card";
import { LEARN } from "../crumbs";

export type UnitCourse = {
  id: string; name: string; by: string; about: string;
  units: readonly { playlist: string; practice: { work: string; note: string } | null }[];
};

/**
 * A course made of units (Torian, 2026-11-16 21:53Z, "Go"): each unit is a playlist and then practice on a dialogue;
 * the one filled button starts the first unit. `after` holds what a course adds below its units.
 */
export async function UnitCoursePage({ c, after }: { c: UnitCourse; after?: React.ReactNode }) {
  const user = await currentUser();
  const record = user ? await recordOf(user.id) : null;
  const units = c.units.map((u) => ({ ...u, list: collectionById(u.playlist)! }));
  const first = units[0]!.list.items[0]!;
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-6">
      <ThingHeader back="/schole/dialectic" crumbs={[LEARN, { label: "Dialectic", href: "/schole/dialectic" }]} title={c.name} action={<Button asChild size="sm"><Link href={itemHref(first)}>Start</Link></Button>} />
      <div className="mt-6 space-y-10">
        <header className="space-y-3">
          <p className="text-muted-foreground text-sm">Course · by {c.by} · {units.length} units</p>
          <h1 id="page-title" className="text-3xl font-semibold tracking-tight">{c.name}</h1>
          <p className="text-muted-foreground max-w-prose">{c.about}</p>
          <Button asChild size="lg" className="rounded-full px-8"><Link href={itemHref(first)}>Start</Link></Button>
          {record?.any ? <p className="text-muted-foreground text-sm">{record.settled ? `${record.right} of ${record.settled} settled answers right · ` : ""}{record.labels} {record.labels === 1 ? "label" : "labels"} added</p> : null}
        </header>
        <ol className="space-y-8">
          {units.map((u, n) => {
            const d = u.practice ? DIALOGUES.find((x) => x.id === u.practice!.work)! : null;
            return (
              <li key={u.playlist} className="grid gap-4 sm:grid-cols-[12rem_minmax(0,1fr)]">
                <Link href={`/schole/playlists/${u.list.id}`} aria-hidden tabIndex={-1}><Fan items={u.list.items} className="h-32" /></Link>
                <div className="min-w-0 space-y-2">
                  <p className="text-muted-foreground text-sm">Unit {n + 1}</p>
                  <h2 className="text-xl leading-tight font-semibold tracking-tight"><Link href={`/schole/playlists/${u.list.id}`} className="hover:underline hover:underline-offset-4">{u.list.name}</Link></h2>
                  <p className="text-muted-foreground text-sm">{sizeLine(u.list.items)}</p>
                  {u.practice && d ? (
                    <div className="space-y-2 pt-1">
                      <p className="text-[15px]"><span className="font-medium">Practice: {d.title}.</span> {u.practice.note}</p>
                      <Button asChild variant="outline" size="sm" className="rounded-full"><Link href={`/schole/dialectic/practice/${d.id}`}>Practise on {d.title}</Link></Button>
                    </div>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ol>
        {after}
        <p className="text-muted-foreground text-sm"><Link href="/schole/dialectic/practice/guide" className="underline underline-offset-4">Practice guidelines</Link></p>
      </div>
    </main>
  );
}
