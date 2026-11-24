// Jev (TypeSafe System 1) as a LangChain runnable, for the triage graph (Naive docs/design/RAW_TRIAGE_2026-11-09.md,
// item 4). It takes the request Naive's triage builds ({ state, model, questions }, naive-framework/src/engine/triage.ts)
// and returns Jev's answers. It sends what it is given and decides nothing. The key is TYPESAFE_API_KEY (or
// TYPESAFEAI_API_KEY), read from the environment and never stored, logged or returned. With no key, jevRunnable returns
// null: the caller holds every label for a person and never falls back to another model.
//
//   const jev = jevRunnable();            // null without a key
//   const { model, answers } = await jev.invoke(request);

import { RunnableLambda } from "@langchain/core/runnables";

export const ENDPOINT = "https://api.typesafe.ai/v1/systemone";

export interface JevRequest { state: Record<string, unknown>, model: string, questions: Record<string, unknown> }
export interface JevReply { model: string | null, answers: Record<string, unknown>, usage: { input_tokens: number, output_tokens: number } }
type Fetch = (url: string, init: { method: string, headers: Record<string, string>, body: string, signal?: AbortSignal }) =>
  Promise<{ ok: boolean, status: number, json(): Promise<unknown>, text(): Promise<string> }>;

/** The key's environment variable that is set, or null. The value itself is never returned. */
export const keyVariable = (env: Record<string, string | undefined> = process.env): string | null =>
  env.TYPESAFE_API_KEY ? "TYPESAFE_API_KEY" : env.TYPESAFEAI_API_KEY ? "TYPESAFEAI_API_KEY" : null;

/** Sends one request in chunks of questions (JEV_CHUNK, default 260), as platform/integrations/jev.mjs does. */
export async function askJev(req: JevRequest, { env = process.env, fetch: f = globalThis.fetch as unknown as Fetch, chunk = Number(env.JEV_CHUNK ?? 260), timeoutMs = 120000 }:
  { env?: Record<string, string | undefined>, fetch?: Fetch, chunk?: number, timeoutMs?: number } = {}): Promise<JevReply> {
  const name = keyVariable(env);
  if (!name) throw new Error("TYPESAFE_API_KEY is not set, so Jev cannot be asked");
  const key = env[name] ?? "";
  const keys = Object.keys(req.questions);
  const parts = Array.from({ length: Math.max(1, Math.ceil(keys.length / chunk)) }, (_, i) => keys.slice(i * chunk, (i + 1) * chunk));
  const out: JevReply = { model: null, answers: {}, usage: { input_tokens: 0, output_tokens: 0 } };
  await Promise.all(parts.map(async (ks) => {
    const res = await f(ENDPOINT, { method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ ...req, questions: Object.fromEntries(ks.map((k) => [k, req.questions[k]])) }), signal: AbortSignal.timeout(timeoutMs) });
    if (!res.ok) throw new Error(`TypeSafe returned ${res.status}: ${(await res.text()).slice(0, 300)}`);
    const r = await res.json() as { model?: string, answers?: Record<string, unknown>, usage?: { input_tokens?: number, output_tokens?: number } };
    out.model = r.model ?? out.model;
    Object.assign(out.answers, r.answers ?? {});
    out.usage.input_tokens += r.usage?.input_tokens ?? 0;
    out.usage.output_tokens += r.usage?.output_tokens ?? 0;
  }));
  return out;
}

/** Jev as a runnable, so it is traced like any other step of the graph. Null when no key is set. */
export function jevRunnable(opts: { env?: Record<string, string | undefined>, fetch?: Fetch } = {}): RunnableLambda<JevRequest, JevReply> | null {
  if (!keyVariable(opts.env ?? process.env)) return null;
  return RunnableLambda.from((req: JevRequest) => askJev(req, opts)).withConfig({ runName: "jev" }) as unknown as RunnableLambda<JevRequest, JevReply>;
}
