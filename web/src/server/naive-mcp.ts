// The web side of Naive's mcp connector (packages/platform/connectors/mcp.ts; spec "Integrations: formal
// specification", Sources of truth design). The bridge asks here for the records one source holds; the person's MCP
// sign-in never leaves this server. A request is honoured only when its signature is the bridge key's over the exact
// body and it is less than a minute old, the source id names one of that person's live connections that is open to
// that business, and Reflect ships an adapter for that service. The adapter's tool reads and changes nothing.
import { createHmac, timingSafeEqual } from "node:crypto";
import { ADAPTERS, itemsOf, sourceIdOf, type Adapter, type SourceConnection } from "@/components/studio/integrations-sources";

export type McpListRequest = { op: "list"; user: string; venture: string; source: string; api: string; folder?: string; at: number };
export type McpItem = { path: string; content: string };

const MAX_AGE_MS = 60_000;

export const signBody = (body: string, key: string): string => createHmac("sha256", key).update(body).digest("hex");

/** The request, once its signature and age check out; otherwise a refusal that names why. */
export function verifyMcpRequest(body: string, signature: string | null, key: string, now = Date.now()): McpListRequest {
  const want = Buffer.from(signBody(body, key), "hex");
  const got = Buffer.from(signature ?? "", "hex");
  if (got.length !== want.length || !timingSafeEqual(got, want)) throw new McpRefusal(401, "The request is not signed by Reflect's bridge.");
  let r: Partial<McpListRequest>;
  try { r = JSON.parse(body) as Partial<McpListRequest>; } catch { throw new McpRefusal(400, "The request is not JSON."); }
  if (r.op !== "list" || typeof r.user !== "string" || typeof r.venture !== "string" || typeof r.source !== "string" || typeof r.api !== "string" || typeof r.at !== "number")
    throw new McpRefusal(400, "The request is missing what it reads.");
  if (Math.abs(now - r.at) > MAX_AGE_MS) throw new McpRefusal(401, "The request is too old.");
  if (r.folder !== undefined && (typeof r.folder !== "string" || !/^[a-z][a-z0-9-]*$/.test(r.folder))) throw new McpRefusal(400, "The folder is not one Naive names.");
  return r as McpListRequest;
}

export class McpRefusal extends Error {
  constructor(readonly status: number, message: string) { super(message); }
}

export type McpDeps = {
  connections: (user: string) => Promise<SourceConnection[]>;
  call: (user: string, connection: string, tool: string, args: Record<string, unknown>) => Promise<{ text: string; structured: unknown }>;
  adapters?: readonly Adapter[];
};

/** The records the source holds, as files: <folder>/<id>.json, each a Naive record from the adapter. */
export async function answerMcp(r: McpListRequest, deps: McpDeps): Promise<McpItem[]> {
  const adapters = (deps.adapters ?? ADAPTERS).filter((a) => a.service === r.api && (!r.folder || a.folder === r.folder));
  const connection = (await deps.connections(r.user)).find((c) => c.connector === r.api && sourceIdOf(r.api, c.id) === r.source);
  // M4: a connection that is gone, expired or kept from this business is unreachable, and says so; nothing falls back.
  if (!connection || connection.status !== "connected" || !(connection.businesses === null || connection.businesses.includes(r.venture)))
    throw new McpRefusal(409, `The ${r.api} connection this business reads from is not available to it. Choose a source again.`);
  const items: McpItem[] = [];
  for (const a of adapters) {
    const { text, structured } = await deps.call(r.user, connection.id, a.read, a.args);
    for (const raw of itemsOf(structured, text)) {
      const rec = a.toRecord(raw);
      if (rec) items.push({ path: `${a.folder}/${rec.id}.json`, content: `${JSON.stringify(rec, null, 2)}\n` });
    }
  }
  return items;
}
