"use server";

import type { Kind } from "@reflect/core/argument-practice";
import { isDialogue } from "@reflect/core/practice-settled";
import { requireUser } from "@/server/session";
import { recordAnswer, standing } from "@/server/practice";

/** Keep one answer and say how the item stands now. */
export async function answerAction(work: string, key: string, kind: Kind, answer: string) {
  const user = await requireUser();
  if (!isDialogue(work)) throw new Error("not a dialogue");
  await recordAnswer(user.id, work, key, kind, answer);
  return standing(work, key, kind);
}
