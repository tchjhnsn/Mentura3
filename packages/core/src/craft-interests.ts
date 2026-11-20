/**
 * A kept Scholē craft read as a Make interest (the owner's rule, Torian, 2026-11-19: one record per real interest,
 * and a craft is something a person makes). The craft record stays where it is (the work app's hidden kind `craft`);
 * this reads it through the interest model so every door sees one list. The levels come from `fromCraft`
 * (`./interests`): drawn is Curious, trying is Tried it, practising is Regular practice, and the Dreyfus stage maps
 * onto skill (Novice Copy, Advanced beginner Steady, Competent Precise, Proficient Adapts, Expert Second nature). What
 * only a craft has (its group, what drew the person, how it was learned, who vouches, what was tried and made, its
 * first project and its page) rides along as `craft`. The source is stated: the person kept the craft themselves. Writing crafts as
 * interest records is not built. Pure: no I/O.
 */
import { CRAFT_STATES, LEARNED, STAGES, craftOf, firstProjectOf, type CraftState, type GroupId, type Learned, type Stage } from "./crafts";
import { fromCraft, type Interest } from "./interests";

/** One act kept on a craft record: tried it once, or made something (with the note naming it). */
export type CraftActFacts = { kind: string; day: string; note: string | null };

/** What a craft keeps beyond an interest's levels, read from its record and its acts. */
export type CraftDetails = {
  /** The craft's catalogue id, such as `baking`. */
  id: string;
  group: GroupId | null;
  /** Drawn to it, trying it or practising it, as the craft record keeps it. */
  state: CraftState | null;
  /** The Dreyfus stage the person said they reached (a stage kept by its label reads as its id). */
  stage: Stage | null;
  /** What drew them, in their words (the record's `why`). */
  why: string | null;
  /** What they wrote they have made (the record's `made` field), beside the made acts. */
  madeText: string | null;
  learned: Learned[];
  /** How many friends vouch (their ids stay on the craft record). */
  vouches: number;
  /** How many times the person kept that they tried it. */
  tried: number;
  /** What they made, newest first. */
  made: { day: string; note: string | null }[];
  /** The catalogue's first project for the craft (`./craft-projects`), by name. */
  firstProject: string | null;
  /** The craft's page in Scholē. */
  href: string;
};

const list = (v: unknown) => String(v ?? "").split(",").map((x) => x.trim()).filter(Boolean);
const isOf = <T extends string>(xs: readonly { id: T }[], v: unknown): v is T => typeof v === "string" && xs.some((x) => x.id === v);

/**
 * One craft record as a Make interest: `ref` is `craft:<id>`, the title is the record's (else the catalogue label),
 * Make's commitment and skill come from its state and stage, and `craft` carries the rest. Acts of other kinds are
 * ignored; made acts are kept newest first.
 */
export function craftAsInterest(r: { ref: string; title?: unknown; state: string | null; body: Record<string, unknown> }, acts: readonly CraftActFacts[] = []): Interest & { craft: CraftDetails } {
  const c = craftOf(r.ref);
  const title = typeof r.title === "string" && r.title ? r.title : c?.label ?? r.ref;
  const stage = typeof r.body.stage === "string" ? r.body.stage : null;
  const stageId = stage?.toLowerCase().replace(/ /g, "-");
  const text = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
  const base = fromCraft({ ref: r.ref, title, state: r.state, stage });
  const made = acts.filter((a) => a.kind === "made").map((a) => ({ day: a.day, note: a.note })).sort((a, b) => (a.day < b.day ? 1 : a.day > b.day ? -1 : 0));
  return {
    ...base,
    craft: {
      id: r.ref,
      group: c?.group ?? null,
      state: isOf(CRAFT_STATES, r.state) ? r.state : null,
      stage: isOf(STAGES, stageId) ? stageId : null,
      why: text(r.body.why),
      madeText: text(r.body.made),
      learned: list(r.body.how).filter((l): l is Learned => isOf(LEARNED, l)),
      vouches: list(r.body.vouch).length,
      tried: acts.filter((a) => a.kind === "tried").length,
      made,
      firstProject: firstProjectOf(r.ref)?.name ?? null,
      href: `/schole/crafts/${r.ref}`,
    },
  };
}
