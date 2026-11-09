// The GitHub channel for raw capture (Naive docs/design/RAW_TRIAGE_2026-11-09.md, item 6): a push that adds files
// under raw/ in a connected repository becomes raw rows in the tenant's store, and the store's trigger wakes triage
// (raw-intake.ts). The repository is a channel; raw lives in the store.
//
//   node platform/intake/github-push.ts --tenant <id> --repo <owner/name> [--port 4331] [--host 127.0.0.1]
//
//   POST /intake/github          GitHub's push webhook
//     header  x-hub-signature-256: sha256=<hex HMAC-SHA256 of the raw body with the webhook's secret>
//     header  x-github-event: push (ping answers 200 and writes nothing)
//     202     { written: [paths], skipped: [{ path, reason }] }
//
// The secret is MENTURA_INTAKE_GITHUB_SECRET; without it every request is refused. Only files the push ADDED are
// taken: raw is immutable, so a modified or removed raw file is reported and written nowhere. Only these are raw:
// raw/dump/<id>.md, raw/sources/<id>/source.json and raw/sources/<id>/text.md. An original (raw/sources/<id>/original.*)
// never comes from git. Contents are read at the push's head commit through the GitHub connector, with GITHUB_TOKEN.

import { createHmac, timingSafeEqual } from "node:crypto";
import { createServer, type Server } from "node:http";
import { connect as githubConnect } from "../connectors/github.mjs";
import { connect as postgresConnect } from "../connectors/postgres.ts";

const MAX = 1024 * 1024;
const RAW_FILE = /^raw\/(dump\/[a-z0-9][a-z0-9-]*\.md|sources\/[a-z0-9][a-z0-9-]*\/(source\.json|text\.md))$/;

export const sign = (secret: string, body: Buffer | string): string => `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`;

export function verified(secret: string | undefined, body: Buffer, header: unknown): boolean {
  if (!secret || typeof header !== "string") return false;
  const want = Buffer.from(sign(secret, body)), got = Buffer.from(header);
  return want.length === got.length && timingSafeEqual(want, got);
}

export interface Store { write(path: string, content: string, opts?: { base?: string | null }): Promise<unknown> }
export type Reader = (repo: string, sha: string, path: string) => Promise<string | null>;

interface Push { ref?: unknown, after?: unknown, repository?: { full_name?: unknown }, commits?: { added?: unknown, modified?: unknown, removed?: unknown }[] }

const strings = (x: unknown): string[] => Array.isArray(x) ? x.filter((s): s is string => typeof s === "string") : [];

/** What a push adds under raw/, and what it touches there that is skipped. source.json goes before text.md. */
export function rawChanges(push: Push): { take: string[], skipped: { path: string, reason: string }[] } {
  const added = new Set<string>(), changed = new Set<string>();
  for (const c of push.commits ?? []) {
    for (const p of strings(c.added)) added.add(p);
    for (const p of [...strings(c.modified), ...strings(c.removed)]) changed.add(p);
  }
  const skipped: { path: string, reason: string }[] = [];
  const take: string[] = [];
  for (const p of [...added].sort()) {
    if (!p.startsWith("raw/")) continue;
    if (changed.has(p)) skipped.push({ path: p, reason: "added and then changed in the same push; raw is immutable, so add it once" });
    else if (RAW_FILE.test(p)) take.push(p);
    else skipped.push({ path: p, reason: /\/original\.[^/]+$/.test(p) ? "an original never comes from git" : "not a raw file (raw/dump/<id>.md, raw/sources/<id>/source.json or text.md)" });
  }
  for (const p of [...changed].sort()) if (p.startsWith("raw/") && !added.has(p)) skipped.push({ path: p, reason: "raw is immutable: a change to a raw file is not taken" });
  take.sort((a, b) => Number(a.endsWith("text.md")) - Number(b.endsWith("text.md")) || a.localeCompare(b));
  return { take, skipped };
}

