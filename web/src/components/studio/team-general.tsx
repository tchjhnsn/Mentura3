"use client";

// T5 Team settings, General (doc "Mentura console: screens, navigation and teams", 2026-11-25, after Vercel's Team
// settings): the team's name, its URL and its avatar. An Owner changes them; a Member or Viewer reads them. Changing the
// URL moves every page of the team to the new address, so the page follows it. Leave team (D4) and Delete team (D6) are
// not built here yet.
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateTeamAction } from "@/app/studio/team-actions";
import { roleLabel, teamNameProblem, teamSlugProblem } from "@/server/teams-core";
import { teamHref } from "./data";
import { refreshTeams, TeamAvatar, type Team } from "./team";

export function TeamGeneral({ team }: { team: Team }) {
  const router = useRouter();
  const owner = team.role === "owner";
  const [name, setName] = useState(team.name);
  const [slug, setSlug] = useState(team.slug);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const changed = name.trim() !== team.name || slug.trim() !== team.slug;
  const problem = teamNameProblem(name) ?? (slug.trim() !== team.slug ? teamSlugProblem(slug.trim()) : null);

  const save = () => start(async () => {
    setNote(null);
    const r = await updateTeamAction(team.slug, { name, slug: slug.trim() });
    if (!r.ok) { setNote({ ok: false, text: r.error }); return; }
    await refreshTeams();
    setNote({ ok: true, text: "Saved." });
    if (r.value.slug !== team.slug) router.replace(teamHref(r.value.slug, "settings"));
    else router.refresh();
  });

  return (
    <section className="relative" data-virtu-screen="T5">
      <h2 className="text-base font-semibold">General</h2>
      <p className="text-muted-foreground mb-3 text-sm">{owner ? "How the team shows up for everyone on it." : `You are a ${roleLabel(team.role)} of this team. Only an Owner can change these.`}</p>
      <form onSubmit={(e) => { e.preventDefault(); if (owner && changed && !problem) save(); }}>
        <ul className="divide-y rounded-lg border">
          <li className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
            <label htmlFor="team-name" className="min-w-0"><span className="block text-sm font-medium">Team name</span><span className="text-muted-foreground block text-xs">Shown in the switcher and at the top of every page.</span></label>
            <Input id="team-name" value={name} onChange={(e) => { setName(e.target.value); setNote(null); }} readOnly={!owner} maxLength={60} className="sm:w-72" />
          </li>
          <li className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
            <label htmlFor="team-url" className="min-w-0"><span className="block text-sm font-medium">Team URL</span><span className="text-muted-foreground block text-xs">Links to the team&apos;s pages use it. Old links stop working when it changes.</span></label>
            <div className="flex items-center gap-1 sm:w-72">
              <span className="text-muted-foreground shrink-0 text-xs">/studio/</span>
              <Input id="team-url" value={slug} onChange={(e) => { setSlug(e.target.value.toLowerCase()); setNote(null); }} readOnly={!owner} maxLength={40} />
            </div>
          </li>
          <li className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
            <div className="min-w-0"><div className="text-sm font-medium">Avatar</div><div className="text-muted-foreground text-xs">Made from the team, so each team looks different in the switcher.</div></div>
            <TeamAvatar name={name || team.name} seed={team.id} />
          </li>
          {team.personal ? (
            <li className="p-4 text-muted-foreground text-xs">This is your personal team. It cannot be left or deleted.</li>
          ) : null}
        </ul>
        {owner ? (
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={!changed || !!problem || pending}>{pending ? <Loader2Icon className="animate-spin" /> : null}Save</Button>
            {changed && problem ? <span className="text-destructive text-sm" role="alert">{problem}</span> : null}
            {note ? <span className={note.ok ? "text-muted-foreground text-sm" : "text-destructive text-sm"} role={note.ok ? "status" : "alert"}>{note.text}</span> : null}
          </div>
        ) : null}
      </form>
    </section>
  );
}
