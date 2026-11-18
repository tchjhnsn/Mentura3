import Link from "next/link";
import { nextGoing, upcomingEvents } from "@/server/events-store";
import { Empty, eventWhen, safe, Section, type Ctx } from "../parts";

/** Events: the next one you're going to and three in Austin. */
export async function EventsCard({ ctx }: { ctx: Ctx }) {
  const [going, nearby] = await Promise.all([safe(nextGoing(ctx.userId), null), safe(upcomingEvents({ from: ctx.now, limit: 4 }), [])]);
  const events = nearby.filter((e) => e.id !== going?.id).slice(0, 3);
  return (
    <Section title="Events" href="/events" more="Events">
      <ul className="grid grid-cols-[minmax(0,1fr)] gap-1">
        {going?.startsAt ? (
          <li><Link href={`/events/${going.id}`} className="hover:bg-accent grid rounded-lg px-2 py-1.5"><span className="text-sm font-medium">{going.title}</span><span className="text-muted-foreground text-xs">Going · {eventWhen(going.startsAt)}</span></Link></li>
        ) : null}
        {events.map((e) => (
          <li key={e.id}><Link href={`/events/${e.id}`} className="hover:bg-accent grid rounded-lg px-2 py-1.5"><span className="truncate text-sm">{e.title}</span><span className="text-muted-foreground text-xs">{e.startsAt ? eventWhen(e.startsAt) : ""}{e.venue ? ` · ${e.venue}` : ""}</span></Link></li>
        ))}
      </ul>
      {!going && !events.length ? <Empty>No events in Austin in the next weeks.</Empty> : null}
    </Section>
  );
}
