// Reflect's two sides (doc "Private and shared Reflect plan", 2026-11-19): Home, the person and the household, is
// private; Village and polis is shared and public facing. Each page belongs to one side, a few belong to neither
// (the chat, Settings, the Marketplace, signing in). With a custom domain the shared side has its own host,
// `polis.<domain>` (Torian, 2026-11-19: "I'll accept Polis for right now"); without one (previews, local) both sides
// share a host and the path alone says which side a page is on.

export type Side = "home" | "polis";

/** Paths on the shared side. `/v` is its home page (the polis host's `/`). */
export const SHARED_PATHS = ["/v", "/events", "/adventures", "/connect", "/p", "/life/polis"] as const;
/** Paths that belong to neither side and open on whichever host they were asked for. */
export const NEUTRAL_PATHS = ["/chat", "/settings", "/marketplace", "/sign-in", "/consent", "/api", "/icon", "/apple-icon"] as const;
/** App folders whose every page is on the shared side, checked by the wall test (sides-wall.test.ts). */
export const SHARED_ROUTE_DIRS = ["v", "events", "adventures", "connect", "p"] as const;

const under = (path: string, base: string) => path === base || path.startsWith(`${base}/`);

/** The side a path is on, or null for a page on neither. */
export function sideOfPath(path: string): Side | null {
  const p = path.split(/[?#]/)[0] || "/";
  if (NEUTRAL_PATHS.some((b) => under(p, b))) return null;
  return SHARED_PATHS.some((b) => under(p, b)) ? "polis" : "home";
}

/** The parent domain whose cookies both hosts share, from the site's address; none on localhost or vercel.app. */
export function cookieDomainOf(siteUrl: string | undefined): string | null {
  if (!siteUrl) return null;
  try {
    const host = new URL(siteUrl).hostname.toLowerCase();
    if (host === "localhost" || /^[\d.]+$/.test(host) || host.startsWith("[") || host.endsWith(".vercel.app") || !host.includes(".")) return null;
    return host.replace(/^www\./, "");
  } catch {
    return null;
  }
}

/** The shared side's host, `polis.<domain>`, or null when both sides share one host. */
export function polisHostOf(siteUrl: string | undefined): string | null {
  const d = cookieDomainOf(siteUrl);
  return d ? `polis.${d}` : null;
}

/**
 * Where a link to `path` goes from a page served on `hostSide`: the same path when both sides share a host or the
 * path is on this host's side, else the other host's address. The polis host serves `/v` at `/`.
 */
export function hrefOn(path: string, hostSide: Side, origins: { home: string; polis: string | null }): string {
  if (!origins.polis) return path;
  const side = sideOfPath(path);
  if (side === null || side === hostSide) return hostSide === "polis" && path === "/v" ? "/" : path;
  if (side === "polis") return `${origins.polis}${path === "/v" ? "/" : path}`;
  return `${origins.home}${path}`;
}
