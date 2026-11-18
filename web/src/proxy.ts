import { NextResponse, type NextRequest } from "next/server";

// A person's own domain (doc "Personal site and blog design guide", 2026-11-18): a request to a host that is not one of
// Reflect's own is looked up among sites' checked domains, and its paths are served from that person's site:
// "/" is their profile, "/<slug>" a post, "/feed.xml" the feed. Reflect's own hosts pass straight through.

const OWN = /(^|\.)(localhost|vercel\.app)$|^127\.0\.0\.1$|^\[::1\]$/;
const cache = new Map<string, { key: string | null; at: number }>();
const TTL = 60_000;

function ownHosts(): Set<string> {
  const out = new Set<string>();
  for (const v of [process.env.REFLECT_URL, process.env.BETTER_AUTH_URL]) if (v) try { out.add(new URL(v).hostname.toLowerCase()); } catch {}
  for (const v of [process.env.VERCEL_URL, process.env.VERCEL_BRANCH_URL, process.env.VERCEL_PROJECT_PRODUCTION_URL]) if (v) out.add(v.toLowerCase());
  return out;
}

async function siteKey(host: string): Promise<string | null> {
  const hit = cache.get(host);
  if (hit && Date.now() - hit.at < TTL) return hit.key;
  const { siteForDomain } = await import("@/server/site-store");
  const s = await siteForDomain(host).catch(() => null);
  const key = s ? (s.handle ?? s.userId) : null;
  cache.set(host, { key, at: Date.now() });
  return key;
}

export async function proxy(req: NextRequest) {
  const host = (req.headers.get("host") ?? "").split(":")[0]!.toLowerCase();
  if (!host || OWN.test(host) || ownHosts().has(host)) return NextResponse.next();
  const path = req.nextUrl.pathname;
  if (path.startsWith("/p/") || /\.(?!xml$)[a-z0-9]+$/i.test(path)) return NextResponse.next();
  const key = await siteKey(host);
  if (!key) return NextResponse.next();
  const url = req.nextUrl.clone();
  url.pathname = `/p/${encodeURIComponent(key)}${path === "/" ? "" : path}`;
  return NextResponse.rewrite(url);
}

export const config = {
  // Pages only: not Next's files or the API. Files with an extension other than the feed pass through above.
  matcher: ["/((?!_next/|api/).*)"],
};
