import Link from "next/link";
import { Button } from "@/components/ui/button";
import { currentUser } from "@/server/session";
import { canCheckIn, hereState } from "@/server/connect";
import { eventDoor, isCheckedIn, isGoing } from "@/server/connect-store";
import { checkInAction } from "./connect-actions";

/**
 * Check in on an event page (doc "Events and connections design guide", 2026-11-18): for someone who said Going (or
 * the host) while a hosted event runs; once checked in, a way to Here. Nothing shows for an Eddy event, which has no door.
 */
export async function CheckInButton({ eventId }: { eventId: string }) {
  const user = await currentUser();
  if (!user) return null;
  const e = await eventDoor(eventId);
  if (!e || e.source !== "reflect") return null;
  const [inside, going] = await Promise.all([isCheckedIn(eventId, user.id), isGoing(eventId, user.id)]);
  if (inside && hereState(e, true) !== "closed") return <Button asChild><Link href={`/events/${eventId}/here`}>See who&apos;s here</Link></Button>;
  if (inside || !canCheckIn(e) || !(going || e.hostUser === user.id)) return null;
  return <form action={checkInAction.bind(null, eventId)}><Button type="submit">Check in</Button></form>;
}
