import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckIcon } from "lucide-react";
import { ZONES } from "@reflect/core/work-browse";
import { ThingHeader } from "@/components/headers";
import { PAGE } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { requireUser } from "@/server/session";
import { jobByCode, jobSkills } from "@/server/work-catalog";
import { pathOf, stepsDone } from "@/server/actions/paths";
import { workFit } from "@/server/fit-store";
import { pathStepAction, startPathAction } from "../../paths-actions";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const job = jobByCode((await params).code);
  return { title: job ? `${job.title}: career path` : "Career path" };
}

/**
 * A job followed as a career path (doc "Work and Scholē as Reflect apps", Career paths; modelled on Uxcel's career
 * path page): the job's O*NET tasks are the syllabus, each marked done by the person, and someone who does the work
 * looks at what they made.
 */
export default async function PathPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const job = jobByCode(code);
  if (!job) notFound();
  const user = await requireUser();
  const [rec, fit] = await Promise.all([pathOf(user.id, code), workFit(user.id, 1000)]);
  const following = rec?.state === "following";
  const finished = rec?.state === "done";
  const done = rec && (following || finished) ? await stepsDone(user.id, rec.id) : new Set<number>();
  const steps = job.tasks.map((task, i) => ({ n: i + 1, task, done: done.has(i + 1) }));
  const current = finished ? null : steps.find((s) => !s.done) ?? null;

  const table = jobSkills();
  const skills = (table?.skills.jobs[code] ?? []).slice(0, 6).map((i) => table?.skills.names[i]).filter((s): s is string => Boolean(s));
  const related = job.related.map(jobByCode).filter((j) => j !== null).slice(0, 6);
  const fitHere = fit.fits.find((f) => f.job.code === code);
  const leads = (fitHere?.crafts ?? []).map((id) => fit.crafts.find((c) => c.craft?.id === id)?.craft).filter((c) => c != null);

  return (
    <main className={PAGE}>
      <ThingHeader back={`/life/work/jobs/${code}`} backLabel={job.title} crumbs={[{ label: "Home", href: "/" }, { label: "Work", href: "/life/work" }, { label: job.title, href: `/life/work/jobs/${code}` }]} title={job.title} />
      <div className="mt-4 grid gap-2">
        <p className="text-muted-foreground text-xs tracking-wide uppercase">Career path{finished ? " · Finished" : ""}</p>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 id="page-title" className="min-w-0 scroll-mt-20 text-[28px] leading-tight font-semibold tracking-tight first-letter:uppercase">{job.title}</h1>
          {finished ? null : following ? (
            current ? <Button asChild><a href={`#step-${current.n}`}>Resume step {current.n}</a></Button> : null
          ) : (
            <form action={startPathAction.bind(null, code)}><Button type="submit">Start here</Button></form>
          )}
        </div>
        <p className="text-muted-foreground line-clamp-2 max-w-3xl text-sm">{job.about}</p>
      </div>

      <div className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <section className="grid content-start gap-3 lg:col-start-1 lg:row-start-1">
          <h2 className="text-lg font-semibold tracking-tight">Syllabus</h2>
          <p className="text-muted-foreground text-sm">No course yet: each step is a task people in this job do. Do it, then mark it.</p>
          {steps.length ? (
            <ol className="divide-y rounded-xl border">
              {steps.map((s) => {
                const isCurrent = current?.n === s.n;
                return (
                  <li key={s.n} id={`step-${s.n}`} className="flex scroll-mt-20 items-start gap-3 px-4 py-3">
                    {following ? (
                      <form action={pathStepAction.bind(null, code, s.n, !s.done)} className="pt-0.5">
                        <button type="submit" aria-label={s.done ? `Mark step ${s.n} not done` : `Mark step ${s.n} done`} aria-pressed={s.done} className={cn("flex size-5 items-center justify-center rounded border transition", s.done ? "bg-primary border-primary text-primary-foreground" : "hover:bg-accent")}>
                          {s.done ? <CheckIcon className="size-3.5" /> : null}
                        </button>
                      </form>
                    ) : (
                      <span aria-hidden className={cn("mt-0.5 flex size-5 shrink-0 items-center justify-center rounded border", s.done && "bg-primary border-primary text-primary-foreground")}>{s.done ? <CheckIcon className="size-3.5" /> : null}</span>
                    )}
                    <span className={cn("grid min-w-0 gap-0.5 text-sm", s.done && "text-muted-foreground", isCurrent && "font-semibold")}>
                      <span><span className="tabular-nums">{s.n}.</span> {s.task}</span>
                      {isCurrent ? <span className="text-muted-foreground text-xs font-normal">{s.n === 1 && !steps.some((x) => x.done) ? "Start here" : "Next"}</span> : null}
                    </span>
                  </li>
                );
              })}
            </ol>
          ) : <p className="text-muted-foreground text-sm">O*NET lists no tasks for this job yet.</p>}
        </section>

        <aside className="grid content-start gap-5 text-sm lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <h2 className="text-lg font-semibold tracking-tight">About the job</h2>
          {job.pay || job.zone ? (
            <div className="grid gap-1">
              {job.pay ? <p>${job.pay.toLocaleString("en-US")} median pay a year</p> : null}
              {job.zone ? <p className="text-muted-foreground">{ZONES[job.zone]}</p> : null}
            </div>
          ) : null}
          {skills.length ? (
            <div className="grid gap-1">
              <h3 className="font-medium">Skills it uses most</h3>
              <ul className="text-muted-foreground grid gap-0.5">{skills.map((s) => <li key={s}>{s}</li>)}</ul>
            </div>
          ) : null}
          {related.length ? (
            <div className="grid gap-1">
              <h3 className="font-medium">Related paths</h3>
              <ul className="grid gap-0.5">{related.map((j) => <li key={j.code}><Link href={`/life/work/paths/${j.code}`} className="hover:underline">{j.title}</Link></li>)}</ul>
            </div>
          ) : null}
          {leads.length ? (
            <div className="grid gap-1">
              <h3 className="font-medium">Your crafts that lead here</h3>
              <ul className="grid gap-0.5">{leads.map((c) => <li key={c.id}><Link href={`/life/work/matches?craft=${c.id}`} className="hover:underline">{c.label}</Link></li>)}</ul>
            </div>
          ) : null}
        </aside>

        <section className="grid content-start gap-2 lg:col-start-1 lg:row-start-2">
          <h2 className="text-lg font-semibold tracking-tight">Examinations</h2>
          <p className="text-sm">When you have made something for a step, ask someone who does this work to look at it.</p>
          <p className="text-sm"><Link href="/life/friends" className="text-muted-foreground underline underline-offset-2">Find someone among your friends</Link></p>
        </section>
      </div>
    </main>
  );
}
