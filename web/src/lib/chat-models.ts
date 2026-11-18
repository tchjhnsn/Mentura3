// Shared by the chat page (its model menu) and the server (src/server/chat-model.ts), so nothing here imports a provider.

/** The models the person can pick in Ask (AI Elements' Model Selector). `open` is false for a model the gateway
 * refuses on its free tier; it is listed, unpickable, with why. `context` is its context window in tokens. */
export const CHAT_MODELS = [
  { id: "default", label: "Reflect's choice", maker: "Reflect", gateway: null, ollama: null, open: true, context: 131072, note: "gpt-oss-120b unless set otherwise" },
  { id: "gpt-oss-120b", label: "gpt-oss-120b", maker: "OpenAI", gateway: "openai/gpt-oss-120b", ollama: "gpt-oss:120b", open: true, context: 131072, note: "Thorough" },
  { id: "gpt-oss-20b", label: "gpt-oss-20b", maker: "OpenAI", gateway: "openai/gpt-oss-20b", ollama: "gpt-oss:20b", open: true, context: 131072, note: "Faster" },
  { id: "claude-haiku-5.5", label: "Claude Haiku 5.5", maker: "Anthropic", gateway: "anthropic/claude-haiku-5.5", ollama: null, open: false, context: 200000, note: "Needs AI Gateway credits" },
  { id: "claude-sonnet-5.5", label: "Claude Sonnet 5.5", maker: "Anthropic", gateway: "anthropic/claude-sonnet-5.5", ollama: null, open: false, context: 200000, note: "Needs AI Gateway credits" },
] as const;
export type ChatModelChoice = (typeof CHAT_MODELS)[number];
