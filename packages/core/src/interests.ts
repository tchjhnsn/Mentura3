/**
 * What Reflect knows about a person's interests, headless: one record per interest, written the same way by every
 * door (the Get to know you picker, the chat, MCP, imports, and what the person finishes or makes inside Reflect).
 * Torian, 2026-11-19, in the Reflect thread: we learn what people know about, like doing and like making; whether they
 * have done it or want to; and an interest is never finished ("even a professional still has things that they can
 * learn"), so depth lives in the fine details of a subject, not in the subject.
 *
 * Three modes (Aristotle's ends, Metaphysics VI.1): Make (poiesis, a thing is left behind), Do (praxis, the activity
 * itself) and Know (theoria, following, appreciating, studying). A mode carries up to three axes, each from a standard:
 *  - commitment, how it sits in a life (Stebbins' serious leisure perspective: casual, project-based and serious
 *    pursuits), shared by all three modes; a goal has an end (one marathon, to say I did it);
 *  - depth of knowing, per subject and per fine detail (after Bloom's taxonomy, with appreciation added); the top two
 *    rungs are earned before people, never a model (Torian, 2026-11-14: examiners are people);
 *  - skill, for Do and Make (Dave's psychomotor levels, 1970, close to Dreyfus).
 * Do adds a role and Make whom it is for. How each rung is earned from what the person finishes (listening deepens
 * depth), and badges for Standing, are not built. Pure: no I/O.
 */
import { sourceKindOf, type SourceKind } from "./value-source.ts";

export type Step = { id: string; label: string; line: string };

export const MODES = [
  { id: "make", label: "Make", line: "I make it: something is left behind" },
  { id: "do", label: "Do", line: "I do it: the activity is the point" },
  { id: "know", label: "Know", line: "I follow it, study it, appreciate it" },
] as const satisfies readonly Step[];
export type Mode = (typeof MODES)[number]["id"];

/** How an interest sits in a life, low to high (Stebbins). Shared by Make, Do and Know. */
export const COMMITMENT = [
  { id: "curious", label: "Curious", line: "Want to try it" },
  { id: "tried", label: "Tried it", line: "Once or twice" },
  { id: "now-and-then", label: "Now and then", line: "Some weeks, when it suits" },
  { id: "goal", label: "Toward a goal", line: "A project with an end, such as one marathon" },
  { id: "regular", label: "Regular practice", line: "Part of most weeks" },
  { id: "way-of-life", label: "Way of life", line: "Ingrained, and meant to last" },
] as const satisfies readonly Step[];
export type Commitment = (typeof COMMITMENT)[number]["id"];

/** How deep someone knows a subject or one of its fine details, low to high (after Bloom, with appreciation). */
export const DEPTH = [
  { id: "heard-of", label: "Heard of it", line: "Knows the names" },
  { id: "follows", label: "Follows it", line: "Watches, reads or listens along" },
  { id: "appreciates", label: "Appreciates it", line: "Can tell good from great" },
  { id: "understands", label: "Understands it", line: "Can say why it works" },
  { id: "studies", label: "Studies it", line: "Technique, history, schools" },
  { id: "explains", label: "Explains it", line: "Holds up under questioning" },
  { id: "teaches", label: "Teaches it", line: "Can bring someone else up" },
] as const satisfies readonly Step[];
export type Depth = (typeof DEPTH)[number]["id"];

/** Skill in doing or making, low to high (Dave's psychomotor levels). */
export const SKILL = [
  { id: "copy", label: "Copy", line: "Follows a plan or pattern" },
  { id: "steady", label: "Steady", line: "Finishes it alone" },
  { id: "precise", label: "Precise", line: "Clean, on purpose, few mistakes" },
  { id: "adapts", label: "Adapts", line: "Changes the plan to fit" },
  { id: "second-nature", label: "Second nature", line: "By feel; designs and teaches" },
] as const satisfies readonly Step[];
export type Skill = (typeof SKILL)[number]["id"];

export const ROLES = [
  { id: "participant", label: "Participant", line: "Takes part" },
  { id: "competitor", label: "Competitor", line: "Enters to win" },
  { id: "coach", label: "Coach", line: "Trains others" },
  { id: "organiser", label: "Organiser", line: "Runs it for others" },
] as const satisfies readonly Step[];
export type Role = (typeof ROLES)[number]["id"];

export const FOR_WHOM = [
  { id: "self", label: "For myself", line: "" },
  { id: "gifts", label: "Gifts for others", line: "" },
  { id: "commissions", label: "Commissions", line: "Made to order" },
  { id: "living", label: "A living", line: "Sold or paid for" },
] as const satisfies readonly Step[];
export type ForWhom = (typeof FOR_WHOM)[number]["id"];

/** How someone comes to know a thing. */
export const WAYS_OF_KNOWING = [
  { id: "watching", label: "Watching", line: "" },
  { id: "reading", label: "Reading", line: "" },
  { id: "listening", label: "Listening", line: "" },
  { id: "conversation", label: "Conversation", line: "" },
  { id: "taught", label: "Being taught", line: "" },
  { id: "doing", label: "Doing it", line: "" },
] as const satisfies readonly Step[];
export type WayOfKnowing = (typeof WAYS_OF_KNOWING)[number]["id"];

