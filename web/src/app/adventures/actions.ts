"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { adventureOf, cleanChecklist, ideaById, peopleOf, toggleTile, WITH } from "@reflect/core/adventures";
import { requireUser } from "@/server/session";
import { addLifeRecord, lifeRecord, removeLifeRecord, restoreLifeRecord, saveLifeRecord, setLifeState } from "@/server/life-store";
import { addEvent, removeEvent } from "@/server/calendar-store";
import { geocode } from "@/server/geocode";

async function mine(userId: string, id: string) {
  const r = await lifeRecord(userId, id);
  if (!r || r.app !== "legacy" || r.kind !== "adventure") throw new Error("No such adventure.");
  return r;
}

/** Changes some of an adventure's fields, keeping the rest. */
async function patch(id: string, change: (b: Record<string, unknown>) => Record<string, unknown>): Promise<void> {
  const user = await requireUser();
  const r = await mine(user.id, id);
  await saveLifeRecord(user.id, id, change({ ...r.body }));
  revalidatePath(`/adventures/${id}`);
  revalidatePath("/adventures");
}

/** Adds an adventure from an idea (a tap) or from the name the person typed, then opens it. */
export async function addAdventureAction(idea: string | null, form?: FormData): Promise<void> {
  const user = await requireUser();
  const i = idea ? ideaById(idea) : null;
  const name = i?.name ?? String(form?.get("name") ?? "").trim();
  if (!name) redirect("/adventures/new");
  const id = await addLifeRecord(user.id, "legacy", "adventure", { name, ref: i?.id, tiles: i?.tiles.join(","), with: i?.with }, "not-yet");
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
  const r = await mine(user.id, id);
  const a = adventureOf(r);
  if (!a.start) throw new Error("Pick the dates first.");
  for (const e of String(r.body.events ?? "").split(",").filter(Boolean)) await removeEvent(user.id, e, true).catch(() => {});
  const ids: string[] = [];
  const last = a.end ?? a.start;
  for (let t = Date.parse(a.start), n = 0; t <= Date.parse(last) && n < 31; t += 86400_000, n++) {
    const d = new Date(t).toISOString().slice(0, 10);
    const plan = a.plan.find((p) => p.day === d) ?? (a.plan.every((p) => !p.day) ? a.plan.at(n) : undefined);
    const note = plan ? plan.stops.map((s) => `${s.time ? `${s.time} ` : ""}${s.title}`).join("\n") : null;
    ids.push(await addEvent(user.id, { title: a.name, tile: null, day: d, note, recordId: id }));
  }
  await saveLifeRecord(user.id, id, { ...r.body, events: ids.join(",") });
  revalidatePath(`/adventures/${id}`);
  revalidatePath("/calendar");
}

export async function setAdventureDoneAction(id: string, done: boolean): Promise<void> {
  const user = await requireUser();
  await mine(user.id, id);
  await setLifeState(user.id, id, done ? "done" : "not-yet");
  revalidatePath("/adventures");
  revalidatePath(`/adventures/${id}`);
}

export async function removeAdventureAction(id: string): Promise<void> {
  const user = await requireUser();
  await mine(user.id, id);
  await removeLifeRecord(user.id, id);
  revalidatePath("/adventures");
  redirect(`/adventures?removed=${id}`);
}

export async function restoreAdventureAction(id: string): Promise<void> {
  const user = await requireUser();
  await restoreLifeRecord(user.id, id);
  revalidatePath("/adventures");
  redirect("/adventures");
}
