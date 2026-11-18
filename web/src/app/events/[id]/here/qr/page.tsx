import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { XIcon } from "lucide-react";
import { requireUser } from "@/server/session";
import { hereState, newToken } from "@/server/connect";
import { eventDoor, isCheckedIn, setPersonalHash } from "@/server/connect-store";
import { Qr, originOf } from "../../../qr";

export const metadata: Metadata = { title: "Your QR" };
export const dynamic = "force-dynamic";

/**
 * Your QR (doc "Events and connections design guide", 2026-11-18): someone checked in to the same event scans it to
 * send you a Connect. Each time it is shown it is a new code, and only its hash is kept, so an old photo of it stops working.
 */
export default async function PersonalQrPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const e = await eventDoor(id);
  if (!e || hereState(e, await isCheckedIn(id, user.id)) !== "open") redirect(`/events/${id}`);
  const t = newToken();
  await setPersonalHash(user.id, t.hash);
  const url = `${await originOf()}/connect/${t.token}`;
  return (
    <main className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 overflow-y-auto bg-white px-4 py-8 text-black">
      <Link href={`/events/${id}/here`} aria-label="Close" className="absolute top-4 right-4 grid size-11 place-items-center rounded-full text-black/60 hover:bg-black/5 hover:text-black"><XIcon className="size-6" /></Link>
      <h1 className="text-2xl font-semibold tracking-tight">Your QR</h1>
      <Qr url={url} label="Your connect code" className="aspect-square w-full max-w-[min(80vw,65vh)]" />
      <p className="max-w-sm text-center text-sm text-black/60">Someone checked in to {e.title} scans this to connect with you. You are friends in Reflect once you both tap Connect.</p>
    </main>
  );
}
