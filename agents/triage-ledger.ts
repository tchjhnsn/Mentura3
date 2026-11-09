// Founder corrections into the detection ledger (Naive docs/design/RAW_TRIAGE_2026-11-09.md, item 7). Each Noul label
// Jev answers is one call of the triage-accept detector, kept as a trial in its ledger (route
// governance/detector-trial/triage-accept, naive-framework/src/router/detection-ledger.mjs). As at the gate, yes means
// "needs a person": the score is Jev's certainty, max(p, 1 - p), and a score below the line is yes (held); at or above
// it is no (filed).
//
//   A held label the founder answers as Jev guessed  -> false alarm (it did not need a person)
//   A held label the founder answers the other way   -> hit
//   A filed label the founder changes                -> miss (it needed a person)
//   A filed label the founder confirms               -> correct rejection
//
// A label with no Jev answer has no score and makes no trial. Silence is no data: a filed label nobody looks at stays
// unresolved. The line never moves here; check-detectors.ts --propose reads the ledger and a person accepts a new line.
//
//   const ledger = routerLedger({ venture, workspace })
//   triageGraph({ ..., ledger })                                   // trials, and resolutions for answered held labels
//   await correctFiled(ledger, triageRecord, "function:f1:finance", true, "p-1")   // later: a filed label changed

import { appendTrial, resolveTrial } from "naive-framework/src/router/detection-ledger.mjs";

export const DETECTOR = "triage-accept";
export type Call = "yes" | "no";
export type Outcome = "hit" | "miss" | "false-alarm" | "correct-rejection";
export interface Trial { id: string, key: string, score: number, criterion: { yes: number, yes_when: "below" }, call: Call, note: string }
export interface Resolution { trial: string, outcome: Outcome, by: { kind: "person", id: string }, note?: string }
export interface Ledger {
  trial(t: Trial): Promise<void>
  resolve(r: Resolution): Promise<void>
}
/** The parts of a triage record (Naive triage.schema.json) a correction reads. */
export interface TriageRecord { id: string, line: number, labels: { key: string, kind: string, p: number | null }[] }

export const certainty = (p: number): number => Math.max(p, 1 - p);
/** The side Jev came down on: 1 for yes, 0 for no. */
export const jevSide = (p: number): 0 | 1 => (p >= 0.5 ? 1 : 0);
export const trialId = (run: string, key: string): string => `triage:${run}:${key}`.replace(/[^A-Za-z0-9._:-]/g, "-");

/** How a person's yes or no settles a call. */
export function outcome(call: Call, jev: 0 | 1, answer: 0 | 1): Outcome {
  if (call === "yes") return answer === jev ? "false-alarm" : "hit";
  return answer === jev ? "correct-rejection" : "miss";
}

/** The trials one triage run makes: one per Noul label Jev answered. */
export function trialsFor(run: string, labels: TriageRecord["labels"], line: number): Trial[] {
  return labels.filter((l) => l.kind === "noul" && typeof l.p === "number").map((l) => {
    const p = l.p as number, score = certainty(p);
    return { id: trialId(run, l.key), key: l.key, score, criterion: { yes: line, yes_when: "below" }, call: score < line ? "yes" : "no", note: `${l.key}: Jev said ${p}` };
  });
}

/** Resolves a filed label a founder changes (a miss) or confirms (a correct rejection) after the run. */
export async function correctFiled(ledger: Ledger, record: TriageRecord, key: string, answer: boolean, by: string, note?: string): Promise<Outcome> {
  const t = trialsFor(record.id, record.labels, record.line).find((x) => x.key === key);
  if (!t) throw new Error(`${record.id} holds no label ${key} that Jev answered`);
  if (t.call !== "no") throw new Error(`${key} was held, so the founder's answer during the run resolved it`);
  const o = outcome("no", jevSide(record.labels.find((x) => x.key === key)?.p ?? 0), answer ? 1 : 0);
  await ledger.resolve({ trial: t.id, outcome: o, by: { kind: "person", id: by }, ...(note ? { note } : {}) });
  return o;
}

/**
 * The ledger through Naive's router: trials are appended as the triage agent, resolutions as the person who answered.
 * The venture needs governance/detectors/triage-accept.json, as every venture made from Naive's template has.
 */
export function routerLedger(ctx: { venture: string, workspace?: string }): Ledger {
  const ok = (r: { ok?: boolean, error?: string }, what: string) => { if (!r?.ok) throw new Error(`${what}: ${r?.error ?? "refused"}`); };
  return {
    async trial(t) {
      ok(await appendTrial({ ...ctx, actor: "agent", actor_id: "triage-agent" }, { detector: DETECTOR, id: t.id, score: t.score, criterion: t.criterion, call: t.call, note: t.note }), `could not record trial ${t.id}`);
    },
    async resolve(r) {
      ok(await resolveTrial({ ...ctx, actor: "person", actor_id: r.by.id }, { detector: DETECTOR, trial: r.trial, outcome: r.outcome, by: r.by, note: r.note }), `could not resolve trial ${r.trial}`);
    },
  };
}
