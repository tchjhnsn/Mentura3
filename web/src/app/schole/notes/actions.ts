"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/server/session";
import { createWork } from "@/server/work-store";

/** A new note in the journal, filed under learning, opening in the editor; about a thing when named (a quote at its top). */
export async function newNoteAction(about: string | null): Promise<void> {
  const user = await requireUser();
  const id = await createWork(user.id, "blank", about ? about.slice(0, 200) : null, "learn");
  revalidatePath("/schole/notes");
  redirect(`/journal/w/${id}`);
}
