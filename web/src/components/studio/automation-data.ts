// Mock data for the Agents (V6), Agent builder (V7) and Automations (V8) screens. Nothing is stored yet.
import type { Agent, FunctionId, Run } from "./data";

/** Community agents, found in the Library (/studio/library). */
export type CommunityAgent = { id: string; name: string; fn: FunctionId; job: string; author: string; installs: number };
export const COMMUNITY_AGENTS: CommunityAgent[] = [
  { id: "grant-finder", name: "Grant finder", fn: "finance", job: "Finds grants that fit the venture's stage and drafts the first answers.", author: "Lena Fischer", installs: 1840 },
  { id: "pilot-contract", name: "Pilot contract drafter", fn: "risk-and-compliance", job: "Drafts a one page pilot agreement from a call summary.", author: "Omar Haddad", installs: 960 },
  { id: "school-buyer-map", name: "School buyer map", fn: "marketing-and-sales", job: "Maps who signs purchases at a school district and how long it takes.", author: "Priya Nair", installs: 412 },
];

/** A prebuilt agent you can hire for a function that has none yet. */
export const hireable = (fn: FunctionId, label: string): Agent => ({
  id: `${fn}-agent`, name: `${label} agent`, fn, kind: "prebuilt", status: "idle",
  job: `Runs the routine work of ${label.toLowerCase()} and asks you before anything leaves the venture.`,
  tools: [], model: "Balanced", runsToday: 0,
});

// Agent builder (V7)
export type NodeKind =
  | "start" | "agent" | "ask" | "end" | "note"
  | "file-search" | "web" | "connector" | "write"
  | "if" | "loop" | "approval"
  | "transform" | "state";
export type FlowNode = {
  id: string; kind: NodeKind; name: string; instructions: string; model: "Lite" | "Balanced" | "Power";
  tools: string[]; fn: FunctionId; needsYes: string[]; output: string;
};

export const PALETTE: { group: string; items: { kind: NodeKind; label: string }[] }[] = [
  { group: "Core", items: [{ kind: "agent", label: "Agent" }, { kind: "ask", label: "Ask a person" }, { kind: "end", label: "End" }, { kind: "note", label: "Note" }] },
  { group: "Tools", items: [{ kind: "file-search", label: "File search" }, { kind: "web", label: "Web research" }, { kind: "connector", label: "Connector call" }, { kind: "write", label: "Write record" }] },
  { group: "Logic", items: [{ kind: "if", label: "If/else" }, { kind: "loop", label: "Loop" }, { kind: "approval", label: "Wait for approval" }] },
  { group: "Data", items: [{ kind: "transform", label: "Transform" }, { kind: "state", label: "Set state" }] },
];
export const KIND_LABEL: Record<NodeKind, string> = {
  start: "Start", agent: "Agent", ask: "Ask a person", end: "End", note: "Note", "file-search": "File search", web: "Web research",
  connector: "Connector call", write: "Write record", if: "If/else", loop: "Loop", approval: "Wait for approval", transform: "Transform", state: "Set state",
};
export const BUILDER_TOOLS = ["Product cards", "Interview notes", "Gmail", "Calendar", "Contacts", "Web research", "GitHub", "Linear", "Decks", "Stripe"];
export const NEEDS_YES = ["Sending anything outside the venture", "Spending money", "A public commitment", "Signing or agreeing to terms", "Changing a gate or commitment"];
export const OUTPUTS = ["Plain text", "Record (JSON)", "Markdown file", "Email draft"];

let seq = 0;
export const makeNode = (kind: NodeKind, fn: FunctionId, name?: string, instructions = "", extra: Partial<FlowNode> = {}): FlowNode => ({
  id: `n${++seq}`, kind, name: name ?? KIND_LABEL[kind], instructions, model: "Balanced", tools: [], fn,
  needsYes: kind === "approval" ? ["Sending anything outside the venture"] : [], output: kind === "write" ? "Record (JSON)" : "Plain text", ...extra,
});

