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
  delete(q: { model: string; where: Where[] }): Promise<void>;
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
export const OWNER_ONLY_PEOPLE = "Only an Owner of this team can invite people, change their roles or remove them.";
export const LAST_OWNER = "A team needs at least one Owner. Make someone else an Owner first.";
export const LAST_OWNER_LEAVE = "You are the only Owner of this team. Make someone else an Owner on Members before you leave.";
export const INVITATION_GONE = "This invitation does not exist. Ask the person who sent it for a new one.";

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

// Members and invitations (round 3: T4 Members, A3 Invitation, D4 Leave team). Better Auth's own invitation statuses
// are kept in the table (pending, accepted, rejected, canceled), so its organization plugin reads the same rows;
// Mentura says declined and revoked, and an invitation still pending after its 7 days is expired.

/** How long an invitation lasts. */
export const INVITE_DAYS = 7;
const INVITE_MS = INVITE_DAYS * 24 * 60 * 60 * 1000;

export type InvitationState = "pending" | "expired" | "accepted" | "declined" | "revoked";
/** One invitation as an Owner sees it on Members, Pending. Dates are ISO strings. */
export type Invitation = { id: string; email: string; role: TeamRole; state: InvitationState; sentAt: string; expiresAt: string; inviter: string | null };
/** One person on a team, as the Members list shows them. `kept`: the person whose personal team this is, who stays
 * its Owner and cannot be removed. */
export type TeamMember = { id: string; userId: string; name: string; email: string; role: TeamRole; you: boolean; kept: boolean };
/** Members (T4): the team, its people, and, for an Owner, its open invitations (pending or expired). */
export type TeamPeople = { team: Team; members: TeamMember[]; invitations: Invitation[] };
/** A3: what an invitation link shows. `forYou` is null when nobody is signed in. `teamSlug` only once the person is
 * on the team, so a link tells nobody a team's URL. */
export type InvitationView = {
  id: string; teamName: string; teamSlug: string | null; inviter: string; email: string; role: TeamRole; state: InvitationState;
  forYou: boolean | null; member: boolean;
};

type InvitationRow = { id: string; organizationId: string; email: string; role?: string | null; status: string; expiresAt: Date | string; createdAt?: Date | string | null; inviterId: string };
type UserRow = { id: string; name?: string | null; email: string };
type Signed = Person & { email: string };

const iso = (d: Date | string | null | undefined) => (d ? new Date(d).toISOString() : new Date(0).toISOString());

/** An email address as invitations keep it: trimmed and lower case. */
export const normalEmail = (email: string) => email.trim().toLowerCase();

