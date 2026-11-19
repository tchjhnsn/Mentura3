// The app's one public address. OAuth tokens for MCP clients are bound to `${siteUrl()}/api/mcp`, so the
// address has to be fixed per deployment: REFLECT_URL or BETTER_AUTH_URL when set, else the production domain Vercel gives,
// else the branch's preview address, else local development.
import { cookieDomainOf, polisHostOf } from "@/lib/sides";

export function siteUrl(): string {
  const set = process.env.REFLECT_URL ?? process.env.BETTER_AUTH_URL;
  if (set) return set.replace(/\/$/, "");
  if (process.env.VERCEL_ENV === "production" && process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (process.env.VERCEL_BRANCH_URL) return `https://${process.env.VERCEL_BRANCH_URL}`;
  return "http://localhost:3000";
}

/** Every address this deployment answers on, so sign-in works from any of them. */
export function siteOrigins(): string[] {
  const out = new Set([siteUrl()]);
  const polis = polisOrigin();
  if (polis) out.add(polis);
  for (const v of [process.env.VERCEL_URL, process.env.VERCEL_BRANCH_URL, process.env.VERCEL_PROJECT_PRODUCTION_URL]) if (v) out.add(`https://${v}`);
  return [...out];
}

/** The parent domain both sides' cookies sit on, or null when they share one host (./../lib/sides.ts). */
export const cookieDomain = (): string | null => cookieDomainOf(siteUrl());
/** The shared side's address, `https://polis.<domain>`, or null when it shares Home's host and lives at /v. */
export function polisOrigin(): string | null {
  const h = polisHostOf(siteUrl());
  return h ? `https://${h}` : null;
}

export const mcpResource = (): string => `${siteUrl()}/api/mcp`;
