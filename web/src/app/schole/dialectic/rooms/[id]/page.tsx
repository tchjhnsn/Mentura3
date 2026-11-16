import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PAGE } from "@/components/page-header";
import { TaskHeader } from "@/components/headers";
import { requireUser } from "@/server/session";
import { getDebate, getRoom, roomMessages } from "@/server/dialectic-store";
import { voiceOn, voiceUrl } from "@/server/voice";
import { roomAction } from "../../actions";
import { Refresh } from "../../client";
import { Face, WorkLine } from "../../parts";

export const metadata: Metadata = { title: "Room" };
export const dynamic = "force-dynamic";

const Act = ({ id, act, user, children, variant = "outline", className }: { id: string; act: string; user?: string; children: React.ReactNode; variant?: "outline" | "default" | "ghost"; className?: string }) => (
  <form action={roomAction}><input type="hidden" name="id" value={id} /><input type="hidden" name="act" value={act} />{user ? <input type="hidden" name="user" value={user} /> : null}<Button type="submit" variant={variant} className={className}>{children}</Button></form>
);

/**
 * A live room (guide tab "Ways and dialectic"): speakers as large faces (the host first), the question on the table,
 * listeners as small faces, the host's queue of raised hands, the room's chat, and at the foot Leave quietly and Ask
 * to speak. Voice runs through Daily when it is set up; the page refreshes itself every few seconds.
 */
export default async function RoomPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const r = await getRoom(id);
  if (!r) notFound();
  const [messages, debate] = await Promise.all([roomMessages(user.id, r.id), r.debateId ? getDebate(r.debateId) : null]);
  const host = r.host.id === user.id;
  const here = [...r.speakers, ...r.listeners].some((p) => p.id === user.id);
  const speaking = r.speakers.some((p) => p.id === user.id);
  const hand = r.hands.some((p) => p.id === user.id);
  const voice = !r.closed && here && voiceOn() ? await voiceUrl(r.id) : null;
  const back = debate ? `/schole/dialectic/debates/${debate.id}` : "/schole/dialectic";
  return (
    <main className={`${PAGE} pb-28`}>
      {r.closed ? null : <Refresh />}
      <TaskHeader back={{ href: back, label: "Back" }} title={debate ? debate.motion : r.title} position={r.closed ? "Closed" : "Live"} />
      <div className="mt-6 max-w-2xl space-y-6">
        <section className="space-y-3">
          <h2 className="text-muted-foreground text-sm font-semibold">Speakers</h2>
          <ul className="flex flex-wrap gap-6">
            {r.speakers.map((p, i) => (
              <li key={p.id} className="flex w-20 flex-col items-center gap-1 text-center">
                <Face p={p} size={64} ring={i === 0} />
                <span className="line-clamp-1 text-sm">{p.name}</span>
                <span className="text-muted-foreground text-xs">{p.id === r.host.id ? "Host" : debate?.seats.for?.id === p.id ? "For" : debate?.seats.against?.id === p.id ? "Against" : "Speaker"}</span>
              </li>
            ))}
            {!r.speakers.length ? <li className="text-muted-foreground text-sm">The host has not come in yet.</li> : null}
          </ul>
        </section>

        {r.question ? (
          <section className="bg-muted/50 space-y-1 rounded-lg border p-4">
            <p className="text-muted-foreground text-sm">On the table</p>
            <p className="font-semibold">{r.question}</p>
            <WorkLine workId={r.workId} source={debate?.source} className="pt-1" />
          </section>
        ) : <WorkLine workId={r.workId} />}

        <section className="space-y-3">
          <h2 className="text-muted-foreground text-sm font-semibold">Listeners</h2>
          {r.listeners.length ? <ul className="flex flex-wrap gap-2">{r.listeners.map((p) => <li key={p.id}><Face p={p} size={36} /></li>)}</ul> : <p className="text-muted-foreground text-sm">No one listening yet.</p>}
          <p className="text-muted-foreground text-sm">A raised hand goes to the host&apos;s queue.</p>
        </section>

        {host && r.hands.length && !r.closed ? (
          <section className="space-y-2">
            <h2 className="text-lg font-semibold">Hands raised</h2>
            <ul className="divide-y">{r.hands.map((p) => <li key={p.id} className="flex items-center gap-3 py-2"><Face p={p} size={28} /><span className="min-w-0 flex-1 truncate">{p.name}</span><Act id={r.id} act="let" user={p.id}>Let speak</Act></li>)}</ul>
          </section>
        ) : null}

        {voice ? (
          <section className="space-y-2">
            <h2 className="text-lg font-semibold">Voice</h2>
            <iframe src={voice} allow="microphone; autoplay" className="h-64 w-full rounded-lg border" title="Voice for this room" />
            <p className="text-muted-foreground text-xs">{speaking ? "You may speak: turn your microphone on." : "Listen with your microphone off until the host lets you speak."}</p>
          </section>
        ) : !r.closed ? <p className="text-muted-foreground text-sm">Voice is not connected yet, so the room talks in its chat below.</p> : null}

        <details className="rounded-lg border" open={!voice}>
          <summary className="cursor-pointer p-3">Room chat <span className="text-muted-foreground text-sm">· {messages.length}</span></summary>
          <div className="space-y-3 border-t p-3">
            {messages.length ? <ul className="space-y-2">{messages.map((m) => <li key={m.id} className="flex gap-2"><Face p={m.who} size={24} /><p className="min-w-0 text-sm"><span className="font-medium">{m.who.name}</span> {m.body}</p></li>)}</ul> : <p className="text-muted-foreground text-sm">Nothing said yet.</p>}
            {here && !r.closed ? (
              <form action={roomAction} className="flex gap-2"><input type="hidden" name="id" value={r.id} /><input type="hidden" name="act" value="say" /><Input name="body" required maxLength={1000} placeholder="Say something" aria-label="Say something" /><Button type="submit" variant="outline">Send</Button></form>
            ) : null}
          </div>
        </details>

        {r.closed ? <p className="text-muted-foreground text-sm">This room has closed. Recordings are not kept yet. <Link href="/schole/dialectic" className="underline underline-offset-4">Back to Dialectic</Link></p> : null}
        {host && !r.closed ? <Act id={r.id} act="close" variant="ghost" className="text-muted-foreground">Close the room</Act> : null}
      </div>

      {r.closed ? null : (
        <div className="bg-background fixed inset-x-0 bottom-0 z-20 border-t">
          <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3">
            {here ? <>
              <Act id={r.id} act="leave" className="rounded-full">Leave quietly</Act>
              {speaking ? <span className="text-muted-foreground text-sm">You are speaking</span> : hand ? <span className="text-muted-foreground text-sm">Hand raised</span> : <Act id={r.id} act="hand" variant="default" className="rounded-full">Ask to speak</Act>}
            </> : <Act id={r.id} act="join" variant="default" className="w-full rounded-full">Come in and listen</Act>}
          </div>
        </div>
      )}
    </main>
  );
}
