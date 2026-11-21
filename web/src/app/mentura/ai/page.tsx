"use client";

// M3 AI chat, after Contra's "Chatting with AI" (data.ts REFS.ai) and "Chat history" (REFS.aiHistory): you talk to the
// AI model itself, not to a named agent. A thread list on the left (C15) with New chat and Archive (with Contra's
// "Are you sure?"), and in the middle the mark, "What should we work on?", one ask box, suggestion chips and Up next;
// once you ask, the conversation with a reply box at the foot and a thumbs up or down under each answer. Answers come
// from the real model through /api/chat, the same one Reflect's Ask uses, with its tools and cards. Threads are kept in
// this browser; ?q= asks that question on load (the Dashboard's ask box sends it here).
import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { ArchiveIcon, ArrowUpIcon, EllipsisIcon, MessageSquarePlusIcon, PanelLeftIcon, SquareIcon, ThumbsDownIcon, ThumbsUpIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Num } from "@/components/studio/bits";
import { Answer } from "@/app/chat/chat";
import { wordsOf } from "@/app/chat/message-tools";
import { ME, personOf } from "@/components/mentura/data";

type Thread = { id: string; title: string; at: number; messages: UIMessage[] };
const KEY = "mentura-ai-threads-v1";
const SUGGEST = ["Audit my Mentura profile", "Draft a post about what I made this week", "Which investors fit a pre-seed hardware raise?", "Ideas for a founder dinner in Austin", "Prepare me for a first investor meeting"];
const UP_NEXT = [{ t: "What can I do with the AI in Mentura?", s: "Profile, posts, people, events and meetings", q: "What can you help me with in Mentura, a network where founders and investors talk about what they make and do?" }];

const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
const ago = (t: number) => { const m = Math.max(1, Math.round((Date.now() - t) / 60000)); return m < 60 ? `${m}m` : m < 1440 ? `${Math.round(m / 60)}h` : `${Math.round(m / 1440)}d`; };
const load = (): Thread[] => { try { return JSON.parse(localStorage.getItem(KEY) ?? "[]") as Thread[]; } catch { return []; } };
const keep = (t: Thread[]) => { try { localStorage.setItem(KEY, JSON.stringify(t.slice(0, 30))); } catch { /* no storage */ } };

export default function AiChat() {
  return <Suspense><Page /></Suspense>;
}

