import Link from "next/link";
import { austinDay, dayLabel } from "@reflect/core/events";
import { Face } from "@/components/dash";
import { Button } from "@/components/ui/button";
import { incomingRequests, type Incoming } from "@/server/connect-store";
import { connectBackAction, notNowAction } from "@/app/events/connect-actions";

/**
 * Requests on the Friends tile (doc "Events and connections design guide", 2026-11-18): people who tapped Connect
 * for the person, with Connect back and Not now, so someone who scanned later can still answer. A request shows only
 * here, never anywhere else, and lapses after a week. Nothing shows when there are none.
 */
export async function ConnectRequests({ userId }: { userId: string }) {
  // Before migration 0050 is applied the table is missing; the section then stays away.
  const list: Incoming[] = await incomingRequests(userId).catch(() => []);
  if (!list.length) return null;
  return (
    <section aria-labelledby="requests" className="grid gap-3">
      <h2 id="requests" className="text-lg font-semibold">Requests</h2>
      <ul className="bg-card divide-y overflow-hidden rounded-2xl border">
        {list.map((r) => (
          <li key={r.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
            <Face name={r.from.name} size={44} />
            <span className="grid min-w-[8rem] flex-1">
              <span className="truncate font-medium">{r.from.name}</span>
              {r.event ? <Link href={`/events/${r.event.id}`} className="text-muted-foreground hover:text-foreground truncate text-sm">At {r.event.title}{r.event.startsAt ? `, ${dayLabel(austinDay(r.event.startsAt))}` : ""}</Link> : null}
            </span>
            <span className="ml-auto flex gap-2">
              <form action={connectBackAction.bind(null, r.from.id)}><Button type="submit" size="sm">Connect back</Button></form>
              <form action={notNowAction.bind(null, r.id)}><Button type="submit" size="sm" variant="ghost">Not now</Button></form>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
