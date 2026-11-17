// Running a registry action as a surface does (Ask Reflect plan, step 2): every non-read run is kept in the change
// log, and an own-tier change can be undone by the same person within 30 days.
import type { z } from "zod";
import { postgresChanges } from "../action-change-store";
import type { Action, ActionContext, ChangeLog, LoggedChange, Source } from "./types";
import { actionById } from "./index";

export const UNDO_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

export const changesOf = (ctx: ActionContext): ChangeLog => ctx.changes ?? postgresChanges;

/**
 * Run an action and keep what it changed. A read changes nothing and is not kept. When keeping it fails, the change
 * has still happened, so the result is returned with no change id rather than an error.
 */
export async function runAction<S extends z.ZodType, R>(a: Action<S, R>, ctx: ActionContext, input: z.output<S>, source: Source): Promise<{ result: R; changeId: string | null }> {
  if (a.tier === "read") return { result: await a.run(ctx, input), changeId: null };
  const before = a.before ? await a.before(ctx, input) : undefined;
  const result = await a.run(ctx, input);
  const c = a.change?.(result, input, before) ?? {};
  try {
    const changeId = await changesOf(ctx).add({ userId: ctx.userId, actionId: a.id, source, tier: a.tier, input: input ?? {}, before: c.before ?? null, after: c.after ?? null });
    return { result, changeId };
  } catch (err) {
    console.error(`reflect: could not log ${a.id}: ${(err as Error).message}`);
    return { result, changeId: null };
  }
}

/** Whether a logged change can still be undone now: own tier, an action with undo, done, and under 30 days old. */
export function canUndo(c: LoggedChange, now = new Date()): boolean {
  const a = actionById(c.actionId);
  return c.tier === "own" && Boolean(a?.undo) && c.status === "done" && now.getTime() - c.createdAt.getTime() <= UNDO_DAYS * DAY_MS;
}

/** Undo one of the person's own changes. Refuses another person's change, a shared or outside one, and one too old. */
export async function undoChange(ctx: ActionContext, id: string): Promise<{ undone: string; title: string }> {
  const log = changesOf(ctx);
  const c = await log.get(ctx.userId, id);
  if (!c || c.userId !== ctx.userId) throw new Error("No such change.");
  if (c.status === "undone") throw new Error("That change was already undone.");
  if (c.status !== "done") throw new Error("That change has not happened yet.");
  const a = actionById(c.actionId);
  if (c.tier !== "own" || !a?.undo) throw new Error(`${a?.title ?? c.actionId} cannot be undone here.`);
  if (!canUndo(c, ctx.now ?? new Date())) throw new Error(`Changes can be undone for ${UNDO_DAYS} days; this one is older.`);
  await a.undo(ctx, c);
  if (!(await log.markUndone(ctx.userId, id))) throw new Error("That change was already undone.");
  return { undone: c.id, title: a.title };
}
