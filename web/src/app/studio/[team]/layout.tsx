import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { StudioFrame } from "@/components/studio/shell";
import { TeamSeen } from "@/components/studio/team";
import { consolePerson, landingTeam, teamAt } from "@/server/teams";

export const dynamic = "force-dynamic";

/** Every page of one team, /studio/<team>/... (doc "Mentura console: screens, navigation and teams", 2026-11-25): the
 * person must belong to the team in the URL. A team they are not on, and one that does not exist, both say "You are not
 * a member of this team" and show nothing of it (test E7). The checked team goes to the sidebar with <TeamSeen>. */
export default async function TeamPages({ children, params }: { children: ReactNode; params: Promise<{ team: string }> }) {
  const person = await consolePerson();
  if (!person) redirect("/sign-in");
  const { team: slug } = await params;
  const at = await teamAt(person, decodeURIComponent(slug));
  if (!at.ok) {
    const home = await landingTeam(person);
    return (
      <StudioFrame>
        <section className="mx-auto mt-16 max-w-md px-4 text-center" role="alert">
          <h1 className="text-xl font-semibold tracking-tight">{at.error}</h1>
          <p className="text-muted-foreground mt-2 text-sm">Ask one of its Owners to invite you, or go back to your own businesses.</p>
          <Button asChild className="mt-6"><Link href={`/studio/${home.slug}`}>Go to {home.name}</Link></Button>
        </section>
      </StudioFrame>
    );
  }
  return (
    <StudioFrame>
      <TeamSeen value={at.team} />
      {children}
    </StudioFrame>
  );
}
