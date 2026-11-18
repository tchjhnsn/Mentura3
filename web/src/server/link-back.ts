// Confirming a link by link-back (doc "Profiles and accounts design guide", 2026-11-18): Reflect fetches the page a
// person linked and looks for a rel="me" link back to their profile, the check Mastodon uses. The fetch is a request
// to an address the person typed, so it is fenced: https only, no IP-literal, localhost or dotless host, no host that
// resolves to a private address, at most three redirects (each host checked again), 8 seconds and 1 MB.
import { lookup as dnsLookup } from "node:dns/promises";
import { isIP } from "node:net";
import { linksBack, relMeLinks } from "@reflect/core/profile";
import { siteOrigins, siteUrl } from "./site";

export const LINK_BACK_TIMEOUT_MS = 8000;
export const LINK_BACK_MAX_BYTES = 1024 * 1024;
export const LINK_BACK_MAX_REDIRECTS = 3;

/** Why a url may not be fetched, or null when it may. Checks the address as written, not where it resolves. */
export function urlProblem(raw: string): string | null {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return "That is not a link.";
  }
  if (u.protocol !== "https:") return "Only https links can be confirmed.";
  if (u.username || u.password) return "A link with a sign-in in it cannot be confirmed.";
  if (u.port && u.port !== "443") return "A link with a port cannot be confirmed.";
  const host = u.hostname.toLowerCase().replace(/\.$/, "");
  if (host.startsWith("[") || isIP(host)) return "A link to an IP address cannot be confirmed.";
  if (/^\d+$/.test(host.replace(/\./g, "")) || /^0x/i.test(host)) return "A link to an IP address cannot be confirmed.";
  if (host === "localhost" || host.endsWith(".localhost")) return "A link to this computer cannot be confirmed.";
  if (!host.includes(".")) return "A link needs a full web address.";
  if (/\.(local|internal|lan|home|arpa)$/.test(host)) return "A link to a private network cannot be confirmed.";
  return null;
}

/** Whether an address is private, loopback, link-local or otherwise not on the public internet. */
export function privateAddress(ip: string): boolean {
  if (isIP(ip) === 4) {
    const [a, b] = ip.split(".").map(Number) as [number, number];
    return a === 0 || a === 10 || a === 127 || (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 198 && (b === 18 || b === 19)) || a >= 224;
  }
  const v = ip.toLowerCase();
  if (v === "::" || v === "::1") return true;
  const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/.exec(v);
  if (mapped) return privateAddress(mapped[1]!);
  return v.startsWith("fc") || v.startsWith("fd") || v.startsWith("fe8") || v.startsWith("fe9") || v.startsWith("fea") || v.startsWith("feb") || v.startsWith("ff");
}

export type LinkBackDeps = {
  fetch?: typeof fetch;
  /** Every address a host resolves to. */
  lookup?: (host: string) => Promise<string[]>;
};

const defaultLookup = async (host: string) => (await dnsLookup(host, { all: true, verbatim: true })).map((a) => a.address);

/** Reads at most `max` bytes of a body as text, then stops reading. */
async function readCapped(res: Response, max: number): Promise<string> {
  if (!res.body) return "";
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (size < max) {
    const { done, value } = await reader.read();
    if (done || !value) break;
    const room = max - size;
    chunks.push(value.length > room ? value.subarray(0, room) : value);
    size += Math.min(value.length, room);
  }
  await reader.cancel().catch(() => undefined);
  const all = new Uint8Array(size);
  let at = 0;
  for (const c of chunks) {
    all.set(c, at);
    at += c.length;
  }
  return new TextDecoder("utf-8", { fatal: false }).decode(all);
}

/**
 * Fetches a page under the fence above and returns its html. Throws with a plain reason when the url is refused or
 * the page cannot be read.
 */
export async function fetchPage(url: string, deps: LinkBackDeps = {}): Promise<string> {
  const f = deps.fetch ?? fetch;
  const lookup = deps.lookup ?? defaultLookup;
  const signal = AbortSignal.timeout(LINK_BACK_TIMEOUT_MS);
  let at = url;
  for (let hop = 0; hop <= LINK_BACK_MAX_REDIRECTS; hop++) {
    const p = urlProblem(at);
    if (p) throw new Error(p);
    const host = new URL(at).hostname;
    const addrs = await lookup(host).catch(() => [] as string[]);
    if (!addrs.length) throw new Error("That page's address could not be found.");
    if (addrs.some(privateAddress)) throw new Error("A link to a private network cannot be confirmed.");
    let res: Response;
    try {
      res = await f(at, { redirect: "manual", signal, headers: { accept: "text/html,application/xhtml+xml", "user-agent": "Reflect link check" } });
    } catch (e) {
      throw new Error(e instanceof Error && (e.name === "TimeoutError" || e.name === "AbortError") ? "That page took too long to answer." : "That page could not be reached.");
    }
    if (res.status >= 300 && res.status < 400) {
      const next = res.headers.get("location");
      await res.body?.cancel().catch(() => undefined);
      if (!next) throw new Error("That page could not be read.");
      at = new URL(next, at).toString();
      continue;
    }
    if (!res.ok) throw new Error(`That page answered ${res.status}.`);
    return readCapped(res, LINK_BACK_MAX_BYTES);
  }
  throw new Error("That page redirects too many times.");
}

/** The hostnames a profile link may use: every address this deployment answers on. */
export const siteHosts = (): string[] => [...new Set(siteOrigins().map((o) => new URL(o).hostname.toLowerCase()))];

/** The exact tag a person adds to their page so it links back to their profile. */
export const relMeLine = (key: string): string => `<a rel="me" href="${siteUrl()}/p/${encodeURIComponent(key)}">Reflect</a>`;

/** Whether the page at `url` links back with rel="me" to the profile of the person with this handle or id. */
export async function checkLinkBack(url: string, who: { userId: string; handle: string | null }, deps: LinkBackDeps = {}): Promise<boolean> {
  const html = await fetchPage(url, deps);
  return linksBack(relMeLinks(html), siteHosts(), [who.userId, who.handle ?? ""]);
}
