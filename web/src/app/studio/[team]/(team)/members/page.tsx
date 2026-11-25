"use client";

// T4 Members (doc "Mentura console: screens, navigation and teams", 2026-11-25): get the right people into the team
// with the right role. The parts are in src/components/studio/members.tsx.
import { ScreenHead } from "@/components/studio/shell";
import { Members } from "@/components/studio/members";
import { useTeam, useTeamSlug } from "@/components/studio/team";

export default function MembersPage() {
  const slug = useTeamSlug() ?? "";
  const team = useTeam();
  return (
    <div className="pb-16">
      <ScreenHead n="T4" title="Members" job={team ? `Who works on ${team.name}'s businesses, and what each person may do.` : "Who works on the team's businesses, and what each person may do."} />
      {slug ? <Members key={slug} team={slug} /> : null}
    </div>
  );
}
