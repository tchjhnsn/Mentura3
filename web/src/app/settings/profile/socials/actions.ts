"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/server/session";
import { fromPage } from "@/server/actions/page";
import { addSocialAction, confirmSocialAction, removeSocialAction, type ConfirmResult } from "@/server/actions/socials";

// Settings, Profile, Socials (doc "Profiles and accounts design guide", 2026-11-18). Each tap runs the registry's
// entry, so it is in the change log and can be undone. Each returns its outcome to the sheet instead of redirecting.

const PATH = "/settings/profile/socials";
const why = (e: unknown, fallback: string) => (e instanceof Error ? e.message : fallback);

export type SheetResult = { error: string | null };

/**
 * Add a link from the one-field sheet (a pasted link, or a handle under a named service), or change one: `replace` is
 * the link being changed, removed once the new one is kept unless adding already replaced it (one link per service).
 */
export async function addSocialFromPage(link: string, service: string | null, replace: string | null = null): Promise<SheetResult> {
  const user = await requireUser();
  try {
    const r = await fromPage(addSocialAction, user.id, { link, service: service ?? undefined });
    if (replace && r.added.id !== replace && r.replaced?.id !== replace) await fromPage(removeSocialAction, user.id, { link: replace });
  } catch (e) {
    return { error: why(e, "Could not add that link.") };
  }
  revalidatePath(PATH);
  return { error: null };
}

/** Remove from a link's sheet. */
export async function removeSocialFromPage(id: string): Promise<SheetResult> {
  const user = await requireUser();
  try {
    await fromPage(removeSocialAction, user.id, { link: id });
  } catch (e) {
    return { error: why(e, "Could not remove that link.") };
  }
  revalidatePath(PATH);
  return { error: null };
}

/** Confirm from a link's sheet: the link-back check. A failure comes back with the line to paste. */
export async function confirmSocialFromPage(id: string): Promise<ConfirmResult | { error: string }> {
  const user = await requireUser();
  try {
    const r = await fromPage(confirmSocialAction, user.id, { link: id });
    if (r.confirmed) revalidatePath(PATH);
    return r;
  } catch (e) {
    return { error: why(e, "Could not check that link.") };
  }
}
