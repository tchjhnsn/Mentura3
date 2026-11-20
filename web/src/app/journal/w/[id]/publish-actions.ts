"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/server/session";
import { profileSettings } from "@/server/profile-store";
import { profileHref } from "@/server/actions/profiles";
import { postById, republishPost, unpublishWork } from "@/server/site-store";
import { publishToRepo, unpublishFromRepo } from "@/server/site-repo";
import { fromPage } from "@/server/actions/page";
import { OCCASIONS, VIRTUE_IDS } from "@reflect/core/presentation";
import { draftPresentationAction, publishToSiteAction, SITE_CHANNEL, type Published } from "@/server/actions/presentations";

// Publishing a journal work to the person's own site (doc "Personal site and blog design guide", 2026-11-18), through
// the presentation gate (Reflect framework plan, step 6). The Publish sheet drafts the work's presentation record
// (draft_presentation) and shows the gate's answer; Publish runs publish_to_site from the page, which holds it, and the
// person's tap approves it (source page) only when the record passes the gate. Unpublish and its Undo are not gated:
// one takes the post down, and the other puts back the post the person approved before.

export type { Published };
const fail = (e: unknown, fallback: string) => ({ error: e instanceof Error ? e.message : fallback });

/** What the sheet's presentation section sends: the record's id when it updates one, and its fields. */
export type PresentationFields = {
  id?: string;
  role?: string;
  end?: string;
  audience?: string;
  relation?: string;
  what?: string;
  about?: string;
  means?: string;
  how?: string;
  occasion?: string;
  virtue?: string;
};
/** The gate's answer as the sheet shows it. */
export type GateAnswer = { id: string; ready: true; rule: { role: string; end: string; content: string }; checks: string[]; preview: string } | { id: string; ready: false; missing: { item: string; message: string }[] };

/** Save the presentation record for the site publish (a new draft, or the one named by id) and return the gate's answer. */
export async function draftSitePresentationAction(f: PresentationFields): Promise<GateAnswer | { error: string }> {
  const user = await requireUser();
  const s = (v: unknown) => (typeof v === "string" ? v : undefined);
  const occasion = OCCASIONS.find((o) => o === f.occasion);
  const virtue = VIRTUE_IDS.find((v) => v === f.virtue);
  try {
    const r = await fromPage(draftPresentationAction, user.id, {
      channel: SITE_CHANNEL,
      ...(s(f.id) ? { id: s(f.id) } : {}),
      role: s(f.role) ?? "",
      end: s(f.end) ?? "",
      audience: s(f.audience) ?? "",
      ...(f.audience?.trim() ? { relation: s(f.relation) ?? "" } : {}),
      what: s(f.what) ?? "",
      about: s(f.about) ?? "",
      means: s(f.means) ?? "",
      how: s(f.how) ?? "",
      ...(occasion ? { occasion } : {}),
      ...(virtue ? { virtue } : {}),
    });
    return r.gate.ready ? { id: r.id, ready: true, rule: r.gate.rule, checks: r.gate.checks, preview: r.gate.preview } : { id: r.id, ready: false, missing: r.gate.missing };
  } catch (e) {
    return fail(e, "Could not save the presentation record.");
  }
}

/**
 * Publish the work, or update its post with the text as it is now, at the slug given (or its own), with the
 * presentation record that passed the gate. The tap is the person's approval; a record that does not pass is refused.
 */
export async function publishWorkAction(workId: string, slug: string | null, email: boolean, presentation: string): Promise<Published | { error: string }> {
  const user = await requireUser();
  try {
    const p = await fromPage(publishToSiteAction, user.id, { work_id: String(workId), ...(slug ? { slug: String(slug) } : {}), email: Boolean(email), presentation: String(presentation) });
    revalidatePath(profileHref({ id: user.id, handle: (await profileSettings(user.id)).handle }));
    revalidatePath(`/journal/w/${workId}`);
    return p;
  } catch (e) {
    return fail(e, "Could not publish.");
  }
}

/** Take the work's post down. Returns the post's id so Undo can put it back. */
export async function unpublishWorkAction(workId: string): Promise<{ postId: string | null } | { error: string }> {
  const user = await requireUser();
  try {
    const p = await unpublishWork(user.id, String(workId));
    if (p) await unpublishFromRepo(user.id, p).catch(() => undefined);
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
    const p = await postById(user.id, String(postId));
    if (p) await publishToRepo(user.id, p).catch(() => undefined);
    revalidatePath(profileHref({ id: user.id, handle: (await profileSettings(user.id)).handle }));
    return { ok: true };
  } catch (e) {
    return fail(e, "Could not put it back.");
  }
}
