import type { z } from "zod";
import type { Tier } from "@reflect/core/actions";
import type { LearnView } from "../learn-store";
import type { LearnItem } from "../ways-store";
import type { ClaimOut } from "../claims-store";

/** Where an action is offered: the chat in Reflect, or the person's own AI over MCP. */
export type Surface = "chat" | "mcp";

/** Records a caller already read for this request, so an action does not read them again. */
export type Loaded = { view?: LearnView; items?: LearnItem[]; claims?: ClaimOut[] | null };

/** Who an action runs for. */
export type ActionContext = { userId: string; today?: string; loaded?: Loaded };

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
  /** MCP's own wording, where it differs from the chat's: the same fields, other words. */
  mcp?: { description?: string; input?: z.ZodType };
};

/** Declare an action, keeping its input and result types for the callers. */
export const action = <S extends z.ZodType, R>(a: Action<S, R>): Action<S, R> => a;

export const describeFor = (a: Action, on: Surface) => (on === "mcp" ? (a.mcp?.description ?? a.description) : a.description);
export const inputFor = (a: Action, on: Surface) => (on === "mcp" ? (a.mcp?.input ?? a.input) : a.input);
