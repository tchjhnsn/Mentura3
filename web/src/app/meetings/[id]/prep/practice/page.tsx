import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { rehearsedCount } from "@reflect/core/meetings";
import { afterAnswer, practiceQueue, readRound, roundParams, type PracticeRound } from "@reflect/core/meetings-practice";
import { ThingHeader } from "@/components/headers";
import { PAGE } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { meetingFor, prepOf } from "@/server/meetings-store";
import { requireUser } from "@/server/session";
import { practiceRehearsedAction } from "../actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Practice" };
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

const at = (id: string, r: PracticeRound, show = false) => `/meetings/${id}/prep/practice?${new URLSearchParams({ ...roundParams(r), ...(show ? { show: "1" } : {}) })}`;

/**
 * Practice (design guide, Meeting prep): the host's questions one at a time, unrehearsed first, the answer hidden
 * until "Show my answer". Rehearsed marks it and moves on; Again sends it to the back of the round. The round lives in
 * the page's address, so nothing but the rehearsed marks is kept.
 */
export default async function PracticePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { id } = await params;
  const sp = await searchParams;
  const user = await requireUser();
  const m = await meetingFor(user.id, id);
  if (!m || m.role !== "host") notFound();
  const prep = await prepOf(user.id, id);
  const round = readRound(one(sp.seen), one(sp.again));
  const queue = practiceQueue(prep.questions, round);
  const q = queue[0];
  const show = one(sp.show) === "1";
  const { done, of } = rehearsedCount(prep);
  const back = `/meetings/${id}/prep`;

  return (
    <main className={PAGE}>
      <ThingHeader search={false} crumbs={[{ label: "Meetings", href: "/meetings" }, { label: m.title, href: `/meetings/${id}` }, { label: "Prep", href: back }]} title="Practice" />

      <div className="mx-auto mt-6 grid max-w-2xl gap-6">
        <div className="flex items-baseline justify-between gap-4">
          <h1 id="page-title" className="text-2xl font-bold tracking-tight">Practice</h1>
          <p className="text-muted-foreground text-sm">{done} of {of} rehearsed</p>
        </div>

        {!of ? (
          <div className="grid justify-items-start gap-3 rounded-xl border border-dashed p-6">
            <p>There are no questions to practice yet.</p>
            <Button asChild variant="outline"><Link href={`${back}?add=question#question`}>Add a question</Link></Button>
          </div>
        ) : !q ? (
          <div className="grid justify-items-start gap-3 rounded-xl border p-6">
            <p className="text-lg font-medium">You went through every question.</p>
            <p className="text-muted-foreground text-sm">{done} of {of} rehearsed.</p>
            <div className="flex flex-wrap gap-2">
              <Button asChild><Link href={`/meetings/${id}/prep/practice`}>Go through again</Link></Button>
              <Button asChild variant="ghost"><Link href={back}>Back to prep</Link></Button>
            </div>
          </div>
        ) : (
          <article aria-live="polite" className="grid gap-5 rounded-xl border p-6">
            <p className="text-muted-foreground text-sm">{queue.length} left in this round{q.rehearsed ? " · Rehearsed before" : ""}</p>
            <h2 className="text-xl leading-snug font-semibold break-words sm:text-2xl">{q.question}</h2>
            {show ? (
              <>
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-muted-foreground mb-1 text-xs font-medium tracking-wide uppercase">Your answer</p>
                  {q.answer ? <p className="whitespace-pre-line break-words">{q.answer}</p> : <p className="text-muted-foreground italic">You have not written an answer yet. <Link href={`${back}?edit=question:${q.id}#question`} className="underline underline-offset-2">Write one</Link>.</p>}
                </div>
                <div className="flex flex-wrap gap-2">
                  <form action={practiceRehearsedAction.bind(null, id, q.id, round.seen.join(","), round.again.join(","))}>
                    <Button type="submit">Rehearsed</Button>
                  </form>
                  <Button asChild variant="outline"><Link href={at(id, afterAnswer(round, q.id, "again"))}>Again</Link></Button>
                </div>
              </>
            ) : (
              <div>
                <Button asChild variant="outline"><Link href={at(id, round, true)}>Show my answer</Link></Button>
              </div>
            )}
          </article>
        )}

        <p><Link href={back} className="text-muted-foreground hover:text-foreground text-sm underline underline-offset-2">Back to prep</Link></p>
      </div>
    </main>
  );
}
