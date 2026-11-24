// Mock data for the Venture Studio prototype. Nothing here is read from or written to a store yet.
// Every screen (S = studio, V = inside one venture) and every shared component (C) has a number, listed in
// SCREENS and COMPONENTS so the screen map (/studio/map) and the number tags agree.

export type FunctionId =
  | "strategy" | "products" | "marketing-and-sales" | "supply-chain" | "service-delivery" | "customer-service"
  | "human-capital" | "it" | "finance" | "assets" | "risk-and-compliance" | "external-relationships" | "capabilities";

export type Commitment = "explore" | "prototype" | "charge" | "raise";
export const COMMITMENTS: Commitment[] = ["explore", "prototype", "charge", "raise"];

export type Person = { id: string; name: string; role: string; hue: number };
export type Venture = {
  slug: string; name: string; oneLine: string; commitment: Commitment; hue: number;
  needNow: string; updated: string; agentsRunning: number; openDecisions: number; spendMonth: number; budgetMonth: number;
  team: string[];
};
export type Agent = {
  id: string; name: string; fn: FunctionId; kind: "prebuilt" | "yours" | "community"; status: "running" | "idle" | "paused" | "needs-you";
  job: string; tools: string[]; model: string; runsToday: number;
};
export type Fn = { id: FunctionId; label: string; short: string; tools: string[] };

export const PEOPLE: Person[] = [
  { id: "torian", name: "Torian Johnson", role: "Founder", hue: 24 },
  { id: "maya", name: "Maya Ortiz", role: "Advisor", hue: 200 },
  { id: "dev", name: "Dev Patel", role: "Engineer", hue: 140 },
  { id: "ana", name: "Ana Reyes", role: "Designer", hue: 300 },
];
export const personOf = (id: string): Person => PEOPLE.find((p) => p.id === id) ?? { id, name: id, role: "", hue: 0 };

export const VENTURES: Venture[] = [
  { slug: "haptic-plays", name: "Haptic Plays", oneLine: "Coaches call a play, players feel it on a wearable.", commitment: "prototype", hue: 24,
    needNow: "Test the vest with one high school team before building more plays.", updated: "12 min ago", agentsRunning: 3, openDecisions: 2, spendMonth: 41, budgetMonth: 120, team: ["torian", "dev"] },
  { slug: "pattern-language", name: "Pattern Language", oneLine: "A pattern language for buildings, searchable and buildable.", commitment: "explore", hue: 160,
    needNow: "Interview five architects about how they pick patterns today.", updated: "2 h ago", agentsRunning: 1, openDecisions: 4, spendMonth: 12, budgetMonth: 60, team: ["torian", "ana"] },
  { slug: "founder-raise", name: "Founder Raise", oneLine: "Fund a founder's time, not one idea.", commitment: "charge", hue: 260,
    needNow: "Send the deck to three funders on the short list.", updated: "Yesterday", agentsRunning: 2, openDecisions: 1, spendMonth: 63, budgetMonth: 100, team: ["torian", "maya"] },
];
export const ventureOf = (slug: string): Venture => VENTURES.find((v) => v.slug === slug) ?? VENTURES[0]!;

