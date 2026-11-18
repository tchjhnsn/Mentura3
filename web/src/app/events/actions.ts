"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireUser } from "@/server/session";
import { fromPage } from "@/server/actions/page";
import { goingToEvent, hostEvent, setEventPartAction } from "@/server/actions/events";
import { cancelEvent, fromAustinLocal, isEventPart, publishEvent } from "@/server/events-store";

// Events (doc "Events and connections design guide", 2026-11-18): Going, + (host) and each part of a hosted event run
// the same registry entries the chat and MCP run, so they are in the change log and can be undone. Publish and Cancel
// reach other people, so they are taps on the page only.

const again = (id?: string) => {
  revalidatePath("/events");
  if (id) revalidatePath(`/events/${id}`);
  revalidatePath("/calendar");
};

/** + on the Events page: a new draft the host then sets part by part. */
export async function newEventAction(): Promise<void> {
  const user = await requireUser();
  const { id } = await fromPage(hostEvent, user.id, {});
  again();
  redirect(`/events/${id}`);
}

/** Going, or taking it back. */
export async function goingAction(id: string, going: boolean): Promise<void> {
  const user = await requireUser();
  await fromPage(goingToEvent, user.id, { id, going });
  again(id);
}

/** One part of a hosted event, from its small page; a start or end is on Austin's clock. Back to the event after. */
export async function setPartAction(id: string, part: string, form: FormData): Promise<void> {
  const user = await requireUser();
  if (!isEventPart(part)) throw new Error("No such part.");
  let value = String(form.get("value") ?? "");
  if ((part === "starts_at" || part === "ends_at") && value) value = fromAustinLocal(value) ?? value;
  let error: string | null = null;
  try {
    await fromPage(setEventPartAction, user.id, { id, part, value });
  } catch (e) {
    error = e instanceof Error ? e.message : "That could not be kept.";
  }
  again(id);
  redirect(error ? `/events/${id}?edit=${part}&error=${encodeURIComponent(error)}` : `/events/${id}`);
}

/** Publish: the event goes public, and its door token is handed to the check-in page once, in a cookie. */
export async function publishEventAction(id: string): Promise<void> {
  const user = await requireUser();
  const token = await publishEvent(user.id, id);
  (await cookies()).set(`event_door_${id}`, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: `/events/${id}`, maxAge: 86400 });
  again(id);
  redirect(`/events/${id}?published=1`);
}

/** Cancel a published event: it stays, with a line saying so, for the people who said Going. */
export async function cancelEventAction(id: string): Promise<void> {
  const user = await requireUser();
  await cancelEvent(user.id, id);
  again(id);
}
