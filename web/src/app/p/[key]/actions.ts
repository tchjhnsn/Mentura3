"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isAudience, isSection } from "@reflect/core/profile";
import { requireUser } from "@/server/session";
import { fromPage } from "@/server/actions/page";
import { connectWithAction } from "@/server/actions/connections";
import { setSectionAudienceAction } from "@/server/actions/profiles";

// A profile's acts (doc "Profiles and accounts design guide", 2026-11-18): Connect from someone's profile, and the
// owner's eye on each part. Both run the registry's entries, so they are in the change log and can be undone.

const why = (e: unknown, fallback: string) => encodeURIComponent(e instanceof Error ? e.message : fallback);
const safeBack = (back: string) => (back.startsWith("/p/") ? back : "/");

/** Connect on a profile: to someone the person has met, or back to someone who asked. */
export async function connectFromProfile(ownerId: string, back: string): Promise<void> {
  const user = await requireUser();
  const to = safeBack(back);
  try {
    await fromPage(connectWithAction, user.id, { to: ownerId });
  } catch (e) {
    redirect(`${to}?error=${why(e, "Could not connect.")}`);
  }
  revalidatePath(to);
}

/** The eye on a part of the person's own profile: who sees it. */
export async function setAudienceFromProfile(section: string, audience: string, back: string): Promise<void> {
  const user = await requireUser();
  if (!isSection(section) || !isAudience(audience)) return;
  await fromPage(setSectionAudienceAction, user.id, { section, audience });
  revalidatePath(safeBack(back));
}
