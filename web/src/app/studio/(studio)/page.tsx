"use client";

// S1 Studio home: ask for a venture in words (OpenAI and Base44 prompt-first home), or open one you have.
// The prompt creates a real Naive venture and the list shows the person's ventures, through src/server/naive.ts.
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { ArrowRightIcon, Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Num } from "@/components/studio/bits";
import { PromptBox } from "@/components/studio/prompt-box";
import { ScreenHead } from "@/components/studio/shell";
import { TemplateCard } from "@/components/studio/template-card";
import { SCREENS, TEMPLATES } from "@/components/studio/data";
import { createVenture, listVentures, type Result } from "../actions";
import type { VentureSummary } from "@/server/naive";

const S1 = SCREENS.find((s) => s.id === "S1")!;

const SUGGESTIONS = [
  "A wearable that lets coaches call plays by touch",
  "A paid newsletter about building codes",
  "A grant-funded after school robotics club",
  "Bookkeeping for small design studios",
];

const realHref = (id: string) => `/studio/v/${encodeURIComponent(id)}`;

export default function StudioHome() {
  const [idea, setIdea] = useState<string | null>(null);
  const [made, setMade] = useState<Result<{ id: string }> | null>(null);
  const [ventures, setVentures] = useState<Result<VentureSummary[]> | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => { listVentures().then(setVentures); }, []);

  const start = (text: string) => {
    setIdea(text);
    setMade(null);
    startTransition(async () => {
      const r = await createVenture(text);
      setMade(r);
      if (r.ok) setVentures(await listVentures());
    });
  };

  return (
    <div className="pb-16">
      <ScreenHead n="S1" title={S1.title} job={S1.job} />

      <section className="relative mx-4 rounded-2xl border px-4 py-8 md:mx-8 md:px-10 md:py-12">
        <Num n="S1.1" className="absolute top-2 left-2" />
        <div className="mx-auto max-w-2xl">
          <h2 className="text-center text-2xl font-semibold tracking-tight md:text-3xl">What business do you want to work on?</h2>
          <p className="text-muted-foreground mt-2 text-center text-sm">Say it in a sentence. The studio sets up the business, its agents and its first questions.</p>
          <div className="mt-6">
            {idea === null ? (
              <PromptBox autoFocus placeholder="Describe the business, who it is for, and what hurts today" suggestions={SUGGESTIONS} onSubmit={start} />
            ) : (
              <div className="bg-card rounded-xl border p-4" aria-live="polite">
                <div className="text-muted-foreground text-xs">Your idea</div>
                <p className="mt-0.5 text-sm font-medium">{idea}</p>
                {pending || !made ? (
                  <div className="mt-4 flex items-center gap-2 text-sm"><Loader2Icon className="size-4 animate-spin" />Naive is setting up the business</div>
                ) : made.ok ? (
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold">Your business is ready</span>
                    <Button asChild><Link href={realHref(made.value.id)}>Open the business<ArrowRightIcon /></Link></Button>
                    <Button variant="ghost" onClick={() => setIdea(null)}>Start another</Button>
                  </div>
                ) : (
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span className="text-sm">{made.error}</span>
                    <Button variant="ghost" onClick={() => setIdea(null)}>Try again</Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="relative mt-8 px-4 md:px-8">
        <Num n="S1.3" className="absolute -top-2 right-4 md:right-8" />
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-sm font-semibold">Your businesses</h2>
          <Link href="/studio/new" className="text-muted-foreground hover:text-foreground text-xs underline-offset-4 hover:underline">New business</Link>
        </div>
        {ventures === null ? (
          <p className="text-muted-foreground mt-2 text-sm">Reading your businesses</p>
        ) : !ventures.ok ? (
          <p className="text-muted-foreground mt-2 text-sm">{ventures.error}</p>
        ) : ventures.value.length === 0 ? (
          <p className="text-muted-foreground mt-2 text-sm">No businesses yet. Say one in a sentence above.</p>
        ) : (
          <div className="mt-2 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {ventures.value.map((v) => (
              <Link key={v.id} href={realHref(v.id)} className="bg-card hover:border-foreground/30 group flex min-w-0 flex-col rounded-xl border p-4 transition-colors">
                <span className="truncate font-semibold group-hover:underline">{v.name}</span>
                <span className="text-muted-foreground mt-1 text-sm capitalize">{v.phase}</span>
              </Link>
            ))}
          </div>
        )}
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
