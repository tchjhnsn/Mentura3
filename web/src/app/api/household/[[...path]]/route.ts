import { currentUser } from "@/server/session";
import { householdPartOf } from "@/server/household-store";

// One part of the signed-in person's household as JSON, by its path (`HOUSEHOLD_PATHS` in `@reflect/core/household`):
// /api/household for the household in brief, /api/household/members/<id> for one member.
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ path?: string[] }> }) {
  const user = await currentUser();
  if (!user) return Response.json({ error: "sign in first" }, { status: 401 });
  const path = ((await params).path ?? []).join("/");
  const part = await householdPartOf(user.id, path);
  if (part === null || part === undefined) return Response.json({ error: "no such part of the household" }, { status: 404 });
  return Response.json(part, { headers: { "cache-control": "no-store" } });
}
