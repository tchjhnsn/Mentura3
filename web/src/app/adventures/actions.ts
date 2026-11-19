"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cleanChecklist, ideaById, peopleOf, toggleTile, WITH } from "@reflect/core/adventures";
import { requireUser } from "@/server/session";
import { adventureRecord } from "@/server/adventures";
import { geocode } from "@/server/geocode";
import { fromPage } from "@/server/actions/page";
import { addRecord, bodyFields, changeRecord, removeRecord, restoreRecord, setRecordState } from "@/server/actions/records";
import { adventureToCalendar } from "@/server/actions/adventure-calendar";

// Each change goes through the action registry (Ask Reflect plan, step 4), so it is in the change log and can be undone.

async function mine(userId: string, id: string) {
  const r = await adventureRecord(userId, id);
  if (!r) throw new Error("No such adventure.");
  return r;
}

/** Changes some of an adventure's fields, keeping the rest. */
async function patch(id: string, change: (b: Record<string, unknown>) => Record<string, unknown>): Promise<void> {
  const user = await requireUser();
  const r = await mine(user.id, id);
  await fromPage(changeRecord, user.id, { id, fields: bodyFields(change({ ...r.body })), whole: true });
  revalidatePath(`/adventures/${id}`);
  revalidatePath("/adventures");
}

/** Adds an adventure from an idea (a tap) or from the name the person typed, then opens it. */
export async function addAdventureAction(idea: string | null, form?: FormData): Promise<void> {
  const user = await requireUser();
  const i = idea ? ideaById(idea) : null;
  const name = i?.name ?? String(form?.get("name") ?? "").trim();
  if (!name) redirect("/adventures/new");
  const { id } = await fromPage(addRecord, user.id, { app: "legacy", kind: "adventure", fields: bodyFields({ name, ref: i?.id, tiles: i?.tiles.join(","), with: i?.with }), state: "not-yet" });
  revalidatePath("/adventures");
  redirect(`/adventures/${id}`);
}

export async function toggleAdventureTileAction(id: string, tile: string): Promise<void> {
  await patch(id, (b) => ({ ...b, tiles: toggleTile(b.tiles, tile) }));
}

export async function setAdventureWithAction(id: string, w: string): Promise<void> {
  if (!WITH.some((x) => x.id === w)) throw new Error("No such choice.");
  await patch(id, (b) => { if (b.with === w) delete b.with; else b.with = w; return b; });
}

/** Where it is: the words the person gave, placed on the map when OpenStreetMap finds them. */
export async function setAdventurePlaceAction(id: string, form: FormData): Promise<void> {
  const place = String(form.get("place") ?? "").trim().slice(0, 200);
  const hit = place ? await geocode(place) : null;
  await patch(id, (b) => { b.place = place || undefined; b.lat = hit?.lat; b.lon = hit?.lon; return b; });
}

export async function setAdventureDatesAction(id: string, form: FormData): Promise<void> {
  const start = String(form.get("start") ?? ""), end = String(form.get("end") ?? "");
  await patch(id, (b) => ({ ...b, start: start || undefined, end: end && end >= start ? end : undefined }));
}

export async function setAdventureBudgetAction(id: string, form: FormData): Promise<void> {
  await patch(id, (b) => ({ ...b, budget: String(form.get("budget") ?? "") || undefined }));
}

/** Keeps the plan Reflect drafted as the person's own. */
export async function keepAdventureDraftAction(id: string): Promise<void> {
  await patch(id, (b) => { delete b.drafted; return b; });
}

/** Throws away a drafted plan. */
export async function dropAdventureDraftAction(id: string): Promise<void> {
  await patch(id, (b) => { delete b.drafted; delete b.plan; return b; });
}

export async function toggleAdventureTaskAction(id: string, i: number): Promise<void> {
  await patch(id, (b) => { const l = cleanChecklist(b.checklist); if (l[i]) l[i].done = !l[i].done; return { ...b, checklist: JSON.stringify(l) }; });
}

export async function addAdventureTaskAction(id: string, form: FormData): Promise<void> {
  const text = String(form.get("text") ?? "").trim();
  if (!text) return;
  await patch(id, (b) => ({ ...b, checklist: JSON.stringify([...cleanChecklist(b.checklist), { text, done: false }]) }));
}

export async function addAdventurePersonAction(id: string, form: FormData): Promise<void> {
  const name = String(form.get("name") ?? "").replace(/,/g, " ").trim().slice(0, 80);
  if (!name) return;
  await patch(id, (b) => ({ ...b, people: [...peopleOf(b.people), name].join(", ") }));
}

export async function removeAdventurePersonAction(id: string, i: number): Promise<void> {
  await patch(id, (b) => ({ ...b, people: peopleOf(b.people).filter((_, j) => j !== i).join(", ") }));
}

/**
 * Puts the adventure on the person's calendar, one event a day from its start to its end, each day's plan as the
 * note. Run again, it replaces the events it put there before. Google Calendar comes with calendar sync.
 */
export async function addAdventureToCalendarAction(id: string): Promise<void> {
  const user = await requireUser();
  await mine(user.id, id);
  await fromPage(adventureToCalendar, user.id, { id });
  revalidatePath(`/adventures/${id}`);
  revalidatePath("/calendar");
}

export async function setAdventureDoneAction(id: string, done: boolean): Promise<void> {
  const user = await requireUser();
  await mine(user.id, id);
  await fromPage(setRecordState, user.id, { id, state: done ? "done" : "not-yet" });
  revalidatePath("/adventures");
  revalidatePath(`/adventures/${id}`);
}

export async function removeAdventureAction(id: string): Promise<void> {
  const user = await requireUser();
  await mine(user.id, id);
  await fromPage(removeRecord, user.id, { id });
  revalidatePath("/adventures");
  redirect(`/adventures?removed=${id}`);
}

export async function restoreAdventureAction(id: string): Promise<void> {
  const user = await requireUser();
  await fromPage(restoreRecord, user.id, { id });
  revalidatePath("/adventures");
  redirect("/adventures");
}
