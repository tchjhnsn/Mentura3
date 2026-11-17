// The one way the MCP server runs a registry action (Ask Reflect plan, step 11). Read and own actions run at once
// through runAction (./actions/run.ts), which logs every change. Shared and outside actions are never run from
// another assistant: they are held for the person to tap in Reflect.
//
// Where the held path plugs in: `holdForTap` below. Today it runs nothing and tells the assistant the action
// waits for the person in Reflect. When run.ts gains its held path (a change kept with status "held" that the
// person approves in Reflect), replace the body of `holdForTap` with that call and return its change id, so the
// assistant can tell the person what is waiting. Nothing else in the MCP server needs to change.
import type { z } from "zod";
import type { Action, ActionContext } from "./actions";
import { runAction } from "./actions/run";

export type McpCall<R> =
  | { kind: "done"; result: R; changeId: string | null }
  | { kind: "held"; changeId: string | null; message: string };

/** Whether a tier's actions wait for the person's tap in Reflect when another assistant asks for them. */
export const heldOverMcp = (a: Pick<Action, "tier">): boolean => a.tier === "shared" || a.tier === "outside";

/** What the assistant is told when an action waits for the person. */
export function heldMessage(a: Pick<Action, "title" | "tier">): string {
  const tap = a.tier === "outside" ? "Send" : "Keep";
  return `${a.title}: this reaches beyond the person's own record, so Reflect does not do it for another assistant. It waits for the person to tap ${tap} in Reflect. Nothing has been done yet; tell the person so.`;
}

/** Holds a shared or outside action for the person's tap. The held path in run.ts plugs in here (see the top). */
export async function holdForTap<S extends z.ZodType, R>(_a: Action<S, R>, _ctx: ActionContext, _input: z.output<S>): Promise<{ changeId: string | null }> {
  return { changeId: null };
}

/** Run one action for the person an MCP token names. */
export async function callMcpAction<S extends z.ZodType, R>(a: Action<S, R>, ctx: ActionContext, input: z.output<S>): Promise<McpCall<R>> {
  if (a.tier === "never") throw new Error(`${a.id} is not offered to a model.`);
  if (heldOverMcp(a)) {
    const { changeId } = await holdForTap(a, ctx, input);
    return { kind: "held", changeId, message: heldMessage(a) };
  }
  const { result, changeId } = await runAction(a, ctx, input, "mcp");
  return { kind: "done", result, changeId };
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
