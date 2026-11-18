import { gateway } from "@ai-sdk/gateway";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type { LanguageModel } from "ai";

/** The chat's model on Vercel AI Gateway unless REFLECT_CHAT_MODEL names another. gpt-oss-120b is open to the
 * gateway's free tier; Anthropic's models (anthropic/claude-haiku-5.5, anthropic/claude-sonnet-5.5) are refused there
 * until the team buys AI Gateway credits, so set REFLECT_CHAT_MODEL to one of them only after that. */
export const CHAT_MODEL = "openai/gpt-oss-120b";

/**
 * The chat's model: CHAT_MODEL through Vercel AI Gateway when deployed (it signs in with the deployment's OIDC
 * token), otherwise gpt-oss-120b on Ollama Cloud. Null when neither is set up.
 */
export function chatModel(env: Record<string, string | undefined> = process.env): LanguageModel | null {
  if (env.VERCEL || env.AI_GATEWAY_API_KEY) return gateway(env.REFLECT_CHAT_MODEL ?? CHAT_MODEL);
  if (!env.OLLAMA_API_KEY) return null;
  const ollama = createOpenAICompatible({ name: "ollama", baseURL: `${env.OLLAMA_HOST ?? "https://ollama.com"}/v1`, apiKey: env.OLLAMA_API_KEY });
  return ollama.chatModel(env.REFLECT_READER_MODEL ?? "gpt-oss:120b");
}

/**
 * A model that reads pictures (a receipt's photo): Gemini 2.5 Flash through Vercel AI Gateway when deployed,
 * otherwise Gemma 4 on Ollama Cloud. Null when neither is set up.
 */
export function visionModel(env: Record<string, string | undefined> = process.env): LanguageModel | null {
  if (env.VERCEL || env.AI_GATEWAY_API_KEY) return gateway(env.REFLECT_VISION_MODEL ?? "google/gemini-2.5-flash");
  if (!env.OLLAMA_API_KEY) return null;
  const ollama = createOpenAICompatible({ name: "ollama", baseURL: `${env.OLLAMA_HOST ?? "https://ollama.com"}/v1`, apiKey: env.OLLAMA_API_KEY });
  return ollama.chatModel(env.REFLECT_VISION_MODEL ?? "gemma4:31b");
}
