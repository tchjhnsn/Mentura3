#!/usr/bin/env node
// Fetches a remote image for a venture (J-3), the platform half of Next.js remotePatterns. The
// framework records a remote image as a link with a note in raw/ (interface/brand.mjs addRemote);
// this fetcher is the only part that reaches the network, so it lives in platform/ (EE-041).
//
//   - The host must be in the venture's remote_hosts (public/assets.json): the list of hosts an
//     agent may fetch from. A redirect to another host is checked again; any other host is refused.
//   - The original is kept private at raw/sources/<id>/original.<ext>, which stays out of git.
//   - A full copy goes to public/ only with --copy, and only when the license allows a copy.
//   - Facts (type, width, height, bytes, sha256) are read from the bytes by code (schema/assets.mjs).
//
//   node platform/integrations/remote-image.mjs <url> --venture <id> --license <id> --credit <who>
//        [--id <raw id>] [--alt <text>] [--copy public/<file>] [--workspace <dir>] [--json]

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { ventureDir } from "../../interface/router.mjs";
import { addAsset, addRemote } from "../../interface/brand.mjs";
import { allowsCopy, factsOf, hostAllowed, IMAGE, registerOf } from "../../schema/assets.mjs";

const MAX_BYTES = 20 * 1024 * 1024;
const EXT = { png: "png", gif: "gif", jpeg: "jpg", webp: "webp", ico: "ico", svg: "svg" };

/** Fetches url, following at most three redirects, each to a host the venture allows. */
export async function fetchAllowed(url, hosts, { fetchImpl = fetch } = {}) {
  let at = url;
  for (let hop = 0; hop < 4; hop++) {
    const u = new URL(at);
    if (!/^https?:$/.test(u.protocol)) throw new Error(`${at}: only http and https are fetched`);
    if (!hostAllowed(u.host, hosts)) throw new Error(`${u.host} is not in remote_hosts, the hosts an agent may fetch from; a person adds it with mentura assets hosts`);
    const res = await fetchImpl(at, { redirect: "manual" });
    if (res.status >= 300 && res.status < 400 && res.headers.get("location")) { at = new URL(res.headers.get("location"), at).href; continue; }
    if (!res.ok) throw new Error(`${at}: HTTP ${res.status}`);
    const size = Number(res.headers.get("content-length") ?? 0);
    if (size > MAX_BYTES) throw new Error(`${at}: ${size} bytes is more than ${MAX_BYTES}`);
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > MAX_BYTES) throw new Error(`${at}: more than ${MAX_BYTES} bytes`);
    return { url: at, buf };
  }
  throw new Error(`${url}: too many redirects`);
}

/** @param {{ venture: string, workspace?: string, url: string, license?: string, credit?: string, id?: string, alt?: string, copy?: string, actor?: string, fetchImpl?: typeof fetch }} opts */
export async function fetchRemoteImage({ venture, workspace, url, license, credit, id, alt, copy, actor = "agent", fetchImpl }) {
  const dir = ventureDir(venture, workspace);
  if (!dir) return { ok: false, error: `no venture ${venture}` };
  if (!license) return { ok: false, error: "say the image's license: --license <id>" };
  if (copy && !copy.startsWith("public/")) return { ok: false, error: `${copy} is not in public/` };
  if (copy && !allowsCopy(license)) return { ok: false, error: `license ${license} does not allow a full copy; link to the image instead (leave out --copy)` };
  if (copy && existsSync(join(dir, copy))) return { ok: false, error: `${copy} is already there` };
  const hosts = registerOf(dir)?.remote_hosts ?? [];
  let got;
  try { got = await fetchAllowed(url, hosts, { fetchImpl }); } catch (e) { return { ok: false, error: String(e.message ?? e) }; }
  const f = factsOf(got.buf);
  if (!IMAGE.has(f.type)) return { ok: false, error: `${url} is ${f.type}, not an image` };
  const fetched = Object.fromEntries(Object.entries({ type: f.type, width: f.width, height: f.height, sizes: f.sizes, bytes: f.bytes, sha256: f.sha256, filled_at: new Date().toISOString() }).filter(([, v]) => v !== undefined));
  if (copy) {
    if (!copy.toLowerCase().endsWith(`.${EXT[f.type]}`) && !(f.type === "jpeg" && /\.jpe?g$/i.test(copy))) return { ok: false, error: `${copy}: the image is ${f.type}; name it .${EXT[f.type]}` };
    mkdirSync(dirname(join(dir, copy)), { recursive: true });
    writeFileSync(join(dir, copy), got.buf);
    const a = await addAsset(/** @type {Parameters<typeof addAsset>[0]} */ ({ venture, workspace, path: copy, source: url, license, credit, alt, origin_url: url, actor }));
    if (!a.ok) return a;
  }
  const r = await addRemote(/** @type {Parameters<typeof addRemote>[0]} */ ({ venture, workspace, url, license, credit, id, alt, fetched, copy, actor }));
  if (!r.ok) return r;
  // The original stays private: raw/sources/<id>/original.* is ignored by git (EE-070).
  const original = join(r.result.raw, `original.${EXT[f.type]}`);
  writeFileSync(join(dir, original), got.buf);
  return { ok: true, result: { ...r.result, original, facts: fetched } };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const argv = process.argv.slice(2);
  const opt = (n) => { const i = argv.indexOf(`--${n}`); return i >= 0 ? argv[i + 1] : undefined; };
  const url = argv.find((a, i) => !a.startsWith("--") && !(i > 0 && argv[i - 1].startsWith("--") && argv[i - 1] !== "--json"));
  if (!url || !opt("venture")) { console.error("usage: node platform/integrations/remote-image.mjs <url> --venture <id> --license <id> --credit <who> [--id <raw id>] [--alt <text>] [--copy public/<file>]"); process.exit(2); }
  const r = await fetchRemoteImage({ venture: opt("venture"), workspace: opt("workspace") ? resolve(opt("workspace")) : undefined, url, license: opt("license"), credit: opt("credit"), id: opt("id"), alt: opt("alt"), copy: opt("copy"), actor: opt("as") === "person" ? "person" : "agent" });
  if (!r.ok) { console.error(r.error); process.exit(1); }
  console.log(argv.includes("--json") ? JSON.stringify(r.result, null, 2) : `fetched ${url}: ${r.result.facts.type} ${r.result.facts.width ?? "?"}x${r.result.facts.height ?? "?"}, original kept private at ${r.result.original}${r.result.copy ? `, copy at ${r.result.copy}` : ""}`);
}
