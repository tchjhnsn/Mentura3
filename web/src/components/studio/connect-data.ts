// Mock data for connectors (C14, V14, S7), functions (V11, V12) and usage (S6). Nothing here is read from or
// written to a store yet. data.ts holds the shared mock data; this file only adds to it.
import type { Commitment, FunctionId } from "./data";

export type ConnectorCategory = "Email and calendar" | "Files" | "Code" | "Payments and finance" | "Social" | "Legal" | "Design";
export const CONNECTOR_CATEGORIES: ConnectorCategory[] = ["Email and calendar", "Files", "Code", "Payments and finance", "Social", "Legal", "Design"];

export type Scopes = { read: boolean; write: boolean; send: boolean };
export type Connector = {
  id: string; name: string; category: ConnectorCategory; does: string; connected: boolean; hue: number;
  /** Agent ids that may use it. */
  agents: string[];
  /** Scopes the venture granted, or would grant on connect. */
  scopes: Scopes;
  /** Which scopes the account offers at all. */
  offers: Scopes;
  /** Functions whose tools lean on it. */
  fns: FunctionId[];
  account?: string;
};

export const CONNECTORS: Connector[] = [
  { id: "gmail", name: "Gmail", category: "Email and calendar", hue: 25, connected: true, account: "torian@hapticplays.co",
    does: "Agents read replies and draft email. Every send waits for your yes.",
    agents: ["marketing-agent", "interview-scheduler", "chief-of-staff"], scopes: { read: true, write: true, send: true }, offers: { read: true, write: true, send: true },
    fns: ["marketing-and-sales", "customer-service", "external-relationships"] },
  { id: "google-calendar", name: "Google Calendar", category: "Email and calendar", hue: 220, connected: true, account: "torian@hapticplays.co",
    does: "Agents find open times and book interview calls on your calendar.",
    agents: ["interview-scheduler", "chief-of-staff"], scopes: { read: true, write: true, send: false }, offers: { read: true, write: true, send: true },
    fns: ["products", "capabilities"] },
  { id: "google-drive", name: "Google Drive", category: "Files", hue: 140, connected: true, account: "Haptic Plays shared drive",
    does: "Agents read the docs and sheets you point them to and save drafts beside them.",
    agents: ["strategy-agent", "product-agent", "chief-of-staff"], scopes: { read: true, write: false, send: false }, offers: { read: true, write: true, send: false },
    fns: ["strategy", "products", "capabilities"] },
  { id: "notion", name: "Notion", category: "Files", hue: 0, connected: false,
    does: "Agents import interview notes and old plans from your Notion pages.",
    agents: ["product-agent"], scopes: { read: true, write: false, send: false }, offers: { read: true, write: true, send: false },
    fns: ["products", "capabilities"] },
  { id: "github", name: "GitHub", category: "Code", hue: 270, connected: true, account: "haptic-plays/vest-firmware",
    does: "Agents read issues and pull requests and open bugs from user feedback.",
    agents: ["product-agent"], scopes: { read: true, write: true, send: false }, offers: { read: true, write: true, send: false },
    fns: ["products", "it"] },
  { id: "linear", name: "Linear", category: "Code", hue: 245, connected: false,
    does: "Agents turn product cards into Linear issues and keep their status in step.",
    agents: ["product-agent"], scopes: { read: true, write: true, send: false }, offers: { read: true, write: true, send: false },
    fns: ["products", "service-delivery"] },
  { id: "slack", name: "Slack", category: "Social", hue: 320, connected: false,
    does: "Agents post the weekly plan and ask you short questions in a channel.",
    agents: ["chief-of-staff"], scopes: { read: true, write: false, send: true }, offers: { read: true, write: true, send: true },
    fns: ["capabilities", "human-capital"] },
  { id: "linkedin", name: "LinkedIn", category: "Social", hue: 210, connected: true, account: "Torian Johnson",
    does: "Agents find coaches and athletic directors and draft connection notes for you to send.",
    agents: ["marketing-agent", "funder-scout"], scopes: { read: true, write: true, send: false }, offers: { read: true, write: true, send: true },
    fns: ["marketing-and-sales", "external-relationships"] },
  { id: "stripe", name: "Stripe", category: "Payments and finance", hue: 260, connected: true, account: "Haptic Plays (test mode)",
    does: "Agents read payments and payouts so spend and runway stay current.",
    agents: ["finance-agent"], scopes: { read: true, write: false, send: false }, offers: { read: true, write: true, send: false },
    fns: ["finance", "marketing-and-sales"] },
  { id: "quickbooks", name: "QuickBooks", category: "Payments and finance", hue: 130, connected: false,
    does: "Agents reconcile spend against the books each month.",
    agents: ["finance-agent"], scopes: { read: true, write: false, send: false }, offers: { read: true, write: true, send: false },
    fns: ["finance"] },
  { id: "docusign", name: "DocuSign", category: "Legal", hue: 50, connected: false,
    does: "Agents prepare envelopes for pilot agreements. You sign; agents never do.",
    agents: ["legal-agent"], scopes: { read: true, write: true, send: false }, offers: { read: true, write: true, send: true },
    fns: ["risk-and-compliance", "human-capital"] },
  { id: "figma", name: "Figma", category: "Design", hue: 10, connected: false,
    does: "Agents read your design files to write product cards and landing copy that match.",
    agents: ["product-agent", "marketing-agent"], scopes: { read: true, write: false, send: false }, offers: { read: true, write: false, send: false },
    fns: ["products", "marketing-and-sales"] },
  { id: "mobbin", name: "Mobbin", category: "Design", hue: 190, connected: true, account: "Studio seat",
    does: "Agents look up how other apps design a screen before drafting one.",
    agents: ["product-agent"], scopes: { read: true, write: false, send: false }, offers: { read: true, write: false, send: false },
    fns: ["products"] },
];
export const connectorOf = (id: string): Connector | undefined => CONNECTORS.find((c) => c.id === id);

