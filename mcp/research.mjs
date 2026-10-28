#!/usr/bin/env node
// Market research for agents, through Firecrawl (platform, EE-041): an MCP server, stdio, no
// dependencies. It names a vendor and needs a credential, so it lives on the platform side; the
// Naive harness hands it to an agent next to Naive's own MCP server. Every result carries its URL,
// so an agent can cite it as evidence (EE-050) and nothing it reports is unsourced.
//
//   FIRECRAWL_API_KEY=... node platform/mcp/research.mjs
//
// Tools: research_search searches the web (Firecrawl /v1/search); research_read reads one page as
// Markdown (Firecrawl /v1/scrape), for quoting what a result says.

import { createInterface } from "node:readline";

const API = "https://api.firecrawl.dev/v1";
export const TOOLS = [
  { name: "research_search", description: "Search the web for market research (competitors, existing alternatives, prices, complaints, market size) through Firecrawl. Returns each result's title, URL and snippet. Cite the URL of anything you use as evidence; never state a finding without one.",
    inputSchema: { type: "object", properties: { queries: { type: "array", items: { type: "string" }, maxItems: 5, description: "Up to five search queries" }, results: { type: "integer", minimum: 1, maximum: 10, description: "Results per query (default 5)" } }, required: ["queries"] } },
  { name: "research_read", description: "Read one web page as Markdown through Firecrawl, to quote what it says. Use it on a URL research_search returned.",
    inputSchema: { type: "object", properties: { url: { type: "string" }, chars: { type: "integer", minimum: 500, maximum: 20000, description: "Characters to return (default 6000)" } }, required: ["url"] } },
];

const key = () => {
  const k = process.env.FIRECRAWL_API_KEY;
  if (!k) throw new Error("FIRECRAWL_API_KEY is not set: research is unavailable, so say so rather than guessing");
  return k;
};
async function post(path, body) {
  const res = await fetch(`${API}${path}`, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${key()}` }, body: JSON.stringify(body), signal: AbortSignal.timeout(60000) });
  if (!res.ok) throw new Error(`Firecrawl answered ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return res.json();
}

export async function search({ queries, results = 5 }) {
  const pages = await Promise.all(queries.slice(0, 5).map(async (q) => ({ q, r: await post("/search", { query: q, limit: results }) })));
  return pages.flatMap(({ q, r }) => (r.data ?? []).slice(0, results).map((x) => ({ query: q, title: x.title ?? x.metadata?.title ?? null, url: x.url, snippet: x.description ?? x.metadata?.description ?? null })));
}

export async function read({ url, chars = 6000 }) {
  const r = await post("/scrape", { url, formats: ["markdown"], onlyMainContent: true });
  return { url, title: r.data?.metadata?.title ?? null, markdown: (r.data?.markdown ?? "").slice(0, chars) };
}

export async function handle({ id, method, params = {} }) {
  const reply = (result) => ({ jsonrpc: "2.0", id, result });
  switch (method) {
    case "initialize": return reply({ protocolVersion: "2025-06-18", capabilities: { tools: {} }, serverInfo: { name: "research", version: "0.1.0" }, instructions: "Research the market with research_search (and research_read to quote a page) and cite every URL you use." });
    case "notifications/initialized": case "notifications/cancelled": return null;
    case "ping": return reply({});
    case "tools/list": return reply({ tools: TOOLS });
    case "tools/call": {
      const fn = { research_search: search, research_read: read }[params.name];
      if (!fn) return { jsonrpc: "2.0", id, error: { code: -32602, message: `unknown tool ${params.name}` } };
      try { return reply({ content: [{ type: "text", text: JSON.stringify(await fn(params.arguments ?? {}), null, 2) }], isError: false }); }
      catch (e) { return reply({ content: [{ type: "text", text: String(e.message ?? e) }], isError: true }); }
    }
    default: return id === undefined ? null : { jsonrpc: "2.0", id, error: { code: -32601, message: `method not found: ${method}` } };
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const rl = createInterface({ input: process.stdin });
  let chain = Promise.resolve();
  rl.on("line", (line) => { chain = chain.then(async () => { if (!line.trim()) return; const out = await handle(JSON.parse(line)); if (out) process.stdout.write(JSON.stringify(out) + "\n"); }); });
}
