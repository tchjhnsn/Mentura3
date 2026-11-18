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
  status: "done" | "held" | "undone" | "declined";
  /** For a held change, what will happen in plain words, shown with Keep or Send (migration 0046). Null otherwise. */
  preview: string | null;
  createdAt: Date;
  undoneAt: Date | null;
};
export type NewChange = Pick<LoggedChange, "userId" | "actionId" | "source" | "tier" | "input" | "before" | "after">;
/** A shared or outside run that waits for the person's tap: its input and the preview, nothing run yet. */
export type HeldChange = Pick<LoggedChange, "userId" | "actionId" | "source" | "tier" | "input"> & { preview: string };

/** Where changes are kept: Postgres in the app (../action-change-store.ts), a fake in tests. Every call is for one person. */
export interface ChangeLog {
  add(c: NewChange): Promise<string>;
  get(userId: string, id: string): Promise<LoggedChange | null>;
  recent(userId: string, limit: number): Promise<LoggedChange[]>;
  /** Marks a done change undone; false when it is not the person's or not done. */
  markUndone(userId: string, id: string): Promise<boolean>;
  /** Keeps a held change (status 'held'), which has not run. */
  hold(c: HeldChange): Promise<string>;
  /** The person's held changes made at or after `since`, newest first. */
  held(userId: string, since: Date, limit: number): Promise<LoggedChange[]>;
  /** Takes a held change to run it: held becomes done in one step, so only one caller gets true. False when it is not
   * the person's, not held, or made before `since`. */
  claim(userId: string, id: string, since: Date): Promise<boolean>;
  /** Writes what a claimed change's run did. */
  settle(userId: string, id: string, c: { before: unknown; after: unknown }): Promise<void>;
  /** Puts a claimed change back to held when its run failed, so the person can tap again. */
  release(userId: string, id: string): Promise<void>;
  /** Marks a held change declined; false when it is not the person's or not held. */
  decline(userId: string, id: string): Promise<boolean>;
}

/** One step of a plan (./workflows.ts): a registry action with its checked input, and how far it got. */
export type PlanStep = {
  action: string;
  input: unknown;
  status: "not_started" | "done" | "waiting" | "declined" | "failed";
  /** The change log's id once the step ran or was held; null before, and for a read. */
  change: string | null;
  /** For a held step, what will happen, as its Approval card shows it. */
  preview?: string;
  /** Why a step failed. */
  note?: string;
};

/** A plan of registry calls run one after another (migration 0048): `waiting` while a held step waits for the tap. */
export type Workflow = {
  id: string;
  userId: string;
  /** Where the plan was asked for: shared and outside steps hold for the chat and MCP, as they would asked alone. */
  origin: Source;
  title: string;
  status: "running" | "waiting" | "done" | "failed";
  /** The index of the step running or waiting, or steps.length when done. */
  current: number;
  steps: PlanStep[];
  /** The held step's change id while waiting, else null. */
  waitingChange: string | null;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
};

/** Where plans are kept: Postgres in the app (../workflow-store.ts), a fake in tests. Every call is for one person. */
export interface WorkflowStore {
  create(w: Pick<Workflow, "userId" | "origin" | "title" | "steps">): Promise<string>;
  get(userId: string, id: string): Promise<Workflow | null>;
  /** Writes a plan's status, current step, steps, waiting change and note. */
  save(w: Workflow): Promise<void>;
  /** The plan waiting on this held change, if any. */
  waitingOn(userId: string, changeId: string): Promise<Workflow | null>;
  /** Takes a plan waiting on this change, moving it to `to` in one step, so only one caller gets true. */
  claim(userId: string, id: string, changeId: string, to: "running" | "failed"): Promise<boolean>;
  /** The person's plans in these statuses, newest first. */
  list(userId: string, statuses: readonly Workflow["status"][], limit: number): Promise<Workflow[]>;
}

/**
 * Who an action runs for. `changes`, `workflows` and `now` stand in for the database and the clock in tests.
 * `origin` is where the request first came from (the chat, MCP, a page); runAction sets it to the source when it is
 * not set, and a plan's steps carry the plan's, so a step asked for from the chat still waits for the person's tap.
 */
export type ActionContext = { userId: string; today?: string; loaded?: Loaded; changes?: ChangeLog; workflows?: WorkflowStore; now?: Date; origin?: Source };

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
  /**
   * What the change log keeps of the input, for an input too large or too private to keep whole (an uploaded file's
   * text). Left out, the input itself. A held change keeps its whole input, since it runs from it later.
   */
  logged?(input: z.output<S>): unknown;
  /** What a run changed, kept in the change log (runAction in ./run.ts). Left out, only the input is kept. */
  change?(result: R, input: z.output<S>, before: unknown): Change;
  /**
   * For a shared or outside action: what a run will do, in plain words (the event, the exact message text, the plan
   * edit), shown to the person with Keep or Send before it runs. Left out, the title and the input are shown.
   */
  preview?(ctx: ActionContext, input: z.output<S>): string | Promise<string>;
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
