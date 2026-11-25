// The MCP connector (spec "Integrations: formal specification", Sources of truth design, step 2). A source map entry
// { "id": "mcp-stripe-1a2b3c4d", "connector": "mcp", "api": "stripe", "writes": "none" } reads one kind of record
// from a service the person connected in Reflect, through the person's own MCP sign-in. The sign-in never leaves the
// web server: each read asks it over one internal route (NAIVE_MCP_URL, /api/naive/mcp), signed with the bridge key
// by a signer the bridge hands this module (actAs), so no environment variable carries the key. The web server picks
// the connection from the source id, checks it is the person's and open to the business, runs the adapter's read tool
// and answers with the records as files: Stripe's customer cus_123 is customers/cus_123.json. Read-only: writes wait
// for a person's Send (M7), so write always throws.
import { createHmac } from "node:crypto";
import { blobSha, matches, safePath } from "naive-framework/src/store/connectors/contract.mjs";

type Acting = { user: string; venture: string; key: string };
let acting: Acting | null = null;

/** The bridge says who is acting, for which business, and with which key, once the assertion checks out. */
export function actAs(a: Acting | null): void {
  acting = a;
}

/** The signature the web route checks: HMAC-SHA256 of the exact body, hex. */
export const signBody = (body: string, key: string): string => createHmac("sha256", key).update(body).digest("hex");

type Fetch = (url: string, init: { method: string; headers: Record<string, string>; body: string }) => Promise<Response>;
type Held = { path: string; content: string };

export function connect({ id = "mcp", api, writes = "none", url = process.env.NAIVE_MCP_URL, fetch: f = globalThis.fetch as Fetch }: { id?: string; api?: string; writes?: string; url?: string; fetch?: Fetch } = {}) {
  if (!api || !/^[a-z][a-z0-9-]*$/.test(api)) throw new Error(`the mcp connector needs api as a catalog service id, not ${api}`);
  if (writes !== "none") throw new Error("the mcp connector is read-only: writes to a service wait for a person's Send");

  async function held(folder?: string): Promise<Held[]> {
    if (!acting) throw new Error("the mcp connector reads only inside a signed request from Reflect");
    if (!url) throw new Error("the mcp connector needs NAIVE_MCP_URL, the Reflect address to ask");
    const body = JSON.stringify({ op: "list", user: acting.user, venture: acting.venture, source: id, api, ...(folder ? { folder } : {}), at: Date.now() });
    const res = await f(url, { method: "POST", headers: { "content-type": "application/json", "x-naive-signature": signBody(body, acting.key) }, body });
    const data = (await res.json().catch(() => null)) as { items?: Held[]; error?: string } | null;
    if (!res.ok || !data?.items) throw new Error(data?.error ?? `Reflect could not read ${api} (${res.status})`);
    return data.items;
  }
  const folderOf = (p: string) => safePath(p).split("/")[0] || undefined;

  return {
    id,
    writes: "none" as const,
    async list(prefix = "") {
      const items = await held(prefix ? folderOf(prefix) : undefined);
      return items.filter((i) => i.path.startsWith(prefix)).map((i) => ({ path: i.path, version: blobSha(i.content) })).sort((a, b) => a.path.localeCompare(b.path));
    },
    async read(path: string) {
      const p = safePath(path);
      const hit = (await held(folderOf(p))).find((i) => i.path === p);
      return hit ? { path: p, content: hit.content, version: blobSha(hit.content) } : null;
    },
    async version(path: string) {
      const p = safePath(path);
      const hit = (await held(folderOf(p))).find((i) => i.path === p);
      return hit ? blobSha(hit.content) : null;
    },
    async search(query: string, { limit = 20 } = {}) {
      return (await held()).filter((i) => matches(i.content, query)).slice(0, limit).map((i) => ({ path: i.path, version: blobSha(i.content) }));
    },
    async write(): Promise<never> {
      throw new Error(`${api} is read-only here: Reflect does not write to it without a person's Send`);
    },
  };
}
