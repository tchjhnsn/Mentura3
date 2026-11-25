import "server-only";
// Moving and removing (doc "Mentura console: screens, navigation and teams", 2026-11-25, round 4): D5 Transfer a
// business to another team you own, D6 Delete team, A4 Delete account. The rules on who may are in ./teams-core.ts; the
// businesses themselves move or go in the business store through ./naive.ts (packages/platform/hosted/store-child.ts).
//
// Each move is also kept in business_move (migration 0071), so a link to the business in its old team opens it in its
// new one for anyone on that team. A site without the table still moves the business; only that redirect is missing.
import { db } from "@/db/pool";
import { moveInStore, removeFromStore } from "./naive";
import { setDefaultAudience, setHandle } from "./profile-store";
import { OWNER_ID } from "./session";
import { accountPlanFor, consolePerson, deleteTeamCheck, dropTeamRows, eraseAccountRows, teamsFor, transferCheck, type AccountPlan, type Person, type Team } from "./teams";
import { ACCOUNT_BLOCKED, typedProblem } from "./teams-core";

const missingTable = (e: unknown) => typeof e === "object" && e !== null && "code" in e && String((e as { code: unknown }).code) === "42P01";

async function signedIn(): Promise<Person> {
  const p = await consolePerson();
  if (!p) throw new Error("Sign in to use the console.");
  return p;
}

/** D5 Transfer: the business, with every record and file, moves from one team to another the person owns. */
export async function transferBusiness(fromSlug: string, venture: string, toSlug: string): Promise<{ team: string; venture: string }> {
  const person = await signedIn();
  const { from, to } = await transferCheck(person, fromSlug, toSlug);
  await moveInStore(person, from, to, venture);
  try {
    await db().query("INSERT INTO business_move (venture, from_team, to_team, moved_by) VALUES ($1, $2, $3, $4)", [venture, from.id, to.id, person.id]);
  } catch (e) {
    // The business moved; without the table its old link does not follow it.
    if (!missingTable(e)) console.error("business_move: the move was not recorded", e instanceof Error ? e.message : "");
  }
  return { team: to.slug, venture };
}

/** Where a business that left this team went: the team, when the person is on it; "elsewhere" when they are not; null
 * when it never moved from here. */
export async function movedFrom(person: Person, team: Team, venture: string): Promise<Team | "elsewhere" | null> {
  let to: string | null = null;
  try {
    const r = await db().query<{ to_team: string }>("SELECT to_team FROM business_move WHERE from_team = $1 AND venture = $2 ORDER BY moved_at DESC, id DESC LIMIT 1", [team.id, venture]);
    to = r.rows[0]?.to_team ?? null;
  } catch (e) {
    if (missingTable(e)) return null;
    throw e;
  }
  if (!to) return null;
  return (await teamsFor(person)).find((t) => t.id === to) ?? "elsewhere";
}

/** D6 Delete team: its businesses leave the store, then the team, its memberships and its invitations go. */
export async function deleteTeam(slug: string, typed: string): Promise<{ home: string }> {
  const person = await signedIn();
  const team = await deleteTeamCheck(person, slug, typed);
  await removeFromStore(person, team);
  await dropTeamRows(team.id);
  const home = (await teamsFor(person)).find((t) => t.personal);
  return { home: home?.slug ?? "" };
}

/** A4: what deleting the account would do to each of the person's teams. */
export async function accountDeletionPlan(): Promise<{ email: string; plan: AccountPlan }> {
  const person = await signedIn();
  return { email: person.email, plan: await accountPlanFor(person) };
}

/** A4 Delete account, with the person's email address typed. Teams only they are on go with every business in them;
 * they leave the rest. A team where they are the only Owner and others are on it holds the deletion back. Their
 * command line sign-ins and connected services are revoked, then their account rows go (./teams-core.ts). */
export async function deleteAccount(typed: string): Promise<{ account: "deleted" | "anonymized"; teams: number }> {
  const person = await signedIn();
  if (person.id === OWNER_ID) throw new Error("This site's owner account cannot be deleted.");
  const why = typedProblem(typed, person.email, "your email address");
  if (why) throw new Error(why);
  const plan = await accountPlanFor(person);
  if (plan.blocked.length) throw new Error(ACCOUNT_BLOCKED(plan.blocked.map((t) => t.name)));
  for (const team of plan.remove) {
    await removeFromStore(person, team);
    await dropTeamRows(team.id);
  }
  // Ways in that are not sessions: the command line's tokens and the services the person connected.
  for (const sql of [
    "UPDATE naive_cli_token SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL",
    "UPDATE mcp_connection SET status = 'removed', removed_at = now(), state = NULL, client_ct = NULL, tokens_ct = NULL, verifier_ct = NULL, discovery_ct = NULL WHERE user_id = $1 AND status <> 'removed'",
  ]) {
    try { await db().query(sql, [person.id]); } catch (e) { if (!missingTable(e)) throw e; }
  }
  const account = await eraseAccountRows(person);
  // A row that stays (history points at it) keeps no public profile: no handle, and shown to no one.
  if (account === "anonymized") {
    try { await setHandle(person.id, null); await setDefaultAudience(person.id, "me"); } catch (e) { if (!missingTable(e)) throw e; }
  }
  return { account, teams: plan.remove.length };
}
