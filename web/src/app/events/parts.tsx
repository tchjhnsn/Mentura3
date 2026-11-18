import Link from "next/link";
import { CalendarDaysIcon } from "lucide-react";
import { timeLabel, type EventOut } from "@reflect/core/events";
import { Face } from "@/components/dash";
import { cn } from "@/lib/utils";
import { tagLine, type Person } from "@/server/events-store";

/** The filter chips under the title, each a tag. */
export const CHIPS = ["Free", "Technical", "Founders", "AI"] as const;

/** An event's cover, or a quiet square with a calendar glyph when it has none. */
export function Cover({ e, className }: { e: Pick<EventOut, "coverUrl">; className?: string }) {
  return (
    <span className={cn("bg-muted relative block shrink-0 overflow-hidden", className)}>
      {e.coverUrl ? <img src={e.coverUrl} alt="" referrerPolicy="no-referrer" loading="lazy" className="absolute inset-0 size-full object-cover" /> : (
        <span className="text-muted-foreground absolute inset-0 grid place-items-center"><CalendarDaysIcon className="size-1/3 max-h-10 max-w-10" /></span>
      )}
    </span>
  );
}

/** "6:00 PM to 9:00 PM", or the start alone. */
export const timeSpan = (e: Pick<EventOut, "startsAt" | "endsAt">) => (e.startsAt ? `${timeLabel(e.startsAt)}${e.endsAt ? ` to ${timeLabel(e.endsAt)}` : ""}` : null);

/** "N people you know are going". */
export const knownLine = (n: number) => (n === 1 ? "1 person you know is going" : `${n} people you know are going`);

/** One event in the list: a small cover square, the title, the time and place, the tags, and who you know is going. */
export function EventRow({ e, known, going }: { e: EventOut; known: number; going: boolean }) {
  return (
    <Link href={`/events/${e.id}`} className="hover:bg-accent -mx-2 flex min-w-0 gap-3 rounded-xl p-2 transition">
      <Cover e={e} className="size-16 rounded-lg" />
      <span className="grid min-w-0 flex-1 content-center gap-0.5">
        <span className="truncate font-semibold">{e.title}</span>
        <span className="text-muted-foreground truncate text-sm">{[timeSpan(e), e.venue].filter(Boolean).join(" · ")}</span>
        {tagLine(e) ? <span className="text-muted-foreground/80 truncate text-xs">{tagLine(e)}</span> : null}
        {known > 0 ? <span className="text-primary text-sm font-medium">{knownLine(known)}</span> : null}
      </span>
      {going ? <span className="text-primary self-center text-xs font-medium">Going</span> : e.source === "reflect" ? <span className="text-muted-foreground self-center text-xs">Hosted in Reflect</span> : null}
    </Link>
  );
}

/** A member's face: their picture, else initials. */
export function Avatar({ p, size = 32 }: { p: Person; size?: number }) {
  return p.image ? <img src={p.image} alt="" referrerPolicy="no-referrer" className="ring-background shrink-0 rounded-full object-cover ring-2" style={{ width: size, height: size }} /> : <span className="ring-background rounded-full ring-2"><Face name={p.name} size={size} /></span>;
}
