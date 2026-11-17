import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckIcon, FileMusicIcon, PlusIcon } from "lucide-react";
import { instrumentById } from "@reflect/core/instruments";
import { audioOf } from "@reflect/core/media";
import { personHref, personNamed } from "@reflect/core/historical-people";
import { Bars, DashHead, Hero } from "@/components/dash";
import { QuickLog } from "@/components/quick-log";
import { ThingHeader } from "@/components/headers";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { requireUser } from "@/server/session";
import { instrumentViewOf } from "@/server/instruments";
import { PlayButton } from "../../play-button";
import { browseCrumbs } from "../../crumbs";
import { learnedAction, logPracticeAction } from "./actions";

export async function generateMetadata({ params }: { params: Promise<{ instrument: string }> }): Promise<Metadata> {
  return { title: instrumentById((await params).instrument)?.name ?? "Course" };
}
export const dynamic = "force-dynamic";

const weekday = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString("en-US", { weekday: "narrow", timeZone: "UTC" });
const shortDay = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
const MINUTES = [10, 15, 20, 30, 45, 60, 90, 120].map((v) => ({ value: v, label: v >= 60 ? `${v / 60 % 1 ? (v / 60).toFixed(1) : v / 60} h` : `${v} min` }));

/** A composer's name, opening their page in Scholē when there is one. */
function Composer({ name }: { name: string }) {
  const p = personNamed(name);
  return p ? <Link href={personHref(p)} className="hover:underline hover:underline-offset-4">{name}</Link> : <>{name}</>;
}

/**
 * Learn an instrument (Torian, 2026-11-17: learning piano goes inside Scholē; practice lives inside courses). Laid out
 * as Scholē's unit courses are, with a tile's hero on top: the piece to practise today, Listen to its recording first,
 * its score on IMSLP, and Log practice as the one filled act, with the last two weeks of minutes under it. Then every
 * piece in order, each to hear, to read and to mark learned. Writing happens only in the journal, so no notes here.
 */
export default async function InstrumentPage({ params }: { params: Promise<{ instrument: string }> }) {
  const x = instrumentById((await params).instrument);
  if (!x) notFound();
  const user = await requireUser();
  const today = new Date().toISOString().slice(0, 10);
  const v = await instrumentViewOf(user.id, x, today);
  const cur = v.current;
  const curAudio = cur ? audioOf(cur.recording.url) : null;
  const href = `/schole/courses/${x.id}`;
  const log = (
    <QuickLog title="Log practice" action={logPracticeAction.bind(null, x.id)} trigger={<><PlusIcon />Log practice</>} choices={[
      ...(cur ? [{ id: cur.id, label: cur.title, amounts: MINUTES }] : []),
      { id: "technique", label: "Scales and exercises", amounts: MINUTES },
    ]} />
  );
  const top = Math.max(30, ...v.days.map((d) => d.minutes));
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6">
      <ThingHeader back="/schole" crumbs={browseCrumbs("course")} title={x.name} />
      <div className="mt-6 grid grid-cols-1 gap-10">
        <header className="space-y-3">
          <p className="text-muted-foreground text-sm">Course · by {x.by} · {x.pieces.length} pieces · {v.learned.length} learned</p>
          <h1 id="page-title" className="text-3xl font-semibold tracking-tight">{x.name}</h1>
          <p className="text-muted-foreground max-w-prose">{x.about}</p>
        </header>

        <Hero>
          {cur ? (
            <div className="grid min-w-0 gap-1">
              <span className="text-muted-foreground text-sm">Practise today</span>
              <span className="text-2xl leading-tight font-bold tracking-tight sm:text-3xl">{cur.title}</span>
              <span className="text-muted-foreground">{cur.composer} · {cur.era} · Grade {cur.grade}</span>
              <span className="text-foreground/80 mt-1 max-w-prose text-sm">{cur.why}</span>
            </div>
          ) : (
            <div className="grid gap-1">
              <span className="text-muted-foreground text-sm">Every piece learned</span>
              <span className="text-2xl font-bold tracking-tight">You have learned all {x.pieces.length} pieces.</span>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2">
            {log}
            {cur && curAudio ? <PlayButton src={curAudio.src} title={cur.title} by={cur.composer} href={href} label="Listen" variant="outline" /> : null}
            {cur ? <Button asChild variant="outline"><a href={cur.imslp} target="_blank" rel="noreferrer"><FileMusicIcon />Score</a></Button> : null}
          </div>
          <div className="grid gap-1">
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="text-muted-foreground">The last two weeks</span>
              <span><span className="font-semibold">{v.week} min</span> <span className="text-muted-foreground">this week{v.inARow > 1 ? ` · ${v.inARow} days in a row` : ""}</span></span>
            </div>
            <Bars values={v.days.map((d) => d.minutes || null)} max={top} labels={v.days.map((d) => `${shortDay(d.day)}: ${d.minutes} min`)} className="h-12" />
            <span className="text-muted-foreground flex justify-between text-xs">{v.days.map((d) => <span key={d.day} className={cn("flex-1 text-center", d.day === today && "text-foreground font-semibold")}>{weekday(d.day)}</span>)}</span>
          </div>
        </Hero>

        <section className="grid grid-cols-1 gap-3" aria-label="The pieces">
          <DashHead title="The pieces" />
          <ol className="divide-y">
            {v.pieces.map((p, n) => {
              const a = audioOf(p.recording.url);
              return (
                <li key={p.id} className="flex items-start gap-2 py-3">
                  <span className="text-muted-foreground w-5 shrink-0 pt-0.5 text-right text-sm tabular-nums">{p.learned ? <CheckIcon className="ml-auto size-4" aria-label="Learned" /> : n + 1}</span>
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <p className={cn("font-medium leading-snug", p.current && "text-primary")}>{p.title}{p.current ? <span className="text-muted-foreground font-normal"> · today</span> : null}</p>
                    <p className="text-muted-foreground text-[13px]"><Composer name={p.composer} /> · {p.year} · {p.era} · Grade {p.grade}</p>
                    <p className="text-muted-foreground truncate text-xs">From {p.from} · Recording: {a ? <a href={a.page} target="_blank" rel="noreferrer" className="underline underline-offset-2">{p.recording.credit}</a> : p.recording.credit}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {a ? <PlayButton src={a.src} title={p.title} by={p.composer} href={href} /> : null}
                    <Button asChild size="icon" variant="ghost" className="size-9 rounded-full"><a href={p.imslp} target="_blank" rel="noreferrer" aria-label={`Score of ${p.title} on IMSLP`} title="Score on IMSLP"><FileMusicIcon /></a></Button>
                    <form action={learnedAction.bind(null, x.id, p.id, !p.learned)}>
                      <Button size="icon" variant={p.learned ? "secondary" : "ghost"} className="size-9 rounded-full" aria-label={p.learned ? `Learned: ${p.title}. Take back` : `Mark ${p.title} learned`} title={p.learned ? "Learned" : "Mark learned"}><CheckIcon /></Button>
                    </form>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>

        <p className="text-muted-foreground text-xs">Grades are approximate, after the ABRSM and RCM graded syllabuses. Every piece is in the public domain; scores from IMSLP, recordings from Wikimedia Commons under the licences named. Reflect keeps your minutes and the pieces you have learned, on your shelves under Practice.</p>
      </div>
    </main>
  );
}
