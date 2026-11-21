// Jobs that fit the person, and crafts worth a venture (doc "Work and Scholē as Reflect apps", Job matching): the
// person's kept crafts and Discover crafts answers, matched by `@reflect/core/job-fit` against O*NET (src/data).
import { isAlready, stageIndex } from "@reflect/core/crafts";
import { fitJobs, hollandOrder, jobsForCraft, ventureCandidates, type CraftFact, type Fit, type VentureCandidate } from "@reflect/core/job-fit";
import type { Holland } from "@reflect/core/crafts";
import { myAnswers, myCrafts, type MyCraft } from "./crafts-store";
import { jobSkills, jobs } from "./work-catalog";

export type WorkFit = { fits: Fit[]; ventures: VentureCandidate[]; holland: Holland[]; crafts: MyCraft[]; byCraft: Record<string, number> };

const STAGE_IDS = ["novice", "advanced-beginner", "competent", "proficient", "expert"];
/** A kept craft as the matcher reads it: in the catalogue, practising or not, and its stage (the record keeps the label or the id). */
export function factOf(c: MyCraft): CraftFact | null {
  if (!c.craft) return null;
  const raw = String(c.record.body.stage ?? "");
  const byLabel = STAGE_IDS.findIndex((id) => id.replace("-", " ") === raw.toLowerCase());
  return { craft: c.craft, practising: isAlready(c.state), stage: byLabel >= 0 ? byLabel : stageIndex(raw) };
}

/** Jobs that fit, venture candidates and how many jobs each craft leads to. */
export async function workFit(userId: string, n = 30): Promise<WorkFit> {
  const [crafts, answers] = await Promise.all([myCrafts(userId), myAnswers(userId)]);
  const facts = crafts.map(factOf).filter((f): f is CraftFact => f !== null);
  const all = jobs();
  const holland = hollandOrder(answers);
  const byCraft: Record<string, number> = {};
  for (const f of facts) byCraft[f.craft.id] = jobsForCraft(f.craft, all).length;
  return { fits: fitJobs(all, { holland, crafts: facts, skills: jobSkills(), n }), ventures: ventureCandidates(all, facts), holland, crafts, byCraft };
}
