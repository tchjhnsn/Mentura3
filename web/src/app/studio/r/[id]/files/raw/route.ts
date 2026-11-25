// The bytes of a venture's files (venture console spec, phase 2): GET downloads one file, POST uploads one, both
// through Naive's bridge as the signed-in person (src/server/naive.ts), for the team named by ?team= (the person's
// personal team without it), whose membership naive.ts checks, so another team's venture is unreachable.
import { naive, studioUnavailable } from "@/server/naive";

export const dynamic = "force-dynamic";
const MAX = 20 * 1024 * 1024;

const plain = (text: string, status: number) => new Response(text, { status, headers: { "content-type": "text/plain; charset=utf-8" } });
const message = (e: unknown) => (e instanceof Error ? e.message : "Naive refused this.");

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const why = studioUnavailable();
  if (why) return plain(why, 503);
  const { id } = await params;
  const q = new URL(req.url).searchParams;
  const path = q.get("path") ?? "";
  try {
    const f = await naive<{ path: string; size: number; base64: string }>("fileRead", { venture: decodeURIComponent(id), path }, q.get("team") || undefined);
    const name = path.split("/").pop() ?? "file";
    return new Response(Buffer.from(f.base64, "base64"), {
      headers: {
        "content-type": "application/octet-stream",
        "content-disposition": `attachment; filename*=UTF-8''${encodeURIComponent(name)}`,
        "cache-control": "private, no-store",
        "x-content-type-options": "nosniff",
      },
    });
  } catch (e) {
    return plain(message(e), 404);
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const why = studioUnavailable();
  if (why) return plain(why, 503);
  const { id } = await params;
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return plain("Choose a file to upload.", 400);
  if (file.size > MAX) return plain("That file is larger than 20 MB.", 413);
  const folder = String(form?.get("folder") ?? "").replace(/^\/+|\/+$/g, "");
  const path = folder ? `${folder}/${file.name}` : file.name;
  try {
    const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");
    return Response.json(await naive<{ path: string; size: number }>("fileWrite", { venture: decodeURIComponent(id), path, base64, replace: form?.get("replace") === "true" }, new URL(req.url).searchParams.get("team") || undefined));
  } catch (e) {
    return plain(message(e), 400);
  }
}
