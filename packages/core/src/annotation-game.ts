/**
 * The annotation game (Torian, 2026-11-16 22:56Z: "make it feel more like a game... their job is to simply annotate...
 * then we show them how correctly they annotate it. It's almost like a captcha experience"; 23:04Z: games with a
 * purpose, after von Ahn; "yes, build it", 23:08Z). A round is a passage of a few turns. The player marks sentences
 * with highlighters named for what the words do and links a sentence to the one it supports or attacks. Nothing is
 * asked. On Done each mark is checked against what is known: a settled answer (the hidden known items, as in
 * reCAPTCHA), or what readers agree on. Marks on unknown sentences count toward the map. Marks are the same answers
 * practice keeps (`argument_answer`, kinds act, relation and target), so no new table is needed. Pure: no I/O.
 */
import { accepted, combine, isAgreed, isSplit, unitKey, type Answer, type Kind, type Settled, type Unit } from "./argument-practice";

/** The highlighters: Inference Anchoring Theory's acts under everyday names (the guide gives the theory's own). */
export const HIGHLIGHTERS = [
  { id: "asserting", label: "Claim", hint: "States something is so." },
  { id: "pure-questioning", label: "Question", hint: "Asks, committing to nothing." },
  { id: "assertive-questioning", label: "Leading question", hint: "Asks, and states a view in asking." },
  { id: "rhetorical-questioning", label: "Rhetorical question", hint: "A question that asks nothing." },
  { id: "challenging", label: "Challenge", hint: "Asks for the grounds of what was said." },
  { id: "agreeing", label: "Agree", hint: "Accepts what the other said." },
  { id: "disagreeing", label: "Disagree", hint: "Rejects what the other said." },
  { id: "restating", label: "Restate", hint: "Says it again in other words." },
  { id: "retracting", label: "Retract", hint: "Takes back an earlier commitment." },
] as const;

/** The links one marked sentence can draw to another. */
export const LINKS = [
  { id: "supports", label: "Supports", hint: "A reason for it." },
  { id: "rebuts", label: "Rebuts", hint: "Says it is false." },
  { id: "undermines", label: "Undermines", hint: "Says a premise of it is false." },
  { id: "undercuts", label: "Undercuts", hint: "Denies that it follows." },
  { id: "rephrases", label: "Rephrases", hint: "The same in other words." },
] as const;

export type Passage = { start: number; end: number };

/** Passages of whole turns, each at least `size` sentences long (the last may be shorter). Indexes are into `units`. */
export function passagesOf(units: readonly Unit[], size = 6): Passage[] {
  const out: Passage[] = [];
  let start = 0;
  for (let i = 0; i < units.length; i++) {
    const endOfTurn = i === units.length - 1 || units[i + 1]!.n !== units[i]!.n;
    if (endOfTurn && i - start + 1 >= size) { out.push({ start, end: i + 1 }); start = i + 1; }
  }
  if (start < units.length) out.push({ start, end: units.length });
  return out;
}

export type Known = { answers: string[]; split: boolean; from: "settled" | "readers" };

/**
 * What is known of one item: its settled answers, else the answer readers agree on (5 or more, chance 0.9), else, when
 * readers split, the two readings. Null when nothing is known yet.
 */
export function knownOf(key: string, kind: Kind, settled: readonly Settled[], answers: readonly Answer[], acc: ReadonlyMap<string, number>, choices: readonly string[]): Known | null {
  const s = settled.find((x) => x.key === key && x.kind === kind);
  if (s) { const a = accepted(s); return { answers: a, split: a.length > 1, from: "settled" }; }
  const c = combine({ key, kind }, answers, acc, choices);
  if (isSplit(c)) return { answers: Object.entries(c!.counts).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([k]) => k), split: true, from: "readers" };
  if (isAgreed(c)) return { answers: [c!.answer], split: false, from: "readers" };
  return null;
}

/** A mark: a sentence's highlighter, and optionally a link from it to another sentence's key. */
export type Mark = { key: string; act: string; link?: { rel: string; to: string } | null };

export type Verdict = "match" | "split" | "miss" | "missed" | "new";

/**
 * How a passage went. Each sentence gets a verdict: match (the mark is a known answer), split (readers split and the
 * mark is one reading), miss (a known answer, and the mark is another), missed (known as an act, not marked), new
 * (marked, nothing known yet: it counts toward the map). Links are checked the same way, relation and target together.
 */
export function scorePassage(marks: readonly Mark[], keys: readonly string[], known: (key: string, kind: Kind) => Known | null) {
  const byKey = new Map(marks.map((m) => [m.key, m]));
  const verdict = (mine: string | null, k: Known | null): Verdict | null =>
    mine === null ? (k && !k.answers.includes("none") ? "missed" : null) : !k ? "new" : k.answers.includes(mine) ? (k.split ? "split" : "match") : "miss";
  const units = keys.map((key) => {
    const m = byKey.get(key) ?? null;
    const act = known(key, "act");
    const rel = known(key, "relation");
    const target = known(key, "target");
    let link: { relation: Verdict | null; target: Verdict | null; known: Known | null; knownTarget: Known | null } | null = null;
    if (m?.link) link = { relation: verdict(m.link.rel, rel), target: target ? (target.answers.includes(m.link.to) ? "match" : "miss") : null, known: rel, knownTarget: target };
    else if (m && rel && !rel.answers.includes("neither")) link = { relation: "missed", target: null, known: rel, knownTarget: target };
    return { key, act: verdict(m?.act ?? null, act), known: act, link };
  });
  const checks = units.flatMap((u) => [u.act, u.link?.relation ?? null, u.link?.target ?? null]).filter((v): v is Verdict => v !== null && v !== "new");
  const right = checks.filter((v) => v === "match" || v === "split").length;
  const added = units.reduce((n, u) => n + (u.act === "new" ? 1 : 0) + (u.link?.relation === "new" ? 1 : 0), 0);
  return { units, right, checked: checks.length, added };
}

/** Points for a round: 10 for each known answer matched, 2 for each label added to the map. */
export const pointsOf = (s: { right: number; added: number }) => s.right * 10 + s.added * 2;

/**
 * The passages of a game: `count` the person has not marked yet, those holding known items first so most rounds can
 * be checked, in an order fixed by the seed.
 */
export function drawPassages(o: { work: string; units: readonly Unit[]; passages: readonly Passage[]; isKnown: (key: string) => boolean; mine: ReadonlySet<string>; seed: number; count?: number }): Passage[] {
  let s = o.seed >>> 0 || 1;
  const rand = () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 2 ** 32; };
  const keysOf = (p: Passage) => o.units.slice(p.start, p.end).map((x) => unitKey(o.work, x));
  const fresh = o.passages.filter((p) => keysOf(p).some((k) => !o.mine.has(k))).map((p) => ({ p, r: rand(), known: keysOf(p).filter(o.isKnown).length }));
  fresh.sort((a, b) => Number(b.known > 0) - Number(a.known > 0) || a.r - b.r);
  return fresh.slice(0, o.count ?? 5).map((x) => x.p);
}
