import type { Metadata } from "next";
import Link from "next/link";
import { PlusIcon } from "lucide-react";
import { austinDay, dayLabel, EDDY, type EventOut } from "@reflect/core/events";
import { PAGE, PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { requireUser } from "@/server/session";
import { byDay, draftsOf, goingAmong, knownGoing, nextGoing, refreshEddy, upcomingEvents } from "@/server/events-store";
import { newEventAction } from "./actions";
import { CHIPS, Cover, EventRow, knownLine, timeSpan } from "./parts";

export const metadata: Metadata = { title: "Events" };
export const dynamic = "force-dynamic";
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

/** Austin's day `n` days from today. */
const dayFrom = (n: number) => austinDay(new Date(Date.now() + n * 86400_000).toISOString());

/**
 * Events (doc "Events and connections design guide", 2026-11-18, per page 1): the next event you are going to, large,
 * then this week and the days after, by Austin day, with events hosted in Reflect first in each day. The chips filter
 * by tag in place; + is the one filled control and starts an event you host.
 */
export default async function EventsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const tag = CHIPS.find((c) => c.toLowerCase() === one(sp.tag).toLowerCase()) ?? null;
  const feed = await refreshEddy();
  const [list, next, drafts] = await Promise.all([upcomingEvents({ tag }).catch(() => [] as EventOut[]), nextGoing(user.id).catch(() => null), draftsOf(user.id).catch(() => [] as EventOut[])]);
  const ids = [...list.map((e) => e.id), ...(next ? [next.id] : [])];
  const [going, known] = await Promise.all([goingAmong(user.id, ids), knownGoing(user.id, ids)]);
  const weekEnd = dayFrom(6);
  const days = byDay(list.filter((e) => e.id !== next?.id), dayFrom(0));
  const thisWeek = days.filter((d) => d.day <= weekEnd), later = days.filter((d) => d.day > weekEnd);
  const hasEddy = list.some((e) => e.source === "eddy");
  const nextKnown = next ? (known.get(next.id) ?? []).length : 0;
  const chip = (c: string | null) => (c ? `/events?tag=${encodeURIComponent(c)}` : "/events");

  return (
    <main className={PAGE}>
      {/* + sits beside the title on a phone, where the header's right side wraps under it, and at the right on wider screens. */}
      <PageHeader back="/v" backLabel="Village and polis" title={<span className="flex items-center justify-between gap-2">Events<HostButton className="sm:hidden" /></span>}>
        <HostButton className="hidden sm:block" />
      </PageHeader>

      <nav aria-label="Filter events" className="mt-1 flex flex-wrap gap-2">
        {CHIPS.map((c) => (
          <Link key={c} href={chip(tag === c ? null : c)} aria-pressed={tag === c} scroll={false}
            className={cn("rounded-full border px-3 py-1 text-sm transition", tag === c ? "bg-foreground text-background border-foreground" : "hover:bg-accent")}>{c}</Link>
        ))}
      </nav>

      <div className="mt-6 grid max-w-3xl grid-cols-[minmax(0,1fr)] gap-8">
        {next ? (
          <Link href={`/events/${next.id}`} className="group bg-muted relative block aspect-[16/9] overflow-hidden rounded-2xl sm:aspect-[2/1]">
            <Cover e={next} className="absolute inset-0 transition group-hover:scale-[1.01]" />
            <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
            <span className="absolute inset-x-0 bottom-0 grid gap-1 p-5 text-white">
              <span className="text-sm text-white/80">You&apos;re going · {dayLabel(austinDay(next.startsAt!))}, {timeSpan(next)}</span>
              <span className="text-2xl font-bold tracking-tight sm:text-3xl">{next.title}</span>
              <span className="text-sm text-white/85">{[next.venue, nextKnown ? knownLine(nextKnown) : null].filter(Boolean).join(" · ")}</span>
            </span>
          </Link>
        ) : null}

        {drafts.length ? (
          <section aria-labelledby="drafts" className="grid gap-2">
            <h2 id="drafts" className="text-muted-foreground text-sm font-medium">Your drafts</h2>
            <ul className="grid gap-1">
              {drafts.map((d) => <li key={d.id}><Link href={`/events/${d.id}`} className="hover:bg-accent -mx-2 flex items-baseline justify-between gap-3 rounded-lg px-2 py-1.5"><span className="truncate font-medium">{d.title}</span><span className="text-muted-foreground shrink-0 text-xs">{d.startsAt ? dayLabel(austinDay(d.startsAt)) : "No date yet"}</span></Link></li>)}
            </ul>
          </section>
        ) : null}

        {feed.down ? <p className="text-muted-foreground text-sm">{EDDY.name.replace(/^./, (c) => c.toUpperCase())} can&apos;t be reached right now.</p> : null}

        <section aria-labelledby="this-week" className="grid gap-4">
          <h2 id="this-week" className="text-lg font-semibold">This week</h2>
          {thisWeek.length ? thisWeek.map((d) => <Day key={d.day} day={d.day} events={d.events} going={going} known={known} />) : (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed p-4">
              <p className="text-muted-foreground text-sm">{tag ? `Nothing tagged ${tag} this week.` : "Nothing this week."} Host one?</p>
              <form action={newEventAction}><Button type="submit" variant="outline" size="sm"><PlusIcon />Host</Button></form>
            </div>
          )}
        </section>

        {later.length ? (
          <section aria-labelledby="later" className="grid gap-4">
            <h2 id="later" className="text-lg font-semibold">{thisWeek.length ? "Later" : "Next week and after"}</h2>
            {later.map((d) => <Day key={d.day} day={d.day} events={d.events} going={going} known={known} />)}
          </section>
        ) : null}

        {hasEddy || !feed.down ? (
          <p className="text-muted-foreground border-t pt-4 text-xs"><a href={EDDY.href} target="_blank" rel="noreferrer" className="hover:text-foreground underline underline-offset-2">From Eddy&apos;s Austin events</a></p>
        ) : null}
      </div>
    </main>
  );
}

function Day({ day, events, going, known }: { day: string; events: EventOut[]; going: Set<string>; known: Map<string, unknown[]> }) {
  const today = dayFrom(0), tomorrow = dayFrom(1);
  return (
    <div className="grid gap-1">
      <h3 className="text-muted-foreground text-sm font-medium">{day === today ? `Today, ${dayLabel(day)}` : day === tomorrow ? `Tomorrow, ${dayLabel(day)}` : dayLabel(day)}</h3>
      <ul className="grid">
        {events.map((e) => <li key={e.id}><EventRow e={e} going={going.has(e.id)} known={(known.get(e.id) ?? []).length} /></li>)}
      </ul>
    </div>
  );
}

function HostButton({ className }: { className?: string }) {
  return <form action={newEventAction} className={className}><Button type="submit" size="icon" aria-label="Host an event"><PlusIcon /></Button></form>;
}