function Page() {
  const params = useSearchParams();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [id, setId] = useState(() => crypto.randomUUID());
  const [list, setList] = useState(true);
  const [archive, setArchive] = useState<Thread | null>(null);
  useEffect(() => { setThreads(load()); setList(window.matchMedia("(min-width: 1024px)").matches); }, []);

  const open = (t: Thread | null) => { setId(t?.id ?? crypto.randomUUID()); if (!window.matchMedia("(min-width: 1024px)").matches) setList(false); };
  const save = (tid: string, messages: UIMessage[]) => setThreads((all) => {
    const first = messages.find((m) => m.role === "user");
    if (!first) return all;
    const rest = all.filter((t) => t.id !== tid);
    const prev = all.find((t) => t.id === tid);
    const next = [{ id: tid, title: prev?.title ?? wordsOf(first).slice(0, 60), at: Date.now(), messages }, ...rest];
    keep(next);
    return next;
  });
  const remove = (t: Thread) => { const next = threads.filter((x) => x.id !== t.id); setThreads(next); keep(next); if (t.id === id) open(null); setArchive(null); };

  return (
    <div data-virtu-screen="M3" className="relative flex h-[calc(100dvh-3rem)] md:h-[calc(100dvh-1rem-2px)]">
      <Num n="M3" className="absolute top-2 left-2 z-10" />
      {list ? (
        <aside className="bg-background relative flex w-60 shrink-0 flex-col border-r max-lg:absolute max-lg:inset-y-0 max-lg:left-0 max-lg:z-20 max-lg:shadow-lg">
          <Num n="C15" className="absolute top-2 right-2" />
          <div className="flex items-center gap-1 px-2 pt-2">
            <Button variant="ghost" size="icon-sm" aria-label="Hide threads" onClick={() => setList(false)}><PanelLeftIcon /></Button>
            <div className="flex-1" />
            <Button variant="ghost" size="icon-sm" aria-label="New chat" title="New chat" onClick={() => open(null)}><MessageSquarePlusIcon /></Button>
          </div>
          <div className="text-muted-foreground px-4 pt-3 pb-1 text-xs">Threads</div>
          <ul className="min-h-0 flex-1 space-y-0.5 overflow-y-auto px-2 pb-3">
            {threads.length ? threads.map((t) => (
              <li key={t.id} className={cn("group flex items-center rounded-md text-sm", t.id === id ? "bg-muted font-medium" : "hover:bg-accent/60")}>
                <button type="button" onClick={() => open(t)} className="min-w-0 flex-1 truncate px-2 py-1.5 text-left">{t.title}</button>
                <span className="text-muted-foreground pr-1 text-xs group-hover:hidden">{ago(t.at)}</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild><Button variant="ghost" size="icon-xs" aria-label={`More for ${t.title}`} className="hidden group-hover:inline-flex data-[state=open]:inline-flex"><EllipsisIcon /></Button></DropdownMenuTrigger>
                  <DropdownMenuContent align="end"><DropdownMenuItem onSelect={() => setArchive(t)}><ArchiveIcon />Archive</DropdownMenuItem></DropdownMenuContent>
                </DropdownMenu>
              </li>
            )) : <li className="text-muted-foreground px-2 py-1.5 text-xs">Your chats will show here.</li>}
          </ul>
        </aside>
      ) : null}
      <div className="relative min-w-0 flex-1">
        {!list ? <Button variant="ghost" size="icon-sm" aria-label="Show threads" className="absolute top-2 left-8 z-10" onClick={() => setList(true)}><PanelLeftIcon /></Button> : null}
        <Conversation key={id} id={id} initial={threads.find((t) => t.id === id)?.messages ?? []} ask={params.get("q")} onChange={save} />
      </div>

      <Dialog open={Boolean(archive)} onOpenChange={(o) => { if (!o) setArchive(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Are you sure?</DialogTitle><DialogDescription>Archiving this thread hides it from your list and the AI will not see it again.</DialogDescription></DialogHeader>
          <DialogFooter><Button variant="outline" onClick={() => setArchive(null)}>Cancel</Button><Button variant="destructive" onClick={() => archive && remove(archive)}>Archive</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Conversation({ id, initial, ask, onChange }: { id: string; initial: UIMessage[]; ask: string | null; onChange: (id: string, m: UIMessage[]) => void }) {
  const [transport] = useState(() => new DefaultChatTransport({ api: "/api/chat", body: () => ({ localDate: today() }) }));
  const { messages, sendMessage, status, error, regenerate, stop } = useChat({ id, transport, messages: initial });
  const [text, setText] = useState("");
  const [rated, setRated] = useState<Record<string, "up" | "down">>({});
  const busy = status === "submitted" || status === "streaming";
  const asked = useRef(false);
  const end = useRef<HTMLDivElement>(null);
  const first = personOf(ME).name.split(" ")[0];

  const send = (q: string) => { const t = q.trim(); if (!t || busy) return; void sendMessage({ text: t }); setText(""); };
  useEffect(() => { if (ask && !asked.current && !initial.length) { asked.current = true; send(ask); } }); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (messages.length && !busy) onChange(id, messages); }, [messages, busy]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { end.current?.scrollIntoView({ block: "end" }); }, [messages, status]);
  const last = [...messages].reverse().find((m) => m.role === "assistant")?.id;

  const box = (big: boolean) => (
    <form onSubmit={(e) => { e.preventDefault(); send(text); }} className="bg-card focus-within:ring-ring/40 relative w-full rounded-2xl border p-3 shadow-sm focus-within:ring-[3px]">
      <textarea value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(text); } }}
        rows={big ? 3 : 1} placeholder={big ? "How can I help you today?" : "Reply..."} aria-label="Ask the AI" className="placeholder:text-muted-foreground w-full resize-none bg-transparent px-1 text-[15px] outline-none" />
      <div className="flex items-center justify-end gap-2">
        {busy ? <Button type="button" size="sm" variant="outline" onClick={() => void stop()}><SquareIcon />Stop</Button> : <Button type="submit" size="sm" disabled={!text.trim()}>Send<ArrowUpIcon /></Button>}
      </div>
    </form>
  );

  if (!messages.length) return (
    <div className="mx-auto flex h-full max-w-2xl flex-col justify-center px-4 pb-16">
      <span aria-hidden className="mx-auto size-12 rounded-full" style={{ background: "conic-gradient(from 200deg, oklch(0.7 0.18 150), oklch(0.65 0.2 250), oklch(0.7 0.2 330), oklch(0.8 0.15 80), oklch(0.7 0.18 150))", boxShadow: "inset 0 0 0 3px var(--background)" }} />
      <h1 className="mt-5 text-center text-3xl font-medium tracking-tight md:text-4xl">What should we work on, {first}?</h1>
      <div className="relative mt-6"><Num n="M3.1" className="absolute -top-2 right-3 z-10" />{box(true)}</div>
      <ul className="relative mt-3 flex gap-2 overflow-x-auto pb-1 [&>li]:shrink-0">
        <Num n="M3.2" className="absolute -top-2 right-0" />
        {SUGGEST.map((s) => <li key={s}><button type="button" onClick={() => send(s)} className="text-muted-foreground hover:bg-accent hover:text-foreground rounded-full border px-3 py-1.5 text-sm">{s}</button></li>)}
      </ul>
      <section className="relative mt-8">
        <Num n="M3.3" className="absolute -top-2 right-0" />
        <h2 className="text-muted-foreground text-xs">Up next</h2>
        <ul className="mt-2 divide-y border-y">
          {UP_NEXT.map((u) => <li key={u.t}><button type="button" onClick={() => send(u.q)} className="hover:bg-accent/50 flex w-full items-center gap-3 py-2.5 text-left"><span aria-hidden className="size-7 shrink-0 rounded-full" style={{ background: "conic-gradient(oklch(0.7 0.18 150), oklch(0.65 0.2 250), oklch(0.7 0.18 150))" }} /><span><span className="block text-sm font-medium">{u.t}</span><span className="text-muted-foreground block text-xs">{u.s}</span></span></button></li>)}
        </ul>
      </section>
    </div>
  );

  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto grid max-w-2xl grid-cols-[minmax(0,1fr)] gap-5 px-4 pt-12 pb-6" aria-live="polite" aria-busy={busy}>
          {messages.map((m) => m.role === "user" ? (
            <Bubble key={m.id} align="end" variant="muted" className="justify-self-end"><BubbleContent className="whitespace-pre-wrap">{wordsOf(m)}</BubbleContent></Bubble>
          ) : (
            <div key={m.id} className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-3 text-[15px]">
              <Answer message={m} streaming={busy && m.id === last} />
              {!(busy && m.id === last) ? (
                <div className="text-muted-foreground flex gap-1">
                  <Button variant="ghost" size="icon-xs" aria-label="Good answer" aria-pressed={rated[m.id] === "up"} className={cn(rated[m.id] === "up" && "text-foreground")} onClick={() => setRated({ ...rated, [m.id]: "up" })}><ThumbsUpIcon /></Button>
                  <Button variant="ghost" size="icon-xs" aria-label="Bad answer" aria-pressed={rated[m.id] === "down"} className={cn(rated[m.id] === "down" && "text-foreground")} onClick={() => setRated({ ...rated, [m.id]: "down" })}><ThumbsDownIcon /></Button>
                </div>
              ) : null}
            </div>
          ))}
          {status === "submitted" ? <p role="status" className="text-muted-foreground shimmer text-sm">Thinking</p> : null}
          {error ? (
            <div role="alert" className="text-muted-foreground flex flex-wrap items-center gap-3 text-sm">
              <span>{/401|sign in/i.test(error.message) ? "Sign in to chat with the AI." : "The AI could not answer just now."}</span>
              <Button size="sm" variant="outline" onClick={() => void regenerate()}>Try again</Button>
            </div>
          ) : null}
          <div ref={end} />
        </div>
      </div>
      <div className="mx-auto w-full max-w-2xl px-4 pb-4">{box(false)}<p className="text-muted-foreground mt-1.5 text-center text-xs">Replies come from an AI and can be wrong.</p></div>
    </div>
  );
}
