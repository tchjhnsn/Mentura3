"use client";

// S2 Get started, after Uxcel's onboarding (Mobbin flow 25541238): one question per screen, a bar across the top, Skip
// and Continue at the foot. The answers shape S1's recommendations; nothing is written on the page (writing happens
// only in the journal).
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeftIcon, CheckIcon } from "lucide-react";
import { SUBJECTS, DIVISIONS } from "@reflect/core/aristotle/subjects";
import { Button } from "@/components/ui/button";
import { Num } from "@/components/studio/bits";
import { cn } from "@/lib/utils";
import { Art, Progress } from "@/components/schole/parts";
import { useSchole } from "@/components/schole/store";

const FIRST: Record<string, { id: string; title: string }> = {
  logic: { id: "categories", title: "Categories" }, nature: { id: "physics", title: "Physics" }, soul: { id: "on-the-soul", title: "On the Soul" },
  life: { id: "history-of-animals", title: "History of Animals" }, "first-philosophy": { id: "metaphysics", title: "Metaphysics" },
  ethics: { id: "nicomachean-ethics", title: "Nicomachean Ethics" }, politics: { id: "politics", title: "Politics" }, rhetoric: { id: "rhetoric", title: "Rhetoric" }, poetics: { id: "poetics", title: "Poetics" },
};

export default function GetStarted() {
  const store = useSchole();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [picks, setPicks] = useState<string[]>(store.picks);
  const [minutes, setMinutes] = useState<number | null>(store.minutes);
  const first = FIRST[picks[0] ?? "ethics"]!;
  const finish = (href: string) => { store.setPicks(picks, minutes); store.say("Saved. Your home now starts from what you picked."); router.push(href); };
  return (
    <div className="mx-auto flex min-h-[calc(100dvh-5rem)] max-w-3xl flex-col px-4 py-6">
      <div className="flex items-center gap-3">
        {step > 0 ? <Button variant="ghost" size="icon-sm" onClick={() => setStep(step - 1)} aria-label="Back"><ArrowLeftIcon /></Button> : <span className="size-8" />}
        <Progress value={(step + 1) / 3} className="flex-1" />
        <Num n="S2" />
      </div>

      <div className="flex-1 py-10">
        {step === 0 ? (
          <section className="relative">
            <Num n="S2.1" className="absolute -top-4 right-0" />
            <h1 className="text-center text-2xl font-semibold">What do you want to understand?</h1>
            <p className="text-muted-foreground mt-1 text-center">Pick any number. Aristotle divided knowing by its end; so does Scholē.</p>
            {DIVISIONS.map((d) => (
              <div key={d.id} className="mt-6">
                <div className="text-muted-foreground mb-2 text-xs font-medium uppercase tracking-wide">{d.title}</div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {SUBJECTS.filter((s) => s.division === d.id).map((s) => {
                    const on = picks.includes(s.id);
                    return (
                      <button key={s.id} type="button" aria-pressed={on} onClick={() => setPicks(on ? picks.filter((p) => p !== s.id) : [...picks, s.id])} className={cn("relative flex flex-col items-start gap-2 rounded-xl border p-3 text-left transition hover:shadow-sm", on && "ring-foreground ring-2")}>
                        <Num n="C13" className="absolute -top-2 left-3" />
                        {on ? <span className="bg-foreground text-background absolute top-2 right-2 grid size-5 place-items-center rounded-full"><CheckIcon className="size-3.5" /></span> : null}
                        <Art subject={s.id} small className="size-12" />
                        <span className="font-semibold">{s.title}</span>
                        <span className="text-muted-foreground text-xs">{s.line}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </section>
        ) : step === 1 ? (
          <section className="relative mx-auto max-w-md">
            <Num n="S2.2" className="absolute -top-4 right-0" />
            <h1 className="text-center text-2xl font-semibold">How long a day?</h1>
            <p className="text-muted-foreground mt-1 text-center">A lesson takes about five minutes. Steady beats long.</p>
            <div className="mt-6 grid gap-3">
              {[[10, "Ten minutes", "About two lessons"], [20, "Twenty minutes", "About four lessons"], [40, "Forty minutes", "A book of a work in a week or two"]].map(([m, t, s]) => (
                <button key={m} type="button" aria-pressed={minutes === m} onClick={() => setMinutes(m as number)} className={cn("flex items-center justify-between rounded-xl border p-4 text-left", minutes === m && "ring-foreground ring-2")}>
                  <span><span className="block font-semibold">{t}</span><span className="text-muted-foreground text-sm">{s}</span></span>
                  {minutes === m ? <CheckIcon className="size-5" /> : null}
                </button>
              ))}
            </div>
          </section>
        ) : (
          <section className="relative mx-auto max-w-md text-center">
            <Num n="S2.3" className="absolute -top-4 right-0" />
            <h1 className="text-2xl font-semibold">Begin with the {first.title}</h1>
            <p className="text-muted-foreground mt-1">{picks.length ? `It is the first work on the path for ${SUBJECTS.find((s) => s.id === (picks[0] ?? "ethics"))!.title.toLowerCase()}.` : "Most readers start Aristotle with his ethics: what a good life is."}</p>
            <Art subject={picks[0] ?? "ethics"} className="mx-auto mt-6 aspect-[16/9] w-full" />
            <div className="mt-6 grid gap-2">
              <Button size="lg" onClick={() => finish(`/schole/c/${first.id}`)}>Open the course</Button>
              <Button variant="ghost" onClick={() => finish("/schole")}>Go to your home</Button>
            </div>
          </section>
        )}
      </div>

      {step < 2 ? (
        <div className="bg-background sticky bottom-0 flex items-center justify-between border-t py-3">
          <Button variant="ghost" asChild><Link href="/schole">Skip for now</Link></Button>
          <Button onClick={() => setStep(step + 1)} disabled={step === 0 && picks.length === 0}>{step === 0 && picks.length === 0 ? "Pick at least one" : "Continue"}</Button>
        </div>
      ) : null}
    </div>
  );
}
