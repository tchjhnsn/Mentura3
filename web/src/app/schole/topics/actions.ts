"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/server/session";
import { fromPage } from "@/server/actions/page";
import { followTopic, makePlaylistAction as makePlaylistEntry, savePlaylist } from "@/server/actions/learn-page";

/** Follows a topic, or stops following it. */
export async function followTopicAction(form: FormData): Promise<void> {
  const user = await requireUser();
  const topic = String(form.get("topic") ?? "");
  await fromPage(followTopic, user.id, { topic, follow: form.get("follow") === "1" });
  revalidatePath(`/schole/topics/${topic}`);
}

/**
 * Makes a playlist for the person from a topic and opens it: from what they told Work, changed by what they typed,
 * and different from the one they asked to replace. Returns an error to show when it could not be made.
 */
export async function makePlaylistAction(form: FormData): Promise<string | null> {
  const user = await requireUser();
  const topic = String(form.get("topic") ?? "");
  let id: string;
  try {
    const ask = String(form.get("ask") ?? "");
    const instead = String(form.get("instead") ?? "");
    ({ id } = await fromPage(makePlaylistEntry, user.id, { topic, ...(ask ? { ask } : {}), ...(instead ? { instead } : {}) }));
  } catch (e) {
    return e instanceof Error ? e.message : "The playlist could not be made just now.";
  }
  revalidatePath(`/schole/topics/${topic}`);
  redirect(`/schole/playlists/made/${id}`);
}

/** Saves a made playlist to the library's Lists, or takes it out. */
export async function saveMadeAction(form: FormData): Promise<void> {
  const user = await requireUser();
  const id = String(form.get("id") ?? "");
  await fromPage(savePlaylist, user.id, { id, saved: form.get("saved") === "1" });
  revalidatePath(`/schole/playlists/made/${id}`);
  revalidatePath("/schole/lists");
}
