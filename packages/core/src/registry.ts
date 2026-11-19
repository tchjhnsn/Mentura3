// The action registry's framework (Reflect framework plan, step 4): what an action is, why a run is refused, and the
// runner that keeps every non-read run in a change log, holds a shared or outside action asked for by a model, and
// undoes an own-tier change. It names no store: the host gives the change log and the transaction. The web app's host
// is Postgres (web/src/server/actions/run.ts); a vault's is files (./vault-actions.ts). The way Naive's router serves
// its CLI, MCP and API, the app, the CLI and an MCP server over a vault all run actions through here.
// Plain TypeScript with no package imports: an input is any Standard Schema (zod's schemas are, and so are ./input.ts's).
import type { Tier } from "./actions.ts";

/** A Standard Schema (standardschema.dev), the part the runner uses. Zod 4's schemas are one. */
export interface StandardSchema<Input = unknown, Output = Input> {
  readonly "~standard": {
    readonly version: 1;
    readonly vendor: string;
    readonly validate: (value: unknown) => StandardResult<Output> | Promise<StandardResult<Output>>;
    readonly types?: { readonly input: Input; readonly output: Output } | undefined;
  };
}
export type StandardIssue = { readonly message: string; readonly path?: ReadonlyArray<PropertyKey | { readonly key: PropertyKey }> | undefined };
export type StandardResult<Output> = { readonly value: Output; readonly issues?: undefined } | { readonly issues: ReadonlyArray<StandardIssue> };
/** The checked input a schema gives. */
export type InferOutput<S extends StandardSchema> = NonNullable<S["~standard"]["types"]>["output"];

/** Where an action is offered: the chat in Reflect, or the person's own AI over MCP. */
export type Surface = "chat" | "mcp";

/**
 * Where a run of an action came from: the chat, the person's own AI over MCP, a page in Reflect, a workflow, or the
 * person at the `reflect` command line over their vault.
 */
export type Source = "chat" | "mcp" | "page" | "workflow" | "cli";

/** What a run changed, as `change` reports it: the state before (to put back) and after (what was made). */
export type Change = { before?: unknown; after?: unknown };

/** One logged run of a non-read action (`action_change` in the app, migration 0044; `changes.jsonl` in a vault). */
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

/** Where changes are kept: Postgres in the app, a file in a vault, a fake in tests. Every call is for one person. */
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

/** What every host's context carries. `now` stands in for the clock in tests. `origin` is where the request first came
 * from; runAction sets it to the source when it is not set, and a plan's steps carry the plan's. */
export type RunContext = { userId: string; now?: Date; origin?: Source };

/** An action's declaration: what a surface lists, before any host runs it. The id is the tool name every surface uses. */
export type ActionDecl = {
  id: string;
  title: string;
  /** The description the model reads. Where the chat's and MCP's wording differ, `mcp.description` is MCP's. */
  description: string;
  tier: Tier;
  on: readonly Surface[];
};

/**
 * One thing a model can do in Reflect, with its run. `run` returns data; each surface turns it into its own reply (the
 * chat's cards and words, MCP's text). `Ctx` is the host's context; `Base` is the schema family the host's surfaces
 * build tools from (zod in the app).
 */
export type Action<Ctx, S extends StandardSchema = StandardSchema, R = unknown, Base extends StandardSchema = StandardSchema> = ActionDecl & {
  /** The input. Left out for an action that takes none (an MCP tool is then registered with no input schema). */
  input?: S;
  run(ctx: Ctx, input: InferOutput<S>): Promise<R>;
  /** Reads what a run will change, before it runs, so Undo can put it back. Its value reaches `change` as `before`. */
  before?(ctx: Ctx, input: InferOutput<S>): Promise<unknown>;
  /**
   * What the change log keeps of the input, for an input too large or too private to keep whole (an uploaded file's
   * text). Left out, the input itself. A held change keeps its whole input, since it runs from it later.
   */
  logged?(input: InferOutput<S>): unknown;
  /** What a run changed, kept in the change log. Left out, only the input is kept. */
  change?(result: R, input: InferOutput<S>, before: unknown): Change;
  /**
   * For a shared or outside action: what a run will do, in plain words (the event, the exact message text, the plan
   * edit), shown to the person with Keep or Send before it runs. Left out, the title and the input are shown.
   */
  preview?(ctx: Ctx, input: InferOutput<S>): string | Promise<string>;
  /** Puts back what a logged run changed. Only own-tier actions have it; left out, the change cannot be undone. */
  undo?(ctx: Ctx, change: LoggedChange): Promise<void>;
  /** MCP's own wording, where it differs from the chat's: the same fields, other words. */
  mcp?: { description?: string; input?: Base };
};

