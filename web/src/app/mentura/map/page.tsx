"use client";

// M0 Screen map, after the Venture Studio's screen map (no outside reference): every Mentura screen and shared part by
// number, with links to open each screen and the Mobbin screen or flow it is built after (data.ts REFS).
import Link from "next/link";
import { ExternalLinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Num } from "@/components/studio/bits";
import { PARTS, SCREENS } from "@/components/mentura/data";
import { Head } from "@/components/mentura/parts";

const SAMPLES: Record<string, string> = {
  "/mentura/p/[handle]": "/mentura/p/maya",
  "/mentura/events/[id]": "/mentura/events/e1",
  "/mentura/post/[id]": "/mentura/post/p1",
  "/mentura/ventures/[slug]": "/mentura/ventures/haptic-plays",
};

export default function ScreenMap() {
  return (
    <div className="px-4 py-5 pb-16 md:px-8">
      <Head n="M0" title="Screen map" job="Every Mentura screen and part number in one list. Tap a path to open it.">
        <Button asChild><Link href="/mentura">Open Home</Link></Button>
      </Head>

      <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
        <section className="relative min-w-0">
          <Num n="M0.1" className="absolute -top-1 right-0" />
          <h2 className="mb-2 text-sm font-semibold">Screens</h2>
          <ul className="divide-y rounded-lg border">
            {SCREENS.map((s) => {
              const dynamic = s.path.includes("[");
              const sample = SAMPLES[s.path];
              return (
                <li key={s.id} className="flex items-start gap-3 p-3">
                  <span className="w-9 shrink-0 font-mono text-xs font-semibold text-fuchsia-600">{s.id}</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium">{s.title}</div>
                    <div className="mt-0.5 font-mono text-xs break-all">
                      {dynamic ? <span className="text-muted-foreground">{s.path}</span> : <Link href={s.path} className="underline-offset-4 hover:underline">{s.path}</Link>}
                      {dynamic && sample ? <> <span className="text-muted-foreground font-sans">for example</span> <Link href={sample} className="underline-offset-4 hover:underline">{sample}</Link></> : null}
                    </div>
                    <p className="text-muted-foreground mt-1 text-xs">{s.job}</p>
                    {s.ref ? <a href={s.ref.url} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground mt-1 inline-flex items-center gap-1 text-xs underline">Built after {s.ref.name}<ExternalLinkIcon className="size-3" /></a> : null}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="relative min-w-0">
          <Num n="M0.2" className="absolute -top-1 right-0" />
          <h2 className="mb-2 text-sm font-semibold">Shared parts</h2>
          <ul className="divide-y rounded-lg border">
            {PARTS.map((c) => (
              <li key={c.id} className="flex gap-3 p-3"><span className="w-9 shrink-0 font-mono text-xs font-semibold text-fuchsia-600">{c.id}</span><div className="min-w-0"><div className="text-sm font-medium">{c.name}</div><div className="text-muted-foreground text-xs">{c.where}</div></div></li>
            ))}
          </ul>
          <p className="text-muted-foreground mt-3 text-xs">Parts inside one screen are numbered after it: M5.2 is the second part of Messages.</p>

          <div className="relative mt-6 rounded-lg border p-4">
            <Num n="M0.3" className="absolute -top-2 left-3" />
            <h2 className="text-sm font-semibold">One profile, two faces</h2>
            <p className="text-muted-foreground mt-1 text-sm">Your profile and account are shared across Reflect and Mentura. Reflect shows the private profile, for you alone. Mentura shows a public one for your founding work: what you make, what you do and the ventures you build.</p>
          </div>
        </section>
      </div>
    </div>
  );
}
