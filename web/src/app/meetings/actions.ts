"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/server/session";
import { fromPage } from "@/server/actions/page";
import { scheduleMeeting } from "@/server/actions/meetings";

// Meetings (doc "Mentura meetings and building-only Mentura design guide", 2026-11-19): + New meeting runs the same
// registry entry the chat and MCP run, so it is in the change log and can be undone.

/** + New meeting: a draft the host then names, times and invites to on its page. A venture id (from ?venture=) is kept on it. */
export async function newMeetingAction(form: FormData): Promise<void> {
  const user = await requireUser();
  const venture = String(form.get("venture") ?? "").trim().slice(0, 100);
  const { id } = await fromPage(scheduleMeeting, user.id, venture ? { venture_id: venture } : {});
  revalidatePath("/meetings");
  redirect(`/meetings/${id}`);
}