/**
 * How Reflect learned a fact about an interest: three of the source kinds every field value has (`SOURCE_KINDS` in
 * ./value-source.ts). Noticed facts are labelled as noticed wherever they show. Before 2026-11-20 the ids were told,
 * imported and noticed; `interestSource` reads those (and a missing source, as stated), so stored values still read.
 */
export const SOURCES = [
  { id: "stated", label: "You told us", line: "" },
  { id: "import", label: "Imported", line: "From an account you connected" },
  { id: "noticed", label: "We noticed", line: "From what you finished or made in Reflect" },
] as const satisfies readonly (Step & { id: SourceKind })[];
export type Source = (typeof SOURCES)[number]["id"];

/** A stored interest source as one of SOURCES: told (or missing) is stated, imported is import; any other kind is stated. */
export function interestSource(v: unknown): Source {
  const k = sourceKindOf(v);
  return isStep(SOURCES, k) ? k : "stated";
}

/** A goal with an end: what, by when, and the day it was met. Meeting it is done, not dropped. */
export type Goal = { what: string; by?: string; met?: string };

export type MakeSide = { commitment?: Commitment; skill?: Skill; forWhom?: ForWhom; goal?: Goal };
export type DoSide = { commitment?: Commitment; skill?: Skill; role?: Role; goal?: Goal };
/** Depth of the subject as a whole, as the person said it; each fine detail has its own depth. */
export type KnowSide = { commitment?: Commitment; ways?: WayOfKnowing[]; depth?: Depth; /** Depth per fine detail, by the detail's id. */ details?: Record<string, Depth>; goal?: Goal };

/** One of a subject's fine details, such as boxing's jab, footwork or scoring. A detail may sit under another. */
export type Detail = { id: string; label: string; under?: string };

/**
 * One interest. `ref` names the thing in a public catalogue so it is the same thing for everyone:
 * `wd:Q32112` (Wikidata), `craft:baking` (Scholē's crafts), `onet:15-1252.00` (O*NET), `book:<Open Library work>`,
 * `show:<Apple Podcasts id>`, else `topic:<slug>` for a subject no catalogue holds.
 */
export type Interest = { ref: string; title: string; make?: MakeSide; do?: DoSide; know?: KnowSide; source: Source };

/** A rung's place on its ladder, from 0 at the bottom; -1 for none. */
export const stepIndex = <T extends string>(steps: readonly { id: T }[], id: T | undefined) => (id ? steps.findIndex((s) => s.id === id) : -1);
export const isStep = <T extends string>(steps: readonly { id: T }[], v: unknown): v is T => typeof v === "string" && steps.some((s) => s.id === v);
export const labelOf = (steps: readonly Step[], id: string | undefined) => steps.find((s) => s.id === id)?.label ?? null;

/** One line in plain words, the way the person's interests page reads: "You do running, toward a goal, at Steady." */
export function sentence(i: Interest, mode: Mode): string | null {
  const side = i[mode];
  if (!side) return null;
  const parts: string[] = [];
  const c = labelOf(COMMITMENT, side.commitment);
  if (c) parts.push(c.toLowerCase());
  if (mode !== "know") {
    const s = labelOf(SKILL, (side as MakeSide | DoSide).skill);
    if (s) parts.push(`at ${s}`);
  }
  if (mode === "do") { const r = labelOf(ROLES, (side as DoSide).role); if (r) parts.push(`as a ${r.toLowerCase()}`); }
  if (mode === "make") { const f = labelOf(FOR_WHOM, (side as MakeSide).forWhom); if (f) parts.push(f.toLowerCase()); }
  if (mode === "know") { const d = labelOf(DEPTH, (side as KnowSide).depth); if (d) parts.push(d.toLowerCase()); }
  if (side.goal) parts.push(side.goal.met ? `met: ${side.goal.what}` : `goal: ${side.goal.what}${side.goal.by ? ` by ${side.goal.by}` : ""}`);
  const verb = mode === "make" ? "make" : mode === "do" ? "do" : "follow";
  return `You ${verb} ${i.title}${parts.length ? `: ${parts.join(", ")}` : ""}.`;
}

/** A Scholē craft record seen through this model (its states and Dreyfus stage map onto commitment and skill). */
export function fromCraft(c: { ref: string; title: string; state: string | null; stage?: string | null }): Interest {
  const commitment: Commitment | undefined = c.state === "drawn" ? "curious" : c.state === "trying" ? "tried" : c.state === "practising" ? "regular" : undefined;
  const stage: Record<string, Skill> = { novice: "copy", "advanced-beginner": "steady", competent: "precise", proficient: "adapts", expert: "second-nature" };
  const skill = c.stage ? stage[c.stage.toLowerCase().replace(/ /g, "-")] : undefined;
  return { ref: `craft:${c.ref}`, title: c.title, make: { commitment, skill }, source: "stated" };
}
