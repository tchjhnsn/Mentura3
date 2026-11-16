import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { collectionById, itemHref } from "@reflect/core/collections";
import { DEBATE_COURSES, debateCourse } from "@reflect/core/start-debates";
import { Button } from "@/components/ui/button";
import { ThingHeader } from "@/components/headers";
import { sizeLine } from "@/server/collections";
import { Fan } from "../../../playlists/card";
import { LEARN } from "../../../crumbs";

export function generateStaticParams() {
  return DEBATE_COURSES.map((c) => ({ id: c.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const c = debateCourse((await params).id);
  return { title: c?.name ?? "Course" };
}

/**
 * A course on the quarrels new art and new inventions start (Torian, 2026-11-16 22:33Z). Laid out like the course on
 * dialectic: each unit is a playlist, with the question argued in it; the one filled button starts the first unit.
 * The question is there to read, not to answer on the page: writing belongs in the journal.
 */
export default async function DebateCoursePage({ params }: { params: Promise<{ id: string }> }) {
  const c = debateCourse((await params).id);
  if (!c) notFound();
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
        </header>
        <ol className="space-y-8">
          {units.map((u, n) => (
            <li key={u.playlist} className="grid gap-4 sm:grid-cols-[12rem_minmax(0,1fr)]">
              <Link href={`/schole/playlists/${u.list.id}`} aria-hidden tabIndex={-1}><Fan items={u.list.items} className="h-32" /></Link>
              <div className="min-w-0 space-y-2">
                <p className="text-muted-foreground text-sm">Unit {n + 1}</p>
                <h2 className="text-xl leading-tight font-semibold tracking-tight"><Link href={`/schole/playlists/${u.list.id}`} className="hover:underline hover:underline-offset-4">{u.list.name}</Link></h2>
                <p className="text-[15px]">{u.question}</p>
                <p className="text-muted-foreground text-sm">{u.list.about}</p>
                <p className="text-muted-foreground text-sm">{sizeLine(u.list.items)}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </main>
  );
}
