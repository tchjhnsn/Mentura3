import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRightIcon } from "lucide-react";
import { ThingHeader } from "@/components/headers";
import { PAGE } from "@/components/page-header";
import { requireUser } from "@/server/session";
import { GLYPHS, IN_SETTINGS, MINE, hrefOf } from "@/app/home-tiles";

export const metadata: Metadata = { title: "Life areas" };

/** Settings, Life areas (Torian, 2026-11-21): the areas that are not core apps, off the sidebar, each opening its page. */
export default async function AreasSettingsPage() {
  await requireUser();
  const areas = IN_SETTINGS.flatMap((id) => { const t = MINE.find((x) => x.id === id); const href = t && hrefOf(t); return t && href ? [{ id, label: t.label, href }] : []; });
  return (
    <main className={PAGE}>
      <ThingHeader search={false} crumbs={[{ label: "Settings", href: "/settings" }]} title="Life areas" />
      <p className="text-muted-foreground mt-2 text-sm">Food, shelter, transport, safety, health and fitness. Their records and costs stay in your plan.</p>
      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        {areas.map((a) => (
          <li key={a.id}>
            <Link href={a.href} className="hover:bg-accent flex items-center gap-4 rounded-xl border p-4 transition">
              <span className="bg-muted flex size-11 shrink-0 items-center justify-center rounded-lg">
                <svg viewBox="0 0 100 100" aria-hidden="true" className="size-5"><path d={GLYPHS[a.id] ?? ""} className="fill-current" fillRule="evenodd" /></svg>
              </span>
              <span className="min-w-0 flex-1 font-medium">{a.label}</span>
              <ChevronRightIcon className="text-muted-foreground size-4 shrink-0" />
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
