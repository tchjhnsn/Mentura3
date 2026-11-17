"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/server/session";
import { addLifeRecord, lifeRecord, removeLifeRecord, saveLifeRecord, setLifeState } from "@/server/life-store";

// Steps on Home's Not yet (doc "Already and Not yet design guide"): kept as hidden `step` records in Home.

function fields(form: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of form.entries()) if (!k.startsWith("$")) out[k] = String(v);
  return out;
}
const notYet = (id?: string) => `/?view=not-yet${id ? `&step=${encodeURIComponent(id)}` : ""}`;

async function ownStep(userId: string, id: string) {
  const r = await lifeRecord(userId, id);
  if (!r || r.kind !== "step") redirect(notYet());
  return r;
}

export async function addStepAction(form: FormData): Promise<void> {
  const user = await requireUser();
  const id = await addLifeRecord(user.id, "home", "step", fields(form), "not-yet");
  revalidatePath("/", "layout");
  redirect(notYet(id));
}

export async function saveStepAction(id: string, form: FormData): Promise<void> {
  const user = await requireUser();
  await ownStep(user.id, id);
  await saveLifeRecord(user.id, id, fields(form));
  revalidatePath("/", "layout");
  redirect(notYet(id));
}

/** It happened: the step joins Already. */
export async function happenedAction(id: string): Promise<void> {
  const user = await requireUser();
  await ownStep(user.id, id);
  await setLifeState(user.id, id, "happened");
  revalidatePath("/", "layout");
  redirect("/");
}

export async function removeStepAction(id: string): Promise<void> {
  const user = await requireUser();
  await ownStep(user.id, id);
  await removeLifeRecord(user.id, id);
  revalidatePath("/", "layout");
  redirect(notYet());
}
