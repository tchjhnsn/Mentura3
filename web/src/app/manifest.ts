import type { MetadataRoute } from "next";

// Reflect as an installable web app (dashboard, 2026-11-18): "Add to Home Screen" opens the dashboard full screen,
// and the shortcut opens the glance. Reflect has no native app, so home-screen and lock-screen widgets are not built.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Reflect",
    short_name: "Reflect",
    description: "Your life, in your own records.",
    id: "/dashboard",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0a0a0a",
    icons: [
      { src: "/icon/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon/512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon/512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [{ name: "At a glance", short_name: "Glance", url: "/dashboard/glance", icons: [{ src: "/icon/192", sizes: "192x192", type: "image/png" }] }],
  };
}
