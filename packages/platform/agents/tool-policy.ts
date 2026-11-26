// The arithmetic behind the tooling skill (skills/tooling/SKILL.md): each candidate tool scored 0 to 4 on each
// criterion of tool-policy.json, a gate criterion at 0 rules the candidate out, and the rest is a weighted total out
// of 4. Pure. A score never chooses: spending money or signing up is a decision for a person.
//
//   scoreTools([{ id: "a", scores: { visibility: 4, ownership: 3, fit: 3, cost: 2, learning: 3 } }, ...])
//   // [{ id: "a", total: 3.35, out: null }, ...] best first; out names the gate that ruled a candidate out

import { readFileSync } from "node:fs";

export interface Criterion { id: string, gate: boolean, weight: number, question: string, levels: string[] }
export interface Policy { criteria: Criterion[] }
export interface Candidate { id: string, scores: Record<string, number> }
export interface Scored { id: string, total: number, out: string | null }

/** The shipped policy. */
export const policy = (): Policy => JSON.parse(readFileSync(new URL("./tool-policy.json", import.meta.url), "utf8")) as Policy;

/** Scores candidates, best first, ruled-out candidates last. Throws on a score outside 0 to 4 or a missing criterion. */
export function scoreTools(candidates: readonly Candidate[], p: Policy = policy()): Scored[] {
  const scored = candidates.map((c): Scored => {
    for (const k of p.criteria) {
      const v = c.scores[k.id];
      if (typeof v !== "number" || v < 0 || v > 4) throw new Error(`${c.id}: ${k.id} is scored 0 to 4, not ${String(v)}`);
    }
    const out = p.criteria.find((k) => k.gate && c.scores[k.id] === 0)?.id ?? null;
    const total = Math.round(p.criteria.reduce((sum, k) => sum + k.weight * c.scores[k.id], 0) * 100) / 100;
    return { id: c.id, total: out ? 0 : total, out };
  });
  return scored.sort((a, b) => Number(a.out !== null) - Number(b.out !== null) || b.total - a.total);
}
