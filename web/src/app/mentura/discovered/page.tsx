"use client";

// M8 Get discovered, after Contra's Get discovered (data.ts REFS.discovered): your discovery score with a ring around
// your face, profile completion, the insights that raise it most, and a short FAQ.
import Link from "next/link";
import { CalendarDaysIcon, CameraIcon, ChevronRightIcon, HashIcon, LinkIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Num } from "@/components/studio/bits";
import { DISCOVERED } from "@/components/mentura/frame";
import { ME } from "@/components/mentura/data";
import { Face, Head } from "@/components/mentura/parts";

const COMPLETION = 60;

const INSIGHTS = [
  { t: "Add a photo", d: "Profiles with a photo get about three times more views from investors.", impact: "High impact", href: "/mentura/profile/edit", icon: CameraIcon },
  { t: "Post this week", d: "You last posted 2 hours ago. One post a week keeps you in the feed.", impact: "High impact", href: "/mentura", icon: HashIcon },
  { t: "Go to an event", d: "You are going to three. People who meet you there look you up after.", impact: "Medium impact", href: "/mentura/events", icon: CalendarDaysIcon },
  { t: "Confirm a social link", d: "A confirmed link tells people the profile is really yours.", impact: "Medium impact", href: "/mentura/profile/edit", icon: LinkIcon },
];

const FAQ = [
  { q: "What is the discovery score?", a: "It is how likely founders and investors are to find you in search, Discover and the feed. It goes up as your profile fills in and as you post and show up." },
  { q: "Who can see it?", a: "Only you. Other people see your profile, not the score." },
  { q: "How often does it change?", a: "Every day, from what you did in the last four weeks." },
];

function ImpactLabel({ impact }: { impact: string }) {
  const high = impact === "High impact";
  return <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide", high ? "bg-emerald-600/10 text-emerald-700 dark:text-emerald-400" : "bg-muted text-muted-foreground")}>{impact}</span>;
}

export default function Discovered() {
  return (
    <div className="px-4 py-5 md:px-8">
      <Head n="M8" title="Get discovered" job="How findable you are, and the next things that make you more so." />

      <div className="mx-auto max-w-2xl space-y-6">
        <section className="bg-card relative flex flex-col items-center gap-5 rounded-xl border p-5 sm:flex-row sm:items-center">
          <Num n="M8.1" className="absolute -top-2 left-4" />
          <span className="grid size-28 shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(oklch(0.6 0.15 150) ${DISCOVERED * 3.6}deg, var(--muted) 0)` }}>
            <span className="bg-card grid size-[100px] place-items-center rounded-full"><Face handle={ME} size={80} name={false} /></span>
          </span>
          <div className="min-w-0 text-center sm:text-left">
            <div className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Discovery score</div>
            <div className="text-5xl font-semibold tabular-nums">{DISCOVERED}%</div>
            <p className="text-muted-foreground mt-1 text-sm">You show up in about six of every ten searches that match what you make. Adding a photo is the biggest step up.</p>
            <Button className="mt-3" size="sm" asChild><Link href="/mentura/profile/edit">Add a photo</Link></Button>
          </div>
        </section>

        <section className="relative rounded-xl border p-4">
          <Num n="M8.2" className="absolute -top-2 right-3" />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="flex items-center gap-2 text-sm font-medium">Profile completion <ImpactLabel impact="High impact" /></span>
            <span className="text-sm tabular-nums">{COMPLETION}%</span>
          </div>
          <div className="bg-muted mt-2 h-2 overflow-hidden rounded-full"><div className="bg-foreground h-full rounded-full" style={{ width: `${COMPLETION}%` }} /></div>
          <p className="text-muted-foreground mt-2 text-xs">Two steps left: a photo and one confirmed social link.</p>
        </section>

        <section className="relative">
          <Num n="M8.3" className="absolute -top-2 right-0" />
          <h2 className="text-muted-foreground mb-2 text-xs font-medium uppercase tracking-wide">Insights</h2>
          <ul className="divide-y rounded-xl border">
            {INSIGHTS.map((it) => (
              <li key={it.t}>
                <Link href={it.href} className="hover:bg-accent/50 flex items-start gap-3 p-3">
                  <span className="bg-muted grid size-9 shrink-0 place-items-center rounded-lg"><it.icon className="size-4" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2 text-sm font-medium">{it.t}<ImpactLabel impact={it.impact} /></span>
                    <span className="text-muted-foreground block text-sm">{it.d}</span>
                  </span>
                  <ChevronRightIcon className="text-muted-foreground mt-2 size-4 shrink-0" />
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="relative">
          <Num n="M8.4" className="absolute -top-2 right-0" />
          <h2 className="text-muted-foreground mb-2 text-xs font-medium uppercase tracking-wide">Questions</h2>
          <div className="divide-y rounded-xl border">
            {FAQ.map((f) => (
              <details key={f.q} className="group p-3">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-sm font-medium">{f.q}<ChevronRightIcon className="text-muted-foreground size-4 shrink-0 transition-transform group-open:rotate-90" /></summary>
                <p className="text-muted-foreground mt-2 text-sm">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
