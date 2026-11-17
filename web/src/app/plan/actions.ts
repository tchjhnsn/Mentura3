"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/server/session";
import { lifeRecord } from "@/server/life-store";
import { fromPage } from "@/server/actions/page";
import { addRecord, changeRecord, removeRecord, setRecordState } from "@/server/actions/records";

// Steps on Home's Not yet (doc "Already and Not yet design guide"): kept as hidden `step` records in Home. Each change
// goes through the action registry (Ask Reflect plan, step 4), so it is in the change log and can be undone.

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
  const { id } = await fromPage(addRecord, user.id, { app: "home", kind: "step", fields: fields(form), state: "not-yet" });
  revalidatePath("/", "layout");
  redirect(notYet(id));
}

export async function saveStepAction(id: string, form: FormData): Promise<void> {
  const user = await requireUser();
  await ownStep(user.id, id);
  await fromPage(changeRecord, user.id, { id, fields: fields(form), whole: true });
  revalidatePath("/", "layout");
  redirect(notYet(id));
}

/** It happened: the step joins Already. */
export async function happenedAction(id: string): Promise<void> {
  const user = await requireUser();
  await ownStep(user.id, id);
  await fromPage(setRecordState, user.id, { id, state: "happened" });
  revalidatePath("/", "layout");
  redirect("/");
}

export async function removeStepAction(id: string): Promise<void> {
  const user = await requireUser();
  await ownStep(user.id, id);
  await fromPage(removeRecord, user.id, { id });
  revalidatePath("/", "layout");
  redirect(notYet());
}
