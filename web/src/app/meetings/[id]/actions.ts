"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isMeetingPart } from "@reflect/core/meetings";
import { requireUser } from "@/server/session";
import { fromAustinLocal } from "@/server/events-store";
import {
  addFollowup, inviteGuest, removeFollowup, removeGuest, setCancelled, setFollowupDone, setMeetingPart, setNotes, setNotesShared,
} from "@/server/meetings-store";

// One meeting's page (doc "Mentura meetings and building-only Mentura design guide", 2026-11-19): each tap the host
// makes on it. The store checks the person hosts the meeting; an error comes back to the page as a plain sentence.

const again = (id: string) => {
  revalidatePath("/meetings");
  revalidatePath(`/meetings/${id}`);
};
const page = (id: string, q?: Record<string, string>) => `/meetings/${id}${q && Object.keys(q).length ? `?${new URLSearchParams(q)}` : ""}`;
const say = (e: unknown) => (e instanceof Error ? e.message : "That could not be kept.");

/** One part of the meeting, from its row's small editor; a start is on Austin's clock. Back to the meeting after. */
export async function setPartAction(id: string, part: string, form: FormData): Promise<void> {
  const user = await requireUser();
  if (!isMeetingPart(part)) throw new Error("No such part.");
  let value = String(form.get("value") ?? "");
  if (part === "starts_at" && value) value = fromAustinLocal(value) ?? value;
  let error: string | null = null;
  try {
    await setMeetingPart(user.id, id, part, value);
  } catch (e) {
    error = say(e);
  }
  again(id);
  redirect(error ? page(id, { edit: part, error }) : page(id));
}

/** Cancel the meeting, or restore it. */
export async function setCancelledAction(id: string, cancelled: boolean): Promise<void> {
  const user = await requireUser();
  await setCancelled(user.id, id, cancelled);
  again(id);
}

/** Invite a guest by email; the page then shows their link to copy, and whether it went by email. */
export async function inviteGuestAction(id: string, form: FormData): Promise<void> {
  const user = await requireUser();
  let to: string;
  try {
    const r = await inviteGuest(user.id, id, { email: form.get("email"), name: form.get("name") });
    to = page(id, { invited: r.guestId, emailed: r.emailed ? "1" : "0" });
  } catch (e) {
    to = page(id, { inviteError: say(e) });
  }
  again(id);
  redirect(to);
}

/** Remove a guest; their link stops opening the meeting. */
export async function removeGuestAction(id: string, guestId: string): Promise<void> {
  const user = await requireUser();
  await removeGuest(user.id, id, guestId);
  again(id);
}

/** Keep the notes as written. */
export async function setNotesAction(id: string, form: FormData): Promise<void> {
  const user = await requireUser();
  await setNotes(user.id, id, String(form.get("notes") ?? ""));
  again(id);
  redirect(page(id, { saved: "notes" }));
}

/** Share the notes and follow-ups with the guests, or take them back. */
export async function setNotesSharedAction(id: string, shared: boolean): Promise<void> {
  const user = await requireUser();
  await setNotesShared(user.id, id, shared);
  again(id);
}

/** Add a follow-up: what is to be done, by whom, by when. */
export async function addFollowupAction(id: string, form: FormData): Promise<void> {
  const user = await requireUser();
  let error: string | null = null;
  try {
    await addFollowup(user.id, id, { text: form.get("text"), owner: form.get("owner"), due: form.get("due") });
  } catch (e) {
    error = say(e);
  }
  again(id);
  redirect(error ? page(id, { followupError: error }) : page(id));
}

/** Tick a follow-up done, or untick it. */
export async function setFollowupDoneAction(id: string, followupId: string, done: boolean): Promise<void> {
  const user = await requireUser();
  await setFollowupDone(user.id, id, followupId, done);
  again(id);
}

/** Remove a follow-up. */
export async function removeFollowupAction(id: string, followupId: string): Promise<void> {
  const user = await requireUser();
  await removeFollowup(user.id, id, followupId);
  again(id);
}
