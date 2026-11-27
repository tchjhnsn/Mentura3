// The production side of the slash commands (commands.ts) for one venture: meeting records through Naive's router as
// the facilitator, each agenda item worked by its owner as a function agent, the meeting's checkpoints in
// <venture>/.naive/meeting-checkpoints.sqlite, what is due from Naive's due (ranked by the venture's phase), and a
// closed meeting that walked a workflow logged as that workflow's run in Naive's run log, so `naive due` knows it ran.
//
//   const host = await commandHost({ venture: "mentura", person: "torian", model, trace: {} });
//   const result = await runCommand(parseCommand("/meet strategy intake"), host.ctx);
//   host.close();

import { Effect } from "effect";
import { runPromise } from "naive-framework/src/core/effect/run.mjs";
import { dueFor, recordRun, type DueEntry } from "naive-framework/src/engine/due.mjs";
import { phaseWeights } from "naive-framework/src/phases/phases.mjs";
import { join } from "node:path";
import { ventureDir } from "naive-framework/src/router/router.mjs";
import { openMeetingSaver } from "./checkpoint.ts";
import type { CommandContext, SiteHost } from "./commands.ts";
import { loadManifest, reachOf } from "./containers.ts";
import type { ModelSource, TraceJoin } from "./function-agent.ts";
import { phaseOf, runFunctionAgent } from "./function-agent.ts";
import { functionAgent, functionIds } from "./function-spec.ts";
import { routerStore, workflowOf, type Meeting } from "./meetings.ts";
import { naiveMissing, prerequisitesOf, routerLookup } from "./prerequisites.ts";
import { acceptHeld, printCopy } from "./review.ts";
import { functionWorker } from "./meeting-worker.ts";
import { rolesNeeded } from "./site-agents.ts";

export interface HostOptions { venture: string, workspace?: string, person: string, model: ModelSource, trace: TraceJoin, harness?: string, signal?: AbortSignal, site?: string }

/**
 * Due workflows, most weighted first: due ones only; those the phase lists as active before the rest; an intake before
 * any other workflow of its function, since a function is learned before it is run; then the phase's weight of the
 * workflow's function, highest first. Pure.
 */
export function rankDue(entries: readonly DueEntry[], weights: Readonly<Record<string, number>>): { workflow: string, why: string }[] {
  return entries.filter((e) => e.status === "due")
    .map((e) => ({ e, key: [Number(!e.in_phase), Number(e.trigger.kind !== "intake"), -(weights[e.function] ?? 0)] }))
    .sort((a, b) => a.key[0] - b.key[0] || a.key[1] - b.key[1] || a.key[2] - b.key[2] || a.e.workflow.localeCompare(b.e.workflow))
    .map(({ e }) => ({ workflow: e.workflow, why: e.why }));
}

/** The site repository for /containers and /site: its manifest read fresh on every call, each run a site agent run. */
export function siteHost(o: HostOptions & { site: string }): SiteHost {
  return {
    dir: o.site,
    roles() {
      const m = loadManifest(join(o.site, "containers.json"), functionIds());
      return rolesNeeded(m).map((role) => ({ role, ...reachOf(m, role) }));
    },
    async run(role, task) {
      const { runSiteAgent } = await import("./site-run.ts");
      return await runSiteAgent(role, task, { venture: o.venture, workspace: o.workspace, site: o.site, model: o.model, trace: o.trace, harness: o.harness ?? "mentura-command", signal: o.signal });
    },
  };
}

export async function commandHost(o: HostOptions): Promise<{ ctx: CommandContext, close(): void } | { error: string }> {
  const dir = ventureDir(o.venture, o.workspace) as string | null;
  if (!dir) return { error: `no venture ${o.venture} in ${o.workspace ?? process.env.MENTURA_WORKSPACE ?? process.cwd()}` };
  const saver = openMeetingSaver(dir);
  const site = o.site ? siteHost({ ...o, site: o.site }) : undefined;
  // A site agent is locked like a workflow, as site/<role>, so /blocked lists the roles a sound manifest needs.
  const siteWorkflows = (): string[] => { try { return site ? site.roles().map((x) => `site/${x.role}`) : []; } catch { return []; } };
  const ctx: CommandContext = {
    venture: o.venture, dir, person: o.person,
    store: routerStore({ venture: o.venture, workspace: o.workspace }),
    worker: functionWorker({ venture: o.venture, workspace: o.workspace, model: o.model, trace: o.trace, harness: o.harness, signal: o.signal }),
    checkpointer: saver,
    async check(workflow) {
      const [fn, wf] = workflow.split("/");
      const look = routerLookup({ venture: o.venture, workspace: o.workspace }, dir);
      if (fn === "site") return prerequisitesOf(workflow, look);
      try { workflowOf(fn, wf); }
      catch (e) { return { workflow, met: false, missing: [{ kind: "policy" as const, what: workflow, why: String((e as Error)?.message ?? e), fix: "name a workflow Naive has" }] }; }
      // Naive judges the workflow's own requires (EE-217); Mentura's policy adds its opinion on top.
      return prerequisitesOf(workflow, look, { naive: () => naiveMissing(dir, workflow) });
    },
    workflows: () => [...functionIds().flatMap((f) => functionAgent(f).workflows.map((w) => `${f}/${w}`)), ...siteWorkflows()],
    ...(site ? { site } : {}),
    approve: (_m, _item, held, by, confirm) => acceptHeld({ venture: o.venture, workspace: o.workspace }, held, by, confirm),
    present: (m, item, drafted) => printCopy({ venture: o.venture, workspace: o.workspace }, dir, m, item, drafted),
    async due() {
      const now = new Date().toISOString();
      const [entries, weights] = await runPromise(Effect.all([dueFor(dir, now), phaseWeights(phaseOf(dir)).pipe(Effect.orElseSucceed(() => ({})))]));
      return rankDue(entries, weights as Record<string, number>);
    },
    async ask(fn, task) {
      const r = await runFunctionAgent(functionAgent(fn), task, { venture: o.venture, workspace: o.workspace, model: o.model, trace: o.trace, harness: o.harness ?? "mentura-command", signal: o.signal });
      if (r.status === "done") return [r.answer, ...r.held.map((h) => `Held for you: ${h.route} (${h.accept})`)].join("\n");
      throw new Error(r.status === "failed" ? r.error : r.status === "refused" ? `${r.reason}${r.fix ? ` Fix: ${r.fix}` : ""}` : r.status);
    },
    async closed(m: Meeting) {
      if (!m.workflow) return;
      await runPromise(recordRun(dir, { workflow: m.workflow, at: m.closed_at ?? new Date().toISOString(), outcome: m.outcome?.reached === "no" ? "skipped" : "done", by: o.person }));
    },
  };
  return { ctx, close: () => saver.close() };
}
