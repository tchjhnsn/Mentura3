"use client";

// M11 Event, after Contra's home event card opened full: the cover, what and when, the host, who is going, your seat,
// and the posts about the event.
import { use, useState } from "react";
import Link from "next/link";
import { ArrowLeftIcon, CalendarIcon, CheckIcon, MapPinIcon, QrCodeIcon, ShareIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Num } from "@/components/studio/bits";
import { ME, POSTS, eventOf, personOf } from "@/components/mentura/data";
import { Face, PostCard } from "@/components/mentura/parts";

const COVER_HUE: Record<string, number> = { e1: 330, e2: 140, e3: 24, e4: 100 };

export default function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const ev = eventOf(id);
  const host = personOf(ev.host);
  const [going, setGoing] = useState(ev.going.includes(ME));
  const [shared, setShared] = useState(false);
  const people = going ? (ev.going.includes(ME) ? ev.going : [...ev.going, ME]) : ev.going.filter((h) => h !== ME);
  const left = ev.seats !== undefined ? Math.max(ev.seats - people.length, 0) : undefined;
  const posts = POSTS.filter((p) => p.tags.includes("events") || p.by === ev.host);
  const hue = COVER_HUE[ev.id] ?? host.hue;

  const share = () => {
    try { void navigator.clipboard?.writeText(window.location.href); } catch {}
    setShared(true);
  };

  return (
    <div data-virtu-screen="M11" className="px-4 py-5 md:px-8">
      <Link href="/mentura/events" className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1.5 text-sm"><ArrowLeftIcon className="size-4" />Events</Link>

      <div className="relative grid min-h-44 content-between overflow-hidden rounded-2xl p-5 text-white md:min-h-56 md:p-7" style={{ background: `linear-gradient(135deg, oklch(0.42 0.1 ${hue}), oklch(0.2 0.04 260))` }}>
        <Num n="M11" className="absolute top-3 right-3" />
        <span className="w-fit rounded-md bg-white/15 px-2 py-0.5 text-xs font-medium">{ev.kind}</span>
        <h1 className="mt-6 text-2xl font-semibold leading-tight tracking-tight md:text-3xl">{ev.title}</h1>
      </div>

      <div className="mt-5 grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="min-w-0 space-y-6">
          <section className="relative space-y-2 text-sm">
            <Num n="M11.1" className="absolute -top-2 right-0" />
            <p className="flex items-center gap-2"><CalendarIcon className="text-muted-foreground size-4 shrink-0" />{ev.when}</p>
            <p className="flex items-center gap-2"><MapPinIcon className="text-muted-foreground size-4 shrink-0" />{ev.place}</p>
            <div className="pt-2"><Face handle={ev.host} size={40} sub={`Host · ${host.role}${host.fund ? ` at ${host.fund}` : ""}`} /></div>
          </section>

          <section className="relative">
            <Num n="M11.2" className="absolute -top-2 right-0" />
            <h2 className="text-muted-foreground mb-2 text-xs font-medium uppercase tracking-wide">About</h2>
            <p className="text-[15px] leading-relaxed">{ev.about || `${host.name.split(" ")[0]} has not written about this event yet.`}</p>
          </section>

          <section className="relative">
            <Num n="M11.3" className="absolute -top-2 right-0" />
            <h2 className="text-muted-foreground mb-3 text-xs font-medium uppercase tracking-wide">Going · {people.length}</h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              {people.map((h) => <li key={h} className="min-w-0"><Face handle={h} size={36} sub={h === ME ? "You" : undefined} /></li>)}
            </ul>
          </section>

          <section className="relative">
            <Num n="M11.5" className="absolute -top-2 right-0" />
            <h2 className="text-muted-foreground mb-3 text-xs font-medium uppercase tracking-wide">Posts about this event</h2>
            <div className="space-y-4">
              {posts.length ? posts.map((p) => <PostCard key={p.id} post={p} />) : <p className="text-muted-foreground rounded-xl border border-dashed p-6 text-sm">No posts yet. Write one after you go.</p>}
            </div>
          </section>
        </div>

        <aside className="relative order-first lg:order-none">
          <div className="bg-card space-y-3 rounded-xl border p-4 lg:sticky lg:top-5">
            <Num n="M11.4" className="absolute -top-2 right-3" />
            <p className="text-sm">{left !== undefined ? <><span className="font-semibold">{left}</span> of {ev.seats} seats left</> : "Open seating, no limit"}</p>
            {going ? (
              <div className="space-y-2">
                <p className="flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-400"><CheckIcon className="size-4" />You are going</p>
                <p className="text-muted-foreground flex items-start gap-2 text-xs"><QrCodeIcon className="mt-0.5 size-3.5 shrink-0" />Show your QR code at the door to check in.</p>
                <Button variant="ghost" size="sm" className="w-full" onClick={() => setGoing(false)}>Cancel</Button>
              </div>
            ) : (
              <Button className="w-full" disabled={left === 0} onClick={() => setGoing(true)}>{left === 0 ? "No seats left" : "Take a seat"}</Button>
            )}
            <Button variant="outline" size="sm" className="w-full" onClick={share}><ShareIcon />{shared ? "Link copied" : "Share"}</Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
