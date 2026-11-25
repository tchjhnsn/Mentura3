import Link from "next/link";
import { ScreenHead } from "@/components/studio/shell";
import { COMPONENTS, MOBBIN, SCREENS, VENTURES } from "@/components/studio/data";

const hrefOf = (team: string, path: string) => path.replace(":team", team).replace(":v", VENTURES[0]!.slug).replace("[id]", "1").replace("[...path]", "strategy/one-pager.md").replace("[fn]", "marketing-and-sales").replace("library/1", "library/b2b-saas");

/** S0 Screen map: every screen and component number, with the Mobbin screens each one follows. */
export default async function ScreenMap({ params }: { params: Promise<{ team: string }> }) {
  const { team } = await params;
  return (
    <div className="pb-16">
      <ScreenHead n="S0" title="Screen map" job="Every screen and component in the Business Studio, by number. Tap a screen to open it." />
      <div className="grid gap-8 px-4 md:px-8 lg:grid-cols-[2fr_1fr]">
        <section>
          <h2 className="mb-2 text-sm font-semibold">Screens</h2>
          <ul className="divide-y rounded-lg border">
            {SCREENS.map((s) => (
              <li key={s.id} className="flex items-start gap-3 p-3">
                <span className="w-9 shrink-0 font-mono text-xs font-semibold text-fuchsia-600">{s.id}</span>
                <div className="min-w-0 flex-1">
                  <Link href={hrefOf(team, s.path)} className="text-sm font-medium hover:underline">{s.title}</Link>
                  <p className="text-muted-foreground text-xs">{s.job}</p>
                  {s.refs.length ? <p className="mt-1 flex flex-wrap gap-x-3 text-xs">{s.refs.map((r) => <a key={r} href={MOBBIN[r]} target="_blank" rel="noreferrer" className="text-muted-foreground underline">{r}</a>)}</p> : null}
                </div>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h2 className="mb-2 text-sm font-semibold">Shared components</h2>
          <ul className="divide-y rounded-lg border">
            {COMPONENTS.map((c) => (
              <li key={c.id} className="flex gap-3 p-3"><span className="w-9 shrink-0 font-mono text-xs font-semibold text-fuchsia-600">{c.id}</span><div><div className="text-sm font-medium">{c.name}</div><div className="text-muted-foreground text-xs">{c.where}</div></div></li>
            ))}
          </ul>
          <p className="text-muted-foreground mt-3 text-xs">Parts inside one screen are numbered after it: V9.2 is the second part of Activity.</p>
        </section>
      </div>
    </div>
  );
}
