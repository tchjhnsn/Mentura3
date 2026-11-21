"use client";

// M13 Venture page, after Contra's profile: a venture's public page with what it is, its phase, its team, its raise and
// its updates.
import { use, useState } from "react";
import Link from "next/link";
import { CheckIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Num } from "@/components/studio/bits";
import { POSTS, ventureOf } from "@/components/mentura/data";
import { Face, PostCard } from "@/components/mentura/parts";

const PHASES = ["Discovery", "Validation", "Beachhead", "Scale", "Platform"] as const;

export default function VenturePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const v = ventureOf(slug);
  const [following, setFollowing] = useState(false);
  const [asked, setAsked] = useState(false);
  const at = Math.max(0, PHASES.indexOf(v.phase as (typeof PHASES)[number]));
  const updates = POSTS.filter((p) => p.venture === v.slug);

  return (
    <div data-virtu-screen="M13" className="px-4 py-5 md:px-8">
      <section className="relative overflow-hidden rounded-2xl p-5 text-white md:p-8" style={{ background: `linear-gradient(135deg, oklch(0.72 0.12 ${v.hue}), oklch(0.36 0.1 ${(v.hue + 40) % 360}))` }}>
        <Num n="M13" className="absolute top-2 left-2" />
        <Num n="M13.1" className="absolute top-2 right-2" />
        <div className="flex flex-wrap items-end justify-between gap-4 pt-4">
          <div className="min-w-0">
            <p className="text-sm opacity-85">Venture</p>
            <h1 className="text-3xl font-semibold tracking-tight break-words md:text-4xl">{v.name}</h1>
            <p className="mt-2 max-w-xl text-[15px] opacity-95">{v.line}</p>
          </div>
          <Button variant="outline" size="sm" aria-pressed={following} onClick={() => setFollowing(!following)} className="border-white/60 bg-white/10 text-white hover:bg-white/20 hover:text-white dark:bg-white/10">{following ? "Following venture" : "Follow venture"}</Button>
        </div>
      </section>

      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-6">
          <section className="relative rounded-xl border p-4 md:p-5">
            <Num n="M13.2" className="absolute -top-2 right-4" />
            <div className="flex items-baseline justify-between gap-2"><h2 className="font-medium">Phase</h2><span className="text-muted-foreground text-sm">{v.phase}, step {at + 1} of 5</span></div>
            <ol className="mt-3 grid grid-cols-5 gap-1.5" aria-label={`Phase: ${v.phase}`}>
              {PHASES.map((ph, i) => (
                <li key={ph} className="min-w-0" aria-current={i === at ? "step" : undefined}>
                  <span className={cn("block h-2 rounded-full", i <= at ? "" : "bg-muted")} style={i <= at ? { background: `oklch(0.6 0.13 ${v.hue})` } : undefined} />
                  <span className={cn("mt-1.5 block truncate text-[11px] sm:text-xs", i === at ? "font-medium" : "text-muted-foreground")}>{ph}</span>
                </li>
              ))}
            </ol>
          </section>

          <section className="relative">
            <Num n="M13.4" className="absolute -top-2 right-0" />
            <h2 className="text-muted-foreground mb-2 text-xs font-medium uppercase tracking-wide">Updates</h2>
            <div className="space-y-4">
              {updates.length ? updates.map((p, i) => <PostCard key={p.id} post={p} first={i === 0} />) : <p className="text-muted-foreground rounded-xl border border-dashed p-6 text-sm">No updates yet.</p>}
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="relative rounded-xl border p-4">
            <Num n="M13.3" className="absolute -top-2 right-4" />
            <h2 className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Team</h2>
            <ul className="mt-3 space-y-3">{v.team.map((h) => <li key={h}><Face handle={h} size={36} /></li>)}</ul>
          </section>

          <section className="relative rounded-xl border p-4">
            <Num n="M13.5" className="absolute -top-2 right-4" />
            <h2 className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Raising</h2>
            {v.raising ? (
              <>
                <p className="mt-2 text-lg font-semibold">{v.raising}</p>
                <p className="text-muted-foreground text-sm">The team shares the deck with investors who ask.</p>
                <Button className="mt-3 w-full" disabled={asked} onClick={() => setAsked(true)}>Ask for the deck</Button>
                {asked ? <p className="mt-2 flex items-center gap-1.5 text-sm text-emerald-700 dark:text-emerald-400"><CheckIcon className="size-4" />Sent. The team will reply in Messages.</p> : null}
              </>
            ) : (
              <>
                <p className="text-muted-foreground mt-2 text-sm">{v.name} is not raising right now.</p>
                <Button asChild className="mt-3 w-full"><Link href="/mentura/messages">Message the team</Link></Button>
              </>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
