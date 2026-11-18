import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { XIcon } from "lucide-react";
import { timeLabel } from "@reflect/core/events";
import { requireUser } from "@/server/session";
import { hashToken, newToken, tokenShaped } from "@/server/connect";
import { eventDoor, setDoorHash } from "@/server/connect-store";
import { Qr, originOf } from "../../qr";

export const metadata: Metadata = { title: "Check-in" };
export const dynamic = "force-dynamic";

/**
 * The door (doc "Events and connections design guide", 2026-11-18): the host's full-screen QR that guests scan to
 * check in. Only the token's hash is kept. Publishing leaves the token in a cookie for the host for a day; when that
 * cookie is gone (another device, a day later), a fresh token is made here and replaces the old one's hash.
 */
export default async function DoorPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const e = await eventDoor(id);
  if (!e || e.source !== "reflect" || e.hostUser !== user.id || e.status !== "published") notFound();
  const kept = (await cookies()).get(`event_door_${id}`)?.value;
  let token = tokenShaped(kept) && e.doorTokenHash === hashToken(kept) ? kept : null;
  if (!token) {
    const fresh = newToken();
    if (!(await setDoorHash(id, user.id, fresh.hash))) notFound();
    token = fresh.token;
  }
  const url = `${await originOf()}/events/${id}/in?t=${encodeURIComponent(token)}`;
  return (
    <main className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 overflow-y-auto bg-white px-4 py-8 text-black">
      <Link href={`/events/${id}`} aria-label="Close" className="absolute top-4 right-4 grid size-11 place-items-center rounded-full text-black/60 hover:bg-black/5 hover:text-black"><XIcon className="size-6" /></Link>
      <div className="grid gap-1 text-center">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{e.title}</h1>
        {e.startsAt ? <p className="text-base text-black/60">{timeLabel(e.startsAt)}{e.endsAt ? ` to ${timeLabel(e.endsAt)}` : ""}</p> : null}
      </div>
      <Qr url={url} label="Check-in code" className="aspect-square w-full max-w-[min(80vw,70vh)]" />
      <p className="text-center text-lg font-medium">Scan to check in</p>
      <p className="max-w-sm text-center text-sm text-black/60">Guests open their camera and scan. Once checked in, they see who else is here while the event runs.</p>
    </main>
  );
}