/** The flow a builder opens with, by agent. "blank" is Start then End. */
export function seedFlow(agentId: string, fn: FunctionId): FlowNode[] {
  const s = (k: NodeKind, n?: string, i?: string, x?: Partial<FlowNode>) => makeNode(k, fn, n, i, x);
  if (agentId === "blank") return [s("start"), s("end")];
  if (agentId === "marketing-agent") return [
    s("start", "Start", "Runs when a new product card is approved."),
    s("file-search", "Read product cards", "Read the approved product cards and the coach interview notes."),
    s("agent", "Agent: draft outreach", "Write a short email to each coach on the list. Name the play they asked for in the interview.", { model: "Balanced", tools: ["Product cards", "Contacts"] }),
    s("approval", "Wait for approval", "Hold every send for Torian's yes."),
    s("connector", "Gmail: send", "Send the approved emails from the venture's Gmail.", { tools: ["Gmail"] }),
    s("end"),
  ];
  if (agentId === "interview-scheduler") return [
    s("start", "Start", "Runs every Monday at 9:00."),
    s("file-search", "Read coach list", "Read coaches in contacts tagged 'interview' who have not had a call."),
    s("agent", "Agent: pick three coaches", "Pick three coaches from different schools. Prefer coaches who replied before.", { model: "Lite", tools: ["Contacts"] }),
    s("connector", "Calendar: book calls", "Offer two 20 minute slots this week and book the one they pick.", { tools: ["Calendar", "Gmail"] }),
    s("write", "Write record", "Add each booked call to product/interviews."),
    s("end"),
  ];
  return [
    s("start", "Start", "Runs when new interview notes land in product/interviews."),
    s("file-search", "Read interview notes", "Read the new notes and the existing product cards."),
    s("agent", "Agent: draft product cards", "Turn each pain a coach named into a product card with the quote that backs it.", { model: "Balanced", tools: ["Interview notes", "Product cards"] }),
    s("approval", "Wait for approval", "Hold new cards until a person says yes."),
    s("write", "Write record", "Save the approved cards to products/."),
    s("end"),
  ];
}

export const KNOWLEDGE = [
  { path: "product/interviews/coach-ramirez.md", size: "6 KB" },
  { path: "product/interviews/coach-lee.md", size: "4 KB" },
  { path: "products/haptic-vest.json", size: "2 KB" },
  { path: "strategy/assumptions.json", size: "3 KB" },
  { path: "marketing/outreach/coaches-v2.md", size: "2 KB" },
];
export const TRIGGERS = [
  { id: "t1", what: "New interview notes land in product/interviews", kind: "New record", on: true },
  { id: "t2", what: "Every Monday at 9:00", kind: "Schedule", on: true },
  { id: "t3", what: "The chief of staff hands it a task", kind: "Handoff", on: false },
];

