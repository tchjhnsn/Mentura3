import type { Metadata } from "next";
import Link from "next/link";
import { workById } from "@reflect/core/topic-pages";
import { Button } from "@/components/ui/button";
import { PAGE } from "@/components/page-header";
import { SectionHead } from "@/components/section-head";
import { requireUser } from "@/server/session";
import { listDebates, listThreads, openRooms } from "@/server/dialectic-store";
import { listExaminations } from "@/server/examination-store";
import { LearnHeader } from "../header";
import { DebateRow, Face } from "./parts";

export const metadata: Metadata = { title: "Dialectic" };
export const dynamic = "force-dynamic";

/**
 * Dialectic (guide tab "Ways and dialectic", Torian 2026-11-16 09:09Z: "build it"): learning by question and answer
 * with other people. Live now first, with the page's one filled button; then debates to come, open rooms, written
 * threads, and the person's own examinations.
 */
export default async function DialecticPage() {
  const user = await requireUser();
  const [debates, rooms, threads, exams] = await Promise.all([listDebates(), openRooms(), listThreads(8), listExaminations(user.id)]);
  const live = debates.live[0];
  return (
    <main className={PAGE}>
      <LearnHeader on="browse" />
      <div className="mt-6 space-y-8">
        <header className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight">Dialectic</h1>
          <p className="text-muted-foreground">Learn by question and answer with other people.</p>
        </header>

        {live ? (
          <section className="border-primary bg-primary/5 space-y-3 rounded-xl border-2 p-4">
            <p className="text-sm font-semibold">Live now · debate</p>
            <p className="text-lg leading-snug font-semibold">{live.motion}</p>
            <div className="flex items-center gap-3">
              <span className="flex -space-x-2"><Face p={live.seats.for} size={28} empty={!live.seats.for} /><Face p={live.seats.against} size={28} empty={!live.seats.against} /></span>
              <span className="text-muted-foreground text-sm">For and against</span>
              <Button asChild className="ml-auto rounded-full"><Link href={`/schole/dialectic/rooms/${live.roomId}`}>Listen</Link></Button>
            </div>
          </section>
        ) : null}

        <section className="space-y-2">
          <SectionHead title="Debates" add={{ label: "Host a debate", href: "/schole/dialectic/debates/new" }} />
          {debates.upcoming.length ? <ul className="divide-y">{debates.upcoming.slice(0, 8).map((d) => <DebateRow key={d.id} d={d} />)}</ul>
            : <p className="text-muted-foreground text-sm">No debates scheduled. A debate has a motion, two sides, a host and a format; host the first one with +.</p>}
          {debates.ended.length ? (
            <details className="pt-1"><summary className="text-muted-foreground cursor-pointer text-sm">Debates that have ended</summary><ul className="divide-y">{debates.ended.slice(0, 12).map((d) => <DebateRow key={d.id} d={d} />)}</ul></details>
          ) : null}
        </section>

        <section className="space-y-3">
          <SectionHead title="Rooms" add={{ label: "Open a room", href: "/schole/dialectic/rooms/new" }} />
          {rooms.length ? (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {rooms.map((r) => (
                <li key={r.id}>
                  <Link href={`/schole/dialectic/rooms/${r.id}`} className="hover:bg-muted/50 flex h-full flex-col gap-1 rounded-lg border p-3">
                    <span className="line-clamp-1 font-semibold">{r.title}</span>
                    <span className="text-muted-foreground line-clamp-2 text-sm">{r.question ?? (r.workId ? workById(r.workId)?.by : "Open table")}</span>
                    <span className="mt-auto flex -space-x-2 pt-2">{[...r.speakers, ...r.listeners].slice(0, 5).map((p) => <Face key={p.id} p={p} size={22} />)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : <p className="text-muted-foreground text-sm">No rooms open. A room is a live table on one work or question; open one with +.</p>}
        </section>

        <section className="space-y-2">
          <SectionHead title="Threads" add={{ label: "Ask a question", href: "/schole/dialectic/threads/new" }} note="Written, for when you can't be there live." />
          {threads.length ? (
            <ul className="divide-y">
              {threads.map((t) => (
                <li key={t.id}>
                  <Link href={`/schole/dialectic/threads/${t.id}`} className="group block py-2">
                    <span className="font-medium group-hover:underline group-hover:underline-offset-2">{t.question}</span>
                    <span className="text-muted-foreground block text-sm">{[t.workId ? workById(t.workId)?.title : null, t.replies === 1 ? "1 reply" : `${t.replies} replies`].filter(Boolean).join(" · ")}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : <p className="text-muted-foreground text-sm">No questions yet; ask one with +.</p>}
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
