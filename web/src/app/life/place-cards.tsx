import Link from "next/link";
import { ChevronRightIcon } from "lucide-react";
import { NRI_SOURCE, SDWIS_SOURCE } from "@reflect/core/public-data";
import { placeFacts } from "@/server/public-data";

// Public data about where the household lives, on the Home tile's Safety and Water parts (doc "Tiles and their
// connections"). Each card says what the source says, names the source, and links to it; nothing is inferred.

function Frame({ title, source, children }: { title: string; source: { name: string; url: string }; children: React.ReactNode }) {
  return (
    <section aria-label={title} className="bg-card grid gap-3 rounded-2xl border p-4">
      <h2 className="text-muted-foreground text-sm">{title}</h2>
      {children}
      <a href={source.url} target="_blank" rel="noreferrer" className="text-muted-foreground text-xs underline-offset-2 hover:underline">{source.name}</a>
    </section>
  );
}

function SetPlace({ what }: { what: string }) {
  return (
    <Link href="/settings/place" className="bg-card hover:bg-accent flex min-h-14 items-center gap-4 rounded-2xl border px-4 py-3 transition">
      <span className="grid flex-1">
        <span className="text-base">Where you live</span>
        <span className="text-muted-foreground text-sm">Set your county to see {what}</span>
      </span>
      <ChevronRightIcon aria-hidden="true" className="text-muted-foreground size-4" />
    </Link>
  );
}

/** The county's FEMA risk rating and its hazards rated relatively high or above. */
export async function RiskCard({ userId }: { userId: string }) {
  const p = await placeFacts(userId);
  if (!p.set) return <SetPlace what="its natural hazards" />;
  if (!p.county) return <Frame title="Natural hazards" source={NRI_SOURCE}><p className="text-sm">FEMA&apos;s index could not be read just now.</p></Frame>;
  const c = p.county;
  return (
    <Frame title={`Natural hazards in ${c.county} County, ${c.state}`} source={NRI_SOURCE}>
      <p><span className="text-2xl font-semibold">{c.rating ?? "Not rated"}</span><span className="text-muted-foreground block text-sm">overall risk, compared with every US county</span></p>
      {c.hazards.length ? (
        <ul className="divide-y border-y text-sm">
          {c.hazards.map((h) => <li key={h.id} className="flex justify-between gap-4 py-2"><span>{h.name}</span><span className="text-muted-foreground">{h.rating}</span></li>)}
        </ul>
      ) : <p className="text-muted-foreground text-sm">No hazard is rated relatively high or above.</p>}
    </Frame>
  );
}

/** The water system's health-based violations in the last ten years, from the EPA. */
export async function WaterCard({ userId }: { userId: string }) {
  const p = await placeFacts(userId);
  if (!p.set) return <SetPlace what="your water system's record" />;
  if (!p.water) return (
    <Link href="/settings/place" className="bg-card hover:bg-accent flex min-h-14 items-center gap-4 rounded-2xl border px-4 py-3 transition">
      <span className="grid flex-1"><span className="text-base">Your water system</span><span className="text-muted-foreground text-sm">Choose the system that serves you to see its EPA record</span></span>
      <ChevronRightIcon aria-hidden="true" className="text-muted-foreground size-4" />
    </Link>
  );
  const w = p.water;
  return (
    <Frame title={w.name} source={SDWIS_SOURCE}>
      <p><span className="text-2xl font-semibold">{w.healthBased === 0 ? "No" : w.healthBased} health-based {w.healthBased === 1 ? "violation" : "violations"}</span><span className="text-muted-foreground block text-sm">in the last {w.years} years{w.served ? `, serving ${w.served.toLocaleString("en-US")} people` : ""}</span></p>
      {w.latest ? <p className="text-sm">Latest began {new Date(`${w.latest.day}T12:00:00Z`).toLocaleDateString("en-US", { month: "long", year: "numeric" })}: {w.latest.kind.toLowerCase()}.</p> : null}
    </Frame>
  );
}

/** The way from the Food part to meal planning. */
export function MealsLink() {
  return (
    <Link href="/meals" className="bg-card hover:bg-accent flex min-h-14 items-center gap-4 rounded-2xl border px-4 py-3 transition">
      <span className="grid flex-1"><span className="text-base">Meals</span><span className="text-muted-foreground text-sm">Plan the week&apos;s meals and make the shopping list</span></span>
      <ChevronRightIcon aria-hidden="true" className="text-muted-foreground size-4" />
    </Link>
  );
}
