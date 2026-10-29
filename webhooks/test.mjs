#!/usr/bin/env node
// Tests for the systems-of-record webhook (V-9, platform): a signed notification marks what reads the
// changed item stale; a bad signature, an unknown venture or source, a missing secret, a GET and a body
// that is not JSON are refused, and refused ones mark nothing. Offline: the server listens on 127.0.0.1
// on a free port, in a temporary workspace.

import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { call } from "../../interface/router.mjs";
import { stale } from "../../schema/stale.mjs";
import { sign, webhooks } from "./server.mjs";

const repo = new URL("../..", import.meta.url).pathname;
let failed = 0;
const expect = (name, ok, detail = "") => { console.log(`${ok ? "pass" : "FAIL"}  ${name}${ok ? "" : `  ${detail}`}`); if (!ok) failed++; };

const ws = mkdtempSync(join(tmpdir(), "webhooks-test-"));
const dir = join(ws, "shop");
spawnSync("node", [join(repo, "schema/init-venture.mjs"), dir, "shop", "--layers", "purpose"], { encoding: "utf8" });
mkdirSync(join(ws, "crm/customers"), { recursive: true });
writeFileSync(join(ws, "crm/customers/acme.json"), JSON.stringify({ id: "acme", name: "Acme" }) + "\n");
mkdirSync(join(dir, "knowledge"), { recursive: true });
writeFileSync(join(dir, "knowledge/sources.json"), JSON.stringify({ sources: [{ id: "crm", connector: "filesystem", root: join(ws, "crm"), writes: "none" }], records: {} }, null, 2));
const product = { id: "shop", name: "Shop", description: "Bookings for Acme and shops like it" };
const w = await call({ venture: "shop", workspace: ws, route: "product/shop", action: "write", input: product, actor: "person", provenance: { derived_from: ["crm://customers/acme.json"] } });
expect("a summary is written from the CRM's record", w.ok, w.error);

const env = { NAIVE_WEBHOOK_SECRET_CRM: "s3cret-for-tests", NAIVE_WEBHOOK_SECRET_BILLING: "billing-secret" };
const server = webhooks({ workspace: ws, env });
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${server.address().port}`;
const post = (path, body, secret = env.NAIVE_WEBHOOK_SECRET_CRM, method = "POST") => {
  const raw = typeof body === "string" ? body : JSON.stringify(body);
  return fetch(`${base}${path}`, { method, headers: { "content-type": "application/json", ...(secret ? { "x-naive-signature": sign(secret, raw) } : {}) }, ...(method === "POST" ? { body: raw } : {}) });
};

try {
  const bad = await post("/webhooks/shop/crm", { paths: ["customers/acme.json"] }, "wrong secret");
  expect("a notification signed with the wrong secret is refused (401)", bad.status === 401);
  expect("a refused notification marks nothing", stale(dir).length === 0);
  const none = await post("/webhooks/shop/crm", { paths: ["customers/acme.json"] }, null);
  expect("an unsigned notification is refused (401)", none.status === 401);
  const nosecret = await post("/webhooks/shop/rho", { paths: ["money/summary.json"] }, "anything");
  expect("a source with no secret configured refuses every notification (401)", nosecret.status === 401);
  const venture = await post("/webhooks/nobody/crm", { paths: ["customers/acme.json"] });
  expect("an unknown venture is 404", venture.status === 404);
  const get = await post("/webhooks/shop/crm", null, null, "GET");
  expect("a GET is 405", get.status === 405);
  const notjson = await post("/webhooks/shop/crm", "not json");
  expect("a body that is not JSON is 400", notjson.status === 400);
  const escape = await post("/webhooks/shop/crm", { paths: ["../outside.json"] });
  expect("a path that climbs out of the source is 400", escape.status === 400);

  const ok = await post("/webhooks/shop/crm", { paths: ["customers/acme.json"], version: "v2" });
  const body = await ok.json();
  expect("a signed notification is accepted (202) and names what it marked", ok.status === 202 && body.stale?.includes("product/shop.json"), JSON.stringify(body));
  const read = await call({ venture: "shop", workspace: ws, route: "product/shop", action: "read" });
  expect("the router says the summary is stale, and why", read.ok && read.stale?.because?.[0]?.source === "crm" && read.stale.because[0].via === "provenance", JSON.stringify(read.stale));
  const unknown = await post("/webhooks/shop/billing", { paths: ["x.json"] }, "billing-secret");
  expect("a correctly signed notification from a source the venture does not have is 404", unknown.status === 404);
} finally { server.close(); }

console.log(failed ? `\n${failed} failing` : "\nall passing");
process.exit(failed ? 1 : 0);
