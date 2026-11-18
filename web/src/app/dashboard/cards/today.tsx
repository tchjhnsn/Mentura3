import Link from "next/link";
import { agenda, occurrences } from "@reflect/core/calendar";
import { calendar } from "@/server/calendar-store";
import { groupRepeats, isMealEvent, mealLine, type DayLine } from "../lists";
import { clockIn, Empty, safe, Section, type Ctx } from "../parts";
import { movable } from "../urgency";
import { MoveToTomorrow } from "./move-button";

type Item = ReturnType<typeof agenda>[number];

const ROW = "hover:bg-accent grid grid-cols-[6rem_minmax(0,1fr)] items-center gap-3 rounded-lg px-2 py-1.5 text-sm";

/** One line; on today, the person's own one-off event also moves to tomorrow. */
function Line({ line, moves = false }: { line: DayLine<Item>; moves?: boolean }) {
  if (line.kind === "one") {
    const e = line.item;
    return (
      <li className="flex min-w-0 items-center gap-1">
        <Link href={e.href} className={`${ROW} min-w-0 flex-1`}><span className="text-muted-foreground">{e.when}</span><span className="truncate">{e.title}</span></Link>
        {moves && movable(e) ? <MoveToTomorrow id={e.id} title={e.title} /> : null}
      </li>
    );
  }
  return (
    <li><Link href={line.first.href} className={ROW} aria-label={`${line.count} of ${line.label}`}>
      <span className="text-muted-foreground">{line.first.when}</span>
      <span className="flex min-w-0 items-center gap-2"><span className="bg-muted shrink-0 rounded-full px-2 py-0.5 text-xs font-medium tabular-nums">{line.count}</span><span className="truncate">{line.label}</span></span>
    </Link></li>
  );
}

function Food({ names }: { names: string[] }) {
  const m = mealLine(names);
  if (!m) return null;
  return (
    <li><Link href="/meals/week" className={ROW}>
      <span className="text-muted-foreground">Food</span>
      <span className="grid min-w-0"><span className="truncate">{m.title}</span><span className="text-muted-foreground truncate text-xs">{m.detail}</span></span>
    </Link></li>
  );
}

/**
 * Today: the next thing on the calendar as a card, the rest of today up to five lines, then tomorrow. Items alike
 * (fourteen of the same duty due) fold into one line with how many, and planned meals fold into one Food line and
 * are never the Next card.
 */
export async function TodayCard({ ctx }: { ctx: Ctx }) {
  const raw = await safe(calendar(ctx.userId, ctx.today, ctx.tomorrow), []);
  const meals = new Set(raw.filter(isMealEvent).map((e) => e.id));
  const all = agenda(occurrences(raw, ctx.today, ctx.tomorrow));
  const of = (day: string) => all.filter((e) => e.day === day && !meals.has(e.id));
  const mealsOf = (day: string) => all.filter((e) => e.day === day && meals.has(e.id)).map((e) => e.title);
  const todays = of(ctx.today);
  // Three or more alike fold, so two different calls ("Call mom tonight", "Call dad tonight") stay as they are. The
  // Next card is something on its own: an item alike to others shows in its folded line instead.
  const lines = groupRepeats(todays, 3);
  const singles = lines.flatMap((l) => (l.kind === "one" ? [l.item] : []));
  const nextUp = singles.find((e) => e.starts && e.starts >= clockIn(ctx.now)) ?? singles.find((e) => !e.starts) ?? null;
  const rest = lines.filter((l) => !(l.kind === "one" && l.item === nextUp));
  const tomorrow = groupRepeats(of(ctx.tomorrow), 3);
  const mealsToday = mealsOf(ctx.today);
  const mealsTomorrow = mealsOf(ctx.tomorrow);
  const key = (l: DayLine<Item>) => (l.kind === "one" ? `${l.item.id}-${l.item.day}` : l.key);
  return (
    <Section title="Today" href={`/calendar?day=${ctx.today}`} more="Calendar">
      {nextUp ? (
        <div className="bg-card relative grid rounded-xl border transition">
          <Link href={nextUp.href} className="hover:bg-accent grid gap-1 rounded-xl p-4 pr-12">
            <span className="text-muted-foreground text-sm font-medium">{nextUp.starts ? `Next · ${nextUp.when}` : "All day"}</span>
            <span className="text-xl font-semibold">{nextUp.title}</span>
            {nextUp.tile ? <span className="text-muted-foreground text-sm">{nextUp.tile_label}</span> : null}
          </Link>
          {movable(nextUp) ? <MoveToTomorrow id={nextUp.id} title={nextUp.title} className="absolute top-3 right-3" /> : null}
        </div>
      ) : !rest.length && !mealsToday.length ? <Empty>Nothing on your calendar today.</Empty> : null}
      {rest.length || mealsToday.length || tomorrow.length || mealsTomorrow.length ? (
        <ul className="grid grid-cols-[minmax(0,1fr)] gap-1">
          <Food names={mealsToday} />
          {rest.slice(0, 5).map((l) => <Line key={key(l)} line={l} moves />)}
          {rest.length > 5 ? <li><Link href={`/calendar?day=${ctx.today}`} className="text-muted-foreground hover:text-foreground block px-2 py-1.5 text-sm">{rest.length - 5} more today</Link></li> : null}
          {tomorrow.length || mealsTomorrow.length ? <li className="text-muted-foreground px-2 pt-2 text-xs font-medium tracking-wide uppercase">Tomorrow</li> : null}
          {tomorrow.slice(0, 3).map((l) => <Line key={key(l)} line={l} />)}
          <Food names={mealsTomorrow} />
        </ul>
      ) : null}
    </Section>
  );
}
