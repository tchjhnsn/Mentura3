import type { Metadata } from "next";
import { headers } from "next/headers";
import { auth } from "@/server/auth";
import { currentUser } from "@/server/session";
import { inviteByToken } from "@/server/meetings-store";
import { Avatar, whenLine } from "@/app/meetings/[id]/parts";
import { acceptInviteAction } from "./actions";
import { GuestForm, JoinAs } from "./invite-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Invitation", robots: { index: false, follow: false } };

/**
 * An invite link (doc "Mentura meetings and building-only Mentura design guide", 2026-11-19), with no sidebar: the
 * meeting's title and time, its host, and the way in. Someone signed out makes a guest account (which sees only its
 * meetings) or signs in; someone signed in joins. An unknown or removed link has expired.
 */
export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const [view, user] = await Promise.all([inviteByToken(token).catch(() => null), currentUser().catch(() => null)]);
  const session = user ? await auth.api.getSession({ headers: await headers() }).catch(() => null) : null;
  const name = session ? session.user.name?.trim() || session.user.email : null;
  const accept = acceptInviteAction.bind(null, token);

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="grid w-full max-w-sm gap-6">
        <p className="text-lg font-semibold tracking-tight">Mentura</p>
        {!view ? (
          <div className="grid gap-1">
            <h1 className="text-2xl font-bold tracking-tight">This link has expired.</h1>
            <p className="text-muted-foreground">Ask your host for a new one.</p>
          </div>
        ) : (
          <>
            <div className="grid gap-4">
              <div className="grid gap-1">
                <h1 className="text-2xl font-bold tracking-tight break-words">{view.title}</h1>
                <p className="text-muted-foreground text-sm">{whenLine(view) ?? "The host has not picked a time yet."}</p>
              </div>
              <div className="flex items-center gap-3">
                <Avatar p={view.host} size={40} />
                <span className="grid leading-tight"><span className="font-medium">{view.host.name}</span><span className="text-muted-foreground text-xs">Host</span></span>
              </div>
            </div>
            {view.state === "cancelled" ? (
              <p className="bg-muted rounded-lg px-4 py-2 text-sm">The host cancelled this meeting.</p>
            ) : user ? (
              <JoinAs name={name} accept={accept} />
            ) : (
              <div className="grid gap-4">
                <GuestForm accept={accept} />
                <p className="text-muted-foreground border-t pt-4 text-center text-xs">Sees only this meeting</p>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
