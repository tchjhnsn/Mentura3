import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PAGE } from "@/components/page-header";
import { inviteInfo } from "@/server/household-store";
import { redirect } from "next/navigation";
import { currentUser } from "@/server/session";
import { acceptInviteAction } from "@/app/settings/actions";

export const metadata: Metadata = { title: "Join a household" };
export const dynamic = "force-dynamic";

/** An invite link's page: who invited you, and Join. Signing in comes first. */
export default async function JoinPage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ error?: string }> }) {
  const [{ token }, { error }] = await Promise.all([params, searchParams]);
  if (!(await currentUser())) redirect(`/sign-in?next=${encodeURIComponent(`/household/join/${token}`)}`);
  const info = await inviteInfo(token);
  return (
    <main className={PAGE}>
      <div className="mx-auto mt-16 grid max-w-md gap-4 text-center">
        {info ? (
          <>
            <h1 className="text-xl font-semibold">{info.inviter} invited you to their household</h1>
            <p className="text-muted-foreground text-sm">{info.claim ? `They have kept a record for you as ${info.claim}. Joining makes it yours.` : "You keep your own account and records."}</p>
            {error ? <p className="text-destructive text-sm">{error}</p> : null}
            <form action={acceptInviteAction.bind(null, token)}><Button type="submit">Join the household</Button></form>
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