/** The strings under `key` of a logged before or after, such as the ids a run made. */
export function idsIn(v: unknown, key: string): string[] {
  const list = v && typeof v === "object" ? (v as Record<string, unknown>)[key] : undefined;
  return Array.isArray(list) ? list.filter((x): x is string => typeof x === "string") : typeof list === "string" ? [list] : [];
}

type Described = ActionDecl & { input?: StandardSchema; mcp?: { description?: string; input?: StandardSchema } };
export const describeFor = (a: Described, on: Surface): string => (on === "mcp" ? (a.mcp?.description ?? a.description) : a.description);

/** The runner's refusals, each a reason a surface can act on. */
export type RefusedReason =
  | "not-offered" // a never-tier action, or one no longer in the registry
  | "no-such-change" // not this person's change, or no change by that id
  | "already-made" // done, undone or claimed already
  | "declined" // the person declined it
  | "not-yet" // held, not run
  | "not-undoable" // shared or outside, or the action has no undo
  | "too-old" // past the undo or hold window
  | "bad-input"; // the input does not fit the action's schema (a vault's runner checks it; the app's surfaces do)

/**
 * The runner refused: nothing ran. The message is for the person. A tagged error (`_tag` "Refused"), as Effect's
 * `catchTag` reads one; it is a plain Error so the core imports nothing.
 */
export class Refused extends Error {
  readonly _tag = "Refused" as const;
  readonly reason: RefusedReason;
  constructor(props: { readonly reason: RefusedReason; readonly message: string }) {
    super(props.message);
    this.name = "Refused";
    this.reason = props.reason;
  }
}

/** How long a logged change stays open to undo. */
export const UNDO_DAYS = 30;
/** How long a held change waits for the person's tap. After that it cannot be approved; the model asks again. */
export const HOLD_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Whether a run waits for the person: a shared or outside action asked for by a model, from the chat or over MCP, or
 * run as a step of a plan that was not started from a page. A plan step with no origin holds.
 */
export const holds = (tier: Tier, source: Source, origin?: Source): boolean =>
  (tier === "shared" || tier === "outside") && (source === "chat" || source === "mcp" || (source === "workflow" && origin !== "page"));

/** What runAction did: ran (with the change id, or null for a read), or held it unrun. */
export type Ran<R> = { held: false; result: R; changeId: string | null } | { held: true; changeId: string; preview: string };

const said = (v: unknown): string => (typeof v === "string" ? v : JSON.stringify(v));
/** The preview of an action with no `preview` of its own: its title, then each input field as given. */
export function plainPreview(title: string, input: unknown): string {
  const fields = input && typeof input === "object" ? Object.entries(input as Record<string, unknown>).filter(([, v]) => v !== undefined) : [];
  return [`${title}.`, ...fields.map(([k, v]) => `${k.replace(/_/g, " ")}: ${said(v)}`)].join("\n");
}

/** Whether a held change can still be approved now: held, and made within the last 7 days. */
export function canApprove(c: LoggedChange, now = new Date()): boolean {
  return c.status === "held" && now.getTime() - c.createdAt.getTime() <= HOLD_DAYS * DAY_MS;
}

/** One held change as the surfaces show it. */
export type Pending = { id: string; action: string; title: string; tier: Tier; source: LoggedChange["source"]; at: string; until: string; preview: string };

/** Check an input against an action's schema. Refuses (bad-input) with the schema's own messages when it does not fit. */
export async function checkInput<S extends StandardSchema>(a: { title: string; input?: S }, raw: unknown): Promise<InferOutput<S>> {
  if (!a.input) return (raw ?? {}) as InferOutput<S>;
  const r = await a.input["~standard"].validate(raw ?? {});
  if (r.issues) {
    const where = (i: StandardIssue) => (i.path?.length ? `${i.path.map((p) => String(typeof p === "object" ? p.key : p)).join(".")}: ` : "");
    throw new Refused({ reason: "bad-input", message: `${a.title}: ${r.issues.map((i) => `${where(i)}${i.message}`).join("; ")}` });
  }
  return r.value as InferOutput<S>;
}

