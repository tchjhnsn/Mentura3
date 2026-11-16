/**
 * How well formed a post in a discussion is, and which way it leans (Torian, 2026-11-16 10:08Z): rather than people
 * marking their own post pro or con as Kialo asks, a model reads it; and a post earns points for how developed its
 * argument is, up to 5. The ladder is Polity's claim completeness (L1 vague to L5 metric, window and check; polity
 * `CLAIM_COMPLETENESS_LEVELS`), carried from civic claims to arguments: a claim, its reason, a case, a source that can
 * be checked, and meeting the strongest objection. The model proposes; the author may correct the stance, never the
 * level.
 */

export const LEVELS = [
  { level: 1, label: "L1", name: "Assertion", hint: "A view stated, with no reason given." },
  { level: 2, label: "L2", name: "Reasoned", hint: "A claim with a reason for it." },
  { level: 3, label: "L3", name: "Shown", hint: "A claim, its reason, and a concrete case or example." },
  { level: 4, label: "L4", name: "Grounded", hint: "All of that, grounded in a source someone can check: a passage, a fact, a record." },
  { level: 5, label: "L5", name: "Tested", hint: "All of that, and it meets the strongest objection or says what would show it wrong." },
] as const;
export type Level = (typeof LEVELS)[number]["level"];

export const STANCES = ["supports", "opposes", "neither"] as const;
export type Stance = (typeof STANCES)[number];
export const isStance = (s: unknown): s is Stance => typeof s === "string" && (STANCES as readonly string[]).includes(s);
export const stanceLabel: Record<Stance, string> = { supports: "Supports", opposes: "Opposes", neither: "Neither" };

export type Grade = { stance: Stance; level: Level; why: string };

/** The points a post earns: its level, at most 5. Only for posts that answer something or say something. */
export const pointsFor = (level: number | null | undefined): number => (level && level >= 1 ? Math.min(5, Math.floor(level)) : 0);

/** The prompt that asks a model to read one post. `to` is what the post answers: the post it replies to, or the topic. */
export function gradePrompt(post: string, to: { kind: "post" | "question" | "topic"; text: string }): string {
  return [
    "You read one post in a discussion and say two things about it. Answer with JSON only:",
    '{"stance": "supports" | "opposes" | "neither", "level": 1-5, "why": "one short sentence"}',
    "",
    `stance: does the post support or oppose ${to.kind === "post" ? "the post it replies to" : to.kind === "question" ? "a yes to the question" : "the topic's usual view"}? "neither" when it asks, adds facts without taking a side, or is off the point.`,
    "level, the most developed rung the post fully reaches:",
    ...LEVELS.map((l) => `${l.level} ${l.name}: ${l.hint}`),
    "Judge the argument's form, not whether you agree. Length alone earns nothing; a short post can reach 5.",
    "",
    `${to.kind === "post" ? "It replies to" : to.kind === "question" ? "The question" : "The topic"}: """${to.text.slice(0, 2000)}"""`,
    `The post: """${post.slice(0, 4000)}"""`,
  ].join("\n");
}

/** Reads a model's answer; null unless it is a stance and a level 1 to 5. */
export function parseGrade(text: string): Grade | null {
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try {
    const o = JSON.parse(m[0]) as { stance?: unknown; level?: unknown; why?: unknown };
    const level = Number(o.level);
    if (!isStance(o.stance) || !Number.isInteger(level) || level < 1 || level > 5) return null;
    return { stance: o.stance, level: level as Level, why: typeof o.why === "string" ? o.why.slice(0, 300) : "" };
  } catch {
    return null;
  }
}

/** A topic a discussion belongs to: a curated dialectic, a great idea, a term, a work or a person. */
export type TopicKind = "dialectic" | "idea" | "term" | "work" | "person";
export const TOPIC_KINDS: readonly TopicKind[] = ["dialectic", "idea", "term", "work", "person"];
export const topicKey = (kind: TopicKind, id: string) => `${kind}:${id}`;
export function parseTopic(key: string): { kind: TopicKind; id: string } | null {
  const i = key.indexOf(":");
  const kind = key.slice(0, i) as TopicKind;
  const id = key.slice(i + 1);
  return i > 0 && TOPIC_KINDS.includes(kind) && /^[\p{L}\p{N} .'’-]{1,120}$/u.test(id) ? { kind, id } : null;
}
