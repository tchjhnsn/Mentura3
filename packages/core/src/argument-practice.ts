/**
 * Practice in dialectic that tags arguments (Torian, 2026-11-16 20:45Z; design guide "Dialectic practice: tagging
 * arguments"). Second guidelines (Torian, 22:15Z "attack the premise of the options we offer as answers", 22:23Z, 22:33Z
 * "yes"): a turn is cut into units, one sentence each, because one turn often does several things; each unit is asked
 * what its words do (the illocution, named as Inference Anchoring Theory names them), then, apart from that, whether it
 * supports or attacks another statement (the relation, as the Argument Interchange Format and Prakken keep it) and
 * which one. A supporting unit is asked what kind of argument it is and its critical questions (Walton, Reed and
 * Macagno, Argumentation Schemes, 2008). Stasis is asked of an issue, not of a unit (Cicero, On Invention 1.10;
 * Quintilian, Institutio Oratoria 3.6). A settled item may accept more than one answer where readers honestly split, and
 * a person may say how sure they are. Answers are combined, each weighted by that person's accuracy on settled items
 * (the one-coin form of Dawid and Skene, 1979). Pure: no I/O.
 */

/** The version of the guidelines answers are given under; bump it when a definition changes. */
export const GUIDELINES_VERSION = 2;

export type Kind = "act" | "relation" | "target" | "stasis" | "scheme" | "cq";

export type Choice = { id: string; label: string; means: string };

/**
 * What the words of a unit do, by the illocutionary connections of Inference Anchoring Theory (Budzynska, Janier, Reed
 * and Saint-Dizier, "Towards Extraction of Dialogical Arguments", 2013; the DialAM annotation guidelines), and
 * retracting from Walton and Krabbe, Commitment in Dialogue (1995). The question is what the words count as here, read
 * from the text, not a guess at what the speaker privately meant.
 */
export const ACTS: readonly Choice[] = [
  { id: "asserting", label: "Asserting", means: "States that something is so, as a public commitment the speaker can be held to (whether or not they believe it)." },
  { id: "pure-questioning", label: "Pure questioning", means: "Asks for the other's view and commits to nothing: \"And who is he?\"" },
  { id: "assertive-questioning", label: "Assertive questioning", means: "Asks, and in asking also states the speaker's own view: \"Is not piety in every action always the same?\"" },
  { id: "rhetorical-questioning", label: "Rhetorical questioning", means: "Has the form of a question but asks nothing; it states a view: \"What should I be good for without it?\"" },
  { id: "challenging", label: "Challenging", means: "Asks for the grounds of something the other has said: \"What proof have you?\"" },
  { id: "agreeing", label: "Agreeing", means: "Accepts what the other said or asked: \"Yes.\" \"To be sure.\"" },
  { id: "disagreeing", label: "Disagreeing", means: "Rejects what the other said or asked." },
  { id: "restating", label: "Restating", means: "Says again, in other words, something already said." },
  { id: "retracting", label: "Retracting", means: "Takes back something the speaker committed to earlier (Walton and Krabbe)." },
  { id: "none", label: "None of these", means: "Greets, narrates, jokes or moves the talk on, without committing to anything argued." },
];

/**
 * How a unit bears on another statement (AIF: inference, conflict, rephrase; the three attacks are Prakken's, "An
 * abstract framework for argumentation with structured arguments", 2010).
 */
export const RELATIONS: readonly Choice[] = [
  { id: "supports", label: "Supports it", means: "Is offered as a reason for another statement." },
  { id: "rebuts", label: "Rebuts it", means: "Says another statement, a conclusion, is false." },
  { id: "undermines", label: "Undermines it", means: "Says something another argument rests on, a premise, is false." },
  { id: "undercuts", label: "Undercuts it", means: "Grants the reason may be true but denies it leads to the conclusion." },
  { id: "rephrases", label: "Rephrases it", means: "Puts another statement in other words, keeping its meaning." },
  { id: "neither", label: "Neither", means: "Bears on no other statement as reason, attack or rephrase." },
];

