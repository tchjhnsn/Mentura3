"use server";

import { revalidatePath } from "next/cache";
import { addLifeRecord, keepLifeAct, lifeRecord, lifeRecords } from "@/server/life-store";
import { requireUser } from "@/server/session";

const today = () => new Date().toISOString().slice(0, 10);

/** The person's Health record, kept first when there is none. */
async function healthId(userId: string): Promise<string> {
  const h = (await lifeRecords(userId, "body")).find((r) => r.kind === "health");
  return h?.id ?? (await addLifeRecord(userId, "body", "health", {}));
}

/** Health's Log: a night's sleep in hours, or a visit to the doctor today. */
export async function logHealthAction(kind: string, amount: number | null): Promise<void> {
  const user = await requireUser();
  const id = await healthId(user.id);
  if (kind === "slept") {
    if (!(amount && amount > 0 && amount <= 24)) throw new Error("Pick the hours you slept.");
    await keepLifeAct(user.id, id, { kind: "slept", day: today(), minutes: Math.round(amount * 60) });
  } else if (kind === "appointment") {
    await keepLifeAct(user.id, id, { kind: "appointment", day: today() });
  } else throw new Error("No such thing to log.");
  revalidatePath("/", "layout");
}

/**
 * Fitness's Log: minutes of moderate or vigorous activity, or strength. It counts toward the guidelines whatever goal
 * it goes to; it goes to the goal under way, or to "Meet the activity guidelines", kept first when there is none.
 */
export async function logFitnessAction(kind: string, amount: number | null): Promise<void> {
  const user = await requireUser();
  if (!["moderate", "vigorous", "strength"].includes(kind)) throw new Error("No such activity.");
  if (!(amount && amount > 0 && amount <= 600)) throw new Error("Pick the minutes.");
  const goals = (await lifeRecords(user.id, "body")).filter((r) => r.kind === "fitness" && r.state !== "reached" && r.state !== "lapsed");
  const id = goals[0]?.id ?? (await addLifeRecord(user.id, "body", "fitness", { goal: "Meet the activity guidelines" }, "in-progress"));
  await keepLifeAct(user.id, id, { kind, day: today(), minutes: amount });
  revalidatePath("/", "layout");
}

/** Friends: time together today (in minutes), or a call, kept on that friend. */
export async function logFriendAction(id: string, kind: string, amount: number | null): Promise<void> {
  const user = await requireUser();
  const r = await lifeRecord(user.id, id);
  if (!r || r.app !== "friends" || r.kind !== "friend") throw new Error("No such friend.");
  if (kind === "saw") await keepLifeAct(user.id, id, { kind: "saw", day: today(), minutes: amount ?? undefined });
  else if (kind === "called") await keepLifeAct(user.id, id, { kind: "called", day: today(), minutes: amount ?? undefined });
  else throw new Error("No such thing to log.");
  revalidatePath("/", "layout");
}
