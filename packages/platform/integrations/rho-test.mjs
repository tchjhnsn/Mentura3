#!/usr/bin/env node
// Tests for the Rho money source, offline: a saved sandbox sync becomes the money data package, a
// resync appends nothing twice, and the client refuses any Rho tool that is not read-only.
import { createServer } from "node:http";
import { existsSync, mkdtempSync, readFileSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { client, summarize, write } from "./rho.mjs";

let failed = 0;
const t = async (name, fn) => { try { await fn(); console.log(`ok   ${name}`); } catch (e) { failed++; console.log(`FAIL ${name}: ${e.message}`); } };
const ok = (c, m) => { if (!c) throw new Error(m); };
const fixture = JSON.parse(readFileSync(new URL("./fixtures/rho-sandbox.json", import.meta.url), "utf8"));
const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)]);

await t("a sync writes accounts, one stream file per transaction, a sensitive stream and a summary", () => {
  const v = mkdtempSync(join(tmpdir(), "rho-"));
  const { added, summary } = write(v, fixture, "2026-10-29T00:00:00Z");
  ok(added === fixture.transactions.length, `added ${added}`);
  ok(readdirSync(join(v, "money")).filter((f) => f.endsWith(".json") && !f.startsWith("_")).length === fixture.accounts.length, "accounts");
  ok(JSON.parse(readFileSync(join(v, "money/_streams/transactions/stream.json"), "utf8")).sensitive === true, "stream not sensitive");
  ok(readFileSync(join(v, "money/.gitignore"), "utf8").includes("_streams/transactions/"), "stream not ignored");
  const f = walk(join(v, "money/_streams/transactions")).find((x) => !x.endsWith("stream.json"));
  ok(/^rho-sandbox:transaction:/.test(JSON.parse(readFileSync(f, "utf8")).source), "no pointer to Rho");
  ok(summary.cash.amount > 0 && summary.as_of && summary.synced_at === "2026-10-29T00:00:00Z", JSON.stringify(summary));
  ok(!JSON.stringify(summary).includes(":transaction:"), "the summary carries a transaction");
});

await t("a resync is append-only: nothing is written twice", () => {
  const v = mkdtempSync(join(tmpdir(), "rho-"));
  write(v, fixture);
  ok(write(v, fixture).added === 0, "resync appended");
});

await t("runway is cash over the monthly net outflow, and absent when the venture is not burning", () => {
  const base = { source: "x", accounts: [{ account_type: "checking", balance: { amount: 120000 } }, { account_type: "credit", balance: { amount: -5000 } }], transactions: [] };
  const burning = summarize({ ...base, cashflow: { from: "2026-01-01T00:00:00Z", to: "2026-01-31T00:00:00Z", buckets: [{ net_amount: { amount: -30000 } }] } }, "now");
  ok(burning.cash.amount === 120000 && burning.monthly_net.amount === -30000 && burning.runway_months === 4, JSON.stringify(burning));
  const earning = summarize({ ...base, cashflow: { from: "2026-01-01T00:00:00Z", to: "2026-01-31T00:00:00Z", buckets: [{ net_amount: { amount: 100 } }] } }, "now");
  ok(earning.runway_months === null, "runway on a positive month");
});

await t("the client calls read-only tools and refuses the rest, over a fake Rho", async () => {
  const server = createServer((req, res) => {
    let b = ""; req.on("data", (c) => (b += c)); req.on("end", () => {
      const m = JSON.parse(b);
      const result = m.method === "tools/list" ? { tools: [{ name: "listAccounts", annotations: { readOnlyHint: true } }, { name: "updateTransactionNote", annotations: { readOnlyHint: false } }] }
        : m.method === "tools/call" ? { content: [{ type: "text", text: JSON.stringify({ accounts: [] }) }] } : {};
      res.setHeader("content-type", "text/event-stream");
      res.end(`event: message\ndata: ${JSON.stringify({ jsonrpc: "2.0", id: m.id, result })}\n\n`);
    });
  });
  await /** @type {Promise<void>} */ (new Promise((r) => server.listen(0, "127.0.0.1", r)));
  try {
    const rho = client(`http://127.0.0.1:${/** @type {import("node:net").AddressInfo} */ (server.address()).port}/mcp/v1`, "x");
    await rho.init();
    ok(Array.isArray((await rho.call("listAccounts")).accounts), "read failed");
    let refused = false;
    try { await rho.call("updateTransactionNote", { note: "x" }); } catch (e) { refused = /not read-only/.test(e.message); }
    ok(refused, "a write tool was called");
  } finally { server.close(); }
});

if (failed) { console.log(`\n${failed} failing`); process.exit(1); }
console.log("\nall passing");
