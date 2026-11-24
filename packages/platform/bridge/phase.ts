// What a founder sees of the lifecycle gate (schema/lifecycle.mjs): the framework's answer in plain words.
// The gate itself stays in the framework; nothing here decides whether a venture may move.

type Criterion = { id: string; statement: string; evidence: string | null; met: { at: string; by: string; evidence?: string } | null };
type Stage = { id: string; name: string; question: string; gate: string };
export type Lifecycle = {
  step: number; of: number; current: Stage | null; next: Stage | null; ready: boolean;
  source: string | null; playbook: { id: string; chosen: boolean } | null;
  gate_evidence: { statement: string; met: boolean }[]; exit_criteria: Criterion[];
};
export type PhaseView = {
  name: string; question: string; gate: string; step: number; of: number; ready: boolean;
  next: { id: string; name: string; question: string } | null;
  criteria: Criterion[]; gaps: string[];
  /** The title of the playbook the framework is using. */
  playbook: string | null;
  /** The founder can say here what must be true to leave this phase. */
  statable: boolean;
  /** What the venture's playbook still asks a met criterion's evidence to show. */
  wanted: string[];
} & PhaseOffers;
/** What the bridge adds to the lifecycle: the playbooks on offer, the one the venture named, and the
 *  fingerprint of canonical exit criteria an agent wrote and no person has confirmed. */
export type PhaseOffers = { playbooks: { id: string; title: string; description: string }[]; chosen: string | null; unconfirmed: string | null };

// With no record to add to, source is null and the docket's own card asks for the whole telos.
export const statable = (l: Lifecycle) => !!l.next && !l.exit_criteria.length && l.source !== null;
export const wanted = (l: Lifecycle) => (l.playbook?.chosen ? l.gate_evidence.filter((e) => !e.met).map((e) => e.statement) : []);

/** Everything but the criteria themselves that stands between the venture and the next phase. */
function gaps(l: Lifecycle): string[] {
  const name = l.current?.name ?? "this phase";
  return [
    ...(l.exit_criteria.length || !l.next ? [] : [`No exit criteria are stated for ${name} yet. ${statable(l) ? "State what must be true to leave it." : "The docket's exit criteria card asks for them."}`]),
    ...(l.playbook ? [] : ["This venture names a lifecycle playbook Naive does not have."]),
    ...wanted(l).map((statement) => `Your ${l.playbook?.id} playbook asks for ${statement}. Say so in the evidence of a criterion it supports.`),
  ];
}

export function phaseView(l: Lifecycle, offers: PhaseOffers = { playbooks: [], chosen: null, unconfirmed: null }): PhaseView | null {
  if (!l.current) return null;
  const { name, question, gate } = l.current;
  const next = l.next && { id: l.next.id, name: l.next.name, question: l.next.question };
  return { name, question, gate, playbook: offers.playbooks.find((p) => p.id === l.playbook?.id)?.title ?? null, step: l.step, of: l.of, ready: l.ready, next, criteria: l.exit_criteria, gaps: gaps(l), statable: statable(l), wanted: wanted(l), ...offers };
}

/** Why the gate refused, in the founder's words: no CLI flags, no file paths. */
export function gateRefusal(l: Lifecycle): string {
  const unmet = l.exit_criteria.filter((c) => !c.met).map((c) => c.statement);
  const left = [...unmet.map((s) => `"${s}" is not marked met.`), ...gaps(l)];
  return `${l.current?.name ?? "This phase"} is not finished, so nothing changed. ${left.join(" ")}`;
}
