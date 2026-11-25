// Signs the standing check account in before the production check runs (README.md beside this file).
//
// The account is one row in the live site's own user table, made once by the site's sign-up and kept: the app has no
// account deletion yet, so a fresh account per run would pile up. Its password is never stored. Each run writes a
// new random password's hash straight to the account row through the identity database's owner, signs in with it,
// and keeps only the session cookie (in PROD_CHECK_STATE, under test-results/, which git ignores).
//
// The identity database comes from PROD_CHECK_DATABASE_URL, or from the Neon API with NEON_API_KEY,
// NEON_PROJECT_ID and NEON_BRANCH_ID (database neondb, role neondb_owner). Neither is ever printed.
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

async function identityUrl(): Promise<string> {
  if (process.env.PROD_CHECK_DATABASE_URL) return process.env.PROD_CHECK_DATABASE_URL;
  const { NEON_API_KEY: key, NEON_PROJECT_ID: project, NEON_BRANCH_ID: branch } = process.env;
  if (!key || !project || !branch) throw new Error("set PROD_CHECK_DATABASE_URL, or NEON_API_KEY, NEON_PROJECT_ID and NEON_BRANCH_ID");
  const q = new URLSearchParams({ branch_id: branch, database_name: "neondb", role_name: "neondb_owner", pooled: "false" });
  const r = await fetch(`https://console.neon.tech/api/v2/projects/${project}/connection_uri?${q}`, { headers: { authorization: `Bearer ${key}` } });
  if (!r.ok) throw new Error(`the Neon API answered ${r.status} for the identity database`);
  return ((await r.json()) as { uri: string }).uri;
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
    const r = await api.post("/api/auth/sign-in/email", { data: { email: CHECK_EMAIL, password } });
    if (!r.ok()) throw new Error(`sign-in of the check account answered ${r.status()}: ${String((await r.json().catch(() => ({}))).message ?? "")}`);
    mkdirSync(dirname(statePath), { recursive: true });
    await api.storageState({ path: statePath });
  } finally {
    await db.end();
    await api.dispose();
  }
}
