// The AI that explains a recommendation (Torian, 2026-11-24). Code scores a category from named factors
// (./recommend.ts); a model only restates them in plain sentences, citing each factor or alternative by id, and a
// sentence that cites nothing known is dropped, the dashboard brief's rule. With no model, the factors are the answer.
import type { Scored } from "./recommend";

export type Fact = { id: string; text: string };
export type Sentence = { text: string; cites: string[] };

/** The facts a model may use: the factors, then the alternatives as a1, a2 and so on. */
export function factsOf(r: Scored): Fact[] {
  return [
    ...r.factors.map((f) => ({ id: f.id, text: f.text.replace(/\.$/, "") })),
    ...r.alternatives.map((a, i) => ({ id: `a${i + 1}`, text: `Instead, ${a.label}: ${a.how.replace(/\.$/, "")}` })),
  ];
}

export function explainPrompt(r: Scored, business: string): string {
  const facts = factsOf(r);
  return [
    `You explain to a founder why Mentura recommends ${r.category.name} (${r.category.line.replace(/\.$/, "")}) for their business, ${business}.`,
    r.later ? "It is recommended for later, not now." : "It is recommended now.",
    "Write 2 to 4 short, plain sentences using ONLY the facts below. Address the founder as \"you\".",
    "End every sentence with the ids of the facts it uses, in square brackets, like [need] or [industry][a1]. Every sentence must cite at least one fact.",
    "If there are alternatives (ids a1, a2...), say in one sentence that they could do instead, and cite them.",
    "Do not add facts, vendors, numbers, advice or praise that are not below. No lists, no headings, no emojis.",
    "Put each sentence on its own line.",
    "",
    "Facts:",
    ...facts.map((f) => `[${f.id}] ${f.text}.`),
  ].join("\n");
}

/** Reads the model's answer. Fails closed: a sentence citing nothing, or an id not among the facts, is dropped. */
export function readExplanation(text: string | null | undefined, r: Scored): Sentence[] {
  const known = new Set(factsOf(r).map((f) => f.id));
  const out: Sentence[] = [];
  for (const raw of (text ?? "").replace(/^```\w*\s*|\s*```$/g, "").split(/\n+|(?<=\][.!?]?)\s+(?=[A-Z])/)) {
    const line = raw.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "").trim();
    if (!line) continue;
    const cites = [...new Set([...line.matchAll(/\[\s*([a-z][\w-]*)\s*\]/gi)].map((m) => (m[1] ?? "").toLowerCase()))];
    if (!cites.length || cites.some((c) => !known.has(c))) continue;
    const words = line.replace(/\[[^\]]*\]/g, "").replace(/\s+([.,;!?])/g, "$1").replace(/\s+/g, " ").trim();
    if (words.length < 8 || words.length > 280) continue;
    out.push({ text: /[.!?]$/.test(words) ? words : `${words}.`, cites });
    if (out.length === 4) break;
  }
  return out;
}

/** The explanation without a model: each factor that moved the score, then the alternatives. */
export function plainExplanation(r: Scored): Sentence[] {
  const facts = factsOf(r).filter((f) => f.id !== "connected");
  return facts.slice(0, 5).map((f) => ({ text: `${f.text}.`, cites: [f.id] }));
}
