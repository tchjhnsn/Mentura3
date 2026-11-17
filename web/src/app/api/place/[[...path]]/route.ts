import { placePart } from "@reflect/core/public-data";
import { currentUser } from "@/server/session";
import { placeFacts } from "@/server/public-data";

// What public data says about where the signed-in person lives, as JSON, by path (`PLACE_PATHS` in
// `@reflect/core/public-data`): /api/place for both in brief, /api/place/hazards, /api/place/water.
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ path?: string[] }> }) {
  const user = await currentUser();
  if (!user) return Response.json({ error: "sign in first" }, { status: 401 });
  const p = await placeFacts(user.id);
  if (!p.set) return Response.json({ error: "where you live is not set" }, { status: 404 });
  const part = placePart(p, ((await params).path ?? []).join("/"));
  if (part === null || part === undefined) return Response.json({ error: "no such part, or the source could not be read" }, { status: 404 });
  return Response.json(part, { headers: { "cache-control": "no-store" } });
}
