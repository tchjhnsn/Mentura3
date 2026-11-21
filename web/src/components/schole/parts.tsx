"use client";

// Scholē's shared parts, each numbered (schole.inventory.json, components). Built after Uxcel's course card, lesson row
// and progress (Mobbin flows in the inventory), less what Scholē leaves out on purpose: points, leagues, scores and
// certificates. Checks are for the person; examiners are people.
import Link from "next/link";
import type { ReactNode } from "react";
import { BookmarkIcon, CheckCircle2Icon, CircleIcon, ClockIcon, NotebookPenIcon, SignalIcon, UsersRoundIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Num } from "@/components/studio/bits";
import { useSchole, weekOf } from "./store";
import { hours, type CourseCardData } from "./index";

/** One hue per subject, for course art. */
export const HUE: Record<string, number> = { logic: 250, nature: 150, soul: 300, life: 110, "first-philosophy": 40, ethics: 20, politics: 200, rhetoric: 330, poetics: 70 };
/** The Greek letter each subject's art carries. */
export const GLYPH: Record<string, string> = { logic: "λ", nature: "φ", soul: "ψ", life: "ζ", "first-philosophy": "ὄν", ethics: "η", politics: "π", rhetoric: "ρ", poetics: "ποι" };

export function Art({ subject, className, small }: { subject: string; className?: string; small?: boolean }) {
  const h = HUE[subject] ?? 0;
  return (
    <div aria-hidden className={cn("grid place-items-center rounded-lg font-serif", small ? "text-2xl" : "text-5xl", className)} style={{ background: `oklch(0.95 0.04 ${h})`, color: `oklch(0.45 0.12 ${h})` }}>
      {GLYPH[subject] ?? "α"}
    </div>
  );
}

/** A screen's title, its number and its one-sentence job. */
export function Head({ n, title, job, kicker, children }: { n: string; title: ReactNode; job?: ReactNode; kicker?: ReactNode; children?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 pb-6">
      <div className="min-w-0">
        {kicker ? <div className="text-muted-foreground mb-1 text-xs font-medium uppercase tracking-wide">{kicker}</div> : null}
        <div className="flex items-center gap-2"><h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1><Num n={n} /></div>
        {job ? <p className="text-muted-foreground mt-1.5 max-w-2xl">{job}</p> : null}
      </div>
      {children ? <div className="flex shrink-0 items-center gap-2">{children}</div> : null}
    </div>
  );
}
export const PAGE = "mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-8";

/** C6 Progress bar. */
export function Progress({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cn("bg-muted relative block h-1.5 overflow-hidden rounded-full", className)} role="progressbar" aria-valuenow={Math.round(value * 100)} aria-valuemin={0} aria-valuemax={100}>
      <span className="bg-foreground block h-full rounded-full" style={{ width: `${Math.max(value > 0 ? 3 : 0, value * 100)}%` }} />
    </span>
  );
}

/** C4 Course card: art, subject, title, two lines about it, level and time; in progress, how far you are. */
export function CourseCard({ c, why }: { c: CourseCardData; why?: string }) {
  const { done } = useSchole();
  const n = (done[c.id] ?? []).length;
  const share = c.lessons ? n / c.lessons : 0;
  return (
    <Link href={`/schole/c/${c.id}`} className="bg-card group relative flex flex-col rounded-xl border p-3 transition hover:shadow-md">
      <Num n="C4" className="absolute top-2 right-2 z-10" />
      <Art subject={c.subject} className="aspect-[16/9] w-full" />
      <div className="flex flex-1 flex-col gap-1 px-1 pt-3">
        <span className="text-muted-foreground text-[11px] font-medium uppercase tracking-wide">{c.subjectTitle}</span>
        <span className="font-semibold leading-snug group-hover:underline group-hover:underline-offset-4">{c.title}</span>
        <span className="text-muted-foreground font-serif text-sm">{c.greek}</span>
        <p className="text-muted-foreground line-clamp-2 text-sm">{why ?? c.about}</p>
        <div className="mt-auto pt-2">
          {n > 0 ? (
            <div className="flex items-center gap-2 text-xs"><Progress value={share} className="w-24" /><span className="text-muted-foreground tabular-nums">{n} of {c.lessons} lessons</span></div>
          ) : (
            <div className="text-muted-foreground flex items-center gap-3 text-xs"><span className="flex items-center gap-1"><SignalIcon className="size-3.5" />{c.level}</span><span className="flex items-center gap-1"><ClockIcon className="size-3.5" />{hours(c.minutes)}</span><span>{c.lessons} lessons</span></div>
          )}
        </div>
      </div>
    </Link>
  );
}

/** C5 Lesson row: done mark, title, minutes; tapping it opens the lesson, or the start dialog when given one. */
export function LessonRow({ course, id, title, minutes, here, onPick, sub }: { course: string; id: string; title: string; minutes: number; here?: boolean; onPick?: () => void; sub?: string }) {
  const { isDone } = useSchole();
  const done = isDone(course, id);
  const inner = (
    <>
      {done ? <CheckCircle2Icon className="size-5 shrink-0 text-emerald-600" aria-label="Read and checked" /> : <CircleIcon className="text-muted-foreground/50 size-5 shrink-0" aria-label="Not yet" />}
      <span className="min-w-0 flex-1"><span className="block font-medium">{title}</span>{sub ? <span className="text-muted-foreground block text-xs">{sub}</span> : null}</span>
      <span className="text-muted-foreground shrink-0 text-xs tabular-nums">{minutes} min</span>
    </>
  );
  const cls = cn("relative flex w-full items-center gap-3 rounded-xl border p-3 text-left text-sm transition hover:bg-accent/50", here && "ring-foreground ring-2");
  return onPick ? (
    <button type="button" onClick={onPick} className={cls}><Num n="C5" className="absolute -top-2 right-3" />{inner}</button>
  ) : (
    <Link href={`/schole/c/${course}/${id}`} className={cls}><Num n="C5" className="absolute -top-2 right-3" />{inner}</Link>
  );
}

