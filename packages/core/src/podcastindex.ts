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

/** Apple's finds first, then Podcast Index's shows Apple did not find, matched by title. */
export function mergeShowFinds(apple: readonly Found[], index: readonly Found[], limit = 16): Found[] {
  const seen = new Set(apple.map((f) => f.title.toLowerCase()));
  return [...apple, ...index.filter((f) => !seen.has(f.title.toLowerCase()))].slice(0, limit);
}
