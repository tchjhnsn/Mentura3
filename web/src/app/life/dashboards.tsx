import Link from "next/link";
import { CalendarPlusIcon, DumbbellIcon, HeartPulseIcon, MessageCircleIcon, PlusIcon, SparklesIcon, UsersIcon } from "lucide-react";
import { bodySpace } from "@reflect/core/body";
import { childrenOf, friendsSpace, kinSpace, legacySpace, mateSpace, polisSpace } from "@reflect/core/tile-spaces";
import { lifeRecords, type LifeAct, type LifeRecord } from "@/server/life-store";
import { householdOf } from "@/server/household-store";
import { Bars, DashCard, DashHead, Face, Hero, Ring } from "@/components/dash";
import { QuickLog } from "@/components/quick-log";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { logFitnessAction, logFriendAction, logHealthAction, logTimeAction } from "./dash-actions";
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
    <div className="grid grid-cols-1 gap-8">
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

const daysTo = (day: string, today: string) => Math.round((Date.parse(`${day}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / DAY);
const CARER: Record<string, string> = { me: "you", family: "family", "paid-help": "paid help", "given-by-church-or-charity": "a church or charity", "no-one-yet": "no one yet" };

/**
 * Kin (doc "Tile designs"): the family as faces, those who need care first; the care circle as cards (who provides
 * care, the hours you gave, the last visit); what each wants, answered in their words; and Kin's calendar.
 */
export async function KinDash({ userId, records, acts, today }: { userId: string; records: LifeRecord[]; acts: LifeAct[]; today: string }) {
  const s = kinSpace(records, acts, today);
  const all = [...s.care, ...s.others];
  const answered = all.reduce((n, k) => n + [k.matters, k.speaks, k.where].filter(Boolean).length, 0);
  return (
    <div className="grid grid-cols-1 gap-8">
      <Hero>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="grid gap-0.5">
            <h2 className="text-2xl font-bold tracking-tight">{all.length ? `${all.length} in your family` : "Who is your family?"}</h2>
            <span className="text-muted-foreground text-sm">{s.care.length ? `${s.care.length} ${s.care.length === 1 ? "needs" : "need"} care. You gave ${s.careHours} hours a week over four weeks.` : all.length ? "No one needs care now." : "Parents, children, grandparents: kept so a plan is made before any need starts."}</span>
          </div>
          <Button asChild><Link href="/life/kin?k=relative"><PlusIcon />Add someone</Link></Button>
        </div>
        {all.length ? (
          <ul className="flex flex-wrap gap-4">
            {all.slice(0, 12).map((k) => (
              <li key={k.id}>
                <Link href={`/life/kin/${k.id}`} className="grid w-20 justify-items-center gap-1 text-center">
                  <Face name={k.name} size={64} ring={k.needsCare ? 1 : undefined} />
                  <span className="w-full truncate text-sm font-medium">{k.name}</span>
                  <span className="text-muted-foreground w-full truncate text-xs">{k.needsCare ? "Needs care" : k.relation ?? (k.age !== null ? `${k.age}` : "")}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </Hero>
      {s.care.length ? (
        <section className="grid gap-3">
          <DashHead title="Care circle" />
          <ul className="grid gap-4 sm:grid-cols-2">
            {s.care.map((k) => (
              <li key={k.id}>
                <DashCard href={`/life/kin/${k.id}`} title={k.relation ?? "Kin"} value={k.name} sub={`${k.carer ? `Care by ${CARER[k.carer] ?? k.carer}` : "Who provides care is not said"} · ${k.careMinutes ? `${Math.round(k.careMinutes / 6) / 10} hours given in four weeks` : "no care logged"} · ${k.visited ? `visited ${shortDay(k.visited)}` : "no visit kept"}`} className="h-full">
                  <Face name={k.name} size={40} />
                </DashCard>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {all.length ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <DashCard href={`/life/kin/${all[0]!.id}`} title="What they want" value={`${answered} of ${all.length * 3} answered`} sub="What matters most, who speaks for them, where they want care (The Conversation Project)">
            <Bars values={all.slice(0, 12).map((k) => [k.matters, k.speaks, k.where].filter(Boolean).length)} max={3} className="h-8" />
          </DashCard>
          <DashCard href="/life/work/season" title="What Kin asks of Work" value={s.careHours ? `${s.careHours} hours a week of care` : "No care logged"} sub="Time that work cannot use" />
        </div>
      ) : null}
      <Upcoming userId={userId} tile="kin" today={today} hideEmpty title="Coming up" />
    </div>
  );
}

/**
 * Mate (doc "Tile designs"): the next date first, with who and where; what the person is looking for, in their words,
 * private; the dates planned as faces; and the dates gone on, counted against their must-haves.
 */
export async function MateDash({ userId, records, today }: { userId: string; records: LifeRecord[]; today: string }) {
  const s = mateSpace(records, today);
  const next = s.planned[0];
  return (
    <div className="grid grid-cols-1 gap-8">
      <Hero>
        <div className="flex flex-wrap items-center gap-5">
          {next ? <Face name={next.who} size={80} /> : null}
          <div className="grid min-w-0 flex-1 basis-48 gap-1">
            <span className="text-muted-foreground text-sm">{next ? (next.day ? (daysTo(next.day, today) === 0 ? "Next date, today" : `Next date, in ${daysTo(next.day, today)} days`) : "Next date") : s.seeking?.state ?? "Mate"}</span>
            <span className="text-3xl font-bold tracking-tight">{next ? next.who : "Plan time together"}</span>
            <span className="text-muted-foreground text-sm">{next ? [next.day ? shortDay(next.day) : null, next.where].filter(Boolean).join(" · ") || "Day not set" : "A date night, a walk, a dance class. Reflect puts it on your calendar."}</span>
          </div>
          <Button asChild><Link href={ask(next ? `Help me plan my date with ${next.who}.` : "Help me plan a date and put it on my calendar.")}><SparklesIcon />Plan a date</Link></Button>
        </div>
      </Hero>
      <div className="grid gap-4 sm:grid-cols-2">
        <DashCard href="/life/mate?k=seeking" title="What you are looking for" value={s.seeking?.state ?? "Not written"} sub={s.seeking?.must ? `Must-haves: ${s.seeking.must.split("\n")[0]}` : "Your must-haves and dealbreakers, private to you"} />
        <DashCard href="/life/mate?k=date" title="Dates you went on" value={s.tally.of ? `${s.tally.of} ${s.tally.of === 1 ? "date" : "dates"}` : "None kept yet"} sub={s.tally.of ? `${s.tally.all} met all your must-haves, ${s.tally.some} some. A dealbreaker came up on ${s.tally.dealbreakers}.` : "What you learned from each"}>
          {s.tally.of ? <Bars values={[s.tally.all, s.tally.some, s.tally.none]} labels={["Met all", "Met some", "Met none"]} className="h-10 max-w-32" /> : null}
        </DashCard>
      </div>
      {s.planned.length > 1 || s.went.length ? (
        <section className="grid gap-3">
          <DashHead title="Dates"><Link href="/life/mate?k=date" className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm"><PlusIcon className="size-4" />Add</Link></DashHead>
          <ul className="flex flex-wrap gap-4">
            {[...s.planned, ...s.went.slice(0, 8)].map((d) => (
              <li key={d.id}>
                <Link href={`/life/mate/${d.id}`} className="grid w-20 justify-items-center gap-1 text-center">
                  <Face name={d.who} size={56} ring={d.state === "planned" ? 1 : undefined} />
                  <span className="w-full truncate text-sm font-medium">{d.who}</span>
                  <span className="text-muted-foreground text-xs">{d.day ? shortDay(d.day) : d.state === "planned" ? "Planned" : "Went"}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      <Upcoming userId={userId} tile="mate" today={today} hideEmpty title="Coming up" />
    </div>
  );
}

/**
 * Polis (doc "Tile designs"): the next election with the days to go and your plan to vote; registration; duties due
 * (jury service, taxes); where you serve.
 */
export async function PolisDash({ userId, records, today }: { userId: string; records: LifeRecord[]; today: string }) {
  const s = polisSpace(records, today);
  const next = s.elections.find((e) => !e.late);
  const duty = s.duties[0];
  return (
    <div className="grid grid-cols-1 gap-8">
      <Hero>
        <div className="flex flex-wrap items-center gap-5">
          {next?.day ? (
            <span className="bg-primary/10 grid size-20 place-items-center rounded-2xl text-center">
              <span className="text-3xl leading-none font-bold">{daysTo(next.day, today)}</span>
              <span className="text-muted-foreground -mt-3 text-xs">days</span>
            </span>
          ) : null}
          <div className="grid min-w-0 flex-1 basis-48 gap-1">
            <span className="text-muted-foreground text-sm">{next ? "Next election" : "Elections"}</span>
            <span className="text-2xl font-bold tracking-tight sm:text-3xl">{next ? next.name || "An election" : "No election kept"}</span>
            <span className="text-muted-foreground text-sm">{next ? (next.plan ? [next.plan.how, next.plan.when ? `on ${next.plan.when}` : null, next.plan.place ? `at ${next.plan.place}` : null].filter(Boolean).join(" ") : "No plan to vote yet") : "Add the elections where you vote"}</span>
          </div>
          <Button asChild><Link href={next ? `/life/polis/${next.id}` : "/life/polis?k=election"}>{next ? "Plan my vote" : <><PlusIcon />Add an election</>}</Link></Button>
        </div>
      </Hero>
      <div className="grid gap-4 sm:grid-cols-3">
        <DashCard href="/life/polis?k=civic" title="Registered to vote" value={s.civic ? (s.civic.registered ? "Yes" : "Not yet") : "Not said"} tone={s.civic && !s.civic.registered ? "warn" : undefined} sub={s.civic?.residence ?? "Where you live and vote"} />
        <DashCard href={duty ? `/life/polis/${duty.id}` : "/life/polis?k=duty"} title="Duties due" value={duty ? duty.name || "A duty" : "Nothing due"} tone={duty?.late ? "warn" : undefined} sub={duty ? `${duty.day ? (duty.late ? `Was due ${shortDay(duty.day)}` : `Due ${shortDay(duty.day)}`) : "No date"}${s.duties.length > 1 ? `, and ${s.duties.length - 1} more` : ""}` : "Jury service, taxes, licenses"} />
        <DashCard href="/life/polis?k=standing" title="Where you serve" value={s.serving.length ? s.serving[0]!.role : "No role kept"} sub={s.serving.length ? [s.serving[0]!.where, s.serving.length > 1 ? `and ${s.serving.length - 1} more` : null].filter(Boolean).join(", ") : "Offices and roles you are trusted with"} />
      </div>
      {s.elections.length > 1 ? (
        <section className="grid gap-3">
          <DashHead title="Elections" href="/life/polis?k=election" />
          <ul className="grid gap-4 sm:grid-cols-3">
            {s.elections.map((e) => <li key={e.id}><DashCard href={`/life/polis/${e.id}`} title={e.day ? (e.late ? `${shortDay(e.day)}, passed` : shortDay(e.day)) : "Day not given"} value={e.name || "An election"} sub={e.plan ? "Plan made" : "No plan yet"} className="h-full" /></li>)}
          </ul>
        </section>
      ) : null}
      <Upcoming userId={userId} tile="polis" today={today} hideEmpty title="Coming up" />
    </div>
  );
}

const hoursOf = (min: number) => (min < 60 ? `${min} min` : `${Math.round((min / 60) * 10) / 10} h`);
const minutesSince = (acts: LifeAct[], id: string, since: string) => acts.filter((a) => a.record === id && a.day >= since).reduce((n, a) => n + (a.minutes ?? 0), 0);
const TIME = [30, 60, 90, 120, 180, 240, 360, 480].map((v) => ({ value: v, label: hoursOf(v) }));
const money = (n: number) => `${n < 0 ? "−" : ""}$${Math.abs(Math.round(n)).toLocaleString("en-US")}`;

/**
 * Standing (doc "Tile designs"): the roles you serve in, the hours given this month against last, then a card per
 * role. Log service is the one filled act; a role that ended stays below, as honor kept.
 */
export async function StandingDash({ userId, records, acts, today }: { userId: string; records: LifeRecord[]; acts: LifeAct[]; today: string }) {
  const roles = records.filter((r) => r.kind === "standing");
  const serving = roles.filter((r) => r.state !== "ended");
  const ended = roles.filter((r) => r.state === "ended");
  const month = dayBefore(today, 29), before = dayBefore(today, 59);
  const now = serving.reduce((n, r) => n + minutesSince(acts, r.id, month), 0);
  const last = serving.reduce((n, r) => n + acts.filter((a) => a.record === r.id && a.day >= before && a.day < month).reduce((m, a) => m + (a.minutes ?? 0), 0), 0);
  const weeks = Array.from({ length: 8 }, (_, i) => { const from = dayBefore(today, 7 * (8 - i) - 1), to = dayBefore(today, 7 * (7 - i)); return acts.filter((a) => roles.some((r) => r.id === a.record) && a.day >= from && a.day <= to).reduce((n, a) => n + (a.minutes ?? 0), 0) / 60; });
  const name = (r: LifeRecord) => String(r.body.role || "A role");
  return (
    <div className="grid grid-cols-1 gap-8">
      <Hero>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="grid gap-0.5">
            <span className="text-muted-foreground text-sm">{serving.length ? `Serving in ${serving.length} ${serving.length === 1 ? "role" : "roles"}` : "Standing"}</span>
            <span className="text-3xl font-bold tracking-tight">{serving.length ? (now ? `${hoursOf(now)} this month` : serving.length === 1 ? String(serving[0]!.body.role || "A role") : "No time logged this month") : "Where are you trusted to serve?"}</span>
            <span className="text-muted-foreground text-sm">{serving.length ? (last ? `${hoursOf(last)} the month before` : "Log the time you give to see it over the weeks") : "Offices, boards, a congregation, a team you coach"}</span>
          </div>
          {serving.length ? (
            <QuickLog title="Log service" action={logTimeAction.bind(null, "polis")} trigger={<><PlusIcon />Log service</>} choices={serving.map((r) => ({ id: r.id, label: name(r), amounts: TIME }))} />
          ) : <Button asChild><Link href="/life/polis?k=standing&all=1"><PlusIcon />Add a role</Link></Button>}
        </div>
        {weeks.some((h) => h > 0) ? <Bars values={weeks} labels={weeks.map((h, i) => `${8 - i} weeks ago: ${Math.round(h * 10) / 10} h`)} /> : null}
      </Hero>
      {serving.length ? (
        <section className="grid gap-3">
          <DashHead title="Where you serve"><Link href="/life/polis?k=standing&all=1" className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm"><PlusIcon className="size-4" />Add</Link></DashHead>
          <ul className="grid gap-4 sm:grid-cols-3">
            {serving.map((r) => <li key={r.id}><DashCard href={`/life/polis/${r.id}`} title={String(r.body.body || "Where not said")} value={name(r)} sub={[typeof r.body.since === "string" && r.body.since ? `Since ${shortDay(r.body.since)} ${r.body.since.slice(0, 4)}` : null, `${hoursOf(minutesSince(acts, r.id, dayBefore(today, 364)))} this year`].filter(Boolean).join(", ")} className="h-full" /></li>)}
          </ul>
        </section>
      ) : null}
      <section className="grid gap-3">
        <DashHead title="Find a way to serve" />
        <div className="flex flex-wrap gap-2">
          {["Find a board or commission I could serve on", "Find volunteer work near me that fits my skills", "What offices are up for election where I live?"].map((q) => (
            <Link key={q} href={ask(q)} className="hover:bg-accent flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition"><MessageCircleIcon className="size-3.5" />{q}</Link>
          ))}
        </div>
      </section>
      {ended.length ? (
        <section className="grid gap-3">
          <DashHead title="Served before" />
          <ul className="grid gap-4 sm:grid-cols-3">
            {ended.map((r) => <li key={r.id}><DashCard href={`/life/polis/${r.id}`} title={String(r.body.body || "Where not said")} value={name(r)} sub="Ended" className="h-full" /></li>)}
          </ul>
        </section>
      ) : null}
      <Upcoming userId={userId} tile="polis" today={today} hideEmpty title="Coming up" />
    </div>
  );
}

const STAGE: Record<string, string> = { idea: "An idea", starting: "Starting", operating: "Operating", paused: "Paused", closed: "Closed" };

/**
 * Ventures (doc "Tile designs"): what operating ventures bring in after costs, the year's profit as the figure that
 * feeds the income plan; then a card per venture with its month and stage, and ideas apart. Log time is the filled act.
 */
export async function VenturesDash({ userId, records, acts, today }: { userId: string; records: LifeRecord[]; acts: LifeAct[]; today: string }) {
  const all = records.filter((r) => r.kind === "venture");
  const live = all.filter((r) => r.state === "operating" || r.state === "starting");
  const rest = all.filter((r) => !live.includes(r));
  const num = (v: unknown) => (typeof v === "number" ? v : 0);
  const operating = all.filter((r) => r.state === "operating");
  const rev = operating.reduce((n, r) => n + num(r.body.revenue), 0), cost = operating.reduce((n, r) => n + num(r.body.costs), 0);
  const month = dayBefore(today, 29);
  const time = live.reduce((n, r) => n + minutesSince(acts, r.id, month), 0);
  const name = (r: LifeRecord) => String(r.body.name || "A venture");
  return (
    <div className="grid grid-cols-1 gap-8">
      <Hero>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="grid gap-0.5">
            <span className="text-muted-foreground text-sm">{operating.length ? "Profit a year, after costs" : "Ventures"}</span>
            <span className={cn("text-3xl font-bold tracking-tight", operating.length && rev - cost < 0 && "text-destructive")}>{operating.length ? money((rev - cost) * 12) : all.length ? "Nothing operating yet" : "Do you have a business of your own?"}</span>
            <span className="text-muted-foreground text-sm">{operating.length ? `${money(rev)} in, ${money(cost)} out a month${time ? `, ${hoursOf(time)} given this month` : ""}` : "A store, a practice, a side business. What it brings in counts in your income plan."}</span>
          </div>
          {live.length ? (
            <QuickLog title="Log time" action={logTimeAction.bind(null, "ventures")} trigger={<><PlusIcon />Log time</>} choices={live.map((r) => ({ id: r.id, label: name(r), amounts: TIME }))} />
          ) : <Button asChild><Link href="/life/ventures?k=venture"><PlusIcon />Add a venture</Link></Button>}
        </div>
        {operating.length > 1 ? (
          <div className="grid gap-1.5">
            <span className="bg-muted flex h-3 overflow-hidden rounded-full">
              {operating.map((r, i) => <span key={r.id} className={i % 2 ? "bg-primary/50" : "bg-primary"} style={{ width: `${rev ? (num(r.body.revenue) / rev) * 100 : 0}%` }} title={`${name(r)}: ${money(num(r.body.revenue))} a month`} />)}
            </span>
            <span className="text-muted-foreground text-xs">What each brings in a month</span>
          </div>
        ) : null}
      </Hero>
      {live.length ? (
        <section className="grid gap-3">
          <DashHead title="Your ventures"><Link href="/life/ventures?k=venture" className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm"><PlusIcon className="size-4" />Add</Link></DashHead>
          <ul className="grid gap-4 sm:grid-cols-3">
            {live.map((r) => {
              const net = num(r.body.revenue) - num(r.body.costs);
              return <li key={r.id}><DashCard href={`/life/ventures/${r.id}`} title={[STAGE[r.state ?? ""] ?? "Venture", typeof r.body.where === "string" ? r.body.where : null].filter(Boolean).join(" · ")} value={name(r)} tone={r.state === "operating" && net < 0 ? "warn" : undefined} sub={r.state === "operating" ? `${money(net)} a month after costs` : String(r.body.what || "What it sells not said")} className="h-full" /></li>;
            })}
          </ul>
        </section>
      ) : null}
      {rest.length ? (
        <section className="grid gap-3">
          <DashHead title="Ideas and paused" />
          <ul className="grid gap-4 sm:grid-cols-3">
            {rest.map((r) => <li key={r.id}><DashCard href={`/life/ventures/${r.id}`} title={STAGE[r.state ?? ""] ?? "Venture"} value={name(r)} sub={String(r.body.what || "")} className="h-full" /></li>)}
          </ul>
        </section>
      ) : null}
      <section className="grid gap-3">
        <DashHead title="Ask Reflect" />
        <div className="flex flex-wrap gap-2">
          {["What would it take to turn my idea into a business?", "How do I set aside taxes for my side business?", ...(all.length ? ["Which of my ventures is worth the time I give it?"] : [])].map((q) => (
            <Link key={q} href={ask(q)} className="hover:bg-accent flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition"><MessageCircleIcon className="size-3.5" />{q}</Link>
          ))}
        </div>
      </section>
      <Upcoming userId={userId} tile="ventures" today={today} hideEmpty title="Coming up" />
    </div>
  );
}

const DOC_STATE = { "in-place": "In place", "not-yet": "Not yet", review: "Review due" } as const;
const addPlan = (id: string) => `/life/legacy?k=plan&name=${id}`;

/**
 * Legacy (estate planning, after Trust & Will, Everplans and the ABA and Nolo checklists): how many of the core
 * documents are in place as a ring, the first one missing and one filled act (Add, Ask Reflect or Review); a card per
 * document with who is named and where it is kept; other plans; what survives you (vaults, bucket list, letters).
 */
export async function LegacyDash({ userId, records, acts, today }: { userId: string; records: LifeRecord[]; acts: LifeAct[]; today: string }) {
  const [kin, home] = await Promise.all([lifeRecords(userId, "kin"), householdOf(userId).catch(() => null)]);
  const s = legacySpace(records, acts, today, childrenOf(kin, (home?.members ?? []).filter((m) => !m.you), today));
  const core = s.docs.filter((d) => d.core), optional = s.docs.filter((d) => !d.core);
  const act = !s.kept
    ? <Button asChild><Link href={addPlan("will")}><PlusIcon />Add</Link></Button>
    : s.next
      ? <Button asChild><Link href={ask(`Help me put my ${s.next.label.toLowerCase()} in place: what it is, what I need to decide, and who can help me make it.`)}><SparklesIcon />Ask Reflect</Link></Button>
      : s.due
        ? <Button asChild><Link href={`/life/legacy/${s.due.record}`}>Review</Link></Button>
        : <Button asChild><Link href={ask("Walk me through reviewing my estate plan: my will, power of attorney, advance directive, beneficiaries and life insurance.")}><SparklesIcon />Ask Reflect</Link></Button>;
  const card = (d: (typeof s.docs)[number]) => (
    <li key={d.id}>
      <DashCard href={d.record ? `/life/legacy/${d.record}` : addPlan(d.id)} title={d.label} value={DOC_STATE[d.status]} tone={d.status === "review" ? "warn" : d.status === "in-place" ? "good" : undefined} className="h-full"
        sub={d.status === "not-yet" ? (d.core ? d.what : "Only needed for children under 18") : [d.review, d.who ? `Names ${d.who}` : "No one named", d.where ? `Kept: ${d.where}` : "Where it is kept not said"].filter(Boolean).join(" · ")} />
    </li>
  );
  return (
    <div className="grid grid-cols-1 gap-8">
      <Hero>
        <div className="flex flex-wrap items-center gap-5">
          <Ring value={s.of ? s.done / s.of : 0} size={88} stroke={8} label={`${s.done} of ${s.of} core documents in place`}>
            <span className="text-xl font-bold">{s.done}<span className="text-muted-foreground text-sm font-medium">/{s.of}</span></span>
          </Ring>
          <div className="grid min-w-0 flex-1 basis-48 gap-1">
            <span className="text-muted-foreground text-sm">Estate plan</span>
            <span className="text-2xl font-bold tracking-tight sm:text-3xl">{!s.kept ? "Nothing kept yet" : s.done === s.of ? "All in place" : `${s.done} of ${s.of} in place`}</span>
            <span className="text-muted-foreground text-sm">{s.next ? `Missing first: ${s.next.label}. ${s.next.what}.` : s.due ? `${s.due.label}: ${s.due.review}.` : "Review it each year and after a marriage, a birth or a death."}</span>
          </div>
          {act}
        </div>
      </Hero>

      <section className="grid gap-3">
        <DashHead title="Documents"><Link href="/life/legacy?k=plan" className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm"><PlusIcon className="size-4" />Add</Link></DashHead>
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{[...core, ...optional].map(card)}</ul>
      </section>

      {s.others.length ? (
        <section className="grid gap-3">
          <DashHead title="Other plans" href="/life/legacy?k=plan" />
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {s.others.map((p) => <li key={p.id}><DashCard href={`/life/legacy/${p.id}`} title={p.inPlace ? "In place" : "Not yet"} value={p.who ?? "A plan"} sub={p.where ? `Kept: ${p.where}` : undefined} className="h-full" /></li>)}
          </ul>
        </section>
      ) : null}

      <section className="grid gap-3">
        <DashHead title="What survives you" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <DashCard href="/life/legacy?k=vault" title="My vaults" value={s.vault?.to ?? "Not named"} sub={s.vault ? "Receives your journal and records" : "Who receives your journal and records, or sealed"} />
          <DashCard href="/life/legacy?k=wish" title="Bucket list" value={s.wishes.open.length ? `${s.wishes.open.length} to do` : s.wishes.done ? "All done" : "Nothing kept"} sub={s.wishes.open.length ? [s.wishes.open[0]!.what, s.wishes.done ? `${s.wishes.done} done` : null].filter(Boolean).join(" · ") : "What you want to do, see or make"} />
          <DashCard href="/life/legacy?k=letter" title="Letters" value={s.letters.length ? `${s.letters.length} ${s.letters.length === 1 ? "letter" : "letters"}` : "None written"} sub={s.letters.length ? `To ${s.letters.slice(0, 3).map((l) => l.to).join(", ")}${s.letters.length > 3 ? ` and ${s.letters.length - 3} more` : ""}` : "Given after your death, never before"} />
        </div>
      </section>
      <Upcoming userId={userId} tile="legacy" today={today} hideEmpty title="Coming up" />
    </div>
  );
}
