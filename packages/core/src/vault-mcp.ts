// An MCP server over a vault (Reflect framework plan, step 4): the person's own AI (Claude, ChatGPT or any MCP client)
// reaches the vault's actions (./vault-actions.ts) as tools, the way it reaches the app's at /api/mcp. It speaks MCP's
// stdio transport, JSON-RPC 2.0 one message per line, with no SDK, so the core still imports nothing: `initialize`,
// `ping`, `tools/list` and `tools/call`. Runs from it are a model's (source `mcp`), so a shared or outside action would
// be held, as in the app; a vault offers none yet. No resources, prompts or sampling.
import { createInterface } from "node:readline";
import type { Readable } from "node:stream";
import { GUIDE, listed, runVaultAction, VAULT_ACTIONS, type VaultContext } from "./vault-actions.ts";
import { offered } from "./actions.ts";

/** The MCP versions this server speaks, newest first. A client asking for another gets the newest. */
export const MCP_VERSIONS = ["2025-06-18", "2025-03-26", "2024-11-05"] as const;

type Message = { jsonrpc?: string; id?: string | number | null; method?: string; params?: Record<string, unknown> };
export type Reply = { jsonrpc: "2.0"; id: string | number | null; result?: unknown; error?: { code: number; message: string } };

const text = (v: unknown): string => (typeof v === "string" ? v : JSON.stringify(v, null, 2));

/** The tools a vault offers over MCP: its actions offered on MCP, never a never-tier one. */
export const vaultTools = () =>
  VAULT_ACTIONS.filter((a) => a.on.includes("mcp") && offered(a.tier)).map((a) => {
    const l = listed(a);
    return { name: l.id, title: l.title, description: l.description, inputSchema: l.input, annotations: { readOnlyHint: l.tier === "read" } };
  });

/** Answer one message. A notification (no id) gets no answer. `vault` opens the vault for each call. */
export async function answerMcp(msg: unknown, vault: () => Promise<VaultContext & { movedTo?: string }>): Promise<Reply | null> {
  const m = (typeof msg === "object" && msg !== null ? msg : {}) as Message;
  if (m.id === undefined) return null;
  const id = m.id;
  const ok = (result: unknown): Reply => ({ jsonrpc: "2.0", id, result });
  const fail = (code: number, message: string): Reply => ({ jsonrpc: "2.0", id, error: { code, message } });
  if (m.jsonrpc !== "2.0" || typeof m.method !== "string") return fail(-32600, "not a JSON-RPC 2.0 request");
  if (m.method === "initialize") {
    const asked = m.params?.protocolVersion;
    const protocolVersion = MCP_VERSIONS.find((v) => v === asked) ?? MCP_VERSIONS[0];
    return ok({ protocolVersion, capabilities: { tools: {} }, serverInfo: { name: "reflect-vault", version: "0.1.0" }, instructions: GUIDE });
  }
  if (m.method === "ping") return ok({});
  if (m.method === "tools/list") return ok({ tools: vaultTools() });
  if (m.method === "tools/call") {
    const name = m.params?.name;
    if (typeof name !== "string" || !vaultTools().some((t) => t.name === name)) return fail(-32602, `no tool ${String(name)}`);
    try {
      const ran = await runVaultAction(await vault(), name, m.params?.arguments ?? {}, "mcp");
      if (ran.held) return ok({ content: [{ type: "text", text: `Not done yet. This waits for the person. Change ${ran.changeId}. What will happen:\n${ran.preview}` }] });
      return ok({ content: [{ type: "text", text: text(ran.result) }], ...(ran.changeId ? { _meta: { change: ran.changeId } } : {}) });
    } catch (err) {
      return ok({ content: [{ type: "text", text: err instanceof Error ? err.message : String(err) }], isError: true });
    }
  }
  return fail(-32601, `no method ${m.method}`);
}

/** Serve MCP's stdio transport: one JSON-RPC message per line in, one answer per line out. Resolves when input ends. */
export async function serveStdio(input: Readable, write: (line: string) => void, vault: () => Promise<VaultContext & { movedTo?: string }>): Promise<void> {
  for await (const line of createInterface({ input, crlfDelay: Infinity })) {
    if (!line.trim()) continue;
    let msg: unknown;
    try {
      msg = JSON.parse(line);
    } catch {
      write(JSON.stringify({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "not JSON" } }));
      continue;
    }
    const reply = await answerMcp(msg, vault);
    if (reply) write(JSON.stringify(reply));
  }
}
