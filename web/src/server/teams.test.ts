// Teams (doc "Mentura console: screens, navigation and teams", 2026-11-25) on Better Auth's in-memory store, with
// Reflect's own auth options (./auth-options.ts): sign-up makes the personal team with the person's id, and the rules in
// ./teams-core.ts for listing, finding, creating and renaming teams.
import { describe, expect, it } from "vitest";
import { betterAuth } from "better-auth";
import { memoryAdapter } from "better-auth/adapters/memory";
import { getAuthTables } from "better-auth/db";
import { reflectAuthOptions } from "./auth-options";
import {
  acceptInvitation, changeMemberRole, createTeam, declineInvitation, ensurePersonalTeam, invitationState, invitationView, inviteEmailProblem,
  inviteToTeam, LAST_OWNER, LAST_OWNER_LEAVE, leaveTeam, NOT_A_MEMBER, OWNER_ONLY_PEOPLE, PERSONAL_TEAM_KEPT, personalTeamName, removeMember,
  resendInvitation, RESERVED_TEAM_SLUGS, revokeInvitation, roleOf, slugify, teamFor, teamPeople, teamsOf, teamSlugProblem, updateTeam,
  type TeamStore,
} from "./teams-core";

const ORIGIN = "http://localhost:3000";
const SITE = { baseURL: ORIGIN, trustedOrigins: [ORIGIN], resource: `${ORIGIN}/api/mcp` };
const tables = Object.values(getAuthTables(reflectAuthOptions(undefined, SITE))).map((t): [string, unknown[]] => [t.modelName, []]);
const auth = betterAuth({ ...reflectAuthOptions(memoryAdapter(Object.fromEntries(tables)), SITE), rateLimit: { enabled: false }, secret: "test-secret-test-secret-test-secret-0123" });
const store = async (): Promise<TeamStore> => (await auth.$context).adapter;

async function signUp(email: string, name: string) {
  const res = await auth.handler(new Request(`${ORIGIN}/api/auth/sign-up/email`, {
    method: "POST", headers: { "content-type": "application/json", origin: ORIGIN }, body: JSON.stringify({ email, password: "a long password", name, adult: true }),
  }));
  expect(res.status).toBe(200);
  return ((await res.json()) as { user: { id: string; name: string; email: string } }).user;
}

describe("team words", () => {
  it("names a personal team after the person's first name", () => {
    expect(personalTeamName("Torian Johnson")).toBe("Torian's businesses");
    expect(personalTeamName("  ")).toBe("Your businesses");
  });
  it("makes URL slugs and refuses the console's own words", () => {
    expect(slugify("Torian's businesses")).toBe("torians-businesses");
    expect(slugify("Café  Nord!")).toBe("cafe-nord");
    for (const w of RESERVED_TEAM_SLUGS) expect(teamSlugProblem(w), w).not.toBeNull();
    expect(teamSlugProblem("acme")).toBeNull();
    expect(teamSlugProblem("Acme")).not.toBeNull();
    expect(teamSlugProblem("a--b")).not.toBeNull();
  });
  it("reads an unknown role as the least", () => {
    expect(roleOf("owner")).toBe("owner");
    expect(roleOf("admin")).toBe("member");
    expect(roleOf("viewer")).toBe("viewer");
    expect(roleOf("billing")).toBe("viewer");
  });
});

