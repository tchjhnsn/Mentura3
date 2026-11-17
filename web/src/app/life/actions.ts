"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { kindOf } from "@reflect/core/life";
import { requireUser } from "@/server/session";
import { addLifeRecord, keepLifeAct, lifeRecords, lifeRecord, removeLifeRecord, restoreLifeRecord, saveLifeRecord, setLifeField, setLifeState } from "@/server/life-store";

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
  const id = await addLifeRecord(user.id, app, kind, fields(form), String(form.get("$state") ?? "") || undefined);
  revalidatePath("/", "layout");
  if (kindOf(app as never, kind)?.one) redirect(back(form, `/life/${app}?k=${kind}`));
  redirect(`/life/${app}/${id}`);
}

export async function saveLifeAction(id: string, form: FormData): Promise<void> {
  const user = await requireUser();
  await saveLifeRecord(user.id, id, fields(form));
  revalidatePath("/", "layout");
  redirect(back(form, `/life`));
}

export async function stateLifeAction(id: string, state: string, to: string): Promise<void> {
  const user = await requireUser();
  await setLifeState(user.id, id, state);
  revalidatePath("/", "layout");
  redirect(to.startsWith("/life/") ? to : "/");
}

export async function actLifeAction(id: string, form: FormData): Promise<void> {
  const user = await requireUser();
  await keepLifeAct(user.id, id, { kind: String(form.get("kind") ?? ""), day: String(form.get("day") ?? ""), minutes: form.get("minutes") ?? undefined, amount: form.get("amount") ?? undefined, note: form.get("note") ?? undefined });
  revalidatePath("/", "layout");
  redirect(back(form, "/"));
}

/** Keeps a night's sleep from Body's workspace, in hours, on the person's Health record, which it keeps first when there is none. */
export async function sleptAction(form: FormData): Promise<void> {
  const user = await requireUser();
  const hours = Number(String(form.get("hours") ?? "").replace(",", "."));
  if (!(hours > 0 && hours <= 24)) throw new Error("Give the hours you slept, up to 24.");
  const h = (await lifeRecords(user.id, "body")).find((r) => r.kind === "health");
  const id = h?.id ?? (await addLifeRecord(user.id, "body", "health", {}));
  await keepLifeAct(user.id, id, { kind: "slept", day: String(form.get("day") ?? ""), minutes: Math.round(hours * 60) });
  revalidatePath("/", "layout");
  redirect("/life/body");
}

/** Removes a record and returns to its app, where Undo restores it. */
export async function removeLifeAction(id: string): Promise<void> {
  const user = await requireUser();
  const r = await lifeRecord(user.id, id);
  if (!r) redirect("/");
  await removeLifeRecord(user.id, id);
  revalidatePath("/", "layout");
  redirect(`/life/${r.app}?k=${r.kind}&removed=${id}`);
}

export async function restoreLifeAction(id: string, to: string): Promise<void> {
  const user = await requireUser();
  await restoreLifeRecord(user.id, id);
  revalidatePath("/", "layout");
  redirect(to.startsWith("/life/") ? to : "/");
}

const toTile = (to: string) => (/^\/(life|meals)(\/|\?|$)/.test(to) ? to : "/");

/** Sets one fact of a need from a tap (a choice, or a standard part met or not), then goes back to the tile. */
export async function setFieldAction(app: string, kind: string, key: string, value: string | boolean | null, to: string): Promise<void> {
  const user = await requireUser();
  await setLifeField(user.id, app, kind, key, value);
  revalidatePath("/", "layout");
  redirect(toTile(to));
}

/** Sets one amount of a need (what it costs a month, gallons stored) from its own page. An empty amount clears it. */
export async function setAmountAction(app: string, kind: string, key: string, to: string, form: FormData): Promise<void> {
  const user = await requireUser();
  const raw = String(form.get("amount") ?? "").replace(/[$,\s]/g, "");
  const n = raw ? Number(raw) : null;
  if (n !== null && (!Number.isFinite(n) || n < 0)) redirect(toTile(to));
  await setLifeField(user.id, app, kind, key, n === null ? null : String(n));
  revalidatePath("/", "layout");
  redirect(toTile(to));
}

/** Adds a way of getting around from one tap. */
export async function addWayAction(how: string): Promise<void> {
  const user = await requireUser();
  await addLifeRecord(user.id, "home", "way", { how });
  revalidatePath("/", "layout");
  redirect("/life/home?k=transport");
}

/** Keeps "checked the standard" today on a need, keeping the record first when there is none. */
export async function checkedTodayAction(kind: string): Promise<void> {
  const user = await requireUser();
  let r = (await lifeRecords(user.id, "home")).find((x) => x.kind === kind);
  if (!r) { await addLifeRecord(user.id, "home", kind, {}); r = (await lifeRecords(user.id, "home")).find((x) => x.kind === kind); }
  await keepLifeAct(user.id, r!.id, { kind: "checked", day: new Date().toISOString().slice(0, 10) });
  revalidatePath("/", "layout");
  redirect(`/life/home?k=${kind}`);
}
