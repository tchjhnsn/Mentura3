"use server";

import { revalidatePath } from "next/cache";
import { checkHomeItem, removeHomeCard } from "@/server/home-cards-store";
import { requireUser } from "@/server/session";

const today = () => new Date().toISOString().slice(0, 10);

/** The x on a Home card: removes it from Home. */
export async function removeCardFromHome(id: string): Promise<void> {
  const user = await requireUser();
  await removeHomeCard(user.id, id);
  revalidatePath("/");
}

/** A tap on a checklist item (or a streak card's day): checks or unchecks it. */
export async function checkCardItem(id: string, item: number | null): Promise<void> {
  const user = await requireUser();
  await checkHomeItem(user.id, id, item, today());
  revalidatePath("/");
}
