// Skills and plugins (mock), modeled on OpenAI Platform's agent tools: a skill is something an agent knows how to do
// (instructions plus the records it reads and writes); a plugin is an outside service it may call, each exposing tools.
// Naive ships built-in skills per function; the rest come from the Library or are written by you.

export type SkillSource = "Naive" | "Library" | "Yours";
export type Skill = {
  id: string; name: string; job: string; source: SkillSource; fn: string;
  reads: string[]; writes: string[]; steps: string[]; agents: string[]; on: boolean; held?: string;
};
export type PluginTool = { name: string; does: string; ask: boolean };
export type Plugin = {
  id: string; name: string; job: string; kind: "Connector" | "MCP server"; connected: boolean;
  account?: string; tools: PluginTool[]; agents: string[]; on: boolean;
};

export const SKILLS: Skill[] = [
  { id: "grade-evidence", name: "Grade evidence", job: "Grades each assumption from the evidence cited behind it, high to very low.", source: "Naive", fn: "strategy",
    reads: ["purpose/validation/", "products/interview-notes/"], writes: ["purpose/validation/grades.json"], steps: ["Read every validation record", "Grade each from its cited evidence", "Propose, never mark, an exit criterion met"], agents: ["strategy-lead", "strategy-agent", "chief-of-staff"], on: true },
  { id: "plan-week", name: "Plan the week", job: "Turns the phase's open exit criteria into handoffs for the leads.", source: "Naive", fn: "capabilities",
    reads: ["foundation/exit-criteria/", "operations/handoffs/"], writes: ["operations/handoffs/", "operations/week-47.md"], steps: ["Read what stands between the business and the next phase", "Write one handoff per criterion", "Send each to the lead that owns it"], agents: ["chief-of-staff"], on: true },
  { id: "write-deck", name: "Write a deck", job: "Drafts a deck from the one-pager and the latest evidence.", source: "Naive", fn: "marketing-and-sales",
    reads: ["strategy/one-pager.md", "purpose/validation/"], writes: ["marketing/decks/"], steps: ["Read the one-pager", "Draft six slides", "Hold sharing for your yes"], agents: ["growth-lead", "marketing-agent"], on: true, held: "Sharing a deck" },
  { id: "draft-outreach", name: "Draft outreach", job: "Writes short first emails to the people on a list and holds each send.", source: "Naive", fn: "marketing-and-sales",
    reads: ["external/contacts/", "strategy/one-pager.md"], writes: ["marketing/outreach/"], steps: ["Pick who to write to", "Draft one email each", "Hold every send for your yes"], agents: ["growth-lead", "marketing-agent", "funder-scout"], on: true, held: "Sending email" },
  { id: "interview-guide", name: "Interview guide", job: "Writes the questions for a problem interview from the four assumptions.", source: "Library", fn: "products",
    reads: ["purpose/validation/assumptions.json"], writes: ["products/interview-guides/"], steps: ["Read the four assumptions", "Write open questions, no pitching", "Add a prep sheet for the person"], agents: ["product-lead", "product-agent", "interview-scheduler"], on: true },
  { id: "price-pilot", name: "Price a pilot", job: "Lays out pilot prices from parts cost and what customers said is fair.", source: "Library", fn: "finance",
    reads: ["finance/budget.sheet", "products/interview-notes/"], writes: ["decisions/"], steps: ["Read costs and quotes", "Lay out two or three prices", "Open a decision for you"], agents: ["finance-lead", "finance-agent"], on: false },
  { id: "reconcile-spend", name: "Reconcile spend", job: "Matches every charge to a budget line and flags the ones that do not fit.", source: "Naive", fn: "finance",
    reads: ["finance/spend/", "it/connections/"], writes: ["finance/budget.sheet"], steps: ["Pull this month's charges", "Match each to a line", "Flag tools nobody uses"], agents: ["finance-lead", "finance-agent"], on: true },
  { id: "read-contract", name: "Read a contract", job: "Reads a contract and lists the terms you should look at before signing.", source: "Naive", fn: "risk-and-compliance",
    reads: ["legal/contracts/"], writes: ["legal/reviews/"], steps: ["Read the contract", "List unusual terms with page numbers", "Never sign; a signature is yours"], agents: ["finance-lead", "legal-agent"], on: true, held: "Signing" },
  { id: "coach-voice", name: "Write like a coach", job: "Keeps outreach in the plain voice coaches use with each other.", source: "Yours", fn: "marketing-and-sales",
    reads: ["marketing/voice.md"], writes: [], steps: ["Read the voice notes", "Rewrite drafts in that voice"], agents: ["marketing-agent"], on: true },
];

export const PLUGINS: Plugin[] = [
  { id: "gmail", name: "Gmail", job: "Read and draft email from the business's inbox.", kind: "Connector", connected: true, account: "torian@hapticplays.co",
    tools: [{ name: "search_email", does: "Find messages", ask: false }, { name: "draft_email", does: "Write a draft", ask: false }, { name: "send_email", does: "Send a message", ask: true }], agents: ["growth-lead", "marketing-agent", "interview-scheduler"], on: true },
  { id: "calendar", name: "Google Calendar", job: "See free time and book calls.", kind: "Connector", connected: true, account: "torian@hapticplays.co",
    tools: [{ name: "list_events", does: "See the calendar", ask: false }, { name: "create_event", does: "Book a call", ask: true }], agents: ["chief-of-staff", "interview-scheduler"], on: true },
  { id: "github", name: "GitHub", job: "Read the code and open draft pull requests.", kind: "Connector", connected: true, account: "haptic-plays",
    tools: [{ name: "read_repo", does: "Read files", ask: false }, { name: "open_pull_request", does: "Open a draft pull request", ask: false }, { name: "merge", does: "Merge a pull request", ask: true }], agents: ["product-lead", "product-agent"], on: true },
  { id: "linear", name: "Linear", job: "Keep issues in step with product cards.", kind: "Connector", connected: false,
    tools: [{ name: "list_issues", does: "Read issues", ask: false }, { name: "create_issue", does: "File an issue", ask: false }], agents: ["product-agent"], on: false },
  { id: "stripe", name: "Stripe", job: "See payments and send invoices.", kind: "Connector", connected: true, account: "Haptic Plays LLC",
    tools: [{ name: "list_charges", does: "Read payments", ask: false }, { name: "create_invoice", does: "Send an invoice", ask: true }, { name: "refund", does: "Refund a payment", ask: true }], agents: ["finance-lead", "finance-agent"], on: true },
  { id: "docusign", name: "DocuSign", job: "Prepare agreements for signature.", kind: "Connector", connected: false,
    tools: [{ name: "prepare_envelope", does: "Prepare an agreement", ask: false }, { name: "send_envelope", does: "Send for signature", ask: true }], agents: ["legal-agent"], on: false },
  { id: "mobbin", name: "Mobbin", job: "Find screens from real apps for reference.", kind: "MCP server", connected: true,
    tools: [{ name: "search_screens", does: "Search screens", ask: false }, { name: "save_content", does: "Save to a collection", ask: false }], agents: ["product-agent"], on: true },
  { id: "web", name: "Web research", job: "Search the web and read pages, with sources kept.", kind: "MCP server", connected: true,
    tools: [{ name: "search", does: "Search", ask: false }, { name: "fetch", does: "Read a page", ask: false }], agents: ["strategy-lead", "strategy-agent", "funder-scout"], on: true },
];

export const skillsOf = (agentId: string) => SKILLS.filter((s) => s.agents.includes(agentId));
export const pluginsOf = (agentId: string) => PLUGINS.filter((p) => p.agents.includes(agentId));
