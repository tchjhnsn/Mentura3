"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/server/session";
import { fromPage } from "@/server/actions/page";
import { addEvent } from "@/server/actions/calendar";
import { changeEvent, removeEventAction as removeEventEntry, restoreEventAction as restoreEventEntry } from "@/server/actions/calendar-events";

// Through the registry (Ask Reflect plan, step 4): the chat's own entries, so a change here is in the change log too.

const back = (form: FormData) => {
  const b = String(form.get("$back") ?? "");
  return b.startsWith("/calendar") ? b : "/calendar";
};
/** The form's fields, an empty one left out. */
const fields = (form: FormData) => {
  const out: Record<string, string> = {};
  for (const k of ["title", "tile", "day", "starts", "ends", "repeat", "until", "note"]) {
    const v = String(form.get(k) ?? "").trim();
    if (v) out[k] = v;
  }
  return out as { title: string; day: string };
};

export async function addEventAction(form: FormData): Promise<void> {
  const user = await requireUser();
  await fromPage(addEvent, user.id, fields(form));
  revalidatePath("/calendar");
  redirect(back(form));
}

export async function saveEventAction(id: string, form: FormData): Promise<void> {
  const user = await requireUser();
  await fromPage(changeEvent, user.id, { id, ...fields(form) });
  revalidatePath("/calendar");
  redirect(back(form));
}

export async function removeEventAction(id: string, form: FormData): Promise<void> {
  const user = await requireUser();
  await fromPage(removeEventEntry, user.id, { id });
  revalidatePath("/calendar");
  const b = back(form);
  redirect(`${b}${b.includes("?") ? "&" : "?"}removed=${id}`);
}

export async function restoreEventAction(id: string, form: FormData): Promise<void> {
  const user = await requireUser();
  await fromPage(restoreEventEntry, user.id, { id });
  revalidatePath("/calendar");
  redirect(back(form).replace(/[?&]removed=[^&]+/, ""));
}
