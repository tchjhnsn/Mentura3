import { currentUser } from "@/server/session";
import { finishConnect } from "@/server/mcp-connections";
import { siteUrl } from "@/server/site";
import { db } from "@/db/pool";

export const dynamic = "force-dynamic";

/** Where a connector's sign-in sends the person back: the code becomes tokens, then the connector's page. */
export async function GET(req: Request) {
  const user = await currentUser();
  if (!user) return Response.redirect(`${siteUrl()}/sign-in?next=/marketplace`, 303);
  const u = new URL(req.url);
  const state = u.searchParams.get("state") ?? "";
  const code = u.searchParams.get("code");
  const denied = u.searchParams.get("error");
  const row = state ? ((await db().query("SELECT connector FROM mcp_connection WHERE state = $1 AND user_id = $2", [state, user.id])).rows[0] as { connector?: string } | undefined) : undefined;
  const page = `${siteUrl()}/marketplace/${encodeURIComponent(row?.connector ?? "")}`.replace(/\/$/, "");
  if (denied || !code) return Response.redirect(`${page}?error=${encodeURIComponent(denied === "access_denied" ? "You did not approve Reflect." : "The sign-in did not finish.")}`, 303);
  try {
    await finishConnect(user.id, state, code, u.searchParams.get("iss"));
    return Response.redirect(`${page}?connected=1`, 303);
  } catch (e) {
    return Response.redirect(`${page}?error=${encodeURIComponent(e instanceof Error ? e.message : "The sign-in did not finish.")}`, 303);
  }
}
