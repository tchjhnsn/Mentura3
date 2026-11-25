// Teams in Mentura's console (doc "Mentura console: screens, navigation and teams", 2026-11-25). A team is a Better
// Auth organization (the organization plugin in ./auth-options.ts): it owns businesses, and people belong to it with
// one role. Every person has a personal team whose id is the person's own id, so the hosted business store, whose
// tenant was the person's id, now keys each business by its team with no data moved.
//
// This file works on Better Auth's database adapter only, so the same code runs on Postgres in the app (./teams.ts)
// and on the in-memory store in the tests (teams.test.ts).
import type { Where } from "better-auth";

/** The part of Better Auth's database adapter this file uses (its `ctx.context.adapter`, or `(await auth.$context).adapter`). */
export type TeamStore = {
  findOne<T>(q: { model: string; where: Where[] }): Promise<T | null>;
  findMany<T>(q: { model: string; where?: Where[] }): Promise<T[]>;
  create<T extends Record<string, unknown>, R = T>(q: { model: string; data: Omit<T, "id">; forceAllowId?: boolean }): Promise<R>;
  update<T>(q: { model: string; where: Where[]; update: Record<string, unknown> }): Promise<T | null>;
};

export type TeamRole = "owner" | "member" | "viewer";
export const TEAM_ROLES: readonly TeamRole[] = ["owner", "member", "viewer"];
/** One team as one person sees it: their role on it, and whether it is their personal team. */
export type Team = { id: string; name: string; slug: string; role: TeamRole; personal: boolean };

/** What a role can do, in one line each (C44). */
export const ROLE_WORDS: Record<TeamRole, string> = {
  owner: "Everything, including people, the team's name and its businesses' settings.",
  member: "Starts businesses and works their tools.",
  viewer: "Sees the team's businesses and their records.",
};
export const roleLabel = (role: TeamRole) => role.charAt(0).toUpperCase() + role.slice(1);

export const NOT_A_MEMBER = "You are not a member of this team.";
export const PERSONAL_TEAM_KEPT = "Your personal team cannot be deleted or left.";
export const VIEWER_REFUSED = "You can view this team's businesses, but a Viewer cannot change them.";
export const OWNER_ONLY = "Only an Owner of this team can change its settings.";

/** Words the console uses right after /studio/, which no team may take as its URL. `v` and `r` are the old business
 * addresses, which redirect. */
export const RESERVED_TEAM_SLUGS: ReadonlySet<string> = new Set([
  "new", "library", "settings", "invite", "account", "members", "usage", "map", "v", "r", "api", "studio", "teams",
]);

/** The personal team's name: "<first name>'s businesses", as Vercel's is "<name>'s projects". */
export function personalTeamName(person: string | null | undefined): string {
  const first = person?.trim().split(/\s+/)[0];
  return first ? `${first}'s businesses` : "Your businesses";
}

/** Lower case letters, digits and single hyphens, at most 40 characters. */
export function slugify(text: string): string {
  return text.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/'/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40).replace(/-+$/g, "");
}

/** Why a team URL cannot be used, or null when it can. */
export function teamSlugProblem(slug: string): string | null {
  if (!/^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/.test(slug) || slug.includes("--")) {
    return "A team URL uses lower case letters, digits and single hyphens, 1 to 40 characters, and starts and ends with a letter or digit.";
  }
  if (RESERVED_TEAM_SLUGS.has(slug)) return `"${slug}" is a word the console uses, so it cannot be a team URL.`;
  return null;
}

/** Why a team name cannot be used, or null when it can. */
export function teamNameProblem(name: string): string | null {
  const n = name.trim();
  if (!n) return "Give the team a name.";
  if (n.length > 60) return "A team name is at most 60 characters.";
  return null;
}

/** A Better Auth role (which may list several, comma separated) as one of Mentura's three. A role Mentura does not
 * know gives the least: Viewer. */
export function roleOf(value: string | null | undefined): TeamRole {
  const roles = String(value ?? "").split(",").map((r) => r.trim());
  if (roles.includes("owner")) return "owner";
  if (roles.includes("member") || roles.includes("admin")) return "member";
  return "viewer";
}

type OrgRow = { id: string; name: string; slug: string; createdAt?: Date };
type MemberRow = { id: string; organizationId: string; userId: string; role: string };
type Person = { id: string; name?: string | null };

/** The base slug if it is free and allowed, else the base with a number, else with a few random letters. */
export async function freeSlug(adapter: TeamStore, text: string): Promise<string> {
  const base = slugify(text) || "team";
  const ok = async (s: string) => !teamSlugProblem(s) && !(await adapter.findOne<OrgRow>({ model: "organization", where: [{ field: "slug", value: s }] }));
  if (await ok(base)) return base;
  for (let n = 2; n < 10; n++) {
    const s = `${base.slice(0, 36)}-${n}`;
    if (await ok(s)) return s;
  }
  for (;;) {
    const s = `${base.slice(0, 33)}-${Math.random().toString(36).slice(2, 8)}`;
    if (await ok(s)) return s;
  }
}

