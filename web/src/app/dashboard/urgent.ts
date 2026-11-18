// Each card's `urgency(ctx)` (cards/index.ts): reads what the card shows, through the cached reads in data.ts, and
// scores it with the pure functions in urgency.ts. A read that fails scores 0.
import { budgetView } from "@reflect/core/budget";
import { clockIn, type Ctx } from "./parts";
import { calendarOf, goingNext, planFor, requestsOf, threadsFor } from "./data";
import { hoursSince, minutesBetween, soonScore, waitingScore } from "./urgency";

/** Today: the next timed thing today, by how soon it starts; an all-day day only a little. */
export async function todayUrgency(ctx: Ctx): Promise<number> {
  const cal = await calendarOf(ctx.userId, ctx.today, ctx.tomorrow);
  const todays = cal.events.filter((e) => e.day === ctx.today);
  const clock = clockIn(ctx.now);
  const timed = todays.filter((e) => e.starts).map((e) => soonScore(minutesBetween(clock, e.starts!)));
  return Math.max(0, ...timed, todays.some((e) => !e.starts) ? 10 : 0);
}

/** People: connect requests waiting, and friends whose message is the last word. */
export async function peopleUrgency(ctx: Ctx): Promise<number> {
  const [requests, threads] = await Promise.all([requestsOf(ctx.userId), threadsFor(ctx.userId)]);
  const unread = threads.filter((t) => t.last && !t.last.you);
  const oldest = Math.max(0, ...requests.map((r) => hoursSince(r.at, ctx.now)));
  // A message left days ago is not waiting the way a request is; only messages from the last two days count.
  const fresh = unread.filter((t) => hoursSince(t.last!.at, ctx.now) <= 48).length;
  return waitingScore(requests.length + fresh, oldest);
}

/** Events: the next event the person is going to, by how soon it starts. */
export async function eventsUrgency(ctx: Ctx): Promise<number> {
  const going = await goingNext(ctx.userId);
  if (!going?.startsAt) return 0;
  return Math.min(85, soonScore((Date.parse(going.startsAt) - ctx.now.getTime()) / 60_000));
}

/** Money: more allotted than comes in. */
export async function moneyUrgency(ctx: Ctx): Promise<number> {
  const { plan, budget } = await planFor(ctx.userId);
  return budgetView(plan, budget).leftToAllot < 0 ? 40 : 0;
}
