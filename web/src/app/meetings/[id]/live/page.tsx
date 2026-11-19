import { PrepPanel } from "@/components/meetings/prep-panel";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";
import { agendaItems, canJoin, joinOpensAt, meetingState } from "@reflect/core/meetings";
import { Button } from "@/components/ui/button";
import { CallFrame, Elapsed, LinkCall } from "@/components/meetings/call-frame";
import { canUseDaily } from "@/server/daily";
import { meetingFor, type MeetingView } from "@/server/meetings-store";
import { requireUser } from "@/server/session";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const user = await requireUser();
  return { title: (await meetingFor(user.id, id).catch(() => null))?.title ?? "Meeting" };
}

const when = (iso: string) => new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", weekday: "long", month: "long", day: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short" }).format(new Date(iso));

/**
 * A meeting's call (doc "Mentura meetings and building-only Mentura design guide", 2026-11-19). The call is the
 * largest thing on screen: a top bar with the title, the way back to the meeting and the elapsed time; the call
 * filling the main area (Daily Prebuilt when the deployment has DAILY_API_KEY, else the meeting's own link opened in
 * a new tab); and on wide screens a column with the agenda and, for the host, their private prep. Before Join opens
 * it says when it does. Only the host and the guests can open it.
 */
export default async function LivePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const m = await meetingFor(user.id, id);
  if (!m) notFound();
  const times = { startsAt: m.startsAt, minutes: m.minutes, cancelled: m.cancelled };
  const back = `/meetings/${m.id}`;

  if (!canJoin(times)) return <NotOpen m={m} back={back} />;

  const daily = canUseDaily();
  const items = agendaItems(m.agenda);
  return (
    <main className="flex h-dvh min-h-0 flex-col">
      <header className="flex min-h-12 shrink-0 items-center gap-3 border-b px-4 py-2">
        <Button asChild variant="ghost" size="icon-sm" className="-ml-1"><Link href={back} aria-label="Back to the meeting"><ArrowLeftIcon /></Link></Button>
        <h1 className="min-w-0 flex-1 truncate font-semibold">{m.title}</h1>
        <Elapsed startsAt={m.startsAt} />
      </header>
      <div className="flex min-h-0 flex-1">
        <section aria-label="Call" className="min-w-0 flex-1">
          {daily ? <CallFrame meetingId={m.id} title={m.title} />
            : m.callUrl ? <LinkCall title={m.title} url={m.callUrl} />
            : <NoLink host={m.role === "host"} back={back} />}
        </section>
        <aside aria-label="Beside the call" className="hidden w-80 shrink-0 flex-col gap-6 overflow-y-auto border-l p-4 lg:flex">
          <section className="grid gap-2">
            <h2 className="text-sm font-semibold">Agenda</h2>
            {items.length ? (
              <ol className="grid list-decimal gap-1.5 pl-5 text-sm">{items.map((t, i) => <li key={i}>{t}</li>)}</ol>
            ) : <p className="text-muted-foreground text-sm">No agenda.</p>}
          </section>
          {m.role === "host" ? <PrepPanel meetingId={id} hostId={user.id} /> : null}
        </aside>
      </div>
    </main>
  );
}

function NoLink({ host, back }: { host: boolean; back: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="max-w-sm">{host ? "This meeting has no call link yet. Add one on the meeting page." : "This meeting has no call link yet. Ask your host for one."}</p>
      <Button asChild variant="outline"><Link href={back}>Back to the meeting</Link></Button>
    </div>
  );
}

function NotOpen({ m, back }: { m: MeetingView; back: string }) {
  const times = { startsAt: m.startsAt, minutes: m.minutes, cancelled: m.cancelled };
  const s = meetingState(times);
  const opens = joinOpensAt(times);
  const line = s === "cancelled" ? "This meeting was cancelled."
    : s === "ended" ? "This meeting has ended."
    : s === "draft" || !opens ? "This meeting has no time yet."
    : `Join opens ${when(opens)}, ten minutes before the start.`;
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-4 px-6 py-6 text-center">
      <h1 className="text-2xl font-semibold tracking-tight break-words">{m.title}</h1>
      <p className="text-muted-foreground">{line}</p>
      <Button asChild variant="outline"><Link href={back}><ArrowLeftIcon />Back to the meeting</Link></Button>
    </main>
  );
}
