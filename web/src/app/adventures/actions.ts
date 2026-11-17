"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ideaById, toggleTile, WITH } from "@reflect/core/adventures";
import { requireUser } from "@/server/session";
import { addLifeRecord, lifeRecord, removeLifeRecord, restoreLifeRecord, saveLifeRecord, setLifeState } from "@/server/life-store";

async function mine(userId: string, id: string) {
  const r = await lifeRecord(userId, id);
  if (!r || r.app !== "legacy" || r.kind !== "adventure") throw new Error("No such adventure.");
  return r;
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

/** Turns one tile on or off for an adventure. */
export async function toggleAdventureTileAction(id: string, tile: string): Promise<void> {
  const user = await requireUser();
  const r = await mine(user.id, id);
  await saveLifeRecord(user.id, id, { ...r.body, tiles: toggleTile(r.body.tiles, tile) });
  revalidatePath(`/adventures/${id}`);
}

/** Sets who it is with; tapping the one already chosen clears it. */
export async function setAdventureWithAction(id: string, w: string): Promise<void> {
  const user = await requireUser();
  const r = await mine(user.id, id);
  if (!WITH.some((x) => x.id === w)) throw new Error("No such choice.");
  const body: Record<string, unknown> = { ...r.body };
  if (body.with === w) delete body.with; else body.with = w;
  await saveLifeRecord(user.id, id, body);
  revalidatePath(`/adventures/${id}`);
}

/** Marks it done (it moves to Already) or back to Not yet. */
export async function setAdventureDoneAction(id: string, done: boolean): Promise<void> {
  const user = await requireUser();
  await mine(user.id, id);
  await setLifeState(user.id, id, done ? "done" : "not-yet");
  revalidatePath("/adventures");
  revalidatePath(`/adventures/${id}`);
}

/** Takes an adventure off; the lens offers to undo it. */
export async function removeAdventureAction(id: string): Promise<void> {
  const user = await requireUser();
  await mine(user.id, id);
  await removeLifeRecord(user.id, id);
  revalidatePath("/adventures");
  redirect(`/adventures?removed=${id}`);
}

/** Puts back an adventure taken off. */
export async function restoreAdventureAction(id: string): Promise<void> {
  const user = await requireUser();
  await restoreLifeRecord(user.id, id);
  revalidatePath("/adventures");
  redirect("/adventures");
}
