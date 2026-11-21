// Mock data for V9 Activity, V10 Run and V13 Outreach. Reads RUNS and AGENTS from data.ts and adds what those screens need.
import { RUNS, type Run } from "./data";

/** More runs for the V9 feed, after the ones in data.ts. */
export const MORE_RUNS: Run[] = [
  { id: "r-1036", agent: "marketing-agent", venture: "haptic-plays", title: "Write the landing page hero for coaches", status: "held", started: "9 h ago", took: "2m 10s", cost: 0.27, changed: ["marketing/landing/hero.md"] },
  { id: "r-1035", agent: "interview-scheduler", venture: "haptic-plays", title: "Send prep sheets to Thursday's calls", status: "done", started: "10 h ago", took: "35s", cost: 0.02, changed: [] },
  { id: "r-1034", agent: "legal-agent", venture: "haptic-plays", title: "Read the pilot agreement from Westview High", status: "failed", started: "Yesterday", took: "4m 01s", cost: 0.48, changed: [] },
  { id: "r-1033", agent: "finance-agent", venture: "haptic-plays", title: "Warn when vest parts spend passes $300", status: "done", started: "Yesterday", took: "22s", cost: 0.01, changed: ["finance/alerts.json"] },
];
export const FEED_RUNS: Run[] = [...RUNS, ...MORE_RUNS];
export const runById = (id: string): Run => FEED_RUNS.find((r) => r.id === id) ?? RUNS.find((r) => r.id === "r-1042")!;

/** What each running agent is doing, step by step. The V9 live strip moves through these on a timer. */
export const LIVE_STEPS: Record<string, string[]> = {
  "chief-of-staff": ["Reading this week's decisions", "Routing the vest test to the product agent", "Checking who is free on Thursday", "Writing the Monday plan"],
  "marketing-agent": ["Reading coaches-v1.md", "Drafting the second outreach email", "Checking tone against the brand notes", "Holding the draft for Torian"],
  "finance-agent": ["Pulling the bank feed", "Matching three Stripe charges", "Comparing spend to the $120 budget", "Writing the spend note"],
  "interview-scheduler": ["Searching contacts for varsity coaches", "Sending a calendar hold to Coach Dalton", "Waiting for a reply from Coach Kim", "Attaching the prep sheet"],
};

export const SPEND_TODAY = 2.14;
export const SPEND_CAP = 8;

/** Lines the V9 log tail streams in, in order, then loops. */
export const LOG_POOL: { agent: string; level: "info" | "tool" | "warn" | "held"; text: string }[] = [
  { agent: "interview-scheduler", level: "tool", text: "calendar.find_free(attendees=[dalton], week=47) -> 3 slots" },
  { agent: "marketing-agent", level: "info", text: "read marketing/outreach/coaches-v1.md (412 words)" },
  { agent: "finance-agent", level: "tool", text: "bank.list_transactions(since=2026-11-20) -> 6 rows" },
  { agent: "chief-of-staff", level: "info", text: "routed 'vest test plan' to product-agent" },
  { agent: "marketing-agent", level: "held", text: "draft coaches-v2.md held for Torian (outreach send)" },
  { agent: "finance-agent", level: "warn", text: "spend at 34% of month budget on day 21" },
  { agent: "interview-scheduler", level: "tool", text: "gmail.send_draft(to=coach.kim) held: sends need a yes" },
  { agent: "chief-of-staff", level: "info", text: "decision 'pick the pilot school' still open, 2 days" },
  { agent: "marketing-agent", level: "tool", text: "linkedin.lookup(name='Ray Dalton') -> 1 match" },
  { agent: "finance-agent", level: "info", text: "matched Stripe charge ch_3Q9 to 'vest parts'" },
];

/** V10 steps for one run. */
export type Step =
  | { kind: "thought"; text: string; at: string }
  | { kind: "tool"; name: string; input: string; output: string; at: string }
  | { kind: "read"; path: string; at: string }
  | { kind: "edit"; path: string; minus: string[]; plus: string[]; at: string }
  | { kind: "wait"; text: string; at: string };

export type RunDetail = { trigger: string; tokens: number; steps: Step[]; checkpoints: { id: string; label: string; at: string }[] };

const DETAILS: Record<string, RunDetail> = {
  "r-1042": {
    trigger: "Automation 'Follow up after a coach call' fired when Coach Dalton's call notes landed in interviews/dalton.md.",
    tokens: 18420,
    steps: [
      { kind: "thought", at: "0:00", text: "Coach Dalton said play calls get lost in crowd noise. The first email talked about the vest; this one should lead with the noise problem he named." },
      { kind: "read", at: "0:04", path: "interviews/dalton.md" },
      { kind: "read", at: "0:06", path: "marketing/outreach/coaches-v1.md" },
      { kind: "tool", at: "0:11", name: "contacts.search", input: '{ "segment": "coaches", "stage": "replied" }', output: '[ { "name": "Ray Dalton", "org": "Westview High" }, { "name": "Grace Kim", "org": "Lakeside Prep" } ]' },
      { kind: "edit", at: "0:48", path: "marketing/outreach/coaches-v2.md", minus: ["Subject: A wearable for your playbook", "We built a vest that buzzes when you call a play."], plus: ["Subject: When the crowd drowns out your call", "You told us play calls get lost in the noise. Players feel ours on a vest instead."] },
      { kind: "wait", at: "1:12", text: "Outreach sends are held for Torian's yes. The draft is ready to review." },
    ],
    checkpoints: [
      { id: "cp-1", label: "Before reading the call notes", at: "0:00" },
      { id: "cp-2", label: "After finding the two coaches", at: "0:11" },
      { id: "cp-3", label: "After drafting coaches-v2.md", at: "0:48" },
    ],
  },
};

