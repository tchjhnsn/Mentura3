import type { Metadata } from "next";
import Link from "next/link";
import { addDays, isRecordEvent, occurrences } from "@reflect/core/calendar";
import { PAGE } from "@/components/page-header";
import { AddIcon } from "@/components/section-head";
import { requireUser } from "@/server/session";
import { calendar } from "@/server/calendar-store";
import { LearnHeader, LibraryTabs } from "../header";

export const metadata: Metadata = { title: "Schedule" };
export const dynamic = "force-dynamic";

const dayLabel = (d: string, today: string) => d === today ? "Today" : d === addDays(today, 1) ? "Tomorrow" : new Date(`${d}T12:00:00Z`).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", timeZone: "UTC" });

/**
 * The library's Schedule (guide "Home, browse and library", point 8): the next four weeks of the calendar filtered to
 * Scholē (reading groups, salons, examinations, lectures), by day. The heading opens the whole calendar; + adds.
 */
export default async function SchedulePage() {
  const user = await requireUser();
  const today = new Date().toISOString().slice(0, 10);
  const to = addDays(today, 27);
  const list = occurrences(await calendar(user.id, today, to, "learn").catch(() => []), today, to);
  const days = [...new Set(list.map((o) => o.day))];
  return (
    <main className={PAGE}>
      <LearnHeader on="schedule" />
      <LibraryTabs on="schedule" className="mt-4" />
      <section className="mt-6 max-w-3xl space-y-4">
        <div className="flex items-center gap-1">
          <h2 className="text-lg font-semibold tracking-tight"><Link href="/calendar?tile=learn" className="hover:underline hover:underline-offset-4">Next four weeks</Link></h2>
          <AddIcon add={{ label: "Add to your Scholē calendar", href: `/calendar?tile=learn&day=${today}` }} />
        </div>
        {days.length ? days.map((d) => (
          <div key={d} className="space-y-1">
            <h3 className="text-muted-foreground text-[13px] font-medium">{dayLabel(d, today)}</h3>
            <ul className="divide-y rounded-xl border">
              {list.filter((o) => o.day === d).map((o) => (
                <li key={`${o.event.id}-${o.day}`}>
                  <Link href={isRecordEvent(o.event) ? `/life/learn/${o.event.recordId}` : `/calendar?tile=learn&day=${o.day}`} className="hover:bg-muted/60 flex items-baseline gap-3 px-4 py-2.5">
                    <span className="text-muted-foreground w-14 shrink-0 text-xs tabular-nums">{o.event.starts ?? "All day"}</span>
                    <span className="min-w-0 truncate font-medium">{o.event.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )) : <p className="text-muted-foreground text-sm">Nothing on your Scholē calendar in the next four weeks. Reading groups, salons and examinations you join show here; add your own with +.</p>}
      </section>
    </main>
  );
}
