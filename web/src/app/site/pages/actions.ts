"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/server/session";
import { addPage, pageById, publishPage, removePage, savePageDraft, setPagePath, setPageTitle, unpublishPage } from "@/server/site-pages";
import { okHouseholdPart, publishableParts, shareOnSite, unshareOnSite, type PublishablePart } from "@/server/part-share";

// The site editor's taps (plan "Appearance, Virtu and the site editor", PRs 3 and 4). Publishing and sharing a part on
// a public page are the person's own acts, so none of these is offered to a model.

type Result<T = object> = ({ ok: true } & T) | { error: string };
const fail = (e: unknown) => ({ error: e instanceof Error ? e.message : "Something went wrong." });
const live = () => {
  revalidatePath("/settings/site");
  revalidatePath("/p/[key]", "layout");
};

/** + on the Pages list: a new empty page, opened in the editor. */
export async function addPageAction(): Promise<void> {
  const user = await requireUser();
  const id = await addPage(user.id);
  revalidatePath("/settings/site");
  redirect(`/site/pages/${id}`);
}

/** The editor's autosave. */
export async function savePageAction(id: string, body: string, version: number): Promise<Result<{ version: number }>> {
  const user = await requireUser();
  const r = await savePageDraft(user.id, id, body, version).catch(fail);
  return "error" in r ? r : { ok: true, version: r.version };
}

/** Publish: the draft goes live. */
export async function publishPageAction(id: string): Promise<Result<{ publishedAt: string }>> {
  const user = await requireUser();
  try {
    const p = await publishPage(user.id, id);
    live();
    return { ok: true, publishedAt: p.publishedAt! };
  } catch (e) {
    return fail(e);
  }
}

export async function unpublishPageAction(id: string): Promise<Result> {
  const user = await requireUser();
  await unpublishPage(user.id, id);
  live();
  return { ok: true };
}

export async function setPageTitleAction(id: string, title: string): Promise<Result> {
  const user = await requireUser();
  try {
    await setPageTitle(user.id, id, title);
    live();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function setPagePathAction(id: string, path: string): Promise<Result> {
  const user = await requireUser();
  try {
    await setPagePath(user.id, id, path);
    live();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function removePageAction(id: string): Promise<void> {
  const user = await requireUser();
  if (await pageById(user.id, id)) await removePage(user.id, id);
  live();
  redirect("/settings/site");
}

/** The library's parts with whether each is shared, read fresh when the library opens. */
export async function partsForLibraryAction(): Promise<PublishablePart[]> {
  const user = await requireUser();
  return publishableParts(user.id).catch(() => []);
}

/** "Share on my site", after the owner confirms. */
export async function shareOnSiteAction(source: string): Promise<Result<{ parts: PublishablePart[] }>> {
  const user = await requireUser();
  try {
    await shareOnSite(user.id, source);
    live();
    return { ok: true, parts: await publishableParts(user.id) };
  } catch (e) {
    return fail(e);
  }
}

export async function unshareOnSiteAction(source: string): Promise<Result> {
  const user = await requireUser();
  await unshareOnSite(user.id, source);
  live();
  return { ok: true };
}

/** The household's creator OKs a member's household part for that member's site (Settings, Household). */
export async function okHouseholdPartAction(ownerId: string, source: string): Promise<void> {
  const user = await requireUser();
  await okHouseholdPart(user.id, ownerId, source);
  revalidatePath("/settings/household");
  live();
}