/** The detail for a run, built from the run itself when no hand-written detail exists. */
export function detailOf(run: Run): RunDetail {
  const d = DETAILS[run.id];
  if (d) return d;
  const file = run.changed[0];
  const steps: Step[] = [
    { kind: "thought", at: "0:00", text: `Starting on "${run.title}". First I read what the venture already has on this.` },
    { kind: "read", at: "0:03", path: "venture.json" },
    { kind: "tool", at: "0:09", name: "records.search", input: `{ "query": "${run.title}" }`, output: run.status === "failed" ? '{ "error": "Linear connector not signed in" }' : '{ "matches": 4 }' },
  ];
  if (file) steps.push({ kind: "edit", at: "0:30", path: file, minus: ["status: draft"], plus: ["status: updated by agent"] });
  if (run.status === "failed") steps.push({ kind: "thought", at: "0:35", text: "I cannot reach Linear. I stopped here so nothing is half written. Reconnect it in Connectors and rerun." });
  if (run.status === "held") steps.push({ kind: "wait", at: "0:40", text: "This change is held for your yes." });
  if (run.status === "running") steps.push({ kind: "thought", at: "0:41", text: "Still working. Waiting on a reply before the next step." });
  return {
    trigger: run.agent === "chief-of-staff" ? "Scheduled every Monday at 7:00." : "Asked for in the agent chat by Torian.",
    tokens: Math.round(run.cost * 30000),
    steps,
    checkpoints: [{ id: "cp-1", label: "Before the run started", at: "0:00" }, ...(file ? [{ id: "cp-2", label: `After editing ${file.split("/").pop()}`, at: "0:30" }] : [])],
  };
}

/** V13 Outreach. */
export type Stage = "to reach" | "contacted" | "replied" | "meeting" | "not now";
export const STAGES: Stage[] = ["to reach", "contacted", "replied", "meeting", "not now"];
export type Segment = "coaches" | "athletic directors" | "funders";
export type Contact = { id: string; name: string; org: string; role: string; segment: Segment; stage: Stage; last: string };

export const CONTACTS: Contact[] = [
  { id: "c1", name: "Ray Dalton", org: "Westview High", role: "Head football coach", segment: "coaches", stage: "meeting", last: "Call Thursday 3:30" },
  { id: "c2", name: "Grace Kim", org: "Lakeside Prep", role: "Varsity soccer coach", segment: "coaches", stage: "replied", last: "Replied 2 h ago" },
  { id: "c3", name: "Marcus Hale", org: "Eastfield High", role: "Basketball coach", segment: "coaches", stage: "contacted", last: "Emailed Monday" },
  { id: "c4", name: "Lena Brooks", org: "North Ridge Academy", role: "Football offensive coordinator", segment: "coaches", stage: "to reach", last: "Not yet" },
  { id: "c5", name: "Sam Whitaker", org: "Cedar Valley District", role: "Athletic director", segment: "athletic directors", stage: "contacted", last: "LinkedIn note Tuesday" },
  { id: "c6", name: "Priya Nair", org: "Westview High", role: "Athletic director", segment: "athletic directors", stage: "replied", last: "Replied yesterday" },
  { id: "c7", name: "Owen Castillo", org: "Harbor Unified", role: "Athletics coordinator", segment: "athletic directors", stage: "not now", last: "Budget closed until spring" },
  { id: "c8", name: "Ruth Ellison", org: "Sideline Ventures", role: "Partner", segment: "funders", stage: "to reach", last: "Not yet" },
  { id: "c9", name: "Jonah Weiss", org: "Field Fund", role: "Principal", segment: "funders", stage: "contacted", last: "Intro sent by Maya" },
];

export type SeqStep = { day: number; channel: "Email" | "LinkedIn"; label: string };
export const SEQUENCE = {
  name: "Coach intro",
  by: "Marketing agent",
  enrolled: 14,
  openRate: 62,
  replyRate: 21,
  steps: [
    { day: 0, channel: "Email", label: "Intro: the crowd noise problem, and a 20 minute call" },
    { day: 3, channel: "Email", label: "Follow up with a 30 second video of the vest" },
    { day: 5, channel: "LinkedIn", label: "Short note that names their school's next game" },
  ] as SeqStep[],
};

export const HELD_SENDS: { id: string; to: string; org: string; subject: string; step: string }[] = [
  { id: "s1", to: "Marcus Hale", org: "Eastfield High", subject: "When the crowd drowns out your call", step: "Day 3 follow up" },
  { id: "s2", to: "Lena Brooks", org: "North Ridge Academy", subject: "A play call your players can feel", step: "Day 0 intro" },
  { id: "s3", to: "Sam Whitaker", org: "Cedar Valley District", subject: "Ten vests for one district pilot", step: "Day 5 LinkedIn note" },
];

export const INBOX: { id: string; from: string; org: string; when: string; text: string; suggested: string }[] = [
  { id: "i1", from: "Grace Kim", org: "Lakeside Prep", when: "2 h ago", text: "Interesting. Our field is loud on Fridays. Does it work for soccer or only football?",
    suggested: "Thanks, Grace. It works for any sport where you call plays from the sideline. Could we show you on a 20 minute call this week? Thursday or Friday afternoon both work." },
  { id: "i2", from: "Priya Nair", org: "Westview High", when: "Yesterday", text: "Coach Dalton mentioned this. Who pays for the vests in a pilot?",
    suggested: "Good question, Priya. For the pilot we lend ten vests at no cost for six weeks. If the team keeps them, the district pays after the season. Want the one page pilot terms?" },
];
