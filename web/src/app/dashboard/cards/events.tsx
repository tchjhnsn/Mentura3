import Link from "next/link";
import { nextGoing, upcomingEvents } from "@/server/events-store";
import { pickEvents } from "../lists";
import { Empty, eventWhen, safe, Section, type Ctx } from "../parts";

/** Events: the next one you're going to and three in Austin, upcoming first and none that began more than a day ago. */
export async function EventsCard({ ctx }: { ctx: Ctx }) {
  const [next, nearby] = await Promise.all([safe(nextGoing(ctx.userId), null), safe(upcomingEvents({ from: ctx.now, limit: 40 }), [])]);
  const going = next && pickEvents([next], ctx.now, 1)[0] ? next : null;
  const events = pickEvents(nearby.filter((e) => e.id !== going?.id), ctx.now, 3);
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
