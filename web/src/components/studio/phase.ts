// Naive's phases and the top-level agents (mock). Naive exists to get a venture through its phases; each venture
// states its own exit criteria for the phase it is in (foundation/exit-criteria/<phase>.json), a person marks a
// criterion met with its evidence, and an agent may only propose it (Naive's engine/lifecycle.mjs).
import { AGENTS, type Agent } from "./data";

export type Phase = "discovery" | "validation" | "beachhead" | "scale" | "platform";
export const PHASES: { id: Phase; label: string; question: string }[] = [
  { id: "discovery", label: "Discovery", question: "Is there a real problem worth solving?" },
  { id: "validation", label: "Validation", question: "Will the people who have it change what they do, or pay?" },
  { id: "beachhead", label: "Beachhead", question: "Can you win one narrow market completely?" },
  { id: "scale", label: "Scale", question: "Does it grow without the founder doing everything?" },
  { id: "platform", label: "Platform", question: "Do others build on it?" },
];
export const phaseLabel = (p: Phase) => PHASES.find((x) => x.id === p)!.label;
export const nextPhase = (p: Phase): Phase | null => PHASES[PHASES.findIndex((x) => x.id === p) + 1]?.id ?? null;

export type Criterion = { id: string; statement: string; met: { by: string; at: string; evidence: string } | null; proposedBy?: string; owner: string };
export type PhaseState = { phase: Phase; criteria: Criterion[] };

export const PHASE_OF: Record<string, PhaseState> = {
  "haptic-plays": {
    phase: "validation",
    criteria: [
      { id: "hurts", statement: "Five coaches say calling plays over crowd noise costs them games", met: { by: "torian", at: "Nov 18", evidence: "products/interview-notes/coach-1.md and four more" }, owner: "strategy-lead" },
      { id: "segment", statement: "High school football coaches are named as the first segment", met: { by: "torian", at: "Nov 19", evidence: "strategy/one-pager.md" }, owner: "strategy-lead" },
      { id: "practice", statement: "One team uses the vest in a real practice and asks to keep it", met: null, proposedBy: "product-lead", owner: "product-lead" },
      { id: "pay", statement: "Three programs agree to pay for a ten vest pilot", met: null, owner: "growth-lead" },
    ],
  },
  "pattern-language": {
    phase: "discovery",
    criteria: [
      { id: "problem", statement: "The problem is written in one sentence the founder can defend", met: { by: "torian", at: "Nov 12", evidence: "strategy/one-pager.md" }, owner: "strategy-lead" },
      { id: "interviews", statement: "Five architects describe how they pick patterns today", met: null, proposedBy: "strategy-lead", owner: "strategy-lead" },
      { id: "exists", statement: "At least three of them say it costs them real hours", met: null, owner: "strategy-lead" },
    ],
  },
  "founder-raise": {
    phase: "validation",
    criteria: [
      { id: "thesis", statement: "The founder thesis is written and tested with two advisors", met: { by: "maya", at: "Nov 15", evidence: "strategy/founder-thesis.md" }, owner: "strategy-lead" },
      { id: "list", statement: "A short list of ten funders who back founders over ideas", met: { by: "torian", at: "Nov 20", evidence: "external/funders/short-list.md" }, owner: "growth-lead" },
      { id: "meetings", statement: "Three funders take a first meeting", met: null, proposedBy: "growth-lead", owner: "growth-lead" },
    ],
  },
};
export const phaseOf = (slug: string): PhaseState => PHASE_OF[slug] ?? PHASE_OF["haptic-plays"]!;

/** The top-level agents a person talks to: the chief of staff and the four leads (Naive's lead agents design,
 * each lead covering a portfolio of the 13 functions). Function agents work under them. */
export type Lead = { id: string; name: string; covers: string; status: Agent["status"]; hue: number; works: string[] };
export const LEADS: Lead[] = [
  { id: "chief-of-staff", name: "Chief of staff", covers: "Plans the week, routes work to the leads, brings you only the calls that are yours", status: "running", hue: 24, works: [] },
  { id: "strategy-lead", name: "Strategy lead", covers: "Strategy, capabilities, people, investors and partners", status: "needs-you", hue: 260, works: ["strategy-agent"] },
  { id: "product-lead", name: "Product lead", covers: "Product, delivery, supply and IT", status: "idle", hue: 200, works: ["product-agent", "interview-scheduler"] },
  { id: "growth-lead", name: "Growth lead", covers: "Marketing, sales and customer service", status: "running", hue: 330, works: ["marketing-agent", "funder-scout"] },
  { id: "finance-lead", name: "Finance lead", covers: "Money, assets, legal and risk", status: "running", hue: 140, works: ["finance-agent", "legal-agent"] },
];
/** Any agent you can talk to, in the lead shape: a lead, or a function agent working under one. */
export const leadOf = (id: string | null | undefined): Lead => {
  const lead = LEADS.find((l) => l.id === id);
  if (lead) return lead;
  const a = AGENTS.find((x) => x.id === id && x.id !== "chief-of-staff");
  if (!a) return LEADS[0]!;
  const boss = LEADS.find((l) => l.works.includes(a.id));
  return { id: a.id, name: a.name, covers: a.job.replace(/\.$/, ""), status: a.status, hue: boss?.hue ?? 60, works: [] };
};
/** The lead an agent works under, if any. */
export const bossOf = (id: string) => LEADS.find((l) => l.works.includes(id)) ?? null;
export const workersOf = (l: Lead) => AGENTS.filter((a) => l.works.includes(a.id));