/** Relations that point at another statement, so a target question follows. */
export const POINTING = new Set(["supports", "rebuts", "undermines", "undercuts", "rephrases"]);

/** Acts that can bear on another statement, so a relation question follows. */
export const BEARING = new Set(["asserting", "assertive-questioning", "rhetorical-questioning", "disagreeing", "restating"]);

/** Acts that answer one other statement without a relation of their own, so only a target question follows. */
export const ANSWERING = new Set(["agreeing", "challenging", "retracting"]);

/** What is in question in an issue (stasis: Cicero, On Invention 1.10; Quintilian, Institutio Oratoria 3.6). */
export const STASES: readonly Choice[] = [
  { id: "fact", label: "Whether it happened (fact)", means: "Did it happen, does it exist, is it so?" },
  { id: "definition", label: "What it is (definition)", means: "What is the thing, and does this case fall under it?" },
  { id: "quality", label: "What kind or how good it is (quality)", means: "Is it just, good, pious, wise; how serious is it?" },
  { id: "procedure", label: "Whether this is the place to decide it (procedure)", means: "Is this the right court, person, time or way to settle it?" },
];

export type Scheme = Choice & { cqs: readonly string[] };

/**
 * Kinds of argument and the critical questions each must answer (Walton, Reed and Macagno, Argumentation Schemes,
 * Cambridge University Press, 2008; Walton, Fundamentals of Critical Argumentation, 2006). The questions are put in
 * plain words; their order and sense follow the book.
 */
export const SCHEMES: readonly Scheme[] = [
  { id: "example", label: "From example", means: "A case is offered to show a general claim.", cqs: [
    "Is what the example says true?",
    "Does the example really fall under the general claim?",
    "Is the example typical of the cases the claim covers?",
    "Was there something special about the example that keeps it from generalizing?",
  ] },
  { id: "analogy", label: "From analogy", means: "Two cases are alike, so what holds of one holds of the other.", cqs: [
    "Do the two cases differ in a way that weakens the comparison?",
    "Is the point that is said to hold in the first case really true there?",
    "Is there a third case, just as alike, where the point does not hold?",
  ] },
  { id: "expert", label: "From expert opinion", means: "Someone who knows the field says so.", cqs: [
    "Is the source really an expert?",
    "Is the claim within their field?",
    "Did they actually say what is claimed?",
    "Are they trustworthy, with nothing to gain from saying it?",
    "Do other experts agree?",
    "Does their claim rest on evidence?",
  ] },
  { id: "classification", label: "From definition (verbal classification)", means: "The thing fits the definition of a kind, so it is of that kind.", cqs: [
    "Does the thing clearly fit the definition, or is there room for doubt?",
    "Is the definition fair, or made up to suit the argument?",
  ] },
  { id: "consequences", label: "From consequences", means: "Doing it would lead to good or bad results, so do it or don't.", cqs: [
    "How likely are those results?",
    "What evidence says they will follow?",
    "Are there results of the opposite kind to weigh against them?",
  ] },
  { id: "cause", label: "From cause to effect", means: "This causes that, so that will happen or did.", cqs: [
    "How strong is the link between cause and effect?",
    "Is the evidence for the link good enough?",
    "Could something else get in the way?",
  ] },
  { id: "sign", label: "From sign", means: "This is a sign of that, so that is so.", cqs: [
    "How reliably does the sign go with what it signals?",
    "Is there another explanation for the sign?",
  ] },
  { id: "commitment", label: "From commitment", means: "You are committed to this, so you must accept that.", cqs: [
    "Is the person really committed to what is claimed?",
    "Has the commitment changed, or is this case an exception?",
  ] },
  { id: "other", label: "Another kind", means: "None of these kinds fits.", cqs: [] },
];