/** Why an address cannot be invited, or null when it can. */
export function inviteEmailProblem(email: string): string | null {
  const e = normalEmail(email);
  if (!e) return "Give an email address.";
  if (e.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return `"${email.trim()}" is not an email address.`;
  return null;
}

/** An invitation's state now: Better Auth's status, with a pending one past its time read as expired. */
export function invitationState(row: Pick<InvitationRow, "status" | "expiresAt">, now: Date = new Date()): InvitationState {
  if (row.status === "accepted") return "accepted";
  if (row.status === "rejected") return "declined";
  if (row.status === "canceled") return "revoked";
  return new Date(row.expiresAt).getTime() <= now.getTime() ? "expired" : "pending";
}

const membersRows = (adapter: TeamStore, teamId: string) => adapter.findMany<MemberRow>({ model: "member", where: [{ field: "organizationId", value: teamId }] });
const rowsOf = (rows: MemberRow[], userId: string) => rows.filter((m) => m.userId === userId);
const ownerIds = (rows: MemberRow[]) => new Set(rows.filter((m) => roleOf(m.role) === "owner").map((m) => m.userId));
const usersBy = async (adapter: TeamStore, ids: string[]) => ids.length ? adapter.findMany<UserRow>({ model: "user", where: [{ field: "id", value: ids, operator: "in" }] }) : [];

async function ownerTeam(adapter: TeamStore, person: Person, slug: string): Promise<Team> {
  const team = await teamFor(adapter, person, slug);
  if (!team) throw new Error(NOT_A_MEMBER);
  if (team.role !== "owner") throw new Error(OWNER_ONLY_PEOPLE);
  return team;
}

async function asInvitation(adapter: TeamStore, row: InvitationRow, now: Date, names?: Map<string, string>): Promise<Invitation> {
  let inviter = names?.get(row.inviterId) ?? null;
  if (inviter === null && !names) {
    const u = await adapter.findOne<UserRow>({ model: "user", where: [{ field: "id", value: row.inviterId }] });
    inviter = u ? (u.name?.trim() || u.email) : null;
  }
  return { id: row.id, email: row.email, role: roleOf(row.role), state: invitationState(row, now), sentAt: iso(row.createdAt), expiresAt: iso(row.expiresAt), inviter };
}

/** T4 Members: everyone on the team, Owners first, then by name; an Owner also gets the open invitations. Anyone on
 * the team may read the list. */
export async function teamPeople(adapter: TeamStore, person: Person, slug: string, now: Date = new Date()): Promise<TeamPeople> {
  const team = await teamFor(adapter, person, slug);
  if (!team) throw new Error(NOT_A_MEMBER);
  const rows = await membersRows(adapter, team.id);
  const users = new Map((await usersBy(adapter, [...new Set(rows.map((m) => m.userId))])).map((u) => [u.id, u]));
  const seen = new Set<string>();
  const members: TeamMember[] = [];
  // Two rows for one person (a race) show once, with the stronger role.
  for (const m of [...rows].sort((a, b) => TEAM_ROLES.indexOf(roleOf(a.role)) - TEAM_ROLES.indexOf(roleOf(b.role)))) {
    if (seen.has(m.userId)) continue;
    seen.add(m.userId);
    const u = users.get(m.userId);
    members.push({ id: m.id, userId: m.userId, name: u?.name?.trim() || u?.email || "Someone", email: u?.email ?? "", role: roleOf(m.role), you: m.userId === person.id, kept: m.userId === team.id });
  }
  members.sort((a, b) => TEAM_ROLES.indexOf(a.role) - TEAM_ROLES.indexOf(b.role) || a.name.localeCompare(b.name));
  let invitations: Invitation[] = [];
  if (team.role === "owner") {
    const open = (await adapter.findMany<InvitationRow>({ model: "invitation", where: [{ field: "organizationId", value: team.id }] }))
      .filter((r) => r.status === "pending");
    const names = new Map((await usersBy(adapter, [...new Set(open.map((r) => r.inviterId))])).map((u) => [u.id, u.name?.trim() || u.email]));
    invitations = (await Promise.all(open.map((r) => asInvitation(adapter, r, now, names))))
      .sort((a, b) => b.sentAt.localeCompare(a.sentAt));
  }
  return { team, members, invitations };
}

/** T4 and D3 Invite: an Owner offers a place on the team to an email address, with a role, for 7 days. An address
 * that already has an open invitation gets that one again, with the new role and a fresh 7 days, so one person never
 * holds two links. Someone already on the team is refused. */
export async function inviteToTeam(adapter: TeamStore, person: Person, slug: string, ask: { email: string; role: TeamRole }, now: Date = new Date()): Promise<{ team: Team; invitation: Invitation; again: boolean }> {
  const team = await ownerTeam(adapter, person, slug);
  const why = inviteEmailProblem(ask.email);
  if (why) throw new Error(why);
  if (!TEAM_ROLES.includes(ask.role)) throw new Error("Choose Owner, Member or Viewer.");
  const email = normalEmail(ask.email);
  const user = await adapter.findOne<UserRow>({ model: "user", where: [{ field: "email", value: email }] });
  if (user && (await adapter.findOne<MemberRow>({ model: "member", where: [{ field: "organizationId", value: team.id }, { field: "userId", value: user.id }] }))) {
    throw new Error(`${email} is already on this team.`);
  }
  const expiresAt = new Date(now.getTime() + INVITE_MS);
  const open = (await adapter.findMany<InvitationRow>({ model: "invitation", where: [{ field: "organizationId", value: team.id }, { field: "email", value: email }] }))
    .find((r) => r.status === "pending");
  if (open) {
    const update = { role: ask.role, expiresAt, inviterId: person.id, createdAt: now };
    await adapter.update({ model: "invitation", where: [{ field: "id", value: open.id }], update });
    return { team, invitation: await asInvitation(adapter, { ...open, ...update, status: "pending" }, now), again: true };
  }
  const row = await adapter.create<Omit<InvitationRow, "id">, InvitationRow>({ model: "invitation", data: { organizationId: team.id, email, role: ask.role, status: "pending", expiresAt, createdAt: now, inviterId: person.id } });
  return { team, invitation: await asInvitation(adapter, row, now), again: false };
}

async function teamInvitation(adapter: TeamStore, team: Team, id: string): Promise<InvitationRow> {
  const row = await adapter.findOne<InvitationRow>({ model: "invitation", where: [{ field: "id", value: id }] });
  if (!row || row.organizationId !== team.id) throw new Error(INVITATION_GONE);
  return row;
}

/** Pending, Send again: an Owner gives a pending or expired invitation a fresh 7 days. */
export async function resendInvitation(adapter: TeamStore, person: Person, slug: string, id: string, now: Date = new Date()): Promise<{ team: Team; invitation: Invitation }> {
  const team = await ownerTeam(adapter, person, slug);
  const row = await teamInvitation(adapter, team, id);
  if (row.status !== "pending") throw new Error("That invitation is closed. Invite the address again.");
  const update = { expiresAt: new Date(now.getTime() + INVITE_MS), createdAt: now, inviterId: person.id };
  await adapter.update({ model: "invitation", where: [{ field: "id", value: id }], update });
  return { team, invitation: await asInvitation(adapter, { ...row, ...update }, now) };
}

/** Pending, Revoke: an Owner withdraws an invitation, and its link stops working. */
export async function revokeInvitation(adapter: TeamStore, person: Person, slug: string, id: string): Promise<void> {
  const team = await ownerTeam(adapter, person, slug);
  const row = await teamInvitation(adapter, team, id);
  if (row.status !== "pending") throw new Error("That invitation is already closed.");
  await adapter.update({ model: "invitation", where: [{ field: "id", value: id }], update: { status: "canceled" } });
}

async function memberOf(adapter: TeamStore, team: Team, memberId: string): Promise<MemberRow> {
  const row = await adapter.findOne<MemberRow>({ model: "member", where: [{ field: "id", value: memberId }] });
  if (!row || row.organizationId !== team.id) throw new Error("That person is not on this team.");
  return row;
}

/** C44 Role menu: an Owner changes someone's role. The team keeps at least one Owner, and a personal team's own
 * person stays its Owner. */
export async function changeMemberRole(adapter: TeamStore, person: Person, slug: string, memberId: string, role: TeamRole): Promise<void> {
  const team = await ownerTeam(adapter, person, slug);
  if (!TEAM_ROLES.includes(role)) throw new Error("Choose Owner, Member or Viewer.");
  const row = await memberOf(adapter, team, memberId);
  if (roleOf(row.role) === role) return;
  if (row.userId === team.id) throw new Error("The person whose personal team this is stays its Owner.");
  const owners = ownerIds(await membersRows(adapter, team.id));
  if (owners.has(row.userId) && owners.size === 1 && role !== "owner") throw new Error(LAST_OWNER);
  for (const m of rowsOf(await membersRows(adapter, team.id), row.userId)) await adapter.update({ model: "member", where: [{ field: "id", value: m.id }], update: { role } });
}

/** Members, More, Remove: an Owner takes someone off the team. They lose access at once, until invited again. */
export async function removeMember(adapter: TeamStore, person: Person, slug: string, memberId: string): Promise<void> {
  const team = await ownerTeam(adapter, person, slug);
  const row = await memberOf(adapter, team, memberId);
  if (row.userId === team.id) throw new Error(PERSONAL_TEAM_KEPT);
  const rows = await membersRows(adapter, team.id);
  const owners = ownerIds(rows);
  if (owners.has(row.userId) && owners.size === 1) throw new Error(LAST_OWNER);
  for (const m of rowsOf(rows, row.userId)) await adapter.delete({ model: "member", where: [{ field: "id", value: m.id }] });
}

/** D4 Leave team. A personal team cannot be left, and an Owner cannot leave while they are its only Owner. */
export async function leaveTeam(adapter: TeamStore, person: Person, slug: string): Promise<Team> {
  const team = await teamFor(adapter, person, slug);
  if (!team) throw new Error(NOT_A_MEMBER);
  if (team.personal) throw new Error(PERSONAL_TEAM_KEPT);
  const rows = await membersRows(adapter, team.id);
  const owners = ownerIds(rows);
  if (owners.has(person.id) && owners.size === 1) throw new Error(LAST_OWNER_LEAVE);
  for (const m of rowsOf(rows, person.id)) await adapter.delete({ model: "member", where: [{ field: "id", value: m.id }] });
  return team;
}

/** A3: what an invitation link shows to whoever opens it, signed in or not. */
export async function invitationView(adapter: TeamStore, id: string, person: Signed | null, now: Date = new Date()): Promise<InvitationView | null> {
  const row = await adapter.findOne<InvitationRow>({ model: "invitation", where: [{ field: "id", value: id }] });
  if (!row) return null;
  const org = await adapter.findOne<OrgRow>({ model: "organization", where: [{ field: "id", value: row.organizationId }] });
  if (!org) return null;
  const inviter = await adapter.findOne<UserRow>({ model: "user", where: [{ field: "id", value: row.inviterId }] });
  const member = person ? !!(await adapter.findOne<MemberRow>({ model: "member", where: [{ field: "organizationId", value: org.id }, { field: "userId", value: person.id }] })) : false;
  return {
    id: row.id, teamName: org.name, teamSlug: member ? org.slug : null, inviter: inviter?.name?.trim() || inviter?.email || "Someone",
    email: row.email, role: roleOf(row.role), state: invitationState(row, now), forYou: person ? normalEmail(person.email) === normalEmail(row.email) : null, member,
  };
}

async function openInvitationFor(adapter: TeamStore, id: string, person: Signed, now: Date): Promise<InvitationRow> {
  const row = await adapter.findOne<InvitationRow>({ model: "invitation", where: [{ field: "id", value: id }] });
  if (!row) throw new Error(INVITATION_GONE);
  const state = invitationState(row, now);
  if (state === "expired") throw new Error("This invitation has expired. Ask an Owner of the team to send it again.");
  if (state === "revoked") throw new Error("This invitation was withdrawn by an Owner of the team.");
  if (state === "declined") throw new Error("This invitation was declined.");
  if (normalEmail(person.email) !== normalEmail(row.email)) throw new Error(`This invitation is for ${row.email}. Sign in with that address to accept it.`);
  return row;
}

/** A3 Accept: the invited person joins the team with the invitation's role. Accepting again, or accepting when already
 * on the team, opens the team and adds nobody. */
export async function acceptInvitation(adapter: TeamStore, person: Signed, id: string, now: Date = new Date()): Promise<Team> {
  const row = await adapter.findOne<InvitationRow>({ model: "invitation", where: [{ field: "id", value: id }] });
  const already = row ? await adapter.findOne<MemberRow>({ model: "member", where: [{ field: "organizationId", value: row.organizationId }, { field: "userId", value: person.id }] }) : null;
  if (row && row.status === "accepted") {
    if (!already) throw new Error("This invitation has already been used.");
  } else {
    const open = await openInvitationFor(adapter, id, person, now);
    if (!already) await adapter.create({ model: "member", data: { organizationId: open.organizationId, userId: person.id, role: roleOf(open.role), createdAt: now } });
    await adapter.update({ model: "invitation", where: [{ field: "id", value: id }], update: { status: "accepted" } });
  }
  const team = (await teamsOf(adapter, person)).find((t) => t.id === row!.organizationId);
  if (!team) throw new Error(INVITATION_GONE);
  return team;
}

/** A3 Decline: the invitation ends, and the person stays where they were. */
export async function declineInvitation(adapter: TeamStore, person: Signed, id: string, now: Date = new Date()): Promise<void> {
  await openInvitationFor(adapter, id, person, now);
  await adapter.update({ model: "invitation", where: [{ field: "id", value: id }], update: { status: "rejected" } });
}

// Moving and removing (round 4: D5 Transfer business, D6 Delete team, A4 Delete account). The businesses themselves
// live in the hosted business store, keyed by team (packages/platform/hosted/move-business.ts); the rules here decide
// who may move or remove them, and remove the team and account rows Better Auth keeps.

export const OWNER_OF_BOTH = "Only someone who is an Owner of both teams can move a business between them.";
export const SAME_TEAM = "The business is already in that team.";
export const OWNER_TO_DELETE = "Only an Owner of this team can delete it.";

/** D5: the teams a business in this team can move to, which are the person's other teams where they are an Owner. */
export function transferTargets(teams: Team[], fromSlug: string): Team[] {
  return teams.filter((t) => t.slug !== fromSlug && t.role === "owner");
}

/** D5: both teams of a transfer, checked: the person is an Owner of each, and they are two teams. */
export async function transferTeams(adapter: TeamStore, person: Person, fromSlug: string, toSlug: string): Promise<{ from: Team; to: Team }> {
  const teams = await teamsOf(adapter, person);
  const from = teams.find((t) => t.slug === fromSlug);
  const to = teams.find((t) => t.slug === toSlug);
  if (!from || !to) throw new Error(from ? OWNER_OF_BOTH : NOT_A_MEMBER);
  if (from.id === to.id) throw new Error(SAME_TEAM);
  if (from.role !== "owner" || to.role !== "owner") throw new Error(OWNER_OF_BOTH);
  return { from, to };
}

/** Why a typed name does not confirm a deletion, or null when it does. Case and spaces at the ends do not count. */
export function typedProblem(typed: string, expected: string, what: string): string | null {
  return typed.trim().toLowerCase() === expected.trim().toLowerCase() ? null : `Type ${what}, ${expected.trim()}, to confirm.`;
}

/** D6 Delete team: the team, once the person has shown they may delete it. Only an Owner, never a personal team, and
 * only with the team's name typed. */
export async function teamToDelete(adapter: TeamStore, person: Person, slug: string, typed: string): Promise<Team> {
  const team = await teamFor(adapter, person, slug);
  if (!team) throw new Error(NOT_A_MEMBER);
  if (team.personal) throw new Error(PERSONAL_TEAM_KEPT);
  if (team.role !== "owner") throw new Error(OWNER_TO_DELETE);
  const why = typedProblem(typed, team.name, "the team's name");
  if (why) throw new Error(why);
  return team;
}

/** The team's own rows: its invitations, its memberships and the team. Run after its businesses are removed from the
 * store, so nothing is left that no team owns. */
export async function deleteTeamRows(adapter: TeamStore, teamId: string): Promise<void> {
  await adapter.delete({ model: "invitation", where: [{ field: "organizationId", value: teamId }] });
  await adapter.delete({ model: "member", where: [{ field: "organizationId", value: teamId }] });
  await adapter.delete({ model: "organization", where: [{ field: "id", value: teamId }] });
}

/** A4 Delete account: what happens to each of the person's teams. `remove`: deleted with every business in it (their
 * personal team, and any team where nobody else is). `leave`: they leave it, and it carries on (another Owner remains,
 * or they are not an Owner). `blocked`: they are its only Owner and other people are on it, so it would be left with no
 * Owner; they make someone else an Owner, or delete the team, first. */
export type AccountPlan = { remove: Team[]; leave: Team[]; blocked: Team[] };

export const ACCOUNT_BLOCKED = (names: string[]) =>
  `You are the only Owner of ${names.join(", ")}, and other people are on ${names.length === 1 ? "it" : "them"}. Make someone else an Owner, or delete ${names.length === 1 ? "the team" : "those teams"}, first.`;

export async function accountPlan(adapter: TeamStore, person: Person): Promise<AccountPlan> {
  const plan: AccountPlan = { remove: [], leave: [], blocked: [] };
  for (const team of await teamsOf(adapter, person)) {
    if (team.personal) { plan.remove.push(team); continue; }
    const rows = await membersRows(adapter, team.id);
    const others = rows.some((m) => m.userId !== person.id);
    const owners = ownerIds(rows);
    if (!others) plan.remove.push(team);
    else if (owners.has(person.id) && owners.size === 1) plan.blocked.push(team);
    else plan.leave.push(team);
  }
  return plan;
}

/** The address a deleted account keeps when its row cannot be removed: no one can sign in with it, and the person's
 * own address is free again. */
export const erasedEmail = (id: string) => `deleted-${id.toLowerCase().replace(/[^a-z0-9-]/g, "")}@deleted.invalid`;

/** A4: the account's own rows, once its teams are dealt with. Its memberships, sessions and sign-in methods go, its
 * open invitations are revoked, and the AI apps it allowed lose their tokens. Then the user row goes; where other
 * records still point at it (history that is never rewritten), it stays with no name, no address and no way in. */
export async function eraseAccount(adapter: TeamStore, person: Person): Promise<"deleted" | "anonymized"> {
  await adapter.delete({ model: "member", where: [{ field: "userId", value: person.id }] });
  for (const r of await adapter.findMany<InvitationRow>({ model: "invitation", where: [{ field: "inviterId", value: person.id }] })) {
    if (r.status === "pending") await adapter.update({ model: "invitation", where: [{ field: "id", value: r.id }], update: { status: "canceled" } });
  }
  await adapter.delete({ model: "session", where: [{ field: "userId", value: person.id }] });
  await adapter.delete({ model: "account", where: [{ field: "userId", value: person.id }] });
  // The OAuth server's tokens for a person's own AI (@better-auth/oauth-provider); a store without them skips them.
  for (const model of ["oauthRefreshToken", "oauthAccessToken", "oauthConsent"]) {
    try { await adapter.delete({ model, where: [{ field: "userId", value: person.id }] }); } catch { /* no such table here */ }
  }
  try {
    await adapter.delete({ model: "user", where: [{ field: "id", value: person.id }] });
    if (!(await adapter.findOne<UserRow>({ model: "user", where: [{ field: "id", value: person.id }] }))) return "deleted";
  } catch { /* rows that are never deleted still point at the person */ }
  await adapter.update({ model: "user", where: [{ field: "id", value: person.id }], update: { email: erasedEmail(person.id), name: "Deleted account", image: null, emailVerified: false, updatedAt: new Date() } });
  return "anonymized";
}
