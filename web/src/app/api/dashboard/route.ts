import { currentUser } from "@/server/session";
import { householdView, memberView, todayFacts } from "@/server/dashboard-today";

// What the signed-in person's dashboard shows, as JSON (the same facts as the `dashboard_today` action):
// /api/dashboard for theirs, ?view=household for the household's, ?for=<member id> for a member they keep.
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const user = await currentUser();
  if (!user) return Response.json({ error: "sign in first" }, { status: 401 });
  const q = new URL(req.url).searchParams;
  const headers = { "cache-control": "no-store" };
  const forId = q.get("for");
  if (forId) {
    const v = await memberView(user.id, forId);
    return v ? Response.json(v, { headers }) : Response.json({ error: "no such member" }, { status: 404 });
  }
  if (q.get("view") === "household") {
    const v = await householdView(user.id);
    return v ? Response.json(v, { headers }) : Response.json({ error: "no household with anyone else in it" }, { status: 404 });
  }
  return Response.json(await todayFacts(user.id), { headers });
}
