import { cleanHandle, handleProblem } from "@reflect/core/profile";
import { currentUser } from "@/server/session";
import { handleSuggestions, handleTaken, profileSettings } from "@/server/profile-store";

export const dynamic = "force-dynamic";

/**
 * Whether a handle can be the signed-in person's, as they type it on Settings, Account, Handle: "mine" (already theirs),
 * "free", "taken" (with two free ones near it) or "invalid" (with what is wrong). It only reads.
 */
export async function GET(req: Request) {
  const user = await currentUser();
  if (!user) return Response.json({ error: "Sign in first." }, { status: 401 });
  const raw = new URL(req.url).searchParams.get("h") ?? "";
  const h = cleanHandle(raw).slice(0, 40);
  const problem = handleProblem(h);
  if (problem) return Response.json({ state: "invalid", problem });
  if ((await profileSettings(user.id)).handle === h) return Response.json({ state: "mine" });
  if (await handleTaken(h, user.id)) return Response.json({ state: "taken", suggestions: await handleSuggestions(h) });
  return Response.json({ state: "free" });
}
