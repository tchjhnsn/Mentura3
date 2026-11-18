import Link from "next/link";
import { calendarPart } from "@/server/calendar-tools";
import { clockIn, Empty, safe, Section, type Ctx } from "../parts";

const Row = ({ e }: { e: { href: string; when: string; title: string } }) => (
  <li><Link href={e.href} className="hover:bg-accent grid grid-cols-[6rem_1fr] gap-3 rounded-lg px-2 py-1.5 text-sm"><span className="text-muted-foreground">{e.when}</span><span className="truncate">{e.title}</span></Link></li>
);

/** Today: the next thing on the calendar as a card, the rest of today up to five, then tomorrow. */
export async function TodayCard({ ctx }: { ctx: Ctx }) {
  const cal = await safe(calendarPart(ctx.userId, ctx.today, ctx.tomorrow), null);
  const todays = (cal?.events ?? []).filter((e) => e.day === ctx.today);
  const tomorrows = (cal?.events ?? []).filter((e) => e.day === ctx.tomorrow);
  const nextUp = todays.find((e) => !e.starts || e.starts >= clockIn(ctx.now)) ?? todays[0] ?? null;
  const rest = todays.filter((e) => e !== nextUp);
  return (
    <Section title="Today" href={`/calendar?day=${ctx.today}`} more="Calendar">
      {nextUp ? (
        <Link href={nextUp.href} className="bg-card hover:bg-accent grid gap-1 rounded-xl border p-4 transition">
          <span className="text-muted-foreground text-sm font-medium">{nextUp.starts ? `Next · ${nextUp.when}` : "All day"}</span>
          <span className="text-xl font-semibold">{nextUp.title}</span>
          {nextUp.tile_label ? <span className="text-muted-foreground text-sm">{nextUp.tile_label}</span> : null}
        </Link>
      ) : <Empty>Nothing on your calendar today.</Empty>}
      {rest.length || tomorrows.length ? (
        <ul className="grid grid-cols-[minmax(0,1fr)] gap-1">
          {rest.slice(0, 5).map((e) => <Row key={`${e.id}-${e.day}`} e={e} />)}
          {rest.length > 5 ? <li><Link href={`/calendar?day=${ctx.today}`} className="text-muted-foreground hover:text-foreground block px-2 py-1.5 text-sm">{rest.length - 5} more today</Link></li> : null}
          {tomorrows.length ? <li className="text-muted-foreground px-2 pt-2 text-xs font-medium tracking-wide uppercase">Tomorrow</li> : null}
          {tomorrows.slice(0, 3).map((e) => <Row key={`${e.id}-${e.day}`} e={e} />)}
        </ul>
      ) : null}
    </Section>
  );
}
