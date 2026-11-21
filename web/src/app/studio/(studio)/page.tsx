"use client";

// S1 Studio home: ask for a venture in words (OpenAI and Base44 prompt-first home), or open one you have.
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRightIcon, CheckIcon, Loader2Icon, ScaleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CommitmentStepper, HeldCard, Num, StatusDot } from "@/components/studio/bits";
import { PromptBox } from "@/components/studio/prompt-box";
import { ScreenHead } from "@/components/studio/shell";
import { TemplateCard } from "@/components/studio/template-card";
import { SCREENS, TEMPLATES, VENTURES, ventureHref } from "@/components/studio/data";

const S1 = SCREENS.find((s) => s.id === "S1")!;

const SUGGESTIONS = [
  "A wearable that lets coaches call plays by touch",
  "A paid newsletter about building codes",
  "A grant-funded after school robotics club",
  "Bookkeeping for small design studios",
];

const SETUP_STEPS = [
  "Reading your idea and naming the venture",
  "Writing the four assumptions: exists, segment, hurts, why now",
  "Setting the commitment at explore",
  "Adding the chief of staff, strategy and product agents",
  "Making the folders: strategy, products, marketing, finance",
];

const NEEDS_YOU = [
  { venture: "haptic-plays", who: "Marketing agent", what: "Send the coach outreach email to 12 coaches", detail: "Haptic Plays. Draft is in marketing/outreach/coaches-v2.md." },
  { venture: "haptic-plays", who: "Strategy agent", what: "Grade 'coaches hurt' as supported", detail: "Haptic Plays. Four of five interviews named the same problem." },
  { venture: "founder-raise", who: "Funder scout", what: "Send the deck to Northside Capital", detail: "Founder Raise. First of three funders on the short list." },
  { venture: "pattern-language", who: "Product agent", what: "Add 'search by room' to the roadmap", detail: "Pattern Language. Came up in two architect interviews." },
];

export default function StudioHome() {
  const [idea, setIdea] = useState<string | null>(null);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (idea === null || step >= SETUP_STEPS.length) return;
    const t = setTimeout(() => setStep((s) => s + 1), 650);
    return () => clearTimeout(t);
  }, [idea, step]);

  const start = (text: string) => { setIdea(text); setStep(0); };
  const done = idea !== null && step >= SETUP_STEPS.length;

  return (
    <div className="pb-16">
      <ScreenHead n="S1" title={S1.title} job={S1.job} />

      <section className="relative mx-4 rounded-2xl border px-4 py-8 md:mx-8 md:px-10 md:py-12">
        <Num n="S1.1" className="absolute top-2 left-2" />
        <div className="mx-auto max-w-2xl">
          <h2 className="text-center text-2xl font-semibold tracking-tight md:text-3xl">What venture do you want to work on?</h2>
          <p className="text-muted-foreground mt-2 text-center text-sm">Say it in a sentence. The studio sets up the venture, its agents and its first questions.</p>
          <div className="mt-6">
            {idea === null ? (
              <PromptBox autoFocus placeholder="Describe the venture, who it is for, and what hurts today" suggestions={SUGGESTIONS} onSubmit={start} />
            ) : (
              <div className="bg-card rounded-xl border p-4" aria-live="polite">
                <div className="text-muted-foreground text-xs">Your idea</div>
                <p className="mt-0.5 text-sm font-medium">{idea}</p>
                <div className="mt-4 text-sm font-semibold">{done ? "Your venture is ready" : "Setting up a venture from your idea"}</div>
                <ol className="mt-2 space-y-1.5">
                  {SETUP_STEPS.map((s, i) => (
                    <li key={s} className="flex items-start gap-2 text-sm">
                      {i < step ? <CheckIcon className="mt-0.5 size-4 shrink-0 text-emerald-600" /> : i === step ? <Loader2Icon className="mt-0.5 size-4 shrink-0 animate-spin" /> : <span className="mt-1.5 ml-1.5 size-1.5 shrink-0 rounded-full bg-muted-foreground/40" />}
                      <span className={i > step ? "text-muted-foreground" : undefined}>{s}</span>
                    </li>
                  ))}
                </ol>
                {done ? (
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <Button asChild><Link href={ventureHref("haptic-plays")}>Open the venture<ArrowRightIcon /></Link></Button>
                    <Button variant="ghost" onClick={() => setIdea(null)}>Start another</Button>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="relative mt-8 px-4 md:px-8">
        <Num n="S1.2" className="absolute -top-2 right-4 md:right-8" />
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-sm font-semibold">Needs you</h2>
          <span className="text-muted-foreground text-xs">{NEEDS_YOU.length} drafts held across ventures</span>
        </div>
        <div className="mt-2 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {NEEDS_YOU.map((h) => <HeldCard key={h.what} who={h.who} what={h.what} detail={h.detail} />)}
        </div>
      </section>

      <section className="relative mt-8 px-4 md:px-8">
        <Num n="S1.3" className="absolute -top-2 right-4 md:right-8" />
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-sm font-semibold">Your ventures</h2>
          <Link href="/studio/new" className="text-muted-foreground hover:text-foreground text-xs underline-offset-4 hover:underline">New venture</Link>
        </div>
        <div className="mt-2 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {VENTURES.map((v) => (
            <Link key={v.slug} href={ventureHref(v.slug)} className="bg-card hover:border-foreground/30 group flex min-w-0 flex-col rounded-xl border p-4 transition-colors">
              <div className="flex items-center gap-2">
                <span className="size-5 shrink-0 rounded" style={{ background: `oklch(0.65 0.14 ${v.hue})` }} />
                <span className="truncate font-semibold group-hover:underline">{v.name}</span>
                <span className="text-muted-foreground ml-auto shrink-0 text-xs">{v.updated}</span>
              </div>
              <p className="text-muted-foreground mt-1 text-sm">{v.oneLine}</p>
              <div className="mt-3 overflow-hidden"><CommitmentStepper at={v.commitment} compact /></div>
              <div className="mt-3 rounded-lg bg-muted/60 p-2.5">
                <div className="text-muted-foreground text-xs">Needs now</div>
                <div className="text-sm">{v.needNow}</div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                <span className="inline-flex items-center gap-1.5"><StatusDot status={v.agentsRunning ? "running" : "idle"} label={false} />{v.agentsRunning} agents running</span>
                <span className="text-muted-foreground inline-flex items-center gap-1"><ScaleIcon className="size-3.5" />{v.openDecisions} open decisions</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="relative mt-8 px-4 md:px-8">
        <Num n="S1.4" className="absolute -top-2 right-4 md:right-8" />
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-sm font-semibold">Start from a template</h2>
          <Link href="/studio/library" className="text-muted-foreground hover:text-foreground text-xs underline-offset-4 hover:underline">See the library</Link>
        </div>
        <div className="mt-2 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {TEMPLATES.filter((t) => t.kind === "venture").slice(0, 4).map((t) => <TemplateCard key={t.id} t={t} />)}
        </div>
      </section>
    </div>
  );
}
