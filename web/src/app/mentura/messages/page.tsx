"use client";

// M5 Messages, after Contra's messages (data.ts REFS.messages): a list with search and the tabs Conversations and
// Requests on the left, the chosen conversation on the right with bubbles and a send box. On a phone the list shows
// first and the conversation replaces it when one is chosen. ?to=<handle> starts a new conversation (Message on a
// profile). What you send and accept is kept across screens (store.tsx).
import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeftIcon, SearchIcon, SendHorizontalIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Num } from "@/components/studio/bits";
import { CONVOS, ME, personOf, REQUESTS, type Convo } from "@/components/mentura/data";
import { Face } from "@/components/mentura/parts";
import { useMentura } from "@/components/mentura/store";

type Msg = Convo["messages"][number];
type Tab = "conversations" | "requests";

export default function Messages() {
  return <Suspense><Inbox /></Suspense>;
}

const linkOf = (tab: Tab, c?: string) => {
  const q = new URLSearchParams();
  if (tab === "requests") q.set("tab", "requests");
  if (c) q.set("c", c);
  const s = q.toString();
  return s ? `/mentura/messages?${s}` : "/mentura/messages";
};

function Inbox() {
  const params = useSearchParams();
  const tab: Tab = params.get("tab") === "requests" ? "requests" : "conversations";
  const picked = params.get("c");
  const to = params.get("to");
  const { sent, send: keep, answered: answer, answer: setAnswer, read: seen, markRead } = useMentura();
  const started = Object.keys(sent).filter((id) => id.startsWith("new-")).map((id) => id.slice(4));
  const fresh = [...new Set([...(to ? [to] : []), ...started])].filter((h) => h !== ME && !CONVOS.some((c) => c.with === h) && !REQUESTS.some((c) => c.with === h));
  const list = tab === "requests" ? REQUESTS : [...fresh.map((h): Convo => ({ id: `new-${h}`, with: h, unread: 0, messages: [] })), ...CONVOS];
  const [query, setQuery] = useState("");
  const read: Record<string, boolean> = Object.fromEntries(seen.map((id) => [id, true]));

  const shown = list.filter((c) => personOf(c.with).name.toLowerCase().includes(query.trim().toLowerCase()));
  const chosen = list.find((c) => c.id === (to ? `new-${to}` : picked)) ?? list.find((c) => c.id === picked) ?? list[0];
  const send = (id: string, text: string) => keep(id, text);

  return (
    <div data-virtu-screen="M5" className="flex h-[calc(100dvh-3rem)] min-w-0 md:h-[calc(100dvh-1rem)]">
      {/* The list: hidden on a phone once a conversation is chosen. */}
      <section className={cn("relative flex w-full min-w-0 flex-col border-r md:w-80 md:shrink-0", (picked || to) && "max-md:hidden")}>
        <Num n="M5.1" className="absolute top-2 right-2" />
        <div className="space-y-3 border-b px-4 pt-4 pb-3">
          <div className="flex items-center gap-2"><Num n="M5" /><h1 className="text-xl font-semibold tracking-tight">Messages</h1></div>
          <label className="bg-muted/60 flex items-center gap-2 rounded-lg px-3 py-2">
            <SearchIcon className="text-muted-foreground size-4 shrink-0" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search people" aria-label="Search messages" className="placeholder:text-muted-foreground min-w-0 flex-1 bg-transparent text-sm outline-none" />
          </label>
          <div className="flex gap-1" role="tablist">
            {(["conversations", "requests"] as const).map((t) => {
              const count = (t === "requests" ? REQUESTS : CONVOS).filter((c) => c.unread && !read[c.id]).length;
              return (
                <Link key={t} href={linkOf(t)} role="tab" aria-selected={tab === t} className={cn("flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm", tab === t ? "bg-muted font-medium" : "text-muted-foreground hover:text-foreground")}>
                  {t === "requests" ? "Requests" : "Conversations"}
                  {count ? <span className="grid size-4 place-items-center rounded-full bg-rose-500 text-[10px] font-semibold text-white">{count}</span> : null}
                </Link>
              );
            })}
          </div>
        </div>
        <ul className="flex-1 overflow-y-auto p-2">
          {shown.map((c) => {
            const all = [...c.messages, ...(sent[c.id] ?? [])];
            const last = all[all.length - 1];
            const unread = c.unread > 0 && !read[c.id];
            const active = chosen?.id === c.id;
            return (
              <li key={c.id}>
                <Link href={linkOf(tab, c.id)} onClick={() => markRead([c.id])} aria-current={active ? "true" : undefined}
                  className={cn("flex items-start gap-3 rounded-lg p-2.5", active ? "md:bg-accent" : "hover:bg-accent/50")}>
                  <Face handle={c.with} size={40} name={false} plain />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline gap-2"><span className={cn("flex-1 truncate text-sm", unread ? "font-semibold" : "font-medium")}>{personOf(c.with).name}</span><span className="text-muted-foreground shrink-0 text-xs">{last?.when}</span></span>
                    <span className="flex items-center gap-2"><span className={cn("block flex-1 truncate text-xs", unread ? "text-foreground" : "text-muted-foreground")}>{last ? `${last.from === ME ? "You: " : ""}${last.text}` : ""}</span>{unread ? <span aria-label="Unread" className="size-2 shrink-0 rounded-full bg-sky-500" /> : null}</span>
                  </span>
                </Link>
              </li>
            );
          })}
          {shown.length ? null : <li className="text-muted-foreground p-4 text-sm">{query ? "No one by that name here." : tab === "requests" ? "No requests right now." : "No conversations yet."}</li>}
        </ul>
      </section>

      {/* The conversation: on a phone it shows only once one is chosen. */}
      <section className={cn("relative flex min-w-0 flex-1 flex-col", !(picked || to) && "max-md:hidden")}>
        {chosen ? (
          <Thread key={chosen.id} convo={chosen} tab={tab} extra={sent[chosen.id] ?? []} onSend={(t) => send(chosen.id, t)}
            answer={answer[chosen.id]} onAnswer={(a) => setAnswer(chosen.id, a)} />
        ) : <p className="text-muted-foreground m-auto p-6 text-sm">Choose a conversation.</p>}
      </section>
    </div>
  );
}

