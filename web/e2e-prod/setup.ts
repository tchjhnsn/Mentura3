// Signs two fresh accounts up before the production check runs, and removes every account earlier runs left (README.md
// beside this file; doc "Mentura console: screens, navigation and teams", 2026-11-25, "End-to-end tests for an empty
// console").
//
// Each run makes an Owner (production-check+<run>@mentura.xyz) and an invitee (production-check+<run>-invitee@...)
// through the site's own sign-up, so every run starts from an empty console. Their passwords are never stored: setup
// signs each in and keeps only the session cookies under test-results/ (which git ignores), and the run's two addresses
// in <state>.run.json for the specs.
//
// Cleanup (here, before the run, and in teardown.ts after it, even when a test failed): every account on a check
// address (the run accounts and the two standing accounts earlier rounds used) is deleted through the app's own Delete
// account (DELETE /api/account, A4), which deletes their teams and businesses with them. To sign an old account in, its
// password is reset through the identity database's owner, as the standing accounts' were. First the check accounts'
// places on each other's teams are taken off (rows of check accounts only), so no team holds a deletion back.
//
// The identity database comes from PROD_CHECK_DATABASE_URL, or from the Neon API with NEON_API_KEY, NEON_PROJECT_ID and
// NEON_BRANCH_ID (database neondb, role neondb_owner). Neither is ever printed.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { randomBytes } from "node:crypto";
import { request, type APIRequestContext, type FullConfig } from "@playwright/test";
import { hashPassword } from "better-auth/crypto";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

/** The check's address: each run's accounts add +<run> to it. */
export const CHECK_EMAIL = process.env.PROD_CHECK_EMAIL ?? "production-check@mentura.xyz";
export const CHECK_NAME = "Mentura production check";
export const EMPTY_NAME = "Empty console check";
const [LOCAL, DOMAIN] = CHECK_EMAIL.split("@") as [string, string];
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
/** Every address the check has used: each run's (+<run>, +<run>-invitee) and the standing accounts of earlier rounds
 * (the check address itself and <local>-empty@). Nothing else is ever cleaned up. */
const CHECK_ADDRESS = new RegExp(`^${escape(LOCAL)}(\\+[a-z0-9-]+|-empty)?@${escape(DOMAIN)}$`, "i");
export const isCheckAddress = (email: string) => CHECK_ADDRESS.test(email);

/** Where the invitee's two sessions are kept, beside the Owner's. */
export const emptyState = (statePath: string) => statePath.replace(/\.json$/, "") + ".empty.json";
export const signOutState = (statePath: string) => statePath.replace(/\.json$/, "") + ".empty-sign-out.json";
const runFile = (statePath: string) => statePath.replace(/\.json$/, "") + ".run.json";

export type RunAccounts = { run: string; owner: string; invitee: string };
/** This run's two addresses, which setup wrote. */
export function runAccounts(statePath = process.env.PROD_CHECK_STATE ?? "test-results/prod/state.json"): RunAccounts {
  return JSON.parse(readFileSync(runFile(statePath), "utf8")) as RunAccounts;
}

/** The owner's connection to one of the production branch's databases, from the Neon API. */
async function ownerUrl(database: string): Promise<string> {
  const { NEON_API_KEY: key, NEON_PROJECT_ID: project, NEON_BRANCH_ID: branch } = process.env;
  if (!key || !project || !branch) throw new Error(`set NEON_API_KEY, NEON_PROJECT_ID and NEON_BRANCH_ID to reach ${database}`);
  const q = new URLSearchParams({ branch_id: branch, database_name: database, role_name: "neondb_owner", pooled: "false" });
  const r = await fetch(`https://console.neon.tech/api/v2/projects/${project}/connection_uri?${q}`, { headers: { authorization: `Bearer ${key}` } });
  if (!r.ok) throw new Error(`the Neon API answered ${r.status} for ${database}`);
  return ((await r.json()) as { uri: string }).uri;
}

export const identityDb = async () => new Pool({ connectionString: process.env.PROD_CHECK_DATABASE_URL ?? (await ownerUrl("neondb")) });
export const apiFor = (baseURL: string) => request.newContext({ baseURL, extraHTTPHeaders: { origin: new URL(baseURL).origin } });

/** Makes an account through the site's own sign-up and returns its password. */
async function signUp(api: APIRequestContext, email: string, name: string): Promise<string> {
  const password = randomBytes(24).toString("base64url");
  const r = await api.post("/api/auth/sign-up/email", { data: { email, password, name, adult: true } });
  if (!r.ok()) throw new Error(`sign-up of ${name} answered ${r.status()}`);
  return password;
}