/** What a host gives the runner: where its changes are kept, how a run and its log are made one, and its registry. */
export type RunnerHost<Ctx extends RunContext, A extends Action<Ctx, StandardSchema, unknown, StandardSchema>, E extends object> = {
  changes(ctx: Ctx): ChangeLog;
  /** Runs `f` so that what it wrote and its log entry stand or fall together. A host with no transactions runs `f`. */
  transaction<T>(f: () => Promise<T>): Promise<T>;
  actionById(id: string): A | undefined;
  /** After a held change ran: what to add to approveChange's answer (the app resumes the plan it was a step of). */
  afterApprove?(ctx: Ctx, c: LoggedChange): Promise<Partial<E>>;
  /** After a held change was declined (the app stops the plan it was a step of). */
  afterDecline?(ctx: Ctx, c: LoggedChange, title: string): Promise<void>;
};

/** The runner over one host: run, undo, approve, decline and list held changes. */
export function makeRunner<Ctx extends RunContext, A extends Action<Ctx, StandardSchema, unknown, StandardSchema>, E extends object = Record<never, never>>(host: RunnerHost<Ctx, A, E>) {
  /**
   * Run an action and keep what it changed. A read changes nothing and is not kept. A shared or outside action from the
   * chat or MCP is not run: it is kept as held, with its input and a preview, and waits for approveChange. The run and
   * its change log are one transaction (the host's): when the log cannot be kept, what the run wrote is rolled back and
   * the error is thrown, so no change happens without its entry (and its undo). When keeping a hold fails, nothing has
   * happened, so the error is thrown.
   */
  async function runAction<S extends StandardSchema, R>(a: Action<Ctx, S, R, StandardSchema>, given: Ctx, input: InferOutput<S>, source: Source): Promise<Ran<R>> {
    if (a.tier === "never") throw new Refused({ reason: "not-offered", message: `${a.title} is never run for a model.` });
    const ctx: Ctx = { ...given, origin: given.origin ?? source };
    if (a.tier === "read") return { held: false, result: await a.run(ctx, input), changeId: null };
    if (holds(a.tier, source, ctx.origin)) {
      const preview = a.preview ? await a.preview(ctx, input) : plainPreview(a.title, input);
      const changeId = await host.changes(ctx).hold({ userId: ctx.userId, actionId: a.id, source, tier: a.tier, input: input ?? {}, preview });
      return { held: true, changeId, preview };
    }
    return host.transaction(async () => {
      const before = a.before ? await a.before(ctx, input) : undefined;
      const result = await a.run(ctx, input);
      const c = a.change?.(result, input, before) ?? {};
      const changeId = await host.changes(ctx).add({ userId: ctx.userId, actionId: a.id, source, tier: a.tier, input: (a.logged ? a.logged(input) : input) ?? {}, before: c.before ?? null, after: c.after ?? null });
      return { held: false as const, result, changeId };
    });
  }

  /** Whether a logged change can still be undone now: own tier, an action with undo, done, and under 30 days old. */
  function canUndo(c: LoggedChange, now = new Date()): boolean {
    const a = host.actionById(c.actionId);
    return c.tier === "own" && Boolean(a?.undo) && c.status === "done" && now.getTime() - c.createdAt.getTime() <= UNDO_DAYS * DAY_MS;
  }

  /** Undo one of the person's own changes. Refuses another person's change, a shared or outside one, and one too old. */
  async function undoChange(ctx: Ctx, id: string): Promise<{ undone: string; title: string }> {
    const log = host.changes(ctx);
    const c = await log.get(ctx.userId, id);
    if (!c || c.userId !== ctx.userId) throw new Refused({ reason: "no-such-change", message: "No such change." });
    if (c.status === "undone") throw new Refused({ reason: "already-made", message: "That change was already undone." });
    if (c.status !== "done") throw new Refused({ reason: "not-yet", message: "That change has not happened yet." });
    const a = host.actionById(c.actionId);
    if (c.tier !== "own" || !a?.undo) throw new Refused({ reason: "not-undoable", message: `${a?.title ?? c.actionId} cannot be undone here.` });
    if (!canUndo(c, ctx.now ?? new Date())) throw new Refused({ reason: "too-old", message: `Changes can be undone for ${UNDO_DAYS} days; this one is older.` });
    const undo = a.undo;
    // The undo and marking it undone are one transaction: a second undo racing this one rolls back its own removal.
    await host.transaction(async () => {
      await undo(ctx, c);
      if (!(await log.markUndone(ctx.userId, id))) throw new Refused({ reason: "already-made", message: "That change was already undone." });
    });
    return { undone: c.id, title: a.title };
  }

  /** Reads a held change for approveChange and declineChange: the person's own, and still held. */
  async function heldOf(ctx: Ctx, id: string): Promise<LoggedChange> {
    const c = await host.changes(ctx).get(ctx.userId, id);
    if (!c || c.userId !== ctx.userId) throw new Refused({ reason: "no-such-change", message: "No such change." });
    if (c.status === "done" || c.status === "undone") throw new Refused({ reason: "already-made", message: "That change was already made." });
    if (c.status === "declined") throw new Refused({ reason: "declined", message: "That change was declined." });
    return c;
  }

  /**
   * Run a held change, as the person who owns it, when they tap Keep or Send. It runs once: claiming it moves it from
   * held to done in one step, so a second tap (or a second tab) is refused. The run and keeping its before and after are
   * one transaction; if either fails, what the run wrote is rolled back and the change goes back to held.
   * Refuses another person's change, one already made or declined, and one older than 7 days.
   */
  async function approveChange(ctx: Ctx, id: string): Promise<{ approved: string; title: string; result: unknown } & Partial<E>> {
    const log = host.changes(ctx);
    const c = await heldOf(ctx, id);
    const a = host.actionById(c.actionId);
    if (!a || a.tier === "never") throw new Refused({ reason: "not-offered", message: `${a?.title ?? c.actionId} cannot be run here.` });
    const now = ctx.now ?? new Date();
    if (!canApprove(c, now)) throw new Refused({ reason: "too-old", message: `A held change waits ${HOLD_DAYS} days; this one is older. Ask again.` });
    if (!(await log.claim(ctx.userId, id, new Date(now.getTime() - HOLD_DAYS * DAY_MS)))) throw new Refused({ reason: "already-made", message: "That change was already made." });
    let result: unknown;
    try {
      result = await host.transaction(async () => {
        const before = a.before ? await a.before(ctx, c.input) : undefined;
        const r = await a.run(ctx, c.input);
        const made = a.change?.(r, c.input, before) ?? {};
        await log.settle(ctx.userId, id, { before: made.before ?? null, after: made.after ?? null });
        return r;
      });
    } catch (err) {
      await log.release(ctx.userId, id).catch(() => undefined);
      throw err;
    }
    // The change has happened whatever the host does after it.
    const extra = host.afterApprove ? await host.afterApprove(ctx, c) : undefined;
    return { approved: id, title: a.title, result, ...extra } as { approved: string; title: string; result: unknown } & Partial<E>;
  }

  /** Decline a held change: it never runs. Only the person who owns it, and only while it is held. */
  async function declineChange(ctx: Ctx, id: string): Promise<{ declined: string; title: string }> {
    const c = await heldOf(ctx, id);
    if (!(await host.changes(ctx).decline(ctx.userId, id))) throw new Refused({ reason: "already-made", message: "That change is no longer waiting." });
    const title = host.actionById(c.actionId)?.title ?? c.actionId;
    if (host.afterDecline) await host.afterDecline(ctx, c, title);
    return { declined: id, title };
  }

  /** The person's held changes that can still be approved, newest first. */
  async function pendingChanges(ctx: Ctx, limit = 20): Promise<Pending[]> {
    const now = ctx.now ?? new Date();
    const list = await host.changes(ctx).held(ctx.userId, new Date(now.getTime() - HOLD_DAYS * DAY_MS), limit);
    return list.filter((c) => canApprove(c, now)).map((c) => ({
      id: c.id,
      action: c.actionId,
      title: host.actionById(c.actionId)?.title ?? c.actionId,
      tier: c.tier,
      source: c.source,
      at: c.createdAt.toISOString(),
      until: new Date(c.createdAt.getTime() + HOLD_DAYS * DAY_MS).toISOString(),
      preview: c.preview ?? plainPreview(host.actionById(c.actionId)?.title ?? c.actionId, c.input),
    }));
  }

  return { runAction, canUndo, undoChange, approveChange, declineChange, pendingChanges };
}
