import type { z } from "zod";
import type { Action as CoreAction, ChangeLog, Source, Surface } from "@reflect/core/registry";
import type { LearnView } from "../learn-store";
import type { LearnItem } from "../ways-store";
import type { ClaimOut } from "../claims-store";
import type { Presentations } from "@reflect/core/files-presentations";

/** Records a caller already read for this request, so an action does not read them again. */
export type Loaded = { view?: LearnView; items?: LearnItem[]; claims?: ClaimOut[] | null };

// The framework's types (what an action is, where a run comes from, the change log) are the core's
// (@reflect/core/registry), so the CLI and an MCP server over a vault share them; this file adds the app's context.
export type { Change, ChangeLog, HeldChange, LoggedChange, NewChange, Source, Surface } from "@reflect/core/registry";

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
 * Who an action runs for. `changes`, `workflows`, `presentations` and `now` stand in for the database and the clock in tests.
 * `origin` is where the request first came from (the chat, MCP, a page); runAction sets it to the source when it is
 * not set, and a plan's steps carry the plan's, so a step asked for from the chat still waits for the person's tap.
 */
export type ActionContext = { userId: string; today?: string; loaded?: Loaded; changes?: ChangeLog; workflows?: WorkflowStore; now?: Date; origin?: Source; presentations?: Presentations };

/**
 * One thing a model can do in Reflect: the core's action (@reflect/core/registry) over the app's context, with zod
 * inputs, which the chat and MCP build their tools from. `run` returns data; each surface turns it into its own reply.
 */
export type Action<S extends z.ZodType = z.ZodType, R = unknown> = CoreAction<ActionContext, S, R, z.ZodType>;

/** Declare an action, keeping its input and result types for the callers. */
export const action = <S extends z.ZodType, R>(a: Action<S, R>): Action<S, R> => a;

export { idsIn } from "@reflect/core/registry";

export const describeFor = (a: Action, on: Surface) => (on === "mcp" ? (a.mcp?.description ?? a.description) : a.description);
export const inputFor = (a: Action, on: Surface) => (on === "mcp" ? (a.mcp?.input ?? a.input) : a.input);
