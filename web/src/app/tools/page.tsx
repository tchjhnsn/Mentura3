import type { Metadata } from "next";
import { PAGE, PageHeader } from "@/components/page-header";
import { ToolsList } from "@/components/tools-list";
import { requireUser } from "@/server/session";

export const metadata: Metadata = { title: "Tools" };

/** Tools in one page (Torian, 2026-11-19: "condense tools down into one page"): the journal and the calendar. */
export default async function ToolsPage() {
  await requireUser();
  return (
    <main className={PAGE}>
      <PageHeader title="Tools" />
      <div className="mt-6"><ToolsList /></div>
    </main>
  );
}
