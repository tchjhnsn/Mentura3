"use client";

// T5 Team settings, General (doc "Mentura console: screens, navigation and teams", 2026-11-25, after Vercel's Team
// settings): the team's name, its URL and its avatar. An Owner changes them; a Member or Viewer reads them. Changing the
// URL moves every page of the team to the new address, so the page follows it. Under it, D4 Leave team: anyone may
// leave a team that is not their personal team, except its only Owner. Delete team (D6) is not built yet.
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { leaveTeamAction, teamPeopleAction, updateTeamAction } from "@/app/studio/team-actions";
import { LAST_OWNER_LEAVE, roleLabel, teamNameProblem, teamSlugProblem } from "@/server/teams-core";
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
      {team.personal ? null : <LeaveTeam team={team} />}
    </section>
  );
}

/** D4 Leave team: a confirm that names what is lost, then the person's personal team. An Owner who is the team's only
 * Owner sees why they cannot leave instead of a button (the server refuses it too). */
function LeaveTeam({ team }: { team: Team }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  // For an Owner: how many Owners the team has, read from Members; null while reading.
  const [owners, setOwners] = useState<number | null>(team.role === "owner" ? null : 0);
  useEffect(() => {
    if (team.role !== "owner") return;
    void teamPeopleAction(team.slug).then((r) => setOwners(r.ok ? r.value.members.filter((m) => m.role === "owner").length : 2));
  }, [team.slug, team.role]);
  const onlyOwner = team.role === "owner" && owners === 1;

  const leave = () => start(async () => {
    setError(null);
    const r = await leaveTeamAction(team.slug);
    if (!r.ok) { setError(r.error); return; }
    setOpen(false);
    await refreshTeams();
    router.replace(teamHref(r.value.home));
  });

  return (
    <div className="mt-8">
      <h2 className="text-base font-semibold">Leave team</h2>
      <div className="mt-3 flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground text-sm">{onlyOwner ? LAST_OWNER_LEAVE : "You lose access to this team and its businesses until an Owner invites you again."}</p>
        {onlyOwner || owners === null ? null : <Button variant="outline" className="text-destructive shrink-0" onClick={() => { setError(null); setOpen(true); }}>Leave team</Button>}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Leave {team.name}?</DialogTitle>
            <DialogDescription>You lose access to {team.name} and every business in it. You can come back only if an Owner invites you again.</DialogDescription>
          </DialogHeader>
          {error ? <p className="text-destructive text-sm" role="alert">{error}</p> : null}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={leave} disabled={pending}>{pending ? <Loader2Icon className="animate-spin" /> : null}Leave team</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
