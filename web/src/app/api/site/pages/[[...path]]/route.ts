import { currentUser } from "@/server/session";
import { sitePagesPart } from "@/server/site-pages";
import { publishableParts } from "@/server/part-share";

// The signed-in person's site pages as JSON, by path: /api/site/pages lists them, /api/site/pages/home is Home with its
// draft and what is live, /api/site/pages/<path> any other page, and /api/site/pages/parts the parts they may put on
// a page with whether each is shared.
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ path?: string[] }> }) {
  const user = await currentUser();
  if (!user) return Response.json({ error: "sign in first" }, { status: 401 });
  const path = ((await params).path ?? []).join("/");
  const part = path === "parts" ? await publishableParts(user.id) : await sitePagesPart(user.id, path);
  if (part === null || part === undefined) return Response.json({ error: "no such page" }, { status: 404 });
  return Response.json(part, { headers: { "cache-control": "no-store" } });
}
