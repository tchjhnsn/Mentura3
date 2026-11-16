"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { CheckIcon, FlameIcon, Link2Icon, XIcon } from "lucide-react";
import { HIGHLIGHTERS, LINKS, type Mark, type Verdict } from "@reflect/core/annotation-game";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { playAction } from "../actions";

type Unit = { key: string; n: number; speaker: string; text: string; known: boolean };
type Round = { start: number; units: Unit[] };
type Result = Awaited<ReturnType<typeof playAction>>;

/** One color per highlighter, the same in every round. */
const COLOR: Record<string, string> = {
  asserting: "bg-yellow-200/70 dark:bg-yellow-500/30",
  "pure-questioning": "bg-sky-200/70 dark:bg-sky-500/30",
  "assertive-questioning": "bg-indigo-200/70 dark:bg-indigo-500/30",
  "rhetorical-questioning": "bg-violet-200/70 dark:bg-violet-500/30",
  challenging: "bg-orange-200/70 dark:bg-orange-500/30",
  agreeing: "bg-green-200/70 dark:bg-green-500/30",
  disagreeing: "bg-red-200/70 dark:bg-red-500/30",
  restating: "bg-teal-200/70 dark:bg-teal-500/30",
  retracting: "bg-stone-300/70 dark:bg-stone-500/30",
};
const DOT: Record<string, string> = {
  asserting: "bg-yellow-400", "pure-questioning": "bg-sky-400", "assertive-questioning": "bg-indigo-400", "rhetorical-questioning": "bg-violet-400",
  challenging: "bg-orange-400", agreeing: "bg-green-500", disagreeing: "bg-red-400", restating: "bg-teal-400", retracting: "bg-stone-400",
};
const actLabel = (id: string) => HIGHLIGHTERS.find((h) => h.id === id)?.label ?? (id === "none" ? "No mark" : id);
const linkLabel = (id: string) => LINKS.find((l) => l.id === id)?.label ?? (id === "neither" ? "No link" : id);
const cap = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();
const short = (s: string) => (s.length > 70 ? `${s.slice(0, 70).replace(/[\s.,;:!?]+$/, "")}...` : s);

/** The ring a verdict puts round a sentence. */
const RING: Record<Verdict, string> = {
  match: "ring-2 ring-green-600",
  split: "ring-2 ring-amber-500",
  miss: "ring-2 ring-destructive",
  missed: "outline-2 outline-dashed outline-muted-foreground/70",
  new: "ring-1 ring-muted-foreground/40",
};

/**
 * The annotation game (Torian, 2026-11-16 22:56Z to 23:08Z): a passage, highlighters, and links. Pick a highlighter
 * and tap a sentence to mark it; tap it again to clear. With Link, tap a marked sentence, choose how it bears, then tap
 * the sentence it bears on. Done shows each mark against what is known: green a match, amber where readers split,
 * red a miss with the known answer, dashed what was missed; grey marks are new and count toward the map. Next is the
 * one filled button after Done. Five rounds, then the score.
 */
