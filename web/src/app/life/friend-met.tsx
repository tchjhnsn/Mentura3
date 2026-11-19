import { FRIEND_KINDS } from "@reflect/core/events";
import { cn } from "@/lib/utils";
import { friendsMet } from "@/server/connect-store";
import { setFriendKindFromPage } from "@/app/events/connect-actions";

/**
 * What the friendship is (doc "Events and connections design guide", 2026-11-18): under a friend's name, a quiet
 * choice of Aristotle's three kinds that only the person sees. Where they met moved to People you've met on Village
 * and polis (/v/people) with the split of Home and the shared side (2026-11-19); what the person keeps about a friend
 * stays here. Nothing shows for a household member, who is not a friend link.
 */
export async function FriendMet({ userId, friendId }: { userId: string; friendId: string }) {
  // Before migration 0050 is applied the columns are missing; nothing then shows.
  const m = (await friendsMet(userId, friendId).catch(() => []))[0];
  if (!m) return null;
  return (
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
  );
}
