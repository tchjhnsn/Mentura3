/**
 * Practice for a meeting's prep (design guide, Meeting prep): the host's questions one at a time, the answer hidden
 * until they ask for it, then Rehearsed or Again. Pure: the order questions come in and how a round moves on. A round
 * is kept in the page's address as two lists of question ids: `seen` (answered Rehearsed or Again this round) and
 * `again` (asked to come back, oldest first).
 */
import type { MeetingPrep } from "./meetings";

export type PrepQuestion = MeetingPrep["questions"][number];

/** Where a round stands: the ids answered this round, and those asked to come back. */
export type PracticeRound = { seen: string[]; again: string[] };

export const newRound = (): PracticeRound => ({ seen: [], again: [] });

/** The questions in practice order: unrehearsed first, then rehearsed, each group kept in the host's own order. */
export function practiceOrder<T extends Pick<PrepQuestion, "rehearsed">>(questions: readonly T[]): T[] {
  return [...questions.filter((q) => !q.rehearsed), ...questions.filter((q) => q.rehearsed)];
}

/**
 * What is left in a round, next first: the questions not yet seen, in practice order, then those asked to come back,
 * oldest first. Ids of questions since removed are ignored. Empty when the round is done.
 */
export function practiceQueue<T extends Pick<PrepQuestion, "id" | "rehearsed">>(questions: readonly T[], round: PracticeRound): T[] {
  const seen = new Set(round.seen);
  const byId = new Map(questions.map((q) => [q.id, q]));
  const again = [...new Set(round.again)].flatMap((id) => (byId.has(id) ? [byId.get(id)!] : []));
  return [...practiceOrder(questions.filter((q) => !seen.has(q.id))), ...again];
}

/** The round after the host answers a question: Rehearsed takes it out of the round, Again sends it to the back. */
export function afterAnswer(round: PracticeRound, id: string, verdict: "rehearsed" | "again"): PracticeRound {
  const seen = round.seen.includes(id) ? round.seen : [...round.seen, id];
  const rest = round.again.filter((x) => x !== id);
  return { seen, again: verdict === "again" ? [...rest, id] : rest };
}

/** A round read from the page's address (comma separated ids), keeping only ids that look like ids. */
export function readRound(seen: string | null | undefined, again: string | null | undefined): PracticeRound {
  const ids = (v: string | null | undefined) => (v ?? "").split(",").map((s) => s.trim()).filter((s) => /^[A-Za-z0-9_-]{1,64}$/.test(s)).slice(0, 500);
  return { seen: ids(seen), again: ids(again) };
}

/** A round as the page's address keeps it. */
export const roundParams = (r: PracticeRound) => ({ seen: r.seen.join(","), again: r.again.join(",") });
