"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/server/session";
import { fromPage } from "@/server/actions/page";
import { addEvent as addEventEntry } from "@/server/actions/calendar";
import {
  addPost, closeRoom, createDebate, createRoom, createThread, getDebate, letSpeak, removePost, roomEvent, sayInRoom, startDebate, takeSeat,
} from "@/server/dialectic-store";
import { addPost as addTopicPost, correctStance, follow, formDebate, regrade, removePost as removeTopicPost, repost, writeTurn } from "@/server/discussion-store";

const str = (f: FormData, k: string) => String(f.get(k) ?? "");

/** A datetime-local value ("2026-11-20T19:00") read in the person's zone, from their offset in minutes. */
function fromLocal(local: string, tz: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(local)) return null;
  const offset = Number(tz);
  const utc = Date.parse(`${local}:00Z`) + (Number.isFinite(offset) ? offset : 0) * 60_000;
  return Number.isFinite(utc) ? new Date(utc).toISOString() : null;
}

export async function createDebateAction(form: FormData): Promise<void> {
  const user = await requireUser();
  const id = await createDebate(user.id, { motion: form.get("motion"), workId: form.get("work"), source: form.get("source"), format: form.get("format"), startsAt: fromLocal(str(form, "when"), str(form, "tz")), side: form.get("side") });
  redirect(`/schole/dialectic/debates/${id}`);
}

export async function takeSeatAction(form: FormData): Promise<void> {
  const user = await requireUser();
  const id = str(form, "id");
  const side = str(form, "side");
  if (side === "for" || side === "against") await takeSeat(user.id, id, side);
  revalidatePath(`/schole/dialectic/debates/${id}`);
}

/** Remind me: puts the debate on the person's Scholē schedule, at its time in their zone. */
export async function remindAction(form: FormData): Promise<void> {
  const user = await requireUser();
  const d = await getDebate(str(form, "id"));
  if (!d) return;
  // Through the registry's add_event (Ask Reflect plan, step 4), so the reminder is in the change log and can be undone.
  await fromPage(addEventEntry, user.id, { title: `Debate: ${d.motion}`.slice(0, 200), tile: "learn", day: str(form, "day"), ...(str(form, "starts") ? { starts: str(form, "starts") } : {}), note: `/schole/dialectic/debates/${d.id}` });
  redirect(`/schole/dialectic/debates/${d.id}?reminded=1`);
}

export async function startDebateAction(form: FormData): Promise<void> {
  const user = await requireUser();
  const room = await startDebate(user.id, str(form, "id"));
  await roomEvent(user.id, room, "join");
  redirect(`/schole/dialectic/rooms/${room}`);
}

export async function createRoomAction(form: FormData): Promise<void> {
  const user = await requireUser();
  const id = await createRoom(user.id, { title: form.get("title"), question: form.get("question"), workId: form.get("work") });
  redirect(`/schole/dialectic/rooms/${id}`);
}

export async function roomAction(form: FormData): Promise<void> {
  const user = await requireUser();
  const id = str(form, "id");
  const act = str(form, "act");
  if (act === "join" || act === "hand") await roomEvent(user.id, id, act);
  if (act === "leave") { await roomEvent(user.id, id, "leave"); redirect("/schole/dialectic"); }
  if (act === "let") await letSpeak(user.id, id, str(form, "user"));
  if (act === "close") await closeRoom(user.id, id);
  if (act === "say") await sayInRoom(user.id, id, form.get("body"));
  revalidatePath(`/schole/dialectic/rooms/${id}`);
}

export async function createThreadAction(form: FormData): Promise<void> {
  const user = await requireUser();
  const id = await createThread(user.id, { question: form.get("question"), workId: form.get("work"), body: form.get("body") });
  redirect(`/schole/dialectic/threads/${id}`);
}

export async function postAction(form: FormData): Promise<void> {
  const user = await requireUser();
  const id = str(form, "thread");
  await addPost(user.id, id, form.get("body"), str(form, "parent") || null);
  revalidatePath(`/schole/dialectic/threads/${id}`);
}

export async function removePostAction(form: FormData): Promise<void> {
  const user = await requireUser();
  await removePost(user.id, str(form, "post"));
  revalidatePath(`/schole/dialectic/threads/${str(form, "thread")}`);
}

/* ---------- discussions on topics and written debates (migration 0037) ---------- */

const back = (f: FormData) => { const p = str(f, "path"); return p.startsWith("/schole/") ? p : "/schole/dialectic"; };

export async function topicPostAction(form: FormData): Promise<void> {
  const user = await requireUser();
  await addTopicPost(user.id, str(form, "topic") || null, form.get("body"), str(form, "parent") || null);
  revalidatePath(back(form));
}

export async function correctStanceAction(form: FormData): Promise<void> {
  const user = await requireUser();
  await correctStance(user.id, str(form, "post"), str(form, "stance"));
  revalidatePath(back(form));
}

export async function regradeAction(form: FormData): Promise<void> {
  await requireUser();
  await regrade(str(form, "post"));
  revalidatePath(back(form));
}

export async function removeTopicPostAction(form: FormData): Promise<void> {
  const user = await requireUser();
  await removeTopicPost(user.id, str(form, "post"));
  revalidatePath(back(form));
}

export async function formDebateAction(form: FormData): Promise<void> {
  const user = await requireUser();
  const id = await formDebate(user.id, str(form, "post"), { motion: form.get("motion"), side: form.get("side") });
  redirect(`/schole/dialectic/debates/${id}`);
}

export async function writeTurnAction(form: FormData): Promise<void> {
  const user = await requireUser();
  const id = str(form, "id");
  await writeTurn(user.id, id, form.get("body"));
  revalidatePath(`/schole/dialectic/debates/${id}`);
}

export async function repostAction(form: FormData): Promise<void> {
  const user = await requireUser();
  await repost(user.id, str(form, "post"), str(form, "on") === "1");
  revalidatePath(back(form));
}

export async function followAction(form: FormData): Promise<void> {
  const user = await requireUser();
  const id = str(form, "user");
  await follow(user.id, id, str(form, "on") === "1");
  revalidatePath(`/schole/dialectic/u/${id}`);
}
