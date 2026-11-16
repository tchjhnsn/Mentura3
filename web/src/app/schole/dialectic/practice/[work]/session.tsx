"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { CheckIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { answerAction } from "../actions";

type Choice = { id: string; label: string; means: string };
type Kind = "act" | "relation" | "target" | "stasis" | "scheme" | "cq";
export type Step = {
  key: string; kind: Kind; question: string;
  /** The question in dispute, for a stasis question. */
  issue: string | null;
  note: string | null;
  turn: { speaker: string; parts: { text: string; marked: boolean }[] };
  before: { speaker: string; text: string }[];
  choices: Choice[];
};
type Result = { picked: string; counts: Record<string, number>; n: number; split: boolean; settled: { answers: string[]; note: string | null } | null };

const SURE = [{ id: 1, label: "A guess" }, { id: 2, label: "Think so" }, { id: 3, label: "Sure" }] as const;

/** A turn with its marked sentence; long turns fold to the marked sentence and its neighbours, with Show all. */
function TurnText({ speaker, parts }: Step["turn"]) {
  const [all, setAll] = useState(false);
  const m = Math.max(0, parts.findIndex((p) => p.marked));
  const long = parts.reduce((n, p) => n + p.text.length, 0) > 420 && parts.length > 3;
  const shown = all || !long ? parts.map((p, i) => ({ ...p, i })) : parts.map((p, i) => ({ ...p, i })).slice(Math.max(0, m - 1), m + 2);
  return (
    <>
      <span className="block">
        <span className="font-semibold">{speaker}:</span>{" "}
        {!all && long && shown[0]!.i > 0 ? "... " : null}
        {shown.map((p) => (
          <span key={p.i} className={cn(p.marked ? "bg-primary/15 rounded px-0.5 font-medium" : parts.some((x) => x.marked) && "text-muted-foreground")}>{p.text} </span>
        ))}
        {!all && long && shown.at(-1)!.i < parts.length - 1 ? "..." : null}
      </span>
      {long && !all ? <button type="button" onClick={() => setAll(true)} className="text-muted-foreground mt-1 block text-sm underline underline-offset-4">Show the whole turn</button> : null}
    </>
  );
}

/**
 * The session (guide "Dialectic practice: tagging arguments", second guidelines): one passage with its sentence
 * marked, one question and its answers per screen, and an optional How sure. A tap shows the answer in place: the
 * settled answers and why (more than one where readers honestly split), or how others answered. Next is the one filled
 * button. After the last, the end shows how it went and Listen to the dialogue.
 */
