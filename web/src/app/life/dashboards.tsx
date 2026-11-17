import Link from "next/link";
import { CalendarPlusIcon, DumbbellIcon, HeartPulseIcon, MessageCircleIcon, PlusIcon, SparklesIcon, UsersIcon } from "lucide-react";
import { bodySpace } from "@reflect/core/body";
import { friendsSpace } from "@reflect/core/tile-spaces";
import type { LifeAct, LifeRecord } from "@/server/life-store";
import { Bars, DashCard, DashHead, Face, Hero, Ring } from "@/components/dash";
import { QuickLog } from "@/components/quick-log";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { logFitnessAction, logFriendAction, logHealthAction } from "./dash-actions";
import { Upcoming } from "./upcoming";

const DAY = 86400_000;
const dayBefore = (today: string, n: number) => new Date(Date.parse(`${today}T00:00:00Z`) - n * DAY).toISOString().slice(0, 10);
const weekday = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString("en-US", { weekday: "narrow", timeZone: "UTC" });
const shortDay = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
const ask = (q: string) => `/chat?q=${encodeURIComponent(q)}`;
const set = (k: string, f: string, to: string) => `/life/body/set?k=${k}&f=${f}&to=${encodeURIComponent(to)}`;
const HOURS = [5, 6, 6.5, 7, 7.5, 8, 8.5, 9].map((v) => ({ value: v, label: `${v} h` }));
const MINUTES = [15, 30, 45, 60, 75, 90, 120, 150].map((v) => ({ value: v, label: v >= 60 ? `${v / 60 % 1 ? (v / 60).toFixed(1) : v / 60} h` : `${v} min` }));

/**
 * Health (doc "Tile designs"): the CDC basics as four rings (coverage, a regular doctor, a checkup in the last year,
 * seven or more hours of sleep), the last two weeks of sleep, then a card per basic. Log is the one filled act.
 */
