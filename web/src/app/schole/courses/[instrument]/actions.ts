"use server";

import { revalidatePath } from "next/cache";
import { instrumentById, instrumentHref } from "@reflect/core/instruments";
import { requireUser } from "@/server/session";
import { fromPage } from "@/server/actions/page";
import { learnedPiece, logPracticeAction as logPracticeEntry } from "@/server/actions/learn-page";

// Through the registry (Ask Reflect plan, step 4), so practice logged here is in the change log as the chat's is.

const of = (id: string) => {
  const x = instrumentById(id);
  if (!x) throw new Error("No such instrument.");
  return x;
};

/** Log practice (QuickLog): the minutes, on today's piece or on scales and exercises. */
export async function logPracticeAction(instrument: string, kind: string, amount: number | null): Promise<void> {
  const user = await requireUser();
  const x = of(instrument);
  await fromPage(logPracticeEntry, user.id, { instrument: x.id, kind, minutes: amount ?? 0 });
  revalidatePath(instrumentHref(x));
  revalidatePath("/schole");
}

/** A piece learned, or taken back. */
export async function learnedAction(instrument: string, piece: string, learned: boolean): Promise<void> {
  const user = await requireUser();
  const x = of(instrument);
  await fromPage(learnedPiece, user.id, { instrument: x.id, piece, learned });
  revalidatePath(instrumentHref(x));
}
