import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRightIcon } from "lucide-react";
import { DIALOGUES } from "@reflect/core/practice-settled";
import { Button } from "@/components/ui/button";
import { ThingHeader } from "@/components/headers";
import { requireUser } from "@/server/session";
import { answersOn, recordOf } from "@/server/practice";
import { LEARN } from "../../crumbs";

export const metadata: Metadata = { title: "Annotate" };
export const dynamic = "force-dynamic";

/**
 * The annotation game (Torian, 2026-11-16 22:56Z to 23:08Z): choose a dialogue to annotate. The one filled button
 * starts the dialogue the person has done least; each dialogue below starts its own.
 */
export default async function PracticePage() {
  const user = await requireUser();
  const [record, mine] = await Promise.all([recordOf(user.id), Promise.all(DIALOGUES.map((d) => answersOn(d.id).then((a) => a.filter((x) => x.user === user.id).length)))]);
  const least = DIALOGUES[mine.indexOf(Math.min(...mine))] ?? DIALOGUES[0];
  return (
    <main className="mx-auto w-full max-w-xl px-6 py-6">
      <ThingHeader back="/schole/courses/dialectic" crumbs={[LEARN, { label: "Dialectic", href: "/schole/dialectic" }, { label: "Course", href: "/schole/courses/dialectic" }]} title="Annotate" />
      <div className="mt-6 space-y-8">
        <header className="space-y-3">
          <h1 id="page-title" className="text-3xl font-semibold tracking-tight">Annotate</h1>
          <p className="text-muted-foreground">A game on a dialogue, five passages at a time. Mark what each sentence does with a highlighter and link a reason to its claim. Some sentences are known, and Done shows how you did on those; the rest add your marks to Reflect&apos;s map of the argument.</p>
          <Button asChild size="lg" className="w-full rounded-full"><Link href={`/schole/dialectic/practice/${least.id}`}>Play: {least.title}</Link></Button>
        </header>
        <section aria-labelledby="dialogues" className="space-y-2">
          <h2 id="dialogues" className="text-base font-semibold">Dialogues</h2>
          <ul className="divide-y border-y">
            {DIALOGUES.map((d, i) => (
              <li key={d.id}>
                <Link href={`/schole/dialectic/practice/${d.id}`} className="group flex items-center justify-between gap-3 py-3">
                  <span className="min-w-0">
                    <span className="block font-medium group-hover:underline">{d.title}</span>
                    <span className="text-muted-foreground block text-sm">{d.question}{mine[i] ? ` · ${mine[i]} marks` : ""}</span>
                  </span>
                  <ChevronRightIcon className="text-muted-foreground size-4 shrink-0" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
        {record.any ? (
          <section aria-labelledby="record" className="space-y-1 text-sm">
            <h2 id="record" className="font-semibold">Your record</h2>
            {record.settled ? <p className="text-muted-foreground">{record.right} of {record.settled} known answers matched</p> : null}
            <p className="text-muted-foreground">{record.labels} {record.labels === 1 ? "label" : "labels"} added</p>
            {record.calibration.some((c) => c.n) ? (
              <p className="text-muted-foreground">When you said {record.calibration.filter((c) => c.n).map((c) => `${["a guess", "think so", "sure"][c.confidence - 1]}, you were right ${c.right} of ${c.n}`).join("; ")}.</p>
            ) : null}
          </section>
        ) : null}
        <p><Link href="/schole/dialectic/practice/guide" className="text-muted-foreground text-sm underline underline-offset-4">Guidelines</Link></p>
      </div>
    </main>
  );
}
