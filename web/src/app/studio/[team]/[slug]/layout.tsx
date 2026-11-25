import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ventureDetail } from "@/app/studio/actions";
import { Button } from "@/components/ui/button";
import { BusinessSeen } from "@/components/studio/business";
import { realBusiness } from "@/components/studio/business-data";
import { isSample } from "@/components/studio/data";
import { movedFrom } from "@/server/moving";
import { consolePerson, teamAt } from "@/server/teams";

export const dynamic = "force-dynamic";

/** Screens inside one business of a team (the team layout around this draws the frame and checks the membership):
 * for a real business its name and functions read from Naive once, for the sidebar (C4, C25) and the top bar. A sample
 * business is known to them already. A business that moved to another team (D5) opens there for someone on that team,
 * and says where it went, without naming the team, for anyone else (test E10). */
export default async function VenturePages({ children, params }: { children: ReactNode; params: Promise<{ team: string; slug: string }> }) {
  const { team, slug } = await params;
  const id = decodeURIComponent(slug);
  const real = isSample(slug) ? null : await ventureDetail(id, decodeURIComponent(team));
  if (real && !real.ok) {
    const person = await consolePerson();
    const at = person ? await teamAt(person, decodeURIComponent(team)) : null;
    const moved = person && at?.ok ? await movedFrom(person, at.team, id).catch(() => null) : null;
    if (moved && moved !== "elsewhere") redirect(`/studio/${moved.slug}/${slug}`);
    if (moved === "elsewhere" && at?.ok) {
      return (
        <section className="mx-auto mt-16 max-w-md px-4 text-center" role="alert">
          <h1 className="text-xl font-semibold tracking-tight">This business moved to another team.</h1>
          <p className="text-muted-foreground mt-2 text-sm">You are not on that team. Ask one of its Owners to invite you.</p>
          <Button asChild variant="outline" className="mt-6"><Link href={`/studio/${at.team.slug}`}>Back to {at.team.name}</Link></Button>
        </section>
      );
    }
  }
  return (
    <>
      {real?.ok ? <BusinessSeen value={realBusiness(real.value)} /> : null}
      {children}
    </>
  );
}
