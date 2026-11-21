"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/server/session";
import { fromPage } from "@/server/actions/page";
import { pathStep, startPath } from "@/server/actions/paths";

// Through the registry: the chat's own entries, so a change here is in the change log too.

/** Follow an O*NET occupation as a career path. */
export async function startPathAction(code: string): Promise<void> {
  const user = await requireUser();
  await fromPage(startPath, user.id, { code });
  revalidatePath("/life/work", "layout");
}

/** Mark one step (task number, from 1) of a followed path done or not. */
export async function pathStepAction(code: string, step: number, done: boolean): Promise<void> {
  const user = await requireUser();
  await fromPage(pathStep, user.id, { code, step, done });
  revalidatePath("/life/work", "layout");
}
