import { traitById } from "@reflect/core/formation";
import { calendarPart } from "@/server/calendar-tools";
import { learnView, readingDays } from "@/server/learn-store";
import { lifeActs, lifeRecords } from "@/server/life-store";
import { safe, type Ctx } from "../parts";
import { weekLook, weekOpens, weekRange } from "../week";
import { WeekView } from "./week-view";

const short = (day: string) => new Intl.DateTimeFormat("en-US", { timeZone: "UTC", month: "short", day: "numeric" }).format(new Date(`${day}T12:00:00Z`));

/**
 * The weekly look back: what the person did in each tile this week (last week on a Monday), from their acts,
 * records, reading and calendar, and the qualities they wrote about. It opens by itself on Sundays and Mondays and
 * sits behind "This week" on other days. Facts only; nothing here is written by a model.
 */
export async function WeekCard({ ctx }: { ctx: Ctx }) {
  const range = weekRange(ctx.today);
  const [records, acts, cal, days, learn] = await Promise.all([
    safe(lifeRecords(ctx.userId), []),
    safe(lifeActs(ctx.userId), []),
    safe(calendarPart(ctx.userId, range.from, range.to), null),
    safe(readingDays(ctx.userId, range.from, range.to), []),
    safe(learnView(ctx.userId), null),
  ]);
  const finished = (learn?.books ?? []).filter((b) => b.status === "read" && b.finishedOn && b.finishedOn >= range.from && b.finishedOn <= range.to);
  const look = weekLook({
    records, acts, calendar: cal?.events ?? [], readingDays: days.length, finished,
    traitName: (id) => traitById(id)?.name,
  }, range);
  return <WeekView look={look} title={range.last ? "Last week" : "This week"} span={`${short(range.from)} to ${short(range.to)}`} open={weekOpens(ctx.today)} />;
}
