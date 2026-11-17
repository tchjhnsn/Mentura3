import type { Metadata } from "next";
import { DownloadIcon } from "lucide-react";
import { ThingHeader } from "@/components/headers";
import { PAGE } from "@/components/page-header";
import { requireUser } from "@/server/session";
import { COLUMN, Group } from "../list";

export const metadata: Metadata = { title: "Privacy" };
export const dynamic = "force-dynamic";

/** Settings, Privacy: how records are sealed, and the journal export. */
export default async function PrivacyPage() {
  await requireUser();
  return (
    <main className={PAGE}>
      <ThingHeader back="/settings" backLabel="Settings" crumbs={[{ label: "Settings", href: "/settings" }]} title="Privacy" />
      <div className={COLUMN}>
        <h1 id="page-title" className="text-center text-xl font-semibold tracking-tight">Privacy</h1>
        <Group title="Your records" id="records">
          <li className="px-4 py-4 text-sm">Your records are sealed with a key of your own.</li>
          <li className="px-4 py-4 text-sm">A household&apos;s members are sealed with the household&apos;s key, so only its members can read them.</li>
          <li className="px-4 py-4 text-sm">Your journal is never published.</li>
        </Group>
        <Group>
          <li><a href="/api/journal/export" className="text-primary hover:bg-accent flex min-h-14 items-center gap-4 px-4 py-3 transition"><span className="grid size-6 place-items-center [&_svg]:size-5"><DownloadIcon /></span><span className="text-base">Export your journal</span></a></li>
        </Group>
      </div>
    </main>
  );
}