export function Session({ work, title, audiobook, steps }: { work: string; title: string; audiobook: string; steps: Step[] }) {
  const [at, setAt] = useState(0);
  const [results, setResults] = useState<(Result | null)[]>(() => steps.map(() => null));
  const [sure, setSure] = useState<1 | 2 | 3 | null>(null);
  const [filter, setFilter] = useState("");
  const [more, setMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  if (!steps.length) return <p className="text-muted-foreground mt-8">Nothing is left to ask in {title} for now. <Link href="/schole/dialectic/practice" className="underline underline-offset-4">Choose another dialogue</Link>.</p>;
  if (at >= steps.length) {
    const done = results.filter((r): r is Result => !!r && r.picked !== "unsure");
    const settled = done.filter((r) => r.settled);
    const right = settled.filter((r) => r.settled!.answers.includes(r.picked)).length;
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
          <Link href="/schole/courses/dialectic" className="underline underline-offset-4">Back to the course</Link>
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
        const out = await answerAction(work, s.key, s.kind, id, id === "unsure" ? null : sure);
        setResults((xs) => xs.map((x, i) => (i === at ? { picked: id, ...out } : x)));
      } catch {
        setError("Your answer could not be kept. Try again.");
      }
    });
  };
  const next = () => { setAt(at + 1); setSure(null); setFilter(""); setMore(false); };
  const rights = r?.settled?.answers ?? [];
  const means = (id: string) => s.choices.find((c) => c.id === id);
  // A target question offers every other sentence: the nearest eight first, a filter for the rest.
  const isTarget = s.kind === "target";
  const q = filter.trim().toLowerCase();
  const pool = isTarget && q ? s.choices.filter((c) => c.id === "none" || c.label.toLowerCase().includes(q)) : s.choices;
  const shown = isTarget && !more && !q ? [...pool.slice(0, 8), ...(pool.length > 8 ? [pool.at(-1)!] : [])] : pool;
  const settledHere = r?.settled ? s.choices.filter((c) => rights.includes(c.id) && !shown.includes(c)) : [];
  return (
    <section className="mt-4 space-y-6" aria-label={`Question ${at + 1} of ${steps.length}`}>
      <div className="space-y-2">
        <p className="text-muted-foreground flex justify-between text-sm"><span>{title}</span><span>{at + 1} of {steps.length}</span></p>
        <div className="bg-muted h-1 overflow-hidden rounded-full"><div className="bg-primary h-full rounded-full transition-all" style={{ width: `${((at + (r ? 1 : 0)) / steps.length) * 100}%` }} /></div>
      </div>
      {s.issue ? <p className="text-lg font-medium">{s.issue}</p> : null}
      <div className="space-y-3">
        {s.before.map((b, i) => <p key={i} className="text-muted-foreground line-clamp-2 text-sm"><span className="font-medium">{b.speaker}:</span> {b.text}</p>)}
        <blockquote className="border-primary border-l-[3px] pl-3 text-[15px] leading-relaxed">
          <TurnText {...s.turn} />
        </blockquote>
      </div>
      <div className="space-y-3">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold tracking-tight">{s.question}</h2>
          {s.note ? <p className="text-muted-foreground text-sm">{s.note}</p> : null}
        </div>
        {!r ? (
          <div role="radiogroup" aria-label="How sure are you?" className="flex items-center gap-1 text-sm">
            <span className="text-muted-foreground mr-1">How sure?</span>
            {SURE.map((x) => (
              <button key={x.id} type="button" role="radio" aria-checked={sure === x.id} onClick={() => setSure(sure === x.id ? null : x.id)}
                className={cn("rounded-full border px-2.5 py-0.5", sure === x.id ? "border-primary bg-primary/10 font-medium" : "text-muted-foreground hover:text-foreground")}>{x.label}</button>
            ))}
          </div>
        ) : null}
        {isTarget && !r ? <Input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Find a statement" aria-label="Find a statement" className="h-9" /> : null}
        <ul className="space-y-2">
          {[...shown, ...settledHere].map((c) => {
            const picked = r?.picked === c.id;
            const isRight = rights.includes(c.id);
            const count = r && !r.settled ? r.counts[c.id] ?? 0 : null;
            return (
              <li key={c.id}>
                <button
                  type="button" disabled={!!r || pending} onClick={() => answer(c.id)}
                  className={cn("flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-left text-[15px] transition enabled:hover:bg-muted/60",
                    r && !picked && !isRight && "text-muted-foreground",
                    picked && !r?.settled && "border-primary bg-primary/10 font-medium",
                    isRight && "border-green-600 bg-green-600/10 font-medium",
                    picked && r?.settled && !isRight && "border-destructive bg-destructive/10")}
                >
                  <span className="min-w-0">{c.label}</span>
                  <span className="shrink-0 tabular-nums">
                    {isRight ? <CheckIcon className="size-4 text-green-700 dark:text-green-400" /> : picked && r?.settled ? <XIcon className="text-destructive size-4" /> : count !== null ? count : null}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        {isTarget && !r && !more && !q && pool.length > 9 ? <button type="button" onClick={() => setMore(true)} className="text-muted-foreground text-sm underline underline-offset-4">Show all {pool.length - 1} statements</button> : null}
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
                <p className="font-medium">
                  {rights.includes(r.picked) ? (rights.length > 1 ? "Right. Readers split here, and both readings stand." : "Right.")
                    : rights.length > 1 ? `Readers split here; the readings that stand: ${rights.map((x) => means(x)?.label ?? x).join(", ")}.` : `The settled answer: ${means(rights[0]!)?.label ?? "None of them"}.`}
                </p>
                {rights.length === 1 && means(rights[0]!)?.means && !isTarget ? <p className="text-muted-foreground">{means(rights[0]!)!.means}</p> : null}
                {r.settled.note ? <p className="text-muted-foreground">{r.settled.note}</p> : null}
              </div>
            ) : (
              <div className="space-y-1 text-[15px]">
                <p>{r.n} {r.n === 1 ? "person has" : "people have"} answered{r.n > 1 ? `; ${Math.max(...Object.values(r.counts))} chose the most common answer` : ""}.</p>
                <p className="text-muted-foreground text-sm">{r.split ? "Readers split on this one; both readings will be kept." : "Not settled yet: your answer now counts toward it."}</p>
              </div>
            )}
          <Button size="lg" className="w-full rounded-full" onClick={next}>{at + 1 === steps.length ? "Finish" : "Next"}</Button>
        </div>
      ) : null}
    </section>
  );
}
