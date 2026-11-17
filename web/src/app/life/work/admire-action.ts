"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { exemplarById } from "@reflect/core/formation";
import { requireUser } from "@/server/session";
import { addLifeRecord, lifeRecords, removeLifeRecord, saveLifeRecord } from "@/server/life-store";

/**
 * Keeps a person as an inspiration with the traits of theirs the person chose; keeping them again changes the traits.
 * Choosing no trait takes them off.
 */
export async function admireAction(id: string, form: FormData): Promise<void> {
  const user = await requireUser();
  const e = exemplarById(id);
  if (!e) throw new Error("No such person.");
  const traits = form.getAll("trait").map(String).filter((t) => e.traits.some((x) => x.trait === t));
  const had = (await lifeRecords(user.id, "work")).find((x) => x.kind === "admired" && x.body.ref === id);
  const body = { ref: id, title: e.name, traits: [...new Set(traits)].join(",") };
  if (!traits.length) { if (had) await removeLifeRecord(user.id, had.id); }
  else if (had) await saveLifeRecord(user.id, had.id, body);
  else await addLifeRecord(user.id, "work", "admired", body);
  revalidatePath("/", "layout");
  redirect(`/life/work/people/${id}`);
}
