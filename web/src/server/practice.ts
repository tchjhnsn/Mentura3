// Dialectic practice (migrations 0040 and 0041; Torian, 2026-11-16 20:45Z, guide "Dialectic practice: tagging
// arguments", second guidelines 22:33Z). Dialogues are read from src/data/dialogues (Jowett's translations from Project
// Gutenberg) and cut into turns and units; answers are kept one row each in argument_answer and never changed; settled
// answers are the drafts Torian confirmed.
import { randomUUID } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { db } from "@/db/pool";
import {
  GUIDELINES_VERSION, accepted, accuracy, calibration, choicesFor, combine, cqKey, isSplit, issueKey, parseCq, parseTurns, placeOf, unitKey, unitsOf,
  type Answer, type Confidence, type Kind, type Settled, type Turn, type Unit,
} from "@reflect/core/argument-practice";
import { DIALOGUES, ISSUES, confirmedDrafts, type DialogueId } from "@reflect/core/practice-settled";

const cache = new Map<string, { turns: Turn[]; units: Unit[] }>();

/** A dialogue's turns and units, or null when its text is missing. */
export function textOf(work: DialogueId): { turns: Turn[]; units: Unit[] } | null {
  if (cache.has(work)) return cache.get(work)!;
  const file = [join(process.cwd(), `src/data/dialogues/${work}.txt`), join(process.cwd(), `web/src/data/dialogues/${work}.txt`)].find((f) => existsSync(f));
  if (!file) return null;
  const turns = parseTurns(readFileSync(file, "utf8"));
  const t = { turns, units: unitsOf(turns) };
  cache.set(work, t);
  return t;
}

/** The settled answers that count for a dialogue. A target's answer is the key of the unit it points at. */
export function settledOf(work: DialogueId): Settled[] {
  const t = textOf(work);
  if (!t) return [];
  const byPlace = new Map(t.units.map((x) => [placeOf(x), x]));
  return confirmedDrafts(work).flatMap((d) => {
    const [place, rest] = d.at.split("~") as [string, string | undefined];
    let key: string | null;
    if (d.kind === "stasis") key = ISSUES[work].some((i) => i.id === d.at) ? issueKey(work, d.at) : null;
    else {
      const x = byPlace.get(place);
      const c = rest ? parseCq(`x~${rest}`) : null;
      key = x ? (c ? cqKey(unitKey(work, x), c.scheme, c.i) : unitKey(work, x)) : null;
    }
    const answer = d.kind === "target" && d.answer !== "none" ? (byPlace.get(d.answer) ? unitKey(work, byPlace.get(d.answer)!) : null) : d.answer;
    return key && answer ? [{ key, kind: d.kind, answer, ...(d.also ? { also: d.also } : {}), by: d.confirmed!, note: d.why }] : [];
  });
}

const KINDS = new Set<Kind>(["act", "relation", "target", "stasis", "scheme", "cq"]);

/** Where an item's key points: a unit (with its index), an issue, or a critical question on a unit. */
export function locate(work: DialogueId, key: string) {
  const t = textOf(work);
  if (!t) return null;
  const issue = ISSUES[work].find((i) => issueKey(work, i.id) === key);
  if (issue) return { issue, unit: null, index: -1 };
  const unit = parseCq(key)?.unit ?? key;
  const index = t.units.findIndex((x) => unitKey(work, x) === unit);
  return index < 0 ? null : { issue: null, unit: t.units[index]!, index };
}

const choiceIds = (work: DialogueId, key: string, kind: Kind) => {
  const t = textOf(work)!;
  const where = locate(work, key)!;
  return choicesFor(kind, { units: t.units, at: where.index, work, key }).map((c) => c.id);
};

/** Keep one answer. Throws when the answer is not one the question offers. */
export async function recordAnswer(userId: string, work: DialogueId, key: string, kind: Kind, answer: string, confidence: Confidence | null): Promise<void> {
  const where = locate(work, key);
  if (!where || !KINDS.has(kind) || (kind === "stasis") !== Boolean(where.issue) || (kind === "cq") !== Boolean(parseCq(key))) throw new Error("not a question");
  if (answer !== "unsure" && !choiceIds(work, key, kind).includes(answer)) throw new Error("not an answer");
  if (confidence !== null && ![1, 2, 3].includes(confidence)) throw new Error("not a level");
  const settled = settledOf(work).some((s) => s.key === key && s.kind === kind);
  await db().query("INSERT INTO argument_answer (id, user_id, turn_key, kind, answer, guidelines, settled, confidence) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
    [randomUUID(), userId, key, kind, answer, GUIDELINES_VERSION, settled, answer === "unsure" ? null : confidence]);
}

/** Every answer given on a dialogue under the current guidelines, oldest first. Empty when the table is missing. */
export async function answersOn(work: DialogueId): Promise<Answer[]> {
  try {
    const r = await db().query<{ user_id: string; turn_key: string; kind: Kind; answer: string; confidence: number | null; created_at: Date }>(
      "SELECT user_id, turn_key, kind, answer, confidence, created_at FROM argument_answer WHERE turn_key LIKE $1 AND guidelines = $2 ORDER BY created_at, id", [`${work}#%`, GUIDELINES_VERSION]);
    return r.rows.map((x) => ({ user: x.user_id, key: x.turn_key, kind: x.kind, answer: x.answer, confidence: (x.confidence ?? null) as Confidence | null, at: x.created_at.toISOString() }));
  } catch {
    return [];
  }
}

/** A person's record across every dialogue: settled answered and right, labels added, and how sure they were when right. */
export async function recordOf(userId: string) {
  let settledN = 0, right = 0, labels = 0, any = false;
  const cal = [1, 2, 3].map((c) => ({ confidence: c as Confidence, n: 0, right: 0 }));
  for (const d of DIALOGUES) {
    const answers = await answersOn(d.id);
    const settled = settledOf(d.id);
    const s = new Map(settled.map((x) => [`${x.key}|${x.kind}`, accepted(x)]));
    for (const a of answers.filter((x) => x.user === userId)) {
      any = true;
      if (a.answer === "unsure") continue;
      const want = s.get(`${a.key}|${a.kind}`);
      if (want) { settledN++; if (want.includes(a.answer)) right++; } else labels++;
    }
    calibration(answers, settled, userId).forEach((c, i) => { cal[i]!.n += c.n; cal[i]!.right += c.right; });
  }
  return { settled: settledN, right, labels, any, calibration: cal };
}

/** How one item stands after an answer: the counts, whether readers split, and the settled answers when it has them. */
export async function standing(work: DialogueId, key: string, kind: Kind) {
  const choices = choiceIds(work, key, kind);
  const answers = await answersOn(work);
  const settled = settledOf(work);
  const s = settled.find((x) => x.key === key && x.kind === kind);
  const c = combine({ key, kind }, answers, accuracy(answers, settled), choices);
  return { counts: c?.counts ?? {}, n: c?.n ?? 0, split: isSplit(c), settled: s ? { answers: accepted(s), note: s.note ?? null } : null };
}
