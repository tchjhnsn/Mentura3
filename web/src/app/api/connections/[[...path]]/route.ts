import { currentUser } from "@/server/session";
import { connectionsPartOf } from "@/server/connections-store";

// The signed-in person's connections as JSON, by path (`CONNECTIONS_PATHS` in `@reflect/core/connectors`):
// /api/connections, /api/connections/connected, /api/connections/public, /api/connections/<connector id>.
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ path?: string[] }> }) {
  const user = await currentUser();
  if (!user) return Response.json({ error: "sign in first" }, { status: 401 });
  const part = await connectionsPartOf(user.id, ((await params).path ?? []).join("/"));
  if (part === null) return Response.json({ error: "no such connector" }, { status: 404 });
  return Response.json(part, { headers: { "cache-control": "no-store" } });
}
