import { NextResponse, type NextRequest } from "next/server";
import { polisHostOf, sideOfPath } from "@/lib/sides";

// A person's own domain (doc "Personal site and blog design guide", 2026-11-18): a request to a host that is not one of
// Reflect's own is looked up among sites' checked domains, and its paths are served from that person's site:
// "/" is their profile, "/<slug>" a post, "/feed.xml" the feed. Reflect's own hosts pass straight through.

const OWN = /(^|\.)(localhost|vercel\.app)$|^127\.0\.0\.1$|^\[::1\]$/;
const cache = new Map<string, { key: string | null; at: number }>();
const TTL = 60_000;

const siteBase = () => process.env.REFLECT_URL ?? process.env.BETTER_AUTH_URL;

function ownHosts(): Set<string> {
  const out = new Set<string>();
  const polis = polisHostOf(siteBase());
  if (polis) out.add(polis);
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

/**
 * Home and Village and polis on their own hosts (doc "Private and shared Reflect plan", 2026-11-19), only once the
 * site has a custom domain (REFLECT_URL): the polis host serves the shared side, `/` being its home page (/v), and
 * sends a Home page to the main host; the main host sends a shared page to the polis host; production's vercel.app
 * address sends everything to the domain, since the sign-in cookie lives there. Pages on neither side stay put.
 * Without a custom domain (previews, local) nothing moves and both sides share a host.
 */
function sides(req: NextRequest, host: string): NextResponse | null {
  const base = siteBase();
  const polis = polisHostOf(base);
  if (!base || !polis) return null;
  const home = new URL(base);
  const path = req.nextUrl.pathname;
  if (/\.[a-z0-9]+$/i.test(path)) return null; // files (photos, the feed) open on either host
  const to = (h: string, p: string) => {
    const url = new URL(`${p}${req.nextUrl.search}`, `https://${h}`);
    return NextResponse.redirect(url, 308);
  };
  if (host === polis) {
    if (path === "/") { const url = req.nextUrl.clone(); url.pathname = "/v"; return NextResponse.rewrite(url); }
    if (path === "/v") return to(polis, "/");
    return sideOfPath(path) === "home" ? to(home.hostname, path) : NextResponse.next();
  }
  if (host === home.hostname) return sideOfPath(path) === "polis" ? to(polis, path === "/v" ? "/" : path) : NextResponse.next();
  if (host.endsWith(".vercel.app") && process.env.VERCEL_ENV === "production") return to(home.hostname, path);
  return null;
}

export async function proxy(req: NextRequest) {
  const host = (req.headers.get("host") ?? "").split(":")[0]!.toLowerCase();
  const moved = host ? sides(req, host) : null;
  if (moved) return moved;
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
