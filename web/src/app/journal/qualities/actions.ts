"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/server/session";
import { fromPage } from "@/server/actions/page";
import { takeOffQuality, toggleQuality, writeQuality } from "@/server/actions/work-life";

// Through the registry (Ask Reflect plan, step 4): the chat's own entries, so a change here is in the change log too.

const safe = (to: string) => (to.startsWith("/schole/") || to.startsWith("/journal/") ? to : "/journal/qualities");

/** Keep or take off one quality a person names, with that person as where it was seen (the + on their page). */
export async function toggleQualityAction(exemplar: string, trait: string, back: string): Promise<void> {
  const user = await requireUser();
  await fromPage(toggleQuality, user.id, { exemplar, trait });
  revalidatePath("/", "layout");
  redirect(safe(back));
}

/** Take a quality off the lens: no person keeps it any more. What was written about it stays in the journal. */
export async function takeOffQualityAction(trait: string): Promise<void> {
  const user = await requireUser();
  await fromPage(takeOffQuality, user.id, { trait });
  revalidatePath("/", "layout");
  redirect("/journal/qualities");
}

/** Start a journal entry about a quality, kept on it. */
export async function writeQualityAction(trait: string): Promise<void> {
  const user = await requireUser();
  const { id } = await fromPage(writeQuality, user.id, { trait });
  revalidatePath("/", "layout");
  redirect(`/journal/w/${id}`);
}
