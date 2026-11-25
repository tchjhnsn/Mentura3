"use client";

// C1 Team switcher and D1, its popover, at the top of Mentura's sidebar (doc "Mentura console: screens, navigation and
// teams", 2026-11-25, after Vercel's team and project popover, Mobbin "Switching teams" e626cf86). It names the team you
// are in, never a mode. Two columns on a wide screen, one list on a phone: the person's teams (their personal team
// first, the current one checked, their role beside a team they do not own) with Create team, and the current team's
// businesses with New business. Create team opens D2, and D2 goes on to D3 (Skip opens the new team).
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, type KeyboardEvent } from "react";
import { CheckIcon, ChevronsUpDownIcon, Loader2Icon, PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { listVentures } from "@/app/studio/actions";
import { createTeamAction } from "@/app/studio/team-actions";
import { roleLabel } from "@/server/teams-core";
import { businessHref, teamHref } from "./data";
import { hueOf } from "./business-data";
import { slugOf } from "./nav";
import { refreshTeams, TeamAvatar, useTeam, useTeams, type Team } from "./team";

const Swatch = ({ hue }: { hue: number }) => <span aria-hidden className="size-4 shrink-0 rounded" style={{ background: `oklch(0.65 0.14 ${hue})` }} />;
/** A filter box shows once a column holds more than this many rows. */
const FIND_PAST = 6;
/** Typing in a filter box inside the menu must not move the menu's focus; Escape still closes it. */
const keepKeys = (e: KeyboardEvent<HTMLInputElement>) => { if (e.key !== "Escape") e.stopPropagation(); };

export function TeamSwitcher({ path, done }: { path: string; done: () => void }) {
  const team = useTeam();
  const teams = useTeams();
  const current = slugOf(path);
  // The current team's businesses, read from Naive when the menu opens.
  const [real, setReal] = useState<{ team: string; list: { id: string; name: string }[] } | null>(null);
  const [findTeam, setFindTeam] = useState("");
  const [findBiz, setFindBiz] = useState("");
  const [creating, setCreating] = useState(false);
  const load = (open: boolean) => {
    if (!open || !team || real?.team === team.slug) return;
    void listVentures(team.slug).then((r) => setReal({ team: team.slug, list: r.ok ? r.value : [] }));
  };
  const name = team?.name ?? "Your businesses";
  const list = real && team && real.team === team.slug ? real.list : null;
  const shownTeams = (teams ?? []).filter((t) => t.name.toLowerCase().includes(findTeam.trim().toLowerCase()));
  const shownBiz = (list ?? []).filter((x) => x.name.toLowerCase().includes(findBiz.trim().toLowerCase()));

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu onOpenChange={load}>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg" aria-label={`${name}, switch team or business`}>
              <TeamAvatar name={name} seed={team?.id} />
              <span className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{name}</span>
                <span className="text-muted-foreground truncate text-xs">{team ? roleLabel(team.role) : "Team"}</span>
              </span>
              <ChevronsUpDownIcon className="text-muted-foreground ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-72 md:w-[34rem]">
            <div className="grid md:grid-cols-2 md:divide-x">
              <div className="min-w-0 md:pr-1">
                <DropdownMenuLabel className="text-muted-foreground text-xs font-normal">Teams</DropdownMenuLabel>
                {(teams?.length ?? 0) > FIND_PAST ? (
                  <div className="px-1 pb-1"><Input value={findTeam} onChange={(e) => setFindTeam(e.target.value)} onKeyDown={keepKeys} placeholder="Find a team" aria-label="Find a team" className="h-8" /></div>
                ) : null}
                {teams === null ? <DropdownMenuItem disabled>Loading</DropdownMenuItem> : shownTeams.map((t) => (
                  <DropdownMenuItem key={t.id} asChild>
                    <Link href={teamHref(t.slug)} onClick={done} className="flex items-center gap-2">
                      <TeamAvatar name={t.name} seed={t.id} small />
                      <span className="flex-1 truncate">{t.name}</span>
                      {t.role !== "owner" ? <span className="text-muted-foreground text-xs">{roleLabel(t.role)}</span> : null}
                      {team?.id === t.id ? <CheckIcon className="size-4" aria-label="Current team" /> : null}
                    </Link>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuItem onSelect={() => setCreating(true)} className="flex items-center gap-2">
                  <span className="flex-1">Create team</span><PlusIcon className="size-4" />
                </DropdownMenuItem>
              </div>
              <DropdownMenuSeparator className="md:hidden" />
              <div className="min-w-0 md:pl-1">
                <DropdownMenuLabel className="text-muted-foreground text-xs font-normal">Businesses</DropdownMenuLabel>
                {(list?.length ?? 0) > FIND_PAST ? (
                  <div className="px-1 pb-1"><Input value={findBiz} onChange={(e) => setFindBiz(e.target.value)} onKeyDown={keepKeys} placeholder="Find a business" aria-label="Find a business" className="h-8" /></div>
                ) : null}
                {!team || list === null ? <DropdownMenuItem disabled>Loading</DropdownMenuItem> : list.length === 0 ? <DropdownMenuItem disabled>No businesses yet</DropdownMenuItem> : shownBiz.map((x) => (
                  <DropdownMenuItem key={x.id} asChild>
                    <Link href={businessHref(team.slug, encodeURIComponent(x.id))} onClick={done} className="flex items-center gap-2"><Swatch hue={hueOf(x.id)} /><span className="flex-1 truncate">{x.name}</span>{current && decodeURIComponent(current) === x.id ? <CheckIcon className="size-4" aria-label="Current business" /> : null}</Link>
                  </DropdownMenuItem>
                ))}
                {team && team.role !== "viewer" ? (
                  <DropdownMenuItem asChild>
                    <Link href={teamHref(team.slug, "new")} onClick={done} className="flex items-center gap-2"><span className="flex-1">New business</span><PlusIcon className="size-4" /></Link>
                  </DropdownMenuItem>
                ) : null}
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
        <CreateTeam open={creating} onOpenChange={setCreating} done={done} />
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

/** D2 Create team, then D3 Invite to your new team. D2's one action is Create; D3's Skip opens the new team's empty
 * home. Inviting people is not built in this step yet (the team's Members page and invitations come next). */
function CreateTeam({ open, onOpenChange, done }: { open: boolean; onOpenChange: (open: boolean) => void; done: () => void }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [made, setMade] = useState<Team | null>(null);
  const [pending, start] = useTransition();
  const close = (next: boolean) => {
    onOpenChange(next);
    if (!next) { setName(""); setError(null); setMade(null); }
  };
  const create = () => start(async () => {
    setError(null);
    const r = await createTeamAction(name);
    if (!r.ok) { setError(r.error); return; }
    await refreshTeams();
    setMade(r.value);
  });
  const openTeam = () => {
    if (!made) return;
    const to = teamHref(made.slug);
    close(false);
    done();
    router.push(to);
  };
  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="sm:max-w-md">
        {made ? (
          <>
            <DialogHeader>
              <DialogTitle>Invite to your new team</DialogTitle>
              <DialogDescription>{made.name} is ready, and you are its Owner. Only you are on it for now.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={openTeam}>Skip</Button>
            </DialogFooter>
          </>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); create(); }} className="grid gap-4">
            <DialogHeader>
              <DialogTitle>Create team</DialogTitle>
              <DialogDescription>A team owns businesses, and everyone on it works on them together.</DialogDescription>
            </DialogHeader>
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium">Team name</span>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Acme" autoFocus maxLength={60} aria-invalid={error ? true : undefined} />
            </label>
            {error ? <p className="text-destructive text-sm" role="alert">{error}</p> : null}
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => close(false)}>Cancel</Button>
              <Button type="submit" disabled={pending || !name.trim()}>{pending ? <Loader2Icon className="animate-spin" /> : null}Create</Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
