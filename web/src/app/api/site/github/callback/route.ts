import { cookies } from "next/headers";
import { currentUser } from "@/server/session";
import { githubToken, pushSite } from "@/server/github-push";
import { siteProject } from "@/server/site-export";
import { siteUrl } from "@/server/site";

export const dynamic = "force-dynamic";

/** GitHub sends the person back here: the code becomes a token for one push, and the site is pushed. */
export async function GET(req: Request) {
  const user = await currentUser();
  if (!user) return new Response("Sign in first.", { status: 401 });
  const url = new URL(req.url);
  const jar = await cookies();
  const state = jar.get("site_gh_state")?.value;
  jar.delete({ name: "site_gh_state", path: "/api/site/github" });
  const back = `${siteUrl()}/settings/site/export`;
  if (!state || url.searchParams.get("state") !== state || !url.searchParams.get("code")) return Response.redirect(`${back}?error=github-state`, 303);
  try {
    const token = await githubToken(url.searchParams.get("code")!);
    const { name, files } = await siteProject(user.id);
    const repo = await pushSite(token, name, files, "My site and blog, exported from Reflect");
    return Response.redirect(`${back}?pushed=${encodeURIComponent(repo)}`, 303);
  } catch (e) {
    return Response.redirect(`${back}?error=${encodeURIComponent(e instanceof Error ? e.message : "Could not push.")}`, 303);
  }
}