describe("teams on Better Auth", () => {
  it("makes the personal team at sign-up, with the person's id, and the person its Owner", async () => {
    const p = await signUp("ada@example.com", "Ada Lovelace");
    const teams = await teamsOf(await store(), p);
    expect(teams).toEqual([{ id: p.id, name: "Ada's businesses", slug: "adas-businesses", role: "owner", personal: true }]);
  });

  it("gives a second person with the same first name a different URL", async () => {
    const p = await signUp("ada2@example.com", "Ada King");
    const [team] = await teamsOf(await store(), p);
    expect(team?.id).toBe(p.id);
    expect(team?.slug).not.toBe("adas-businesses");
  });

  it("makes a missing personal team once, however often it is asked", async () => {
    const s = await store();
    const p = await signUp("bo@example.com", "Bo");
    await ensurePersonalTeam(s, p);
    await ensurePersonalTeam(s, p);
    expect((await teamsOf(s, p)).filter((t) => t.personal)).toHaveLength(1);
  });

  it("creates a team with its creator as Owner, lists it after the personal team, and hides it from others", async () => {
    const s = await store();
    const owner = await signUp("cy@example.com", "Cy");
    const other = await signUp("di@example.com", "Di");
    const made = await createTeam(s, owner, "Acme");
    expect(made).toMatchObject({ name: "Acme", slug: "acme", role: "owner", personal: false });
    expect((await teamsOf(s, owner)).map((t) => t.name)).toEqual(["Cy's businesses", "Acme"]);
    expect(await teamFor(s, owner, "acme")).toMatchObject({ id: made.id });
    // Isolation (E7): someone who is not on the team cannot find it by its URL.
    expect(await teamFor(s, other, "acme")).toBeNull();
    expect(await teamFor(s, other, (await teamsOf(s, owner))[0]!.slug)).toBeNull();
    expect((await createTeam(s, owner, "Acme")).slug).toBe("acme-2");
    await expect(createTeam(s, owner, "  ")).rejects.toThrow("Give the team a name.");
  });

  it("lets only an Owner rename a team or change its URL, to one that is free and allowed", async () => {
    const s = await store();
    const owner = await signUp("ed@example.com", "Ed");
    const viewer = await signUp("fa@example.com", "Fa");
    const team = await createTeam(s, owner, "Bakery");
    await s.create({ model: "member", data: { organizationId: team.id, userId: viewer.id, role: "viewer", createdAt: new Date() } });
    expect(await teamFor(s, viewer, "bakery")).toMatchObject({ role: "viewer" });
    await expect(updateTeam(s, viewer, "bakery", { name: "Mine", slug: "mine" })).rejects.toThrow("Only an Owner");
    await expect(updateTeam(s, owner, "bakery", { name: "Bakery", slug: "settings" })).rejects.toThrow("console uses");
    await expect(updateTeam(s, owner, "bakery", { name: "Bakery", slug: "acme" })).rejects.toThrow("already has that URL");
    expect(await updateTeam(s, owner, "bakery", { name: "Corner Bakery", slug: "corner-bakery" })).toMatchObject({ name: "Corner Bakery", slug: "corner-bakery" });
    expect(await teamFor(s, owner, "bakery")).toBeNull();
  });
});

const DAY = 24 * 60 * 60 * 1000;

