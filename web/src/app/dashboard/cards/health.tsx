import Link from "next/link";
import { bodySpace } from "@reflect/core/body";
import { Bars, Ring } from "@/components/dash";
import { lifeActs, lifeRecords } from "@/server/life-store";
import { safe, Section, type Ctx } from "../parts";
import { sleepWeek, workoutsThisWeek } from "../world";

const weekday = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString("en-US", { weekday: "narrow", timeZone: "UTC" });

/**
 * Health and fitness: the last seven days from what the person kept in Health and Fitness, as rings for activity
 * minutes (against 150), strength days (against 2) and sleep (against 7 hours), and bars for each night's sleep.
 * Only what was kept is shown; with nothing kept the card is left out. Steps are not kept anywhere, so none show.
 */
export async function HealthCard({ ctx }: { ctx: Ctx }) {
  const [records, allActs] = await Promise.all([safe(lifeRecords(ctx.userId, "body"), []), safe(lifeActs(ctx.userId), [])]);
  const ids = new Set(records.map((r) => r.id));
  const acts = allActs.filter((a) => ids.has(a.record));
  const s = bodySpace(records, acts, ctx.today);
  const nights = sleepWeek(acts, ctx.today);
  const workouts = workoutsThisWeek(acts, ctx.today);
  const sleep = s.sleep.logged;
  if (!workouts && sleep === null) return null;

  const rings = [
    { label: "Activity", value: s.week.minutes / 150, big: `${s.week.minutes}`, small: "of 150 min" },
    { label: "Strength", value: s.week.strengthDays / 2, big: `${s.week.strengthDays}`, small: "of 2 days" },
    ...(sleep !== null ? [{ label: "Sleep", value: sleep / 7, big: `${sleep}`, small: "h a night" }] : []),
  ];
  return (
    <Section title="Health and fitness" href="/life/body?k=fitness" more="Body">
      <Link href="/life/body?k=fitness" className="bg-card hover:bg-accent grid gap-4 rounded-xl border p-4 transition">
        <div className="flex flex-wrap items-center justify-around gap-4">
          {rings.map((r) => (
            <span key={r.label} className="grid justify-items-center gap-1.5 text-center">
              <Ring value={r.value} size={72} stroke={7} label={`${r.label}: ${r.big} ${r.small}`}>
                <span className="text-base font-semibold tabular-nums">{r.big}</span>
              </Ring>
              <span className="grid leading-tight"><span className="text-sm font-medium">{r.label}</span><span className="text-muted-foreground text-xs">{r.small}</span></span>
            </span>
          ))}
        </div>
        <span className="text-muted-foreground text-sm">{workouts} {workouts === 1 ? "workout" : "workouts"} in the last seven days{s.week.met ? ". The guidelines are met." : ""}</span>
        {sleep !== null ? (
          <span className="grid gap-1">
            <span className="text-muted-foreground text-xs font-medium">Sleep, last seven nights, against 7 hours</span>
            <Bars values={nights.map((n) => n.hours)} line={7} max={Math.max(9, ...nights.map((n) => n.hours ?? 0))} labels={nights.map((n) => `${n.day}: ${n.hours === null ? "not logged" : `${n.hours} h`}`)} className="h-12" />
            <span className="text-muted-foreground flex text-xs">{nights.map((n) => <span key={n.day} className="flex-1 text-center">{weekday(n.day)}</span>)}</span>
          </span>
        ) : null}
      </Link>
    </Section>
  );
}
