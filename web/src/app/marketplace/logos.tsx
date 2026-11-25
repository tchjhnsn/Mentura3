// Connector logos: each brand's own full-colour mark, as the brand publishes it, in `public/logos/<id>.svg|png`
// (Torian, 2026-11-18: one-colour icons "don't look authentic"). Sources: svgl.app (press-kit SVGs), the brands' own
// sites (their app icons), Wikimedia Commons (Google Docs) and gilbarbara/logos (Intercom, monday.com). Every mark sits
// on a white tile in both themes, as in Claude's directory, so no brand needs a dark variant. A connector without one
// keeps its initial on a colour from its id (`Mark`).
import { cn } from "@/lib/utils";
import { Mark } from "./parts";

const SVG = ["amplitude", "atlassian", "calendly", "canva", "cloudflare", "figma", "github", "gmail", "google-calendar", "google-docs", "google-drive", "google-sheets", "huggingface", "intercom", "linear", "microsoft-calendar", "monday", "neon", "notion", "posthog", "resend", "sentry", "shopify", "slack", "supabase", "vercel", "workos"];
const PNG = ["apple-health", "etsy", "instacart", "plaid", "strava", "stripe", "zapier"];

/** The file for a connector's logo, or null when Reflect has none. */
export const logoSrc = (id: string): string | null => (SVG.includes(id) ? `/logos/${id}.svg` : PNG.includes(id) ? `/logos/${id}.png` : null);

/** A connector's logo tile: the brand's own mark on white when Reflect has it, else its initial. */
export function Logo({ id, name, size = "size-10", glyph = "size-6" }: { id: string; name: string; size?: string; glyph?: string }) {
  const src = logoSrc(id);
  if (!src) return <Mark id={id} name={name} size={`${size} text-base`} />;
  const tile = src.endsWith(".png");
  return (
    <span aria-hidden className={cn("grid shrink-0 place-items-center overflow-hidden rounded-xl border bg-white", size)}>
      {/* eslint-disable-next-line @next/next/no-img-element -- a small static file; next/image adds nothing here */}
      <img src={src} alt="" className={tile ? "size-full object-cover" : cn(glyph, "object-contain")} />
    </span>
  );
}
