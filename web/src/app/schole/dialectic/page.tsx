import type { Metadata } from "next";
import Link from "next/link";
import { topicKey } from "@reflect/core/argument";
import { rankDialectics } from "@reflect/core/dialectics";
import { WORKS, workById, type Work } from "@reflect/core/topic-pages";
import { Button } from "@/components/ui/button";
import { PAGE } from "@/components/page-header";
import { SectionHead } from "@/components/section-head";
import { requireUser } from "@/server/session";
import { listDebates } from "@/server/dialectic-store";
import { pointsOf, postCounts } from "@/server/discussion-store";
import { listExaminations } from "@/server/examination-store";
import { listItems, type LearnItem } from "@/server/ways-store";
import { LearnHeader } from "../header";
import { PointsLadder, topicHref } from "./discussion";
import { DebateRow, Face } from "./parts";

export const metadata: Metadata = { title: "Dialectic" };
export const dynamic = "force-dynamic";

const norm = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9 ]/g, " ").replace(/\b(the|of|a|an)\b/g, " ").replace(/\s+/g, " ").trim();

/** The Scholē works among what the person keeps: by its recording, or by its title and author. */
function keptWorks(items: readonly LearnItem[]): Set<string> {
  const out = new Set<string>();
  for (const i of items) {
    const ab = i.url ? /\/audiobooks\/(\d+)/.exec(i.url)?.[1] : undefined;
    const t = norm(i.title);
    for (const w of WORKS as readonly Work[]) {
      const wt = norm(w.title);
      const last = norm(w.by).split(" ").pop() ?? "";
      if ((ab && w.audiobooks.includes(ab)) || (wt && (t === wt || ` ${t} `.includes(` ${wt} `)) && (!i.by || !last || norm(i.by).includes(last)))) out.add(w.id);
    }
  }
  return out;
}

/**
 * Dialectic (Torian, 2026-11-16 09:09Z "build it"; 09:43Z: wait on live rooms, open on curated dialectics, discussions
 * by topic that can be formalized into written debates). It opens on standing questions argued across the ages, those
 * drawing on what the person keeps first; then debates, the person's points, and their examinations.
 */
export default async function DialecticPage() {
  const user = await requireUser();
  const [debates, exams, items, points] = await Promise.all([listDebates(), listExaminations(user.id), listItems(user.id).catch(() => []), pointsOf(user.id)]);
  const ranked = rankDialectics(keptWorks(items));
  const counts = await postCounts(ranked.map((r) => topicKey("dialectic", r.d.id)));
  const live = debates.live[0];
  const open = [...debates.live, ...debates.upcoming];
  return (
    <main className={PAGE}>
      <LearnHeader on="browse" />
      <div className="mt-6 space-y-8">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold tracking-tight">Dialectic</h1>
            <p className="text-muted-foreground">Questions argued across the ages, and your answers to them.</p>
          </div>
          <p className="text-right"><span className="text-2xl font-semibold tabular-nums">{points.points}</span> <span className="text-muted-foreground text-sm">{points.points === 1 ? "point" : "points"}{points.posts ? ` from ${points.posts} ${points.posts === 1 ? "post" : "posts"}` : ""}</span></p>
        </header>

        {live ? (
          <section className="border-primary bg-primary/5 space-y-3 rounded-xl border-2 p-4">
            <p className="text-sm font-semibold">Live now · debate</p>
            <p className="text-lg leading-snug font-semibold">{live.motion}</p>
            <div className="flex items-center gap-3">
              <span className="flex -space-x-2"><Face p={live.seats.for} size={28} empty={!live.seats.for} /><Face p={live.seats.against} size={28} empty={!live.seats.against} /></span>
              <span className="text-muted-foreground text-sm">For and against</span>
              <Button asChild className="ml-auto rounded-full"><Link href={live.roomId ? `/schole/dialectic/rooms/${live.roomId}` : `/schole/dialectic/debates/${live.id}`}>{live.roomId ? "Listen" : "Read"}</Link></Button>
            </div>
          </section>
        ) : null}

        <section className="space-y-3">
          <SectionHead title="Questions across the ages" note="Standing questions, with where each side is argued. Say where you stand." />
          <ul className="grid gap-3 sm:grid-cols-2">
            {ranked.map(({ d, because }, i) => {
              const n = counts.get(topicKey("dialectic", d.id)) ?? 0;
              const w = because ? workById(because) : undefined;
              return (
                <li key={d.id}>
                  <Link href={topicHref("dialectic", d.id)} className={`hover:bg-muted/50 flex h-full flex-col gap-1.5 rounded-lg border p-4 ${i === 0 ? "sm:col-span-2" : ""}`}>
                    {w ? <span className="text-xs font-medium">Because you keep the {w.title}</span> : <span className="text-muted-foreground text-xs">{d.subject}</span>}
                    <span className={`leading-snug font-semibold ${i === 0 ? "text-xl" : "text-base"}`}>{d.question}</span>
                    <span className="text-muted-foreground line-clamp-2 text-sm">{d.about}</span>
                    <span className="text-muted-foreground mt-auto pt-1 text-xs">{[...new Set(d.positions.map((p) => p.who.replace(/ \(.*\)$/, "")))].join(", ")}{n ? ` · ${n} ${n === 1 ? "post" : "posts"}` : ""}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
          <p className="text-muted-foreground text-sm">Every <Link href="/schole/ideas" className="underline underline-offset-4">Great Idea</Link>, term and work has its own discussion too; open it from its page.</p>
          <PointsLadder />
        </section>

        <section className="space-y-2">
          <SectionHead title="Debates" add={{ label: "Host a debate", href: "/schole/dialectic/debates/new" }} note="Formalize any post into a written debate, or host one to hold live." />
          {open.length ? <ul className="divide-y">{open.slice(0, 8).map((d) => <DebateRow key={d.id} d={d} />)}</ul>
            : <p className="text-muted-foreground text-sm">No debates yet. Under any post, Debate this starts a written one: each side writes in turn within a character count.</p>}
          {debates.ended.length ? (
            <details className="pt-1"><summary className="text-muted-foreground cursor-pointer text-sm">Debates that have ended</summary><ul className="divide-y">{debates.ended.slice(0, 12).map((d) => <DebateRow key={d.id} d={d} />)}</ul></details>
          ) : null}
        </section>

        <section className="space-y-2">
          <SectionHead title="Examinations" note="People question you on what you learned, and attest in their own words. Start one from a course." />
          {exams.length ? (
            <ul className="divide-y">
              {exams.slice(0, 5).map((e) => <li key={e.id}><Link href={`/schole/examinations/${e.id}`} className="block py-2 hover:underline hover:underline-offset-2">{e.courseTitle} <span className="text-muted-foreground text-sm">· {e.examiners.length === 1 ? "1 examiner" : `${e.examiners.length} examiners`}</span></Link></li>)}
            </ul>
          ) : null}
        </section>
      </div>
    </main>
  );
}
