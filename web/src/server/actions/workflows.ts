// Plans (Ask Reflect plan, step 9): a multi-step ask ("plan my month's budget, then add bill reminders to my
// calendar, then put the total on Home") runs as an ordered list of registry calls. Every step is checked against its
// action's input and tier before anything runs. Steps run through runAction with source "workflow" and the plan's
// origin, so a shared or outside step asked for from the chat or MCP is held, as it would be asked alone, and the plan
// waits. It is kept in Postgres (migration 0048, ../workflow-store.ts) after every step, and goes on from the store
// when the person taps Keep or Send (approveChange in ./run.ts), or stops when they tap Decline or a step fails.
import { z } from "zod";
import type { Tier } from "@reflect/core/actions";
import { action, type ActionContext, type PlanStep, type Source, type Workflow, type WorkflowStore } from "./types";
import { actionById } from "./index";
import { runAction } from "./run";
import { postgresWorkflows } from "../workflow-store";

export const MAX_STEPS = 12;
export const workflowsOf = (ctx: ActionContext): WorkflowStore => ctx.workflows ?? postgresWorkflows;

/** Actions that cannot be a step: a plan does not start or list plans. */
const NOT_STEPS = new Set(["start_plan", "plans"]);

/** One step as the surfaces show it. */
export type StepView = { action: string; title: string; tier: Tier; status: PlanStep["status"]; change: string | null; note?: string };
/** A plan as the surfaces show it: its steps and, while it waits, the held step's Approval. */
export type PlanView = {
  id: string;
  title: string;
  status: Workflow["status"];
  steps: StepView[];
  waiting: { change: string; title: string; preview: string; tier: "shared" | "outside" } | null;
  note: string | null;
};

export function planView(w: Workflow): PlanView {
  const steps = w.steps.map((s): StepView => {
    const a = actionById(s.action);
    return { action: s.action, title: a?.title ?? s.action, tier: a?.tier ?? "never", status: s.status, change: s.change, ...(s.note ? { note: s.note } : {}) };
  });
  const held = w.status === "waiting" ? w.steps[w.current] : undefined;
  const heldAction = held ? actionById(held.action) : undefined;
  return {
    id: w.id,
    title: w.title,
    status: w.status,
    steps,
    waiting: held?.change && heldAction ? { change: held.change, title: heldAction.title, preview: held.preview ?? heldAction.title, tier: heldAction.tier === "outside" ? "outside" : "shared" } : null,
    note: w.note,
  };
}

const issues = (e: z.ZodError) => e.issues.map((i) => `${i.path.join(".") || "input"}: ${i.message}`).join("; ");

/**
 * Checks every step before anything runs: the action exists, is offered where the plan was asked for, is not never
 * tier and is not a plan itself, and its input passes the action's schema. Throws one message naming every problem.
 */
export function checkSteps(list: readonly { action: string; input?: unknown }[], origin: Source): PlanStep[] {
  const errors: string[] = [];
  const out: PlanStep[] = [];
  list.forEach((s, i) => {
    const n = `Step ${i + 1}`;
    const a = actionById(s.action);
    if (!a) return void errors.push(`${n}: there is no action ${s.action}.`);
    if (a.tier === "never") return void errors.push(`${n}: ${a.title} is never run for a model.`);
    if (NOT_STEPS.has(a.id)) return void errors.push(`${n}: a plan cannot start or list plans.`);
    if ((origin === "chat" || origin === "mcp") && !a.on.includes(origin)) return void errors.push(`${n}: ${a.id} is not offered here.`);
    const parsed = a.input ? a.input.safeParse(s.input ?? {}) : { success: true as const, data: {} };
    if (!parsed.success) return void errors.push(`${n} (${a.id}): ${issues(parsed.error)}.`);
    out.push({ action: a.id, input: parsed.data ?? {}, status: "not_started", change: null });
  });
  if (!list.length) errors.push("A plan needs at least one step.");
  if (errors.length) throw new Error(`Nothing was run. ${errors.join(" ")}`);
  return out;
}