/** Writes the raw files a push added into the store. A path the store already holds is left as it is. */
export async function intakePush(push: Push, { repo, store, read }: { repo: string, store: Store, read: Reader }):
  Promise<{ written: string[], skipped: { path: string, reason: string }[] }> {
  const full = typeof push.repository?.full_name === "string" ? push.repository.full_name : "";
  if (full !== repo) return { written: [], skipped: [{ path: "", reason: `the push is from ${full || "an unnamed repository"}, not ${repo}` }] };
  const sha = typeof push.after === "string" && /^[0-9a-f]{40}$/.test(push.after) ? push.after : null;
  if (!sha) return { written: [], skipped: [{ path: "", reason: "the push names no head commit" }] };
  const { take, skipped } = rawChanges(push);
  const written: string[] = [];
  for (const p of take) {
    const content = await read(repo, sha, p);
    if (content === null) { skipped.push({ path: p, reason: `not found at ${sha}` }); continue; }
    try { await store.write(p, content, { base: null }); written.push(p); }
    catch (e) {
      if (e instanceof Error && e.name === "VersionConflict") skipped.push({ path: p, reason: "the store already holds it" });
      else throw e;
    }
  }
  return { written, skipped };
}

/** Reads a file at a commit through the GitHub connector. */
export const githubReader = (token = "GITHUB_TOKEN"): Reader => async (repo, sha, path) =>
  (await githubConnect({ repo, ref: sha, token }).read(path))?.content ?? null;

/** The webhook server. */
export function githubIntake({ repo, store, read, secret = process.env.MENTURA_INTAKE_GITHUB_SECRET }: { repo: string, store: Store, read: Reader, secret?: string }): Server {
  return createServer((req, res) => {
    const send = (code: number, body: unknown) => { res.writeHead(code, { "content-type": "application/json" }); res.end(JSON.stringify(body) + "\n"); };
    if (req.url?.replace(/\/$/, "") !== "/intake/github") return send(404, { error: "POST /intake/github" });
    if (req.method !== "POST") return send(405, { error: "the intake webhook is POST" });
    const chunks: Buffer[] = [];
    let size = 0;
    req.on("data", (c: Buffer) => { size += c.length; if (size > MAX) { send(413, { error: `a push is at most ${MAX / 1024} KB` }); req.destroy(); } else chunks.push(c); });
    req.on("end", async () => {
      if (size > MAX) return;
      const raw = Buffer.concat(chunks);
      if (!verified(secret, raw, req.headers["x-hub-signature-256"])) return send(401, { error: "the signature does not match the intake secret" });
      const event = req.headers["x-github-event"];
      if (event === "ping") return send(200, { ok: true });
      if (event !== "push") return send(202, { written: [], skipped: [{ path: "", reason: `a ${String(event)} event is not a push` }] });
      let push: Push;
      try { push = JSON.parse(raw.toString("utf8")) as Push; } catch { return send(400, { error: "the body is not JSON" }); }
      try { return send(202, await intakePush(push, { repo, store, read })); }
      catch (e) { return send(500, { error: e instanceof Error ? e.message : String(e) }); }
    });
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const a = process.argv.slice(2);
  const opt = (n: string, d?: string) => { const i = a.indexOf(`--${n}`); return i >= 0 ? a[i + 1] : d; };
  const tenant = opt("tenant"), repo = opt("repo");
  if (!tenant || !repo) { console.error("usage: github-push.ts --tenant <id> --repo <owner/name> [--port 4331] [--host 127.0.0.1]"); process.exit(2); }
  const s = githubIntake({ repo, store: postgresConnect({ tenant }), read: githubReader() });
  const host = opt("host", "127.0.0.1") ?? "127.0.0.1", port = Number(opt("port", "4331"));
  s.listen(port, host, () => console.log(`raw intake from ${repo} into tenant ${tenant} on http://${host}:${port}/intake/github`));
}
