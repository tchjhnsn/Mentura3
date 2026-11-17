// Approvals as an action (Ask Reflect plan, step 3): the shared and outside changes waiting for the person's Keep or
// Send tap inside Reflect. A model can list them; only the person approves or declines, by tapping (never a tool).
import { z } from "zod";
import { action } from "./types";
import { pendingChanges } from "./run";
import { HOLD_DAYS } from "./limits";

export const pendingChangesAction = action({
  id: "pending_changes",
  title: "Changes waiting for the person",
  description: `The changes waiting for the person's tap inside Reflect, newest first: shared ones (they tap Keep) and ones that leave Reflect (they tap Send), each with exactly what will happen. Asked for here or by their own AI, they wait ${HOLD_DAYS} days. You cannot approve or decline one; tell the person it waits for them in Reflect, at the top of Ask.`,
  tier: "read",
  on: ["chat", "mcp"],
  input: z.object({ limit: z.number().int().min(1).max(50).default(20) }),
  run: async (ctx, { limit }) => pendingChanges(ctx, limit),
});
