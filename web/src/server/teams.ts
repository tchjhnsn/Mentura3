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
import { canSendMail, sendMail } from "./mail";
import { siteUrl } from "./site";
import {
  acceptInvitation, changeMemberRole, createTeam, declineInvitation, invitationView, inviteToTeam, leaveTeam, NOT_A_MEMBER, personalTeamName,
  removeMember, resendInvitation, revokeInvitation, roleLabel, teamPeople, teamsOf, updateTeam,
  type Invitation, type InvitationView, type Team, type TeamPeople, type TeamRole, type TeamStore,
} from "./teams-core";

export type { Invitation, InvitationView, Team, TeamMember, TeamPeople, TeamRole } from "./teams-core";

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
  return onTeams((a) => createTeam(a, p, name));
}

/** Runs one change on the teams' tables, saying so plainly when the tables are not made yet. */
async function onTeams<T>(f: (a: TeamStore) => Promise<T>): Promise<T> {
  try {
    return await f(await adapter());
  } catch (e) {
    if (missingTables(e)) throw new Error("Teams are not set up on this site yet.");
    throw e;
  }
}

/** T5 General: rename the team or change its URL (Owners only). */
export async function changeTeam(p: Person, slug: string, change: { name: string; slug: string }): Promise<Team> {
  return onTeams((a) => updateTeam(a, p, slug, change));
}

/** T4 Members: the team's people, and its open invitations for an Owner. */
export async function peopleOf(p: Person, slug: string): Promise<TeamPeople> {
  return onTeams((a) => teamPeople(a, p, slug));
}

/** An invitation's own page (A3), which is its link. */
export const invitationLink = (id: string) => `${siteUrl()}/invite/${encodeURIComponent(id)}`;

/** What Invite answers: the invitation, its link to copy, and whether the email went out. Mail goes only when this
 * deployment can send it (RESEND_API_KEY and REFLECT_MAIL_FROM, ./mail.ts); otherwise the Owner copies the link. */
export type Invited = { invitation: Invitation; link: string; emailed: boolean; again: boolean };

async function mailInvitation(p: Person, team: Team, invitation: Invitation, link: string): Promise<boolean> {
  if (!canSendMail()) return false;
  const role = roleLabel(invitation.role);
  const text = [
    `${p.name} invited you to join ${team.name} on Mentura as a ${role}.`,
    "",
    `Open this link to accept or decline: ${link}`,
    "",
    `The invitation lasts until ${new Date(invitation.expiresAt).toUTCString()}. If you did not expect it, you can ignore this email.`,
  ].join("\n");
  return sendMail(invitation.email, `${p.name} invited you to ${team.name} on Mentura`, text);
}

/** T4 and D3 Invite (Owners only). */
export async function invitePerson(p: Person, slug: string, ask: { email: string; role: TeamRole }): Promise<Invited> {
  const { team, invitation, again } = await onTeams((a) => inviteToTeam(a, p, slug, ask));
  const link = invitationLink(invitation.id);
  return { invitation, link, emailed: await mailInvitation(p, team, invitation, link), again };
}

/** Pending, Send again (Owners only): a fresh 7 days, and the email again when mail is set up. */
export async function sendInvitationAgain(p: Person, slug: string, id: string): Promise<Invited> {
  const { team, invitation } = await onTeams((a) => resendInvitation(a, p, slug, id));
  const link = invitationLink(invitation.id);
  return { invitation, link, emailed: await mailInvitation(p, team, invitation, link), again: true };
}

/** Pending, Revoke (Owners only). */
export async function withdrawInvitation(p: Person, slug: string, id: string): Promise<void> {
  return onTeams((a) => revokeInvitation(a, p, slug, id));
}

/** C44 Role menu (Owners only). */
export async function setMemberRole(p: Person, slug: string, memberId: string, role: TeamRole): Promise<void> {
  return onTeams((a) => changeMemberRole(a, p, slug, memberId, role));
}

/** Members, Remove (Owners only). */
export async function takeOffTeam(p: Person, slug: string, memberId: string): Promise<void> {
  return onTeams((a) => removeMember(a, p, slug, memberId));
}

/** D4 Leave team. */
export async function leave(p: Person, slug: string): Promise<Team> {
  return onTeams((a) => leaveTeam(a, p, slug));
}

/** A3: the invitation as whoever opens its link sees it, or null when there is no such invitation. */
export async function invitationFor(id: string, p: Person | null): Promise<InvitationView | null> {
  try {
    return await invitationView(await adapter(), id, p);
  } catch (e) {
    if (missingTables(e)) return null;
    throw e;
  }
}

/** A3 Accept. */
export async function accept(p: Person, id: string): Promise<Team> {
  return onTeams((a) => acceptInvitation(a, p, id));
}

/** A3 Decline. */
export async function decline(p: Person, id: string): Promise<void> {
  return onTeams((a) => declineInvitation(a, p, id));
}
