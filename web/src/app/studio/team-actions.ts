"use server";
// The console's team actions (doc "Mentura console: screens, navigation and teams", 2026-11-25): the switcher's list of
// teams (D1), Create team (D2), the team's General settings (T5), Members (T4: invite, roles, remove), Leave team (D4)
// the invitation page (A3), Transfer business (D5) and Delete team (D6). Each checks the signed-in person on the server, and src/server/teams-core.ts checks
// their role: only an Owner invites, changes roles or removes people.
import { revalidatePath } from "next/cache";
import {
  accept, changeTeam, consolePerson, decline, invitePerson, landingTeam, leave, newTeam, peopleOf, sendInvitationAgain, setMemberRole, takeOffTeam,
  teamsFor, withdrawInvitation, type Invited, type Team, type TeamPeople, type TeamRole,
} from "@/server/teams";
import { deleteTeam, transferBusiness } from "@/server/moving";
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

/** T4 Members: the team's people, and its open invitations for an Owner. Anyone on the team may read it. */
export async function teamPeopleAction(team: string): Promise<Result<TeamPeople>> {
  return attempt(async () => peopleOf(await person(), team));
}

/** T4 and D3 Invite: an invitation by email with a role, mailed when this site can send mail. Owners only. */
export async function inviteAction(team: string, ask: { email: string; role: TeamRole }): Promise<Result<Invited>> {
  return attempt(async () => {
    const r = await invitePerson(await person(), team, ask);
    revalidatePath(`/studio/${team}/members`);
    return r;
  });
}

/** Pending, Send again: a fresh 7 days for an invitation. Owners only. */
export async function resendInvitationAction(team: string, id: string): Promise<Result<Invited>> {
  return attempt(async () => sendInvitationAgain(await person(), team, id));
}

/** Pending, Revoke: the invitation's link stops working. Owners only. */
export async function revokeInvitationAction(team: string, id: string): Promise<Result<null>> {
  return attempt(async () => { await withdrawInvitation(await person(), team, id); return null; });
}

/** C44 Role menu: change someone's role on the team. Owners only, and the team keeps an Owner. */
export async function changeRoleAction(team: string, memberId: string, role: TeamRole): Promise<Result<null>> {
  return attempt(async () => { await setMemberRole(await person(), team, memberId, role); return null; });
}

/** Members, Remove: take someone off the team. Owners only. */
export async function removeMemberAction(team: string, memberId: string): Promise<Result<null>> {
  return attempt(async () => { await takeOffTeam(await person(), team, memberId); return null; });
}

/** D4 Leave team: the person leaves, and the console opens their personal team. */
export async function leaveTeamAction(team: string): Promise<Result<{ home: string }>> {
  return attempt(async () => {
    const p = await person();
    await leave(p, team);
    const home = (await teamsFor(p)).find((t) => t.personal);
    return { home: home?.slug ?? "" };
  });
}

/** A3 Accept: join the team the invitation is for, and open it. */
export async function acceptInvitationAction(id: string): Promise<Result<{ team: string }>> {
  return attempt(async () => ({ team: (await accept(await person(), id)).slug }));
}

/** A3 Decline: the invitation ends, and the console opens the person's own team. */
export async function declineInvitationAction(id: string): Promise<Result<{ home: string }>> {
  return attempt(async () => {
    const p = await person();
    await decline(p, id);
    return { home: (await landingTeam(p)).slug };
  });
}

/** D5 Transfer: the business, with every record and file, moves to another team the person owns, and opens there. An
 * Owner of both teams only (src/server/teams-core.ts, then the business store checks again). */
export async function transferBusinessAction(team: string, venture: string, to: string): Promise<Result<{ team: string; venture: string }>> {
  return attempt(async () => {
    const r = await transferBusiness(team, venture, to);
    revalidatePath(`/studio/${team}`, "layout");
    revalidatePath(`/studio/${r.team}`, "layout");
    return r;
  });
}

/** D6 Delete team: an Owner, with the team's name typed. Every business in it goes, then the team. The console opens
 * the person's personal team. */
export async function deleteTeamAction(team: string, typed: string): Promise<Result<{ home: string }>> {
  return attempt(async () => deleteTeam(team, typed));
}
