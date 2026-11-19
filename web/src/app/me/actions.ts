"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/server/session";
import { fromPage } from "@/server/actions/page";
import { pickInterest, setInterest, setInterestArea } from "@/server/actions/interests";
import type { z } from "zod";

// Get to know you through the registry, so a pick, a sort or a skip from these pages is in the change log too.

/** Keep or let go of one book or show the person tapped. */
export async function pickAction(ref: string, picked: boolean): Promise<void> {
  const user = await requireUser();
  await fromPage(pickInterest, user.id, { ref, picked });
}

/** Set an interest's modes and levels from Sort or its page. */
export async function setInterestAction(input: z.input<NonNullable<typeof setInterest.input>>): Promise<void> {
  const user = await requireUser();
  await fromPage(setInterest, user.id, input);
  revalidatePath(`/me/interests/${input.ref}`);
}

/** Mark an area done or skipped, sorting done, or the card put off; the dashboard reads it next. */
export async function setAreaAction(input: z.input<NonNullable<typeof setInterestArea.input>>): Promise<void> {
  const user = await requireUser();
  await fromPage(setInterestArea, user.id, input);
  revalidatePath("/dashboard");
}
