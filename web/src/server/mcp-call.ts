// The one way the MCP server runs a registry action (Ask Reflect plan, step 11). Read and own actions run at once
// through runAction (./actions/run.ts), which logs every change. Shared and outside actions are never run from
// another assistant: runAction keeps them as held changes for the person to tap Keep or Send in Reflect.
import type { z } from "zod";
import type { Action, ActionContext } from "./actions";
import { HOLD_DAYS, runAction } from "./actions/run";
import { failureText } from "./actions/failure";
import { siteUrl } from "./site";

export type McpCall<R> =
  | { kind: "done"; result: R; changeId: string | null }
  | { kind: "held"; changeId: string; message: string };

/** Whether a tier's actions wait for the person's tap in Reflect when another assistant asks for them. */
export const heldOverMcp = (a: Pick<Action, "tier">): boolean => a.tier === "shared" || a.tier === "outside";

/** What the assistant is told when an action waits for the person. */
export function heldMessage(a: Pick<Action, "tier">, changeId: string, preview: string): string {
  const tap = a.tier === "outside" ? "Send" : "Keep";
  return `Not done yet. This waits for the person to tap ${tap} inside Reflect (Ask, at the top: ${siteUrl()}/chat), for ${HOLD_DAYS} days; nothing happens until they do. Change ${changeId}. What will happen:\n${preview}`;
}

/** Run one action for the person an MCP token names. Shared and outside actions are held by runAction, never run here. */
export async function callMcpAction<S extends z.ZodType, R>(a: Action<S, R>, ctx: ActionContext, input: z.output<S>): Promise<McpCall<R>> {
  if (a.tier === "never") throw new Error(`${a.id} is not offered to a model.`);
  // A failure reaches the assistant as failureText says: Reflect's own message, or one plain sentence for a database
  // or programming error, never the driver's text.
  const ran = await runAction(a, ctx, input, "mcp").catch((err: unknown) => {
    throw new Error(failureText(a.title, err));
  });
  if (ran.held) return { kind: "held", changeId: ran.changeId, message: heldMessage(a, ran.changeId, ran.preview) };
  return { kind: "done", result: ran.result, changeId: ran.changeId };
}

export type McpAllows = { read: string[]; own: string[]; held: string[] };

/** What another assistant may do, by tier, in the actions' own titles: the consent page shows it before the person allows. */
export function mcpAllows(actions: readonly Pick<Action, "title" | "tier">[]): McpAllows {
  const out: McpAllows = { read: [], own: [], held: [] };
  for (const a of actions) {
    if (a.tier === "read") out.read.push(a.title);
    else if (a.tier === "own") out.own.push(a.title);
    else if (heldOverMcp(a)) out.held.push(a.title);
  }
  return out;
}
