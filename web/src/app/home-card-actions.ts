"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/server/session";
import { fromPage } from "@/server/actions/page";
import { checkHomeItemAction, removeHomeCardAction } from "@/server/actions/home-cards";

// Through the registry (Ask Reflect plan, step 4): the chat's own entries, so a tap here is in the change log too.

/** The x on a Home card: removes it from Home. */
export async function removeCardFromHome(id: string): Promise<void> {
  const user = await requireUser();
  await fromPage(removeHomeCardAction, user.id, { id });
  revalidatePath("/");
}

/** A tap on a checklist item (or a streak card's day): checks or unchecks it. */
export async function checkCardItem(id: string, item: number | null): Promise<void> {
  const user = await requireUser();
  await fromPage(checkHomeItemAction, user.id, { id, ...(item === null ? {} : { item }) });
  revalidatePath("/");
}
