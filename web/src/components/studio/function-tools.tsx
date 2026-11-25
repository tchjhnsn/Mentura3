"use client";

// V12 for a real business: the function's tools from Naive's catalog, under the process group each serves. The
// prototype's sample businesses keep their own function screen (functions/[fn]/sample.tsx).
import Link from "next/link";
import { ScreenHead } from "./shell";
import { fnOf, businessHref, type FunctionId } from "./data";
import { functionGroups, toolPath } from "./tools";
import { FunctionIntegrationsCard } from "./integrations-ui";
import { useTeamSlug } from "@/components/studio/team";

export function FunctionTools({ slug, fn }: { slug: string; fn: FunctionId }) {
  const team = useTeamSlug() ?? "";
  return (
    <div className="pb-16">
      <ScreenHead n="V12" title={fnOf(fn).label} job="This function's tools, by the work each one serves." />
      <div className="max-w-3xl space-y-6 px-4 md:px-8">
        <FunctionIntegrationsCard team={team} slug={slug} fn={fn} />
        {functionGroups(fn).map(({ group, tools }) => (
          <section key={group.id}>
            <h2 className="text-muted-foreground text-xs font-medium">{group.name}</h2>
            <ul className="mt-2 divide-y rounded-xl border">
              {tools.map((t) => (
                <li key={t.id}>
                  <Link href={businessHref(team, slug, toolPath(t, true))} className="hover:bg-accent block px-4 py-3">
                    <span className="text-sm font-medium">{t.title}</span>
                    <span className="text-muted-foreground block text-sm">{t.about}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
