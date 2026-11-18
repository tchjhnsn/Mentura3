import Link from "next/link";
import { Face } from "@/components/dash";
import { requestsOf, threadsFor } from "../data";
import { Empty, safe, Section, type Ctx } from "../parts";
import { RequestRows } from "./request-rows";

/** People: connect requests, answered in place, and the latest message from each friend who wrote last. */
export async function PeopleCard({ ctx }: { ctx: Ctx }) {
  const [requests, threads] = await Promise.all([safe(requestsOf(ctx.userId), []), safe(threadsFor(ctx.userId), [])]);
  const unread = threads.filter((t) => t.last && !t.last.you).slice(0, 3);
  const asks = requests.slice(0, 3).map((r) => ({ id: r.id, fromId: r.from.id, name: r.from.name, line: `Wants to connect${r.event ? ` · met at ${r.event.title}` : ""}` }));
  return (
    <Section title="People" href="/life/friends" more="Friends">
      {requests.length || unread.length ? (
        <ul className="grid grid-cols-[minmax(0,1fr)] gap-2">
          <RequestRows requests={asks} />
          {unread.map((t) => (
            <li key={t.id}><Link href={`/life/friends/messages/${encodeURIComponent(t.id)}`} className="hover:bg-accent flex items-center gap-3 rounded-xl px-2 py-2">
              <Face name={t.name} size={40} />
              <span className="grid min-w-0"><span className="font-medium">{t.name}</span><span className="text-muted-foreground truncate text-sm">{t.last!.text}</span></span>
            </Link></li>
          ))}
        </ul>
      ) : <Empty>No one is waiting on you.</Empty>}
    </Section>
  );
}