export const FUNCTIONS: Fn[] = [
  { id: "strategy", label: "Strategy", short: "Strategy", tools: ["Strategy canvas", "Assumption map", "Gate review", "Competitor tracker"] },
  { id: "products", label: "Products and services", short: "Product", tools: ["Product cards", "Roadmap", "Prototype preview", "Bug list"] },
  { id: "marketing-and-sales", label: "Marketing and sales", short: "Marketing", tools: ["Decks", "Outreach sequences", "Landing page", "Pipeline"] },
  { id: "supply-chain", label: "Supply chain", short: "Supply", tools: ["Vendors", "Purchase orders", "Inventory"] },
  { id: "service-delivery", label: "Service delivery", short: "Delivery", tools: ["Handoffs", "Delivery board", "Checklists"] },
  { id: "customer-service", label: "Customer service", short: "Support", tools: ["Inbox", "Help articles", "Feedback"] },
  { id: "human-capital", label: "Human capital (HR)", short: "People", tools: ["Roles", "Hiring pipeline", "Agreements"] },
  { id: "it", label: "Information technology", short: "IT", tools: ["Connectors", "Accounts", "Security"] },
  { id: "finance", label: "Finance and accounting", short: "Finance", tools: ["Budget", "Spend", "Runway", "Cap table"] },
  { id: "assets", label: "Assets and facilities", short: "Assets", tools: ["Equipment", "Spaces"] },
  { id: "risk-and-compliance", label: "Legal, risk and compliance", short: "Legal", tools: ["Contracts", "Risk register", "Filings"] },
  { id: "external-relationships", label: "External relationships", short: "Relations", tools: ["Investors", "Partners", "Press"] },
  { id: "capabilities", label: "Business capabilities", short: "Capabilities", tools: ["Skills", "Playbooks", "Templates"] },
];
export const fnOf = (id: FunctionId): Fn => FUNCTIONS.find((f) => f.id === id)!;

export const AGENTS: Agent[] = [
  { id: "chief-of-staff", name: "Chief of staff", fn: "capabilities", kind: "prebuilt", status: "running", job: "Plans the week, routes work to the other agents, asks you when a call is yours.", tools: ["Handoffs", "Decisions", "Calendar"], model: "Power", runsToday: 14 },
  { id: "strategy-agent", name: "Strategy agent", fn: "strategy", kind: "prebuilt", status: "needs-you", job: "Keeps the strategy canvas current and grades the evidence behind each assumption.", tools: ["Strategy canvas", "Assumption map", "Web research"], model: "Power", runsToday: 3 },
  { id: "marketing-agent", name: "Marketing agent", fn: "marketing-and-sales", kind: "prebuilt", status: "running", job: "Drafts decks, landing copy and outreach, and holds every send for your yes.", tools: ["Decks", "Gmail", "LinkedIn"], model: "Balanced", runsToday: 9 },
  { id: "product-agent", name: "Product agent", fn: "products", kind: "prebuilt", status: "idle", job: "Turns interview notes into product cards and keeps the roadmap honest.", tools: ["Product cards", "GitHub", "Linear"], model: "Balanced", runsToday: 2 },
  { id: "finance-agent", name: "Finance agent", fn: "finance", kind: "prebuilt", status: "running", job: "Tracks spend against budget and warns before runway gets short.", tools: ["Budget", "Stripe", "Bank feed"], model: "Lite", runsToday: 6 },
  { id: "legal-agent", name: "Legal agent", fn: "risk-and-compliance", kind: "prebuilt", status: "paused", job: "Reads contracts and flags terms you should look at before signing.", tools: ["Contracts", "DocuSign"], model: "Power", runsToday: 0 },
  { id: "interview-scheduler", name: "Interview scheduler", fn: "products", kind: "yours", status: "running", job: "Finds coaches on the list, books 20 minute calls, sends the prep sheet.", tools: ["Calendar", "Gmail", "Contacts"], model: "Lite", runsToday: 4 },
  { id: "funder-scout", name: "Funder scout", fn: "external-relationships", kind: "yours", status: "idle", job: "Finds funders whose past bets look like yours and drafts a first note.", tools: ["Web research", "Contacts"], model: "Balanced", runsToday: 1 },
];
export const agentOf = (id: string): Agent => AGENTS.find((a) => a.id === id) ?? AGENTS[0]!;

