"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/server/session";
import { lifeRecord, lifeRecords } from "@/server/life-store";
import { listItems } from "@/server/ways-store";
import { fromPage } from "@/server/actions/page";
import { addRecord, changeRecord } from "@/server/actions/records";
import { mainAim, writeToward } from "@/server/actions/work-life";

// Each change goes through the action registry (Ask Reflect plan, step 4), so it is in the change log and can be undone.

const TYPES = new Set(["job", "career", "venture", "company", "other"]);

/** Add work the person wants that is not in a catalog: a job, a career or a venture of their own, by name. */
export async function addOwnAction(form: FormData): Promise<void> {
  const user = await requireUser();
  const title = String(form.get("title") ?? "").trim().slice(0, 300);
  if (!title) throw new Error("Name the work.");
  const type = String(form.get("type") ?? "");
  const { id } = await fromPage(addRecord, user.id, { app: "work", kind: "inspiration", fields: { title, type: TYPES.has(type) ? type : "other" } });
  revalidatePath("/", "layout");
  redirect(`/life/work/${id}`);
}

/** Start a journal entry toward work the person wants, kept on that work as what moved them toward it. */
export async function writeTowardAction(recordId: string): Promise<void> {
  const user = await requireUser();
  const { id } = await fromPage(writeToward, user.id, { id: recordId });
  revalidatePath("/", "layout");
  redirect(`/journal/w/${id}`);
}

/** Say which of the things being learned in Learn are toward this work. */
export async function learningTowardAction(recordId: string, back: string, form: FormData): Promise<void> {
  const user = await requireUser();
  const r = await lifeRecord(user.id, recordId);
  if (!r || r.app !== "work") throw new Error("No such work.");
  const mine = new Set((await listItems(user.id)).map((i) => i.id));
  const ids = form.getAll("learning").map(String).filter((id) => mine.has(id));
  await fromPage(changeRecord, user.id, { id: recordId, fields: { learning: ids.join(",") || null } });
  revalidatePath("/", "layout");
  redirect(back.startsWith("/life/work") ? `${back}#toward` : "/life/work");
}

/** The hours a week the person can give to work right now. */
export async function hoursAction(form: FormData): Promise<void> {
  const user = await requireUser();
  const raw = String(form.get("hours") ?? "").trim();
  const hours = raw === "" ? undefined : Math.round(Number(raw));
  if (hours !== undefined && !(hours >= 0 && hours <= 100)) throw new Error("Give hours from 0 to 100.");
  const had = (await lifeRecords(user.id, "work")).find((r) => r.kind === "now");
  if (had) await fromPage(changeRecord, user.id, { id: had.id, fields: hours === undefined ? {} : { hours }, whole: true });
  else await fromPage(addRecord, user.id, { app: "work", kind: "now", fields: hours === undefined ? {} : { hours } });
  revalidatePath("/", "layout");
  redirect("/life/work/season");
}

/** Star one aim as the main aim; the others lose the star. */
export async function mainAction(recordId: string): Promise<void> {
  const user = await requireUser();
  await fromPage(mainAim, user.id, { id: recordId });
  revalidatePath("/", "layout");
  redirect(`/life/work/${recordId}`);
}
