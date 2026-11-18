import Link from "next/link";
import { showsOn } from "@reflect/core/home-cards";
import { streak } from "@reflect/core/habits";
import { homeCards } from "@/server/home-cards-store";
import { readingDays } from "@/server/learn-store";
import { safe, Section, type Ctx } from "../parts";
import { habitsOf } from "../tiles";
import { HabitTaps } from "./habit-taps";

/**
 * Habits and streaks: today's streak and checklist Home cards, each checked off with one tap, and the reading run
 * Scholē keeps. Nothing when there are none. The day is the one the Home card action marks (UTC), so a tap and what
 * is shown agree.
 */
export async function HabitsCard({ ctx }: { ctx: Ctx }) {
  const day = ctx.now.toISOString().slice(0, 10);
  const since = new Date(ctx.now.getTime() - 120 * 86400_000).toISOString().slice(0, 10);
  const [cards, read] = await Promise.all([safe(homeCards(ctx.userId), []), safe(readingDays(ctx.userId, since, day), [])]);
  const habits = habitsOf(cards.filter((c) => showsOn(c, day)), day);
  const reading = streak(read, day);
  if (!habits.length && !reading) return null;
  return (
    <Section title="Habits" href="/" more="Home">
      {habits.length ? <HabitTaps habits={habits} /> : null}
      {reading ? (
        <Link href="/schole/reading" className="hover:bg-accent flex items-baseline justify-between gap-3 rounded-lg px-2 py-1.5 text-sm">
          <span>Reading</span>
          <span className="text-muted-foreground tabular-nums">{reading} {reading === 1 ? "day" : "days"} in a row{read.includes(day) ? "" : ", not yet today"}</span>
        </Link>
      ) : null}
    </Section>
  );
}