export async function HealthDash({ userId, records, acts, today }: { userId: string; records: LifeRecord[]; acts: LifeAct[]; today: string }) {
  const s = bodySpace(records, acts, today);
  const here = "/life/body?k=health";
  const sleep = s.sleep.logged ?? s.sleep.usual;
  const nights = Array.from({ length: 14 }, (_, i) => dayBefore(today, 13 - i));
  const byNight = new Map<string, number>();
  for (const a of acts) if (a.kind === "slept" && a.minutes) byNight.set(a.day, Math.round((a.minutes / 60) * 10) / 10);
  const checkupDue = s.checkup ? 365 - s.checkup.days : null;
  const basics = [
    { id: "coverage", label: "Coverage", met: !!s.health.coverage },
    { id: "doctor", label: "Doctor", met: !!s.health.doctor },
    { id: "checkup", label: "Checkup", met: checkupDue !== null && checkupDue >= 0 },
    { id: "sleep", label: "Sleep", met: sleep !== null && sleep >= 7 },
  ];
  const met = basics.filter((b) => b.met).length;
  const visits = acts.filter((a) => a.kind === "appointment").map((a) => a.day).sort().reverse();
  return (
    <div className="grid gap-6">
      <Hero>
        <div className="flex flex-wrap items-center justify-between gap-5">
          <div className="grid gap-1">
            <span className="text-muted-foreground text-sm">The basics, by the CDC</span>
            <span className="text-3xl font-bold tracking-tight sm:text-4xl">{met} of 4 met</span>
          </div>
          <QuickLog title="Log" action={logHealthAction} trigger={<><PlusIcon />Log</>} choices={[
            { id: "slept", label: "Sleep last night", amounts: HOURS },
            { id: "appointment", label: "A visit today" },
          ]} />
        </div>
        <ul className="grid grid-cols-4 gap-2">
          {basics.map((b) => (
            <li key={b.id}>
              <Link href={b.id === "sleep" ? set("health", "sleep", here) : set("health", b.id, here)} className="hover:bg-accent grid justify-items-center gap-2 rounded-xl p-2 transition">
                <Ring value={b.met ? 1 : 0} size={60} label={`${b.label}, ${b.met ? "met" : "not met"}`}>
                  {b.met ? <span className="text-primary text-xs font-semibold">Met</span> : null}
                </Ring>
                <span className="text-sm font-medium">{b.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </Hero>

      <div className="grid gap-4 sm:grid-cols-2">
        <DashCard href={set("health", "sleep", here)} title="Sleep, last 14 nights" value={sleep !== null ? `${sleep} h a night` : "Not known"} sub={s.sleep.logged !== null ? `Average of ${s.sleep.nights} logged this week, against 7 hours` : s.sleep.usual !== null ? "What you usually sleep" : "Log a night or say what you usually sleep"} className="sm:col-span-2">
          <Bars values={nights.map((d) => byNight.get(d) ?? null)} line={7} max={10} labels={nights.map((d) => `${shortDay(d)}: ${byNight.get(d) ?? "not logged"}`)} />
          <span className="text-muted-foreground mt-1 flex justify-between text-[0.65rem]">{nights.map((d) => <span key={d} className="flex-1 text-center">{weekday(d)}</span>)}</span>
        </DashCard>
        <DashCard href={set("health", "coverage", here)} title="Coverage" value={s.health.coverage ?? "Not set"} sub={s.health.coverage ? "What it costs counts in your income plan" : "Your plan or how you pay for care"} />
        <DashCard href={set("health", "doctor", here)} title="Regular doctor" value={s.health.doctor ?? "Not set"} sub={visits[0] ? `Last visit ${shortDay(visits[0])}` : "A doctor who knows you"}>
          {s.health.doctor ? <Face name={s.health.doctor.replace(/^Dr\.?\s*/i, "")} size={40} /> : null}
        </DashCard>
        <DashCard href={set("health", "checkup", here)} title="Checkup" tone={checkupDue !== null && checkupDue < 0 ? "warn" : undefined}
          value={s.checkup ? (checkupDue! < 0 ? "Overdue" : checkupDue! < 31 ? "Due this month" : `Due in ${Math.round(checkupDue! / 30)} months`) : "Not set"}
          sub={s.checkup ? `Last on ${shortDay(s.checkup.day)}` : "Once a year"} />
        <DashCard href={ask("Help me with my health: find a doctor, a checkup, or what my coverage covers.")} title="Ask Reflect" value="Find a doctor, plan a checkup" sub="Reflect puts visits on your calendar">
          <SparklesIcon className="text-primary size-5" />
        </DashCard>
      </div>
      <Upcoming userId={userId} tile="body" today={today} hideEmpty title="Coming up" />
    </div>
  );
}

/**
 * Fitness (doc "Tile designs"): the week against the guidelines (150 minutes, vigorous counting twice, and strength
 * on two days) as two rings and a strip of days, the next session, the last sessions, and the goals under way.
 */
export async function FitnessDash({ userId, records, acts, today }: { userId: string; records: LifeRecord[]; acts: LifeAct[]; today: string }) {
  const s = bodySpace(records, acts, today);
  const days = Array.from({ length: 7 }, (_, i) => dayBefore(today, 6 - i));
  const active = acts.filter((a) => ["moderate", "vigorous", "strength"].includes(a.kind));
  const perDay = days.map((d) => active.filter((a) => a.day === d).reduce((n, a) => n + (a.kind === "vigorous" ? 2 : 1) * (a.minutes ?? 0), 0));
  const recent = [...active].sort((a, b) => b.day.localeCompare(a.day)).slice(0, 5);
  const KIND: Record<string, string> = { moderate: "Moderate", vigorous: "Vigorous", strength: "Strength" };
  return (
    <div className="grid gap-6">
      <Hero>
        <div className="flex flex-wrap items-center gap-6">
          <Ring value={s.week.minutes / 150} size={120} stroke={11} label={`${s.week.minutes} of 150 minutes`}>
            <Ring value={s.week.strengthDays / 2} size={84} stroke={9} label={`${s.week.strengthDays} of 2 strength days`} />
          </Ring>
          <div className="grid flex-1 gap-1">
            <span className="text-muted-foreground text-sm">The last seven days</span>
            <span className="text-3xl font-bold tracking-tight sm:text-4xl">{s.week.minutes} <span className="text-muted-foreground text-xl font-medium">of 150 min</span></span>
            <span className="text-muted-foreground">{s.week.strengthDays} of 2 strength days{s.week.met ? ". The guidelines are met." : ""}</span>
          </div>
          <QuickLog title="Log a session" action={logFitnessAction} trigger={<><PlusIcon />Log</>} choices={[
            { id: "moderate", label: "Walk, easy ride, swim", amounts: MINUTES },
            { id: "vigorous", label: "Run, hard ride, sport", amounts: MINUTES },
            { id: "strength", label: "Strength", amounts: MINUTES.slice(0, 4) },
          ]} />
        </div>
        <div className="grid gap-1">
          <Bars values={perDay.map((m) => m || null)} max={Math.max(60, ...perDay)} labels={days.map((d, i) => `${shortDay(d)}: ${perDay[i]} min`)} className="h-12" />
          <span className="text-muted-foreground flex justify-between text-xs">{days.map((d) => <span key={d} className={cn("flex-1 text-center", d === today && "text-foreground font-semibold")}>{weekday(d)}</span>)}</span>
        </div>
      </Hero>

      <div className="grid gap-4 sm:grid-cols-2">
        <DashCard href={ask("Plan my week of exercise around my calendar: 150 minutes and two strength days. Put the sessions on my calendar.")} title="Next session" value="Plan my week with Reflect" sub="Sessions fit around what is already on your calendar">
          <CalendarPlusIcon className="text-primary size-5" />
        </DashCard>
        <DashCard href="/log" title="Sessions" value={recent.length ? `${recent.length} recently` : "None yet"} sub={recent.length ? undefined : "Log one with the Log button"}>
          {recent.length ? (
            <ul className="grid gap-1.5 text-sm">
              {recent.map((a, i) => (
                <li key={i} className="flex items-center gap-2">
                  {a.kind === "strength" ? <DumbbellIcon className="text-muted-foreground size-4" /> : <HeartPulseIcon className="text-muted-foreground size-4" />}
                  <span className="flex-1">{KIND[a.kind]}</span>
                  <span className="text-muted-foreground tabular-nums">{a.minutes ?? 0} min · {shortDay(a.day)}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </DashCard>
      </div>

      <section className="grid gap-3">
        <DashHead title="Goals"><Link href="/life/body?k=fitness&all=1" className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm"><PlusIcon className="size-4" />Set a goal</Link></DashHead>
        {s.goals.length ? (
          <ul className="grid gap-4 sm:grid-cols-3">
            {s.goals.map((g) => (
              <li key={g.id}>
                <DashCard href={`/life/body/${g.id}`} title={g.by ? `By ${shortDay(g.by)}` : "Under way"} value={g.goal || "A goal"} sub={`${g.minutes} minutes in four weeks${g.when ? `, ${g.when.toLowerCase()}` : ""}`} className="h-full" />
              </li>
            ))}
          </ul>
        ) : <p className="text-muted-foreground text-sm">Beyond the guidelines: run a 5K, squat your bodyweight. <Link href={ask("Help me set a fitness goal I can keep.")} className="text-primary">Ask Reflect</Link></p>}
      </section>
      <Upcoming userId={userId} tile="body" today={today} hideEmpty title="Coming up" />
    </div>
  );
}

/**
 * Friends (doc "Tile designs"): who is due for time together first, as faces with a way to log time or a call and to
 * plan the next; then everyone as faces ringed by how much of the wanted time has passed; then groups.
 */
export async function FriendsDash({ userId, records, acts, today }: { userId: string; records: LifeRecord[]; acts: LifeAct[]; today: string }) {
  const s = friendsSpace(records, acts, today);
  const EVERY: Record<string, number> = { "Every week": 7, "Every 2 weeks": 14, "Every month": 30, "Every 3 months": 91, "Every 6 months": 182, "Every year": 365 };
  const left = (f: (typeof s.close)[number]) => { const n = f.every ? EVERY[f.every] : 30; return f.since === null ? 0 : Math.max(0, 1 - f.since / (n ?? 30)); };
  const due = s.close.filter((f) => f.overdue).slice(0, 4);
  const lead = due.length ? due : s.close.slice(0, 4);
  const sinceWords = (d: number | null) => (d === null ? "Not yet" : d < 1 ? "Today" : d < 14 ? `${d} days` : d < 60 ? `${Math.round(d / 7)} weeks` : `${Math.round(d / 30)} months`);
  return (
    <div className="grid gap-8">
      <Hero>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="grid gap-0.5">
            <h2 className="text-2xl font-bold tracking-tight">{due.length ? "Due to see" : s.close.length ? "Your friends" : "Who do you want to see more of?"}</h2>
            <span className="text-muted-foreground text-sm">{due.length ? `${due.length} past how often you mean to see them` : s.close.length ? "Everyone is within how often you mean to see them" : "Add the friends you mean to keep up with"}</span>
          </div>
          <Button asChild><Link href={ask("Help me plan time with my friends this week, and put it on my calendar.")}><SparklesIcon />Plan time together</Link></Button>
        </div>
        {lead.length ? (
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {lead.map((f) => (
              <li key={f.id} className="grid justify-items-center gap-2 text-center">
                <Link href={`/life/friends/${f.id}`} className="grid justify-items-center gap-1.5">
                  <Face name={f.name} size={76} ring={left(f)} />
                  <span className="max-w-[9rem] truncate font-medium">{f.name}</span>
                  <span className={cn("text-xs", f.overdue ? "text-destructive font-medium" : "text-muted-foreground")}>{sinceWords(f.since)}{f.since !== null ? " since" : ""}</span>
                </Link>
                <span className="flex gap-1">
                  <QuickLog title={`Time with ${f.name}`} variant="outline" action={logFriendAction.bind(null, f.id)} trigger={<UsersIcon />} choices={[
                    { id: "saw", label: "We met", amounts: [30, 60, 120, 180].map((v) => ({ value: v, label: v < 60 ? `${v} min` : `${v / 60} h` })) },
                    { id: "called", label: "We talked" },
                  ]} />
                  <Button asChild variant="outline" size="icon" aria-label={`Plan time with ${f.name}`}><Link href={ask(`Plan time with ${f.name} and put it on my calendar.`)}><CalendarPlusIcon /></Link></Button>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <Button asChild variant="outline" className="justify-self-start"><Link href="/life/friends?k=friend"><PlusIcon />Add a friend</Link></Button>
        )}
      </Hero>

      {s.close.length + s.others.length > lead.length ? (
        <section className="grid gap-3">
          <DashHead title="Everyone"><Link href="/life/friends?k=friend" className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm"><PlusIcon className="size-4" />Add</Link></DashHead>
          <ul className="grid grid-cols-4 gap-x-2 gap-y-4 sm:grid-cols-6 lg:grid-cols-8">
            {[...s.close, ...s.others].slice(0, 48).map((f) => (
              <li key={f.id}>
                <Link href={`/life/friends/${f.id}`} className="hover:bg-accent grid justify-items-center gap-1 rounded-xl p-1.5 text-center transition">
                  <Face name={f.name} size={52} ring={f.active ? left(f) : undefined} />
                  <span className="w-full truncate text-xs font-medium">{f.name}</span>
                </Link>
              </li>
            ))}
          </ul>
          {s.close.length + s.others.length > 48 ? <Link href="/life/friends?k=friend" className="text-muted-foreground text-sm">See all {s.close.length + s.others.length}</Link> : null}
        </section>
      ) : null}

      <section className="grid gap-3">
        <DashHead title="Groups"><Link href="/life/friends?k=group" className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm"><PlusIcon className="size-4" />Add</Link></DashHead>
        {s.groups.length ? (
          <ul className="grid gap-4 sm:grid-cols-3">
            {s.groups.map((g) => <li key={g.id}><DashCard href={`/life/friends/${g.id}`} title={g.state ?? "Group"} value={g.name} sub={g.last ? `Last went ${shortDay(g.last)}` : "Not attended yet"} className="h-full" /></li>)}
          </ul>
        ) : <p className="text-muted-foreground text-sm">Teams, clubs, a congregation. <Link href="/life/friends?k=group" className="text-primary">Add a group</Link></p>}
      </section>

      <section className="grid gap-3">
        <DashHead title="Host something" />
        <div className="flex flex-wrap gap-2">
          {["Host a game night", "Plan a dinner with friends", "Find a league to join"].map((q) => (
            <Link key={q} href={ask(q)} className="hover:bg-accent flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition"><MessageCircleIcon className="size-3.5" />{q}</Link>
          ))}
        </div>
      </section>
      <Upcoming userId={userId} tile="friends" today={today} hideEmpty title="Coming up" />
    </div>
  );
}
