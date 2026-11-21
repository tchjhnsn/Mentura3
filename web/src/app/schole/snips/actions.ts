"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/server/session";
import { addSnip, removeSnip, type Snip } from "@/server/snips-store";

/** Keeps the moment playing as a snip; the player calls it from its Snip button. */
export async function snipAction(s: Omit<Snip, "id" | "createdAt">): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const user = await requireUser();
  try {
    const snip = await addSnip(user.id, s);
    revalidatePath("/schole/snips");
    return { ok: true, id: snip.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not keep the snip." };
  }
}

export async function removeSnipAction(id: string): Promise<void> {
  const user = await requireUser();
  await removeSnip(user.id, id);
  revalidatePath("/schole/snips");
}
