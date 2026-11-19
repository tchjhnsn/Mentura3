"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/server/session";
import { fromPage } from "@/server/actions/page";
import { craftAct, keepCraft, saveCraftAnswers, saveCraftPicks, setCraftLearned, setCraftStage, setCraftState, setCraftVouch } from "@/server/actions/crafts";

// Through the registry (Ask Reflect plan, step 4): the chat's own entries, so a change here is in the change log too.

type Answer = "like" | "unsure" | "not";
const STATES = ["drawn", "trying", "practising", "let-go"] as const;
type State = (typeof STATES)[number];
const stateOf = (v: FormDataEntryValue | null): State | undefined => ((STATES as readonly string[]).includes(String(v)) ? (String(v) as State) : undefined);

/** Keep a craft from the catalogue (drawn to it by default); a craft already kept takes the state given. */
export async function keepCraftAction(form: FormData): Promise<void> {
  const user = await requireUser();
  await fromPage(keepCraft, user.id, { ref: String(form.get("ref") ?? ""), state: stateOf(form.get("state")) });
  revalidatePath("/schole", "layout");
}

/** Keep the person's Discover crafts answers, all of them at once. */
export async function saveCraftAnswersAction(answers: Record<string, Answer>): Promise<void> {
  const user = await requireUser();
  await fromPage(saveCraftAnswers, user.id, { answers });
  revalidatePath("/schole", "layout");
}

/** Keep the worlds and crafts the person picked in the photo picker, both lists whole. */
export async function savePicksAction(worlds: string[], picks: string[]): Promise<void> {
  const user = await requireUser();
  await fromPage(saveCraftPicks, user.id, { worlds, picks });
}

/** Move a kept craft to drawn, trying, practising or let go. */
export async function setCraftStateAction(ref: string, state: State): Promise<void> {
  const user = await requireUser();
  await fromPage(setCraftState, user.id, { ref, state });
  revalidatePath("/schole", "layout");
}

/** Set where the person is with a craft, on the Dreyfus five steps. */
export async function setCraftStageAction(ref: string, stage: string): Promise<void> {
  const user = await requireUser();
  await fromPage(setCraftStage, user.id, { ref, stage });
  revalidatePath(`/schole/crafts/${ref}`);
}

/** Set how the person learned a craft (several may be true). */
export async function setCraftLearnedAction(ref: string, how: string[]): Promise<void> {
  const user = await requireUser();
  await fromPage(setCraftLearned, user.id, { ref, how });
  revalidatePath(`/schole/crafts/${ref}`);
}

/** Keep that the person tried a craft once, or made something with it. */
export async function craftActAction(ref: string, kind: "tried" | "made", note?: string): Promise<void> {
  const user = await requireUser();
  await fromPage(craftAct, user.id, { ref, kind, note });
  revalidatePath(`/schole/crafts/${ref}`);
}

/** Set which Reflect friends vouch for the person's craft. */
export async function setCraftVouchAction(ref: string, friends: string[]): Promise<void> {
  const user = await requireUser();
  await fromPage(setCraftVouch, user.id, { ref, friends });
  revalidatePath(`/schole/crafts/${ref}`);
}
