// Why an action did not happen, as tagged errors (Effect's Data.TaggedError; Effect step 2), and what a model is told.
// Reflect's own code throws errors whose message is written for the person ("No such state", "That change was already
// undone"), so a model may repeat them. What it must not see is a database driver's message (it can name tables,
// constraints and values) or a programming error's; those become one plain sentence and are logged here.
import { Data } from "effect";
import type { OutsideError } from "../outside";

/** The runner's refusals, each a reason a surface can act on. */
export type RefusedReason =
  | "not-offered" // a never-tier action, or one no longer in the registry
  | "no-such-change" // not this person's change, or no change by that id
  | "already-made" // done, undone or claimed already
  | "declined" // the person declined it
  | "not-yet" // held, not run
  | "not-undoable" // shared or outside, or the action has no undo
  | "too-old"; // past the undo or hold window

/** The runner refused: nothing ran. The message is for the person. */
export class Refused extends Data.TaggedError("Refused")<{ readonly reason: RefusedReason; readonly message: string }> {}

const OUTSIDE = new Set<string>(["TimedOut", "Unreachable", "Busy"]);
const isOutside = (e: unknown): e is OutsideError => typeof e === "object" && e !== null && OUTSIDE.has(String((e as { _tag?: unknown })._tag));

/** A Postgres error from the driver: it carries a five-character SQLSTATE code and a severity. */
export const fromDatabase = (e: unknown): boolean =>
  typeof e === "object" && e !== null && typeof (e as { code?: unknown }).code === "string" && /^[0-9A-Z]{5}$/.test((e as { code: string }).code) && "severity" in e;

/** A bug in Reflect's code rather than a reason written for the person. */
const isBug = (e: unknown): boolean => e instanceof TypeError || e instanceof ReferenceError || e instanceof RangeError || e instanceof SyntaxError;

/**
 * What a model (in the chat or over MCP) is told when an action fails. A refusal or one of Reflect's own messages is
 * passed on as written; an outside service's failure is named; a database or programming error becomes one sentence,
 * and the change was rolled back (the run and its log are one transaction), so it says nothing changed.
 */
export function failureText(title: string, err: unknown): string {
  if (err instanceof Refused) return err.message;
  if (isOutside(err)) {
    const host = (() => {
      try {
        return new URL(err.url).hostname;
      } catch {
        return "An outside service";
      }
    })();
    if (err._tag === "TimedOut") return `${host} did not answer in time. Try again in a moment.`;
    if (err._tag === "Busy") return `${host} is busy (${err.status}). Try again in a moment.`;
    return `${host} could not be reached. Try again in a moment.`;
  }
  if (fromDatabase(err) || isBug(err) || !(err instanceof Error)) {
    console.error(`reflect: ${title} failed: ${err instanceof Error ? err.stack ?? err.message : String(err)}`);
    return `${title} did not work, and nothing was changed. Try again, or tell the person it failed.`;
  }
  return err.message;
}