describe("invitations and members (round 3)", () => {
  it("checks addresses and reads Better Auth's statuses as Mentura's states", () => {
    expect(inviteEmailProblem(" Ada@Example.com ")).toBeNull();
    expect(inviteEmailProblem("ada")).not.toBeNull();
    expect(inviteEmailProblem("")).toBe("Give an email address.");
    const now = new Date("2026-11-25T00:00:00Z");
    expect(invitationState({ status: "pending", expiresAt: new Date(now.getTime() + DAY) }, now)).toBe("pending");
    expect(invitationState({ status: "pending", expiresAt: new Date(now.getTime() - 1) }, now)).toBe("expired");
    expect(invitationState({ status: "rejected", expiresAt: now }, now)).toBe("declined");
    expect(invitationState({ status: "canceled", expiresAt: now }, now)).toBe("revoked");
    expect(invitationState({ status: "accepted", expiresAt: now }, now)).toBe("accepted");
  });

  it("E6: an Owner invites by email, the invitee sees the offer, accepts and lands on the team as its role", async () => {
    const s = await store();
    const owner = await signUp("gil@example.com", "Gil Owner");
    const guest = await signUp("hal@example.com", "Hal");
    const team = await createTeam(s, owner, "Harbor");
    const { invitation, again } = await inviteToTeam(s, owner, "harbor", { email: "HAL@example.com", role: "member" });
    expect(again).toBe(false);
    expect(invitation).toMatchObject({ email: "hal@example.com", role: "member", state: "pending", inviter: "Gil Owner" });
    expect(new Date(invitation.expiresAt).getTime() - new Date(invitation.sentAt).getTime()).toBe(7 * DAY);

    // Signed out, the link shows the team, the inviter and the role, and not the team's URL.
    expect(await invitationView(s, invitation.id, null)).toMatchObject({ teamName: "Harbor", teamSlug: null, inviter: "Gil Owner", role: "member", forYou: null, member: false });
    expect(await invitationView(s, invitation.id, guest)).toMatchObject({ forYou: true, state: "pending" });

    // Inviting the same address again renews the one invitation rather than making a second.
    const renewed = await inviteToTeam(s, owner, "harbor", { email: "hal@example.com", role: "viewer" });
    expect(renewed.again).toBe(true);
    expect(renewed.invitation.id).toBe(invitation.id);
    expect((await teamPeople(s, owner, "harbor")).invitations.map((i) => [i.email, i.role])).toEqual([["hal@example.com", "viewer"]]);
    await inviteToTeam(s, owner, "harbor", { email: "hal@example.com", role: "member" });

    const joined = await acceptInvitation(s, guest, invitation.id);
    expect(joined).toMatchObject({ id: team.id, slug: "harbor", role: "member", personal: false });
    expect((await teamsOf(s, guest)).map((t) => [t.name, t.role])).toEqual([["Hal's businesses", "owner"], ["Harbor", "member"]]);
    // Accepting twice adds nobody, and the invitation is no longer pending.
    expect(await acceptInvitation(s, guest, invitation.id)).toMatchObject({ slug: "harbor" });
    const people = await teamPeople(s, owner, "harbor");
    expect(people.members.map((m) => [m.name, m.role])).toEqual([["Gil Owner", "owner"], ["Hal", "member"]]);
    expect(people.invitations).toEqual([]);
    expect(await invitationView(s, invitation.id, guest)).toMatchObject({ member: true, teamSlug: "harbor", state: "accepted" });
    await expect(inviteToTeam(s, owner, "harbor", { email: "hal@example.com", role: "member" })).rejects.toThrow("already on this team");
  });

  it("refuses an invitation to the wrong account, and one that expired, was revoked or was declined", async () => {
    const s = await store();
    const owner = await signUp("ivy@example.com", "Ivy");
    const jo = await signUp("jo@example.com", "Jo");
    const kim = await signUp("kim@example.com", "Kim");
    await createTeam(s, owner, "Kiln");
    const now = new Date();
    const forJo = (await inviteToTeam(s, owner, "kiln", { email: "jo@example.com", role: "member" }, now)).invitation;
    expect(await invitationView(s, forJo.id, kim)).toMatchObject({ forYou: false });
    await expect(acceptInvitation(s, kim, forJo.id)).rejects.toThrow("This invitation is for jo@example.com");
    await expect(acceptInvitation(s, jo, forJo.id, new Date(now.getTime() + 8 * DAY))).rejects.toThrow("expired");
    // Send again gives it a fresh 7 days.
    const later = new Date(now.getTime() + 8 * DAY);
    expect((await resendInvitation(s, owner, "kiln", forJo.id, later)).invitation.state).toBe("pending");
    await revokeInvitation(s, owner, "kiln", forJo.id);
    await expect(acceptInvitation(s, jo, forJo.id)).rejects.toThrow("withdrawn");
    expect(await invitationView(s, forJo.id, jo)).toMatchObject({ state: "revoked" });

    const forKim = (await inviteToTeam(s, owner, "kiln", { email: "kim@example.com", role: "viewer" })).invitation;
    await declineInvitation(s, kim, forKim.id);
    expect(await teamFor(s, kim, "kiln")).toBeNull();
    await expect(acceptInvitation(s, kim, forKim.id)).rejects.toThrow("declined");
    await expect(acceptInvitation(s, kim, "no-such-invitation")).rejects.toThrow("does not exist");
  });

  it("lets only an Owner invite, change roles or remove, and always keeps an Owner (E8)", async () => {
    const s = await store();
    const owner = await signUp("lu@example.com", "Lu");
    const mo = await signUp("mo@example.com", "Mo");
    const ned = await signUp("ned@example.com", "Ned");
    const team = await createTeam(s, owner, "Loom");
    for (const [p, role] of [[mo, "member"], [ned, "viewer"]] as const) {
      const inv = (await inviteToTeam(s, owner, "loom", { email: p.email, role })).invitation;
      await acceptInvitation(s, p, inv.id);
    }
    const people = await teamPeople(s, mo, "loom");
    // A Member reads the list but sees no invitations.
    expect(people.members.map((m) => m.role)).toEqual(["owner", "member", "viewer"]);
    expect(people.invitations).toEqual([]);
    const id = (name: string) => people.members.find((m) => m.name === name)!.id;

    await expect(inviteToTeam(s, mo, "loom", { email: "x@example.com", role: "member" })).rejects.toThrow(OWNER_ONLY_PEOPLE);
    await expect(changeMemberRole(s, mo, "loom", id("Ned"), "owner")).rejects.toThrow(OWNER_ONLY_PEOPLE);
    await expect(removeMember(s, ned, "loom", id("Mo"))).rejects.toThrow(OWNER_ONLY_PEOPLE);
    await expect(teamPeople(s, await signUp("out@example.com", "Out"), "loom")).rejects.toThrow(NOT_A_MEMBER);

    // E8: the Owner makes the Member a Viewer.
    await changeMemberRole(s, owner, "loom", id("Mo"), "viewer");
    expect(await teamFor(s, mo, "loom")).toMatchObject({ role: "viewer" });
    // The only Owner cannot step down, be removed, or leave.
    await expect(changeMemberRole(s, owner, "loom", id("Lu"), "member")).rejects.toThrow(LAST_OWNER);
    await expect(removeMember(s, owner, "loom", id("Lu"))).rejects.toThrow(LAST_OWNER);
    await expect(leaveTeam(s, owner, "loom")).rejects.toThrow(LAST_OWNER_LEAVE);
    // With a second Owner, the first may step down.
    await changeMemberRole(s, owner, "loom", id("Ned"), "owner");
    await changeMemberRole(s, owner, "loom", id("Lu"), "member");
    expect(await teamFor(s, owner, "loom")).toMatchObject({ role: "member" });
    await changeMemberRole(s, ned, "loom", id("Lu"), "owner");

    await removeMember(s, owner, "loom", id("Mo"));
    expect(await teamFor(s, mo, "loom")).toBeNull();
    expect((await teamsOf(s, mo)).map((t) => t.id)).not.toContain(team.id);
  });

  it("D4 and E9: a member leaves and the team is gone from their list; a personal team cannot be left or have its person demoted", async () => {
    const s = await store();
    const owner = await signUp("ola@example.com", "Ola");
    const pat = await signUp("pat@example.com", "Pat");
    await createTeam(s, owner, "Pier");
    await acceptInvitation(s, pat, (await inviteToTeam(s, owner, "pier", { email: "pat@example.com", role: "member" })).invitation.id);
    expect((await leaveTeam(s, pat, "pier")).name).toBe("Pier");
    expect((await teamsOf(s, pat)).map((t) => t.name)).toEqual(["Pat's businesses"]);
    await expect(leaveTeam(s, pat, "pier")).rejects.toThrow(NOT_A_MEMBER);

    const personal = (await teamsOf(s, owner))[0]!;
    await expect(leaveTeam(s, owner, personal.slug)).rejects.toThrow(PERSONAL_TEAM_KEPT);
    await acceptInvitation(s, pat, (await inviteToTeam(s, owner, personal.slug, { email: "pat@example.com", role: "owner" })).invitation.id);
    const ola = (await teamPeople(s, owner, personal.slug)).members.find((m) => m.userId === owner.id)!;
    expect(ola.kept).toBe(true);
    await expect(changeMemberRole(s, pat, personal.slug, ola.id, "member")).rejects.toThrow("stays its Owner");
    await expect(removeMember(s, pat, personal.slug, ola.id)).rejects.toThrow(PERSONAL_TEAM_KEPT);
  });
});
