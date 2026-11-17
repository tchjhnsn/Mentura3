// A page's server action running a registry entry (Ask Reflect plan, step 4): the same entry the chat and MCP run,
// through runAction with source "page", so a change made on a page is in the change log and can be undone too.
import type { z } from "zod";
import type { Action } from "./types";
import { runAction } from "./run";

/**
 * Run an entry for the signed-in person from a page. The input is checked against the entry's schema first; what is
 * wrong with it comes back as a plain error, as the stores' own errors do.
 */
export async function fromPage<S extends z.ZodType, R>(a: Action<S, R>, userId: string, input: z.input<S>): Promise<R> {
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
  if (ran.held) throw new Error("That waits for a tap on its card in Ask.");
  return ran.result;
}
