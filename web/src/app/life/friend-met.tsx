import Link from "next/link";
import { FRIEND_KINDS, austinDay, dayLabel } from "@reflect/core/events";
import { cn } from "@/lib/utils";
import { friendsMet } from "@/server/connect-store";
import { setFriendKindFromPage } from "@/app/events/connect-actions";

/**
 * Where you met, and what the friendship is (doc "Events and connections design guide", 2026-11-18): under a
 * friend's name, "Met at <event>, <date>" linking to the event, and a quiet choice of Aristotle's three kinds that only
 * the person sees. Nothing shows for a household member, who is not a friend link.
 */
export async function FriendMet({ userId, friendId }: { userId: string; friendId: string }) {
  // Before migration 0050 is applied the columns are missing; nothing then shows.
  const m = (await friendsMet(userId, friendId).catch(() => []))[0];
  if (!m) return null;
  return (
    <div className="grid justify-items-center gap-2 text-center">
      {m.event ? <Link href={`/events/${m.event.id}`} className="text-muted-foreground hover:text-foreground text-sm">Met at {m.event.title}{m.event.startsAt ? `, ${dayLabel(austinDay(m.event.startsAt))}` : ""}</Link> : null}
      <div role="group" aria-label="What this friendship is, for you alone" className="flex flex-wrap justify-center gap-1">
        {FRIEND_KINDS.map((k) => {
          const on = m.kind === k.id;
          return (
            <form key={k.id} action={setFriendKindFromPage.bind(null, m.id, on ? "" : k.id)}>
              <button type="submit" aria-pressed={on} className={cn("rounded-md px-2 py-1 text-xs transition", on ? "text-foreground bg-muted font-medium" : "text-muted-foreground hover:text-foreground")}>{k.label}</button>
            </form>
          );
        })}
      </div>
    </div>
  );
}