/** Gives an existing account a fresh random password through the identity database's owner, or null when it has no
 * password sign-in. */
async function resetPassword(db: Pool, userId: string): Promise<string | null> {
  const password = randomBytes(24).toString("base64url");
  const set = await db.query(`update account set password = $1, "updatedAt" = now() where "userId" = $2 and "providerId" = 'credential'`, [await hashPassword(password), userId]);
  return set.rowCount === 1 ? password : null;
}

/** Signs in as a new session and returns the context holding its cookies. */
async function session(baseURL: string, email: string, password: string): Promise<APIRequestContext> {
  // Better Auth refuses a POST whose Origin is not a trusted origin.
  const api = await apiFor(baseURL);
  const r = await api.post("/api/auth/sign-in/email", { data: { email, password } });
  if (!r.ok()) {
    const message = String((await r.json().catch(() => ({}))).message ?? "");
    await api.dispose();
    throw new Error(`sign-in of ${email.split("@")[0]} answered ${r.status()}: ${message}`);
  }
  return api;
}

async function signIn(baseURL: string, email: string, password: string, path: string) {
  const api = await session(baseURL, email, password);
  try {
    mkdirSync(dirname(path), { recursive: true });
    await api.storageState({ path });
  } finally {
    await api.dispose();
  }
}

/** Deletes every account on a check address through the app's Delete account, with their teams and businesses. One
 * that cannot be deleted is named and left, so one stuck account never stops the check. */
export async function removeCheckAccounts(baseURL: string, db: Pool): Promise<{ deleted: string[]; failed: string[] }> {
  const found = (await db.query<{ id: string; email: string }>(`select id, email from "user" where email ilike $1`, [`${LOCAL}%@${DOMAIN}`])).rows
    .filter((u) => isCheckAddress(u.email));
  const out = { deleted: [] as string[], failed: [] as string[] };
  if (!found.length) return out;
  // A check account's place on another check account's team (an invitee a failed run left there) would hold that
  // team's Owner back; only those member rows are taken off.
  await db.query(`delete from "member" where "userId" = any($1) and role <> 'owner' and "organizationId" <> "userId"`, [found.map((u) => u.id)]);
  for (const u of found) {
    const who = u.email.split("@")[0]!;
    try {
      const password = await resetPassword(db, u.id);
      if (!password) throw new Error("it has no password sign-in");
      const api = await session(baseURL, u.email, password);
      try {
        const r = await api.delete("/api/account", { data: { confirm: u.email }, timeout: 300_000 });
        if (!r.ok()) throw new Error(`Delete account answered ${r.status()}: ${String((await r.json().catch(() => ({}))).error ?? "")}`);
      } finally {
        await api.dispose();
      }
      out.deleted.push(who);
    } catch (e) {
      out.failed.push(who);
      console.warn(`cleanup: ${who} was not deleted: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  return out;
}

export default async function setup(config: FullConfig) {
  const use = config.projects[0]!.use;
  const baseURL = String(use.baseURL);
  const statePath = String(use.storageState);
  const db = await identityDb();
  const api = await apiFor(baseURL);
  try {
    const swept = await removeCheckAccounts(baseURL, db);
    if (swept.deleted.length || swept.failed.length) console.log(`cleanup before the run: ${swept.deleted.length} account(s) deleted, ${swept.failed.length} left`);
    const run = `${Date.now().toString(36)}${randomBytes(2).toString("hex")}`;
    const accounts: RunAccounts = { run, owner: `${LOCAL}+${run}@${DOMAIN}`, invitee: `${LOCAL}+${run}-invitee@${DOMAIN}` };
    const ownerPassword = await signUp(api, accounts.owner, CHECK_NAME);
    const inviteePassword = await signUp(api, accounts.invitee, EMPTY_NAME);
    mkdirSync(dirname(statePath), { recursive: true });
    writeFileSync(runFile(statePath), JSON.stringify(accounts));
    await signIn(baseURL, accounts.owner, ownerPassword, statePath);
    // The invitee's console stays empty until members.spec.ts adds it to a team, and E9 takes it off again. Two
    // sessions: E3 signs one out and the other tests keep theirs.
    await signIn(baseURL, accounts.invitee, inviteePassword, emptyState(statePath));
    await signIn(baseURL, accounts.invitee, inviteePassword, signOutState(statePath));
  } finally {
    await db.end();
    await api.dispose();
  }
}
