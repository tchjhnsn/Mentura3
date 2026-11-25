import { siteOrigins } from "@/server/site";
import { deleteAccount } from "@/server/moving";

export const dynamic = "force-dynamic";
// Removing every team only this person is on, and their businesses, can take a while.
export const maxDuration = 300;

/**
 * A4 Delete account for a program signed in as the person (the production check's cleanup, web/e2e-prod/setup.ts): the
 * same deletion as Settings, Account, Delete account, with the person's email address as `confirm` in a JSON body. It
 * answers 200 with what happened, 400 with the reason it refused, or 401 without a session. A request from another
 * site's page is refused.
 */
export async function DELETE(req: Request) {
  const origin = req.headers.get("origin");
  if (origin && !siteOrigins().includes(origin)) return Response.json({ error: "This request came from another site." }, { status: 403 });
  let confirm = "";
  try {
    const body = (await req.json()) as { confirm?: unknown };
    confirm = typeof body.confirm === "string" ? body.confirm : "";
  } catch {
    return Response.json({ error: "Send your email address as confirm in a JSON body." }, { status: 400 });
  }
  try {
    return Response.json(await deleteAccount(confirm));
  } catch (e) {
    const message = e instanceof Error ? e.message : "That did not work. Try again.";
    return Response.json({ error: message }, { status: /^Sign in/.test(message) ? 401 : 400 });
  }
}
