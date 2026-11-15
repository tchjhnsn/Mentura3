"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/server/session";
import { addComment, removeComment } from "@/server/comment-store";

export type CommentState = { error?: string; ok?: number };

/** Posts a comment on an episode, or a reply to one, from the comment form. */
export async function commentAction(_prev: CommentState, form: FormData): Promise<CommentState> {
  const user = await requireUser();
  const at = String(form.get("at") ?? "");
  try {
    await addComment(user.id, {
      feed: String(form.get("feed") ?? ""), episode: String(form.get("episode") ?? ""), body: String(form.get("body") ?? ""),
      parentId: String(form.get("parent") ?? "") || null, at: /^\d{1,6}$/.test(at) ? Number(at) : null,
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "The comment was not posted." };
  }
  const path = String(form.get("path") ?? "");
  if (path.startsWith("/schole/")) revalidatePath(path.split("?")[0]!);
  return { ok: Date.now() };
}

/** Takes down a comment of the person's own. */
export async function removeCommentAction(form: FormData): Promise<void> {
  const user = await requireUser();
  await removeComment(user.id, String(form.get("id") ?? ""));
  const path = String(form.get("path") ?? "");
  if (path.startsWith("/schole/")) revalidatePath(path.split("?")[0]!);
}
