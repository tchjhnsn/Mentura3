// Dialectic practice (migration 0040; Torian, 2026-11-16 20:45Z, guide "Dialectic practice: tagging arguments", card
// 20:56Z). Dialogues are read from src/data/dialogues (Jowett's translations from Project Gutenberg) and cut into turns;
// answers are kept one row each in argument_answer and never changed; settled answers are the drafts Torian confirmed.
import { randomUUID } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { db } from "@/db/pool";
import { GUIDELINES_VERSION, accuracy, combine, choicesFor, parseTurns, turnKey, type Answer, type Kind, type Settled, type Turn } from "@reflect/core/argument-practice";
import { DIALOGUES, confirmedDrafts, type DialogueId } from "@reflect/core/practice-settled";

const cache = new Map<string, Turn[]>();

/** A dialogue's turns, or null when its text is missing. */
export function turnsOf(work: DialogueId): Turn[] | null {
  if (cache.has(work)) return cache.get(work)!;
  const file = [join(process.cwd(), `src/data/dialogues/${work}.txt`), join(process.cwd(), `web/src/data/dialogues/${work}.txt`)].find((f) => existsSync(f));
  if (!file) return null;
  const t = parseTurns(readFileSync(file, "utf8"));
  cache.set(work, t);
  return t;
}

/** The settled answers that count for a dialogue, by turn key; a target's answer is the key of the turn it answers. */
export function settledOf(work: DialogueId): Settled[] {
  const turns = turnsOf(work);
  if (!turns) return [];
  return confirmedDrafts(work).flatMap((d) => {
    const t = turns[d.n];
    if (!t) return [];
    const answer = d.kind === "target" && d.answer !== "none" ? (turns[Number(d.answer)] ? turnKey(work, turns[Number(d.answer)]!) : null) : d.answer;
    return answer ? [{ key: turnKey(work, t), kind: d.kind, answer, by: d.confirmed!, note: d.why }] : [];
  });
}

const KINDS = new Set<Kind>(["move", "target", "stasis"]);

/** Keep one answer. Throws when the answer is not one the question offers. */
export async function recordAnswer(userId: string, work: DialogueId, key: string, kind: Kind, answer: string): Promise<void> {
  const turns = turnsOf(work);
  const t = turns?.find((x) => turnKey(work, x) === key);
  if (!turns || !t || !KINDS.has(kind)) throw new Error("not a question");
  const ok = answer === "unsure" || choicesFor(kind, turns, t.n, work).some((c) => c.id === answer);
  if (!ok) throw new Error("not an answer");
  const settled = settledOf(work).some((s) => s.key === key && s.kind === kind);
  await db().query("INSERT INTO argument_answer (id, user_id, turn_key, kind, answer, guidelines, settled) VALUES ($1, $2, $3, $4, $5, $6, $7)", [randomUUID(), userId, key, kind, answer, GUIDELINES_VERSION, settled]);
}

/** Every answer given on a dialogue under the current guidelines, oldest first. Empty before migration 0040 runs. */
export async function answersOn(work: DialogueId): Promise<Answer[]> {
  try {
    const r = await db().query<{ user_id: string; turn_key: string; kind: Kind; answer: string; created_at: Date }>(
      "SELECT user_id, turn_key, kind, answer, created_at FROM argument_answer WHERE turn_key LIKE $1 AND guidelines = $2 ORDER BY created_at, id", [`${work}#%`, GUIDELINES_VERSION]);
    return r.rows.map((x) => ({ user: x.user_id, key: x.turn_key, kind: x.kind, answer: x.answer, at: x.created_at.toISOString() }));
  } catch {
    return [];
  }
}

/** A person's record across every dialogue: settled answered and right, and labels added. */
export async function recordOf(userId: string): Promise<{ settled: number; right: number; labels: number; any: boolean }> {
  const all = (await Promise.all(DIALOGUES.map((d) => answersOn(d.id).then((a) => ({ id: d.id, a }))))).flatMap(({ id, a }) => a.map((x) => ({ ...x, work: id })));
  const mine = all.filter((a) => a.user === userId);
  let settled = 0, right = 0, labels = 0;
  for (const d of DIALOGUES) {
    const s = new Map(settledOf(d.id).map((x) => [`${x.key}|${x.kind}`, x.answer]));
    for (const a of mine.filter((x) => x.work === d.id && x.answer !== "unsure")) {
      const want = s.get(`${a.key}|${a.kind}`);
      if (want) { settled++; if (want === a.answer) right++; } else labels++;
    }
  }
  return { settled, right, labels, any: mine.length > 0 };
}

/** How one item stands after an answer: the counts, and the settled answer when it has one. */
export async function standing(work: DialogueId, key: string, kind: Kind) {
  const turns = turnsOf(work)!;
  const t = turns.find((x) => turnKey(work, x) === key)!;
  const choices = choicesFor(kind, turns, t.n, work).map((c) => c.id);
  const answers = await answersOn(work);
  const settled = settledOf(work);
  const s = settled.find((x) => x.key === key && x.kind === kind);
  const c = combine({ key, kind }, answers, accuracy(answers, settled), choices);
  return { counts: c?.counts ?? {}, n: c?.n ?? 0, settled: s ? { answer: s.answer, note: s.note ?? null } : null };
}