/** The answers to a critical question. */
export const CQ_ANSWERS: readonly Choice[] = [
  { id: "yes", label: "Yes", means: "" },
  { id: "no", label: "No", means: "" },
  { id: "cannot-tell", label: "Can't tell from the text", means: "The dialogue does not settle it." },
];

/** Not sure is always offered and counts as no answer. */
export const UNSURE = "unsure";

/** How sure a person says they are: 1 a guess, 2 think so, 3 sure. */
export type Confidence = 1 | 2 | 3;
export const CONFIDENCE: readonly { id: Confidence; label: string }[] = [{ id: 1, label: "A guess" }, { id: 2, label: "Think so" }, { id: 3, label: "Sure" }];

export type Turn = { n: number; speaker: string; text: string };

/** One sentence of a turn: the unit questions are asked of. */
export type Unit = { n: number; u: number; speaker: string; text: string };

/** Cut a dialogue's text into turns: a line starting with a speaker's name in capitals and a colon begins one. */
export function parseTurns(text: string): Turn[] {
  const turns: Turn[] = [];
  let cur: { speaker: string; lines: string[] } | null = null;
  const push = () => {
    if (!cur) return;
    const t = cur.lines.join(" ").replace(/\s+/g, " ").trim();
    if (t) turns.push({ n: turns.length, speaker: cur.speaker, text: t });
  };
  for (const raw of text.split(/\r?\n/)) {
    const m = /^([A-Z][A-Z ]{1,30}):\s*(.*)$/.exec(raw);
    if (m && m[1] !== "PERSONS OF THE DIALOGUE" && m[1] !== "SCENE") {
      push();
      cur = { speaker: m[1]!.trim(), lines: [m[2]!] };
    } else if (cur) cur.lines.push(raw);
  }
  push();
  return turns;
}

