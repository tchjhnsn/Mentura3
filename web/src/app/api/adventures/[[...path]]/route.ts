import { currentUser } from "@/server/session";
import { adventuresPart } from "@/server/adventures";

// One part of the signed-in person's adventures as JSON: /api/adventures, /api/adventures/not-yet, /api/adventures/friends.
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ path?: string[] }> }) {
  const user = await currentUser();
  if (!user) return Response.json({ error: "sign in first" }, { status: 401 });
  const part = await adventuresPart(user.id, ((await params).path ?? []).join("/"));
  return Response.json(part, { headers: { "cache-control": "no-store" } });
}
