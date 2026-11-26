// One site agent run: a function's IT specialist (`<function>-it`), the design-system agent or a capability agent
// (`<capability>-agent`) working one task on a business's site or docs repository. The repository is mounted at /site/
// through ContainerGuardBackend, so the agent writes only the paths containers.json gives its role; the business's
// records are read through Naive's router, and the only records it may write are handoffs. When the run is done, the
// files it changed are checked again (check-containers) and committed with an `Agent: <role>` trailer, so CI checks
// each commit as the agent that made it. Nothing is pushed or published: a person does that.
//
//   const r = await runSiteAgent("products-it", "Build the time-travel section from the approved copy.", {
//     venture: "mentura", site: "/path/to/site", model: modelSource(process.env.MENTURA_MODEL), trace: {} });
//   r.status === "done" && r.commit   // the commit sha, with r.changed the files it touched

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { join } from "node:path";
import type { BaseLanguageModel } from "@langchain/core/language_models/base";
import { CompositeBackend, createDeepAgent } from "deepagents";
import type { EditResult, WriteResult } from "deepagents";
import { spans } from "naive-framework/src/core/instrumentation.mjs";
import { roleOf, routeGlob } from "naive-framework/src/engine/access.mjs";
import type { Context } from "naive-framework/src/router/agent-files.mjs";
import { ventureDir } from "naive-framework/src/router/router.mjs";
import { invokeThread, openRunSaver } from "./checkpoint.ts";
import { checkChange, loadManifest, mayWrite, type Manifest, type Problem } from "./containers.ts";
import type { HeldDraft, ModelSource, RunId, TeamPlanEntryRead, TraceJoin, Written } from "./function-agent.ts";
import { answerOf, lockVenture, MENTURA_READ_ONLY, MENTURA_SKILLS, menturaMounts, messageOf, MODEL_FIX, outcomeOf, ownProcess, withRunEnv } from "./function-agent.ts";
import { functionIds, reachesTeamPlan } from "./function-spec.ts";
import { writeMemory } from "./memory.ts";
import { NaiveBackend } from "./naive-backend.ts";
import { NaiveTracer } from "./naive-tracer.ts";
import { ContainerGuardBackend, rolesNeeded, SITE_MOUNT, siteRoleOf, siteRules } from "./site-agents.ts";

/** The only records a site agent writes: handoffs, to hand copy to a builder or ask the design-system agent for a component. */
export const SITE_WRITES = ["operations/handoff/*"];

/** The team-plan entry a business adds to staff a site agent. */
export const siteTeamPlanEntry = (role: string): { id: string, occupant: "agent", routes: { write: string[] } } => ({ id: role, occupant: "agent", routes: { write: SITE_WRITES } });

export interface SiteRunContext {
  venture: string,
  workspace?: string,
  /** The site or docs repository, with containers.json at its root. */
  site: string,
  model: ModelSource,
  trace: TraceJoin,
  runId?: RunId,
  harness?: string,
  /** Commit the changed files with an Agent trailer (default true when the site is a git repository). */
  commit?: boolean,
  signal?: AbortSignal,
}

export interface SiteRunRef { id: RunId, role: string, venture: string, site: string, session: string, trace_id: string, parent_span_id: string | null }

interface Changes { changed: string[], problems: Problem[], commit: string | null }

export type SiteRunResult =
  | ({ status: "done", run: SiteRunRef, answer: string, wrote: Written[], held: HeldDraft[] } & Changes)
  | ({ status: "already-ran", run: SiteRunRef, wrote: Written[], held: HeldDraft[] } & Changes)
  | ({ status: "failed", run: SiteRunRef, error: string, wrote: Written[], held: HeldDraft[] } & Changes)
  | ({ status: "cancelled", run: SiteRunRef, wrote: Written[], held: HeldDraft[] } & Changes)
  | { status: "busy", venture: string, holder: number | null }
  | { status: "refused", reason: string, fix?: string };

const git = (dir: string, args: string[]): string => execFileSync("git", ["-C", dir, ...args], { encoding: "utf8" });
const isRepo = (dir: string): boolean => existsSync(join(dir, ".git"));

