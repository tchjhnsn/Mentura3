"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/server/session";
import { fromPage } from "@/server/actions/page";
import { quickLog } from "@/server/actions/records";

// The tiles' quick logs (QuickLog). Each goes through the registry's quick_log (Ask Reflect plan, step 4), the same
// entry the chat uses, so every log is in the change log.

/** Health's Log: a night's sleep in hours, or a visit to the doctor today. */
export async function logHealthAction(kind: string, amount: number | null): Promise<void> {
  const user = await requireUser();
  await fromPage(quickLog, user.id, { tile: "health", kind, amount });
  revalidatePath("/", "layout");
}

/**
 * Fitness's Log: minutes of moderate or vigorous activity, or strength. It counts toward the guidelines whatever goal
 * it goes to; it goes to the goal under way, or to "Meet the activity guidelines", kept first when there is none.
 */
export async function logFitnessAction(kind: string, amount: number | null): Promise<void> {
  const user = await requireUser();
  await fromPage(quickLog, user.id, { tile: "fitness", kind, amount });
  revalidatePath("/", "layout");
}

/** Friends: time together today (in minutes), or a call, kept on that friend. */
export async function logFriendAction(id: string, kind: string, amount: number | null): Promise<void> {
  const user = await requireUser();
  await fromPage(quickLog, user.id, { tile: "friend", id, kind, amount });
  revalidatePath("/", "layout");
}

/** Standing and Ventures: minutes given to one role or one venture today, kept on that record. */
export async function logTimeAction(app: "polis" | "ventures", kind: string, amount: number | null): Promise<void> {
  const user = await requireUser();
  await fromPage(quickLog, user.id, { tile: app === "ventures" ? "ventures" : "polis", id: kind, kind: app === "polis" ? "served" : "worked", amount });
  revalidatePath("/", "layout");
}
