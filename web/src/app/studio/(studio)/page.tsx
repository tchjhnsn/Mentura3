"use client";

// S1 Studio home: one question to your chief of staff, your ventures by phase, and the few things that need you.
// Kept as plain as a chat with a bot (Torian, 2026-11-21: "much more simplicity").
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRightIcon, CheckIcon, Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Num } from "@/components/studio/bits";
import { PromptBox } from "@/components/studio/prompt-box";
import { LeadMark } from "@/components/studio/conversation";
import { VENTURES, ventureHref } from "@/components/studio/data";
import { LEADS, PHASES, nextPhase, phaseLabel, phaseOf } from "@/components/studio/phase";

const SUGGESTIONS = ["A wearable that lets coaches call plays by touch", "Bookkeeping for small design studios", "What should I work on today?"];
const SETUP = ["Naming the venture and writing the problem in one sentence", "Starting it in Discovery with three exit criteria", "Adding the chief of staff and the four leads"];
const NEEDS_YOU = [
  { venture: "haptic-plays", who: "Growth lead", what: "Send the coach outreach email to Lincoln High" },
  { venture: "haptic-plays", who: "Strategy lead", what: "Mark 'coaches say it costs them games' as met" },
  { venture: "founder-raise", who: "Growth lead", what: "Send the deck to Northside Capital" },
];

export default function StudioHome() {
  const [idea, setIdea] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [done, setDone] = useState<string[]>([]);
  useEffect(() => {
    if (idea === null || step >= SETUP.length) return;
    const t = setTimeout(() => setStep((s) => s + 1), 650);
    return () => clearTimeout(t);
  }, [idea, step]);
  const cos = LEADS[0]!;
  return (
    <div data-virtu-screen="S1" className="mx-auto max-w-2xl px-4 pt-10 pb-16 md:pt-16">
      <section className="relative">
        <Num n="S1" className="absolute -top-6 left-0" />
        <div className="flex flex-col items-center text-center">
          <LeadMark lead={cos} size={44} />
          <h1 className="mt-3 text-2xl font-semibold tracking-tight md:text-3xl">What are we building?</h1>
          <p className="text-muted-foreground mt-1 text-sm">Your chief of staff starts a venture from a sentence, or answers anything about the ones you have.</p>
        </div>
        <div className="relative mt-6">
          <Num n="S1.1" className="absolute -top-2 right-3 z-10" />
          {idea === null ? <PromptBox autoFocus placeholder="Tell your chief of staff" suggestions={SUGGESTIONS} onSubmit={(t) => { setIdea(t); setStep(0); }} /> : (
            <div className="bg-card rounded-xl border p-4" aria-live="polite">
              <p className="text-sm font-medium">{idea}</p>
              <ol className="mt-3 space-y-1.5">
                {SETUP.map((s, i) => (
                  <li key={s} className="flex items-start gap-2 text-sm">
                    {i < step ? <CheckIcon className="mt-0.5 size-4 shrink-0" /> : i === step ? <Loader2Icon className="mt-0.5 size-4 shrink-0 animate-spin" /> : <span className="bg-muted-foreground/40 mt-1.5 ml-1.5 size-1.5 shrink-0 rounded-full" />}
                    <span className={i > step ? "text-muted-foreground" : undefined}>{s}</span>
                  </li>
                ))}
              </ol>
              {step >= SETUP.length ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button asChild><Link href={ventureHref("pattern-language")}>Talk about it with your chief of staff<ArrowRightIcon /></Link></Button>
                  <Button variant="ghost" onClick={() => setIdea(null)}>Start another</Button>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </section>

      <section className="relative mt-12">
        <Num n="S1.2" className="absolute -top-2 right-0" />
        <h2 className="text-muted-foreground text-xs font-medium">Needs you</h2>
        <ul className="mt-2 divide-y border-y">
          {NEEDS_YOU.map((n) => (
            <li key={n.what} className="flex items-center gap-3 py-2.5">
              <div className="min-w-0 flex-1">
                <p className={done.includes(n.what) ? "text-muted-foreground text-sm line-through" : "text-sm"}>{n.what}</p>
                <p className="text-muted-foreground text-xs">{n.who} · {VENTURES.find((v) => v.slug === n.venture)!.name}</p>
              </div>
              {done.includes(n.what) ? <span className="text-muted-foreground text-xs">Approved</span> : <Button size="sm" variant="outline" onClick={() => setDone((d) => [...d, n.what])}>Approve</Button>}
            </li>
          ))}
        </ul>
      </section>

      <section className="relative mt-10">
        <Num n="S1.3" className="absolute -top-2 right-0" />
        <div className="flex items-baseline justify-between">
          <h2 className="text-muted-foreground text-xs font-medium">Your ventures</h2>
          <Link href="/studio/library" className="text-muted-foreground hover:text-foreground text-xs hover:underline">Start from a template</Link>
        </div>
        <ul className="mt-2 divide-y border-y">
          {VENTURES.map((v) => {
            const s = phaseOf(v.slug);
            const next = nextPhase(s.phase);
            const at = PHASES.findIndex((p) => p.id === s.phase);
            return (
              <li key={v.slug}>
                <Link href={ventureHref(v.slug)} className="hover:bg-accent/40 flex items-center gap-3 py-3">
                  <span className="size-8 shrink-0 rounded-lg" style={{ background: `oklch(0.65 0.14 ${v.hue})` }} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{v.name}</p>
                    <p className="text-muted-foreground truncate text-xs">{phaseLabel(s.phase)} · {s.criteria.filter((c) => c.met).length} of {s.criteria.length} done to reach {next ? phaseLabel(next) : "the end"}</p>
                  </div>
                  <span className="hidden gap-0.5 sm:flex" aria-hidden>{PHASES.map((p, k) => <span key={p.id} className={k <= at ? "bg-foreground h-1.5 w-4 rounded-full" : "bg-muted h-1.5 w-4 rounded-full"} />)}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
