import type { Metadata } from "next";
import Link from "next/link";
import { PlusIcon } from "lucide-react";
import { austinDay, dayLabel, timeLabel } from "@reflect/core/events";
import { endsAt, stateLine } from "@reflect/core/meetings";
import { MemberFace } from "@/components/dash";
import { PAGE, PageHeader } from "@/components/page-header";
import { Segmented } from "@/components/segmented";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { requireUser } from "@/server/session";
import { isGuestAccount, meetingsOf, type MeetingPerson, type MeetingRow } from "@/server/meetings-store";
import { newMeetingAction } from "./actions";

export const metadata: Metadata = { title: "Meetings" };
export const dynamic = "force-dynamic";
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

/** Austin's day `n` days from now. */
const dayFrom = (n: number, now: Date) => austinDay(new Date(now.getTime() + n * 86400_000).toISOString());
const upcoming = (m: MeetingRow) => m.state === "live" || m.state === "scheduled" || m.state === "draft";

/**
 * Meetings (design guide "Meetings list", 2026-11-19). Job: see what is next and start a new meeting. + New meeting is
 * the one filled button, until the next meeting is live: then its Join is the filled act. Below the next meeting,
 * the rest by Austin day; Past (?tab=past) lists the ended and cancelled ones, muted. A guest account sees only the
 * meetings it was invited to, and cannot start one.
 */
export default async function MeetingsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const past = one(sp.tab) === "past";
  const venture = one(sp.venture).trim().slice(0, 100);
  const now = new Date();
  const [all, guest] = await Promise.all([meetingsOf(user.id, now), isGuestAccount(user.id)]);
  const coming = all.filter(upcoming);
  const gone = all.filter((m) => !upcoming(m)).reverse();
  const next = coming.find((m) => m.startsAt) ?? null;
  const live = next?.state === "live";
  const rest = coming.filter((m) => m.id !== next?.id);
  const others = (m: MeetingRow) => m.people.filter((p) => p.id !== user.id);
  const canStart = !guest;

  return (
    <main className={PAGE}>
      {/* On a phone the header's right side wraps under the title, so the button sits beside the title there, shortened. */}
      <PageHeader title={<span className="flex items-center justify-between gap-2">Meetings{canStart ? <NewMeeting venture={venture} outline={live} short className="sm:hidden" /> : null}</span>}>
        {canStart ? <NewMeeting venture={venture} outline={live} className="hidden sm:block" /> : null}
      </PageHeader>

      {all.length ? (
        <div className="mt-2">
          <Segmented label="Meetings" items={[{ label: "Upcoming", href: "/meetings", on: !past }, { label: "Past", href: "/meetings?tab=past", on: past }]} />
        </div>
      ) : null}

      <div className="mt-6 grid max-w-3xl grid-cols-[minmax(0,1fr)] gap-8">
        {!all.length ? (
          <Empty canStart={canStart} venture={venture} />
        ) : past ? (
          gone.length ? (
            <ul className="grid">
              {gone.map((m) => <li key={m.id}><Row m={m} people={others(m)} muted withDay /></li>)}
            </ul>
          ) : <p className="text-muted-foreground text-sm">No past meetings yet.</p>
        ) : (
          <>
            {next ? <Hero m={next} people={others(next)} now={now} /> : null}
            {rest.length ? <Upcoming list={rest} now={now} others={others} /> : null}
            {!next && !rest.length ? <p className="text-muted-foreground text-sm">Nothing coming up.</p> : null}
          </>
        )}
      </div>
    </main>
  );
}

/** + New meeting: the page's one filled button, outlined while the next meeting is live. */
function NewMeeting({ venture, outline, short, className }: { venture: string; outline?: boolean; short?: boolean; className?: string }) {
  return (
    <form action={newMeetingAction} className={className}>
      {venture ? <input type="hidden" name="venture" value={venture} /> : null}
      <Button type="submit" variant={outline ? "outline" : "default"} size={short ? "sm" : "default"}><PlusIcon />{short ? "New" : "New meeting"}</Button>
    </form>
  );
}

/** The next meeting: its title large, when, who is in it, and Join, filled only while it is live. */
function Hero({ m, people, now }: { m: MeetingRow; people: MeetingPerson[]; now: Date }) {
  const live = m.state === "live";
  const end = endsAt(m);
  return (
    <section aria-labelledby="next" className={cn("grid gap-3 rounded-2xl border p-5", live && "border-primary")}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid min-w-0 gap-1">
          <span className="text-muted-foreground text-sm">{live ? stateLine(m, now) : "Next"}</span>
          <Link id="next" href={`/meetings/${m.id}`} className="truncate text-2xl font-bold tracking-tight hover:underline sm:text-3xl">{m.title}</Link>
          <span className="text-muted-foreground text-sm">{dayName(austinDay(m.startsAt!), now)}, {timeLabel(m.startsAt!)}{end ? ` to ${timeLabel(end)}` : ""}</span>
        </div>
        <Button asChild variant={live ? "default" : "outline"}><Link href={`/meetings/${m.id}/live`}>Join</Link></Button>
      </div>
      {people.length ? <Faces people={people} size={32} /> : null}
    </section>
  );
}

