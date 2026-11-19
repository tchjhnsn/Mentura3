import { currentUser } from "@/server/session";
import { interestsPart } from "@/server/interests-store";

// One part of what the signed-in person loves as JSON, by path: /api/interests for all of it, /api/interests/know for
// what they follow, /api/interests/b-meditations for one thing (the same parts the chat's and MCP's `interests` read).
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ path?: string[] }> }) {
  const user = await currentUser();
  if (!user) return Response.json({ error: "sign in first" }, { status: 401 });
  const part = await interestsPart(user.id, ((await params).path ?? []).join("/"));
  if (!part) return Response.json({ error: "no such part of your interests" }, { status: 404 });
  return Response.json(part, { headers: { "cache-control": "no-store" } });
}
