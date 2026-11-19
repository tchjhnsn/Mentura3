// Whether an outside site lets itself be shown in a frame (Panes design guide, The browser pane): the pane's browser
// tab asks before it frames a site, so a site that refuses shows "Open in a new tab" instead of a blank frame. The
// answer comes from the site's own headers: X-Frame-Options, and Content-Security-Policy's frame-ancestors.

export type FrameVerdict = { ok: true } | { ok: false; reason: string };

/** Reads a response's headers for whether a page at `origin` may frame it. */
export function frameVerdict(headers: Headers, origin: string): FrameVerdict {
  const xfo = headers.get("x-frame-options")?.trim().toLowerCase();
  if (xfo === "deny" || xfo === "sameorigin") return { ok: false, reason: `the site sends X-Frame-Options: ${xfo.toUpperCase()}` };
  const csp = headers.get("content-security-policy") ?? "";
  const fa = csp.split(";").map((d) => d.trim()).find((d) => d.toLowerCase().startsWith("frame-ancestors"));
  if (fa) {
    const sources = fa.split(/\s+/).slice(1).map((s) => s.toLowerCase());
    const host = new URL(origin).host.toLowerCase();
    const allowed = sources.some((s) => s === "*" || s === origin.toLowerCase() || s === `https://${host}` || (s.startsWith("https://*.") && host.endsWith(s.slice("https://*".length))) || (s === "https:" && origin.startsWith("https:")));
    if (!allowed) return { ok: false, reason: "the site's Content-Security-Policy does not list Reflect in frame-ancestors" };
  }
  return { ok: true };
}

/** True for an address that is not a public website: localhost, private and link-local ranges, internal names. */
export function privateHost(hostname: string): boolean {
  const h = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (h === "localhost" || h.endsWith(".localhost") || h.endsWith(".local") || h.endsWith(".internal") || !h.includes(".") && !h.includes(":")) return true;
  const v4 = h.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (v4) {
    const [a, b] = [Number(v4[1]), Number(v4[2])];
    return a === 0 || a === 10 || a === 127 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224;
  }
  if (h.includes(":")) return h === "::1" || h === "::" || h.startsWith("fc") || h.startsWith("fd") || h.startsWith("fe80") || h.startsWith("::ffff:");
  return false;
}

/** The address someone typed as a URL: https:// added when it has no scheme; null when it is not a public http(s) site. */
export function siteUrl(typed: string): URL | null {
  const t = typed.trim();
  if (!t) return null;
  try {
    const u = new URL(/^[a-z][a-z0-9+.-]*:/i.test(t) ? t : `https://${t}`);
    if (u.protocol !== "https:" && u.protocol !== "http:") return null;
    if (u.username || u.password || privateHost(u.hostname)) return null;
    return u;
  } catch {
    return null;
  }
}
