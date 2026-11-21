"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDownIcon, ClockIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LessonRow, Progress, StartDialog } from "@/components/schole/parts";
import { useSchole } from "@/components/schole/store";
import { nextIn } from "@/components/schole/home";
import { hours, type CourseIndex } from "@/components/schole/index";
import type { UnitMedia } from "@reflect/core/aristotle/media";
import { UnitMediaRow, type Book } from "./media";

type L = { id: string; title: string; minutes: number; checks: number };
type U = { id: string; title: string; line: string; bekker: string; lessons: L[] };

/** Start course, or Continue at the next lesson once one is read. */
export function CourseActions({ course }: { course: CourseIndex }) {
  const { done, at } = useSchole();
  const d = done[course.id] ?? [];
  const next = nextIn(course, d, at[course.id]?.lesson);
  const label = d.length === 0 && !at[course.id] ? "Start course" : next ? "Continue learning" : "Review the course";
  return <Button asChild size="lg"><Link href={`/schole/c/${course.id}/${(next ?? course.order[0]!).id}`}>{label}</Link></Button>;
}

/** L1.4 How far you are, time left, and Continue. */
export function CourseProgress({ course }: { course: CourseIndex }) {
  const { done } = useSchole();
  const d = done[course.id] ?? [];
  const left = course.order.filter((l) => !d.includes(l.id)).reduce((n, l) => n + l.minutes, 0);
  return (
    <div>
      <div className="font-semibold">Your progress</div>
      <div className="mt-2 flex items-center gap-2 text-xs"><Progress value={d.length / course.lessons} className="flex-1" /><span className="text-muted-foreground tabular-nums">{Math.round((d.length / course.lessons) * 100)}%</span></div>
      <p className="text-muted-foreground mt-1 flex items-center gap-1 text-xs"><ClockIcon className="size-3.5" />{hours(left)} left · {d.length} of {course.lessons} lessons read and checked</p>
      <div className="mt-3"><CourseActions course={course} /></div>
    </div>
  );
}

/** L1.3 One level per book, as Uxcel's levels: title, what it does, progress, and its lessons; a lesson opens C9. */
export function Units({ course, units, media, book }: { course: string; units: U[]; media?: Record<string, UnitMedia>; book?: Book | null }) {
  const { done, at } = useSchole();
  const d = done[course] ?? [];
  const here = at[course]?.lesson;
  const [shut, setShut] = useState<string[]>([]);
  const [pick, setPick] = useState<L | null>(null);
  return (
    <div className="space-y-8">
      {units.map((u, i) => {
        const n = u.lessons.filter((l) => d.includes(l.id)).length;
        const open = !shut.includes(u.id);
        return (
          <section key={u.id}>
            <button type="button" onClick={() => setShut(open ? [...shut, u.id] : shut.filter((x) => x !== u.id))} aria-expanded={open} className="flex w-full items-start gap-3 text-left">
              <div className="min-w-0 flex-1">
                <div className="text-muted-foreground text-[11px] font-medium tracking-wide"><span className="uppercase">Unit {i + 1}</span>{u.bekker ? ` · Bekker ${u.bekker}` : ""}</div>
                <h3 className="text-lg font-semibold">{u.title}</h3>
                <p className="text-muted-foreground text-sm">{u.line}</p>
              </div>
              <span className="flex shrink-0 items-center gap-2 pt-4 text-xs"><Progress value={n / u.lessons.length} className="w-16" /><span className="text-muted-foreground tabular-nums">{n}/{u.lessons.length}</span><ChevronDownIcon className={cn("size-4 transition", !open && "-rotate-90")} /></span>
            </button>
            {open ? <UnitMediaRow media={media?.[u.id] ?? null} book={book ?? null} /> : null}
            {open ? (
              <ul className="mt-3 space-y-2">
                {u.lessons.map((l) => <li key={l.id}><LessonRow course={course} id={l.id} title={l.title} minutes={l.minutes} here={l.id === here} onPick={() => setPick(l)} /></li>)}
              </ul>
            ) : null}
          </section>
        );
      })}
      <StartDialog open={!!pick} onOpenChange={(v) => !v && setPick(null)} course={course} lesson={pick} />
    </div>
  );
}