/** C7 Week of study: Monday to Sunday, filled on the days a lesson was finished. */
export function Week({ className }: { className?: string }) {
  const { days } = useSchole();
  const week = weekOf(days);
  const n = week.filter((d) => d.on).length;
  return (
    <div className={cn("relative rounded-xl border p-4", className)}>
      <Num n="C7" className="absolute -top-2 left-4" />
      <div className="font-semibold">{n === 0 ? "No study days yet this week" : `${n} ${n === 1 ? "day" : "days"} of study this week`}</div>
      <p className="text-muted-foreground mt-0.5 text-sm">We become just by doing just acts (Ethics II.1). A day counts when you finish a lesson.</p>
      <ol className="mt-3 flex justify-between gap-1">
        {week.map((d) => (
          <li key={d.day} className={cn("flex flex-col items-center gap-1 rounded-md px-1.5 py-1 text-xs", d.isToday && "bg-muted")}>
            <span className={cn("grid size-6 place-items-center rounded-full border", d.on && "bg-foreground border-foreground text-background")}>{d.on ? <CheckCircle2Icon className="size-4" /> : null}</span>
            <span className={cn("text-muted-foreground", d.isToday && "text-foreground font-medium")}>{d.label}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** C9 Lesson start dialog: the lesson's name, minutes and checks, then Start lesson or Read it first. */
export function StartDialog({ open, onOpenChange, course, lesson }: { open: boolean; onOpenChange: (v: boolean) => void; course: string; lesson: { id: string; title: string; minutes: number; checks: number } | null }) {
  if (!lesson) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm text-center">
        <Num n="C9" className="absolute top-2 left-2" />
        <DialogTitle className="pt-2 text-xl">{lesson.title}</DialogTitle>
        <DialogDescription className="flex items-center justify-center gap-3"><span className="flex items-center gap-1"><ClockIcon className="size-4" />{lesson.minutes} min</span><span>{lesson.checks} questions</span></DialogDescription>
        <div className="mt-2 grid gap-2">
          <Button asChild size="lg"><Link href={`/schole/c/${course}/${lesson.id}`}>Start lesson</Link></Button>
          <Button asChild variant="ghost"><Link href={`/schole/c/${course}/${lesson.id}/check`}>Go straight to the questions</Link></Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** C11 Term chip: the Greek word and its English; it opens the glossary at that term. */
export function TermChip({ greek, translit, english }: { greek: string; translit: string; english: string }) {
  return (
    <Link href={`/schole/glossary#${encodeURIComponent(translit)}`} className="hover:bg-accent relative inline-flex items-baseline gap-1.5 rounded-lg border px-2.5 py-1 text-sm">
      <Num n="C11" className="absolute -top-2 -right-1" />
      <span className="font-serif">{greek}</span><span className="text-muted-foreground italic">{translit}</span><span>{english}</span>
    </Link>
  );
}

/** C12 Examination card, where Uxcel puts its certificate: examiners are people, and there is no grade. */
export function ExamCard({ title, course }: { title: string; course: string }) {
  return (
    <div className="bg-card relative rounded-xl border p-4">
      <Num n="C12" className="absolute -top-2 left-4" />
      <div className="flex items-center gap-2 font-semibold"><UsersRoundIcon className="size-4" />Be examined by people</div>
      <p className="text-muted-foreground mt-1 text-sm">When you know {title}, say what you will answer for and invite people to question you in person. Each writes whether they attest that you know it. No grade.</p>
      <Button asChild variant="outline" className="mt-3 w-full"><Link href={`/schole/examinations/new?course=${course}`}>Put yourself under examination</Link></Button>
    </div>
  );
}

/** C14 Journal question: writing happens only in the journal, so this opens a new entry about the question. */
export function JournalQuestion({ q }: { q: string }) {
  return (
    <div className="bg-muted/40 relative rounded-xl border p-4">
      <Num n="C14" className="absolute -top-2 left-4" />
      <div className="text-muted-foreground flex items-center gap-2 text-xs font-medium uppercase tracking-wide"><NotebookPenIcon className="size-3.5" />Take it to your journal</div>
      <p className="mt-1.5 font-serif text-lg leading-snug">{q}</p>
      <Button asChild variant="outline" size="sm" className="mt-3"><Link href={`/journal/new?about=${encodeURIComponent(q)}&domain=learn`}>Write about this in your journal</Link></Button>
    </div>
  );
}

/** Save a course or a lesson to S7. */
export function SaveButton({ k, label = "Save" }: { k: string; label?: string }) {
  const { saved, toggleSave, say } = useSchole();
  const on = saved.includes(k);
  return (
    <Button variant="ghost" size="sm" aria-pressed={on} onClick={() => { toggleSave(k); say(on ? "Removed from Saved." : "Saved. Find it under Saved."); }}>
      <BookmarkIcon className={cn(on && "fill-current")} />{on ? "Saved" : label}
    </Button>
  );
}
