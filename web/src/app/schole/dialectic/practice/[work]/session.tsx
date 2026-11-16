"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { CheckIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { answerAction } from "../actions";

type Choice = { id: string; label: string; means: string };
export type Step = { key: string; kind: "move" | "target" | "stasis"; question: string; turn: { speaker: string; text: string }; before: { speaker: string; text: string }[]; choices: Choice[] };
type Result = { picked: string; counts: Record<string, number>; n: number; settled: { answer: string; note: string | null } | null };

/** Long turns fold to six lines with Show all, so the question stays in view. */
function TurnText({ speaker, text }: { speaker: string; text: string }) {
  const [all, setAll] = useState(false);
  const long = text.length > 420;
  return (
    <>
      <span className={cn("block", !all && long && "line-clamp-6")}><span className="font-semibold">{speaker}:</span> {text}</span>
      {long && !all ? <button type="button" onClick={() => setAll(true)} className="text-muted-foreground mt-1 block text-sm underline underline-offset-4">Show all</button> : null}
    </>
  );
}

/**
 * The session (guide "Dialectic practice: tagging arguments"): one passage, one question and its answers per screen, a
 * tap shows the answer in place (the settled answer and why, or how others answered), and Next is the one filled
 * button. After the last, the end shows how it went and Listen to the dialogue.
 */
export function Session({ work, title, audiobook, steps }: { work: string; title: string; audiobook: string; steps: Step[] }) {
  const [at, setAt] = useState(0);
  const [results, setResults] = useState<(Result | null)[]>(() => steps.map(() => null));
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  if (!steps.length) return <p className="text-muted-foreground mt-8">Nothing is left to ask in {title} for now. <Link href="/schole/dialectic/practice" className="underline underline-offset-4">Choose another dialogue</Link>.</p>;
  if (at >= steps.length) {
    const done = results.filter((r): r is Result => !!r && r.picked !== "unsure");
    const settled = done.filter((r) => r.settled);
    const right = settled.filter((r) => r.settled!.answer === r.picked).length;
    return (
      <section className="mt-8 space-y-6" aria-labelledby="done">
        <div className="space-y-2">
          <h2 id="done" className="text-2xl font-semibold tracking-tight">Session done</h2>
          <p className="text-muted-foreground">
            {done.length} of {steps.length} answered{settled.length ? `; ${right} of ${settled.length} settled right` : ""}; {done.length - settled.length} {done.length - settled.length === 1 ? "label" : "labels"} added to {title}.
          </p>
        </div>
        <Button asChild size="lg" className="w-full rounded-full"><Link href={`/schole/audiobooks/${audiobook}`}>Listen to {title}</Link></Button>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <Link href={`/schole/dialectic/practice/${work}`} className="underline underline-offset-4">Practise again</Link>
          <Link href="/schole/dialectic" className="underline underline-offset-4">Back to Dialectic</Link>
        </div>
      </section>
    );
  }
  const s = steps[at]!;
  const r = results[at];
  const answer = (id: string) => {
    setError(null);
    start(async () => {
      try {
        const out = await answerAction(work, s.key, s.kind, id);
        setResults((xs) => xs.map((x, i) => (i === at ? { picked: id, ...out } : x)));
      } catch {
        setError("Your answer could not be kept. Try again.");
      }
    });
  };
  const right = r?.settled?.answer;
  const means = (id: string) => s.choices.find((c) => c.id === id);
  return (
    <section className="mt-4 space-y-6" aria-label={`Question ${at + 1} of ${steps.length}`}>
      <div className="space-y-2">
        <p className="text-muted-foreground flex justify-between text-sm"><span>{title}</span><span>{at + 1} of {steps.length}</span></p>
        <div className="bg-muted h-1 overflow-hidden rounded-full"><div className="bg-primary h-full rounded-full transition-all" style={{ width: `${((at + (r ? 1 : 0)) / steps.length) * 100}%` }} /></div>
      </div>
      <div className="space-y-3">
        {s.before.map((b, i) => <p key={i} className="text-muted-foreground line-clamp-2 text-sm"><span className="font-medium">{b.speaker}:</span> {b.text}</p>)}
        <blockquote className="border-primary border-l-[3px] pl-3 text-[15px] leading-relaxed">
          <TurnText speaker={s.turn.speaker} text={s.turn.text} />
        </blockquote>
      </div>
      <div className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">{s.question}</h2>
        <ul className="space-y-2">
          {s.choices.map((c) => {
            const picked = r?.picked === c.id;
            const isRight = right === c.id;
            const count = r && !r.settled ? r.counts[c.id] ?? 0 : null;
            return (
              <li key={c.id}>
                <button
                  type="button" disabled={!!r || pending} onClick={() => answer(c.id)}
                  className={cn("flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-left text-[15px] transition enabled:hover:bg-muted/60",
                    r && !picked && !isRight && "text-muted-foreground",
                    picked && !r?.settled && "border-primary bg-primary/10 font-medium",
                    isRight && "border-green-600 bg-green-600/10 font-medium",
                    picked && right && !isRight && "border-destructive bg-destructive/10")}
                >
                  <span className="min-w-0">{c.label}</span>
                  <span className="shrink-0 tabular-nums">
                    {isRight ? <CheckIcon className="size-4 text-green-700 dark:text-green-400" /> : picked && right ? <XIcon className="text-destructive size-4" /> : count !== null ? count : null}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        {!r ? (
          <div className="flex items-center justify-between text-sm">
            <button type="button" disabled={pending} onClick={() => answer("unsure")} className="text-muted-foreground hover:text-foreground">Not sure</button>
            <Link href="/schole/dialectic/practice/guide" target="_blank" className="text-muted-foreground underline underline-offset-4">What do these mean?</Link>
          </div>
        ) : null}
        {error ? <p className="text-destructive text-sm" role="alert">{error}</p> : null}
      </div>
      {r ? (
        <div className="space-y-4" aria-live="polite">
          {r.picked === "unsure" ? <p className="text-muted-foreground text-sm">Skipped.</p>
            : r.settled ? (
              <div className="space-y-1 text-[15px]">
                <p className="font-medium">{r.settled.answer === r.picked ? "Right." : `The settled answer: ${means(r.settled.answer)?.label ?? "None of them"}.`}</p>
                {means(r.settled.answer)?.means ? <p className="text-muted-foreground">{means(r.settled.answer)!.means}</p> : null}
                {r.settled.note ? <p className="text-muted-foreground">{r.settled.note}</p> : null}
              </div>
            ) : (
              <div className="space-y-1 text-[15px]">
                <p>{r.n} {r.n === 1 ? "person has" : "people have"} answered{r.n > 1 ? `; ${Math.max(...Object.values(r.counts))} chose the most common answer` : ""}.</p>
                <p className="text-muted-foreground text-sm">Not settled yet: your answer now counts toward it.</p>
              </div>
            )}
          <Button size="lg" className="w-full rounded-full" onClick={() => setAt(at + 1)}>{at + 1 === steps.length ? "Finish" : "Next"}</Button>
        </div>
      ) : null}
    </section>
  );
}
