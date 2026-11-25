import "server-only";
// The signed-in person's teams, for the console's pages and for src/server/naive.ts, which signs each call into the
// business store for one team only after checking the person belongs to it (./teams-core.ts holds the rules).
//
// Until the organization tables exist on a database (pnpm migrate makes them), every person has their personal team
// only, with their own id, so the console and every existing business keep working before and after the migration.
import { cookies, headers } from "next/headers";
import { auth } from "./auth";
import { openMode } from "./open-mode";
import { currentUser, OWNER_ID } from "./session";
import { createTeam, NOT_A_MEMBER, personalTeamName, teamsOf, updateTeam, type Team, type TeamStore } from "./teams-core";

export type { Team, TeamRole } from "./teams-core";

/** The cookie that remembers the last team the person opened, so mentura.xyz/ lands there. */
export const LAST_TEAM_COOKIE = "mentura_team";

export type Person = { id: string; name: string; email: string };

/** The person using the console, or null when nobody is signed in. Open mode is the one owner account. */
export async function consolePerson(): Promise<Person | null> {
  // currentUser makes the owner's row in open mode, which the owner's team membership refers to.
  if (openMode()) { await currentUser(); return { id: OWNER_ID, name: "Owner", email: "owner@reflect.local" }; }
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  const { id, name, email } = session.user;
  return { id, name: name || "Founder", email };
}

const adapter = async (): Promise<TeamStore> => (await auth.$context).adapter;

/** Postgres's "relation does not exist", which means the organization tables have not been made yet. */
const missingTables = (e: unknown) => {
  const code = typeof e === "object" && e !== null && "code" in e ? String((e as { code: unknown }).code) : "";
  return code === "42P01" || /relation "(organization|member)" does not exist/i.test(e instanceof Error ? e.message : String(e));
};

/** The personal team as it is before the migration: the person's id is its id and its URL. */
const fallback = (p: Person): Team => ({ id: p.id, name: personalTeamName(p.name), slug: p.id, role: "owner", personal: true });

/** Every team the person belongs to, their personal team first. */
export async function teamsFor(p: Person): Promise<Team[]> {
  try {
    const teams = await teamsOf(await adapter(), p);
    return teams.length ? teams : [fallback(p)];
  } catch (e) {
    if (missingTables(e)) return [fallback(p)];
    throw e;
  }
}

/** The team at this URL for the person, or why not. */
export async function teamAt(p: Person, slug: string): Promise<{ ok: true; team: Team } | { ok: false; error: string }> {
  const team = (await teamsFor(p)).find((t) => t.slug === slug);
  return team ? { ok: true, team } : { ok: false, error: NOT_A_MEMBER };
}

/** Where the console opens: the last team the person used if they still belong to it, else their personal team. */
export async function landingTeam(p: Person): Promise<Team> {
  const teams = await teamsFor(p);
  const last = (await cookies()).get(LAST_TEAM_COOKIE)?.value;
  return teams.find((t) => t.slug === last) ?? teams.find((t) => t.personal) ?? teams[0] ?? fallback(p);
}

/** D2: a new team with the person as its Owner. */
export async function newTeam(p: Person, name: string): Promise<Team> {
  try {
    return await createTeam(await adapter(), p, name);
  } catch (e) {
    if (missingTables(e)) throw new Error("Teams are not set up on this site yet.");
    throw e;
  }
}

/** T5 General: rename the team or change its URL (Owners only). */
export async function changeTeam(p: Person, slug: string, change: { name: string; slug: string }): Promise<Team> {
  try {
    return await updateTeam(await adapter(), p, slug, change);
  } catch (e) {
    if (missingTables(e)) throw new Error("Teams are not set up on this site yet.");
    throw e;
  }
}