export const MOBBIN = {
  openaiUsage: "https://mobbin.com/screens/fe36ec31-b25c-4cf1-9932-85bf66cd89fc",
  openaiChatEmpty: "https://mobbin.com/screens/fb7061f2-0231-442f-8a57-0da9529ce42b",
  openaiProjects: "https://mobbin.com/screens/f865333e-85c1-4cd8-8c48-5cca31cc4a3b",
  openaiAgentBuilder: "https://mobbin.com/screens/ff4a8f45-754c-466b-aa21-dc765ac4b8dc",
  openaiAgentNode: "https://mobbin.com/screens/f16aa8b2-da5a-46bc-b645-d015bc13d949",
  openaiAssistants: "https://mobbin.com/screens/ee011673-c362-405d-96f8-0e6105217383",
  openaiToolConfig: "https://mobbin.com/screens/e1040fc1-2e9d-4b1c-8a23-370364f25356",
  replitFiles: "https://mobbin.com/screens/e911e986-297a-46db-9f60-e7c60625e738",
  replitTools: "https://mobbin.com/screens/dca850da-23a2-47ea-a2aa-3e92393c5198",
  vercelSectionSidebar: "https://mobbin.com/screens/073b50ed-c14b-4f88-895c-3b77164b7ec5",
  vercelProjectSettings: "https://mobbin.com/screens/a54fee2e-b776-42c2-bd7c-93f7e223c87c",
  replitChat: "https://mobbin.com/screens/fc901296-5e3a-4d81-aec5-ed164e3fce20",
  replitModes: "https://mobbin.com/screens/e8b8267d-782c-4cdb-9da0-881faf6a7b6b",
  base44Testing: "https://mobbin.com/screens/9b6f8fa0-903a-4913-883f-a37c0fa86d5b",
  base44Dashboard: "https://mobbin.com/screens/e38170e7-f8b3-4496-8d86-a6860c2a9949",
  sparkAgent: "https://mobbin.com/screens/52b0d08b-e663-4e70-b753-ea5a636aa379",
  planeAi: "https://mobbin.com/screens/567b285a-8208-4b65-b8fb-fd37b2c11237",
} as const;

