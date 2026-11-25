// Signs the standing check account in before the production check runs (README.md beside this file).
//
// The account is one row in the live site's own user table, made once by the site's sign-up and kept: the app has no
// account deletion yet, so a fresh account per run would pile up. Its password is never stored. Each run writes a
// new random password's hash straight to the account row through the identity database's owner, signs in with it,
// and keeps only the session cookie (in PROD_CHECK_STATE, under test-results/, which git ignores).
//
// The identity database comes from PROD_CHECK_DATABASE_URL, or from the Neon API with NEON_API_KEY,
// NEON_PROJECT_ID and NEON_BRANCH_ID (database neondb, role neondb_owner). Neither is ever printed. A second standing
// account, which no test lets make a business, gives the empty console (the business store is append-only, so the
// check account's businesses cannot be removed).
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { randomBytes } from "node:crypto";
import { request, type APIRequestContext, type FullConfig } from "@playwright/test";
import { hashPassword } from "better-auth/crypto";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

export const CHECK_EMAIL = process.env.PROD_CHECK_EMAIL ?? "production-check@mentura.xyz";
export const CHECK_NAME = "Mentura production check";
/** The second standing account, which never makes a business: its console is always empty. */
export const EMPTY_EMAIL = process.env.PROD_CHECK_EMPTY_EMAIL ?? "production-check-empty@mentura.xyz";
export const EMPTY_NAME = "Empty console check";
/** Where the empty account's two sessions are kept, beside the check account's. */
export const emptyState = (statePath: string) => statePath.replace(/\.json$/, "") + ".empty.json";
export const signOutState = (statePath: string) => statePath.replace(/\.json$/, "") + ".empty-sign-out.json";

/** The owner's connection to one of the production branch's databases, from the Neon API. */
async function ownerUrl(database: string): Promise<string> {
  const { NEON_API_KEY: key, NEON_PROJECT_ID: project, NEON_BRANCH_ID: branch } = process.env;
  if (!key || !project || !branch) throw new Error(`set NEON_API_KEY, NEON_PROJECT_ID and NEON_BRANCH_ID to reach ${database}`);
  const q = new URLSearchParams({ branch_id: branch, database_name: database, role_name: "neondb_owner", pooled: "false" });
  const r = await fetch(`https://console.neon.tech/api/v2/projects/${project}/connection_uri?${q}`, { headers: { authorization: `Bearer ${key}` } });
  if (!r.ok) throw new Error(`the Neon API answered ${r.status} for ${database}`);
  return ((await r.json()) as { uri: string }).uri;
}

const identityUrl = async () => process.env.PROD_CHECK_DATABASE_URL ?? ownerUrl("neondb");


/** Gives a standing account a fresh random password through the identity database's owner, making the account
 * through the site's own sign-up the first time, and returns the password. */
async function resetPassword(db: Pool, api: APIRequestContext, email: string, name: string): Promise<string> {
  const password = randomBytes(24).toString("base64url");
  const found = await db.query(`select id from "user" where email = $1`, [email]);
  if (!found.rowCount) {
    const r = await api.post("/api/auth/sign-up/email", { data: { email, password, name, adult: true } });
    if (!r.ok()) throw new Error(`sign-up of ${name} answered ${r.status()}`);
    return password;
  }
  const set = await db.query(`update account set password = $1, "updatedAt" = now() where "userId" = $2 and "providerId" = 'credential'`,
    [await hashPassword(password), found.rows[0].id]);
  if (set.rowCount !== 1) throw new Error(`${name} has no password sign-in`);
  return password;
}

/** Signs in as a new session and saves its cookies to path. */
async function signIn(baseURL: string, email: string, password: string, path: string) {
  // Better Auth refuses a POST whose Origin is not a trusted origin.
  const api = await request.newContext({ baseURL, extraHTTPHeaders: { origin: new URL(baseURL).origin } });
  try {
    const r = await api.post("/api/auth/sign-in/email", { data: { email, password } });
    if (!r.ok()) throw new Error(`sign-in of ${email.split("@")[0]} answered ${r.status()}: ${String((await r.json().catch(() => ({}))).message ?? "")}`);
    mkdirSync(dirname(path), { recursive: true });
    await api.storageState({ path });
  } finally {
    await api.dispose();
  }
}

export default async function setup(config: FullConfig) {
  const use = config.projects[0]!.use;
  const baseURL = String(use.baseURL);
  const statePath = String(use.storageState);
  const api = await request.newContext({ baseURL, extraHTTPHeaders: { origin: new URL(baseURL).origin } });
  const db = new Pool({ connectionString: await identityUrl() });
  try {
    const password = await resetPassword(db, api, CHECK_EMAIL, CHECK_NAME);
    await signIn(baseURL, CHECK_EMAIL, password, statePath);
    // The empty account never makes a business, so its console is always empty (console-empty.spec.ts). Two
    // sessions: E3 signs one out and the other tests keep theirs.
    const empty = await resetPassword(db, api, EMPTY_EMAIL, EMPTY_NAME);
    await signIn(baseURL, EMPTY_EMAIL, empty, emptyState(statePath));
    await signIn(baseURL, EMPTY_EMAIL, empty, signOutState(statePath));
  } finally {
    await db.end();
    await api.dispose();
  }
}
