// A page's server action running a registry entry (Ask Reflect plan, step 4): the same entry the chat and MCP run,
// through runAction with source "page", so a change made on a page is in the change log and can be undone too.
// A publishing action (`publishes`, Reflect framework plan step 6) is held from a page too; the person's tap on the
// page is their approval, so it runs at once through approveChange (source page) when its presentation gate is ready.
import type { z } from "zod";
import { Refused, type Gate } from "@reflect/core/registry";
import type { Action } from "./types";
import { approveChange, declineChange, gateText, runAction } from "./run";

/**
 * Run an entry for the signed-in person from a page. The input is checked against the entry's schema first; what is
 * wrong with it comes back as a plain error, as the stores' own errors do.
 */
export function fromPage<S extends z.ZodType, R>(a: Action<S, R>, userId: string, input: z.input<S>): Promise<R>;
/** The same, with the change log's id of the run, for a page that offers Undo (the dashboard's toast). */
export function fromPage<S extends z.ZodType, R>(a: Action<S, R>, userId: string, input: z.input<S>, opts: { change: true }): Promise<{ result: R; changeId: string | null }>;
export async function fromPage<S extends z.ZodType, R>(a: Action<S, R>, userId: string, input: z.input<S>, opts?: { change: true }): Promise<R | { result: R; changeId: string | null }> {
  let parsed = input as unknown;
  if (a.input) {
    const r = a.input.safeParse(input);
    if (!r.success) {
      const first = r.error.issues[0];
      throw new Error(first ? `${first.path.join(".") || "input"}: ${first.message}` : "That could not be read.");
    }
    parsed = r.data;
  }
  const ran = await runAction(a, { userId }, parsed as z.output<S>, "page");
  if (ran.held) {
    // Only a run that publishes carries a gate.
    if (ran.gate === undefined) throw new Error("That waits for a tap on its card in Ask.");
    const result = (await approveOnPage(userId, ran.changeId, ran.gate)) as R;
    return opts?.change ? { result, changeId: ran.changeId } : result;
  }
  return opts?.change ? { result: ran.result, changeId: ran.changeId } : ran.result;
}

/**
 * Approve a publishing action the person just asked for on a page: it runs when the gate is ready. When the gate is
 * not ready, or the run fails, the hold is declined, so a tap on the page never leaves a request waiting in Ask, and
 * the reason is thrown (not-presented, with what the record still needs).
 */
async function approveOnPage(userId: string, changeId: string, gate: Gate | undefined): Promise<unknown> {
  try {
    if (!gate?.ready) throw new Refused({ reason: "not-presented", message: gate ? gateText(gate) : "Not ready to go out." });
    return (await approveChange({ userId }, changeId, "page")).result;
  } catch (e) {
    await declineChange({ userId }, changeId).catch(() => undefined);
    throw e;
  }
}
