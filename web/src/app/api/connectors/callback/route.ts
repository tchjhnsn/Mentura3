import { currentUser } from "@/server/session";
import { finishConnect } from "@/server/mcp-connections";
import { siteUrl } from "@/server/site";
import { db } from "@/db/pool";
import { cookies } from "next/headers";
import { CONNECT_BACK_COOKIE, consoleBack } from "@/components/studio/connect-back";
import { signInFailure } from "@/components/studio/integrations-machines";

export const dynamic = "force-dynamic";

/** Where a connector's sign-in sends the person back: the code becomes tokens, then the connector's page, or the
 * business console's page for it when the sign-in started there (V24, the cookie in components/studio/connect-back.ts). */
export async function GET(req: Request) {
  const user = await currentUser();
  if (!user) return Response.redirect(`${siteUrl()}/sign-in?next=/marketplace`, 303);
  const u = new URL(req.url);
  const state = u.searchParams.get("state") ?? "";
  const code = u.searchParams.get("code");
  const denied = u.searchParams.get("error");
  const row = state ? ((await db().query("SELECT connector FROM mcp_connection WHERE state = $1 AND user_id = $2", [state, user.id])).rows[0] as { connector?: string } | undefined) : undefined;
  const jar = await cookies();
  // Only for the connector this sign-in is for, so a cookie left from another sign-in is never followed.
  const kept = consoleBack(jar.get(CONNECT_BACK_COOKIE)?.value);
  const back = kept && row?.connector && kept.endsWith(`/integrations/${encodeURIComponent(row.connector)}`) ? kept : null;
  jar.delete(CONNECT_BACK_COOKIE);
  const page = back ? `${siteUrl()}${back}` : `${siteUrl()}/marketplace/${encodeURIComponent(row?.connector ?? "")}`.replace(/\/$/, "");
  // A failed sign-in names where it ended in M2 (failed=), so the page shows that state's one next action (P31).
  if (denied || !code) return Response.redirect(`${page}?failed=${encodeURIComponent(signInFailure(denied))}&error=${encodeURIComponent(denied === "access_denied" ? "You did not approve Reflect." : "The sign-in did not finish.")}`, 303);
  try {
    await finishConnect(user.id, state, code, u.searchParams.get("iss"));
    return Response.redirect(`${page}?connected=1`, 303);
  } catch (e) {
    return Response.redirect(`${page}?failed=${encodeURIComponent(signInFailure(null, true))}&error=${encodeURIComponent(e instanceof Error ? e.message : "The sign-in did not finish.")}`, 303);
  }
}