/** Cut turns into units: a new unit starts after a full stop, question or exclamation mark followed by a capital. */
export function unitsOf(turns: readonly Turn[]): Unit[] {
  return turns.flatMap((t) => t.text.split(/(?<=[.?!])["”’']?\s+(?=["“‘']?[A-Z])/).map((s) => s.trim()).filter(Boolean)
    .map((text, u) => ({ n: t.n, u, speaker: t.speaker, text })));
}

/** A short stable hash of a text (FNV-1a), so a changed text is noticed. */
function hash(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(36).slice(0, 5);
}

/** The key of a unit: work, turn, unit and a hash of its text ("euthyphro#12.0.abc12"). */
export const unitKey = (work: string, x: Unit) => `${work}#${x.n}.${x.u}.${hash(x.text)}`;

/** Where a unit is, as drafts name it ("12.0"). */
export const placeOf = (x: Pick<Unit, "n" | "u">) => `${x.n}.${x.u}`;

/** An issue in a dialogue: the question in dispute, and the turn where it is raised. Stasis is asked of it. */
export type Issue = { id: string; question: string; at: number };
export const issueKey = (work: string, id: string) => `${work}#issue:${id}`;

/** The key of one critical question on a unit, under the scheme it belongs to. */
export const cqKey = (unit: string, scheme: string, i: number) => `${unit}~${scheme}.${i}`;
export function parseCq(key: string): { unit: string; scheme: string; i: number } | null {
  const m = /^(.+)~([a-z-]+)\.(\d+)$/.exec(key);
  return m ? { unit: m[1]!, scheme: m[2]!, i: Number(m[3]) } : null;
}

/** One question about one unit, issue or critical question. */
export type Item = { key: string; kind: Kind };
export const itemId = (i: Item) => `${i.key}|${i.kind}`;

export type Answer = { user: string; key: string; kind: Kind; answer: string; confidence?: Confidence | null; at?: string };

/** A settled answer: a person stands behind it. `also` holds other answers accepted where readers honestly split. */
export type Settled = { key: string; kind: Kind; answer: string; also?: readonly string[]; by: string; note?: string };

/** Every answer a settled item accepts. */
export const accepted = (s: Pick<Settled, "answer" | "also">) => [s.answer, ...(s.also ?? [])];

const cap = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();
const first = (s: string, n = 90) => (s.length <= n ? s : `${s.slice(0, s.lastIndexOf(" ", n) > 30 ? s.lastIndexOf(" ", n) : n).replace(/[\s,;:.-]+$/, "")}...`);

/**
 * The answers a question offers. A target question offers every other unit of the dialogue, nearest first (a reason
 * may come before or after what it supports), then none. A critical question needs its key, which names the scheme.
 */
export function choicesFor(kind: Kind, o: { units?: readonly Unit[]; at?: number; work?: string; key?: string } = {}): Choice[] {
  if (kind === "act") return [...ACTS];
  if (kind === "relation") return [...RELATIONS];
  if (kind === "stasis") return [...STASES];
  if (kind === "scheme") return SCHEMES.map(({ cqs: _cqs, ...c }) => c);
  if (kind === "cq") return [...CQ_ANSWERS];
  const units = o.units ?? [];
  const at = o.at ?? 0;
  const others = units.map((x, i) => ({ x, i })).filter(({ i }) => i !== at)
    .sort((a, b) => Math.abs(a.i - at) - Math.abs(b.i - at) || a.i - b.i);
  return [
    ...others.map(({ x }) => ({ id: unitKey(o.work ?? "", x), label: `${cap(x.speaker)}: ${first(x.text)}`, means: placeOf(x) })),
    { id: "none", label: "None of them", means: "It bears on nothing said in the dialogue." },
  ];
}

/** The text of a critical question, from its key. */
export function cqText(key: string): string | null {
  const c = parseCq(key);
  return c ? SCHEMES.find((s) => s.id === c.scheme)?.cqs[c.i] ?? null : null;
}

/** A person's accuracy on settled items for each kind, with a mild prior (2 right of 3) so a newcomer counts for less. */
export function accuracy(answers: readonly Answer[], settled: readonly Settled[]): Map<string, number> {
  const right = new Map(settled.map((s) => [`${s.key}|${s.kind}`, accepted(s)]));
  const tally = new Map<string, { r: number; n: number }>();
  for (const a of answers) {
    const want = right.get(`${a.key}|${a.kind}`);
    if (!want || a.answer === UNSURE) continue;
    const k = `${a.user}|${a.kind}`;
    const t = tally.get(k) ?? { r: 0, n: 0 };
    t.n++;
    if (want.includes(a.answer)) t.r++;
    tally.set(k, t);
  }
  const out = new Map<string, number>();
  for (const [k, t] of tally) out.set(k, (t.r + 2) / (t.n + 3));
  return out;
}

/** How often a person was right on settled items at each level of sureness they gave: their calibration. */
export function calibration(answers: readonly Answer[], settled: readonly Settled[], user: string): { confidence: Confidence; n: number; right: number }[] {
  const right = new Map(settled.map((s) => [`${s.key}|${s.kind}`, accepted(s)]));
  return CONFIDENCE.map(({ id }) => {
    const mine = answers.filter((a) => a.user === user && a.confidence === id && a.answer !== UNSURE && right.has(`${a.key}|${a.kind}`));
    return { confidence: id, n: mine.length, right: mine.filter((a) => right.get(`${a.key}|${a.kind}`)!.includes(a.answer)).length };
  });
}

const PRIOR = 2 / 3;

export type Combined = { answer: string; p: number; n: number; counts: Record<string, number> };

/**
 * Combine the answers to one item. Each person's answer counts by their accuracy p on that kind: the chance of each
 * choice c is proportional to the product over people of p when they chose c, else (1 - p) / (K - 1). A person whose
 * accuracy is at or under chance (1/K) is left out. Not sure counts as no answer.
 */
export function combine(item: Item, answers: readonly Answer[], acc: ReadonlyMap<string, number>, choices: readonly string[]): Combined | null {
  const mine = answers.filter((a) => a.key === item.key && a.kind === item.kind && a.answer !== UNSURE && choices.includes(a.answer));
  const counts: Record<string, number> = {};
  for (const a of mine) counts[a.answer] = (counts[a.answer] ?? 0) + 1;
  if (!mine.length) return null;
  const K = choices.length;
  const logp = new Map(choices.map((c) => [c, 0]));
  for (const a of mine) {
    const p = acc.get(`${a.user}|${a.kind}`) ?? PRIOR;
    if (p <= 1 / K) continue;
    for (const c of choices) logp.set(c, logp.get(c)! + Math.log(c === a.answer ? p : (1 - p) / (K - 1)));
  }
  const top = Math.max(...logp.values());
  let z = 0;
  for (const v of logp.values()) z += Math.exp(v - top);
  let best = choices[0]!;
  for (const c of choices) if (logp.get(c)! > logp.get(best)!) best = c;
  return { answer: best, p: 1 / z, n: mine.length, counts };
}

/** Agreed: at least 5 answers and a combined chance of 0.9 or more for one answer. */
export const isAgreed = (c: Combined | null) => !!c && c.n >= 5 && c.p >= 0.9;

/**
 * Split: at least 5 answers and the top two answers each hold a quarter or more of them. A split item is shown as two
 * readings, not forced to one.
 */
export function isSplit(c: Combined | null): boolean {
  if (!c || c.n < 5) return false;
  const v = Object.values(c.counts).sort((a, b) => b - a);
  return v.length >= 2 && v[1]! / c.n >= 0.25;
}

/** Krippendorff's alpha for nominal answers over items with at least two answers (1 = full agreement, 0 = chance). */
export function krippendorffAlpha(answers: readonly Answer[]): number | null {
  const byItem = new Map<string, string[]>();
  for (const a of answers) if (a.answer !== UNSURE) byItem.set(`${a.key}|${a.kind}`, [...(byItem.get(`${a.key}|${a.kind}`) ?? []), a.answer]);
  const coinc = new Map<string, number>();
  let total = 0;
  for (const vals of byItem.values()) {
    const m = vals.length;
    if (m < 2) continue;
    for (let i = 0; i < m; i++) for (let j = 0; j < m; j++) {
      if (i === j) continue;
      const k = `${vals[i]}\u0000${vals[j]}`;
      coinc.set(k, (coinc.get(k) ?? 0) + 1 / (m - 1));
    }
    total += m;
  }
  if (total < 2) return null;
  const marg = new Map<string, number>();
  let observedDis = 0;
  for (const [k, v] of coinc) {
    const [c] = k.split("\u0000");
    marg.set(c!, (marg.get(c!) ?? 0) + v);
    if (k.split("\u0000")[0] !== k.split("\u0000")[1]) observedDis += v;
  }
  let expectedDis = 0;
  for (const [c, nc] of marg) for (const [k, nk] of marg) if (c !== k) expectedDis += nc * nk;
  expectedDis /= total - 1;
  if (expectedDis === 0) return 1;
  return 1 - observedDis / expectedDis;
}

/** A seeded shuffle (mulberry32), so a session's order is stable for its seed. */
function shuffle<T>(xs: readonly T[], seed: number): T[] {
  let s = seed >>> 0;
  const rand = () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j]!, a[i]!]; }
  return a;
}