export type Screen = { id: string; title: string; path: string; job: string; refs: (keyof typeof MOBBIN)[] };
/** Paths with ":v" are inside one venture (/studio/v/<slug>/...). */
export const SCREENS: Screen[] = [
  { id: "S0", title: "Screen map", path: "/studio/map", job: "Every screen and component number in one list.", refs: [] },
  { id: "S1", title: "Studio home", path: "/studio", job: "Tell your chief of staff what to build; your businesses by phase; what needs you.", refs: ["openaiChatEmpty"] },
  { id: "S2", title: "New business", path: "/studio/new", job: "Start from an idea, a template, or an existing folder.", refs: ["openaiChatEmpty"] },
  { id: "S3", title: "Business library", path: "/studio/library", job: "Find a template for a business, an agent or an automation.", refs: ["base44Dashboard"] },
  { id: "S4", title: "Template", path: "/studio/library/[id]", job: "See what a template sets up, then use it.", refs: [] },
  { id: "S5", title: "Publish a template", path: "/studio/library/publish", job: "Share one of your businesses, agents or automations with the community.", refs: [] },
  { id: "S6", title: "Usage", path: "/studio/usage", job: "Spend and agent runs across every business against the budget.", refs: ["openaiUsage"] },
  { id: "S7", title: "Studio settings", path: "/studio/settings", job: "People, billing, connectors, keys and limits for the whole studio.", refs: ["openaiProjects"] },
  { id: "V1", title: "Overview", path: "/studio/v/:v", job: "Where the business is in its phase, what it needs now, and what waits for you.", refs: ["base44Dashboard"] },
  { id: "V2", title: "Records and documents", path: "/studio/v/:v/files", job: "Every record the business keeps, by folder, each readable as a document.", refs: ["replitFiles"] },
  { id: "V3", title: "Document", path: "/studio/v/:v/files/[...path]", job: "One record, read as a document or as its JSON, and edited.", refs: ["replitFiles"] },
  { id: "V4", title: "Strategy", path: "/studio/v/:v/strategy", job: "The strategy canvas and the four assumptions, graded by evidence.", refs: [] },
  { id: "V5", title: "Deck", path: "/studio/v/:v/decks/[id]", job: "Build a marketing or investor deck slide by slide with the agent.", refs: [] },
  { id: "V6", title: "Agents", path: "/studio/v/:v/agents", job: "Pick an agent and talk to it. Its model, skills and plugins sit beside the chat.", refs: ["openaiAssistants", "sparkAgent"] },
  { id: "V7", title: "Agent builder", path: "/studio/v/:v/agents/[id]", job: "Build or change an agent on a canvas of steps.", refs: ["openaiAgentBuilder", "openaiAgentNode"] },
  { id: "V8", title: "Automations", path: "/studio/v/:v/automations", job: "Each function's automations: trigger, steps, who approves.", refs: ["replitTools"] },
  { id: "V9", title: "Activity", path: "/studio/v/:v/activity", job: "Watch every agent run live, with logs, spend and what it changed.", refs: ["replitChat", "base44Testing"] },
  { id: "V10", title: "Run", path: "/studio/v/:v/activity/[id]", job: "One run step by step, with rollback.", refs: ["replitChat"] },
  { id: "V17", title: "Skills and plugins", path: "/studio/v/:v/skills", job: "What your agents know how to do and which outside tools they may use.", refs: ["openaiAssistants", "openaiToolConfig"] },
  { id: "V11", title: "Functions", path: "/studio/v/:v/functions", job: "The 13 functions of the business and the tools each one needs.", refs: ["replitTools"] },
  { id: "V12", title: "Function", path: "/studio/v/:v/functions/[fn]", job: "One function's tools, agent, automations and records.", refs: ["replitTools"] },
  { id: "V13", title: "Outreach", path: "/studio/v/:v/outreach", job: "People to reach, sequences, and every send held for your yes.", refs: [] },
  { id: "V14", title: "Connectors", path: "/studio/v/:v/connectors", job: "Connect the business's accounts and see what each agent may touch.", refs: ["planeAi"] },
  { id: "V15", title: "Decisions", path: "/studio/v/:v/decisions", job: "Calls only you can make, ranked, each with the agent's evidence.", refs: [] },
  { id: "V18", title: "Tool", path: "/studio/v/:v/functions/[fn]/[tool]", job: "One tool of a function, from Naive's tool catalog: what it does and the records it keeps.", refs: ["vercelSectionSidebar"] },
  { id: "V19", title: "Universal tool", path: "/studio/v/:v/tools/[tool]", job: "A tool every business gets that has no screen of its own yet.", refs: [] },
  { id: "V16", title: "Business settings", path: "/studio/v/:v/settings", job: "Team, budget, approvals and publishing for this business.", refs: ["openaiProjects"] },
];

