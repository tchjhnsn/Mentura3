import { redirect } from "next/navigation";

// Mentura's business console is this host's front door (doc "Mentura console: screens, navigation and teams",
// 2026-11-25): "/" opens the Studio. Reflect is a separate product; its dashboard stays at /dashboard until it has a
// host of its own. A redirect here and not in next.config.ts: the polis host's "/" is rewritten to /v by the proxy
// before it reaches this page.
export default function Home() {
  redirect("/studio");
}
