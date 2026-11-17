"use server";

import { revalidatePath } from "next/cache";
import { instrumentById, instrumentHref } from "@reflect/core/instruments";
import { requireUser } from "@/server/session";
import { logPractice, setPieceLearned } from "@/server/instruments";

const of = (id: string) => {
  const x = instrumentById(id);
  if (!x) throw new Error("No such instrument.");
  return x;
};

/** Log practice (QuickLog): the minutes, on today's piece or on scales and exercises. */
export async function logPracticeAction(instrument: string, kind: string, amount: number | null): Promise<void> {
  const user = await requireUser();
  const x = of(instrument);
  const piece = x.pieces.find((p) => p.id === kind);
  if (!piece && kind !== "technique") throw new Error("No such piece.");
  await logPractice(user.id, x, amount ?? 0, piece ? piece.title : "Scales and exercises");
  revalidatePath(instrumentHref(x));
  revalidatePath("/schole");
}

/** A piece learned, or taken back. */
export async function learnedAction(instrument: string, piece: string, learned: boolean): Promise<void> {
  const user = await requireUser();
  const x = of(instrument);
  await setPieceLearned(user.id, x, piece, learned);
  revalidatePath(instrumentHref(x));
}
