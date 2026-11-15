import Link from "next/link";
import { addDays, isRecordEvent, occurrences, tileLabel, type CalTile } from "@reflect/core/calendar";
import { calendar } from "@/server/calendar-store";
import { SectionHead } from "@/components/section-head";

const shortDay = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });

/** A tile's calendar for the next two weeks: the events tagged with it and the days its records hold. */
export async function Upcoming({ userId, tile, today, title = "Coming up", note, hideEmpty = false }: { userId: string; tile: CalTile; today: string; title?: string; note?: string; /** Show nothing when the two weeks are empty. */ hideEmpty?: boolean }) {
  const to = addDays(today, 13);
  const list = occurrences(await calendar(userId, today, to, tile), today, to).slice(0, 8);
  if (hideEmpty && !list.length) return null;
  return (
    <section className="grid gap-3">
      <SectionHead title={title} href={`/calendar?tile=${tile}`} add={{ label: `Add an event tagged ${tileLabel(tile)}`, href: `/calendar?tile=${tile}&day=${today}` }} note={note ?? `The next two weeks on your ${tileLabel(tile)} calendar.`} />
      {list.length ? (
        <ul className="divide-y rounded-xl border text-sm">
          {list.map((o) => (
            <li key={`${o.event.id}-${o.day}`}>
              <Link href={isRecordEvent(o.event) ? `/life/${tile}/${o.event.recordId}` : `/calendar?tile=${tile}&day=${o.day}`} className="hover:bg-accent flex items-baseline gap-3 px-4 py-2">
                <span className="text-muted-foreground w-24 shrink-0 text-xs">{shortDay(o.day)}{o.event.starts ? ` ${o.event.starts}` : ""}</span>
                <span className="min-w-0 truncate font-medium">{o.event.title}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : <p className="text-muted-foreground text-sm">Nothing on it yet.</p>}
    </section>
  );
}