/** Runs a plan's steps from `current` until one is held, one fails or all are done, keeping the plan after each. */
async function advance(ctx: ActionContext, w: Workflow): Promise<Workflow> {
  const store = workflowsOf(ctx);
  const stepCtx: ActionContext = { ...ctx, origin: w.origin };
  while (w.current < w.steps.length) {
    const step = w.steps[w.current]!;
    const a = actionById(step.action);
    try {
      if (!a || a.tier === "never") throw new Error("that action is no longer offered");
      const ran = await runAction(a, stepCtx, step.input, "workflow");
      if (ran.held) {
        Object.assign(step, { status: "waiting", change: ran.changeId, preview: ran.preview });
        Object.assign(w, { status: "waiting", waitingChange: ran.changeId });
        await store.save(w);
        return w;
      }
      Object.assign(step, { status: "done", change: ran.changeId });
    } catch (err) {
      const why = (err as Error).message;
      Object.assign(step, { status: "failed", note: why });
      Object.assign(w, { status: "failed", waitingChange: null, note: `Stopped at step ${w.current + 1}, ${a?.title ?? step.action}: ${why}. The steps after it did not run.` });
      await store.save(w);
      return w;
    }
    w.current += 1;
    await store.save(w);
  }
  Object.assign(w, { status: "done", waitingChange: null });
  await store.save(w);
  return w;
}

/**
 * After the person taps Keep or Send on a held step (approveChange, once the step has run): the plan waiting on it
 * marks it done and goes on from the next step, read from the store. Only one caller takes a plan, so a second tap
 * or tab does not run the rest twice. Null when no plan waits on that change.
 */
export async function resumeAfterApproval(ctx: ActionContext, changeId: string): Promise<PlanView | null> {
  const store = workflowsOf(ctx);
  const w = await store.waitingOn(ctx.userId, changeId);
  if (!w || !(await store.claim(ctx.userId, w.id, changeId, "running"))) return null;
  const step = w.steps[w.current];
  if (step) Object.assign(step, { status: "done", change: changeId });
  Object.assign(w, { status: "running", waitingChange: null, current: w.current + 1 });
  await store.save(w);
  return planView(await advance(ctx, w));
}

/** After the person taps Decline on a held step: the plan stops there, with a note, and nothing after it runs. */
export async function stopAfterDecline(ctx: ActionContext, changeId: string, title: string): Promise<PlanView | null> {
  const store = workflowsOf(ctx);
  const w = await store.waitingOn(ctx.userId, changeId);
  if (!w || !(await store.claim(ctx.userId, w.id, changeId, "failed"))) return null;
  const step = w.steps[w.current];
  if (step) step.status = "declined";
  Object.assign(w, { status: "failed", waitingChange: null, note: `Stopped: you declined step ${w.current + 1}, ${title}. The steps after it did not run.` });
  await store.save(w);
  return planView(w);
}

export const startPlan = action({
  id: "start_plan",
  title: "Run a plan of several actions",
  description: `Run several actions one after another as one plan, when the person asks for more than one thing at once ("plan my month's budget, then add bill reminders to my calendar, then put the total on Home"). Give a short title and up to ${MAX_STEPS} steps, each an action id (the same name as the tool) and that tool's input exactly as it takes it. Inputs are fixed when the plan starts, so read what you need first. Every step is checked before anything runs; if one is unknown, not offered or has a wrong input, nothing runs. Steps that change the person's own records run at once. A step that changes a shared record or leaves Reflect waits for the person's tap, and the plan waits with it, then goes on by itself after they tap; if they decline, the plan stops there. Never say a waiting or not started step is done.`,
  tier: "own",
  on: ["chat", "mcp"],
  input: z.object({
    title: z.string().trim().min(1).max(120).describe("The plan in a few words, from what the person asked"),
    steps: z
      .array(z.object({ action: z.string().min(1).describe("An action id, the same name as the tool"), input: z.record(z.string(), z.unknown()).default({}).describe("That action's input, as the tool takes it") }))
      .min(1)
      .max(MAX_STEPS),
  }),
  run: async (ctx, { title, steps }) => {
    const origin = ctx.origin ?? "chat";
    const checked = checkSteps(steps, origin);
    const now = ctx.now ?? new Date();
    const id = await workflowsOf(ctx).create({ userId: ctx.userId, origin, title, steps: checked });
    const w: Workflow = { id, userId: ctx.userId, origin, title, status: "running", current: 0, steps: checked, waitingChange: null, note: null, createdAt: now, updatedAt: now };
    return planView(await advance(ctx, w));
  },
  change: (r) => ({ after: { workflow: r.id } }),
});

export const plansAction = action({
  id: "plans",
  title: "The person's plans",
  description: "The person's plans that are running or waiting for their tap, newest first, each step done, waiting for their tap or not started. A waiting plan goes on by itself after they tap Keep or Send in Reflect; you cannot tap for them.",
  tier: "read",
  on: ["chat", "mcp"],
  input: z.object({ limit: z.number().int().min(1).max(20).default(10) }),
  run: async (ctx, { limit }) => (await workflowsOf(ctx).list(ctx.userId, ["running", "waiting"], limit)).map(planView),
});