/** The meetings after the next one, by Austin day, then those with no time yet. */
function Upcoming({ list, now, others }: { list: MeetingRow[]; now: Date; others: (m: MeetingRow) => MeetingPerson[] }) {
  const days: { day: string; list: MeetingRow[] }[] = [];
  for (const m of list.filter((x) => x.startsAt)) {
    const day = austinDay(m.startsAt!);
    const last = days[days.length - 1];
    if (last?.day === day) last.list.push(m);
    else days.push({ day, list: [m] });
  }
  const untimed = list.filter((x) => !x.startsAt);
  return (
    <section aria-labelledby="upcoming" className="grid gap-4">
      <h2 id="upcoming" className="text-lg font-semibold">Upcoming</h2>
      {days.map((d) => (
        <div key={d.day} className="grid gap-1">
          <h3 className="text-muted-foreground text-sm font-medium">{dayName(d.day, now)}</h3>
          <ul className="grid">{d.list.map((m) => <li key={m.id}><Row m={m} people={others(m)} /></li>)}</ul>
        </div>
      ))}
      {untimed.length ? (
        <div className="grid gap-1">
          <h3 className="text-muted-foreground text-sm font-medium">No time yet</h3>
          <ul className="grid">{untimed.map((m) => <li key={m.id}><Row m={m} people={others(m)} /></li>)}</ul>
        </div>
      ) : null}
    </section>
  );
}

/** "Today", "Tomorrow", else "Mon Nov 30", in Austin. */
function dayName(day: string, now: Date): string {
  if (day === dayFrom(0, now)) return "Today";
  if (day === dayFrom(1, now)) return "Tomorrow";
  return dayLabel(day).replace(",", "");
}

/** One meeting in a list: the time, the title and who is in it. Past rows are muted and carry their day. */
function Row({ m, people, muted, withDay }: { m: MeetingRow; people: MeetingPerson[]; muted?: boolean; withDay?: boolean }) {
  const when = m.startsAt ? `${withDay ? `${dayLabel(austinDay(m.startsAt)).replace(",", "")}, ` : ""}${timeLabel(m.startsAt)}` : "Pick a time";
  return (
    <Link href={`/meetings/${m.id}`} className={cn("hover:bg-accent -mx-2 flex min-w-0 items-center gap-3 rounded-xl px-2 py-2 transition", muted && "text-muted-foreground")}>
      <span className={cn("w-24 shrink-0 text-sm tabular-nums", !muted && "text-muted-foreground", withDay && "w-32")}>{when}</span>
      <span className="grid min-w-0 flex-1 gap-1">
        <span className={cn("truncate font-medium", m.cancelled && "line-through")}>{m.title}</span>
        {people.length ? <Faces people={people} size={22} /> : null}
      </span>
      {m.cancelled ? <span className="shrink-0 text-xs">Cancelled</span> : m.state === "live" ? <span className="text-primary shrink-0 text-xs font-medium">Live now</span> : null}
    </Link>
  );
}

/** The people in a meeting as faces with their names beside them. */
function Faces({ people, size }: { people: MeetingPerson[]; size: number }) {
  const shown = people.slice(0, 4);
  const names = people.length <= 3 ? people.map((p) => p.name) : [...people.slice(0, 2).map((p) => p.name), `${people.length - 2} others`];
  const line = names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}` : names[0];
  return (
    <span className="flex min-w-0 items-center gap-2">
      <span className="flex shrink-0 -space-x-2">
        {shown.map((p) => <span key={p.id} className="ring-background rounded-full ring-2"><MemberFace name={p.name} image={p.image} size={size} /></span>)}
      </span>
      <span className="text-muted-foreground truncate text-sm">{line}</span>
    </span>
  );
}

function Empty({ canStart, venture }: { canStart: boolean; venture: string }) {
  return (
    <div className="grid justify-items-start gap-2 rounded-xl border border-dashed p-6">
      <p className="font-medium">No meetings yet</p>
      {canStart ? (
        <>
          <p className="text-muted-foreground text-sm">Start one from a venture</p>
          <NewMeeting venture={venture} className="mt-2" />
        </>
      ) : <p className="text-muted-foreground text-sm">Meetings you are invited to show here.</p>}
    </div>
  );
}
