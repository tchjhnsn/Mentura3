import { isSection } from "@reflect/core/profile";
import { currentUser } from "@/server/session";
import { profileFor } from "@/server/actions/profiles";

// A profile as JSON, as the asker may see it (the same as /p/<key>, readable signed out): /api/profile/<handle or id>,
// or one part, /api/profile/<key>/<socials|building|qualities|experience|events|interests|met>. A part the asker
// may not see is null.
export const dynamic = "force-dynamic";

const EXTRA = ["met", "line", "name"] as const;

export async function GET(_req: Request, { params }: { params: Promise<{ key: string; section?: string[] }> }) {
  const { key, section = [] } = await params;
  const user = await currentUser().catch(() => null);
  const p = await profileFor(key, user?.id ?? null);
  if (!p) return Response.json({ error: "no such profile" }, { status: 404 });
  const headers = { "cache-control": "no-store" };
  if (!section.length) return Response.json(p, { headers });
  const part = section.join("/");
  if (section.length > 1 || !(isSection(part) || (EXTRA as readonly string[]).includes(part))) return Response.json({ error: "no such part" }, { status: 404 });
  return Response.json({ id: p.id, handle: p.handle, href: p.href, [part]: p[part as keyof typeof p] ?? null }, { headers });
}
