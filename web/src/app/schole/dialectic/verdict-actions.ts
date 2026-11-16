"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { debateRecord } from "@reflect/core/dialectic-media";
import { requireUser } from "@/server/session";
import { createWork, saveWork } from "@/server/work-store";
import { verdictBody } from "./verdict";

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();

/**
 * Keep the person's verdict on a debate as a note in their journal, filed under learning (Torian, 2026-11-16 18:26Z,
 * "your verdict into the journal"). It is private like every journal work, and opens in the journal's editor.
 */
export async function keepVerdictAction(form: FormData): Promise<void> {
  const user = await requireUser();
  const title = str(form, "title").slice(0, 200);
  const why = str(form, "why").slice(0, 5000);
  const side = str(form, "side").slice(0, 300);
  const back = str(form, "back");
  if (!title || (!why && !side)) return;
  const record = debateRecord(str(form, "url"));
  const id = await createWork(user.id, "blank", title, "learn");
  await saveWork(user.id, id, "My verdict", verdictBody({ title, motion: record?.motion ?? null, side, why }));
  revalidatePath("/schole/notes");
  const to = back.startsWith("/schole/") && !back.startsWith("//") ? back : "/schole/notes";
  redirect(`${to}${to.includes("?") ? "&" : "?"}verdict=${id}#verdict`);
}
