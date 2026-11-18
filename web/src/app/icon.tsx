import { mark } from "@/lib/icon-mark";

// Reflect's icon for browsers and the home screen (dashboard, 2026-11-18): an R in shadcn's neutral colors, drawn
// rather than kept as a file, since Reflect has no logo file yet. The letter sits inside the middle 60% so a
// maskable crop keeps it whole. Served at /icon/192 and /icon/512; app/manifest.ts names both.
export function generateImageMetadata() {
  return [192, 512].map((n) => ({ id: String(n), size: { width: n, height: n }, contentType: "image/png" }));
}

export default async function Icon({ id }: { id: Promise<string | number> }) {
  const n = Number(await id);
  return mark(n === 512 ? 512 : 192);
}
