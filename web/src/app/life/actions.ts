"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { kindOf } from "@reflect/core/life";
import { requireUser } from "@/server/session";
import { lifeRecord } from "@/server/life-store";
import { fromPage } from "@/server/actions/page";
import { addRecord, changeRecord, logAct, quickLog, removeRecord, restoreRecord, setRecordField, setRecordState } from "@/server/actions/records";

// Each change goes through the action registry (Ask Reflect plan, step 4), so it is in the change log and can be undone.

/** The form's fields; a field sent more than once (the origins marked) is kept as its values joined by commas. */
function fields(form: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of form.entries()) if (!k.startsWith("$")) out[k] = k in out ? `${out[k]},${String(v)}` : String(v);
  return out;
}
const back = (form: FormData, fallback: string) => {
  const to = String(form.get("$back") ?? "");
  return to.startsWith("/life/") ? to : fallback;
};

/** Keeps a new record; a kind kept once stays on its app's page, any other opens its own page. */
export async function addLifeAction(app: string, kind: string, form: FormData): Promise<void> {
  const user = await requireUser();
  const { id } = await fromPage(addRecord, user.id, { app: app as never, kind, fields: fields(form), state: String(form.get("$state") ?? "") || undefined });
  revalidatePath("/", "layout");
  if (kindOf(app as never, kind)?.one) redirect(back(form, `/life/${app}?k=${kind}`));
  redirect(`/life/${app}/${id}`);
}

export async function saveLifeAction(id: string, form: FormData): Promise<void> {
  const user = await requireUser();
  await fromPage(changeRecord, user.id, { id, fields: fields(form), whole: true });
  revalidatePath("/", "layout");
  redirect(back(form, `/life`));
}

export async function stateLifeAction(id: string, state: string, to: string): Promise<void> {
  const user = await requireUser();
  await fromPage(setRecordState, user.id, { id, state });
  revalidatePath("/", "layout");
  redirect(to.startsWith("/life/") ? to : "/");
}

export async function actLifeAction(id: string, form: FormData): Promise<void> {
  const user = await requireUser();
  const num = (k: string) => (String(form.get(k) ?? "").trim() === "" ? undefined : Number(String(form.get(k)).replace(/[$,\s]/g, "")));
  const note = String(form.get("note") ?? "").trim();
  await fromPage(logAct, user.id, { id, kind: String(form.get("kind") ?? ""), day: String(form.get("day") ?? ""), minutes: num("minutes"), amount: num("amount"), ...(note ? { note } : {}) });
  revalidatePath("/", "layout");
  redirect(back(form, "/"));
}

/** Keeps a night's sleep from Body's workspace, in hours, on the person's Health record, which it keeps first when there is none. */
export async function sleptAction(form: FormData): Promise<void> {
  const user = await requireUser();
  const hours = Number(String(form.get("hours") ?? "").replace(",", "."));
  if (!(hours > 0 && hours <= 24)) throw new Error("Give the hours you slept, up to 24.");
  const day = String(form.get("day") ?? "");
  await fromPage(quickLog, user.id, { tile: "health", kind: "slept", amount: hours, ...(day ? { day } : {}) });
  revalidatePath("/", "layout");
  redirect("/life/body");
}

/** Removes a record and returns to its app, where Undo restores it. */
export async function removeLifeAction(id: string): Promise<void> {
  const user = await requireUser();
  const r = await lifeRecord(user.id, id);
  if (!r) redirect("/");
  await fromPage(removeRecord, user.id, { id });
  revalidatePath("/", "layout");
  redirect(`/life/${r.app}?k=${r.kind}&removed=${id}`);
}

export async function restoreLifeAction(id: string, to: string): Promise<void> {
  const user = await requireUser();
  await fromPage(restoreRecord, user.id, { id });
  revalidatePath("/", "layout");
  redirect(to.startsWith("/life/") ? to : "/");
}

const toTile = (to: string) => (/^\/(life|meals)(\/|\?|$)/.test(to) ? to : "/");

/** Sets one fact of a need from a tap (a choice, or a standard part met or not), then goes back to the tile. */
export async function setFieldAction(app: string, kind: string, key: string, value: string | boolean | null, to: string): Promise<void> {
  const user = await requireUser();
  await fromPage(setRecordField, user.id, { app: app as never, kind, key, value });
  revalidatePath("/", "layout");
  redirect(toTile(to));
}

/** Sets one amount of a need (what it costs a month, gallons stored) from its own page. An empty amount clears it. */
export async function setAmountAction(app: string, kind: string, key: string, to: string, form: FormData): Promise<void> {
  const user = await requireUser();
  const raw = String(form.get("amount") ?? "").replace(/[$,\s]/g, "");
  const n = raw ? Number(raw) : null;
  if (n !== null && (!Number.isFinite(n) || n < 0)) redirect(toTile(to));
  await fromPage(setRecordField, user.id, { app: app as never, kind, key, value: n === null ? null : String(n) });
  revalidatePath("/", "layout");
  redirect(toTile(to));
}

/** Adds a way of getting around from one tap. */
export async function addWayAction(how: string): Promise<void> {
  const user = await requireUser();
  await fromPage(addRecord, user.id, { app: "home", kind: "way", fields: { how } });
  revalidatePath("/", "layout");
  redirect("/life/home?k=transport");
}

/** Keeps "checked the standard" today on a need, keeping the record first when there is none. */
export async function checkedTodayAction(kind: string): Promise<void> {
  const user = await requireUser();
  await fromPage(quickLog, user.id, { tile: "home", kind });
  revalidatePath("/", "layout");
  redirect(`/life/home?k=${kind}`);
}

/** Sets one fact in words or a day (a doctor's name, the last checkup) from its own page. Empty clears it. */
export async function setWordsAction(app: string, kind: string, key: string, to: string, form: FormData): Promise<void> {
  const user = await requireUser();
  const v = String(form.get("value") ?? "").trim();
  await fromPage(setRecordField, user.id, { app: app as never, kind, key, value: v || null });
  revalidatePath("/", "layout");
  redirect(toTile(to));
}
