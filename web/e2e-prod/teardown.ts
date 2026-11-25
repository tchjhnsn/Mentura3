// After the production check, even when a test failed: this run's two accounts, and any a crashed run left, are deleted
// through the app's own Delete account (A4), with their teams and businesses (setup.ts, removeCheckAccounts). A run that
// leaves an account behind says so; the next run's setup tries again.
import type { FullConfig } from "@playwright/test";
import { identityDb, removeCheckAccounts } from "./setup";

export default async function teardown(config: FullConfig) {
  const baseURL = String(config.projects[0]!.use.baseURL);
  const db = await identityDb();
  try {
    const { deleted, failed } = await removeCheckAccounts(baseURL, db);
    console.log(`cleanup after the run: ${deleted.length} account(s) deleted${failed.length ? `, ${failed.length} left for the next run` : ""}`);
  } finally {
    await db.end();
  }
}
