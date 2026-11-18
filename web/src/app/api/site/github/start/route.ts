import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { currentUser } from "@/server/session";
import { canPushToGithub } from "@/server/github-push";
import { siteUrl } from "@/server/site";

export const dynamic = "force-dynamic";

/** Starts Push to GitHub: the person signs in to GitHub, which sends them back to the callback with a code. */
export async function GET() {
  const user = await currentUser();
  if (!user) return new Response("Sign in first.", { status: 401 });
  if (!canPushToGithub()) return Response.redirect(`${siteUrl()}/settings/site/export?error=github`, 303);
  const state = randomBytes(16).toString("base64url");
  (await cookies()).set("site_gh_state", state, { httpOnly: true, secure: true, sameSite: "lax", path: "/api/site/github", maxAge: 600 });
  const q = new URLSearchParams({ client_id: process.env.GITHUB_CLIENT_ID!, redirect_uri: `${siteUrl()}/api/site/github/callback`, scope: "public_repo", state, allow_signup: "true" });
  return Response.redirect(`https://github.com/login/oauth/authorize?${q}`, 303);
}
