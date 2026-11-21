"use client";

// M2 Dashboard, after Contra's dashboard (data.ts REFS.dashboard): a welcome, quick action pills, the AI's action items
// with an ask box that opens the AI chat (M3), stat cards, your ventures, your next meetings and the events you are going to.
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRightIcon, CalendarDaysIcon, EyeIcon, HashIcon, MessageSquareIcon, RadarIcon, SparklesIcon, UserPlusIcon, VideoIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Num } from "@/components/studio/bits";
import { CONVOS, EVENTS, ME, personOf, REQUESTS, VENTURES } from "@/components/mentura/data";
import { EventRow, Face, Head, VentureCard } from "@/components/mentura/parts";
import { useMentura } from "@/components/mentura/store";

const MEETINGS = [
  { id: "m1", who: "maya", title: "Haptic Plays first look", when: "Tomorrow · 10:00 AM", where: "Video call" },
  { id: "m2", who: "dev", title: "Motor driver review", when: "Sat, Nov 29 · 11:00 AM", where: "Capital Factory" },
  { id: "m3", who: "priya", title: "Intro call with Third Coast", when: "Tue, Dec 2 · 3:00 PM", where: "Video call" },
];

const ACTIONS = [
  { href: "/mentura?compose=1", label: "Post an update", icon: HashIcon },
  { href: "/mentura/events", label: "Find an event", icon: CalendarDaysIcon },
  { href: "/mentura/meetings", label: "Book a meeting", icon: VideoIcon },
  { href: "/mentura/discovered", label: "Get discovered", icon: RadarIcon },
];

export default function Dashboard() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const first = personOf(ME).name.split(" ")[0];
  const waiting = [...CONVOS, ...REQUESTS].reduce((s, c) => s + c.unread, 0);
  const mine = VENTURES.filter((v) => v.team.includes(ME));
  const { going: seats } = useMentura();
  const going = EVENTS.filter((e) => seats.includes(e.id));
  const ask = () => { if (q.trim()) router.push(`/mentura/ai?q=${encodeURIComponent(q.trim())}`); };

  const stats = [
    { label: "Profile views this week", value: 128, delta: "+34% on last week", icon: EyeIcon },
    { label: "Followers gained", value: 17, delta: "Maya Ortiz was one", icon: UserPlusIcon },
    { label: "Messages waiting", value: waiting, delta: "One is a request", icon: MessageSquareIcon, href: "/mentura/messages" },
  ];

  return (
    <div className="px-4 py-5 md:px-8">
      <Head n="M2" title={`Welcome, ${first}`} job="Your week in Mentura: what the AI says to do today, views, meetings and ventures." />

      <div className="relative -mt-1 mb-6 flex flex-wrap gap-2">
        <Num n="M2.1" className="absolute -top-3 right-0" />
        {ACTIONS.map((a) => (
          <Button key={a.label} variant="outline" size="sm" className="rounded-full" asChild>
            <Link href={a.href}><a.icon />{a.label}</Link>
          </Button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-6">
          <section className="bg-card relative rounded-xl border p-4 md:p-5">
            <Num n="M2.2" className="absolute -top-2 left-4" />
            <div className="flex items-center gap-2 text-sm font-medium"><SparklesIcon className="size-4" />AI<span className="text-muted-foreground font-normal">· Action items</span></div>
            <p className="mt-3 text-[15px] leading-relaxed">Good morning, {first}. Three things matter most today.</p>
            <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm leading-relaxed">
              <li>Reply to <Link href="/mentura/messages?c=c1" className="font-medium underline-offset-4 hover:underline">Maya Ortiz</Link>. She asked for Tuesday&apos;s practice video and she takes first meetings in December.</li>
              <li>Answer <Link href="/mentura/messages?tab=requests" className="font-medium underline-offset-4 hover:underline">Priya Shah</Link>. Third Coast is looking at sports hardware.</li>
              <li>Send Dev Patel the board files before your Saturday review.</li>
            </ol>
            <form className="mt-4 flex gap-2" onSubmit={(e) => { e.preventDefault(); ask(); }}>
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ask the AI about today" aria-label="Ask the AI"
                className="border-input placeholder:text-muted-foreground focus-visible:ring-ring/50 h-9 min-w-0 flex-1 rounded-md border bg-transparent px-3 text-sm outline-none focus-visible:ring-[3px]" />
              <Button type="submit" disabled={!q.trim()}>Ask<ArrowRightIcon /></Button>
            </form>
          </section>

          <section className="relative grid gap-3 sm:grid-cols-3">
            <Num n="M2.3" className="absolute -top-2 right-0 z-10" />
            {stats.map((s) => {
              const body = (
                <>
                  <span className="text-muted-foreground flex items-center gap-1.5 text-xs"><s.icon className="size-3.5" />{s.label}</span>
                  <span className="mt-2 block text-3xl font-semibold tabular-nums">{s.value}</span>
                  <span className="text-muted-foreground mt-1 block text-xs">{s.delta}</span>
                </>
              );
              return s.href
                ? <Link key={s.label} href={s.href} className="bg-card hover:border-foreground/30 block rounded-xl border p-4">{body}</Link>
                : <div key={s.label} className="bg-card rounded-xl border p-4">{body}</div>;
            })}
          </section>

          <section className="relative">
            <Num n="M2.4" className="absolute -top-2 right-0" />
            <h2 className="text-muted-foreground mb-2 text-xs font-medium uppercase tracking-wide">Your ventures</h2>
            <div className="grid gap-3 sm:grid-cols-2">{mine.map((v, i) => <VentureCard key={v.slug} v={v} first={i === 0} />)}</div>
          </section>
        </div>

        <aside className="min-w-0 space-y-6">
          <section className="relative rounded-xl border p-4">
            <Num n="M2.5" className="absolute -top-2 right-3" />
            <div className="flex items-center justify-between"><h2 className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Next meetings</h2><Link href="/mentura/meetings" className="text-muted-foreground text-xs hover:text-foreground">All meetings</Link></div>
            <ul className="mt-3 space-y-3">
              {MEETINGS.map((m) => (
                <li key={m.id} className="flex items-start gap-2">
                  <span className="min-w-0 flex-1"><Face handle={m.who} size={32} sub={m.when} /></span>
                  <Link href="/mentura/meetings" className="text-muted-foreground hover:text-foreground max-w-[45%] truncate pt-1 text-right text-xs">{m.title}</Link>
                </li>
              ))}
            </ul>
          </section>
          <section className="relative rounded-xl border p-3">
            <Num n="M2.6" className="absolute -top-2 right-3" />
            <div className="flex items-center justify-between px-1"><h2 className="text-muted-foreground text-xs font-medium uppercase tracking-wide">You are going</h2><Link href="/mentura/events" className="text-muted-foreground text-xs hover:text-foreground">All events</Link></div>
            <div className="mt-2 space-y-1">{going.length ? going.map((e) => <EventRow key={e.id} ev={e} />) : <p className="text-muted-foreground px-1 py-2 text-sm">No seats yet. <Link href="/mentura/events" className="underline">Find an event</Link></p>}</div>
          </section>
        </aside>
      </div>
    </div>
  );
}