export function Game({ work, title, audiobook, rounds, inline = false }: { work: string; title: string; audiobook: string; rounds: Round[]; /** A round set into another page: tools under the passage, no filled buttons, a short end. */ inline?: boolean }) {
  const [at, setAt] = useState(0);
  const [pen, setPen] = useState<string>("asserting");
  const [linking, setLinking] = useState(false);
  const [from, setFrom] = useState<string | null>(null);
  const [rel, setRel] = useState<string | null>(null);
  const [marks, setMarks] = useState<Record<string, Mark>>({});
  const [result, setResult] = useState<Result | null>(null);
  const [total, setTotal] = useState({ points: 0, right: 0, checked: 0, added: 0, streak: 0, best: 0 });
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  if (!rounds.length && inline) return <p className="text-muted-foreground text-sm">You have annotated all of {title}.</p>;
  if (!rounds.length) return <p className="text-muted-foreground mt-8">You have annotated all of {title}. <Link href="/schole/dialectic/practice" className="underline underline-offset-4">Choose another dialogue</Link>.</p>;

  if (at >= rounds.length && inline) {
    return (
      <p className="text-[15px]">
        {total.points} points{total.checked ? `, ${total.right} of ${total.checked} known answers matched` : ""}. <Link href={`/schole/dialectic/practice/${work}`} className="underline underline-offset-4">Keep playing {title}</Link>
      </p>
    );
  }
  if (at >= rounds.length) {
    return (
      <section className="mt-8 space-y-6" aria-labelledby="done">
        <div className="space-y-2">
          <h2 id="done" className="text-2xl font-semibold tracking-tight">{total.points} points</h2>
          <p className="text-muted-foreground">
            {total.checked ? `${total.right} of ${total.checked} known answers matched` : "Nothing in these rounds is known yet"}; {total.added} {total.added === 1 ? "label" : "labels"} added to {title}{total.best > 1 ? `; best streak ${total.best}` : ""}.
          </p>
        </div>
        <Button asChild size="lg" className="w-full rounded-full"><a href={`/schole/dialectic/practice/${work}`}>Play again</a></Button>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <Link href={`/schole/audiobooks/${audiobook}`} className="underline underline-offset-4">Listen to {title}</Link>
          <Link href="/schole/courses/dialectic" className="underline underline-offset-4">Back to the course</Link>
        </div>
      </section>
    );
  }

  const round = rounds[at]!;
  const done = !!result;
  const verdictOf = (key: string) => result?.units.find((u) => u.key === key) ?? null;
  const textOf = (key: string) => round.units.find((u) => u.key === key)?.text ?? result?.targets[key] ?? "";

  const tap = (u: Unit) => {
    if (done || pending) return;
    if (linking) {
      if (!from) { if (marks[u.key]) setFrom(u.key); return; }
      if (!rel || u.key === from) return;
      setMarks((m) => ({ ...m, [from]: { ...m[from]!, link: { rel, to: u.key } } }));
      setFrom(null); setRel(null); setLinking(false);
      return;
    }
    setMarks((m) => {
      const cur = m[u.key];
      if (cur?.act === pen) { const { [u.key]: _gone, ...rest } = m; return rest; }
      return { ...m, [u.key]: { key: u.key, act: pen, link: cur?.link ?? null } };
    });
  };

  const submit = () => {
    setError(null);
    start(async () => {
      try {
        const r = await playAction(work, round.start, Object.values(marks));
        setResult(r);
        const good = r.checked > 0 && r.right / r.checked >= 0.8;
        setTotal((t) => { const streak = good ? t.streak + 1 : r.checked ? 0 : t.streak; return { points: t.points + r.points, right: t.right + r.right, checked: t.checked + r.checked, added: t.added + r.added, streak, best: Math.max(t.best, streak) }; });
      } catch {
        setError("Your marks could not be kept. Try again.");
      }
    });
  };
  const next = () => { setAt(at + 1); setMarks({}); setResult(null); setLinking(false); setFrom(null); setRel(null); };

  // Sentences grouped back into their turns.
  const turns: { n: number; speaker: string; units: Unit[] }[] = [];
  for (const u of round.units) { const last = turns.at(-1); if (last && last.n === u.n) last.units.push(u); else turns.push({ n: u.n, speaker: u.speaker, units: [u] }); }
  const marked = Object.keys(marks).length;

  return (
    <section className={cn("space-y-5", !inline && "mt-4")} aria-label={`Round ${at + 1} of ${rounds.length}`}>
      <div className="space-y-2">
        <p className="text-muted-foreground flex items-center justify-between text-sm">
          <span>{inline ? (rounds.length > 1 ? `Passage ${at + 1} of ${rounds.length}` : "") : `Round ${at + 1} of ${rounds.length}`}</span>
          <span className="flex items-center gap-3 tabular-nums">
            {total.streak > 1 ? <span className="flex items-center gap-1 text-orange-600"><FlameIcon className="size-4" />{total.streak}</span> : null}
            <span className="text-foreground font-medium">{total.points} points</span>
          </span>
        </p>
        <div className={cn("bg-muted h-1 overflow-hidden rounded-full", inline && "hidden")}><div className="bg-primary h-full rounded-full transition-all" style={{ width: `${((at + (done ? 1 : 0)) / rounds.length) * 100}%` }} /></div>
      </div>

      <div className="space-y-4 text-[16px] leading-[1.9]">
        {turns.map((t) => (
          <p key={t.n}>
            <span className="text-muted-foreground mr-1 text-sm font-semibold tracking-wide">{cap(t.speaker)}</span>
            {t.units.map((u) => {
              const m = marks[u.key];
              const v = verdictOf(u.key);
              const picking = linking && (from ? u.key !== from : !!m);
              return (
                <span key={u.key}>
                  <span
                    role="button" tabIndex={done ? -1 : 0} aria-pressed={!!m} aria-label={`${u.text}${m ? `, marked ${actLabel(m.act)}` : ""}`}
                    onClick={() => tap(u)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); tap(u); } }}
                    className={cn("cursor-pointer rounded px-0.5 py-0.5 transition [box-decoration-break:clone]", m ? COLOR[m.act] : "hover:bg-muted", from === u.key && "ring-primary ring-2", picking && "underline decoration-dotted underline-offset-4", v?.act ? RING[v.act] : null)}
                  >{u.text}</span>
                  {m || v?.act ? (
                    <span className="ml-1 inline-flex items-center gap-1 align-middle text-[11px] leading-none font-medium">
                      {m ? <span className="text-muted-foreground">{actLabel(m.act)}</span> : null}
                      {v?.act === "match" || v?.act === "split" ? <CheckIcon className="size-3.5 text-green-700 dark:text-green-400" /> : null}
                      {v?.act === "miss" ? <><XIcon className="text-destructive size-3.5" /><span className="text-green-700 dark:text-green-400">{v.known!.answers.map(actLabel).join(" or ")}</span></> : null}
                      {v?.act === "missed" ? <span className="text-muted-foreground">Known: {v.known!.answers.map(actLabel).join(" or ")}</span> : null}
                      {v?.act === "new" ? <span className="text-muted-foreground">added</span> : null}
                    </span>
                  ) : null}
                  {m?.link || v?.link ? (
                    <span className="text-muted-foreground mb-1 block pl-3 text-[13px] leading-snug">
                      {m?.link ? <><Link2Icon className="mr-1 inline size-3.5" />{linkLabel(m.link.rel)}: &ldquo;{short(textOf(m.link.to))}&rdquo;</> : null}
                      {v?.link?.relation === "match" || v?.link?.relation === "split" ? <CheckIcon className="ml-1 inline size-3.5 text-green-700 dark:text-green-400" /> : null}
                      {v?.link && (v.link.relation === "miss" || v.link.relation === "missed" || v.link.target === "miss") ? (
                        <span className="block text-green-700 dark:text-green-400">Known: {v.link.known!.answers.map(linkLabel).join(" or ")}{v.link.knownTarget ? ` "${short(textOf(v.link.knownTarget.answers[0]!))}"` : ""}</span>
                      ) : null}
                    </span>
                  ) : null}{" "}
                </span>
              );
            })}
          </p>
        ))}
      </div>

      {done ? (
        <div className="space-y-3" aria-live="polite">
          <p className="text-[15px] font-medium">
            {result!.checked ? `${result!.right} of ${result!.checked} matched` : "Nothing here was known yet"}
            {result!.added ? ` · ${result!.added} added to the map` : ""} · +{result!.points} points
          </p>
          {result!.units.some((u) => u.act === "split") ? <p className="text-muted-foreground text-sm">Amber: readers split here, and your reading is one that stands.</p> : null}
        </div>
      ) : null}
      {error ? <p className="text-destructive text-sm" role="alert">{error}</p> : null}

      {/* The tools sit at the foot of the screen, under the thumb. */}
      <div className={inline ? "rounded-xl border" : "bg-background/95 fixed inset-x-0 bottom-0 z-20 border-t backdrop-blur"}>
        <div className={cn("space-y-2 py-3", inline ? "px-3" : "mx-auto w-full max-w-xl px-4")}>
          {done ? (
            <Button size="lg" variant={inline ? "outline" : "default"} className="w-full rounded-full" onClick={next}>{at + 1 === rounds.length ? "Finish" : inline ? "Another passage" : "Next round"}</Button>
          ) : linking ? (
            <div className="space-y-2">
              <p className="text-sm">{!from ? "Tap a marked sentence to link from." : !rel ? "How does it bear on another?" : "Now tap the sentence it bears on."}</p>
              {from && !rel ? (
                <div className="flex flex-wrap gap-1.5">
                  {LINKS.map((l) => <button key={l.id} type="button" onClick={() => setRel(l.id)} title={l.hint} className="rounded-full border px-3 py-1 text-sm hover:bg-muted">{l.label}</button>)}
                </div>
              ) : null}
              <button type="button" onClick={() => { setLinking(false); setFrom(null); setRel(null); }} className="text-muted-foreground text-sm underline underline-offset-4">Cancel</button>
            </div>
          ) : (
            <>
              <div role="radiogroup" aria-label="Highlighter" className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
                {HIGHLIGHTERS.map((h) => (
                  <button key={h.id} type="button" role="radio" aria-checked={pen === h.id} title={h.hint} onClick={() => setPen(h.id)}
                    className={cn("flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-sm", pen === h.id ? "border-foreground font-medium" : "text-muted-foreground")}>
                    <span className={cn("size-2.5 rounded-full", DOT[h.id])} />{h.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="lg" className="rounded-full" disabled={!marked} onClick={() => setLinking(true)}><Link2Icon className="size-4" />Link</Button>
                <Button size="lg" variant={inline ? "secondary" : "default"} className="flex-1 rounded-full" disabled={pending} onClick={submit}>{pending ? "Checking..." : "Done"}</Button>
              </div>
              <p className="text-muted-foreground flex justify-between text-xs">
                <span>Mark what the words do; link a reason to its claim.</span>
                <Link href="/schole/dialectic/practice/guide" target="_blank" className="underline underline-offset-4">How to play</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
