// Signs the standing check account in before the production check runs (README.md beside this file).
//
// The account is one row in the live site's own user table, made once by the site's sign-up and kept: the app has no
// account deletion yet, so a fresh account per run would pile up. Its password is never stored. Each run writes a
// new random password's hash straight to the account row through the identity database's owner, signs in with it,
// and keeps only the session cookie (in PROD_CHECK_STATE, under test-results/, which git ignores).
//
// The identity database comes from PROD_CHECK_DATABASE_URL, or from the Neon API with NEON_API_KEY,
// NEON_PROJECT_ID and NEON_BRANCH_ID (database neondb, role neondb_owner). Neither is ever printed. Each run also
// empties the account's business store (database mentura_tenants, or PROD_CHECK_TENANTS_URL), so the console starts empty.
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { randomBytes } from "node:crypto";
import { request, type FullConfig } from "@playwright/test";
import { hashPassword } from "better-auth/crypto";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

export const CHECK_EMAIL = process.env.PROD_CHECK_EMAIL ?? "production-check@mentura.xyz";
export const CHECK_NAME = "Mentura production check";
/** Where the second session is kept, beside the first. */
export const signOutState = (statePath: string) => statePath.replace(/\.json$/, "") + ".sign-out.json";

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
const tenantsUrl = async () => process.env.PROD_CHECK_TENANTS_URL ?? ownerUrl("mentura_tenants");

/**
 * Empties the check account's business store, so every run starts from an empty console (doc "Mentura console:
 * screens, navigation and teams", 2026-11-25, tests E1 to E3). Only rows whose tenant is the check account's id are
 * removed; until teams exist (round 2) a person's id is their tenant. PROD_CHECK_EMPTY=0 skips it.
 */
async function emptyStore(userId: string) {
  if (process.env.PROD_CHECK_EMPTY === "0") return;
  const db = new Pool({ connectionString: await tenantsUrl() });
  try {
    await db.query(`delete from naive_records where tenant = $1`, [userId]);
  } finally {
    await db.end();
  }
}

export default async function setup(config: FullConfig) {
  const use = config.projects[0]!.use;
  const baseURL = String(use.baseURL);
  const statePath = String(use.storageState);
  const password = randomBytes(24).toString("base64url");
  // Better Auth refuses a POST whose Origin is not a trusted origin.
  const api = await request.newContext({ baseURL, extraHTTPHeaders: { origin: new URL(baseURL).origin } });
  const db = new Pool({ connectionString: await identityUrl() });
  try {
    const found = await db.query(`select id from "user" where email = $1`, [CHECK_EMAIL]);
    if (!found.rowCount) {
      const r = await api.post("/api/auth/sign-up/email", { data: { email: CHECK_EMAIL, password, name: CHECK_NAME, adult: true } });
      if (!r.ok()) throw new Error(`sign-up of the check account answered ${r.status()}`);
    } else {
      const set = await db.query(`update account set password = $1, "updatedAt" = now() where "userId" = $2 and "providerId" = 'credential'`,
        [await hashPassword(password), found.rows[0].id]);
      if (set.rowCount !== 1) throw new Error("the check account has no password sign-in");
    }
    const id = (await db.query(`select id from "user" where email = $1`, [CHECK_EMAIL])).rows[0]?.id as string | undefined;
    if (!id) throw new Error("the check account was not made");
    await emptyStore(id);
    const r = await api.post("/api/auth/sign-in/email", { data: { email: CHECK_EMAIL, password } });
    if (!r.ok()) throw new Error(`sign-in of the check account answered ${r.status()}: ${String((await r.json().catch(() => ({}))).message ?? "")}`);
    mkdirSync(dirname(statePath), { recursive: true });
    await api.storageState({ path: statePath });
    // A second session for the test that signs out (console-empty.spec.ts E3), so signing out leaves the first one live.
    const spare = await request.newContext({ baseURL, extraHTTPHeaders: { origin: new URL(baseURL).origin } });
    try {
      const r2 = await spare.post("/api/auth/sign-in/email", { data: { email: CHECK_EMAIL, password } });
      if (!r2.ok()) throw new Error(`the second sign-in of the check account answered ${r2.status()}`);
      await spare.storageState({ path: signOutState(statePath) });
    } finally {
      await spare.dispose();
    }
  } finally {
    await db.end();
    await api.dispose();
  }
}
