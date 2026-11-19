"use server";

import { revalidatePath } from "next/cache";
import { currentUser } from "@/server/session";
import { acceptInvite } from "@/server/meetings-store";

/**
 * Takes an invite for the signed-in person (the token is bound on the invite page). `newGuest` is true right after
 * the person made their account from the link, which marks it a guest account; the store only marks an account made
 * in the last fifteen minutes. Returns the meeting's id, or the store's plain error.
 */
export async function acceptInviteAction(token: string, newGuest: boolean): Promise<{ id: string } | { error: string }> {
  const user = await currentUser();
  if (!user) return { error: "Sign in first." };
  try {
    const id = await acceptInvite(token, user.id, newGuest);
    revalidatePath("/meetings");
    return { id };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "That did not work. Try again." };
  }
}
