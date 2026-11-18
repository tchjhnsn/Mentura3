import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MESSAGE_MAX } from "@reflect/core/messages";
import { PAGE } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { requireUser } from "@/server/session";
import { conversation } from "@/server/messages-store";
import { TileHeader } from "../../../tile-header";
import { sendMessageFromPage } from "../../../messages-actions";
import { FriendMet } from "../../../friend-met";
import { when } from "../when";

export const metadata: Metadata = { title: "Messages" };
export const dynamic = "force-dynamic";
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

/**
 * A conversation with one person the person can message (Ask Reflect plan, step 10): the messages, oldest first, and
 * a box at the bottom with Send. Anyone the person is not connected to has no conversation here.
 */
export default async function ConversationPage({ params, searchParams }: { params: Promise<{ app: string; person: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser();
  const { app, person } = await params;
  if (app !== "friends") notFound();
  const error = one((await searchParams).error);
  const c = await conversation(user.id, decodeURIComponent(person)).catch(() => null);
  if (!c) notFound();
  return (
    <main className={PAGE}>
      <TileHeader tile="friends" label="Friends" part="Messages" workspace="/life/friends/messages" />
      <div className="mx-auto mt-4 grid w-full max-w-xl gap-4 pb-12">
        <h1 id="page-title" className="text-center text-xl font-semibold tracking-tight">{c.with.name}</h1>
        <FriendMet userId={user.id} friendId={c.with.id} />
        {c.messages.length ? (
          <ol className="grid gap-2" aria-label={`Messages with ${c.with.name}`}>
            {c.messages.map((m) => (
              <li key={m.id} className={cn("grid max-w-[85%] gap-0.5", m.you ? "justify-self-end text-right" : "justify-self-start")}>
                <span className={cn("rounded-2xl px-3 py-2 text-left text-sm whitespace-pre-wrap", m.you ? "bg-primary text-primary-foreground" : "bg-muted")}>{m.text}</span>
                <span className="text-muted-foreground text-xs">{m.you ? "You" : m.from} · {when(m.at)}</span>
              </li>
            ))}
          </ol>
        ) : <p className="text-muted-foreground text-center text-sm">No messages yet.</p>}
        <form action={sendMessageFromPage.bind(null, c.with.id)} className="grid gap-2">
          {error ? <p className="text-destructive text-sm">{error}</p> : null}
          <Textarea name="text" required maxLength={MESSAGE_MAX} rows={2} aria-label={`Message to ${c.with.name}`} />
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground text-xs">Only you and {c.with.name} see these. A sent message cannot be taken back.</span>
            <Button type="submit">Send</Button>
          </div>
        </form>
      </div>
    </main>
  );
}
