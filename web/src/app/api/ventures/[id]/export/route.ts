import { zipSync, strToU8 } from "fflate";
import { ventureId } from "@reflect/core/naive-venture";
import { currentUser } from "@/server/session";
import { ventureFiles } from "@/server/venture-files-store";
import { ventureOf } from "@/server/actions/ventures";

export const dynamic = "force-dynamic";

/** A venture's files as a zip of its folder (2026-11-18, "In Reflect, exportable"), ready to open in Naive. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user) return new Response("Sign in first.", { status: 401 });
  const { id } = await params;
  let name: string;
  try {
    const r = await ventureOf(user.id, id);
    name = typeof r.body.name === "string" ? r.body.name : "venture";
  } catch {
    return new Response("No such venture.", { status: 404 });
  }
  const files = await ventureFiles(user.id, id);
  if (!files.length) return new Response("This venture has not been started in Naive.", { status: 404 });
  const folder = ventureId(name);
  const zip = zipSync(Object.fromEntries(files.map((f) => [`${folder}/${f.path}`, strToU8(f.body)])));
  return new Response(zip as unknown as BodyInit, {
    headers: { "content-type": "application/zip", "content-disposition": `attachment; filename="${folder}.zip"`, "cache-control": "no-store" },
  });
}
