import type { Metadata } from "next";
import Link from "next/link";
import { ThingHeader } from "@/components/headers";
import { PAGE } from "@/components/page-header";
import { COLUMN, Group } from "@/components/list-rows";
import { Face } from "@/components/dash";
import { requireUser } from "@/server/session";
import { linkedinKept, linkedinMatches } from "@/server/profile-store";
import { LinkedinImport, RemoveConnections } from "./linkedin-import";

export const metadata: Metadata = { title: "LinkedIn" };
export const dynamic = "force-dynamic";

const when = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
const plural = (n: number, one: string, many: string) => `${n.toLocaleString("en-US")} ${n === 1 ? one : many}`;

/**
 * Settings, Profile, LinkedIn (doc "Profiles and accounts design guide", 2026-11-18): get LinkedIn's export, upload
 * it, keep the positions and schools ticked (connections are kept sealed and private), then the people here the
 * person knows on LinkedIn. What is already kept sits below, with removing the connections in a muted group.
 */
export default async function LinkedinPage() {
  const user = await requireUser();
  const [kept, matches] = await Promise.all([linkedinKept(user.id), linkedinMatches(user.id)]);
  const anything = kept.positions + kept.schools + kept.connections > 0;
  return (
    <main className={PAGE}>
      <ThingHeader search={false} back="/settings/profile" backLabel="Profile" crumbs={[{ label: "Settings", href: "/settings" }, { label: "Profile", href: "/settings/profile" }]} title="LinkedIn" />
      <div className={COLUMN}>
        <h1 id="page-title" className="text-center text-xl font-semibold tracking-tight">LinkedIn</h1>

        <LinkedinImport />

        <section aria-labelledby="know" className="grid gap-2">
          <h2 id="know" className="text-muted-foreground px-4 text-sm">4. People you know here</h2>
          {matches.length ? (
            <ul className="bg-card divide-y overflow-hidden rounded-2xl border">
              {matches.map((m) => (
                <li key={m.id}>
                  <Link href={`/p/${encodeURIComponent(m.handle ?? m.id)}`} className="hover:bg-accent flex min-h-14 items-center gap-3 px-4 py-3 transition">
                    <Face name={m.name} size={40} />
                    <span className="min-w-0 flex-1 truncate text-base">{m.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground px-4 text-sm">A match appears when someone you are connected with on LinkedIn has also added their LinkedIn link to their profile and uploaded their export.</p>
          )}
        </section>

        {anything ? (
          <Group title="Kept from LinkedIn" id="kept">
            <li className="flex min-h-14 items-center gap-4 px-4 py-3"><span className="flex-1 text-base">Positions</span><span className="text-muted-foreground text-sm">{kept.positions}</span></li>
            <li className="flex min-h-14 items-center gap-4 px-4 py-3"><span className="flex-1 text-base">Schools</span><span className="text-muted-foreground text-sm">{kept.schools}</span></li>
            <li className="flex min-h-14 items-center gap-4 px-4 py-3"><span className="flex-1 text-base">Connections</span><span className="text-muted-foreground text-sm">{kept.connections.toLocaleString("en-US")}, private</span></li>
            {kept.lastUpload ? <li className="flex min-h-14 items-center gap-4 px-4 py-3"><span className="flex-1 text-base">Last upload</span><span className="text-muted-foreground text-sm">{when(kept.lastUpload)}</span></li> : null}
          </Group>
        ) : null}

        {kept.connections ? (
          <section aria-label="Remove" className="grid gap-2 opacity-80">
            <RemoveConnections count={plural(kept.connections, "connection", "connections")} />
            <p className="text-muted-foreground px-4 text-xs">Positions and schools stay on your profile. Removed connections are not kept anywhere, so this cannot be undone.</p>
          </section>
        ) : null}
      </div>
    </main>
  );
}
