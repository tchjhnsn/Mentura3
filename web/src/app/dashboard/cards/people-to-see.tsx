import Link from "next/link";
import type { ReactNode } from "react";
import { MessageCircleIcon } from "lucide-react";
import { addDays } from "@reflect/core/calendar";
import { friendsSpace } from "@reflect/core/tile-spaces";
import { Face } from "@/components/dash";
import { Button } from "@/components/ui/button";
import { calendarPart } from "@/server/calendar-tools";
import { lifeActs, lifeRecords } from "@/server/life-store";
import { contactsOf } from "@/server/messages-store";
import { safe, Section, type Ctx } from "../parts";
import { birthdaysAhead, inDaysWords, quietFriends, sinceWords } from "../world";

const EVERY: Record<string, number> = { "Every week": 7, "Every 2 weeks": 14, "Every month": 30, "Every 3 months": 91, "Every 6 months": 182, "Every year": 365 };
const ask = (q: string) => `/chat?q=${encodeURIComponent(q)}`;

const Row = ({ name, face, href, line, to, warn }: { name: string; face: ReactNode; href: string; line: string; to: string; warn?: boolean }) => (
  <li className="flex items-center gap-3">
    <Link href={href} className="hover:bg-accent flex min-w-0 flex-1 items-center gap-3 rounded-xl px-2 py-1.5">
      {face}
      <span className="grid min-w-0"><span className="truncate font-medium">{name}</span><span className={warn ? "text-destructive text-sm" : "text-muted-foreground text-sm"}>{line}</span></span>
    </Link>
    <Button asChild variant="ghost" size="icon" aria-label={`Message ${name}`}><Link href={to}><MessageCircleIcon /></Link></Button>
  </li>
);

/**
 * People to see: birthdays in the next 30 days (the calendar holds Kin's birthdays and any birthday events from the
 * calendars the person syncs; Friends keep no birthday) and friends not seen in a while, as faces. Each has a way to
 * message them: in Reflect when they are a contact, otherwise Ask Reflect helps write to them.
 */
export async function PeopleToSeeCard({ ctx }: { ctx: Ctx }) {
  const [cal, records, allActs, contacts] = await Promise.all([
    safe(calendarPart(ctx.userId, ctx.today, addDays(ctx.today, 30)), null),
    safe(lifeRecords(ctx.userId, "friends"), []),
    safe(lifeActs(ctx.userId), []),
    safe(contactsOf(ctx.userId), []),
  ]);
  const birthdays = birthdaysAhead(cal?.events ?? [], ctx.today).slice(0, 4);
  const ids = new Set(records.map((r) => r.id));
  const quiet = quietFriends(friendsSpace(records, allActs.filter((a) => ids.has(a.record)), ctx.today).close);
  if (!birthdays.length && !quiet.length) return null;

  const contact = (name: string) => contacts.find((c) => c.name.trim().toLowerCase() === name.trim().toLowerCase()) ?? null;
  const message = (name: string, why: string) => {
    const c = contact(name);
    return c ? `/life/friends/messages/${encodeURIComponent(c.id)}` : ask(`Help me write to ${name}${why}.`);
  };
  const left = (f: (typeof quiet)[number]) => { const n = f.every ? EVERY[f.every] ?? 30 : 30; return f.since === null ? 0 : Math.max(0, 1 - f.since / n); };

  return (
    <Section title="People to see" href="/life/friends" more="Friends">
      <ul className="grid grid-cols-[minmax(0,1fr)] gap-1">
        {birthdays.map((b) => (
          <Row key={`b-${b.name}`} name={b.name} face={<Face name={b.name} size={44} />} href={`/calendar?day=${b.day}`} line={`Birthday · ${inDaysWords(b.inDays)}`} to={message(b.name, " for their birthday")} />
        ))}
        {quiet.map((f) => (
          <Row key={f.id} name={f.name} face={<Face name={f.name} size={44} ring={left(f)} />} href={`/life/friends/${f.id}`} line={f.since === null ? "No time together kept yet" : `Last seen ${sinceWords(f.since)} ago`} to={message(f.name, "")} warn={f.overdue} />
        ))}
      </ul>
    </Section>
  );
}
