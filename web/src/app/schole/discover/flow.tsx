"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";
import { ACTIVITIES, ENOUGH, type Answer } from "@reflect/core/crafts";
import { Button } from "@/components/ui/button";
import { saveCraftAnswersAction } from "../crafts/actions";

const CHOICES: { answer: Answer; label: string }[] = [
  { answer: "not", label: "Not for me" },
  { answer: "unsure", label: "Not sure" },
  { answer: "like", label: "Like it" },
];

const firstOpen = (a: Record<string, Answer>) => {
  const i = ACTIVITIES.findIndex((x) => !a[x.id]);
  return i === -1 ? ACTIVITIES.length - 1 : i;
};

/** One activity at a time; each tap saves every answer so far and moves on. "Like it" is the one filled button. */
export function DiscoverFlow({ initial }: { initial: Record<string, Answer> }) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, Answer>>(initial);
  const [at, setAt] = useState(() => firstOpen(initial));
  const [, start] = useTransition();
  const activity = ACTIVITIES[at] ?? ACTIVITIES[0]!;
  const answered = ACTIVITIES.filter((a) => answers[a.id]).length;
  const total = ACTIVITIES.length;

  const choose = (answer: Answer) => {
    const next = { ...answers, [activity.id]: answer };
    setAnswers(next);
    const done = ACTIVITIES.every((a) => next[a.id]);
    start(async () => {
      await saveCraftAnswersAction(next);
      if (done) router.push("/schole/discover/drew");
    });
    if (!done) {
      const after = ACTIVITIES.findIndex((a, i) => i > at && !next[a.id]);
      setAt(after === -1 ? firstOpen(next) : after);
    }
  };

  const startOver = () => {
    setAnswers({});
    setAt(0);
    start(async () => { await saveCraftAnswersAction({}); });
  };

  return (
    <div className="mx-auto mt-6 grid w-full max-w-xl grid-cols-[minmax(0,1fr)] gap-8">
      <div className="grid gap-2">
        <div className="bg-muted h-0.5 w-full overflow-hidden rounded-full" role="progressbar" aria-label="Activities answered" aria-valuemin={0} aria-valuemax={total} aria-valuenow={answered}>
          <div className="bg-foreground h-full transition-[width]" style={{ width: `${(answered / total) * 100}%` }} />
        </div>
        <p className="text-muted-foreground text-sm">{at + 1} of {total}. Would you like to do this?</p>
      </div>

      <p className="min-h-[5.5rem] text-3xl leading-tight font-semibold text-balance sm:text-4xl" aria-live="polite">{activity.text}</p>

      <div className="grid grid-cols-3 gap-2">
        {CHOICES.map((c) => {
          const chosen = answers[activity.id] === c.answer;
          return (
            <Button key={c.answer} type="button" size="lg" variant={c.answer === "like" ? "default" : "outline"} aria-pressed={chosen} onClick={() => choose(c.answer)} className={chosen && c.answer !== "like" ? "border-foreground" : undefined}>
              {c.label}
            </Button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <Button type="button" variant="ghost" size="sm" disabled={at === 0} onClick={() => setAt((i) => Math.max(0, i - 1))} className="-ml-3">
          <ArrowLeftIcon />Previous
        </Button>
        {answered ? <Button type="button" variant="ghost" size="sm" onClick={startOver} className="text-muted-foreground -mr-3">Start over</Button> : null}
      </div>

      {answered >= ENOUGH ? (
        <p className="border-t pt-4">
          <Link href="/schole/discover/drew" className="font-medium underline-offset-4 hover:underline">See what drew you</Link>
          <span className="text-muted-foreground block text-sm">Or keep going. More answers sharpen it.</span>
        </p>
      ) : (
        <p className="text-muted-foreground border-t pt-4 text-sm">Answer {ENOUGH - answered} more to see what drew you.</p>
      )}
    </div>
  );
}