function Thread({ convo, tab, extra, onSend, answer, onAnswer }: {
  convo: Convo; tab: Tab; extra: Msg[]; onSend: (text: string) => void;
  answer?: "accepted" | "declined"; onAnswer: (a: "accepted" | "declined") => void;
}) {
  const [text, setText] = useState("");
  const isRequest = tab === "requests";
  const all = [...convo.messages, ...extra];
  const canWrite = !isRequest || answer === "accepted";
  const submit = () => { const t = text.trim(); if (!t) return; onSend(t); setText(""); };

  return (
    <>
      <header className="flex items-center gap-2 border-b px-3 py-2.5 md:px-5">
        <Button asChild variant="ghost" size="icon-sm" className="md:hidden"><Link href={linkOf(tab)} aria-label="Back to messages"><ArrowLeftIcon /></Link></Button>
        <span className="min-w-0 flex-1"><Face handle={convo.with} size={36} /></span>
        <Button asChild variant="outline" size="sm"><Link href={`/mentura/p/${convo.with}`}>Profile</Link></Button>
      </header>

      <div className="relative flex-1 space-y-3 overflow-y-auto px-4 py-5 md:px-8">
        <Num n="M5.2" className="absolute top-2 right-2" />
        {!all.length ? <p className="text-muted-foreground text-center text-sm">Say hello to {personOf(convo.with).name.split(" ")[0]}. Tell them what you are making.</p> : null}
        {isRequest ? <p className="text-muted-foreground text-center text-xs">{personOf(convo.with).name.split(" ")[0]} is not in your conversations yet. Accept to reply.</p> : null}
        {all.map((m, i) => {
          const mine = m.from === ME;
          return (
            <div key={i} className={cn("flex items-end gap-2", mine && "justify-end")}>
              {mine ? null : <Face handle={m.from} size={28} name={false} />}
              <div className={cn("max-w-[80%] md:max-w-[65%]", mine && "text-right")}>
                <div className={cn("rounded-2xl px-3.5 py-2 text-left text-sm leading-relaxed break-words", mine ? "bg-foreground text-background rounded-br-md" : "bg-muted rounded-bl-md")}>{m.text}</div>
                <div className="text-muted-foreground mt-1 px-1 text-[11px]">{m.when}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="relative border-t px-3 py-3 md:px-5">
        <Num n="M5.3" className="absolute -top-2 right-3" />
        {isRequest && !answer ? (
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground flex-1 text-sm">Reply to {personOf(convo.with).name.split(" ")[0]}?</span>
            <Button variant="ghost" size="sm" onClick={() => onAnswer("declined")}>Decline</Button>
            <Button size="sm" onClick={() => onAnswer("accepted")}>Accept</Button>
          </div>
        ) : null}
        {answer === "declined" ? <p className="text-muted-foreground text-sm">You declined. {personOf(convo.with).name.split(" ")[0]} will not be told.</p> : (
          <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="flex items-end gap-2">
            <textarea value={text} onChange={(e) => setText(e.target.value)} disabled={!canWrite} rows={1} aria-label="Write a message"
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }}
              placeholder={canWrite ? `Message ${personOf(convo.with).name.split(" ")[0]}` : "Accept the request to reply"}
              className="bg-muted/60 placeholder:text-muted-foreground max-h-32 min-h-10 min-w-0 flex-1 resize-none rounded-xl px-3 py-2.5 text-sm outline-none disabled:opacity-60" />
            <Button type="submit" variant="outline" size="icon" disabled={!canWrite || !text.trim()} aria-label="Send"><SendHorizontalIcon /></Button>
          </form>
        )}
      </div>
    </>
  );
}
