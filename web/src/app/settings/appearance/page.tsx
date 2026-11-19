import type { Metadata } from "next";
import { cookies } from "next/headers";
import { ThingHeader } from "@/components/headers";
import { LookPicker } from "@/components/look-picker";
import { COLUMN } from "@/components/list-rows";
import { PAGE } from "@/components/page-header";
import { AppearanceSlot, slotSections } from "@/components/slots";
import { AppearanceButtonSwitch } from "@/components/appearance-button";
import { APPEARANCE_BUTTON_COOKIE, LOOK_COOKIE, appearanceButtonOn, lookOf } from "@/lib/themes";
import { requireUser } from "@/server/session";

export const metadata: Metadata = { title: "Appearance" };
export const dynamic = "force-dynamic";

/**
 * Appearance: the base look (theme, light or dark, background, season), kept on this device and changing colors only;
 * then the sections plugins add (Virtu: Shape, Type, Colour, Looks, for the person's site, src/components/slots.tsx);
 * then the switch for the Appearance button, which opens the same sections from any page.
 */
export default async function AppearancePage() {
  const user = await requireUser();
  const jar = await cookies();
  const look = lookOf(jar.get(LOOK_COOKIE)?.value);
  const filled = (await slotSections(user.id, "appearance.section")).length > 0;
  return (
    <main className={PAGE}>
      <ThingHeader search={false} back="/settings" backLabel="Settings" crumbs={[{ label: "Settings", href: "/settings" }]} title="Appearance" />
      <div className={COLUMN}>
        <h1 id="page-title" className="text-center text-xl font-semibold tracking-tight">Appearance</h1>
        <div className="bg-card rounded-xl border p-4 sm:p-6">
          <LookPicker look={look} today={new Date().toISOString().slice(0, 10)} />
        </div>
        <p className="text-muted-foreground px-4 text-sm">Kept on this device. Season changes with the calendar: Thanksgiving in November, Advent in December, then winter, spring, summer and autumn.</p>
        <section aria-labelledby={filled ? "your-site" : undefined} className="grid gap-2">
          {filled ? <h2 id="your-site" className="text-muted-foreground px-4 text-sm">Your site</h2> : null}
          <AppearanceSlot userId={user.id} />
        </section>
        <AppearanceButtonSwitch on={appearanceButtonOn(jar.get(APPEARANCE_BUTTON_COOKIE)?.value)} />
      </div>
    </main>
  );
}
