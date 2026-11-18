// The person's account (doc "Profiles and accounts design guide", 2026-11-18): their name, how they sign in, and a copy
// of everything they keep in Reflect. Emails, passwords and tokens are never read here.
import { db } from "@/db/pool";

export const NAME_MAX = 80;

export async function nameOf(userId: string): Promise<string> {
  const r = await db().query(`SELECT name FROM "user" WHERE id = $1`, [userId]);
  return (r.rows[0]?.name as string | undefined)?.trim() ?? "";
}

/** Sets the name people see. Returns the name it was. */
export async function setName(userId: string, raw: string): Promise<string> {
  const name = raw.replace(/\s+/g, " ").trim();
  if (!name) throw new Error("A name cannot be empty.");
  if (name.length > NAME_MAX) throw new Error(`A name has at most ${NAME_MAX} characters.`);
  const before = await nameOf(userId);
  if (before !== name) await db().query(`UPDATE "user" SET name = $2, "updatedAt" = now() WHERE id = $1`, [userId, name]);
  return before;
}

/** Whether Google sign-in is set up on this deployment (the variables are checked by name only, never read out). */
export const googleSignInReady = () => !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET;

/** The ways the person signs in: "credential" (email and password) and any social provider linked, such as "google". */
export async function signInMethods(userId: string): Promise<string[]> {
  const r = await db().query(`SELECT DISTINCT "providerId" FROM account WHERE "userId" = $1 ORDER BY 1`, [userId]);
  return r.rows.map((x) => x.providerId as string);
}

/** "Email" or "Email, Google", for the Sign-in row. */
export function signInLabel(methods: readonly string[]): string {
  const out: string[] = [];
  if (methods.includes("credential") || !methods.length) out.push("Email");
  if (methods.includes("google")) out.push("Google");
  return out.join(", ");
}
