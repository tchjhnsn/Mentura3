// The Wayback Machine: search captures (CDX), find the snapshot closest to a date, and request one
// at access time. Archive links are always https.
import { getWithRetry, json } from "./http.mjs";
/** @typedef {import("./http.mjs").HttpOpts} HttpOpts */

const https = (u) => u?.replace(/^http:\/\//, "https://");
const archiveUrl = (ts, original) => `https://web.archive.org/web/${ts}/${original}`;

export async function closest(url, timestamp, opts = {}) {
  const q = `https://archive.org/wayback/available?url=${encodeURIComponent(url)}${timestamp ? `&timestamp=${timestamp}` : ""}`;
  const snap = (await json(await getWithRetry(q, opts))).archived_snapshots?.closest;
  return snap?.available ? { archive_url: https(snap.url), at: snap.timestamp } : null;
}

// CDX search: captures of a URL or of every page under it (matchType prefix/host/domain), within
// from-to (yyyy or yyyyMMdd...), one per distinct page by default, successful captures only.
/** @param {string} url @param {HttpOpts & { from?: string | number, to?: string | number, matchType?: string, limit?: number, collapse?: string, status?: string, mime?: string }} [opts] */
export async function search(url, { from, to, matchType = "prefix", limit = 200, collapse = "urlkey", status = "200", mime, ...opts } = {}) {
  const p = new URLSearchParams({ url, output: "json", matchType, limit: String(limit) });
  if (from) p.set("from", String(from));
  if (to) p.set("to", String(to));
  if (collapse) p.set("collapse", collapse);
  const filters = [];
  if (status) filters.push(`statuscode:${status}`);
  if (mime) filters.push(`mimetype:${mime}`);
  let q = `https://web.archive.org/cdx/search/cdx?${p}`;
  for (const f of filters) q += `&filter=${encodeURIComponent(f)}`;
  const rows = await json(await getWithRetry(q, opts));
  if (!Array.isArray(rows) || rows.length < 2) return [];
  const [head, ...data] = rows;
  const col = (r, k) => r[head.indexOf(k)];
  return data.map((r) => ({ original: col(r, "original"), at: col(r, "timestamp"), mime: col(r, "mimetype"), status: col(r, "statuscode"), length: Number(col(r, "length")) || null, archive_url: archiveUrl(col(r, "timestamp"), col(r, "original")) }));
}

export async function save(url, opts = {}) {
  const res = await getWithRetry(`https://web.archive.org/save/${url}`, opts);
  return res.ok ? { archive_url: res.headers?.get?.("content-location") ? `https://web.archive.org${res.headers.get("content-location")}` : `https://web.archive.org/web/${url}` } : null;
}
