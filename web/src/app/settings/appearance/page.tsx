import type { Metadata } from "next";
import { cookies } from "next/headers";
import { ThingHeader } from "@/components/headers";
import { LookPicker } from "@/components/look-picker";
import { COLUMN } from "@/components/list-rows";
import { PAGE } from "@/components/page-header";
import { LOOK_COOKIE, lookOf } from "@/lib/themes";
import { requireUser } from "@/server/session";

export const metadata: Metadata = { title: "Appearance" };
export const dynamic = "force-dynamic";

/** Appearance: the theme, light or dark, and the background. They change colors only; the layout stays as it is. */
export default async function AppearancePage() {
  await requireUser();
  const look = lookOf((await cookies()).get(LOOK_COOKIE)?.value);
  return (
    <main className={PAGE}>
      <ThingHeader search={false} back="/settings" backLabel="Settings" crumbs={[{ label: "Settings", href: "/settings" }]} title="Appearance" />
      <div className={COLUMN}>
        <h1 id="page-title" className="text-center text-xl font-semibold tracking-tight">Appearance</h1>
        <div className="bg-card rounded-xl border p-4 sm:p-6">
          <LookPicker look={look} today={new Date().toISOString().slice(0, 10)} />
        </div>
        <p className="text-muted-foreground px-4 text-sm">Kept on this device. Season changes with the calendar: Thanksgiving in November, Advent in December, then winter, spring, summer and autumn.</p>
      </div>
    </main>
  );
}