/** Units worth asking about: long enough to carry an act (a lone "Yes." is left to the settled set). */
const askable = (x: Unit) => x.text.split(" ").length >= 4;

/**
 * The items a dialogue can ask now. Every askable unit has an act question. Once its act is settled or agreed, a unit
 * whose act can bear on another statement gets a relation question; a relation that points, or an act that answers
 * something, gets a target question; a supporting unit gets a scheme question, and a settled or agreed scheme its
 * critical questions. Each issue gets a stasis question.
 */
export function itemsFor(work: string, units: readonly Unit[], issues: readonly Issue[], answers: readonly Answer[], settled: readonly Settled[], acc: ReadonlyMap<string, number>): Item[] {
  const known = (key: string, kind: Kind, choices: readonly string[]) => {
    const s = settled.find((x) => x.key === key && x.kind === kind);
    if (s) return s.answer;
    const c = combine({ key, kind }, answers, acc, choices);
    return isAgreed(c) ? c!.answer : null;
  };
  const out: Item[] = [];
  for (const x of units) {
    const key = unitKey(work, x);
    const settledHere = settled.some((s) => s.key === key);
    if (!askable(x) && !settledHere) continue;
    out.push({ key, kind: "act" });
    const act = known(key, "act", ACTS.map((c) => c.id));
    if (!act) continue;
    let rel: string | null = null;
    if (BEARING.has(act)) {
      out.push({ key, kind: "relation" });
      rel = known(key, "relation", RELATIONS.map((c) => c.id));
    }
    if ((rel && POINTING.has(rel)) || ANSWERING.has(act)) out.push({ key, kind: "target" });
    if (rel === "supports") {
      out.push({ key, kind: "scheme" });
      const scheme = known(key, "scheme", SCHEMES.map((c) => c.id));
      const cqs = SCHEMES.find((s) => s.id === scheme)?.cqs ?? [];
      cqs.forEach((_, i) => out.push({ key: cqKey(key, scheme!, i), kind: "cq" }));
    }
  }
  for (const i of issues) out.push({ key: issueKey(work, i.id), kind: "stasis" });
  return out;
}

