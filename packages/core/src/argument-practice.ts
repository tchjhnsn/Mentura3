/**
 * Practice in dialectic that tags arguments (Torian, 2026-11-16 20:45Z; design guide "Dialectic practice: tagging
 * arguments", 20:50Z "write the design guide first, then continue"). A dialogue is cut into turns, one speaker's words
 * each; a person answers one question about one turn at a time. Settled items teach and measure the person; open items
 * collect their answers, which are combined, each weighted by that person's accuracy on settled items (the one-coin form
 * of Dawid and Skene, 1979). Labels follow the Argument Interchange Format and Inference Anchoring Theory (Centre for
 * Argument Technology, University of Dundee); stasis follows Cicero, On Invention 1.10, and Quintilian, Institutio
 * Oratoria 3.6. Pure: no I/O.
 */

/** The version of the guidelines answers are given under; bump it when a definition changes. */
export const GUIDELINES_VERSION = 1;

export type Kind = "move" | "target" | "stasis";

export type Choice = { id: string; label: string; means: string };

/** What the speaker is doing in a turn (AIF: I-nodes, RA inference, CA conflict; IAT: asserting, questioning, conceding). */
export const MOVES: readonly Choice[] = [
  { id: "claim", label: "Making a claim", means: "Says something is so, as their own position or a step toward it." },
  { id: "reason", label: "Giving a reason for a claim", means: "Offers something meant to support a claim, theirs or another's." },
  { id: "rebut", label: "Attacking a claim (rebuttal)", means: "Says an earlier claim is false, or gives a reason to think so." },
  { id: "undercut", label: "Attacking a reason (undercut)", means: "Grants the claim might be true but says the reason given does not lead to it." },
  { id: "question", label: "Asking a question", means: "Asks, to draw out a claim, test one or ask what a word means." },
  { id: "grant", label: "Granting a point", means: "Agrees to something the other has said or asked, often with a short yes." },
  { id: "none", label: "None of these", means: "Greets, narrates, jokes or moves on, without arguing." },
];

/** What is in question (stasis: Cicero, On Invention 1.10; Quintilian, Institutio Oratoria 3.6). */
export const STASES: readonly Choice[] = [
  { id: "fact", label: "Whether it happened (fact)", means: "Did it happen, does it exist, is it so?" },
  { id: "definition", label: "What it is (definition)", means: "What is the thing, and does this case fall under it?" },
  { id: "quality", label: "What kind or how good it is (quality)", means: "Is it just, good, pious, wise; how serious is it?" },
  { id: "procedure", label: "Whether this is the place to decide it (procedure)", means: "Is this the right court, person, time or way to settle it?" },
];

/** Not sure is always offered and counts as no answer. */
export const UNSURE = "unsure";

/** Moves that answer something earlier, so a target question can be asked of them. */
export const ANSWERING = new Set(["reason", "rebut", "undercut", "grant"]);

export type Turn = { n: number; speaker: string; text: string };

export type Dialogue = { id: string; title: string; question: string; audiobook?: string; persons: string; turns: Turn[] };

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

/** A short stable hash of a turn's text (FNV-1a), so a changed text is noticed. */
function hash(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(36).slice(0, 5);
}

/** The key of a turn: work, turn number and a hash of its text ("euthyphro#12.abc12"). */
export const turnKey = (work: string, t: Turn) => `${work}#${t.n}.${hash(t.text)}`;

/** One question about one turn. */
export type Item = { key: string; kind: Kind };
export const itemId = (i: Item) => `${i.key}|${i.kind}`;

export type Answer = { user: string; key: string; kind: Kind; answer: string; at?: string };

/** A settled answer: a person stands behind it. */
export type Settled = { key: string; kind: Kind; answer: string; by: string; note?: string };

/** The answers a question offers. For a target question, the three turns before it by key, then none. */
export function choicesFor(kind: Kind, turns: readonly Turn[], n: number, work: string): Choice[] {
  if (kind === "move") return [...MOVES];
  if (kind === "stasis") return [...STASES];
  const before = turns.slice(Math.max(0, n - 3), n).reverse();
  return [
    ...before.map((t) => ({ id: turnKey(work, t), label: `${cap(t.speaker)}: ${first(t.text)}`, means: "" })),
    { id: "none", label: "None of them", means: "It answers something further back, or nothing." },
  ];
}

const cap = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();
const first = (s: string, n = 70) => (s.length <= n ? s : `${s.slice(0, s.lastIndexOf(" ", n) > 30 ? s.lastIndexOf(" ", n) : n)}...`);

/** A person's accuracy on settled items for each kind, with a mild prior (2 right of 3) so a newcomer counts for less. */
export function accuracy(answers: readonly Answer[], settled: readonly Settled[]): Map<string, number> {
  const right = new Map(settled.map((s) => [`${s.key}|${s.kind}`, s.answer]));
  const tally = new Map<string, { r: number; n: number }>();
  for (const a of answers) {
    const want = right.get(`${a.key}|${a.kind}`);
    if (!want || a.answer === UNSURE) continue;
    const k = `${a.user}|${a.kind}`;
    const t = tally.get(k) ?? { r: 0, n: 0 };
    t.n++;
    if (a.answer === want) t.r++;
    tally.set(k, t);
  }
  const out = new Map<string, number>();
  for (const [k, t] of tally) out.set(k, (t.r + 2) / (t.n + 3));
  return out;
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

/** Turns worth asking about: long enough to carry a move (a lone "Yes." is left to the settled set). */
const askable = (t: Turn) => t.text.split(" ").length >= 4;

/**
 * The items a dialogue can ask now. Every askable turn has a move question. A target question is asked only of a turn
 * whose move is settled or agreed as answering something; a stasis question only of a turn settled or agreed as a claim
 * or a question.
 */
export function itemsFor(work: string, turns: readonly Turn[], answers: readonly Answer[], settled: readonly Settled[], acc: ReadonlyMap<string, number>): Item[] {
  const moveOf = (key: string) => {
    const s = settled.find((x) => x.key === key && x.kind === "move");
    if (s) return s.answer;
    const c = combine({ key, kind: "move" }, answers, acc, MOVES.map((m) => m.id));
    return isAgreed(c) ? c!.answer : null;
  };
  const out: Item[] = [];
  for (const t of turns) {
    const key = turnKey(work, t);
    const settledHere = settled.some((s) => s.key === key);
    if (!askable(t) && !settledHere) continue;
    out.push({ key, kind: "move" });
    const m = moveOf(key);
    if (m && ANSWERING.has(m) && t.n > 0) out.push({ key, kind: "target" });
    if (m && (m === "claim" || m === "question")) out.push({ key, kind: "stasis" });
  }
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
