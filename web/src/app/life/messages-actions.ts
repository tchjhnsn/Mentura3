"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/server/session";
import { acceptFriendInvite, createFriendInvite } from "@/server/messages-store";
import { hrefFor, sendMessageAction } from "@/server/actions/messages";
import { fromPage } from "@/server/actions/page";

// Messages on the Friends tile (Ask Reflect plan, step 10): invite a friend by link, accept a link, and send. A send
// from the page is the person's own tap, so it runs at once (source page) and is kept in the change log.

const MESSAGES = "/life/friends/messages";
const why = (e: unknown, fallback: string) => encodeURIComponent(e instanceof Error ? e.message : fallback);

/** Makes a friend invite link and shows it once. */
export async function inviteFriendAction(): Promise<void> {
  const user = await requireUser();
  const token = await createFriendInvite(user.id);
  redirect(`${MESSAGES}?link=${encodeURIComponent(token)}`);
}

export async function acceptFriendInviteAction(token: string): Promise<void> {
  const user = await requireUser();
  try {
    await acceptFriendInvite(user.id, token);
  } catch (e) {
    redirect(`/friends/join/${encodeURIComponent(token)}?error=${why(e, "Could not accept the invite.")}`);
  }
  revalidatePath(MESSAGES);
  redirect(MESSAGES);
}

/** Sends the message in the conversation's box to the person whose conversation it is. */
export async function sendMessageFromPage(to: string, form: FormData): Promise<void> {
  const user = await requireUser();
  const back = hrefFor(to);
  try {
    await fromPage(sendMessageAction, user.id, { to, text: String(form.get("text") ?? "") });
  } catch (e) {
    redirect(`${back}?error=${why(e, "Could not send.")}`);
  }
  revalidatePath(back);
  redirect(back);
}