/** Shared studio accounts, set up once in S7 and offered to every venture. */
export const SHARED_CONNECTORS = ["gmail", "google-drive", "stripe", "mobbin"];

// Functions (V11, V12).

export const FN_GROUPS: { label: string; line: string; fns: FunctionId[] }[] = [
  { label: "Build", line: "Decide what to make and make it.", fns: ["strategy", "products", "capabilities"] },
  { label: "Sell", line: "Find the people it is for and keep them.", fns: ["marketing-and-sales", "customer-service", "external-relationships"] },
  { label: "Run", line: "Deliver it, day after day.", fns: ["service-delivery", "supply-chain", "assets", "it"] },
  { label: "Keep", line: "Money, people and the rules.", fns: ["finance", "human-capital", "risk-and-compliance"] },
];

/** The functions a venture needs at each commitment level. Each level adds to the one before. */
const NEEDS: Record<Commitment, FunctionId[]> = {
  explore: ["strategy", "products", "marketing-and-sales"],
  prototype: ["capabilities", "it", "finance"],
  charge: ["customer-service", "service-delivery", "risk-and-compliance"],
  raise: ["external-relationships", "human-capital", "supply-chain", "assets"],
};
const ORDER: Commitment[] = ["explore", "prototype", "charge", "raise"];
export const fnsAt = (c: Commitment): FunctionId[] => ORDER.slice(0, ORDER.indexOf(c) + 1).flatMap((k) => NEEDS[k]);
export const levelFor = (fn: FunctionId): Commitment => ORDER.find((k) => NEEDS[k].includes(fn)) ?? "raise";

export type Automation = { name: string; trigger: string; on: boolean; approves: string };
export type FnDetail = { automated: number; tasks: number; measure: { name: string; now: string; target: string }; automations: Automation[]; records: string[] };

