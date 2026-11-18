import { headers } from "next/headers";
import QRCode from "qrcode";
import { siteUrl } from "@/server/site";

// Check-in and personal QR codes (doc "Events and connections design guide", 2026-11-18): drawn on the server as SVG,
// so the token never reaches a script. Dark modules on white, whatever the theme, so every phone camera reads it.

/** This request's own origin (so a code made on a preview or in development opens there), else the site's address. */
export async function originOf(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (!host) return siteUrl();
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");
  return `${proto}://${host}`;
}

export async function Qr({ url, label, className }: { url: string; label: string; className?: string }) {
  const svg = await QRCode.toString(url, { type: "svg", margin: 2, errorCorrectionLevel: "M", color: { dark: "#000000", light: "#ffffff" } });
  return <div role="img" aria-label={label} className={className} dangerouslySetInnerHTML={{ __html: svg.replace("<svg ", '<svg width="100%" height="100%" ') }} />;
}