export const COMPONENTS: { id: string; name: string; where: string }[] = [
  { id: "C1", name: "Top bar", where: "Every screen" },
  { id: "C2", name: "Switcher: Personal, Business Studio or a business", where: "Top of the sidebar" },
  { id: "C3", name: "Studio nav", where: "S screens, left" },
  { id: "C4", name: "Business nav: universal tools, then one row per function", where: "V screens, left" },
  { id: "C5", name: "Conversation", where: "V6: talking to one agent" },
  { id: "C6", name: "Prompt box", where: "S1, S2, C5" },
  { id: "C7", name: "Face with name", where: "Everywhere a person shows" },
  { id: "C8", name: "Commitment stepper", where: "S1, V1, V4" },
  { id: "C9", name: "Agent status dot", where: "V1, V6, V9" },
  { id: "C10", name: "Number tag", where: "Every screen and component" },
  { id: "C11", name: "Held-for-you card", where: "C5, V9, V13, V15" },
  { id: "C12", name: "Run row", where: "V1, V9" },
  { id: "C13", name: "Template card", where: "S1, S3" },
  { id: "C14", name: "Connector row", where: "V14, S7" },
  { id: "C15", name: "Spend meter", where: "S6, V16" },
  { id: "C16", name: "Phase bar", where: "V1: Discovery to Platform and the exit criteria for the next phase" },
  { id: "C17", name: "Agent list", where: "V6: the chief of staff, the four leads and the agents under them" },
  { id: "C18", name: "Record in an answer", where: "C5: a record shown as a document, its JSON one tap away" },
  { id: "C19", name: "Next phase in an answer", where: "C5" },
  { id: "C20", name: "Plan in an answer", where: "C5: who is doing what" },
  { id: "C21", name: "Choice in an answer", where: "C5: a call only you can make" },
  { id: "C22", name: "Runs in an answer", where: "C5" },
  { id: "C23", name: "Agent about panel", where: "V6: model, status, skills and plugins of the agent you are talking to" },
  { id: "C24", name: "Skill or plugin row", where: "V6, V17" },
  { id: "C25", name: "Function nav: back row, then the function's tools by process group", where: "V12, V18, left" },
];

export const ventureHref = (slug: string, rest = "") => `/studio/v/${slug}${rest ? `/${rest}` : ""}`;

export type Run = { id: string; agent: string; venture: string; title: string; status: "running" | "done" | "held" | "failed"; started: string; took: string; cost: number; changed: string[] };
export const RUNS: Run[] = [
  { id: "r-1042", agent: "marketing-agent", venture: "haptic-plays", title: "Draft the coach outreach email", status: "held", started: "4 min ago", took: "1m 12s", cost: 0.18, changed: ["marketing/outreach/coaches-v2.md"] },
  { id: "r-1041", agent: "interview-scheduler", venture: "haptic-plays", title: "Book calls with three coaches", status: "running", started: "6 min ago", took: "running", cost: 0.04, changed: [] },
  { id: "r-1040", agent: "strategy-agent", venture: "haptic-plays", title: "Grade the evidence for 'coaches hurt'", status: "done", started: "22 min ago", took: "3m 40s", cost: 0.61, changed: ["strategy/assumptions.json"] },
  { id: "r-1039", agent: "finance-agent", venture: "haptic-plays", title: "Reconcile November spend", status: "done", started: "1 h ago", took: "48s", cost: 0.03, changed: ["finance/spend/2026-11.json"] },
  { id: "r-1038", agent: "product-agent", venture: "haptic-plays", title: "Turn interview notes into product cards", status: "failed", started: "2 h ago", took: "2m 02s", cost: 0.22, changed: [] },
  { id: "r-1037", agent: "chief-of-staff", venture: "haptic-plays", title: "Plan the week", status: "done", started: "8 h ago", took: "1m 30s", cost: 0.12, changed: ["operations/week-47.md"] },
];

