import { ImageResponse } from "next/og";

/** Reflect's mark at one size: an R in shadcn's neutral colors, inside the middle 60% so a maskable crop keeps it whole. */
export function mark(size: number) {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0a0a", color: "#fafafa", fontSize: Math.round(size * 0.5), fontWeight: 600, letterSpacing: -2 }}>
        R
      </div>
    ),
    { width: size, height: size },
  );
}