/** Makes the person's personal team (id = the person's id) and their Owner membership, when either is missing. Safe
 * to run again and from two requests at once: a second insert of the team is caught and read back. */
export async function ensurePersonalTeam(adapter: TeamStore, person: Person): Promise<void> {
  let org = await adapter.findOne<OrgRow>({ model: "organization", where: [{ field: "id", value: person.id }] });
  if (!org) {
    const name = personalTeamName(person.name);
    const slug = await freeSlug(adapter, name);
    try {
      // The id is the person's: Better Auth ignores a given id unless forceAllowId is set.
      await adapter.create<{ name: string; slug: string; createdAt: Date }>({ model: "organization", data: { id: person.id, name, slug, createdAt: new Date() } as { name: string; slug: string; createdAt: Date }, forceAllowId: true });
    } catch (e) {
      org = await adapter.findOne<OrgRow>({ model: "organization", where: [{ field: "id", value: person.id }] });
      if (!org) throw e;
    }
  }
  const member = await adapter.findOne<MemberRow>({ model: "member", where: [{ field: "organizationId", value: person.id }, { field: "userId", value: person.id }] });
  if (!member) await adapter.create({ model: "member", data: { organizationId: person.id, userId: person.id, role: "owner", createdAt: new Date() } });
}

/** Every team the person belongs to, their personal team first, then by name. A person whose personal team is missing
 * (an account made before teams, when the backfill has not run) gets it made here. */
export async function teamsOf(adapter: TeamStore, person: Person): Promise<Team[]> {
  let members = await adapter.findMany<MemberRow>({ model: "member", where: [{ field: "userId", value: person.id }] });
  if (!members.some((m) => m.organizationId === person.id)) {
    await ensurePersonalTeam(adapter, person);
    members = await adapter.findMany<MemberRow>({ model: "member", where: [{ field: "userId", value: person.id }] });
  }
  const ids = [...new Set(members.map((m) => m.organizationId))];
  if (!ids.length) return [];
  const orgs = await adapter.findMany<OrgRow>({ model: "organization", where: [{ field: "id", value: ids, operator: "in" }] });
  const teams = orgs.map((o): Team => ({
    id: o.id, name: o.name, slug: o.slug, personal: o.id === person.id,
    // Two rows for one team (a race) give the stronger role.
    role: members.filter((m) => m.organizationId === o.id).map((m) => roleOf(m.role)).sort((a, b) => TEAM_ROLES.indexOf(a) - TEAM_ROLES.indexOf(b))[0] ?? "viewer",
  }));
  return teams.sort((a, b) => Number(b.personal) - Number(a.personal) || a.name.localeCompare(b.name));
}

/** The team at this URL slug if the person belongs to it, else null. A team that does not exist and one the person
 * is not on look the same, so a URL tells nobody which teams exist. */
export async function teamFor(adapter: TeamStore, person: Person, slug: string): Promise<Team | null> {
  return (await teamsOf(adapter, person)).find((t) => t.slug === slug) ?? null;
}

/** D2 Create team: the team, its URL from its name, and the person as its Owner. */
export async function createTeam(adapter: TeamStore, person: Person, name: string): Promise<Team> {
  const why = teamNameProblem(name);
  if (why) throw new Error(why);
  const slug = await freeSlug(adapter, name);
  const org = await adapter.create<{ name: string; slug: string; createdAt: Date }, OrgRow>({ model: "organization", data: { name: name.trim(), slug, createdAt: new Date() } });
  await adapter.create({ model: "member", data: { organizationId: org.id, userId: person.id, role: "owner", createdAt: new Date() } });
  return { id: org.id, name: org.name, slug: org.slug, role: "owner", personal: false };
}

/** T5 General: an Owner renames the team or changes its URL. */
export async function updateTeam(adapter: TeamStore, person: Person, slug: string, change: { name: string; slug: string }): Promise<Team> {
  const team = await teamFor(adapter, person, slug);
  if (!team) throw new Error(NOT_A_MEMBER);
  if (team.role !== "owner") throw new Error(OWNER_ONLY);
  const nameWhy = teamNameProblem(change.name);
  if (nameWhy) throw new Error(nameWhy);
  const next = change.slug.trim().toLowerCase();
  const slugWhy = teamSlugProblem(next);
  if (slugWhy) throw new Error(slugWhy);
  if (next !== team.slug) {
    const taken = await adapter.findOne<OrgRow>({ model: "organization", where: [{ field: "slug", value: next }] });
    if (taken) throw new Error("Another team already has that URL.");
  }
  await adapter.update({ model: "organization", where: [{ field: "id", value: team.id }], update: { name: change.name.trim(), slug: next } });
  return { ...team, name: change.name.trim(), slug: next };
}
