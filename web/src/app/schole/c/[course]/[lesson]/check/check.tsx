"use client";

// L3 Lesson check, after Uxcel's lesson (Mobbin flow 0faf91f9): a bar across the top, one question at a time with
// numbered choices (keys 1 to 4 pick), and an answer bar that says right or not quite, why, and Continue. Unlike
// Uxcel there are no points, no accuracy and no streak counter: the check is for the person alone.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CheckCircle2Icon, XCircleIcon, XIcon } from "lucide-react";
import type { Check as Q } from "@reflect/core/aristotle/types";
import { Button } from "@/components/ui/button";
import { Num } from "@/components/studio/bits";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/schole/parts";
import { useSchole } from "@/components/schole/store";

export function Check({ course, lesson, title, checks, passage }: { course: string; lesson: string; title: string; checks: Q[]; passage: { text: string; ref: string } }) {
  const { finish } = useSchole();
  const router = useRouter();
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [showPassage, setShowPassage] = useState(false);
  const q = checks[i]!;
  const right = picked === q.answer;

  const submit = () => { if (picked !== null) setAnswered(true); };
  const next = () => {
    if (!right) { setAnswered(false); setPicked(null); return; } // Try again until it is right; the why stays readable.
    if (i < checks.length - 1) { setI(i + 1); setPicked(null); setAnswered(false); setShowPassage(false); return; }
    finish(course, lesson);
    router.push(`/schole/c/${course}/${lesson}/done`);
  };
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      const n = Number(e.key);
      if (!answered && n >= 1 && n <= q.options.length) setPicked(n - 1);
      if (e.key === "Enter") { if (answered) next(); else submit(); }
    };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  });

  return (
    <div className="flex min-h-dvh flex-col">
      <div className="relative mx-auto flex w-full max-w-4xl items-center gap-3 px-4 pt-4">
        <Num n="L3" />
        <Link href={`/schole/c/${course}/${lesson}`} aria-label="Back to the lesson" className="hover:bg-accent rounded-md p-1"><XIcon className="size-5" /></Link>
        <div className="relative flex-1"><Num n="L3.1" className="absolute -top-4 right-0" /><Progress value={(i + (answered && right ? 1 : 0)) / checks.length} /></div>
        <span className="text-muted-foreground text-xs tabular-nums">{i + 1} of {checks.length}</span>
      </div>

      <div className="relative mx-auto w-full max-w-4xl flex-1 px-4 py-10">
        <Num n="L3.2" className="absolute top-6 right-4" />
        <Num n="C10" className="absolute top-6 right-14" />
        <p className="text-muted-foreground text-center text-xs uppercase tracking-wide">{title}</p>
        <h1 className="mx-auto mt-2 max-w-2xl text-center text-xl font-semibold">{q.q}</h1>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <figure className="bg-muted/40 rounded-xl border p-5">
            <blockquote className="font-serif text-lg leading-relaxed">&ldquo;{passage.text}&rdquo;</blockquote>
            <figcaption className="text-muted-foreground mt-3 text-xs">{passage.ref}</figcaption>
          </figure>
          <ul className="order-first space-y-2 md:order-none">
            {q.options.map((o, k) => {
              const isPick = picked === k;
              return (
                <li key={o}>
                  <button type="button" disabled={answered} onClick={() => setPicked(k)} aria-pressed={isPick}
                    className={cn("flex w-full items-center gap-3 rounded-xl border p-3 text-left text-sm transition", !answered && "hover:bg-accent", isPick && !answered && "ring-foreground ring-2",
                      answered && k === q.answer && right && "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40", answered && isPick && !right && "border-rose-600 bg-rose-50 dark:bg-rose-950/40")}>
                    <span className="flex-1">{o}</span><span className="text-muted-foreground rounded border px-1.5 text-xs tabular-nums">{k + 1}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <div className={cn("relative border-t", answered && (right ? "bg-emerald-50 dark:bg-emerald-950/30" : "bg-rose-50 dark:bg-rose-950/30"))}>
        <Num n="L3.3" className="absolute -top-2 left-4" />
        <div className="mx-auto flex w-full max-w-4xl flex-wrap items-center gap-3 px-4 py-4">
          {answered ? (
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 font-semibold">{right ? <><CheckCircle2Icon className="size-5 text-emerald-600" />That&apos;s right</> : <><XCircleIcon className="size-5 text-rose-600" />Not quite</>}</div>
              <p className="text-muted-foreground mt-0.5 text-sm">{right ? q.why : "Read the passage again, then choose once more."}</p>
              {!right ? <button type="button" onClick={() => setShowPassage(!showPassage)} className="mt-1 text-sm underline underline-offset-4">{showPassage ? "Hide why" : "Show why"}</button> : null}
              {!right && showPassage ? <p className="mt-1 text-sm">{q.why}</p> : null}
            </div>
          ) : <div className="flex-1" />}
          {answered ? <Button size="lg" onClick={next}>{right ? (i < checks.length - 1 ? "Continue" : "Finish lesson") : "Try again"}</Button> : <Button size="lg" onClick={submit} disabled={picked === null}>Check answer</Button>}
        </div>
      </div>
    </div>
  );
}
