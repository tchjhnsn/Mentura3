// Podcast Index (podcastindex.org), the open index of podcast feeds, as a second place to find shows beside
// Apple's search: it holds shows Apple does not, and gives each show's feed itself. Its API needs a key and a
// secret (free, from api.podcastindex.org); without them Reflect searches Apple alone.

import type { Found } from "./lookup";

/** The headers each request carries: the key, the time, and the SHA-1 of key, secret and time (Podcast Index's API docs, "Authentication"). */
export async function podcastIndexHeaders(key: string, secret: string, nowSeconds = Math.floor(Date.now() / 1000)): Promise<Record<string, string>> {
  const date = String(nowSeconds);
  const digest = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(key + secret + date));
  const hex = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
  return { "X-Auth-Key": key, "X-Auth-Date": date, Authorization: hex, "User-Agent": "reflect-app" };
}

export const podcastIndexSearchUrl = (term: string, max = 10) => `https://api.podcastindex.org/api/1.0/search/byterm?q=${encodeURIComponent(term)}&max=${max}&clean`;

const https = (v: unknown): string | undefined => (typeof v === "string" && /^https?:\/\//i.test(v) ? v.replace(/^http:/i, "https:") : undefined);
const text = (v: unknown): string | undefined => (typeof v === "string" && v.trim() ? v.trim() : undefined);

/** The shows in a search answer, each found by its feed. Dead feeds (Podcast Index's `dead`) are left out. */
export function readPodcastIndex(body: unknown): Found[] {
  const feeds = body && typeof body === "object" && Array.isArray((body as { feeds?: unknown }).feeds) ? (body as { feeds: unknown[] }).feeds : [];
  const out: Found[] = [];
  for (const f of feeds) {
    if (!f || typeof f !== "object") continue;
    const r = f as Record<string, unknown>;
    const title = text(r.title), url = typeof r.url === "string" && /^https?:\/\//i.test(r.url) ? r.url : undefined;
    if (!title || !url || r.dead === 1) continue;
    const by = text(r.author) ?? text(r.ownerName), image = https(r.artwork) ?? https(r.image);
    out.push({ medium: "podcast", title, ...(by ? { by } : {}), url, ...(image ? { image } : {}), source: "Podcast Index" });
  }
  return out;
}

// Two open indexes that need no key (Torian, 2026-11-15 06:14Z "go"): fyyd (fyyd.de) and gpodder.net. Both give
// each show's feed.

export const fyydSearchUrl = (term: string, count = 10) => `https://api.fyyd.de/0.2/search/podcast?title=${encodeURIComponent(term)}&count=${count}`;
export const gpodderSearchUrl = (term: string) => `https://gpodder.net/search.json?q=${encodeURIComponent(term)}`;

const feedUrl = (v: unknown): string | undefined => (typeof v === "string" && /^https?:\/\//i.test(v) ? v : undefined);

/** fyyd's shows in Reflect's language (or with none given), leaving out feeds fyyd last found broken. */
export function readFyyd(body: unknown): Found[] {
  const data = body && typeof body === "object" && Array.isArray((body as { data?: unknown }).data) ? (body as { data: unknown[] }).data : [];
  const out: Found[] = [];
  for (const d of data) {
    if (!d || typeof d !== "object") continue;
    const r = d as Record<string, unknown>;
    const title = text(r.title), url = feedUrl(r.xmlURL);
    if (!title || !url || (typeof r.status === "number" && r.status >= 400) || (text(r.language) && !/^en/i.test(String(r.language)))) continue;
    const by = text(r.author), image = https(r.imgURL) ?? https(r.smallImageURL);
    out.push({ medium: "podcast", title, ...(by ? { by } : {}), url, ...(image ? { image } : {}), source: "fyyd" });
  }
  return out;
}

/** gpodder.net's shows, most followed first, up to ten. */
export function readGpodder(body: unknown): Found[] {
  const rows = Array.isArray(body) ? body : [];
  return rows
    .filter((r): r is Record<string, unknown> => Boolean(r) && typeof r === "object")
    .sort((a, b) => Number(b.subscribers ?? 0) - Number(a.subscribers ?? 0))
    .flatMap((r) => {
      const title = text(r.title), url = feedUrl(r.url);
      if (!title || !url) return [];
      const by = text(r.author)?.replace(/\s*\([^)]*@[^)]*\)\s*$/, ""), image = https(r.logo_url);
      return [{ medium: "podcast" as const, title, ...(by ? { by } : {}), url, ...(image ? { image } : {}), source: "gpodder.net" }];
    })
    .slice(0, 10);
}

/** Apple's finds first, then each other index's shows not already found, matched by title. */
export function mergeShowFinds(apple: readonly Found[], others: readonly (readonly Found[])[], limit = 20): Found[] {
  const seen = new Set(apple.map((f) => f.title.toLowerCase()));
  const out = [...apple];
  for (const list of others) for (const f of list) { const k = f.title.toLowerCase(); if (!seen.has(k)) { seen.add(k); out.push(f); } }
  return out.slice(0, limit);
}
