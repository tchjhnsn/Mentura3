import { currentUser } from "@/server/session";
import { mealsPartOf } from "@/server/meals-store";

// One part of the signed-in person's meal planning as JSON, by path (`MEALS_PATHS` in `@reflect/core/meals`):
// /api/meals for the week in brief, /api/meals/list for the shopping list.
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ path?: string[] }> }) {
  const user = await currentUser();
  if (!user) return Response.json({ error: "sign in first" }, { status: 401 });
  const part = await mealsPartOf(user.id, ((await params).path ?? []).join("/"));
  if (part === null || part === undefined) return Response.json({ error: "no such part of the meals" }, { status: 404 });
  return Response.json(part, { headers: { "cache-control": "no-store" } });
}
