import type { Metadata } from "next";
import { ThingHeader } from "@/components/headers";
import { PAGE } from "@/components/page-header";
import { ToolsList } from "@/components/tools-list";
import { requireUser } from "@/server/session";

export const metadata: Metadata = { title: "Tools" };

/** Settings, Tools (Torian, 2026-11-19): the journal and the calendar can be reached from Settings too. */
export default async function ToolsSettingsPage() {
  await requireUser();
  return (
    <main className={PAGE}>
      <ThingHeader search={false} crumbs={[{ label: "Settings", href: "/settings" }]} title="Tools" />
      <div className="mt-6"><ToolsList /></div>
    </main>
  );
}
