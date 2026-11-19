import { redirect } from "next/navigation";

// Home's front page is the dashboard for now (Torian, 2026-11-19). The old page is kept in ./home-page.tsx. A redirect
// here and not in next.config.ts: the polis host's "/" is rewritten to /v by the proxy before it reaches this page.
export default function Home() {
  redirect("/dashboard");
}
