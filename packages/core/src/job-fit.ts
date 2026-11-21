// Jobs that fit a person (doc "Work and Scholē as Reflect apps", Job matching, agreed 2026-11-21). Every match says
// why, from three signals matched against O*NET: Holland interests (the person's liked activities against each job's
// interest profile), crafts (a kept craft leads to the jobs its group names and the jobs named for it) and skills
// (a job sharing O*NET skills with the work a person's crafts lead to). There is no single score shown: the number
// below only orders the list. A craft practised at Competent or beyond that few jobs pay for is a venture candidate.
import { ACTIVITIES, HOLLAND, STAGES, groupOf, type Answer, type Craft, type Holland } from "./crafts";
import type { Job } from "./work-browse";

/** A craft the person keeps: catalogue entry, whether they practise it, and the Dreyfus stage index (-1 when unset). */
export type CraftFact = { craft: Craft; practising: boolean; stage: number };
/** O*NET skills and knowledge per job, as written by web/scripts/onet-skills.ts (indexes into `names`). */
export type SkillTable = { skills: { names: string[]; jobs: Record<string, number[]> }; knowledge: { names: string[]; jobs: Record<string, number[]> } };
export type Fit = { job: Job; reasons: string[]; crafts: string[]; rank: number };
export type VentureCandidate = { craft: Craft; stage: string; jobs: number };

/** Holland types in order of how many liked activities point at each (ties in RIASEC order), only those liked at all. */
export function hollandOrder(answers: Readonly<Record<string, Answer>>): Holland[] {
  const n = new Map<Holland, number>();
  for (const a of ACTIVITIES) if (answers[a.id] === "like") n.set(a.type, (n.get(a.type) ?? 0) + 1);
  const order = Object.keys(HOLLAND) as Holland[];
  return order.filter((t) => n.has(t)).sort((a, b) => n.get(b)! - n.get(a)! || order.indexOf(a) - order.indexOf(b));
}

/** A rough stem: lower case, one common ending off, six letters ("Cooking" and "Cooks" both give "cook"). */
const stem = (w: string) => w.toLowerCase().replace(/[^a-z]/g, "").replace(/(ing|ers|ery|er|ry|y|s)$/, "").slice(0, 6);
const words = (s: string, min = 4) => s.split(/[\s,/()-]+/).filter((w) => w.length >= min).map(stem);

/** The jobs a craft leads to: jobs whose title or a reported title shares a word with the craft ("Pottery" finds
 * "Potters"); a craft no title names falls back to the jobs its group names, by their title. */
export function jobsForCraft(craft: Craft, jobs: readonly Job[]): Job[] {
  const own = words(craft.label, 5);
  // Machine operators share the craft's word ("Drawing Machine Setters") but not the craft, so they never match by name.
  const direct = jobs.filter((j) => !/\bMachine\b/.test(j.title) && [j.title, ...j.titles].some((t) => own.some((w) => words(t).includes(w))));
  if (direct.length) return direct;
  const named = groupOf(craft.group)?.work ?? [];
  return jobs.filter((j) => named.some((t) => j.title === t || j.title.startsWith(`${t},`) || j.title.startsWith(`${t} and `)));
}

/** O*NET's basic skills (content and process) are shared by nearly every job, so they never count as a shared skill. */
const BASIC = new Set(["Reading Comprehension", "Active Listening", "Writing", "Speaking", "Mathematics", "Science", "Critical Thinking", "Active Learning", "Learning Strategies", "Monitoring"]);

const stageLabel = (i: number) => (i >= 0 ? STAGES.at(i)?.label ?? null : null);

/** Ranks jobs by fit, each with its reasons; jobs with no reason are left out. */
export function fitJobs(jobs: readonly Job[], p: { holland: readonly Holland[]; crafts: readonly CraftFact[]; skills?: SkillTable | null; n?: number }): Fit[] {
  const byCode = new Map<string, Fit>();
  const add = (j: Job, rank: number, reason: string, craft?: string) => {
    const f = byCode.get(j.code) ?? { job: j, reasons: [], crafts: [], rank: 0 };
    f.rank += rank;
    if (!f.reasons.includes(reason)) f.reasons.push(reason);
    if (craft && !f.crafts.includes(craft)) f.crafts.push(craft);
    byCode.set(j.code, f);
  };
  // Crafts: practised crafts weigh by stage; crafts only drawn to weigh least.
  const craftJobs = new Map<string, Job[]>();
  for (const c of p.crafts) {
    const linked = jobsForCraft(c.craft, jobs);
    craftJobs.set(c.craft.id, linked);
    const st = c.practising ? stageLabel(c.stage) : null;
    const why = c.practising ? `You practise ${c.craft.label.toLowerCase()}${st ? ` (${st.toLowerCase()})` : ""}` : `Drawn to ${c.craft.label.toLowerCase()}`;
    for (const j of linked) add(j, c.practising ? 10 + 3 * Math.max(0, c.stage) : 4, why, c.craft.id);
  }
  // Skills: jobs sharing two or more O*NET skills with the jobs a practised craft leads to.
  if (p.skills) {
    const mine = new Map<number, number>();
    for (const c of p.crafts) if (c.practising) for (const j of craftJobs.get(c.craft.id) ?? []) for (const s of p.skills.skills.jobs[j.code] ?? []) if (!BASIC.has(p.skills.skills.names[s]!)) mine.set(s, (mine.get(s) ?? 0) + 1);
    if (mine.size) {
      for (const j of jobs) {
        const shared = (p.skills.skills.jobs[j.code] ?? []).filter((s) => mine.has(s));
        if (shared.length >= 2) add(j, 2 * shared.length, `Uses skills you build: ${shared.slice(0, 2).map((s) => p.skills!.skills.names[s]!.toLowerCase()).join(", ")}`);
      }
    }
  }
  // Interests: the job's leading interest against the person's leading types.
  const [lead, ...more] = p.holland;
  for (const j of jobs) {
    const first = j.interests[0];
    if (lead && first === HOLLAND[lead].label) add(j, 6, `Fits your ${HOLLAND[lead].label} interest`);
    else if (first && more.slice(0, 2).some((t) => HOLLAND[t].label === first)) add(j, 3, `Fits your ${first} interest`);
  }
  // Interest alone is broad: such a job needs another reason unless the person keeps no crafts at all.
  const interestOnly = (f: Fit) => f.reasons.every((r) => r.startsWith("Fits your "));
  const list = [...byCode.values()].filter((f) => !p.crafts.length || !interestOnly(f));
  return list
    .sort((a, b) => b.rank - a.rank || (b.job.people ?? 0) - (a.job.people ?? 0) || a.job.title.localeCompare(b.job.title))
    .slice(0, p.n ?? 30);
}

/** Fewer people than this hold all the jobs a craft leads to, together: few jobs pay for it (BLS employment counts). */
export const FEW_JOBS = 100_000;

/** Crafts practised at Competent or beyond that few jobs pay for (at most one job, or fewer than FEW_JOBS people in
 * them all): worth exploring as a venture. */
export function ventureCandidates(jobs: readonly Job[], crafts: readonly CraftFact[]): VentureCandidate[] {
  const competent = STAGES.findIndex((s) => s.id === "competent");
  return crafts
    .filter((c) => c.practising && c.stage >= competent)
    .map((c) => ({ c, linked: jobsForCraft(c.craft, jobs) }))
    .filter(({ linked }) => linked.length <= 1 || linked.reduce((n, j) => n + (j.people ?? 0), 0) < FEW_JOBS)
    .map(({ c, linked }) => ({ craft: c.craft, stage: stageLabel(c.stage)!, jobs: linked.length }));
}