/** The paths with uncommitted changes in a repository, new files included. */
export function dirty(dir: string): string[] {
  if (!isRepo(dir)) return [];
  return git(dir, ["status", "--porcelain", "-uall", "-z"]).split("\0").filter(Boolean).map((l) => l.slice(3));
}

/**
 * Runs one site agent on one task. Order as the function agent run: claim the process; find the venture and the
 * manifest (an unsound one refuses); check the role is a site role the manifest needs and is staffed as an agent that
 * writes only handoffs; refuse when the agent's own paths already hold someone's uncommitted changes, so its commit is
 * only its own work; lock the venture; answer already-ran; load the model; invoke; check and commit what changed.
 */
export async function runSiteAgent(role: string, task: string, ctx: SiteRunContext): Promise<SiteRunResult> {
  return await ownProcess(async () => {
    const dir = ventureDir(ctx.venture, ctx.workspace) as string | null;
    if (!dir) return { status: "refused", reason: `no venture ${ctx.venture} in ${ctx.workspace ?? process.env.MENTURA_WORKSPACE ?? process.cwd()}`, fix: "Set MENTURA_WORKSPACE to the folder that holds the ventures, or pass the venture's id." };
    const functions = functionIds() as string[];
    let manifest: Manifest;
    try { manifest = loadManifest(join(ctx.site, "containers.json"), functions); }
    catch (e) { return { status: "refused", reason: messageOf(e), fix: "Write containers.json at the site's root against agents/containers.schema.json." }; }
    if (!siteRoleOf(role, functions)) return { status: "refused", reason: `${role} is not a site agent: one is <function>-it, design-system-agent or <capability>-agent` };
    if (!rolesNeeded(manifest).includes(role)) return { status: "refused", reason: `${role} owns and builds nothing in ${ctx.site}/containers.json`, fix: "Name it as a container's owner or builder in containers.json first." };
    const entry = JSON.stringify(siteTeamPlanEntry(role));
    const staffed = roleOf(dir, role) as TeamPlanEntryRead | null;
    if (!staffed) return { status: "refused", reason: `${role} is not in ${ctx.venture}'s team plan`, fix: entry };
    if (staffed.occupant !== "agent") return { status: "refused", reason: `${role} is a person's role in ${ctx.venture}'s team plan` };
    const writes = staffed.routes?.write;
    if (!writes) return { status: "refused", reason: `${role} lists no write routes, so it could write every route: a site agent writes only handoffs`, fix: entry };
    if (reachesTeamPlan(writes) || writes.some((w) => !SITE_WRITES.includes(w))) return { status: "refused", reason: `${role} may write ${writes.join(", ")}: a site agent writes only ${SITE_WRITES.join(", ")}`, fix: entry };
    const mine = dirty(ctx.site).filter((p) => mayWrite(manifest, role, p).ok);
    if (mine.length) return { status: "refused", reason: `${role}'s paths already hold uncommitted changes: ${mine.slice(0, 5).join(", ")}`, fix: "Commit or stash them first, so the agent's commit holds only its own work." };

    const id = ctx.runId ?? (randomUUID() as RunId);
    const trace_id = ctx.trace.trace_id ?? id;
    const run: SiteRunRef = { id, role, venture: ctx.venture, site: ctx.site, session: ctx.trace.session ?? trace_id, trace_id, parent_span_id: ctx.trace.parent_span_id ?? null };
    const lock = lockVenture(dir);
    if ("busy" in lock) return { status: "busy", venture: ctx.venture, holder: lock.busy };
    try {
      if ((spans(dir, run.session) as { span_id: string }[]).some((s) => s.span_id === run.id)) return { status: "already-ran", run, ...outcomeOf(dir, run), changed: [], problems: [], commit: null };
      let model: BaseLanguageModel;
      try { model = await ctx.model.load(); }
      catch (e) { return { status: "refused", reason: messageOf(e), fix: MODEL_FIX }; }
      return await withRunEnv(run, ctx, () => invoke(dir, manifest, functions, task, run, staffed, model, ctx));
    }
    finally { lock.release(); }
  });
}

// ---- internals ----

const MAX_STEPS = 200;

