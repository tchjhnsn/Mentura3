#!/usr/bin/env node
// Rho, the founder's bank and spend suite, as the venture's money source (platform, EE-041). Rho stays
// the system of record for money (EE-070): this writes the venture's money data package as pointers
// and a summary, never as Naive's own books. It speaks Rho's MCP server over HTTP (JSON-RPC, no
// dependencies) and calls only tools Rho marks read-only.
//
//   node platform/integrations/rho.mjs sync --venture <dir> [--live] [--fixture <file>] [--save-fixture <file>]
//
//   default          Rho's sandbox (fictional company, any token, shared by all callers)
//   --live           the founder's Rho, with RHO_API_TOKEN (scopes accounts:read, transactions:read)
//   --fixture        replays a saved sync offline (tests, or a demo with no network)
//   --save-fixture   keeps what Rho answered, for --fixture later
//
// The package it writes (data package shape, PR #23 stage C):
//   money/<rho id>.json                                master record, with a rho:account pointer
//   money/_streams/transactions/stream.json            sensitive: kept out of git and out of traces
//   money/_streams/transactions/YYYY/MM/<date>-<id>.json   append-only; a resync never rewrites one
//   money/_summary.json                                 versioned: cash, net burn, runway, as of when
//
// Amounts stay in minor units (cents for USD), as Rho returns them.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ventureFile } from "../../schema/venture-paths.mjs";

export const SANDBOX = "https://rhoapi-sandbox.rho.co/mcp/v1";
export const LIVE = "https://rhoapi.rho.co/mcp/v1";
const PROTOCOL = "2025-06-18";

// One MCP call over Streamable HTTP. Rho answers either JSON or a one-event SSE stream.
export function client(url, token) {
  let id = 0, session = null, tools = null;
  const rpc = async (method, params) => {
    const res = await fetch(url, { method: "POST", signal: AbortSignal.timeout(60000), headers: {
      "content-type": "application/json", accept: "application/json, text/event-stream", authorization: `Bearer ${token}`,
      "mcp-protocol-version": PROTOCOL, ...(session ? { "mcp-session-id": session } : {}) }, body: JSON.stringify({ jsonrpc: "2.0", id: ++id, method, params }) });
    if (!res.ok) throw new Error(`Rho answered ${res.status} to ${method}`);
    session = res.headers.get("mcp-session-id") ?? session;
    const body = await res.text();
    const msg = JSON.parse(body.trimStart().startsWith("{") ? body : body.split("\n").filter((l) => l.startsWith("data: ")).map((l) => l.slice(6)).join(""));
    if (msg.error) throw new Error(`Rho ${method}: ${msg.error.message}`);
    return msg.result;
  };
  return {
    async init() {
      await rpc("initialize", { protocolVersion: PROTOCOL, capabilities: {}, clientInfo: { name: "naive-money", version: "1" } });
      tools = new Map((await rpc("tools/list", {})).tools.map((t) => [t.name, t]));
    },
    async call(name, args = {}) {
      const t = tools?.get(name);
      if (!t) throw new Error(`Rho has no tool ${name}`);
      if (t.annotations?.readOnlyHint !== true) throw new Error(`${name} is not read-only: Naive never writes to the system of record`);
      const r = await rpc("tools/call", { name, arguments: args });
      if (r.isError) throw new Error(`${name}: ${r.content?.[0]?.text ?? "error"}`);
      return JSON.parse(r.content[0].text);
    },
  };
}

// Every page of a list tool.
async function all(rho, name, key, args = {}) {
  const out = [];
  let token;
  do {
    const page = await rho.call(name, { ...args, page_size: 100, ...(token ? { page_token: token } : {}) });
    out.push(...(page[key] ?? []));
    token = page.page?.next_page_token;
  } while (token);
  return out;
}

export async function pull({ url, token }) {
  const rho = client(url, token);
  await rho.init();
  const business = await rho.call("getBusiness").catch(() => null);
  const accounts = await all(rho, "listAccounts", "accounts");
  const transactions = await all(rho, "listTransactions", "transactions", { order: "asc" });
  const last = transactions.map((t) => t.posted_at ?? t.initiated_at).filter(Boolean).sort().at(-1);
  const to = last ?? new Date().toISOString();
  const from = new Date(Date.parse(to) - 90 * 864e5).toISOString();
  const cashflow = await rho.call("getCashflow", { from, to, group: "month" });
  return { source: url === LIVE ? "rho" : "rho-sandbox", business, accounts, transactions, cashflow: { from, to, ...cashflow } };
}

