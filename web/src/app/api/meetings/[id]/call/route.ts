import { canJoin, joinOpensAt, meetingState } from "@reflect/core/meetings";
import { canUseDaily, ensureRoom, meetingToken, prebuiltUrl } from "@/server/daily";
import { meetingFor, roleIn } from "@/server/meetings-store";
import { currentUser } from "@/server/session";

// The call for one meeting, for its live page (app/meetings/[id]/live): signed in, the host or a guest,
// and only while Join is open. With DAILY_API_KEY set it returns the Daily room and a meeting token for this person
// ({ kind: "daily", url, token }, url already carrying ?t=token); otherwise the meeting's own call link
// ({ kind: "link", url }); otherwise 409 with a plain message. The token is never logged.
export const dynamic = "force-dynamic";

const say = (message: string, status: number) => Response.json({ error: message }, { status, headers: { "cache-control": "no-store" } });
const when = (iso: string) => new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short" }).format(new Date(iso));

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user) return say("Sign in first.", 401);
  const { id } = await params;
  const role = await roleIn(user.id, id);
  if (!role) return say("No such meeting.", 404);
  const m = await meetingFor(user.id, id);
  if (!m) return say("No such meeting.", 404);

  const times = { startsAt: m.startsAt, minutes: m.minutes, cancelled: m.cancelled };
  if (!canJoin(times)) {
    const s = meetingState(times);
    const opens = joinOpensAt(times);
    const message = s === "cancelled" ? "This meeting was cancelled."
      : s === "draft" ? "This meeting has no time yet."
      : s === "ended" ? "This meeting has ended."
      : `Join opens ${opens ? when(opens) : "ten minutes before the start"}.`;
    return say(message, 409);
  }

  const noStore = { headers: { "cache-control": "no-store" } };
  if (canUseDaily()) {
    try {
      const room = await ensureRoom(m.host.id, m);
      const isOwner = role === "host";
      const guest = m.guests.find((g) => g.person?.id === user.id);
      const userName = isOwner ? m.host.name : guest?.person?.name ?? guest?.name ?? "Guest";
      const token = await meetingToken(room.name, { userName, isOwner, exp: room.exp });
      return Response.json({ kind: "daily", url: prebuiltUrl(room.url, token), token }, noStore);
    } catch (e) {
      if (m.callUrl) return Response.json({ kind: "link", url: m.callUrl }, noStore);
      return say(e instanceof Error ? e.message : "The call could not be set up just now.", 409);
    }
  }
  if (m.callUrl) return Response.json({ kind: "link", url: m.callUrl }, noStore);
  return say(role === "host" ? "This meeting has no call link yet. Add one on the meeting page." : "This meeting has no call link yet. Ask your host for one.", 409);
}
