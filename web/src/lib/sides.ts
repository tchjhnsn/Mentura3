// Reflect's two sides (doc "Private and shared Reflect plan", 2026-11-19): Home, the person and the household, is
// private; Village and polis is shared and public facing. Each page belongs to one side, a few belong to neither
// (the chat, Settings, the Marketplace, signing in). With a custom domain the shared side has its own host,
// `polis.<domain>` (Torian, 2026-11-19: "I'll accept Polis for right now"); without one (previews, local) both sides
// share a host and the path alone says which side a page is on.

export type Side = "home" | "polis";

/** Paths on the shared side. `/v` is its home page (the polis host's `/`). */
export const SHARED_PATHS = ["/v", "/events", "/adventures", "/connect", "/p", "/life/polis"] as const;
/** Paths that belong to neither side and open on whichever host they were asked for. */
export const NEUTRAL_PATHS = ["/chat", "/settings", "/marketplace", "/sign-in", "/consent", "/api", "/icon", "/apple-icon", "/meetings", "/m"] as const;
/**
 * Mentura's pages (Torian, 2026-11-21: meetings belong to Mentura, not the personal side; the Ventures app is its Venture Studio). They are served on the main
 * host like the neutral paths, and the sidebar shows Mentura's navigation on them.
 */
export const MENTURA_PATHS = ["/mentura", "/meetings", "/m", "/life/ventures"] as const;
/** The navigation a page shows: a side, or Mentura. */
export type Space = Side | "mentura";
/** Which navigation a path shows: Mentura's on its pages, else its side, else null (a page on neither). */
export function spaceOfPath(path: string): Space | null {
  const p = path.split(/[?#]/)[0] || "/";
  if (MENTURA_PATHS.some((b) => p === b || p.startsWith(`${b}/`))) return "mentura";
  return sideOfPath(p);
}

/** App folders whose every page is on the shared side, checked by the wall test (sides-wall.test.ts). */
export const SHARED_ROUTE_DIRS = ["v", "events", "adventures", "connect", "p"] as const;

/**
 * Server modules that hold the person's or the household's own records, which no page on the shared side may import
 * by path (sides-wall.test.ts). A shared page reaches what it shows through a module that returns only the shared part
 * (`@/server/adventures` returns adventure records only). Read and decided one by one, 2026-11-19. Left off on
 * purpose: `kept-works` and `learn-shelves` (pure helpers over what a caller passes, no records of their own) and
 * `profile-store`, `events-store`, `connect-store`, `site-store` (the shared side's own records, with their audiences).
 */
export const PRIVATE_STORES = [
  "journal-store", // journal entries and reflections, sealed with the person's key
  "household-store", // the household's members and facts, sealed with the household's key
  "budget", // the monthly budget, a hidden Home record of the person's
  "spending-store", // receipts, hidden Home records of the person's
  "meals-store", // meals and the shopping list, Home records scaled to the household
  "examination-store", // a candidate's examinations, sealed with their key
  "me-store", // the person's stated facts, beliefs and values
  "ideas-store", // the person's own ideas and their inputs
  "claims-store", // claims and stances in Learn
  "legacy-store", // the legacy release plan: trustees, recipients and their parts
  "calendar-store", // the person's calendar events across tiles
  "calendar-feeds", // the calendars the person subscribes to
  "plan", // the household plan built from Home, Work and the household
  "life-store", // every tile app's records (Work, Home, Body, Friends, Mate, Kin, Polis, Legacy), sealed together
  "messages-store", // the person's conversations
  "messages-db", // the rows behind messages: friend links, invites and sealed message text
  "learn-store", // books, subjects and grasps in Learn
  "learn-reason-store", // why the person is learning a course, a work of their journal
  "learn-sources-store", // uploads, credentials and transcripts the person adds to Learn
  "person-store", // what onboarding produced about the person
  "work-store", // the journal's works, sealed with the person's key
  "book-store", // the book of the person's life: beliefs and editions
  "item-store", // items and their sealed, hash-chained events
  "excerpt-store", // excerpts the person keeps from books
  "ways-store", // what the person keeps to learn from (books, talks, films)
  "quiz-store", // the person's quizzes and answers
  "workflow-store", // the person's saved plans of actions
  "venture-files-store", // a venture's files, sealed with the person's key
  "home-cards-store", // Home cards, hidden life records
  "qualities", // what the person wrote about each quality they keep
  "log-store", // the log, read from all the person's records
] as const;

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
