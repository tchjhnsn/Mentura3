import type { ReactNode } from "react";
import { endsAt, joinOpensAt, type MeetingTimes } from "@reflect/core/meetings";
import { Face } from "@/components/dash";
import { cn } from "@/lib/utils";
import type { MeetingPerson } from "@/server/meetings-store";

// Small pieces of the meeting page and the invite page: faces, Austin times, and a titled section.

const TZ = "America/Chicago";
const fmt = (iso: string, o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-US", { timeZone: TZ, ...o }).format(new Date(iso));
const clock = (iso: string) => fmt(iso, { hour: "numeric", minute: "2-digit" });
const austinDay = (iso: string) => fmt(iso, { year: "numeric", month: "2-digit", day: "2-digit" });

/** "Thursday, December 3, 6:00 PM to 6:45 PM CT", or null with no start. */
export function whenLine(m: Pick<MeetingTimes, "startsAt" | "minutes">): string | null {
  if (!m.startsAt) return null;
  return `${fmt(m.startsAt, { weekday: "long", month: "long", day: "numeric" })}, ${clock(m.startsAt)} to ${clock(endsAt(m)!)} CT`;
}

/** When Join opens, as the disabled button says it: the time alone today, else the day and time. */
export function joinOpensLabel(m: Pick<MeetingTimes, "startsAt">, now = new Date()): string | null {
  const t = joinOpensAt(m);
  if (!t) return null;
  return austinDay(t) === austinDay(now.toISOString()) ? `${clock(t)} CT` : `${fmt(t, { weekday: "short", month: "short", day: "numeric" })}, ${clock(t)} CT`;
}

/** A follow-up's due day ("Dec 3") from YYYY-MM-DD. */
export const dueLabel = (day: string) => new Intl.DateTimeFormat("en-US", { timeZone: "UTC", month: "short", day: "numeric" }).format(new Date(`${day}T12:00:00Z`));

/** A person's face: their picture, else initials. Muted for a guest who has not joined yet. */
export function Avatar({ p, size = 36, muted }: { p: Pick<MeetingPerson, "name" | "image">; size?: number; muted?: boolean }) {
  return (
    <span className={cn("ring-background shrink-0 rounded-full ring-2", muted && "opacity-50")}>
      {p.image ? <img src={p.image} alt="" referrerPolicy="no-referrer" className="rounded-full object-cover" style={{ width: size, height: size }} /> : <Face name={p.name} size={size} />}
    </span>
  );
}

export function Section({ title, aside, children }: { title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section className="grid min-w-0 gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-lg font-semibold">{title}</h2>
        {aside ? <span className="text-muted-foreground text-sm">{aside}</span> : null}
      </div>
      {children}
    </section>
  );
}
