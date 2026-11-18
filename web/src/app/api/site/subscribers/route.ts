import { subscribersCsv } from "@reflect/core/site";
import { currentUser } from "@/server/session";
import { subscribersOf } from "@/server/site-store";

export const dynamic = "force-dynamic";

/** The site's confirmed subscribers as a CSV the person can take to another host. Only the owner gets it. */
export async function GET() {
  const user = await currentUser();
  if (!user) return new Response("Sign in first.", { status: 401 });
  const { confirmed } = await subscribersOf(user.id);
  return new Response(subscribersCsv(confirmed), {
    headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="subscribers-${new Date().toISOString().slice(0, 10)}.csv"`, "cache-control": "no-store" },
  });
}
