"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/server/session";
import { fromPage } from "@/server/actions/page";
import { setDefaultAudienceAction, setHandleAction, setNameAction } from "@/server/actions/account";

// Settings, Account (doc "Profiles and accounts design guide", 2026-11-18): the handle, the name and who sees the
// profile run the registry's entries, so each is in the change log and can be undone.

const why = (e: unknown, fallback: string) => encodeURIComponent(e instanceof Error ? e.message : fallback);

/** Save on Settings, Account, Handle. An empty field clears the handle. */
export async function saveHandleAction(form: FormData): Promise<void> {
  const user = await requireUser();
  const raw = String(form.get("handle") ?? "").trim();
  try {
    await fromPage(setHandleAction, user.id, { handle: raw || null });
  } catch (e) {
    redirect(`/settings/account/handle?want=${encodeURIComponent(raw)}&error=${why(e, "Could not save.")}`);
  }
  revalidatePath("/settings/account");
  redirect("/settings/account/handle?saved=1");
}

/** Save on Settings, Account, Name and face. */
export async function saveNameAction(form: FormData): Promise<void> {
  const user = await requireUser();
  try {
    await fromPage(setNameAction, user.id, { name: String(form.get("name") ?? "").trim() });
  } catch (e) {
    redirect(`/settings/account/name?error=${why(e, "Could not save.")}`);
  }
  revalidatePath("/settings", "layout");
  redirect("/settings/account/name?saved=1");
}

/** A tap on one choice in Settings, Account, Who sees your profile. */
export async function chooseAudienceAction(audience: string): Promise<void> {
  const user = await requireUser();
  const a = audience === "everyone" || audience === "met" || audience === "me" ? audience : null;
  if (!a) redirect("/settings/account/audience");
  await fromPage(setDefaultAudienceAction, user.id, { audience: a });
  revalidatePath("/settings/account");
  redirect("/settings/account/audience");
}
