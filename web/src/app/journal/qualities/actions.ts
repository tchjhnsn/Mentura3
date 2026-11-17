"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { exemplarById, traitById } from "@reflect/core/formation";
import { requireUser } from "@/server/session";
import { addLifeRecord, keepLifeAct, lifeRecords, removeLifeRecord, saveLifeRecord } from "@/server/life-store";
import { createWork } from "@/server/work-store";
import { qualityRecord } from "@/server/qualities";

const safe = (to: string) => (to.startsWith("/schole/") || to.startsWith("/journal/") ? to : "/journal/qualities");

/** Keep or take off one quality a person names, with that person as where it was seen (the + on their page). */
export async function toggleQualityAction(exemplar: string, trait: string, back: string): Promise<void> {
  const user = await requireUser();
  const e = exemplarById(exemplar);
  if (!e || !e.traits.some((t) => t.trait === trait)) throw new Error("No such quality.");
  const had = (await lifeRecords(user.id, "work")).find((x) => x.kind === "admired" && x.body.ref === exemplar);
  const traits = new Set(String(had?.body.traits ?? "").split(",").filter(Boolean));
  if (traits.has(trait)) traits.delete(trait); else traits.add(trait);
  const body = { ref: exemplar, title: e.name, traits: [...traits].join(",") };
  if (!traits.size) { if (had) await removeLifeRecord(user.id, had.id); }
  else if (had) await saveLifeRecord(user.id, had.id, body);
  else await addLifeRecord(user.id, "work", "admired", body);
  revalidatePath("/", "layout");
  redirect(safe(back));
}

/** Take a quality off the lens: no person keeps it any more. What was written about it stays in the journal. */
export async function takeOffQualityAction(trait: string): Promise<void> {
  const user = await requireUser();
  for (const r of (await lifeRecords(user.id, "work")).filter((x) => x.kind === "admired")) {
    const traits = String(r.body.traits ?? "").split(",").filter(Boolean);
    if (!traits.includes(trait)) continue;
    const left = traits.filter((t) => t !== trait);
    if (left.length) await saveLifeRecord(user.id, r.id, { ...r.body, traits: left.join(",") });
    else await removeLifeRecord(user.id, r.id);
  }
  revalidatePath("/", "layout");
  redirect("/journal/qualities");
}

/** Start a journal entry about a quality, kept on it. */
export async function writeQualityAction(trait: string): Promise<void> {
  const user = await requireUser();
  const t = traitById(trait);
  if (!t) throw new Error("No such quality.");
  const id = (await qualityRecord(user.id, t.id))?.id ?? await addLifeRecord(user.id, "work", "quality", { ref: t.id, title: t.name });
  const work = await createWork(user.id, "blank", `On ${t.name.toLowerCase()}`);
  await keepLifeAct(user.id, id, { kind: "wrote", day: new Date().toISOString().slice(0, 10), note: work });
  revalidatePath("/", "layout");
  redirect(`/journal/w/${work}`);
}
