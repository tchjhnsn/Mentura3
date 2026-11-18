"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isAudience, isSection } from "@reflect/core/profile";
import { requireUser } from "@/server/session";
import { fromPage } from "@/server/actions/page";
import { connectWithAction } from "@/server/actions/connections";
import { profileHref, setSectionAudienceAction } from "@/server/actions/profiles";
import { cleanEmail } from "@reflect/core/site";
import { profilePage } from "@/server/profile-store";
import { subscribe } from "@/server/site-store";
import { sendSiteMail } from "@/server/site-connectors";
import { siteUrl } from "@/server/site";

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

/**
 * Subscribe to someone's site with an email (doc "Personal site and blog design guide", 2026-11-18). Double opt-in:
 * the email gets a link to confirm, and only a confirmed subscriber counts. Anyone may ask, signed in or not.
 */
export async function subscribeToSite(ownerId: string, email: string): Promise<{ sent: boolean; confirmed: boolean } | { error: string }> {
  const clean = cleanEmail(email);
  if (!clean) return { error: "That does not look like an email address." };
  const p = await profilePage(String(ownerId), null).catch(() => null);
  if (!p) return { error: "No such site." };
  const r = await subscribe(p.id, clean);
  if (r.confirmed) return { sent: false, confirmed: true };
  const base = `${siteUrl()}${profileHref(p)}`;
  const sent = !!(await sendSiteMail(p.id, {
    to: clean,
    subject: `Confirm your subscription to ${p.name}`,
    text: `You asked to get ${p.name}'s writing by email.\n\nConfirm: ${base}/subscribe?t=${r.token}\n\nIf this was not you, ignore this email and nothing happens.\n\nLeave any time: ${base}/subscribe?t=${r.token}&leave=1\n`,
  }));
  return { sent, confirmed: false };
}