export const FN_DETAIL: Record<FunctionId, FnDetail> = {
  strategy: { automated: 2, tasks: 5, measure: { name: "Assumptions with demonstrated evidence", now: "1 of 4", target: "3 of 4 before charge" },
    automations: [{ name: "Regrade assumptions after each interview", trigger: "New interview note", on: true, approves: "torian" }, { name: "Weekly competitor scan", trigger: "Mondays 8:00", on: true, approves: "torian" }, { name: "Gate review reminder", trigger: "Two weeks before a gate", on: false, approves: "maya" }],
    records: ["one-pager.md", "assumptions.json", "canvas.json", "competitors.md"] },
  products: { automated: 3, tasks: 6, measure: { name: "Coaches who would use the vest weekly", now: "3 of 7", target: "5 of 7" },
    automations: [{ name: "Interview notes to product cards", trigger: "Transcript lands in Drive", on: true, approves: "torian" }, { name: "Book the next coach call", trigger: "A card is marked unclear", on: true, approves: "torian" }, { name: "Open a bug from feedback", trigger: "Tester reports a problem", on: false, approves: "dev" }],
    records: ["vest-v1.md", "roadmap.md", "interviews/coach-ramirez.md", "bugs.json"] },
  "marketing-and-sales": { automated: 2, tasks: 6, measure: { name: "Coaches who said yes to a trial", now: "2", target: "5 by December" },
    automations: [{ name: "Draft outreach for new coaches", trigger: "A coach is added to the list", on: true, approves: "torian" }, { name: "Follow up after four quiet days", trigger: "No reply in 4 days", on: true, approves: "torian" }, { name: "Refresh the landing page stats", trigger: "Fridays", on: false, approves: "torian" }],
    records: ["outreach/coaches-v2.md", "decks/investor.json", "landing.md", "pipeline.json"] },
  "supply-chain": { automated: 0, tasks: 4, measure: { name: "Days from order to vest in hand", now: "Not measured", target: "Under 21" },
    automations: [{ name: "Reorder motors when stock is low", trigger: "Fewer than 20 motors", on: false, approves: "dev" }], records: ["vendors.json"] },
  "service-delivery": { automated: 0, tasks: 5, measure: { name: "Pilot teams set up without help", now: "0 of 1", target: "1 of 1" },
    automations: [{ name: "Send the setup checklist", trigger: "A team signs the pilot", on: false, approves: "torian" }], records: ["pilot-checklist.md"] },
  "customer-service": { automated: 1, tasks: 4, measure: { name: "Questions answered within a day", now: "No questions yet", target: "90 percent" },
    automations: [{ name: "Answer setup questions from the help articles", trigger: "New email to help@", on: false, approves: "torian" }], records: ["help/pairing-the-vest.md"] },
  "human-capital": { automated: 0, tasks: 3, measure: { name: "Roles with a signed agreement", now: "1 of 2", target: "2 of 2" },
    automations: [{ name: "Draft the contractor agreement", trigger: "A role is filled", on: false, approves: "torian" }], records: ["roles.json", "agreements/dev-patel.md"] },
  it: { automated: 2, tasks: 4, measure: { name: "Connectors with least access", now: "5 of 7", target: "All" },
    automations: [{ name: "Flag a connector with more access than it uses", trigger: "Daily", on: true, approves: "torian" }, { name: "Rotate API keys", trigger: "Every 90 days", on: false, approves: "dev" }], records: ["connections.json", "accounts.md"] },
  finance: { automated: 3, tasks: 5, measure: { name: "Months of runway", now: "7.5", target: "Above 6" },
    automations: [{ name: "Reconcile spend each month", trigger: "1st of the month", on: true, approves: "torian" }, { name: "Warn at 85 percent of budget", trigger: "Spend crosses 85 percent", on: true, approves: "torian" }, { name: "Update the runway estimate", trigger: "New payment in Stripe", on: true, approves: "maya" }],
    records: ["budget.json", "spend/2026-11.json", "runway.md"] },
  assets: { automated: 0, tasks: 2, measure: { name: "Prototype vests accounted for", now: "4 of 4", target: "All" },
    automations: [{ name: "Check out a vest to a tester", trigger: "A tester is booked", on: false, approves: "dev" }], records: ["equipment.json"] },
  "risk-and-compliance": { automated: 1, tasks: 4, measure: { name: "Contracts read before signing", now: "1 of 1", target: "All" },
    automations: [{ name: "Read new contracts and flag terms", trigger: "A PDF lands in legal/", on: true, approves: "torian" }], records: ["contracts/pilot-agreement.md", "risks.json"] },
  "external-relationships": { automated: 1, tasks: 4, measure: { name: "Funders in conversation", now: "1", target: "3" },
    automations: [{ name: "Find funders like our last yes", trigger: "Weekly", on: false, approves: "torian" }], records: ["investors.json", "partners.md"] },
  capabilities: { automated: 3, tasks: 5, measure: { name: "Handoffs done without a reminder", now: "8 of 11", target: "10 of 11" },
    automations: [{ name: "Plan the week", trigger: "Mondays 7:00", on: true, approves: "torian" }, { name: "Route new work to an agent", trigger: "A handoff is created", on: true, approves: "torian" }, { name: "Save a playbook after a repeat task", trigger: "Same task done three times", on: true, approves: "torian" }],
    records: ["playbooks/coach-outreach.md", "skills.json", "week-47.md"] },
};

