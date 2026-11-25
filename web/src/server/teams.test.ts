// Teams (doc "Mentura console: screens, navigation and teams", 2026-11-25) on Better Auth's in-memory store, with
// Reflect's own auth options (./auth-options.ts): sign-up makes the personal team with the person's id, and the rules in
// ./teams-core.ts for listing, finding, creating and renaming teams.
import { describe, expect, it } from "vitest";
import { betterAuth } from "better-auth";
import { memoryAdapter } from "better-auth/adapters/memory";
import { getAuthTables } from "better-auth/db";
import { reflectAuthOptions } from "./auth-options";
import {
  createTeam, ensurePersonalTeam, personalTeamName, RESERVED_TEAM_SLUGS, roleOf, slugify, teamFor, teamsOf, teamSlugProblem, updateTeam,
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
  return ((await res.json()) as { user: { id: string; name: string } }).user;
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
