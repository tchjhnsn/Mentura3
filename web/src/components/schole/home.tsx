"use client";

// S1 Home, after Uxcel's Home (Mobbin 68933767): continue learning first, a getting-started list for a newcomer, the
// week of study, recommended courses, and Scholē's three parts: nature, habits, reason (Politics VII.13, 1332a38-b11).
import Link from "next/link";
import { CheckCircle2Icon, CircleIcon, ClockIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Num } from "@/components/studio/bits";
import { cn } from "@/lib/utils";
import { Art, CourseCard, Head, PAGE, Progress, Week } from "./parts";
import { useSchole } from "./store";
import { hours, type CourseIndex } from "./index";

type Subj = { id: string; title: string; path: string[] };

/** The lesson to resume in a course: the one last opened when it is not done yet, else the first not done. */
export function nextIn(c: CourseIndex, done: string[], at?: string) {
  if (at && !done.includes(at)) return c.order.find((l) => l.id === at) ?? null;
  return c.order.find((l) => !done.includes(l.id)) ?? null;
}

export function ScholeHome({ courses, subjects }: { courses: CourseIndex[]; subjects: Subj[] }) {
  const { done, at, picks, ready, days } = useSchole();
  const started = courses.filter((c) => at[c.id] || (done[c.id] ?? []).length).sort((a, b) => (at[b.id]?.when ?? "").localeCompare(at[a.id]?.when ?? ""));
  const current = started[0];
  const anyDone = Object.values(done).some((l) => l.length);
  const fromPicks = picks.flatMap((p) => subjects.find((s) => s.id === p)?.path.slice(0, 1) ?? []);
  const rec: CourseIndex[] = (fromPicks.length ? fromPicks : ["nicomachean-ethics", "categories", "politics", "poetics"])
    .map((id) => courses.find((c) => c.id === id)).filter((c): c is CourseIndex => !!c && !started.includes(c));
  // Fill to four with first works the person has not started, so the row is never empty.
  for (const c of courses) if (rec.length < 4 && c.level === "Start here" && !started.includes(c) && !rec.includes(c)) rec.push(c);
  const steps = [
    { t: "Choose what you want to understand", done: picks.length > 0, href: "/schole/start" },
    { t: "Read your first lesson", done: started.length > 0, href: current ? `/schole/c/${current.id}` : `/schole/c/${rec[0]?.id ?? "nicomachean-ethics"}` },
    { t: "Answer its questions", done: anyDone, href: current ? `/schole/c/${current.id}` : "/schole/courses" },
  ];
  const allSet = steps.every((s) => s.done);
  return (
    <div className={PAGE}>
      <Head n="S1" title={current ? "Welcome back" : "Welcome to Scholē"} job="A tool for knowing your nature, building good habits, and expanding your reason. Courses on Aristotle's works, by subject, a lesson at a time." />
      <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
        <div className="min-w-0 space-y-10">
          <section className="relative">
            <Num n="S1.1" className="absolute -top-2 right-0" />
            <h2 className="mb-3 text-lg font-semibold">Continue learning</h2>
            {current && ready ? (() => {
              const d = done[current.id] ?? [];
              const next = nextIn(current, d, at[current.id]?.lesson);
              const left = current.order.filter((l) => !d.includes(l.id)).reduce((n, l) => n + l.minutes, 0);
              return (
                <div className="bg-card flex flex-col gap-4 rounded-xl border p-4 sm:flex-row">
                  <Art subject={current.subject} className="aspect-[16/9] w-full sm:aspect-square sm:w-40" />
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="text-muted-foreground text-[11px] font-medium uppercase tracking-wide">Course · {current.subjectTitle}</span>
                    <Link href={`/schole/c/${current.id}`} className="text-lg font-semibold hover:underline">{current.title}</Link>
                    <span className="text-muted-foreground text-sm">{next ? <>Next: {next.title} <span className="text-xs">({next.unit})</span></> : "Every lesson read. Ready to be examined?"}</span>
                    <div className="mt-2 flex items-center gap-3 text-xs"><Progress value={d.length / current.lessons} className="w-40" /><span className="text-muted-foreground tabular-nums">{d.length} of {current.lessons}</span><span className="text-muted-foreground flex items-center gap-1"><ClockIcon className="size-3.5" />{hours(left)} left</span></div>
                    <div className="mt-auto pt-3">
                      <Button asChild size="lg" className="w-full sm:w-auto sm:px-8"><Link href={next ? `/schole/c/${current.id}/${next.id}` : `/schole/examinations/new?course=${current.id}`}>{next ? "Resume course" : "Put yourself under examination"}</Link></Button>
                    </div>
                  </div>
                </div>
              );
            })() : (
              <div className="rounded-xl border border-dashed p-6 text-center">
                <p className="font-medium">Nothing under way yet</p>
                <p className="text-muted-foreground mx-auto mt-1 max-w-md text-sm">Three questions and you will have a first lesson open: what you want to understand, how long a day, and where to begin.</p>
                <Button asChild className="mt-4"><Link href="/schole/start">Get started</Link></Button>
              </div>
            )}
            {started.length > 1 ? (
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {started.slice(1, 5).map((c) => <li key={c.id}><Link href={`/schole/c/${c.id}`} className="hover:bg-accent flex items-center gap-3 rounded-lg border p-2 text-sm"><Art subject={c.subject} small className="size-10" /><span className="min-w-0 flex-1"><span className="block truncate font-medium">{c.title}</span><Progress value={(done[c.id] ?? []).length / c.lessons} className="mt-1 w-24" /></span></Link></li>)}
              </ul>
            ) : null}
          </section>

          <section className="relative">
            <Num n="S1.4" className="absolute -top-2 right-0" />
            <div className="mb-3 flex items-end justify-between"><h2 className="text-lg font-semibold">Recommended for you</h2><Link href="/schole/courses" className="text-muted-foreground text-sm hover:underline">All courses</Link></div>
            <div className="grid gap-4 sm:grid-cols-2">
              {rec.map((c) => <CourseCard key={c.id} c={c} why={picks.includes(c.subject) ? `You want to understand ${c.subjectTitle.toLowerCase()}. This is where to begin.` : undefined} />)}
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          {allSet ? null : (
            <div className="relative rounded-xl border p-4">
              <Num n="S1.2" className="absolute -top-2 left-4" />
              <div className="font-semibold">Getting started</div>
              <p className="text-muted-foreground mt-0.5 text-sm">Three steps to your first lesson.</p>
              <ul className="mt-3 space-y-1.5">
                {steps.map((s) => <li key={s.t}><Link href={s.href} className={cn("hover:bg-accent flex items-center gap-2 rounded-lg border px-2.5 py-2 text-sm", s.done && "text-muted-foreground")}>{s.done ? <CheckCircle2Icon className="size-4 text-emerald-600" /> : <CircleIcon className="size-4" />}<span className={cn(s.done && "line-through")}>{s.t}</span></Link></li>)}
              </ul>
            </div>
          )}
          <div className="relative"><Num n="S1.3" className="absolute -top-2 right-4 z-10" /><Week /></div>
          <div className="relative rounded-xl border p-4">
            <Num n="S1.5" className="absolute -top-2 left-4" />
            <div className="font-semibold">Nature, habits, reason</div>
            <p className="text-muted-foreground mt-0.5 text-sm">Aristotle says people become good through three things (Politics VII.13).</p>
            <ul className="mt-3 divide-y text-sm">
              <li className="py-2"><Link href="/schole/growth#nature" className="flex justify-between hover:underline"><span>Nature: what draws you</span><span className="text-muted-foreground">{picks.length} {picks.length === 1 ? "subject" : "subjects"}</span></Link></li>
              <li className="py-2"><Link href="/schole/growth#habits" className="flex justify-between hover:underline"><span>Habits: how steadily you study</span><span className="text-muted-foreground">{days.length} {days.length === 1 ? "day" : "days"}</span></Link></li>
              <li className="py-2"><Link href="/schole/growth#reason" className="flex justify-between hover:underline"><span>Reason: what you know</span><span className="text-muted-foreground">{(() => { const n = Object.values(done).reduce((m, l) => m + l.length, 0); return `${n} ${n === 1 ? "lesson" : "lessons"}`; })()}</span></Link></li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
