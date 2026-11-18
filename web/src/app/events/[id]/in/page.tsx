import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PAGE } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { currentUser } from "@/server/session";
import { canCheckIn, hashToken, tokenShaped } from "@/server/connect";
import { checkIn, eventDoor } from "@/server/connect-store";

export const metadata: Metadata = { title: "Check in" };
export const dynamic = "force-dynamic";

/**
 * Where the door's QR opens (doc "Events and connections design guide", 2026-11-18): signs in first, checks the
 * token against the event's kept hash, checks the person in and opens Here. A code from before the host made a new
 * one, or outside the event's hours, says so instead.
 */
export default async function CheckInPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ t?: string | string[] }> }) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const t = Array.isArray(sp.t) ? sp.t[0] : sp.t;
  const user = await currentUser();
  if (!user) redirect(`/sign-in?next=${encodeURIComponent(`/events/${id}/in?t=${t ?? ""}`)}`);
  const e = await eventDoor(id);
  const valid = Boolean(e && tokenShaped(t) && e.doorTokenHash && e.doorTokenHash === hashToken(t));
  if (e && valid && canCheckIn(e)) {
    await checkIn(e.id, user.id);
    redirect(`/events/${e.id}/here`);
  }
  return (
    <main className={PAGE}>
      <div className="mx-auto mt-16 grid max-w-md gap-4 text-center">
        <h1 className="text-xl font-semibold">{!e || !valid ? "This code no longer checks anyone in" : "Check-in is open only while the event runs"}</h1>
        <p className="text-muted-foreground text-sm">{!e || !valid ? "Ask the host to show the code at the door again." : "Doors open an hour before the start."}</p>
        <div><Button asChild variant="outline"><Link href={e ? `/events/${e.id}` : "/"}>{e ? e.title : "Go home"}</Link></Button></div>
      </div>
    </main>
  );
}
