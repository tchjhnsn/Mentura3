import { calendarOf } from "../data";
import { clockIn, safe, Section, type Ctx } from "../parts";
import { movable } from "../urgency";
import { TodayList, type TodayItem } from "./today-list";

/**
 * Today: the next thing on the calendar as a card, the rest of today up to five, then tomorrow. The person's own
 * one-off events move to tomorrow by dragging onto Tomorrow (wide screens) or the move icon (phones).
 */
export async function TodayCard({ ctx }: { ctx: Ctx }) {
  const cal = await safe(calendarOf(ctx.userId, ctx.today, ctx.tomorrow), null);
  const item = (e: NonNullable<typeof cal>["events"][number]): TodayItem => ({
    key: `${e.id}-${e.day}`, id: e.id, day: e.day, title: e.title, when: e.when, starts: e.starts ?? null, href: e.href, label: e.tile_label || null, movable: movable(e),
  });
  const events = cal?.events ?? [];
  return (
    <Section title="Today" href={`/calendar?day=${ctx.today}`} more="Calendar">
      <TodayList
        today={events.filter((e) => e.day === ctx.today).map(item)}
        tomorrow={events.filter((e) => e.day === ctx.tomorrow).map(item)}
        clock={clockIn(ctx.now)}
        moreHref={`/calendar?day=${ctx.today}`}
      />
    </Section>
  );
}
