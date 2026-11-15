import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

// The catalogs of free books and of work (src/data) are read from disk by the server, so they ship with every route.
// The repository root, so the app can import the headless core in ../packages/core.
const root = fileURLToPath(new URL("..", import.meta.url));

const config: NextConfig = { reactStrictMode: true, agentRules: false, turbopack: { root }, outputFileTracingRoot: root, outputFileTracingIncludes: { "/**": ["./src/data/*.txt", "./src/data/*.json"] },
  // Learn became Scholē, Aristotle's leisure (Torian, 2026-11-15 02:39Z); old links still land.
  redirects: async () => [{ source: "/learn", destination: "/schole", permanent: true }, { source: "/learn/:path*", destination: "/schole/:path*", permanent: true }] };

export default config;