export type SessionItem = Item & { settled: boolean };

/**
 * A session: up to `settledCount` settled items and the rest open, shuffled together, none the person has answered.
 * Open items with the fewest answers come first, or, given Jev's priors, those it is least sure of.
 */
export function drawSession(opts: {
  items: readonly Item[];
  settled: readonly Settled[];
  answers: readonly Answer[];
  user: string;
  seed: number;
  size?: number;
  settledCount?: number;
  /** Jev's chance for its top answer, by item id, when a key is set. */
  certainty?: ReadonlyMap<string, number>;
  /** Their first session opens on a settled item, so the first answer teaches. */
  firstSettled?: boolean;
}): SessionItem[] {
  const size = opts.size ?? 10;
  const done = new Set(opts.answers.filter((a) => a.user === opts.user).map((a) => `${a.key}|${a.kind}`));
  const isSettled = new Set(opts.settled.map((s) => `${s.key}|${s.kind}`));
  const fresh = opts.items.filter((i) => !done.has(itemId(i)));
  const settledPool = shuffle(fresh.filter((i) => isSettled.has(itemId(i))), opts.seed);
  const count = new Map<string, number>();
  for (const a of opts.answers) count.set(`${a.key}|${a.kind}`, (count.get(`${a.key}|${a.kind}`) ?? 0) + 1);
  const openPool = shuffle(fresh.filter((i) => !isSettled.has(itemId(i))), opts.seed + 1).sort((a, b) =>
    opts.certainty ? (opts.certainty.get(itemId(a)) ?? 0) - (opts.certainty.get(itemId(b)) ?? 0) : (count.get(itemId(a)) ?? 0) - (count.get(itemId(b)) ?? 0));
  const want = Math.min(opts.settledCount ?? 3, settledPool.length);
  const open = openPool.slice(0, size - want);
  const settledPick = settledPool.slice(0, size - open.length);
  const all = shuffle([...settledPick.map((i) => ({ ...i, settled: true })), ...open.map((i) => ({ ...i, settled: false }))], opts.seed + 2);
  if (opts.firstSettled) {
    const at = all.findIndex((i) => i.settled);
    if (at > 0) all.unshift(...all.splice(at, 1));
  }
  return all;
}
