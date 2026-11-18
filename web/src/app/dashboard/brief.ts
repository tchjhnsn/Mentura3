// The dashboard's morning brief and its suggestions, as pure functions (Torian, 2026-11-18, dashboard items 6 and 8).
// Code gathers the facts from the person's own records, each with the page it came from; a model only phrases them
// and must cite each fact it uses by id. A sentence that cites nothing, or an id that is not in the list, is dropped,
// so nothing reaches the page that the records do not say. Journal text is never a fact.

/** What the server reads for the brief, already from the person's stores. */
export type BriefInput = {
  /** Today's calendar, in order; `starts` is HH:MM or null for all day. */
  calendar: { title: string; when: string; starts: string | null; href: string }[];
  /** The time now, HH:MM, to find what is next. */
  clock: string;
  requests: { name: string }[];
  /** Friends whose last message is theirs, newest first. */
  waiting: { name: string; href: string }[];
  /** Null when the budget could not be read. */
  money: { set: boolean; leftToAllot: number } | null;
  /** The next event the person said Going to, when it is within the week. */
  going: { title: string; when: string; href: string } | null;
  /** How many events are on in town this week. */
  eventsThisWeek: number;
  reading: { title: string; href: string }[];
  building: { name: string; href: string }[];
};

export type FactKind = "calendar" | "free" | "requests" | "waiting" | "money" | "budget-unset" | "going" | "events" | "reading" | "building";

/** One thing the records say, in a plain clause, with the page it came from and the word its link shows. */
export type Fact = { id: string; kind: FactKind; text: string; href: string; label: string; /** A count or a name the suggestions use. */ n?: number; name?: string };

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
const usd = (n: number) => `${n < 0 ? "-" : ""}$${Math.abs(Math.round(n)).toLocaleString("en-US")}`;
const list = (names: string[]) => (names.length <= 2 ? names.join(" and ") : `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`);

/** The facts for the brief, in the order a day is read: calendar, people, money, events, learning and building. */
export function briefFacts(i: BriefInput): Fact[] {
  const out: Omit<Fact, "id">[] = [];
  const [first] = i.calendar, [req] = i.requests, [w1] = i.waiting, [book] = i.reading, [venture] = i.building;
  if (first) {
    const next = i.calendar.find((e) => e.starts && e.starts >= i.clock) ?? null;
    const count = plural(i.calendar.length, "thing");
    out.push({ kind: "calendar", n: i.calendar.length, href: next?.href ?? first.href, label: "Calendar",
      text: next ? `${count} on the calendar today; next is ${next.title} at ${next.when}` : `${count} on the calendar today, none still to start`, name: next?.title });
  } else {
    out.push({ kind: "free", n: 0, href: "/calendar", label: "Calendar", text: "Nothing on the calendar today" });
  }
  if (req) out.push({ kind: "requests", n: i.requests.length, name: req.name, href: "/life/friends", label: "Requests",
    text: i.requests.length === 1 ? `${req.name} wants to connect` : `${plural(i.requests.length, "person", "people")} want to connect` });
  if (w1) {
    const names = i.waiting.slice(0, 3).map((w) => w.name);
    const more = i.waiting.length - names.length;
    out.push({ kind: "waiting", n: i.waiting.length, name: w1.name, href: i.waiting.length === 1 ? w1.href : "/life/friends", label: i.waiting.length === 1 ? w1.name : "Messages",
      text: `${list(more > 0 ? [...names, plural(more, "other")] : names)} ${i.waiting.length === 1 ? "is" : "are"} waiting on a reply` });
  }
  if (i.money) out.push(i.money.set
    ? { kind: "money", n: i.money.leftToAllot, href: "/plan", label: "Budget", text: i.money.leftToAllot < 0 ? `The budget is over take-home by ${usd(-i.money.leftToAllot)} a month` : `${usd(i.money.leftToAllot)} a month is left to allot in the budget` }
    : { kind: "budget-unset", href: "/plan", label: "Budget", text: "No budget is set yet" });
  if (i.going) out.push({ kind: "going", name: i.going.title, href: i.going.href, label: "Event", text: `Going to ${i.going.title}, ${i.going.when}` });
  else if (i.eventsThisWeek) out.push({ kind: "events", n: i.eventsThisWeek, href: "/events", label: "Events", text: `${plural(i.eventsThisWeek, "event")} on in Austin this week` });
  if (book) out.push({ kind: "reading", n: i.reading.length, name: book.title, href: i.reading.length === 1 ? book.href : "/schole/reading", label: i.reading.length === 1 ? "Book" : "Reading",
    text: i.reading.length === 1 ? `Reading ${book.title}` : `Reading ${list(i.reading.slice(0, 2).map((r) => r.title))}${i.reading.length > 2 ? ` and ${plural(i.reading.length - 2, "more book")}` : ""}` });
  if (venture) out.push({ kind: "building", n: i.building.length, name: venture.name, href: i.building.length === 1 ? venture.href : "/life/ventures", label: i.building.length === 1 ? venture.name : "Ventures",
    text: `Building ${list(i.building.slice(0, 2).map((b) => b.name))}${i.building.length > 2 ? ` and ${plural(i.building.length - 2, "other venture")}` : ""}` });
  return out.map((f, n) => ({ ...f, id: `f${n + 1}` }));
}

