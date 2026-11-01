#!/usr/bin/env node
// Webhooks from systems of record (V-9, platform): a CRM, a bank or a spend tool calls Mentura when
// something it holds changes, the way a CMS calls a Next.js revalidation webhook. The request is checked
// (an HMAC-SHA256 signature of the raw body with the source's shared secret), and the framework marks
// every summary that reads the changed items stale (schema/stale.mjs notify). Nothing is fetched and no
// record is rewritten here: the next write of each summary makes it fresh.
//
//   node platform/webhooks/server.mjs [--port 4330] [--host 127.0.0.1] [--workspace <dir>]
//
//   POST /webhooks/<venture id>/<source id>
//     header  x-naive-signature: sha256=<hex HMAC-SHA256 of the raw body>
//     body    { "paths": ["customers/acme.json"], "version": "<the source's version, optional>", "at": "<when, optional>" }
//     202     { "venture", "source", "paths", "stale": [the files marked stale] }
//
// The secret is NAIVE_WEBHOOK_SECRET_<SOURCE> (the source id upper-cased, hyphens as underscores), else
// NAIVE_WEBHOOK_SECRET; with neither set every request is refused. A source must be in the venture's
// knowledge/sources.json. It binds to 127.0.0.1 by default; put it behind the platform's TLS to expose it.

import { createHmac, timingSafeEqual } from "node:crypto";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { ventureDir } from "../../interface/router.mjs";
import { notify } from "../../schema/stale.mjs";

const MAX = 256 * 1024;
export const secretFor = (source, env = process.env) => env[`NAIVE_WEBHOOK_SECRET_${source.toUpperCase().replace(/-/g, "_")}`] ?? env.NAIVE_WEBHOOK_SECRET ?? null;
export const sign = (secret, body) => `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`;

function verified(secret, body, header) {
  if (!secret || typeof header !== "string") return false;
  const want = Buffer.from(sign(secret, body)), got = Buffer.from(header);
  return want.length === got.length && timingSafeEqual(want, got);
}

/** The webhook server over a workspace. env supplies the secrets (default process.env). */
export function webhooks({ workspace = process.env.MENTURA_WORKSPACE, env = process.env } = {}) {
  return createServer((req, res) => {
    const send = (code, body) => { res.writeHead(code, { "content-type": "application/json" }); res.end(JSON.stringify(body) + "\n"); };
    const m = req.url?.match(/^\/webhooks\/([a-z0-9][a-z0-9-]*)\/([a-z][a-z0-9-]*)\/?$/);
    if (!m) return send(404, { error: "POST /webhooks/<venture id>/<source id>" });
    if (req.method !== "POST") return send(405, { error: "webhooks are POST" });
    const chunks = [];
    let size = 0;
    req.on("data", (c) => { size += c.length; if (size > MAX) { send(413, { error: `a notification is at most ${MAX / 1024} KB` }); req.destroy(); } else chunks.push(c); });
    req.on("end", () => {
      if (size > MAX) return;
      const raw = Buffer.concat(chunks);
      const [, venture, source] = m;
      if (!verified(secretFor(source, env), raw, req.headers["x-naive-signature"])) return send(401, { error: "the signature does not match this source's secret" });
      const dir = ventureDir(venture, workspace);
      if (!dir) return send(404, { error: `no venture ${venture}` });
      let body;
      try { body = JSON.parse(raw.toString("utf8")); } catch { return send(400, { error: "the body is not JSON" }); }
      const paths = [body.paths ?? body.path].flat().filter((p) => typeof p === "string" && p && !p.startsWith("/") && !p.split("/").includes(".."));
      if (!paths.length) return send(400, { error: "name the changed items in paths" });
      try {
        const r = notify(dir, { source, paths, version: typeof body.version === "string" ? body.version : undefined, at: typeof body.at === "string" ? body.at : undefined, via: "webhook" });
        return send(202, { venture, ...r });
      } catch (e) { return send(/no source/.test(e.message) ? 404 : 400, { error: e.message }); }
    });
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const a = process.argv.slice(2);
  const opt = (n, d) => { const i = a.indexOf(`--${n}`); return i >= 0 ? a[i + 1] : d; };
  const workspace = opt("workspace") ? resolve(opt("workspace")) : process.env.MENTURA_WORKSPACE;
  const s = webhooks({ workspace });
  s.listen(Number(opt("port", 4330)), opt("host", "127.0.0.1"), () => console.log(`webhooks on http://${opt("host", "127.0.0.1")}:${/** @type {import("node:net").AddressInfo} */ (s.address()).port}/webhooks/<venture>/<source> for ${workspace ?? "this repository's instance/"}`));
}
