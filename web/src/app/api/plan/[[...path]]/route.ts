import { currentUser } from "@/server/session";
import { planPartOf } from "@/server/plan";

// One part of the signed-in person's household plan as JSON, by its path (`PLAN_PATHS` in `@reflect/core/plan`):
// /api/plan for the plan in brief, /api/plan/next/costs/food for one cost of the next step.
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ path?: string[] }> }) {
  const user = await currentUser();
  if (!user) return Response.json({ error: "sign in first" }, { status: 401 });
  const path = ((await params).path ?? []).join("/");
  const part = await planPartOf(user.id, path);
  if (part === null || part === undefined) return Response.json({ error: "no such part of the plan" }, { status: 404 });
  return Response.json(part, { headers: { "cache-control": "no-store" } });
}
