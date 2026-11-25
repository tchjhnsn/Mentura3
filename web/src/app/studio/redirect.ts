import "server-only";
// The console's old addresses (before teams, doc "Mentura console: screens, navigation and teams", 2026-11-25) and its
// front door: each sends the person into a team. A team page goes to the last team the person used, else their
// personal team; an old business address goes to the person's personal team, where every business made before teams is.
import { redirect } from "next/navigation";
import { consolePerson, landingTeam, teamsFor } from "@/server/teams";

type Search = Record<string, string | string[] | undefined>;

const query = (search?: Search) => {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(search ?? {})) for (const one of Array.isArray(v) ? v : v === undefined ? [] : [v]) q.append(k, one);
  const s = q.toString();
  return s ? `?${s}` : "";
};

const at = (team: string, rest: string, search?: Search) => `/studio/${team}${rest ? `/${rest}` : ""}${query(search)}`;

/** To this page of the team the console opens on. */
export async function toLandingTeam(rest = "", search?: Search): Promise<never> {
  const person = await consolePerson();
  if (!person) redirect("/sign-in");
  redirect(at((await landingTeam(person)).slug, rest, search));
}

/** To this page of the person's personal team (an old /studio/v/<business> address). */
export async function toPersonalTeam(rest = "", search?: Search): Promise<never> {
  const person = await consolePerson();
  if (!person) redirect("/sign-in");
  const teams = await teamsFor(person);
  redirect(at((teams.find((t) => t.personal) ?? teams[0] ?? (await landingTeam(person))).slug, rest, search));
}
