"use server";

import { revalidatePath } from "next/cache";
import { fromPage } from "@/server/actions/page";
import { setMorningBriefAction } from "@/server/actions/dashboard";
import { requireUser } from "@/server/session";

/** Turns the morning brief on or off through its registry entry, so the change is logged and can be undone. */
export async function setMorningBriefFromPage(on: boolean): Promise<void> {
  const user = await requireUser();
  await fromPage(setMorningBriefAction, user.id, { on });
  revalidatePath("/settings/dashboard");
}
