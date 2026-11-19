import { endsAt } from "@reflect/core/meetings";
import { writeIcs } from "@reflect/core/ics-write";
import { meetingFor } from "@/server/meetings-store";
import { currentUser } from "@/server/session";
import { siteUrl } from "@/server/site";

export const dynamic = "force-dynamic";

/** A meeting as a calendar file (.ics), for the host or a guest: its title, start and planned end, the meeting's page
 * as its place and link, and the agenda as its description. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user) return new Response("Sign in first.", { status: 401 });
  const { id } = await params;
  const m = await meetingFor(user.id, id);
  if (!m) return new Response("No such meeting.", { status: 404 });
  const end = endsAt(m);
  if (!m.startsAt || !end) return new Response("This meeting has no time yet.", { status: 404 });
  const page = `${siteUrl()}/meetings/${m.id}`;
  const ics = writeIcs({ uid: `${m.id}@reflect`, title: m.cancelled ? `Cancelled: ${m.title}` : m.title, start: m.startsAt, end, description: m.agenda, location: page, url: page });
  const name = m.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "meeting";
  return new Response(ics, {
    headers: { "content-type": "text/calendar; charset=utf-8", "content-disposition": `attachment; filename="${name}.ics"`, "cache-control": "private, no-store" },
  });
}
