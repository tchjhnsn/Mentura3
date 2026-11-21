import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

// The catalogs of free books and of work (src/data) are read from disk by the server, so they ship with every route.
// The repository root, so the app can import the headless core in ../packages/core.
const root = fileURLToPath(new URL("..", import.meta.url));

const config: NextConfig = { reactStrictMode: true, experimental: { serverActions: { bodySizeLimit: "4mb" } }, agentRules: false, turbopack: { root }, outputFileTracingRoot: root, outputFileTracingIncludes: { "/**": ["./src/data/*.txt", "./src/data/*.json", "./src/data/dialogues/*.txt"] },
  // Learn became Scholē, Aristotle's leisure (Torian, 2026-11-15 02:39Z); old links still land.
  redirects: async () => [{ source: "/learn", destination: "/schole", permanent: true }, { source: "/learn/:path*", destination: "/schole/:path*", permanent: true },
    // Qualities moved into Scholē, Legacy into Settings (Torian, 2026-11-19).
    { source: "/journal/qualities", destination: "/schole/qualities", permanent: true }, { source: "/journal/qualities/:path*", destination: "/schole/qualities/:path*", permanent: true },
    // Crafts are making, so they moved from Scholē into Work (Torian, 2026-11-21).
    { source: "/schole/crafts/:path*", destination: "/life/work/crafts/:path*", permanent: true }, { source: "/schole/making", destination: "/life/work/making", permanent: true },
    { source: "/schole/making/:path*", destination: "/life/work/making/:path*", permanent: true }, { source: "/schole/discover", destination: "/life/work/discover", permanent: true },
    { source: "/schole/discover/:path*", destination: "/life/work/discover/:path*", permanent: true },
    { source: "/life/legacy", missing: [{ type: "query", key: "k" }], destination: "/settings/legacy", permanent: false }] };

export default config;
