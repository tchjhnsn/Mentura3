"use server";

// "Why this?" on a recommendation: the server scores the category again from the business's own profile (never from
// what the page sends), and a model restates the factors (components/studio/explain.ts). With no model set up, or an
// answer that cites nothing, the factors themselves are the answer.
import { generateText } from "ai";
import { explainPrompt, plainExplanation, readExplanation, type Sentence } from "@/components/studio/explain";
import { recommendationFor } from "@/components/studio/recommend";
import { chatModel } from "@/server/chat-model";
import { integrationsContext } from "./context";

export type Explanation = { sentences: Sentence[]; by: "model" | "plain" } | { error: string };

export async function explainRecommendation(slug: string, category: string): Promise<Explanation> {
  const ctx = await integrationsContext(slug);
  const r = recommendationFor(category, { ...ctx.profile, connected: ctx.connected });
  if (!r) return { error: "None of this business's functions use this kind of software." };
  const plain = { sentences: plainExplanation(r), by: "plain" as const };
  const model = chatModel();
  if (!model) return plain;
  try {
    const { text } = await generateText({ model, prompt: explainPrompt(r, ctx.name), abortSignal: AbortSignal.timeout(20_000) });
    const sentences = readExplanation(text, r);
    return sentences.length ? { sentences, by: "model" } : plain;
  } catch {
    return plain;
  }
}
