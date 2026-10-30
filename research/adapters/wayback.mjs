// The Wayback Machine: find the snapshot closest to a date, and request one at access time.
import { getWithRetry, json } from "./http.mjs";

export async function closest(url, timestamp, opts = {}) {
  const q = `https://archive.org/wayback/available?url=${encodeURIComponent(url)}${timestamp ? `&timestamp=${timestamp}` : ""}`;
  const snap = (await json(await getWithRetry(q, opts))).archived_snapshots?.closest;
  return snap?.available ? { archive_url: snap.url, at: snap.timestamp } : null;
}
export async function save(url, opts = {}) {
  const res = await getWithRetry(`https://web.archive.org/save/${url}`, opts);
  return res.ok ? { archive_url: res.headers?.get?.("content-location") ? `https://web.archive.org${res.headers.get("content-location")}` : `https://web.archive.org/web/${url}` } : null;
}
