"use server";

import type { Mark } from "@reflect/core/annotation-game";
import { isDialogue } from "@reflect/core/practice-settled";
import { requireUser } from "@/server/session";
import { playRound } from "@/server/practice";

/** Keep a round's marks and say how they went. */
export async function playAction(work: string, start: number, marks: Mark[]) {
  const user = await requireUser();
  if (!isDialogue(work)) throw new Error("not a dialogue");
  return playRound(user.id, work, start, marks.slice(0, 60));
}
