import { briefOf } from "@/server/dashboard-brief";
import { BriefView } from "./brief-view";
import type { Ctx } from "./parts";

/** The morning brief under the greeting: two to four sentences on where the day stands, each linked to its records. */
export async function BriefCard({ ctx }: { ctx: Ctx }) {
  const brief = await briefOf(ctx.userId, ctx.today, { now: ctx.now }).catch(() => null);
  if (!brief?.lines.length) return null;
  return <BriefView initial={brief} />;
}

/** The brief's place-holder while it is written. */
export function BriefSkeleton() {
  return (
    <div className="grid max-w-2xl gap-2" aria-hidden="true">
      <div className="bg-muted h-4 w-full animate-pulse rounded" />
      <div className="bg-muted h-4 w-4/5 animate-pulse rounded" />
    </div>
  );
}
