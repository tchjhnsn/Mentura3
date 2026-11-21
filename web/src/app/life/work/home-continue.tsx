import Link from "next/link";
import type { Fit } from "@reflect/core/job-fit";
import { Button } from "@/components/ui/button";
import { startPathAction } from "./paths-actions";

/** A followed path, ready for the Continue card: its code and title, the tasks, and the task numbers done. */
export type Following = { code: string; title: string; tasks: readonly string[]; done: ReadonlySet<number> };

const CARD = "grid gap-3 rounded-2xl border-2 border-foreground p-5 sm:p-6";

/** The first step not done (1-based), or the last step when all are done. */
function nextStep(p: Following): number {
  const i = p.tasks.findIndex((_, k) => !p.done.has(k + 1));
  return i === -1 ? p.tasks.length : i + 1;
}

/**
 * Continue (Work home, P1): the path the person follows, with its next step as the title, a thin bar of steps done
 * and the page's one filled button. The only heavy border on the page.
 */
export function ContinuePath({ p }: { p: Following }) {
  const n = nextStep(p);
  const total = p.tasks.length;
  const done = p.tasks.filter((_, k) => p.done.has(k + 1)).length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  return (
    <section aria-labelledby="continue" className={CARD}>
      <p className="text-muted-foreground text-xs">{p.title} path · step {n} of {total}</p>
      <h2 id="continue" className="line-clamp-2 text-lg leading-snug font-semibold tracking-tight sm:text-xl">{p.tasks[n - 1] ?? p.title}</h2>
      <div role="progressbar" aria-label="Steps done" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done} className="bg-muted h-1 overflow-hidden rounded-full">
        <div className="bg-foreground h-full rounded-full" style={{ width: `${pct}%` }} />
      </div>
      <p className="text-muted-foreground text-xs">{done} of {total} steps done</p>
      <div className="pt-1">
        <Button asChild className="w-full sm:w-auto"><Link href={`/life/work/paths/${p.code}#step-${n}`}>Resume step {n}</Link></Button>
      </div>
    </section>
  );
}

/** Continue with no path followed (Work home, P1): the top fit as a path to start, with its first reason from the data. */
export function StartPath({ fit }: { fit: Fit }) {
  const reason = fit.reasons[0];
  return (
    <section aria-labelledby="continue" className={CARD}>
      <p className="text-muted-foreground text-xs">Start a career path</p>
      <h2 id="continue" className="line-clamp-2 text-lg leading-snug font-semibold tracking-tight sm:text-xl">
        <Link href={`/life/work/jobs/${fit.job.code}`} className="hover:underline underline-offset-4">{fit.job.title}</Link>
      </h2>
      {reason ? <p className="text-muted-foreground line-clamp-2 text-sm">{reason}</p> : null}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1">
        <form action={startPathAction.bind(null, fit.job.code)} className="w-full sm:w-auto">
          <Button type="submit" className="w-full sm:w-auto">Start this path</Button>
        </form>
        <Link href="/life/work/matches" className="text-muted-foreground hover:text-foreground text-sm underline-offset-4 hover:underline">See all jobs that fit you</Link>
      </div>
    </section>
  );
}
