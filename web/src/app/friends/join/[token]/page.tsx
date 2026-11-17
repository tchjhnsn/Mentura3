import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PAGE } from "@/components/page-header";
import { currentUser } from "@/server/session";
import { friendInviteInfo } from "@/server/messages-store";
import { acceptFriendInviteAction } from "@/app/life/messages-actions";

export const metadata: Metadata = { title: "Accept an invite" };
export const dynamic = "force-dynamic";

/** A friend invite link's page (Ask Reflect plan, step 10): who invited you, and Accept. Signing in comes first. */
export default async function FriendJoinPage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ error?: string }> }) {
  const [{ token }, { error }] = await Promise.all([params, searchParams]);
  const user = await currentUser();
  if (!user) redirect(`/sign-in?next=${encodeURIComponent(`/friends/join/${token}`)}`);
  const info = await friendInviteInfo(token, user.id).catch(() => null);
  return (
    <main className={PAGE}>
      <div className="mx-auto mt-16 grid max-w-md gap-4 text-center">
        {info?.own ? (
          <>
            <h1 className="text-xl font-semibold">This is your own invite</h1>
            <p className="text-muted-foreground text-sm">Send the link to the friend you want to message.</p>
            <div><Button asChild variant="outline"><Link href="/life/friends/messages">Messages</Link></Button></div>
          </>
        ) : info ? (
          <>
            <h1 className="text-xl font-semibold">{info.inviter} invited you to message each other in Reflect</h1>
            <p className="text-muted-foreground text-sm">Only the two of you see your messages. Nothing else of yours is shared, and your journal never is.</p>
            {error ? <p className="text-destructive text-sm">{error}</p> : null}
            <form action={acceptFriendInviteAction.bind(null, token)}><Button type="submit">Accept</Button></form>
          </>
        ) : (
          <>
            <h1 className="text-xl font-semibold">This invite has expired or was already used</h1>
            <p className="text-muted-foreground text-sm">Ask whoever sent it for a new link.</p>
            <div><Button asChild variant="outline"><Link href="/">Go home</Link></Button></div>
          </>
        )}
      </div>
    </main>
  );
}
