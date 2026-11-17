// The change log as actions (Ask Reflect plan, step 2): what the person's AI changed lately, and Undo.
import { z } from "zod";
import { action } from "./types";
import { canUndo, changesOf, undoChange } from "./run";
import { UNDO_DAYS } from "./limits";
import { actionById } from "./index";

export const recentChanges = action({
  id: "recent_changes",
  title: "The person's recent changes",
  description: `The changes made lately in the person's Reflect by actions (from this chat, their own AI, pages), newest first: what was done, from where, when, whether it was undone, and whether it can still be undone (own changes, for ${UNDO_DAYS} days). Read it before undo_change.`,
  tier: "read",
  on: ["chat", "mcp"],
  input: z.object({ limit: z.number().int().min(1).max(50).default(10) }),
  run: async (ctx, { limit }) => {
    const now = ctx.now ?? new Date();
    return (await changesOf(ctx).recent(ctx.userId, limit)).map((c) => ({
      id: c.id,
      action: c.actionId,
      title: actionById(c.actionId)?.title ?? c.actionId,
      source: c.source,
      at: c.createdAt.toISOString(),
      status: c.status,
      can_undo: canUndo(c, now),
      after: c.after,
    }));
  },
});

export const undoChangeAction = action({
  id: "undo_change",
  title: "Undo one of the person's changes",
  description: `Undo a change made in the person's own records, only when they ask: give its id from recent_changes or from the action that made it. Own changes only, for ${UNDO_DAYS} days. Say what was undone.`,
  tier: "own",
  on: ["chat", "mcp"],
  input: z.object({ change_id: z.string().uuid() }),
  run: async (ctx, { change_id }) => undoChange(ctx, change_id),
});