/** The venture's records, read-only for a site agent except handoffs, refused before Naive sees the write. */
class SiteRecordsBackend extends NaiveBackend {
  refusal(path: string): string | null {
    const route = path.replace(/^\/+/, "").replace(/\.json$/, "");
    return SITE_WRITES.some((g) => routeGlob(g).test(route)) ? null : `A site agent writes only handoffs (${SITE_WRITES.join(", ")}). ${path} was not written: the site is under ${SITE_MOUNT}.`;
  }
  override async write(filePath: string, content: string): Promise<WriteResult> {
    const no = this.refusal(filePath);
    return no ? { error: no } : await super.write(filePath, content);
  }
  override async edit(filePath: string, oldString: string, newString: string, replaceAll = false): Promise<EditResult> {
    const no = this.refusal(filePath);
    return no ? { error: no } : await super.edit(filePath, oldString, newString, replaceAll);
  }
}

async function invoke(dir: string, manifest: Manifest, functions: string[], task: string, run: SiteRunRef, staffed: TeamPlanEntryRead, model: BaseLanguageModel, ctx: SiteRunContext): Promise<SiteRunResult> {
  const tracer = new NaiveTracer(dir, { session: run.session, trace_id: run.trace_id, agents: [run.role] });
  const records = new SiteRecordsBackend({ venture: run.venture, workspace: ctx.workspace, actor_id: run.role } as Context, tracer);
  const site = new ContainerGuardBackend({ rootDir: ctx.site, manifest, agent: run.role });
  const memory = writeMemory(dir, run.role);
  const backend = new CompositeBackend(records, { [SITE_MOUNT]: site, ...menturaMounts(dir, run.role) });
  const saver = openRunSaver(dir);
  const systemPrompt = [
    `You are ${run.role}, a site agent of the venture ${run.venture}, acting in the team-plan role ${staffed.id}.`,
    "The venture's records are your files at the root (read them through Naive's router); you may write only handoffs, at /operations/handoff/<id>.",
    "",
    ...siteRules(run.role, manifest, functions).map((r) => `- ${r}`),
    "- Finish with a short answer: what you built or wrote, what you handed off, and what waits for a person.",
  ].join("\n");
  const agent = createDeepAgent({ model, backend, name: run.role, systemPrompt, skills: [MENTURA_SKILLS], memory: [memory], checkpointer: saver,
    permissions: [{ operations: ["write"], paths: [...MENTURA_READ_ONLY], mode: "deny" }] });
  const after = (): Changes => changesOf(manifest, run, ctx);
  try {
    const out = await invokeThread(agent, run.id, task, { runId: run.id, callbacks: [tracer], signal: ctx.signal, recursionLimit: MAX_STEPS });
    return { status: "done", run, answer: answerOf(out), ...outcomeOf(dir, run), ...after() };
  }
  catch (e) {
    tracer.closeOpen(ctx.signal?.aborted ? "cancelled" : messageOf(e));
    return ctx.signal?.aborted ? { status: "cancelled", run, ...outcomeOf(dir, run), ...after() } : { status: "failed", run, error: messageOf(e), ...outcomeOf(dir, run), ...after() };
  }
  finally { saver.close(); }
}

/** The files the agent changed (its own paths, which held nothing uncommitted before), checked again and committed when they pass. */
function changesOf(m: Manifest, run: SiteRunRef, ctx: SiteRunContext): Changes {
  const changed = dirty(ctx.site).filter((p) => mayWrite(m, run.role, p).ok);
  const files = changed.map((path) => existsSync(join(ctx.site, path)) ? { path, content: readFileSync(join(ctx.site, path), "utf8") } : { path });
  const problems = checkChange(m, run.role, files);
  if (!changed.length || problems.length || ctx.commit === false || !isRepo(ctx.site)) return { changed, problems, commit: null };
  git(ctx.site, ["add", "-A", "--", ...changed]);
  git(ctx.site, ["commit", "-q", "-m", `${run.role}: site change\n\nRun: ${run.id}\nAgent: ${run.role}`, "--", ...changed]);
  return { changed, problems, commit: git(ctx.site, ["rev-parse", "HEAD"]).trim() };
}
