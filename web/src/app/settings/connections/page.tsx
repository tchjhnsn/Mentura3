import type { Metadata } from "next";
import { ExternalLinkIcon } from "lucide-react";
import { ThingHeader } from "@/components/headers";
import { PAGE } from "@/components/page-header";
import { requireUser } from "@/server/session";
import { COLUMN, Group } from "../list";

export const metadata: Metadata = { title: "Connections" };
export const dynamic = "force-dynamic";

/** Public data Reflect reads today, and what each feeds (doc "Tiles and their connections"). */
const SOURCES: { name: string; url: string; feeds: string }[] = [
  { name: "USDA Food Plans", url: "https://www.fns.usda.gov/cnpp/usda-food-plans-cost-food-monthly-reports", feeds: "Food in your income plan" },
  { name: "IRS tax brackets, tax year 2026", url: "https://www.irs.gov/filing/federal-income-tax-rates-and-brackets", feeds: "Taxes in your income plan" },
  { name: "FEMA National Risk Index", url: "https://hazards.fema.gov/nri/", feeds: "Safety, from where you live" },
  { name: "EPA Safe Drinking Water Information System", url: "https://enviro.epa.gov/facts/sdwis/search.html", feeds: "Water, from where you live" },
  { name: "Project Gutenberg, LibriVox, Open Library", url: "https://openlibrary.org", feeds: "Books and audiobooks in Scholē" },
  { name: "Apple Podcasts search, fyyd, gpodder", url: "https://fyyd.de", feeds: "Podcasts in Scholē" },
];

/** Settings, Connections: the accounts a person connects, and the public data Reflect reads. */
export default async function ConnectionsPage() {
  await requireUser();
  return (
    <main className={PAGE}>
      <ThingHeader back="/settings" backLabel="Settings" crumbs={[{ label: "Settings", href: "/settings" }]} title="Connections" />
      <div className={COLUMN}>
        <h1 id="page-title" className="text-center text-xl font-semibold tracking-tight">Connections</h1>
        <Group title="Your accounts" id="yours">
          <li className="text-muted-foreground px-4 py-4 text-sm">No accounts are connected. Each tile shows the accounts it can use.</li>
        </Group>
        <Group title="Public data Reflect reads" id="public">
          {SOURCES.map((s) => (
            <li key={s.name}>
              <a href={s.url} target="_blank" rel="noreferrer" className="hover:bg-accent flex min-h-14 items-center gap-4 px-4 py-3 transition">
                <span className="grid min-w-0 flex-1">
                  <span className="text-base">{s.name}</span>
                  <span className="text-muted-foreground text-sm">{s.feeds}</span>
                </span>
                <ExternalLinkIcon aria-hidden="true" className="text-muted-foreground size-4 shrink-0" />
              </a>
            </li>
          ))}
        </Group>
      </div>
    </main>
  );
}
