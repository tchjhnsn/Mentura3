import { instrumentById } from "@reflect/core/instruments";
import { currentUser } from "@/server/session";
import { instrumentPartOf } from "@/server/instruments";

// One part of the signed-in person's course on an instrument as JSON, by path (`INSTRUMENT_PATHS` in
// `@reflect/core/instruments`): /api/instruments/piano for today's piece and the week, /api/instruments/piano/pieces.
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ instrument: string; path?: string[] }> }) {
  const user = await currentUser();
  if (!user) return Response.json({ error: "sign in first" }, { status: 401 });
  const p = await params;
  const x = instrumentById(p.instrument);
  if (!x) return Response.json({ error: "no such instrument" }, { status: 404 });
  const part = await instrumentPartOf(user.id, x, (p.path ?? []).join("/"));
  if (part === null || part === undefined) return Response.json({ error: "no such part of the course" }, { status: 404 });
  return Response.json(part, { headers: { "cache-control": "no-store" } });
}
