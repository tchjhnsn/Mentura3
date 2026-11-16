import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SIDES, formatById } from "@reflect/core/dialectic";
import { workById } from "@reflect/core/topic-pages";
import { Button } from "@/components/ui/button";
import { PAGE } from "@/components/page-header";
import { ThingHeader } from "@/components/headers";
import { requireUser } from "@/server/session";
import { getDebate } from "@/server/dialectic-store";
import { LEARN } from "../../../crumbs";
import { remindAction, startDebateAction, takeSeatAction } from "../../actions";
import { LocalTime, LocalWhen } from "../../client";
import { Face, WorkLine } from "../../parts";

export const metadata: Metadata = { title: "Debate" };
export const dynamic = "force-dynamic";

/**
 * A debate (guide tab "Ways and dialectic"): what is argued, from which work, by whom, when and in what format. The
 * one filled button is what to do now: Listen while it is live, Start for its host, else Remind me (which puts it on
 * the person's Scholē schedule).
 */
export default async function DebatePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requireUser();
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const d = await getDebate(id);
  if (!d) notFound();
  const format = formatById(d.format);
  const host = d.host.id === user.id;
  const seated = Object.values(d.seats).some((p) => p?.id === user.id);
  const w = d.workId ? workById(d.workId) : undefined;
  return (
    <main className={PAGE}>
      <ThingHeader back="/schole/dialectic" crumbs={[LEARN, { label: "Dialectic", href: "/schole/dialectic" }]} title={d.motion} />
      <div className="mt-6 max-w-2xl space-y-6">
        <header className="space-y-2">
          <p className="text-muted-foreground text-sm">{d.state === "live" ? "Debate · live now" : d.state === "ended" ? "Debate · ended" : <>Debate · <LocalTime iso={d.startsAt} date /></>}</p>
          <h1 id="page-title" className="text-3xl leading-tight font-semibold tracking-tight">{d.motion}</h1>
          <WorkLine workId={d.workId} source={d.source} />
        </header>

        <section className="grid grid-cols-2 gap-3" aria-label="The sides">
          {SIDES.map((s) => {
            const p = d.seats[s.id];
            return (
              <div key={s.id} className="flex flex-col items-center gap-2 rounded-lg border p-4 text-center">
                <p className="font-semibold">{s.label}</p>
                <Face p={p} size={48} empty={!p} />
                {p ? <p className="text-muted-foreground text-sm">{p.name}</p> : d.state !== "ended" && !seated ? (
                  <form action={takeSeatAction}><input type="hidden" name="id" value={d.id} /><input type="hidden" name="side" value={s.id} /><Button type="submit" variant="outline" size="sm" className="rounded-full">Take this seat</Button></form>
                ) : <p className="text-muted-foreground text-sm">Open seat</p>}
              </div>
            );
          })}
        </section>

        <div className="flex items-center gap-3">
          <Face p={d.host} size={32} />
          <div className="min-w-0"><p className="font-semibold">{d.host.name}</p><p className="text-muted-foreground text-sm">Host · keeps the format and the floor</p></div>
        </div>

        {d.state === "live" ? (
          <Button asChild size="lg" className="w-full rounded-full"><Link href={`/schole/dialectic/rooms/${d.roomId}`}>Listen</Link></Button>
        ) : d.state === "upcoming" && host ? (
          <form action={startDebateAction}><input type="hidden" name="id" value={d.id} /><Button type="submit" size="lg" className="w-full rounded-full">Start the debate</Button></form>
        ) : d.state === "upcoming" ? (
          sp.reminded ? <p className="text-center text-sm">On your <Link href="/schole/schedule" className="underline underline-offset-4">Scholē schedule</Link>.</p> : (
            <form action={remindAction} className="space-y-2 text-center">
              <input type="hidden" name="id" value={d.id} /><LocalWhen iso={d.startsAt} />
              <Button type="submit" size="lg" className="w-full rounded-full">Remind me</Button>
              <p className="text-muted-foreground text-sm">Adds it to your Scholē schedule.</p>
            </form>
          )
        ) : <p className="text-muted-foreground text-sm">This debate has ended. Recordings are not kept yet.</p>}

        {format ? (
          <section className="space-y-2">
            <h2 className="text-lg font-semibold">Format: {format.label}</h2>
            <ol className="divide-y">
              {format.steps.map((s, i) => <li key={s.label} className="flex justify-between gap-3 py-2"><span>{i + 1}. {s.label}</span><span className="text-muted-foreground text-sm">{s.minutes} min</span></li>)}
            </ol>
          </section>
        ) : null}

        {w ? (
          <section className="space-y-2">
            <h2 className="text-lg font-semibold">Before you come</h2>
            <Link href={`/schole/works/${w.id}`} className="hover:bg-muted/50 block rounded-lg border p-3"><span className="font-medium">{w.title}</span><span className="text-muted-foreground block text-sm">{w.by} · every version, recordings first</span></Link>
          </section>
        ) : null}
      </div>
    </main>
  );
}
