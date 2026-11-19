import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db/pool";
import { auth } from "./auth";
import { GUEST_HOME, guestMayOpen, PATH_HEADER } from "./guest-wall";
import { isGuestAccount } from "./meetings-store";
import { openMode } from "./open-mode";

export const OWNER_ID = "reflect-owner";
let ownerReady: Promise<void> | null = null;
const ensureOwner = () =>
  (ownerReady ??= db()
    .query(`INSERT INTO "user" (id, name, email, "emailVerified", "createdAt", "updatedAt") VALUES ($1, 'Owner', 'owner@reflect.local', false, now(), now()) ON CONFLICT (id) DO NOTHING`, [OWNER_ID])
    .then(() => undefined)
    .catch((e: unknown) => {
      ownerReady = null;
      throw e;
    }));

/** The person using the app, or null when nobody is signed in. */
export async function currentUser(): Promise<{ id: string } | null> {
  if (openMode()) {
    await ensureOwner();
    return { id: OWNER_ID };
  }
  const session = await auth.api.getSession({ headers: await headers() });
  return session ? { id: session.user.id } : null;
}

/** Whether the account is a guest account (made from a meeting invite), asked once per request. False when the
 * guest table cannot be read, so a missing migration never locks members out. */
export const isGuest = cache(async (userId: string): Promise<boolean> =>
  userId === OWNER_ID ? false : isGuestAccount(userId).catch(() => false));

/** The person using the app, else to sign-in. A guest account is sent to its meetings from any page outside the
 * guest wall (./guest-wall.ts), by the path the proxy hands over. */
export async function requireUser(): Promise<{ id: string }> {
  const user = await currentUser();
  if (!user) redirect("/sign-in");
  if (!guestMayOpen((await headers()).get(PATH_HEADER)) && (await isGuest(user.id))) redirect(GUEST_HOME);
  return user;
}
