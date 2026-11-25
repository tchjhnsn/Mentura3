"use server";
// A4 Delete account (doc "Mentura console: screens, navigation and teams", 2026-11-25). src/server/moving.ts does the
// work and src/server/teams-core.ts holds the rules on what happens to each team.
import { deleteAccount } from "@/server/moving";

export type Deleted = { ok: true } | { ok: false; error: string };

/** Deletes the signed-in person's account, with their email address typed. */
export async function deleteAccountAction(typed: string): Promise<Deleted> {
  try {
    await deleteAccount(typed);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "That did not work. Try again." };
  }
}
