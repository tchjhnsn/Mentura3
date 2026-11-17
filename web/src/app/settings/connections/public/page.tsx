import type { Metadata } from "next";
import { ExternalLinkIcon } from "lucide-react";
import { PUBLIC_SOURCES } from "@reflect/core/connectors";
import { ThingHeader } from "@/components/headers";
import { PAGE } from "@/components/page-header";
import { COLUMN, Group } from "@/components/list-rows";
import { requireUser } from "@/server/session";

export const metadata: Metadata = { title: "Public data" };
export const dynamic = "force-dynamic";

/** The public data Reflect reads for everyone, and what each source feeds. */
export default async function PublicDataPage() {
  await requireUser();
  return (
    <main className={PAGE}>
      <ThingHeader search={false} back="/settings/connections" backLabel="Connections" crumbs={[{ label: "Settings", href: "/settings" }, { label: "Connections", href: "/settings/connections" }]} title="Public data" />
      <div className={COLUMN}>
        <div className="grid gap-1 text-center">
          <h1 id="page-title" className="text-xl font-semibold tracking-tight">Public data</h1>
          <p className="text-muted-foreground text-sm">Reflect reads these for everyone. There is nothing to connect.</p>
        </div>
        <Group>
          {PUBLIC_SOURCES.map((s) => (
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