// Automations (V8)
export type TriggerKind = "Schedule" | "New record" | "Email arrives" | "Webhook";
export type Automation = {
  id: string; name: string; fn: FunctionId; trigger: TriggerKind; when: string; steps: string[];
  agent: string; approver: string | null; lastRun: string; on: boolean; held?: boolean;
};
export const AUTOMATIONS: Automation[] = [
  { id: "a1", name: "Weekly assumption check", fn: "strategy", trigger: "Schedule", when: "Fridays at 16:00", steps: ["Read new evidence", "Regrade the four assumptions", "Flag any that moved"], agent: "strategy-agent", approver: "torian", lastRun: "Yesterday", on: true, held: true },
  { id: "a2", name: "Competitor watch", fn: "strategy", trigger: "Schedule", when: "Every morning", steps: ["Search for new wearable coaching products", "Add to competitor tracker"], agent: "strategy-agent", approver: null, lastRun: "6 h ago", on: true },
  { id: "a3", name: "Interview notes to product cards", fn: "products", trigger: "New record", when: "A file lands in product/interviews", steps: ["Read the notes", "Draft product cards", "Hold for a yes", "Save cards"], agent: "product-agent", approver: "torian", lastRun: "2 h ago", on: true },
  { id: "a4", name: "Book coach interviews", fn: "products", trigger: "Schedule", when: "Mondays at 9:00", steps: ["Pick three coaches", "Offer two slots", "Book and send prep sheet"], agent: "interview-scheduler", approver: null, lastRun: "6 min ago", on: true },
  { id: "a5", name: "Bug report to Linear", fn: "products", trigger: "Email arrives", when: "Subject starts with 'Vest bug'", steps: ["Read the email", "Open a Linear issue", "Reply with the issue link"], agent: "product-agent", approver: null, lastRun: "3 days ago", on: false },
  { id: "a6", name: "Coach outreach", fn: "marketing-and-sales", trigger: "New record", when: "A product card is approved", steps: ["Draft one email per coach", "Hold every send", "Send from Gmail"], agent: "marketing-agent", approver: "torian", lastRun: "4 min ago", on: true, held: true },
  { id: "a7", name: "Reply to demo requests", fn: "marketing-and-sales", trigger: "Webhook", when: "The landing page form is sent", steps: ["Thank them", "Offer a demo slot", "Add to pipeline"], agent: "marketing-agent", approver: "torian", lastRun: "Yesterday", on: true },
  { id: "a8", name: "Answer vest questions", fn: "customer-service", trigger: "Email arrives", when: "Mail to help@hapticplays.com", steps: ["Match a help article", "Draft a reply", "Hold for a yes"], agent: "chief-of-staff", approver: "dev", lastRun: "1 h ago", on: true },
  { id: "a9", name: "Reconcile spend", fn: "finance", trigger: "Schedule", when: "First day of the month", steps: ["Pull Stripe and bank feed", "Match to budget lines", "Report what is over"], agent: "finance-agent", approver: null, lastRun: "1 h ago", on: true },
  { id: "a10", name: "Runway warning", fn: "finance", trigger: "New record", when: "A spend record is written", steps: ["Recompute runway", "Warn if under four months"], agent: "finance-agent", approver: null, lastRun: "1 h ago", on: true },
  { id: "a11", name: "Read new contracts", fn: "risk-and-compliance", trigger: "Email arrives", when: "An attachment named 'agreement'", steps: ["Read the contract", "Flag unusual terms", "Hold before signing"], agent: "legal-agent", approver: "torian", lastRun: "9 days ago", on: false },
  { id: "a12", name: "Plan the week", fn: "capabilities", trigger: "Schedule", when: "Mondays at 7:00", steps: ["Read open decisions", "Route tasks to agents", "Write the week plan"], agent: "chief-of-staff", approver: null, lastRun: "8 h ago", on: true },
  { id: "a13", name: "New tool access review", fn: "it", trigger: "Webhook", when: "A connector is added", steps: ["List what it can touch", "Ask who approves"], agent: "chief-of-staff", approver: "dev", lastRun: "4 days ago", on: true },
];

/** Routine tasks per function and how many have an automation. */
export const COVERAGE: Record<FunctionId, number> = {
  strategy: 4, products: 5, "marketing-and-sales": 6, "supply-chain": 3, "service-delivery": 3, "customer-service": 4,
  "human-capital": 3, it: 3, finance: 4, assets: 2, "risk-and-compliance": 3, "external-relationships": 4, capabilities: 3,
};

/** Recent runs for one automation, shaped like RUNS so they show with RunRow (C12). */
export const runsFor = (a: Automation, venture: string): Run[] => [
  { id: `${a.id}-3`, agent: a.agent, venture, title: a.name, status: a.held ? "held" : "done", started: a.lastRun, took: "52s", cost: 0.07, changed: [] },
  { id: `${a.id}-2`, agent: a.agent, venture, title: a.name, status: "done", started: "Last week", took: "1m 04s", cost: 0.09, changed: [] },
  { id: `${a.id}-1`, agent: a.agent, venture, title: a.name, status: a.id === "a3" ? "failed" : "done", started: "2 weeks ago", took: "47s", cost: 0.06, changed: [] },
];
