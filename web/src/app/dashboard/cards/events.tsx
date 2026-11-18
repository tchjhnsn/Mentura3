import Link from "next/link";
import { knownGoing, nextGoing, upcomingEvents } from "@/server/events-store";
import { lifeRecords } from "@/server/life-store";
import { profileSettings } from "@/server/profile-store";
import { followedTopics } from "@/server/topics";
import { Avatar } from "@/app/events/parts";
import { pickEvents } from "../lists";
import { eventWhen, safe, Section, type Ctx } from "../parts";
import { interestTerms, rankEvents, whyLine, type KnownPerson } from "../rank-events";

const Faces = ({ people }: { people: readonly KnownPerson[] }) =>
  people.length ? <span className="flex shrink-0 -space-x-2">{people.slice(0, 3).map((p) => <Avatar key={p.id} p={p} size={28} />)}</span> : null;

/**
 * Events for you: the next one you're going to, then three in Austin ranked by the people you know who are going
 * and by your interests (profile interests, the topics you follow in Scholē, your ventures), soonest first among
 * equals. Faces show who you know is going. The ranking is `rankEvents`, tested on its own.
 */
export async function EventsCard({ ctx }: { ctx: Ctx }) {
  const [going, upcoming, profile, topics, ventures] = await Promise.all([
    safe(nextGoing(ctx.userId), null).then((n) => (n && pickEvents([n], ctx.now, 1)[0] ? n : null)),
    safe(upcomingEvents({ from: ctx.now, limit: 80 }), []),
    safe(profileSettings(ctx.userId), null),
    safe(followedTopics(ctx.userId), []),
    safe(lifeRecords(ctx.userId, "ventures"), []),
  ]);
  const pool = pickEvents(upcoming.filter((e) => e.id !== going?.id), ctx.now, 80);
  const known = await safe(knownGoing(ctx.userId, [...pool.map((e) => e.id), ...(going ? [going.id] : [])]), new Map<string, KnownPerson[]>());
  const terms = interestTerms([
    ...(profile?.interests ?? []),
    ...topics,
    ...ventures.flatMap((v) => [typeof v.body.name === "string" ? v.body.name : null, typeof v.body.what === "string" ? v.body.what : null]),
  ]);
  const picks = rankEvents(pool, terms, known).slice(0, 3);
  if (!going?.startsAt && !picks.length) return null;
  return (
    <Section title="Events for you" href="/events" more="Events">
      <ul className="grid grid-cols-[minmax(0,1fr)] gap-1">
        {going?.startsAt ? (
          <li><Link href={`/events/${going.id}`} className="hover:bg-accent flex items-center gap-3 rounded-lg px-2 py-1.5">
            <span className="grid min-w-0 flex-1"><span className="truncate text-sm font-medium">{going.title}</span><span className="text-muted-foreground text-xs">Going · {eventWhen(going.startsAt)}</span></span>
            <Faces people={known.get(going.id) ?? []} />
          </Link></li>
        ) : null}
        {picks.map((r) => {
          const why = whyLine(r);
          return (
            <li key={r.event.id}><Link href={`/events/${r.event.id}`} className="hover:bg-accent flex items-center gap-3 rounded-lg px-2 py-1.5">
              <span className="grid min-w-0 flex-1">
                <span className="truncate text-sm">{r.event.title}</span>
                <span className="text-muted-foreground truncate text-xs">{r.event.startsAt ? eventWhen(r.event.startsAt) : ""}{r.event.venue ? ` · ${r.event.venue}` : ""}</span>
                {why ? <span className="text-primary truncate text-xs font-medium">{why}</span> : null}
              </span>
              <Faces people={r.known} />
            </Link></li>
          );
        })}
      </ul>
    </Section>
  );
}
