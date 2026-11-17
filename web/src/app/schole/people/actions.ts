"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/server/session";
import { fromPage } from "@/server/actions/page";
import { followPerson } from "@/server/actions/learn-page";

/** Follows a guest or host, or stops following them. */
export async function followPersonAction(form: FormData): Promise<void> {
  const user = await requireUser();
  const name = String(form.get("name") ?? "");
  await fromPage(followPerson, user.id, { name, qid: String(form.get("qid") ?? "") || null, follow: form.get("follow") === "1" });
  revalidatePath(`/schole/people/${encodeURIComponent(name)}`);
  revalidatePath("/schole/people");
}
