// Work's career paths and job matching as actions (doc "Work and Scholē as Reflect apps", 2026-11-21): follow an
// O*NET occupation as a path (the work app's hidden kind "path"), mark one of its tasks done or not (a step act whose
// note is the task's number), and read the jobs that fit the person with their reasons. Work's pages run these same
// entries, so their changes are in the change log.
import { z } from "zod";
import { addLifeRecord, keepLifeAct, lifeActs, lifeRecords, setLifeState, type LifeRecord } from "../life-store";
import { jobByCode } from "../work-catalog";
import { workFit } from "../fit-store";
import { action, type ActionContext } from "./types";

const todayOf = (ctx: ActionContext) => ctx.today ?? new Date().toISOString().slice(0, 10);
const code = z.string().regex(/^\d{2}-\d{4}\.\d{2}$/).describe("The O*NET occupation code, such as '47-2031.00'");

/** The person's path record for a job, let go included, or undefined. */
export async function pathOf(userId: string, c: string): Promise<LifeRecord | undefined> {
  return (await lifeRecords(userId, "work")).find((x) => x.kind === "path" && x.body.ref === c);
}

/** Task numbers done on a path: a step act whose note is "n" marks it done, "-n" marks it not done; the last one wins. */
export async function stepsDone(userId: string, id: string): Promise<Set<number>> {
  const done = new Set<number>();
  const acts = (await lifeActs(userId, id)).filter((a) => a.kind === "step").sort((a, b) => a.at.localeCompare(b.at));
  for (const a of acts) {
    const n = Number(a.note);
    if (!Number.isInteger(n)) continue;
    if (n >= 0) done.add(n);
    else done.delete(-n);
  }
  return done;
}

export const startPath = action({
  id: "start_path",
  title: "Follow a career path",
  description: "Follow an O*NET occupation as a career path in Work: its tasks become the steps. A path already followed (or let go) is followed again. Only when the person asks.",
  tier: "own",
  on: ["chat", "mcp"],
  input: z.object({ code }),
  run: async ({ userId }, { code: c }) => {
    const job = jobByCode(c);
    if (!job) throw new Error("No such job.");
    const had = await pathOf(userId, c);
    if (had) {
      if (had.state !== "following") await setLifeState(userId, had.id, "following");
      return { id: had.id, code: c, title: job.title };
    }
    const id = await addLifeRecord(userId, "work", "path", { ref: c, title: job.title }, "following");
    return { id, code: c, title: job.title };
  },
  change: (r) => ({ after: r }),
});

export const pathStep = action({
  id: "path_step",
  title: "Mark a step of a career path done or not",
  description: "Mark one task of a career path the person follows as done (or not done), by its number in the path's list starting at 1. Only what the person says they did. When every task is done the path is finished.",
  tier: "own",
  on: ["chat", "mcp"],
  input: z.object({ code, step: z.number().int().min(1).max(50), done: z.boolean().default(true) }),
  run: async (ctx, { code: c, step, done }) => {
    const job = jobByCode(c);
    if (!job) throw new Error("No such job.");
    if (step > job.tasks.length) throw new Error("No such step.");
    const rec = await pathOf(ctx.userId, c);
    if (!rec) throw new Error("You do not follow that path.");
    await keepLifeAct(ctx.userId, rec.id, { kind: "step", day: todayOf(ctx), note: String(done ? step : -step) });
    const all = await stepsDone(ctx.userId, rec.id);
    const finished = job.tasks.every((_, i) => all.has(i + 1));
    if (finished && rec.state !== "done") await setLifeState(ctx.userId, rec.id, "done");
    if (!finished && rec.state === "done") await setLifeState(ctx.userId, rec.id, "following");
    return { id: rec.id, code: c, step, done, finished };
  },
  change: (r) => ({ after: r }),
});

export const jobsForMe = action({
  id: "jobs_for_me",
  title: "Read the jobs that fit the person",
  description: "Fetch the jobs that fit the person, from their kept crafts, their Discover crafts answers (Holland interests) and O*NET skills: each with the reasons it fits, median pay and Job Zone; and crafts worth exploring as a venture (practised at Competent or beyond, few jobs pay for them).",
  tier: "read",
  on: ["chat", "mcp"],
  input: z.object({ n: z.number().int().min(1).max(30).default(10) }),
  run: async ({ userId }, { n }) => {
    const fit = await workFit(userId, n);
    return {
      interests: fit.holland,
      jobs: fit.fits.map((f) => ({ code: f.job.code, title: f.job.title, reasons: f.reasons, pay: f.job.pay ?? null, zone: f.job.zone ?? null })),
      ventures: fit.ventures.map((v) => ({ craft: v.craft.id, label: v.craft.label, stage: v.stage, jobs: v.jobs })),
    };
  },
});
