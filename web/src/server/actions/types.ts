import type { z } from "zod";
import type { Tier } from "@reflect/core/actions";
import type { LearnView } from "../learn-store";
import type { LearnItem } from "../ways-store";
import type { ClaimOut } from "../claims-store";

/** Where an action is offered: the chat in Reflect, or the person's own AI over MCP. */
export type Surface = "chat" | "mcp";

/** Records a caller already read for this request, so an action does not read them again. */
export type Loaded = { view?: LearnView; items?: LearnItem[]; claims?: ClaimOut[] | null };

/** Where a run of an action came from: the chat, the person's own AI over MCP, a page in Reflect, or a workflow. */
export type Source = "chat" | "mcp" | "page" | "workflow";

/** What a run changed, as `change` reports it: the state before (to put back) and after (what was made). */
export type Change = { before?: unknown; after?: unknown };

/** One logged run of a non-read action (`action_change`, migration 0044). */
export type LoggedChange = {
  id: string;
  userId: string;
  actionId: string;
  source: Source;
  tier: Tier;
  input: unknown;
  before: unknown;
  after: unknown;
  status: "done" | "held" | "undone";
  createdAt: Date;
  undoneAt: Date | null;
};
export type NewChange = Pick<LoggedChange, "userId" | "actionId" | "source" | "tier" | "input" | "before" | "after">;

/** Where changes are kept: Postgres in the app (../action-change-store.ts), a fake in tests. Every call is for one person. */
export interface ChangeLog {
  add(c: NewChange): Promise<string>;
  get(userId: string, id: string): Promise<LoggedChange | null>;
  recent(userId: string, limit: number): Promise<LoggedChange[]>;
  /** Marks a done change undone; false when it is not the person's or not done. */
  markUndone(userId: string, id: string): Promise<boolean>;
}

/** Who an action runs for. `changes` and `now` stand in for the database and the clock in tests. */
export type ActionContext = { userId: string; today?: string; loaded?: Loaded; changes?: ChangeLog; now?: Date };

/**
 * One thing a model can do in Reflect. `run` returns data; each surface turns it into its own reply (the chat's
 * cards and words, MCP's text). The id is the tool name both surfaces use.
 */
export type Action<S extends z.ZodType = z.ZodType, R = unknown> = {
  id: string;
  title: string;
  /** The description the model reads. Where the chat's and MCP's wording differ today, `mcp.description` is MCP's. */
  description: string;
  tier: Tier;
  /** The input. Left out for an MCP tool that takes none (it is then registered with no input schema). */
  input?: S;
  on: readonly Surface[];
  run(ctx: ActionContext, input: z.output<S>): Promise<R>;
  /** Reads what a run will change, before it runs, so Undo can put it back. Its value reaches `change` as `before`. */
  before?(ctx: ActionContext, input: z.output<S>): Promise<unknown>;
  /** What a run changed, kept in the change log (runAction in ./run.ts). Left out, only the input is kept. */
  change?(result: R, input: z.output<S>, before: unknown): Change;
  /** Puts back what a logged run changed. Only own-tier actions have it; left out, the change cannot be undone. */
  undo?(ctx: ActionContext, change: LoggedChange): Promise<void>;
  /** MCP's own wording, where it differs from the chat's: the same fields, other words. */
  mcp?: { description?: string; input?: z.ZodType };
};

/** Declare an action, keeping its input and result types for the callers. */
export const action = <S extends z.ZodType, R>(a: Action<S, R>): Action<S, R> => a;

/** The strings under `key` of a logged before or after, such as the ids a run made. */
export function idsIn(v: unknown, key: string): string[] {
  const list = v && typeof v === "object" ? (v as Record<string, unknown>)[key] : undefined;
  return Array.isArray(list) ? list.filter((x): x is string => typeof x === "string") : typeof list === "string" ? [list] : [];
}

export const describeFor = (a: Action, on: Surface) => (on === "mcp" ? (a.mcp?.description ?? a.description) : a.description);
export const inputFor = (a: Action, on: Surface) => (on === "mcp" ? (a.mcp?.input ?? a.input) : a.input);
