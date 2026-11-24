// Mock files for the Venture Studio file screens (V2 Files, V3 Document, V5 Deck). Nothing is read from a store yet.
// Paths follow Naive's folders: strategy/, products/, marketing/ (decks/, outreach/), finance/, operations/,
// evidence/, decisions/, raw/.
import { AGENTS } from "./data";

export type FileKind = "doc" | "deck" | "sheet" | "record" | "image";
export type Version = { id: string; at: string; by: string; note: string; body?: string };
export type VFile = {
  path: string; kind: FileKind; updated: string; mins: number; by: string; editors: string[];
  body?: string; deckId?: string; size: string; history?: Version[];
};

export const FOLDERS = ["strategy", "products", "marketing", "marketing/decks", "marketing/outreach", "finance", "operations", "evidence", "decisions", "raw"] as const;

export const isAgentId = (id: string) => AGENTS.some((a) => a.id === id);
export const fileName = (path: string) => path.split("/").pop() ?? path;
export const folderOf = (path: string) => path.split("/").slice(0, -1).join("/");
export const titleOf = (f: VFile) => {
  const h = f.body?.match(/^# (.+)$/m)?.[1];
  return h ?? fileName(f.path).replace(/\.[a-z]+$/, "").replace(/-/g, " ").replace(/^./, (c) => c.toUpperCase());
};

const ONE_PAGER = `# Haptic Plays one-pager

Coaches call a play, players feel it on a wearable. No shouting across a loud field, no hand signals the other bench can read.

## Who it is for

- High school football coaches with 30 to 60 players
- Offensive coordinators who call plays from the sideline
- Players who miss calls in loud stadiums

## Why now

Cheap vibration motors and Bluetooth Low Energy make a vest under $40 possible. State associations started allowing coach to player radios in 2025.

## What we will test first

One team wears the vest for two weeks of practice. We count missed calls before and after.`;

const COACH_1 = `# Interview: Coach R., Lincoln High

Date: 14 November. Length: 22 minutes. Booked by the Interview scheduler.

## What we heard

- Loses two or three plays a game to players who did not hear the call
- Uses wristband cards today, players forget to look
- Would try a vest if it costs less than new helmets

## Quotes

"On Friday nights I can't hear myself think, so they sure can't hear me."

## Follow up

- Send the two week pilot plan
- Ask the athletic director about the budget line`;

const COACH_2 = `# Interview: Coach T., Riverside Prep

Date: 17 November. Length: 18 minutes.

## What we heard

- Signals get stolen by the other sideline about once a season
- Players like gadgets, parents worry about cost
- Would want the vest to survive rain and sweat

## Follow up

- Share the waterproof test results`;

const LANDING = `# Landing page copy

## Headline

Call the play. They feel it.

## Subhead

A vest that buzzes the play into every player at once. No shouting, no stolen signals.

## Three points

- Every player gets the call in under a second
- Works in the loudest stadium
- Set up from your phone in five minutes

## Call to action

Join the two week pilot`;

const OUTREACH = `# Coach outreach email, version 2

Subject: Two weeks, one vest, fewer missed calls

Coach,

We are testing a vest that buzzes the play call into every player at once. We would like one team to wear it for two weeks of practice and tell us what breaks.

It costs you nothing. We bring the vests and count missed calls before and after.

Would a 20 minute call next week work?

Torian`;

const WEEK = `# Week 47 plan

Planned by the Chief of staff.

## This week

- Book three coach calls
- Finish the waterproof test on vest v0.3
- Decide whether to price the pilot

## Waiting on you

- Approve the coach outreach email
- Pick the pilot team`;

const RISKS = `# Risk notes

- Players under 18: we need parent consent forms before any pilot
- State association rules differ by state, check Texas and Ohio first
- Battery heat inside padding`;

const PL_ONE = `# Pattern Language one-pager

A pattern language for buildings, searchable and buildable. Architects find the pattern that fits a site and see how others built it.

## Who it is for

- Small architecture studios
- Students learning to design from patterns

## What we do not know yet

- How architects pick patterns today
- Whether they would pay for search`;

const PL_NOTES = `# Interview: Architect J., small studio

## What we heard

- Uses the 1977 book and a folder of photos
- Wants examples from real buildings near the site`;

const FR_ONE = `# Founder Raise one-pager

Fund a founder's time, not one idea. Funders back a person for two years and share in every venture they start.

## The ask

$400k from three to five funders.

## Why now

Solo founders build more ventures with agents, and each one needs less money.`;

const FR_LIST = `# Funder short list

- Northbeam Capital: backed two solo founders in 2025
- Lowline Fund: writes $100k first checks
- Harbor Angels: asked for the deck in October`;

const H = (path: string, body: string, by: string, mins: number, updated: string, editors: string[], extra?: Partial<VFile>): VFile =>
  ({ path, kind: "doc", body, by, mins, updated, editors, size: `${Math.max(1, Math.round(body.length / 500))} KB`, ...extra });

const HAPTIC: VFile[] = [
  H("strategy/one-pager.md", ONE_PAGER, "strategy-agent", 22, "22 min ago", ["torian", "strategy-agent", "maya"], {
    history: [
      { id: "v4", at: "22 min ago", by: "strategy-agent", note: "Added the state association change to Why now" },
      { id: "v3", at: "Yesterday", by: "torian", note: "Rewrote who it is for", body: ONE_PAGER.replace("State associations started allowing coach to player radios in 2025.", "") },
      { id: "v2", at: "3 days ago", by: "maya", note: "Tightened the opening", body: ONE_PAGER.replace(/## Why now[\s\S]*?(?=## What)/, "") },
      { id: "v1", at: "Last week", by: "torian", note: "First draft", body: "# Haptic Plays one-pager\n\nA vest that buzzes plays to players." },
    ],
  }),
  { path: "strategy/assumptions.json", kind: "record", by: "strategy-agent", mins: 22, updated: "22 min ago", editors: ["strategy-agent"], size: "3 KB" },
  { path: "strategy/competitors.json", kind: "record", by: "strategy-agent", mins: 60 * 26, updated: "Yesterday", editors: ["strategy-agent", "torian"], size: "2 KB" },
  H("products/interview-notes/coach-1.md", COACH_1, "torian", 60 * 3, "3 h ago", ["torian", "product-agent"]),
  H("products/interview-notes/coach-2.md", COACH_2, "product-agent", 60 * 5, "5 h ago", ["product-agent"]),
  { path: "products/vest-v0.3.png", kind: "image", by: "dev", mins: 60 * 30, updated: "Yesterday", editors: ["dev"], size: "1.2 MB" },
  { path: "products/roadmap.sheet", kind: "sheet", by: "product-agent", mins: 60 * 50, updated: "2 days ago", editors: ["product-agent", "dev"], size: "8 KB" },
  H("marketing/landing-copy.md", LANDING, "marketing-agent", 4, "4 min ago", ["marketing-agent", "torian"]),
  { path: "marketing/decks/investor.deck", kind: "deck", deckId: "investor", by: "marketing-agent", mins: 35, updated: "35 min ago", editors: ["marketing-agent", "torian", "maya"], size: "6 slides" },
  { path: "marketing/decks/coach-pitch.deck", kind: "deck", deckId: "coach-pitch", by: "torian", mins: 60 * 8, updated: "8 h ago", editors: ["torian", "marketing-agent"], size: "4 slides" },
  H("marketing/outreach/coaches-v2.md", OUTREACH, "marketing-agent", 4, "4 min ago", ["marketing-agent"]),
  { path: "finance/budget.sheet", kind: "sheet", by: "finance-agent", mins: 60, updated: "1 h ago", editors: ["finance-agent", "torian"], size: "12 KB" },
  { path: "finance/spend/2026-11.json", kind: "record", by: "finance-agent", mins: 60, updated: "1 h ago", editors: ["finance-agent"], size: "4 KB" },
  H("operations/week-47.md", WEEK, "chief-of-staff", 60 * 8, "8 h ago", ["chief-of-staff"]),
  { path: "evidence/missed-calls-baseline.sheet", kind: "sheet", by: "dev", mins: 60 * 70, updated: "3 days ago", editors: ["dev"], size: "5 KB" },
  { path: "decisions/price-the-pilot.json", kind: "record", by: "chief-of-staff", mins: 60 * 9, updated: "9 h ago", editors: ["chief-of-staff", "torian"], size: "1 KB" },
  H("raw/risk-notes.md", RISKS, "torian", 60 * 100, "4 days ago", ["torian"]),
  { path: "raw/sideline-photo.jpg", kind: "image", by: "torian", mins: 60 * 120, updated: "5 days ago", editors: ["torian"], size: "3.4 MB" },
];

const PATTERN: VFile[] = [
  H("strategy/one-pager.md", PL_ONE, "torian", 60 * 2, "2 h ago", ["torian", "ana"]),
  { path: "strategy/assumptions.json", kind: "record", by: "strategy-agent", mins: 60 * 4, updated: "4 h ago", editors: ["strategy-agent"], size: "2 KB" },
  H("products/interview-notes/architect-1.md", PL_NOTES, "ana", 60 * 24, "Yesterday", ["ana"]),
  { path: "marketing/decks/investor.deck", kind: "deck", deckId: "investor", by: "ana", mins: 60 * 50, updated: "2 days ago", editors: ["ana"], size: "5 slides" },
  { path: "raw/pattern-sketches.png", kind: "image", by: "ana", mins: 60 * 70, updated: "3 days ago", editors: ["ana"], size: "2.1 MB" },
];

const RAISE: VFile[] = [
  H("strategy/one-pager.md", FR_ONE, "maya", 60 * 20, "Yesterday", ["torian", "maya"]),
  H("marketing/outreach/funder-short-list.md", FR_LIST, "funder-scout", 60 * 6, "6 h ago", ["funder-scout", "torian"]),
  { path: "marketing/decks/investor.deck", kind: "deck", deckId: "investor", by: "marketing-agent", mins: 60 * 7, updated: "7 h ago", editors: ["marketing-agent", "maya"], size: "6 slides" },
  { path: "finance/runway.sheet", kind: "sheet", by: "finance-agent", mins: 60 * 3, updated: "3 h ago", editors: ["finance-agent"], size: "6 KB" },
  { path: "decisions/who-gets-the-deck.json", kind: "record", by: "chief-of-staff", mins: 60 * 10, updated: "10 h ago", editors: ["chief-of-staff"], size: "1 KB" },
];

export const filesFor = (slug: string): VFile[] => (slug === "pattern-language" ? PATTERN : slug === "founder-raise" ? RAISE : HAPTIC);
export const fileAt = (slug: string, path: string) => filesFor(slug).find((f) => f.path === path);

/** A held agent change on a document: the line it removes and the line it adds. */
export const SUGGESTIONS: Record<string, { by: string; why: string; remove: string; add: string }> = {
  "strategy/one-pager.md": { by: "strategy-agent", why: "Coach R. and Coach T. both named this. It is the strongest evidence we have.", remove: "Coaches call a play, players feel it on a wearable. No shouting across a loud field, no hand signals the other bench can read.", add: "Coaches call a play, players feel it on a wearable. Two of two coaches we interviewed lose plays to noise every game." },
  "marketing/landing-copy.md": { by: "marketing-agent", why: "Coaches in interviews talk about missed calls, not speed.", remove: "- Every player gets the call in under a second", add: "- No more missed calls on loud Friday nights" },
  "products/interview-notes/coach-1.md": { by: "product-agent", why: "Adds the card this note supports.", remove: "- Ask the athletic director about the budget line", add: "- Ask the athletic director about the budget line (product card: pilot pricing)" },
};

export const COMMENTS: Record<string, { by: string; at: string; text: string }[]> = {
  "strategy/one-pager.md": [
    { by: "maya", at: "Yesterday", text: "Funders will ask how many coaches you talked to. Put the number up top." },
    { by: "torian", at: "Yesterday", text: "Agreed. Waiting on the third interview." },
  ],
  "marketing/landing-copy.md": [{ by: "ana", at: "2 h ago", text: "The headline works. Can we test a version with a photo of the vest?" }],
};

export type Slide = { id: string; layout: "title" | "points" | "big-number" | "quote"; title: string; body: string[]; notes: string };
export type Deck = { id: string; name: string; audience: string; slides: Slide[] };

const s = (id: string, layout: Slide["layout"], title: string, body: string[], notes: string): Slide => ({ id, layout, title, body, notes });

const HAPTIC_DECKS: Deck[] = [
  { id: "investor", name: "Investor deck", audience: "Seed funders", slides: [
    s("i1", "title", "Haptic Plays", ["Coaches call a play, players feel it."], "Open with the Friday night noise story from Coach R."),
    s("i2", "points", "The problem", ["Coaches lose two or three plays a game to noise", "Hand signals get stolen", "Wristband cards go unread"], "Both coaches we interviewed named noise first. Say the number."),
    s("i3", "points", "The solution", ["A vest under $40 that buzzes the play", "Set up from a phone in five minutes", "Works in the loudest stadium"], "Pass the vest around if you have it."),
    s("i4", "big-number", "Traction", ["3 coaches booked", "1 pilot team lined up for December"], "Be honest: this is early. The pilot is the proof."),
    s("i5", "points", "Market", ["15,000 US high school football programs", "Same need in lacrosse and rugby"], "Bottom up: programs times vests times price."),
    s("i6", "big-number", "The ask", ["$250k pre-seed", "Pilot in five schools by spring"], "Close with what the money buys, not the valuation."),
  ] },
  { id: "coach-pitch", name: "Coach pitch", audience: "High school coaches", slides: [
    s("c1", "title", "Fewer missed calls", ["Two weeks, one vest, no cost to you."], "Keep it to five minutes."),
    s("c2", "quote", "Sound familiar?", ["\"On Friday nights I can't hear myself think.\" Coach R., Lincoln High"], "Ask them how many plays they lost last game."),
    s("c3", "points", "How the pilot works", ["We bring 20 vests", "You run practice as usual", "We count missed calls before and after"], "Parent consent forms are ready."),
    s("c4", "points", "What you get", ["Keep the vests for the season", "First say on what we build next"], "Ask for the call to pick dates."),
  ] },
];

const otherDeck = (name: string, problem: string[], solution: string[], traction: string[], ask: string[]): Deck => ({
  id: "investor", name: "Investor deck", audience: "Seed funders", slides: [
    s("o1", "title", name, [solution[0] ?? ""], "Open with who it is for."),
    s("o2", "points", "The problem", problem, "Use an interview quote here."),
    s("o3", "points", "The solution", solution, "Show, do not tell."),
    s("o4", "big-number", "Traction", traction, "Say what is proven and what is not."),
    s("o5", "big-number", "The ask", ask, "Close with what the money buys."),
  ],
});

export const deckFor = (slug: string, id: string): Deck => {
  if (slug === "pattern-language") return otherDeck("Pattern Language", ["Architects pick patterns from a 1977 book", "No way to see how others built a pattern"], ["Search patterns by site and climate", "See real buildings that used each one"], ["5 architect interviews planned", "0 paying users yet"], ["$80k to build search", "Ten studios testing by summer"]);
  if (slug === "founder-raise") return otherDeck("Founder Raise", ["Funders back ideas, founders have many", "Solo founders run out of time, not ideas"], ["Fund a founder's time for two years", "Share in every business they start"], ["3 funders on the short list", "1 asked for the deck"], ["$400k from three to five funders", "Two years of runway"]);
  return HAPTIC_DECKS.find((d) => d.id === id) ?? HAPTIC_DECKS[0]!;
};

/** Splits simple markdown into blocks the screens render: headings, paragraphs and list items. */
export type MdBlock = { t: "h1" | "h2" | "h3" | "p" | "li"; text: string };
export const mdBlocks = (body: string): MdBlock[] =>
  body.split("\n").map((l) => l.trimEnd()).filter((l) => l.trim() !== "").map((l): MdBlock => {
    if (l.startsWith("### ")) return { t: "h3", text: l.slice(4) };
    if (l.startsWith("## ")) return { t: "h2", text: l.slice(3) };
    if (l.startsWith("# ")) return { t: "h1", text: l.slice(2) };
    if (/^\s*[-*] /.test(l)) return { t: "li", text: l.replace(/^\s*[-*] /, "") };
    return { t: "p", text: l };
  });

/** Mock contents for files that are not documents, so every file opens to something. */
export const recordBody = (f: VFile) =>
  JSON.stringify({ type: f.path.split("/")[0], path: f.path, updated: f.updated, written_by: f.by, status: "current" }, null, 2);
export const SHEET_ROWS: string[][] = [["Item", "Planned", "Spent"], ["Vest parts", "$60", "$41"], ["Agent runs", "$40", "$18"], ["Pilot travel", "$20", "$0"]];

/** Where a file opens: decks open V5, everything else opens V3. */
export const hrefOfFile = (slug: string, f: VFile) =>
  f.kind === "deck" ? `/studio/v/${slug}/decks/${f.deckId ?? "investor"}` : `/studio/v/${slug}/files/${f.path}`;
