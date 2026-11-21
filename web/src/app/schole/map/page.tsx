import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLinkIcon } from "lucide-react";
import { requireUser } from "@/server/session";
import { Num } from "@/components/studio/bits";
import { Head, PAGE } from "@/components/schole/parts";
import { COMPONENTS, INVENTORY, SCREENS, refName } from "@/components/schole/inventory";

export const metadata: Metadata = { title: "Screen map" };

const SAMPLES: Record<string, string> = {
  "/schole/subjects/[subject]": "/schole/subjects/ethics",
  "/schole/c/[course]": "/schole/c/nicomachean-ethics",
};

/** S0 Screen map, after the Venture Studio's and Mentura's: every screen, part and component number from
 * schole.inventory.json, each screen with the Mobbin screens or flows it is built after. */
export default async function ScreenMap() {
  await requireUser();
  return (
    <div className={PAGE}>
      <Head n="S0" title="Screen map" job={`Every Scholē screen and part by number. ${Object.entries(INVENTORY.prefixes).map(([k, v]) => `${k}: ${v.toLowerCase()}`).join("; ")}.`} />
      <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
        <ul className="divide-y rounded-xl border">
          {SCREENS.map((s) => {
            const dyn = s.path.includes("[");
            const sample = SAMPLES[s.path];
            return (
              <li key={s.id} className="flex gap-3 p-3">
                <span className="w-9 shrink-0 font-mono text-xs font-semibold text-fuchsia-600">{s.id}</span>
                <div className="min-w-0 flex-1">
                  <div className="font-medium">{s.title}</div>
                  <div className="font-mono text-xs break-all">{dyn ? <span className="text-muted-foreground">{s.path}</span> : <Link href={s.path} className="hover:underline">{s.path}</Link>}{sample ? <> <span className="text-muted-foreground font-sans">for example</span> <Link href={sample} className="hover:underline">{sample}</Link></> : null}</div>
                  <p className="text-muted-foreground mt-1 text-sm">{s.job}</p>
                  {s.parts?.length ? <ul className="mt-1.5 space-y-0.5 text-xs">{s.parts.map((p) => <li key={p.id}><span className="font-mono text-fuchsia-600">{p.id}</span> {p.name}{p.job ? <span className="text-muted-foreground">: {p.job}</span> : null}</li>)}</ul> : null}
                  {s.refs?.length ? <div className="mt-1.5 flex flex-wrap gap-x-3 text-xs">{s.refs.map((r) => <a key={r} href={r} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 underline">Built after {refName(r)}<ExternalLinkIcon className="size-3" /></a>)}</div> : null}
                  {s.states?.length ? <div className="text-muted-foreground mt-1 text-[11px]">States: {s.states.join(", ")}</div> : null}
                </div>
              </li>
            );
          })}
        </ul>
        <section className="relative h-fit">
          <Num n="C8" className="absolute -top-2 right-0" />
          <h2 className="mb-2 font-semibold">Shared components</h2>
          <ul className="divide-y rounded-xl border">{COMPONENTS.map((c) => <li key={c.id} className="flex gap-3 p-3 text-sm"><span className="w-9 shrink-0 font-mono text-xs font-semibold text-fuchsia-600">{c.id}</span><span className="min-w-0"><span className="block font-medium">{c.name}</span><span className="text-muted-foreground text-xs">{c.where.includes("*") ? "Every screen" : c.where.join(", ")}</span></span></li>)}</ul>
          <p className="text-muted-foreground mt-3 text-xs">Left out on purpose from Uxcel: points, leagues, scores, streak counters that reset, certificates and upgrade prompts. Checks are for the person alone, and examiners are people.</p>
        </section>
      </div>
    </div>
  );
}