// C13 Template cards for the venture library (S1, S3, S4). Makers are PEOPLE ids when the maker is one of us,
// otherwise a plain name.
export type TemplateKind = "venture" | "agent" | "automation" | "deck";
export type TemplateSource = "official" | "community" | "yours";
export type TemplateCategory = "B2B SaaS" | "Consumer app" | "Services" | "Hardware" | "Nonprofit" | "Creator";
export type Template = {
  id: string; title: string; kind: TemplateKind; source: TemplateSource; category: TemplateCategory;
  maker: string; uses: number; oneLine: string; sets: string[]; commitment: Commitment; hue: number;
};
export const TEMPLATES: Template[] = [
  { id: "b2b-saas", title: "B2B SaaS from zero", kind: "venture", source: "official", category: "B2B SaaS", maker: "Mentura", uses: 2140, hue: 220,
    oneLine: "Find ten buyers, prove they hurt, and charge before you build much.", commitment: "explore", sets: ["Strategy canvas", "Interview kit", "5 agents", "Pricing page"] },
  { id: "haptic", title: "Hardware wearable", kind: "venture", source: "yours", category: "Hardware", maker: "torian", uses: 38, hue: 24,
    oneLine: "The Haptic Plays setup: a bench test plan, a pilot with one team, and a vendor list.", commitment: "prototype", sets: ["Pilot plan", "Vendor list", "4 agents", "Bill of materials"] },
  { id: "consumer-app", title: "Consumer app launch", kind: "venture", source: "official", category: "Consumer app", maker: "Mentura", uses: 1312, hue: 330,
    oneLine: "A waitlist, a landing page test and a weekly retention review.", commitment: "explore", sets: ["Landing page", "Waitlist", "3 agents", "Retention board"] },
  { id: "studio-services", title: "Design studio services", kind: "venture", source: "community", category: "Services", maker: "ana", uses: 412, hue: 300,
    oneLine: "Scope, quote and deliver client projects with a handoff for every phase.", commitment: "charge", sets: ["Quote builder", "Delivery board", "2 agents", "Client contract"] },
  { id: "nonprofit-grant", title: "Nonprofit with grants", kind: "venture", source: "community", category: "Nonprofit", maker: "maya", uses: 287, hue: 150,
    oneLine: "A theory of change, a funder list and a grant calendar that drafts each report.", commitment: "explore", sets: ["Theory of change", "Funder list", "Grant calendar", "3 agents"] },
  { id: "creator-newsletter", title: "Paid newsletter", kind: "venture", source: "community", category: "Creator", maker: "Priya Shah", uses: 905, hue: 45,
    oneLine: "Publish weekly, grow to a thousand readers, then turn on paid.", commitment: "explore", sets: ["Editorial calendar", "Growth agent", "Stripe connector"] },
  { id: "interview-scheduler", title: "Interview scheduler", kind: "agent", source: "yours", category: "B2B SaaS", maker: "torian", uses: 64, hue: 200,
    oneLine: "Finds people on a list, books 20 minute calls and sends the prep sheet.", commitment: "explore", sets: ["Agent", "Calendar", "Gmail", "Prep sheet"] },
  { id: "funder-scout", title: "Funder scout", kind: "agent", source: "community", category: "Nonprofit", maker: "dev", uses: 171, hue: 260,
    oneLine: "Finds funders whose past bets look like yours and drafts a first note for your yes.", commitment: "charge", sets: ["Agent", "Web research", "Contacts"] },
  { id: "weekly-spend", title: "Weekly spend check", kind: "automation", source: "official", category: "Services", maker: "Mentura", uses: 1820, hue: 100,
    oneLine: "Every Monday, reconcile spend against budget and flag anything over 85 percent.", commitment: "prototype", sets: ["Automation", "Bank feed", "Finance agent"] },
  { id: "outreach-held", title: "Outreach held for your yes", kind: "automation", source: "community", category: "B2B SaaS", maker: "Luis Moreno", uses: 640, hue: 10,
    oneLine: "Drafts each first touch from a list and holds every send until you approve it.", commitment: "charge", sets: ["Automation", "Gmail", "LinkedIn", "Marketing agent"] },
  { id: "seed-deck", title: "Seed investor deck", kind: "deck", source: "official", category: "B2B SaaS", maker: "Mentura", uses: 3050, hue: 280,
    oneLine: "Twelve slides that lead with the evidence for each assumption.", commitment: "raise", sets: ["12 slides", "Evidence pulls", "Speaker notes"] },
  { id: "pilot-one-pager", title: "Pilot one pager", kind: "deck", source: "community", category: "Hardware", maker: "Ken Ito", uses: 220, hue: 60,
    oneLine: "One page a coach or school can say yes to: what you test, for how long, and what it costs them.", commitment: "prototype", sets: ["1 page", "Pilot terms"] },
];
export const templateOf = (id: string): Template => TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0]!;
