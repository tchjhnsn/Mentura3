// Running a registry action as a surface does (Ask Reflect plan, steps 2 and 3): every non-read run is kept in the
// change log, an own-tier change can be undone by the same person within 30 days, and a shared or outside action
// asked for from the chat or MCP does not run: it is held with a preview until the person taps Keep or Send.
// The runner is the core's (@reflect/core/registry, Reflect framework plan step 4); this file is the app's host for
// it: the Postgres change log, the Postgres transaction, the app's registry, the plans a held step resumes, and the
// presentation gate (Reflect framework plan, step 6) over the person's presentations in Postgres, so a publishing
// action (`publishes`, such as publish_to_site) waits for a record that passes the gate and the person's approval.
import type { z } from "zod";
import { makeRunner, type Ran } from "@reflect/core/registry";
import { transaction } from "@/db/pool";
import { postgresChanges } from "../action-change-store";
import { postgresPresentations, presentationGate } from "../presentation-store";
import type { Action, ActionContext, ChangeLog, LoggedChange, Source } from "./types";
import { actionById } from "./index";
import { resumeAfterApproval, stopAfterDecline, type PlanView } from "./workflows";

export { HOLD_DAYS, UNDO_DAYS } from "./limits";
export { canApprove, gateText, holds, plainPreview, type Gate, type Pending, type Ran } from "@reflect/core/registry";

export const changesOf = (ctx: ActionContext): ChangeLog => ctx.changes ?? postgresChanges;

// Each of these is looked up when called, not when this module loads: index.ts imports actions that import this file.
const runner = makeRunner<ActionContext, Action, { plan: PlanView }>({
  changes: (ctx) => changesOf(ctx),
  // The run and its change log are one Postgres transaction: when the log cannot be kept, what the run wrote is
  // rolled back and the error is thrown, so no change happens without its entry (and its undo).
  transaction: (f) => transaction(f),
  actionById: (id) => actionById(id),
  // A held step of a plan: the plan goes on from the next step. The change has happened whatever the plan does next.
  afterApprove: async (ctx, c) => {
    const plan = c.source === "workflow" ? await resumeAfterApproval(ctx, c.id).catch((err: Error) => (console.error(`reflect: could not resume a plan: ${err.message}`), null)) : null;
    return plan ? { plan } : {};
  },
  // A declined step stops its plan: nothing after it runs.
  afterDecline: async (ctx, c, title) => {
    if (c.source === "workflow") await stopAfterDecline(ctx, c.id, title).catch((err: Error) => console.error(`reflect: could not stop a plan: ${err.message}`));
  },
  // A publishing action names its presentation record by id in its input's `presentation` field, as in a vault.
  gate: (ctx, channel, input) =>
    presentationGate(ctx.presentations ?? postgresPresentations(ctx.userId), input && typeof input === "object" ? (input as { presentation?: unknown }).presentation : undefined, channel),
});

/**
 * Run an action and keep what it changed. A read changes nothing and is not kept. A shared or outside action from the
 * chat or MCP is not run: it is kept as held, with its input and a preview, and waits for approveChange. The run and
 * its change log are one transaction (`transaction` in @/db/pool). When keeping a hold fails, nothing has happened, so
 * the error is thrown.
 */
export const runAction = <S extends z.ZodType, R>(a: Action<S, R>, given: ActionContext, input: z.output<S>, source: Source): Promise<Ran<R>> => runner.runAction(a, given, input, source);

/** Whether a logged change can still be undone now: own tier, an action with undo, done, and under 30 days old. */
export const canUndo = (c: LoggedChange, now = new Date()): boolean => runner.canUndo(c, now);

/** Undo one of the person's own changes. Refuses another person's change, a shared or outside one, and one too old. */
export const undoChange = runner.undoChange;

/**
 * Run a held change, as the person who owns it, when they tap Keep or Send. It runs once; a second tap is refused. The
 * run and keeping its before and after are one transaction; if either fails, the change goes back to held. A held step
 * of a plan resumes the plan, and its view comes back as `plan`.
 */
export const approveChange = runner.approveChange;

/** Decline a held change: it never runs. Only the person who owns it, and only while it is held. */
export const declineChange = runner.declineChange;

/** The person's held changes that can still be approved, newest first. */
export const pendingChanges = runner.pendingChanges;
