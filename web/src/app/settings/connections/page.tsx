import { redirect } from "next/navigation";

// Settings, Connections became the marketplace's Yours view (Torian, 2026-11-18 22:54Z: one place, as in Claude's
// Settings, Customize): built-in connections, marketplace connectors, assistants using Reflect and public data.
export default function ConnectionsPage(): never {
  redirect("/marketplace?view=yours");
}
