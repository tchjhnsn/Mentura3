import { currentUser } from "@/server/session";
import { cleanDashEvent } from "@/server/dashboard-reach";
import { recordDashEvent } from "@/server/dashboard-event-store";

// The dashboard's beacon (migration 0054): an open, a tap on a card, or the time to the first act, first-party only.
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const user = await currentUser().catch(() => null);
  if (!user) return new Response(null, { status: 401 });
  const e = cleanDashEvent(await req.json().catch(() => null));
  if (!e) return new Response(null, { status: 400 });
  await recordDashEvent(user.id, e).catch(() => undefined);
  return new Response(null, { status: 204 });
}
