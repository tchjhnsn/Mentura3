"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/server/session";
import { fromPage } from "@/server/actions/page";
import { connectWithAction, setFriendKindAction, setProfileAction } from "@/server/actions/connections";
import { canCheckIn, hashToken, tokenShaped } from "@/server/connect";
import { checkIn, declineRequest, eventDoor, isGoing, userByPersonalHash } from "@/server/connect-store";

// Check in, Connect, Connect back, Not now, the kind of a friendship and what people see (doc "Events and
// connections design guide", 2026-11-18). Connect, the kind and the profile run the registry's entries, so they are
// in the change log and can be undone; checking in and Not now are the person's own taps and never a model's.

const why = (e: unknown, fallback: string) => encodeURIComponent(e instanceof Error ? e.message : fallback);

/** Check in from the event page, for someone who said Going (or the host), while a hosted event runs. */
export async function checkInAction(eventId: string): Promise<void> {
  const user = await requireUser();
  const e = await eventDoor(eventId);
  if (!e || !canCheckIn(e)) redirect(`/events/${eventId}`);
  if (e.hostUser !== user.id && !(await isGoing(eventId, user.id))) redirect(`/events/${eventId}`);
  await checkIn(eventId, user.id);
  redirect(`/events/${eventId}/here`);
}

/** Connect under a face on the Here page. */
export async function connectAction(eventId: string, personId: string): Promise<void> {
  const user = await requireUser();
  const back = `/events/${eventId}/here`;
  try {
    await fromPage(connectWithAction, user.id, { to: personId });
  } catch (e) {
    redirect(`${back}?error=${why(e, "Could not connect.")}`);
  }
  revalidatePath(back);
}

/** Connect from someone's personal QR (/connect/<token>): a request to them, at the event both are checked in to. */
export async function connectFromQrAction(token: string): Promise<void> {
  const user = await requireUser();
  const owner = tokenShaped(token) ? await userByPersonalHash(hashToken(token)) : null;
  if (!owner) redirect(`/connect/${encodeURIComponent(token)}`);
  let href = "/life/friends";
  try {
    href = (await fromPage(connectWithAction, user.id, { to: owner.id })).href;
  } catch (e) {
    redirect(`/connect/${encodeURIComponent(token)}?error=${why(e, "Could not connect.")}`);
  }
  redirect(href);
}

/** Connect back on a request in the Friends tile. */
export async function connectBackAction(fromUser: string): Promise<void> {
  const user = await requireUser();
  try {
    await fromPage(connectWithAction, user.id, { to: fromUser });
  } catch (e) {
    redirect(`/life/friends?error=${why(e, "Could not connect.")}`);
  }
  revalidatePath("/life/friends");
}

/** Not now on a request in the Friends tile. The other person is not told. */
export async function notNowAction(requestId: string): Promise<void> {
  const user = await requireUser();
  await declineRequest(user.id, requestId);
  revalidatePath("/life/friends");
}

/** The quiet choice of a friendship's kind on a friend's conversation page, for the person alone. */
export async function setFriendKindFromPage(friendId: string, kind: string): Promise<void> {
  const user = await requireUser();
  const k = kind === "utility" || kind === "pleasure" || kind === "good" ? kind : null;
  await fromPage(setFriendKindAction, user.id, { friend: friendId, kind: k });
  revalidatePath(`/life/friends/messages/${encodeURIComponent(friendId)}`);
}

/** Saves what people see (Settings, What people see). */
export async function saveProfileAction(back: string, form: FormData): Promise<void> {
  const user = await requireUser();
  const to = back.startsWith("/") && !back.startsWith("//") ? back : "/settings";
  const self = `/settings/profile?back=${encodeURIComponent(to)}`;
  try {
    await fromPage(setProfileAction, user.id, {
      line: String(form.get("line") ?? "").trim() || null,
      interests: String(form.get("interests") ?? "").split(",").map((s) => s.trim().slice(0, 40)).filter(Boolean).slice(0, 24),
      builds: form.get("builds") === "on",
    });
  } catch (e) {
    redirect(`${self}&error=${why(e, "Could not save.")}`);
  }
  revalidatePath("/settings/profile");
  redirect(`${self}&saved=1`);
}