const CASH = new Set(["checking", "savings"]);
const usd = (n) => ({ amount: n, currency: "USD" });

// The summary is the only money record that is versioned and the only one an agent or a trace sees.
// Burn comes from Rho's cash flow (business-level in and out, so moves between the business's own
// accounts don't count), over the 90 days that end at the latest activity, which the summary names.
export function summarize(data, syncedAt) {
  const cash = data.accounts.filter((a) => CASH.has(a.account_type)).reduce((s, a) => s + (a.balance?.amount ?? 0), 0);
  const buckets = data.cashflow.buckets ?? [];
  const sum = (k) => buckets.reduce((s, b) => s + (b[k]?.amount ?? 0), 0);
  const days = Math.max(1, (Date.parse(data.cashflow.to) - Date.parse(data.cashflow.from)) / 864e5);
  const monthly = (n) => Math.round((n / days) * 30);
  const net = monthly(sum("net_amount"));
  return {
    source: data.source, business: data.business?.name ?? data.business?.legal_name ?? null, synced_at: syncedAt,
    as_of: data.cashflow.to, window: { from: data.cashflow.from, to: data.cashflow.to },
    cash: usd(cash), monthly_inflow: usd(monthly(sum("inflow_amount"))), monthly_outflow: usd(monthly(sum("outflow_amount"))), monthly_net: usd(net),
    runway_months: net < 0 ? Math.round((cash / -net) * 10) / 10 : null,
    accounts: data.accounts.length, transactions: data.transactions.length,
    note: net < 0 ? "Runway is cash over the average monthly net outflow in the window." : "Net cash flow is not negative in the window, so runway is not limited by burn.",
  };
}

const json = (f, v) => { mkdirSync(join(f, ".."), { recursive: true }); writeFileSync(f, `${JSON.stringify(v, null, 2)}\n`); };

export function write(venture, data, syncedAt = new Date().toISOString()) {
  const money = join(ventureFile(venture, "money"));
  const pointer = (kind, id) => `${data.source}:${kind}:${id}`;
  for (const a of data.accounts)
    json(join(money, `${a.id}.json`), { id: a.id, name: a.account_name, type: a.account_type, last_4: a.account_number_last_4 ?? null, balance: a.balance, source: pointer("account", a.id), synced_at: syncedAt });
  const stream = join(money, "_streams/transactions");
  // The stream's declaration, as schema/stream.schema.json has it. Its events are append-only and stay out of git.
  json(join(stream, "stream.json"), { id: "transactions", sensitive: true,
    summary: `Every transaction ${data.source} posted, one file each, as Rho returned it; Rho is the system of record. The versioned view is money/_summary.json.` });
  let added = 0;
  for (const t of data.transactions) {
    const at = t.posted_at ?? t.initiated_at;
    const f = join(stream, at.slice(0, 4), at.slice(5, 7), `${at.slice(0, 10)}-${t.id}.json`);
    if (existsSync(f)) continue;
    json(f, { id: t.id, at, amount: t.amount, counterparty: t.counterparty_name ?? null, type: t.transaction_type, status: t.status, account: pointer("account", t.account_id), source: pointer("transaction", t.id), fields: t.fields ?? [] });
    added++;
  }
  // Sensitive streams never reach git (stage C of PR #23 makes this a framework rule).
  const ignore = join(money, ".gitignore");
  if (!existsSync(ignore)) writeFileSync(ignore, "_streams/transactions/*/\n");
  const summary = summarize(data, syncedAt);
  json(join(money, "_summary.json"), summary);
  return { added, summary };
}

const argv = process.argv.slice(2);
if (import.meta.url === `file://${process.argv[1]}`) {
  const opt = (n) => { const i = argv.indexOf(`--${n}`); return i >= 0 ? argv[i + 1] : undefined; };
  const venture = opt("venture");
  if (argv[0] !== "sync" || !venture) { console.error("usage: node platform/integrations/rho.mjs sync --venture <dir> [--live] [--fixture <file>] [--save-fixture <file>]"); process.exit(2); }
  const live = argv.includes("--live");
  if (live && !process.env.RHO_API_TOKEN) { console.error("RHO_API_TOKEN is not set"); process.exit(3); }
  const data = opt("fixture") ? JSON.parse(readFileSync(opt("fixture"), "utf8"))
    : await pull(live ? { url: LIVE, token: process.env.RHO_API_TOKEN } : { url: SANDBOX, token: "sandbox" });
  if (opt("save-fixture")) json(opt("save-fixture"), data);
  const { added, summary } = write(venture, data);
  console.log(JSON.stringify({ venture, added, summary }, null, 2));
}
