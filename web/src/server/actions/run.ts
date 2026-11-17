// Running a registry action as a surface does (Ask Reflect plan, steps 2 and 3): every non-read run is kept in the
// change log, an own-tier change can be undone by the same person within 30 days, and a shared or outside action
// asked for from the chat or MCP does not run: it is held with a preview until the person taps Keep or Send.
import type { z } from "zod";
import type { Tier } from "@reflect/core/actions";
import { postgresChanges } from "../action-change-store";
import type { Action, ActionContext, ChangeLog, LoggedChange, Source } from "./types";
import { actionById } from "./index";

export const UNDO_DAYS = 30;
/** How long a held change waits for the person's tap. After that it cannot be approved; the model asks again. */
export const HOLD_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

export const changesOf = (ctx: ActionContext): ChangeLog => ctx.changes ?? postgresChanges;

/** Whether a run waits for the person: a shared or outside action asked for by a model, from the chat or over MCP. */
export const holds = (tier: Tier, source: Source) => (tier === "shared" || tier === "outside") && (source === "chat" || source === "mcp");

/** What runAction did: ran (with the change id, or null for a read or a log that failed), or held it unrun. */
export type Ran<R> = { held: false; result: R; changeId: string | null } | { held: true; changeId: string; preview: string };

const said = (v: unknown): string => (typeof v === "string" ? v : JSON.stringify(v));
/** The preview of an action with no `preview` of its own: its title, then each input field as given. */
export function plainPreview(title: string, input: unknown): string {
  const fields = input && typeof input === "object" ? Object.entries(input as Record<string, unknown>).filter(([, v]) => v !== undefined) : [];
  return [`${title}.`, ...fields.map(([k, v]) => `${k.replace(/_/g, " ")}: ${said(v)}`)].join("\n");
}

/**
 * Run an action and keep what it changed. A read changes nothing and is not kept. A shared or outside action from the
 * chat or MCP is not run: it is kept as held, with its input and a preview, and waits for approveChange. When keeping
 * a run fails, the change has still happened, so the result is returned with no change id rather than an error; when
 * keeping a hold fails, nothing has happened, so the error is thrown.
 */
export async function runAction<S extends z.ZodType, R>(a: Action<S, R>, ctx: ActionContext, input: z.output<S>, source: Source): Promise<Ran<R>> {
  if (a.tier === "never") throw new Error(`${a.title} is never run for a model.`);
  if (a.tier === "read") return { held: false, result: await a.run(ctx, input), changeId: null };
  if (holds(a.tier, source)) {
    const preview = a.preview ? await a.preview(ctx, input) : plainPreview(a.title, input);
    const changeId = await changesOf(ctx).hold({ userId: ctx.userId, actionId: a.id, source, tier: a.tier, input: input ?? {}, preview });
    return { held: true, changeId, preview };
  }
  const before = a.before ? await a.before(ctx, input) : undefined;
  const result = await a.run(ctx, input);
  const c = a.change?.(result, input, before) ?? {};
  try {
    const changeId = await changesOf(ctx).add({ userId: ctx.userId, actionId: a.id, source, tier: a.tier, input: input ?? {}, before: c.before ?? null, after: c.after ?? null });
    return { held: false, result, changeId };
  } catch (err) {
    console.error(`reflect: could not log ${a.id}: ${(err as Error).message}`);
    return { held: false, result, changeId: null };
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

/** Whether a held change can still be approved now: held, and made within the last 7 days. */
export function canApprove(c: LoggedChange, now = new Date()): boolean {
  return c.status === "held" && now.getTime() - c.createdAt.getTime() <= HOLD_DAYS * DAY_MS;
}

/** Reads a held change for approveChange and declineChange: the person's own, and still held. */
async function heldOf(ctx: ActionContext, id: string): Promise<LoggedChange> {
  const c = await changesOf(ctx).get(ctx.userId, id);
  if (!c || c.userId !== ctx.userId) throw new Error("No such change.");
  if (c.status === "done" || c.status === "undone") throw new Error("That change was already made.");
  if (c.status === "declined") throw new Error("That change was declined.");
  return c;
}

/**
 * Run a held change, as the person who owns it, when they tap Keep or Send. It runs once: claiming it moves it from
 * held to done in one step, so a second tap (or a second tab) is refused. If the run fails it goes back to held.
 * Refuses another person's change, one already made or declined, and one older than 7 days.
 */
export async function approveChange(ctx: ActionContext, id: string): Promise<{ approved: string; title: string; result: unknown }> {
  const log = changesOf(ctx);
  const c = await heldOf(ctx, id);
  const a = actionById(c.actionId);
  if (!a || a.tier === "never") throw new Error(`${a?.title ?? c.actionId} cannot be run here.`);
  const now = ctx.now ?? new Date();
  if (!canApprove(c, now)) throw new Error(`A held change waits ${HOLD_DAYS} days; this one is older. Ask again.`);
  if (!(await log.claim(ctx.userId, id, new Date(now.getTime() - HOLD_DAYS * DAY_MS)))) throw new Error("That change was already made.");
  let before: unknown;
  let result: unknown;
  try {
    before = a.before ? await a.before(ctx, c.input) : undefined;
    result = await a.run(ctx, c.input);
  } catch (err) {
    await log.release(ctx.userId, id).catch(() => undefined);
    throw err;
  }
  const made = a.change?.(result, c.input, before) ?? {};
  try {
    await log.settle(ctx.userId, id, { before: made.before ?? null, after: made.after ?? null });
  } catch (err) {
    console.error(`reflect: could not log ${a.id}: ${(err as Error).message}`);
  }
  return { approved: id, title: a.title, result };
}

/** Decline a held change: it never runs. Only the person who owns it, and only while it is held. */
export async function declineChange(ctx: ActionContext, id: string): Promise<{ declined: string; title: string }> {
  const c = await heldOf(ctx, id);
  if (!(await changesOf(ctx).decline(ctx.userId, id))) throw new Error("That change is no longer waiting.");
  return { declined: id, title: actionById(c.actionId)?.title ?? c.actionId };
}

/** One held change as the surfaces show it. */
export type Pending = { id: string; action: string; title: string; tier: Tier; source: LoggedChange["source"]; at: string; until: string; preview: string };

/** The person's held changes that can still be approved, newest first. */
export async function pendingChanges(ctx: ActionContext, limit = 20): Promise<Pending[]> {
  const now = ctx.now ?? new Date();
  const list = await changesOf(ctx).held(ctx.userId, new Date(now.getTime() - HOLD_DAYS * DAY_MS), limit);
  return list.filter((c) => canApprove(c, now)).map((c) => ({
    id: c.id,
    action: c.actionId,
    title: actionById(c.actionId)?.title ?? c.actionId,
    tier: c.tier,
    source: c.source,
    at: c.createdAt.toISOString(),
    until: new Date(c.createdAt.getTime() + HOLD_DAYS * DAY_MS).toISOString(),
    preview: c.preview ?? plainPreview(actionById(c.actionId)?.title ?? c.actionId, c.input),
  }));
}
