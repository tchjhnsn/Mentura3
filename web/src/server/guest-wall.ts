// The guest wall (doc "Mentura meetings and building-only Mentura design guide", 2026-11-19): an account made from a
// meeting invite (guest_user, ./meetings-store.ts) sees only its meetings. The proxy (src/proxy.ts) hands each page
// request's path to the app in PATH_HEADER, overwriting whatever the browser sent, and requireUser()
// (./session.ts) sends a guest account to /meetings from any page outside GUEST_PATHS. Pure, so it is tested alone.

/** The request header the proxy sets to the page's path. */
export const PATH_HEADER = "x-reflect-path";

/** Paths a guest account may open: its meetings, invite links, signing in, and Settings (to become a member). */
export const GUEST_PATHS = ["/meetings", "/m", "/sign-in", "/settings"] as const;

/** Where the wall sends a guest account. */
export const GUEST_HOME = "/meetings";

const under = (path: string, base: string) => path === base || path.startsWith(`${base}/`);

/**
 * Whether a guest account may open `path`. A path of null means the proxy did not run (it skips the API, whose
 * routes check access record by record), so nothing is walled there.
 */
export function guestMayOpen(path: string | null | undefined): boolean {
  if (path == null) return true;
  const p = path.split(/[?#]/)[0] || "/";
  return GUEST_PATHS.some((b) => under(p, b));
}
