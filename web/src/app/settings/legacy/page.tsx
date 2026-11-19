import type { Metadata } from "next";
import { ThingHeader } from "@/components/headers";
import { PAGE } from "@/components/page-header";
import { requireUser } from "@/server/session";
import { lifeActs, lifeRecords } from "@/server/life-store";
import { LegacyDash } from "@/app/life/dashboards";

export const metadata: Metadata = { title: "Legacy" };
export const dynamic = "force-dynamic";

/**
 * Settings, Legacy (Torian, 2026-11-19: "move legacy into settings"): the documents and wishes that decide what
 * happens to the person's records and household when they die. The same workspace the Legacy lens opened; a kind's
 * own view (?k=...) still opens at /life/legacy.
 */
export default async function LegacySettingsPage() {
  const user = await requireUser();
  const [records, acts] = await Promise.all([lifeRecords(user.id, "legacy"), lifeActs(user.id)]);
  const today = new Date().toISOString().slice(0, 10);
  return (
    <main className={PAGE}>
      <ThingHeader search={false} back="/settings" backLabel="Settings" crumbs={[{ label: "Settings", href: "/settings" }]} title="Legacy" />
      <div className="mt-6 grid gap-6">
        <LegacyDash userId={user.id} records={records} acts={acts} today={today} />
      </div>
    </main>
  );
}
