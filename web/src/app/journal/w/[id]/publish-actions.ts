"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/server/session";
import { profileSettings } from "@/server/profile-store";
import { profileHref } from "@/server/actions/profiles";
import { publishWork, republishPost, unpublishWork } from "@/server/site-store";

// Publishing a journal work to the person's own site (doc "Personal site and blog design guide", 2026-11-18). A tap
// on the work's page only: publishing is never offered to a model, so these are not registry entries
// (web/src/server/actions/page-actions.test.ts lists them under PUBLISH).

export type Published = { slug: string; href: string; updatedAt: string };
const fail = (e: unknown, fallback: string) => ({ error: e instanceof Error ? e.message : fallback });

/** Publish the work, or update its post with the text as it is now, at the slug given (or its own). */
export async function publishWorkAction(workId: string, slug: string | null): Promise<Published | { error: string }> {
  const user = await requireUser();
  try {
    const p = await publishWork(user.id, String(workId), slug ? String(slug) : null);
    const site = profileHref({ id: user.id, handle: (await profileSettings(user.id)).handle });
    revalidatePath(site);
    revalidatePath(`/journal/w/${workId}`);
    return { slug: p.slug, href: `${site}/${p.slug}`, updatedAt: p.updatedAt };
  } catch (e) {
    return fail(e, "Could not publish.");
  }
}

/** Take the work's post down. Returns the post's id so Undo can put it back. */
export async function unpublishWorkAction(workId: string): Promise<{ postId: string | null } | { error: string }> {
  const user = await requireUser();
  try {
    const p = await unpublishWork(user.id, String(workId));
    revalidatePath(profileHref({ id: user.id, handle: (await profileSettings(user.id)).handle }));
    return { postId: p?.id ?? null };
  } catch (e) {
    return fail(e, "Could not unpublish.");
  }
}

/** Undo of Unpublish: the post back as it was. */
export async function republishAction(postId: string): Promise<{ ok: true } | { error: string }> {
  const user = await requireUser();
  try {
    await republishPost(user.id, String(postId));
    revalidatePath(profileHref({ id: user.id, handle: (await profileSettings(user.id)).handle }));
    return { ok: true };
  } catch (e) {
    return fail(e, "Could not put it back.");
  }
}
