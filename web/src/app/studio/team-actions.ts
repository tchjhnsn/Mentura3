"use server";
// The console's team actions (doc "Mentura console: screens, navigation and teams", 2026-11-25): the switcher's list of
// teams (D1), Create team (D2) and the team's General settings (T5). Each checks the signed-in person on the server.
import { revalidatePath } from "next/cache";
import { changeTeam, consolePerson, newTeam, teamsFor, type Team } from "@/server/teams";
import type { Result } from "./actions";

const attempt = async <T>(f: () => Promise<T>): Promise<Result<T>> => {
  try { return { ok: true, value: await f() }; }
  catch (e) { return { ok: false, error: e instanceof Error ? e.message : "That did not work. Try again." }; }
};

const person = async () => {
  const p = await consolePerson();
  if (!p) throw new Error("Sign in to use the console.");
  return p;
};

/** D1: every team the person belongs to, with their role on each, their personal team first. */
export async function listTeams(): Promise<Result<Team[]>> {
  return attempt(async () => teamsFor(await person()));
}

/** D2 Create team: a new team with the person as its Owner. */
export async function createTeamAction(name: string): Promise<Result<Team>> {
  return attempt(async () => newTeam(await person(), name));
}

/** T5 General: rename the team or change its URL. Owners only (src/server/teams-core.ts). */
export async function updateTeamAction(team: string, change: { name: string; slug: string }): Promise<Result<Team>> {
  return attempt(async () => {
    const t = await changeTeam(await person(), team, change);
    revalidatePath(`/studio/${t.slug}`, "layout");
    return t;
  });
}
