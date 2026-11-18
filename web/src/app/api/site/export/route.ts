import { currentUser } from "@/server/session";
import { siteZip } from "@/server/site-export";

export const dynamic = "force-dynamic";

/** The person's site as a Next.js project in a zip, to host themselves. */
export async function GET() {
  const user = await currentUser();
  if (!user) return new Response("Sign in first.", { status: 401 });
  const { name, zip } = await siteZip(user.id);
  return new Response(new Blob([zip as BlobPart], { type: "application/zip" }), {
    headers: { "content-type": "application/zip", "content-disposition": `attachment; filename="${name}.zip"`, "cache-control": "no-store" },
  });
}
