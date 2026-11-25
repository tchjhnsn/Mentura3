"use client";

// A team in Mentura's console (doc "Mentura console: screens, navigation and teams", 2026-11-25): a Better Auth
// organization that owns businesses (src/server/teams-core.ts). The team layout (src/app/studio/[team]/layout.tsx)
// checks the person belongs to the team in the URL and hands it here with <TeamSeen>, so the parts drawn outside the
// page (the switcher, the sidebar) can name it.
import { useEffect, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { personalTeamName, type Team } from "@/server/teams-core";
import { listTeams } from "@/app/studio/team-actions";
import { teamOf } from "./tools";

export type { Team, TeamRole } from "@/server/teams-core";

/** The personal team's name from the person's name; "Your businesses" when the name is unknown. */
export const teamName = personalTeamName;

/** The cookie that remembers the last team opened (src/server/teams.ts reads it to land there). */
const LAST_TEAM_COOKIE = "mentura_team";

let current: Team | null = null;
let teams: Team[] | null = null;
let loading: Promise<void> | null = null;
const listeners = new Set<() => void>();
const subscribe = (f: () => void) => { listeners.add(f); return () => listeners.delete(f); };
const changed = () => { for (const f of listeners) f(); };

/** Puts the team the layout checked where the sidebar can read it, and remembers it as the last team used. */
export function TeamSeen({ value }: { value: Team }) {
  useEffect(() => {
    try { document.cookie = `${LAST_TEAM_COOKIE}=${encodeURIComponent(value.slug)}; path=/; max-age=31536000; samesite=lax`; } catch { /* a blocked cookie only loses the landing */ }
    if (current && current.id === value.id && current.name === value.name && current.slug === value.slug && current.role === value.role) return;
    current = value;
    changed();
  }, [value]);
  return null;
}

/** Reads the person's teams again (after Create team or a rename). */
export function refreshTeams(): Promise<void> {
  loading = listTeams().then((r) => { teams = r.ok ? r.value : teams ?? []; changed(); }, () => { teams = teams ?? []; changed(); });
  return loading;
}

/** The person's teams, personal first, read once per page load; null while loading. */
export function useTeams(): Team[] | null {
  const list = useSyncExternalStore(subscribe, () => teams, () => null);
  useEffect(() => { if (teams === null && loading === null) void refreshTeams(); }, []);
  return list;
}

/** The team the console is in: the one in the URL once its layout has checked it, else the last one opened, else the
 * person's personal team. Null until one is known. */
export function useTeam(): Team | null {
  const seen = useSyncExternalStore(subscribe, () => current, () => null);
  const list = useTeams();
  const slug = useTeamSlug();
  if (slug) return seen?.slug === slug ? seen : list?.find((t) => t.slug === slug) ?? null;
  return seen ?? list?.find((t) => t.personal) ?? list?.[0] ?? null;
}

/** The team's URL slug in the current path (/studio/<team>/...), or null outside a team. */
export function useTeamSlug(): string | null {
  return teamOf(usePathname() ?? "");
}

/** C46 Team avatar: the team's first letter on a tint drawn from its id. An upload replaces it later. */
export function TeamAvatar({ name, seed, small }: { name: string; /** The team's id, so a rename keeps the colour. */ seed?: string; small?: boolean }) {
  let h = 0;
  for (const c of seed ?? name) h = (h * 31 + c.charCodeAt(0)) % 360;
  return (
    <span aria-hidden className={`${small ? "size-5 rounded text-[10px]" : "size-8 rounded-lg text-sm"} flex shrink-0 items-center justify-center font-semibold text-white`} style={{ background: `oklch(0.55 0.12 ${h})` }}>
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}
