import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRightIcon } from "lucide-react";
import { SidebarButton } from "@/components/sidebar";
import { Face } from "@/components/dash";
import { cn } from "@/lib/utils";
import { requireUser } from "@/server/session";
import { calendarPart } from "@/server/calendar-tools";
import { planOf } from "@/server/plan";
import { budgetView } from "@reflect/core/budget";
import { incomingRequests } from "@/server/connect-store";
import { threadsOf } from "@/server/messages-store";
import { nextGoing, upcomingEvents } from "@/server/events-store";
import { homeCardsToday } from "@/server/home-cards-store";
import { dashboardFacts } from "@/server/dashboard";
import { selfOf } from "@/server/profile-store";
import { HomeCards } from "../home-cards";
import { cardView } from "../home-card-view";
import { AskBar } from "./ask-bar";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

// Kept apart from Home so it can be tried out (Torian, 2026-11-18 18:35Z): what needs the person now, read from every
// part of Reflect, with Ask Reflect at the top. Times are Austin's, where Reflect's events are.
const ZONE = "America/Chicago";
const money = (n: number) => `${n < 0 ? "-" : ""}$${Math.abs(Math.round(n)).toLocaleString("en-US")}`;
const dayIn = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: ZONE }).format(d);
const hourIn = (d: Date) => Number(new Intl.DateTimeFormat("en-US", { timeZone: ZONE, hour: "numeric", hourCycle: "h23" }).format(d));
const eventWhen = (iso: string) => new Intl.DateTimeFormat("en-US", { timeZone: ZONE, weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(iso));
const longDay = (d: Date) => new Intl.DateTimeFormat("en-US", { timeZone: ZONE, weekday: "long", month: "long", day: "numeric" }).format(d);
const safe = <T,>(p: Promise<T>, none: T) => p.catch(() => none);

function Section({ title, href, more = "All", children, className }: { title: string; href: string; more?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-lg font-semibold">{title}</h2>
        <Link href={href} className="text-muted-foreground hover:text-foreground inline-flex items-center gap-0.5 text-sm">{more}<ChevronRightIcon className="size-4" /></Link>
      </div>
      {children}
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-muted-foreground text-sm">{children}</p>;
}

/** The dashboard: Ask Reflect, then today's calendar, people waiting on you and the cards Ask Reflect placed; money, events and recent chats beside. */
export default async function Dashboard() {
  const user = await requireUser();
  const now = new Date();
  const today = dayIn(now);
  const tomorrow = dayIn(new Date(now.getTime() + 86400_000));
  const [cal, { plan, budget }, requests, threads, going, nearby, cards, { chats }, me] = await Promise.all([
    safe(calendarPart(user.id, today, tomorrow), null),
    planOf(user.id),
    safe(incomingRequests(user.id), []),
    safe(threadsOf(user.id), []),
    safe(nextGoing(user.id), null),
    safe(upcomingEvents({ from: now, limit: 4 }), []),
    safe(homeCardsToday(user.id, today), []),
    dashboardFacts(user.id),
    safe(selfOf(user.id), { name: "", href: "" }),
  ]);
  const money$ = budgetView(plan, budget);
  const todays = (cal?.events ?? []).filter((e) => e.day === today);
  const tomorrows = (cal?.events ?? []).filter((e) => e.day === tomorrow);
  const nextUp = todays.find((e) => !e.starts || e.starts >= new Intl.DateTimeFormat("en-GB", { timeZone: ZONE, hour: "2-digit", minute: "2-digit" }).format(now)) ?? todays[0] ?? null;
  const unread = threads.filter((t) => t.last && !t.last.you).slice(0, 3);
  const events = nearby.filter((e) => e.id !== going?.id).slice(0, 3);
  const hour = hourIn(now);
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const first = me.name && me.name !== "Owner" ? me.name.split(" ")[0] : "";

  // A line on where the day stands, put together from the parts below; Ask Reflect writing it is not built.
  const brief = [
    todays.length ? `${todays.length} thing${todays.length === 1 ? "" : "s"} on your calendar today` : "Nothing on your calendar today",
    requests.length ? `${requests.length} ${requests.length === 1 ? "person wants" : "people want"} to connect` : null,
    money$.allotted > 0 ? (money$.leftToAllot < 0 ? `${money(-money$.leftToAllot)} more allotted than comes in` : `${money(money$.leftToAllot)} a month left to allot`) : null,
  ].filter(Boolean).join(" · ");

  const suggestions = [
    todays.length ? "What's on my day?" : "Plan my day",
    "How is my budget this month?",
    requests.length ? "Who wants to connect?" : "Find an event this week",
    "What should I learn next?",
  ];

  return (
    <main className="mx-auto grid min-h-screen max-w-5xl grid-cols-[minmax(0,1fr)] content-start gap-8 px-4 py-6 sm:px-6">
      <header className="flex items-center gap-3">
        <SidebarButton />
        <span className="text-muted-foreground text-sm">{longDay(now)}</span>
      </header>

      <section aria-label="Ask Reflect" className="grid grid-cols-[minmax(0,1fr)] gap-4">
        <div className="grid gap-1">
          <h1 className="text-3xl font-semibold tracking-tight">{greeting}{first ? `, ${first}` : ""}</h1>
          <p className="text-muted-foreground">{brief}</p>
        </div>
        <AskBar suggestions={suggestions} />
      </section>

      <div className="grid gap-8 grid-cols-[minmax(0,1fr)] lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="grid grid-cols-[minmax(0,1fr)] content-start gap-8">
          <Section title="Today" href={`/calendar?day=${today}`} more="Calendar">
            {nextUp ? (
              <Link href={nextUp.href} className="bg-card hover:bg-accent grid gap-1 rounded-xl border p-4 transition">
                <span className="text-muted-foreground text-sm font-medium">{nextUp.starts ? `Next · ${nextUp.when}` : "All day"}</span>
                <span className="text-xl font-semibold">{nextUp.title}</span>
                {nextUp.tile_label ? <span className="text-muted-foreground text-sm">{nextUp.tile_label}</span> : null}
              </Link>
            ) : <Empty>Nothing on your calendar today.</Empty>}
            {todays.filter((e) => e !== nextUp).length || tomorrows.length ? (
              <ul className="grid grid-cols-[minmax(0,1fr)] gap-1">
                {todays.filter((e) => e !== nextUp).slice(0, 5).map((e) => (
                  <li key={`${e.id}-${e.day}`}><Link href={e.href} className="hover:bg-accent grid grid-cols-[6rem_1fr] gap-3 rounded-lg px-2 py-1.5 text-sm"><span className="text-muted-foreground">{e.when}</span><span className="truncate">{e.title}</span></Link></li>
                ))}
                {todays.length - 1 > 5 ? <li><Link href={`/calendar?day=${today}`} className="text-muted-foreground hover:text-foreground block px-2 py-1.5 text-sm">{todays.length - 6} more today</Link></li> : null}
                {tomorrows.length ? <li className="text-muted-foreground px-2 pt-2 text-xs font-medium tracking-wide uppercase">Tomorrow</li> : null}
                {tomorrows.slice(0, 3).map((e) => (
                  <li key={`${e.id}-${e.day}`}><Link href={e.href} className="hover:bg-accent grid grid-cols-[6rem_1fr] gap-3 rounded-lg px-2 py-1.5 text-sm"><span className="text-muted-foreground">{e.when}</span><span className="truncate">{e.title}</span></Link></li>
                ))}
              </ul>
            ) : null}
          </Section>

          <Section title="People" href="/life/friends" more="Friends">
            {requests.length || unread.length ? (
              <ul className="grid grid-cols-[minmax(0,1fr)] gap-2">
                {requests.slice(0, 3).map((r) => (
                  <li key={r.id}><Link href="/life/friends" className="hover:bg-accent flex items-center gap-3 rounded-xl px-2 py-2">
                    <Face name={r.from.name} size={40} />
                    <span className="grid min-w-0"><span className="font-medium">{r.from.name}</span><span className="text-muted-foreground truncate text-sm">Wants to connect{r.event ? ` · met at ${r.event.title}` : ""}</span></span>
                  </Link></li>
                ))}
                {unread.map((t) => (
                  <li key={t.id}><Link href={`/life/friends/messages/${encodeURIComponent(t.id)}`} className="hover:bg-accent flex items-center gap-3 rounded-xl px-2 py-2">
                    <Face name={t.name} size={40} />
                    <span className="grid min-w-0"><span className="font-medium">{t.name}</span><span className="text-muted-foreground truncate text-sm">{t.last!.text}</span></span>
                  </Link></li>
                ))}
              </ul>
            ) : <Empty>No one is waiting on you.</Empty>}
          </Section>

          {cards.length ? (
            <section className="grid gap-3">
              <h2 className="text-lg font-semibold">From Ask Reflect</h2>
              <div className="-mt-6"><HomeCards cards={cards.map((c) => cardView(c, today))} /></div>
            </section>
          ) : null}
        </div>

        <aside className="grid grid-cols-[minmax(0,1fr)] content-start gap-8">
          <Section title="Money" href="/plan" more="Budget">
            <Link href="/plan" className="bg-card hover:bg-accent grid gap-1 rounded-xl border p-4 transition">
              <span className="text-muted-foreground text-sm font-medium">Left to allot a month</span>
              <span className={cn("text-2xl font-semibold", money$.leftToAllot < 0 && "text-destructive")}>{money(money$.leftToAllot)}</span>
              <span className="text-muted-foreground text-sm">{money(money$.allotted)} allotted of {money(money$.takeHome)} take-home</span>
            </Link>
          </Section>

          <Section title="Events" href="/events" more="Events">
            <ul className="grid grid-cols-[minmax(0,1fr)] gap-1">
              {going?.startsAt ? (
                <li><Link href={`/events/${going.id}`} className="hover:bg-accent grid rounded-lg px-2 py-1.5"><span className="text-sm font-medium">{going.title}</span><span className="text-muted-foreground text-xs">Going · {eventWhen(going.startsAt)}</span></Link></li>
              ) : null}
              {events.map((e) => (
                <li key={e.id}><Link href={`/events/${e.id}`} className="hover:bg-accent grid rounded-lg px-2 py-1.5"><span className="truncate text-sm">{e.title}</span><span className="text-muted-foreground text-xs">{e.startsAt ? eventWhen(e.startsAt) : ""}{e.venue ? ` · ${e.venue}` : ""}</span></Link></li>
              ))}
            </ul>
            {!going && !events.length ? <Empty>No events in Austin in the next weeks.</Empty> : null}
          </Section>

          <Section title="Recent chats" href="/chat/history" more="History">
            {chats.length ? (
              <ul className="grid grid-cols-[minmax(0,1fr)] gap-1">
                {chats.slice(0, 4).map((c) => (
                  <li key={c.id}><Link href={`/chat/history/${c.id}`} className="hover:bg-accent block truncate rounded-lg px-2 py-1.5 text-sm">{c.title}</Link></li>
                ))}
              </ul>
            ) : <Empty>Ask Reflect anything above.</Empty>}
          </Section>
        </aside>
      </div>
    </main>
  );
}
