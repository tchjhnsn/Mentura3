// Connector logos from Simple Icons (CC0, simpleicons.org): each brand's own mark in its own color, drawn white on
// that color. A connector without one keeps its initial on a color from its id (`Mark`).
import { siCanva, siCloudflare, siFigma, siGithub, siGmail, siGooglecalendar, siHuggingface, siInstacart, siLinear, siNotion, siResend, siSentry, siStripe, siSupabase, siVercel } from "simple-icons";
import { cn } from "@/lib/utils";
import { Mark } from "./parts";

type Icon = { path: string; hex: string; title: string };
const ICONS: Record<string, Icon> = {
  github: siGithub, vercel: siVercel, cloudflare: siCloudflare, supabase: siSupabase, resend: siResend, gmail: siGmail, notion: siNotion, linear: siLinear,
  sentry: siSentry, stripe: siStripe, canva: siCanva, figma: siFigma, huggingface: siHuggingface, instacart: siInstacart, "google-calendar": siGooglecalendar,
};

/** A connector's logo tile: the brand's mark when Simple Icons has it, else its initial. */
export function Logo({ id, name, size = "size-10", glyph = "size-5" }: { id: string; name: string; size?: string; glyph?: string }) {
  const icon = ICONS[id];
  if (!icon) return <Mark id={id} name={name} size={`${size} text-base`} />;
  const dark = parseInt(icon.hex, 16) < 0x333333;
  return (
    <span aria-hidden className={cn("grid shrink-0 place-items-center rounded-xl border", size, dark ? "bg-foreground text-background" : "text-white")} style={dark ? undefined : { background: `#${icon.hex}` }}>
      <svg viewBox="0 0 24 24" className={glyph} fill="currentColor"><path d={icon.path} /></svg>
    </span>
  );
}
