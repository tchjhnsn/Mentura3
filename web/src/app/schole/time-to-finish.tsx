"use client";

import { useState } from "react";
import { atSpeed, dailyPlan, daysUntil, hours, SPEEDS } from "@reflect/core/time-plan";

const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };

/**
 * How long a list takes at each listening speed, and, with a date chosen, how much a day it asks (Torian, 2026-11-16
 * 19:20Z: learning to fit a person's time, e.g. ready to talk about it with friends next week). Lengths only count
 * what has a known length; the rest are named as a number.
 */
export function TimeToFinish({ seconds, unknown }: { seconds: number; unknown: number }) {
  const [by, setBy] = useState("");
  const days = by ? daysUntil(today(), by) : 0;
  const plan = days ? dailyPlan(seconds, days) : [];
  const fits = plan.find((p) => p.minutesADay <= 90);
  if (!seconds) return null;
  return (
    <section aria-labelledby="time" className="space-y-3 rounded-xl border p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="time" className="text-base font-semibold">Time to finish</h2>
        <label className="text-muted-foreground flex items-center gap-2 text-sm">Ready by
          <input type="date" value={by} min={today()} onChange={(e) => setBy(e.target.value)} className="bg-background text-foreground h-8 rounded-md border px-2 text-sm" />
        </label>
      </div>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {SPEEDS.map((s) => {
          const p = plan.find((x) => x.speed === s);
          const best = fits?.speed === s;
          return (
            <li key={s} className={best ? "bg-foreground text-background rounded-lg p-3" : "bg-muted/70 rounded-lg p-3"}>
              <span className={best ? "block text-xs opacity-80" : "text-muted-foreground block text-xs"}>{s === 1 ? "Normal speed" : `${s}x`}</span>
              <span className="block text-lg font-semibold tabular-nums">{hours(atSpeed(seconds, s))}</span>
              {p ? <span className={best ? "block text-xs opacity-80" : "text-muted-foreground block text-xs"}>{Number.isFinite(p.minutesADay) ? `${hours(p.minutesADay * 60)} a day` : "date has passed"}</span> : null}
            </li>
          );
        })}
      </ul>
      <p className="text-muted-foreground text-xs">
        {days && plan.length ? (fits ? `Highlighted: the slowest speed that fits in an hour and a half a day for ${days} ${days === 1 ? "day" : "days"}. ` : `Even at 2x this asks more than an hour and a half a day; choose fewer things or a later date. `) : null}
        {unknown ? `${unknown} ${unknown === 1 ? "thing has" : "things have"} no length given and ${unknown === 1 ? "is" : "are"} not counted.` : "Every length is counted."}
      </p>
    </section>
  );
}