/** Folder for a function's records under the venture's files. */
export const FN_FOLDER: Record<FunctionId, string> = {
  strategy: "strategy", products: "product", "marketing-and-sales": "marketing", "supply-chain": "supply", "service-delivery": "delivery",
  "customer-service": "support", "human-capital": "people", it: "it", finance: "finance", assets: "assets", "risk-and-compliance": "legal",
  "external-relationships": "relations", capabilities: "operations",
};

/** Tools that open a real screen in the prototype, as the part after /studio/v/<slug>/. */
export const TOOL_ROUTES: Record<string, string> = {
  Decks: "decks/investor", "Outreach sequences": "outreach", "Strategy canvas": "strategy", "Assumption map": "strategy",
  Connectors: "connectors", Accounts: "connectors", Handoffs: "activity", Spend: "settings", Budget: "settings", Playbooks: "automations", Skills: "agents",
};

/** What each tool does, for the sheet a tool opens when it has no screen yet. */
export const TOOL_ABOUT: Record<string, string> = {
  "Gate review": "Checks the evidence against the next commitment level and tells you what is still missing.",
  "Competitor tracker": "Keeps a list of competitors with what changed since you last looked.",
  "Product cards": "One card per thing you could build, with the interviews behind it.",
  Roadmap: "What gets built next and why, tied to the product cards.",
  "Prototype preview": "A live preview of the prototype the agent is building.",
  "Bug list": "Bugs from testers and GitHub, ranked by how many people they stop.",
  "Landing page": "A one page site for the venture, drafted from the strategy canvas.",
  Pipeline: "Every coach, team and buyer, and where each one stands.",
};

// Usage (S6).

export const DAILY_SPEND: number[] = [3.1, 4.2, 2.8, 5.6, 6.1, 1.2, 0.9, 4.8, 5.2, 7.4, 6.6, 5.9, 1.8, 1.1, 6.2, 8.3, 7.1, 5.4, 6.8, 2.2, 1.6];
export const AGENT_SPEND: Record<string, { cost: number; runs: number }> = {
  "chief-of-staff": { cost: 21.4, runs: 182 }, "strategy-agent": { cost: 24.9, runs: 41 }, "marketing-agent": { cost: 31.2, runs: 133 },
  "product-agent": { cost: 9.8, runs: 37 }, "finance-agent": { cost: 3.1, runs: 96 }, "legal-agent": { cost: 6.4, runs: 8 },
  "interview-scheduler": { cost: 4.6, runs: 71 }, "funder-scout": { cost: 14.6, runs: 22 },
};
export const TIER_SPEND: { tier: "Lite" | "Balanced" | "Power"; cost: number; runs: number; line: string }[] = [
  { tier: "Lite", cost: 7.7, runs: 167, line: "Scheduling, reconciling, routing" },
  { tier: "Balanced", cost: 55.6, runs: 192, line: "Drafting, research, product cards" },
  { tier: "Power", cost: 52.7, runs: 231, line: "Strategy, legal reads, planning" },
];
