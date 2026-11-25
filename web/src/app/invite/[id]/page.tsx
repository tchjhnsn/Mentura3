import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { roleLabel } from "@/server/teams-core";
import { consolePerson, invitationFor, landingTeam } from "@/server/teams";
import { InvitationAnswer, SwitchAccount } from "./answer";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Team invitation · Mentura" };

/** A3 Invitation (doc "Mentura console: screens, navigation and teams", 2026-11-25, after Grok's "Accepting a team
 * invitation"): one card on a plain page. "<Inviter> invited you to join <Team> as a <role>", with Accept and Decline.
 * Signed out: Sign up and Sign in, both coming back here. Signed in with another address: Switch account. Expired,
 * revoked, declined or used: it says so, with a way to your own team. Already on the team: open it. */
export default async function InvitationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const person = await consolePerson();
  const view = await invitationFor(decodeURIComponent(id), person);
  const here = `/invite/${encodeURIComponent(decodeURIComponent(id))}`;
  const home = person ? await landingTeam(person) : null;
  const toHome = home
    ? <Button asChild variant="outline"><Link href={`/studio/${home.slug}`}>Go to {home.name}</Link></Button>
    : <Button asChild variant="outline"><Link href="/sign-in?mode=sign-in">Sign in</Link></Button>;

  if (!view) return <Frame title="This invitation does not exist" line="The link may be mistyped. Ask the person who sent it for a new one.">{toHome}</Frame>;

  const offer = `${view.inviter} invited you to join ${view.teamName} as a ${roleLabel(view.role)}.`;
  if (view.member && view.teamSlug) {
    return (
      <Frame title={`You are already on ${view.teamName}`} line={`You can open its businesses now.`}>
        <Button asChild><Link href={`/studio/${view.teamSlug}`}>Open {view.teamName}</Link></Button>
      </Frame>
    );
  }
  if (view.state === "expired") return <Frame title="This invitation has expired" line={`${offer} It lasted 7 days. Ask ${view.inviter} to send it again.`}>{toHome}</Frame>;
  if (view.state === "revoked") return <Frame title="This invitation was withdrawn" line={`An Owner of ${view.teamName} revoked it. Ask them for a new one if you still need to join.`}>{toHome}</Frame>;
  if (view.state === "declined") return <Frame title="You declined this invitation" line={`Ask an Owner of ${view.teamName} for a new one if you change your mind.`}>{toHome}</Frame>;
  if (view.state === "accepted") return <Frame title="This invitation has already been used" line={`Ask an Owner of ${view.teamName} for a new one.`}>{toHome}</Frame>;

  if (!person) {
    const next = encodeURIComponent(here);
    return (
      <Frame title={`Join ${view.teamName}`} line={offer} sub={`Sign up or sign in with ${view.email} to accept.`}>
        <Button asChild variant="outline"><Link href={`/sign-in?mode=sign-in&next=${next}`}>Sign in</Link></Button>
        <Button asChild><Link href={`/sign-in?next=${next}`}>Sign up</Link></Button>
      </Frame>
    );
  }
  if (!view.forYou) {
    return (
      <Frame title={`This invitation is for ${view.email}`} line={offer} sub={`You are signed in as ${person.email}. Switch to the account for ${view.email} to accept it.`}>
        {toHome}
        <SwitchAccount next={here} />
      </Frame>
    );
  }
  return (
    <Frame title={`Join ${view.teamName}`} line={offer} sub={`You can see the team's businesses as soon as you accept.`}>
      <InvitationAnswer id={view.id} />
    </Frame>
  );
}

function Frame({ title, line, sub, children }: { title: string; line: string; sub?: string; children: ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center p-4 sm:p-6" data-virtu-screen="A3">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardDescription>Mentura</CardDescription>
          <CardTitle className="text-xl">{title}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2">
          <p className="text-sm">{line}</p>
          {sub ? <p className="text-muted-foreground text-sm">{sub}</p> : null}
        </CardContent>
        <CardFooter className="flex flex-wrap justify-end gap-2">{children}</CardFooter>
      </Card>
    </main>
  );
}