/** A sentence of the brief and the facts it cites, in order. */
export type BriefSentence = { text: string; cites: string[] };
/** A sentence ready to render: its text and a link for each fact it cites. */
export type BriefLine = { text: string; links: { label: string; href: string }[] };

/** The prompt that asks a model to phrase the facts. It holds the facts only, never journal text or messages. */
export function briefPrompt(facts: readonly Fact[], greeting: string): string {
  return [
    `You write the short brief under "${greeting}" on a person's dashboard in Reflect, a self-reflection app.`,
    "Write 2 to 4 short, plain sentences on where their day stands, using ONLY the facts below. Address them as \"you\".",
    "End every sentence with the ids of the facts it uses, in square brackets, like [f1] or [f2][f4]. Every sentence must cite at least one fact.",
    "Keep each sentence under 18 words and use each fact once. Shorten a long title to its first few words.",
    "Do not add advice, guesses, praise, numbers, names or events that are not in the facts. No emojis, no lists, no headings.",
    "Put each sentence on its own line.",
    "",
    "Facts:",
    ...facts.map((f) => `[${f.id}] ${f.text}.`),
  ].join("\n");
}

/** Reads a model's brief: one sentence a line, each with its cited ids. Fails closed: a sentence citing nothing or an unknown id is dropped. */
export function readBrief(text: string | null | undefined, facts: readonly Fact[]): BriefSentence[] {
  const known = new Set(facts.map((f) => f.id));
  const lines = (text ?? "").replace(/^```\w*\s*|\s*```$/g, "").split(/\n+|(?<=\][.!?]?)\s+(?=[A-Z])/);
  const out: BriefSentence[] = [];
  for (const raw of lines) {
    const line = raw.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "").trim();
    if (!line) continue;
    const cites = [...new Set([...line.matchAll(/\[\s*(f\d+)\s*\]/gi)].map((m) => (m[1] ?? "").toLowerCase()))];
    if (!cites.length || cites.some((c) => !known.has(c))) continue;
    const words = line.replace(/\[[^\]]*\]/g, "").replace(/\s+([.,;!?])/g, "$1").replace(/\s+/g, " ").trim();
    if (words.length < 8 || words.length > 240) continue;
    out.push({ text: /[.!?]$/.test(words) ? words : `${words}.`, cites });
    if (out.length === 4) break;
  }
  return out;
}

/** The brief without a model: the first four facts, a sentence each. */
export function plainBrief(facts: readonly Fact[]): BriefSentence[] {
  return facts.slice(0, 4).map((f) => ({ text: `${f.text}.`, cites: [f.id] }));
}

/** A brief's sentences with their links, from the facts they cite. A link is shown once, on its first sentence. */
export function briefLines(sentences: readonly BriefSentence[], facts: readonly Fact[]): BriefLine[] {
  const byId = new Map(facts.map((f) => [f.id, f]));
  const shown = new Set<string>();
  return sentences.flatMap((s) => {
    const cited = s.cites.map((c) => byId.get(c));
    if (cited.some((f) => !f)) return [];
    const links = cited.flatMap((f) => {
      const key = `${f!.label}|${f!.href}`;
      if (shown.has(key)) return [];
      shown.add(key);
      return [{ label: f!.label, href: f!.href }];
    });
    return [{ text: s.text, links }];
  });
}

/** The four suggestions the ask bar shows when nothing better is known. */
export const DEFAULT_SUGGESTIONS = ["What's on my day?", "How is my budget this month?", "Find an event this week", "What should I learn next?"] as const;

/** A title short enough for a chip: up to its first colon or dash, at most 32 characters, with no emoji. */
export function chipTitle(t: string): string {
  const head = t.replace(/\p{Extended_Pictographic}/gu, "").split(/\s*[:|]\s|\s[-–—]\s/)[0]!.trim();
  return head.length <= 32 ? head : `${head.slice(0, 31).replace(/\s+\S*$/, "")}…`;
}

/** Four suggestions for the ask bar from the facts, most pressing first, filled from the defaults. */
export function suggestionsFrom(facts: readonly Fact[]): string[] {
  const out: string[] = [];
  const add = (s: string | null | undefined) => { if (s && !out.includes(s) && out.length < 4) out.push(s); };
  const f = (k: FactKind) => facts.find((x) => x.kind === k);
  const cal = f("calendar"), waiting = f("waiting"), requests = f("requests"), unset = f("budget-unset"), money = f("money"), going = f("going"), events = f("events"), reading = f("reading"), building = f("building");
  if (cal?.n) add(cal.n === 1 ? "Plan my one thing today" : `Plan my ${cal.n} things today`);
  if (waiting?.name) add(waiting.n === 1 ? `Answer ${waiting.name}'s message` : `Answer ${waiting.name} and the others`);
  if (requests?.name) add(requests.n === 1 ? `Who is ${requests.name}?` : "Who wants to connect?");
  if (unset) add("Set my budget");
  else if (money && (money.n ?? 0) < 0) add("Where is my budget over?");
  if (going?.name) add(`Plan for ${chipTitle(going.name)}`);
  else if (events?.n) add("Find a coworking event this week");
  if (reading?.name) add(`What should I take from ${chipTitle(reading.name)}?`);
  if (building?.name) add(`What's next for ${chipTitle(building.name)}?`);
  if (f("free")) add("Plan a free day");
  for (const d of DEFAULT_SUGGESTIONS) add(d);
  return out;
}
