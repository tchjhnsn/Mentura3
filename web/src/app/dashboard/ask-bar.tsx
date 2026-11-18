"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { ArrowUpIcon, MessageSquareIcon, SquareIcon, XIcon } from "lucide-react";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Answer, CARRY_KEY, MODEL_KEY } from "@/app/chat/chat";
import { wordsOf } from "@/app/chat/message-tools";
import { MicButton } from "./mic-button";

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const noop = () => () => {};

/**
 * The dashboard's ask bar: one line to Ask Reflect, which answers right here in a panel under the bar. It is the same
 * chat as Ask (/api/chat, the same model, tools and cards, Approval and Undo included), streamed, and kept in the chat
 * history under one id. A second question carries on the same conversation; "Continue in chat" opens it in Ask with
 * everything so far. A suggestion asks in one tap. Cmd-K or Ctrl-K, or / when not typing elsewhere, puts the cursor
 * in it; wide screens show the shortcut.
 */
export function AskBar({ suggestions }: { suggestions: string[] }) {
  const router = useRouter();
  const [q, setQ] = React.useState("");
  // One conversation per visit until the person closes the panel; a new id after that starts a new chat.
  const [id, setId] = React.useState(() => crypto.randomUUID());
  const model = React.useRef("default");
  React.useEffect(() => {
    try {
      model.current = localStorage.getItem(MODEL_KEY) || "default";
    } catch {
      // No storage (a private window): the default model.
    }
  }, []);
  const [transport] = React.useState(() => new DefaultChatTransport({ api: "/api/chat", body: () => ({ localDate: today(), model: model.current }) }));
  const { messages, sendMessage, setMessages, status, error, regenerate, stop } = useChat({ id, transport });
  const busy = status === "submitted" || status === "streaming";
  // Which key to show is known only in the browser; the server renders no hint.
  const mac = React.useSyncExternalStore(noop, () => /Mac|iPhone|iPad/.test(navigator.userAgent), () => null);
  const input = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLElement && (e.target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName));
      if ((e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey) && !e.altKey && !e.shiftKey) || (e.key === "/" && !typing && !e.metaKey && !e.ctrlKey)) {
        e.preventDefault();
        input.current?.focus();
        input.current?.select();
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  const lastAnswer = [...messages].reverse().find((m) => m.role === "assistant")?.id;

  const ask = (text: string) => {
    const t = text.trim();
    if (!t || busy) return;
    void sendMessage({ text: t });
    setQ("");
  };
  const close = () => {
    if (busy) void stop();
    setMessages([]);
    setId(crypto.randomUUID());
  };
  const continueInChat = () => {
    try {
      sessionStorage.setItem(CARRY_KEY, JSON.stringify({ id, messages }));
    } catch {
      // No storage: Ask opens the conversation from its words in the chat history.
    }
    router.push(`/chat?c=${id}`);
  };

  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-3">
      <form onSubmit={(e) => { e.preventDefault(); ask(q); }} className="bg-card focus-within:ring-ring/50 flex items-center gap-2 rounded-2xl border p-2 pl-4 shadow-xs focus-within:ring-[3px]">
        <input ref={input} value={q} onChange={(e) => setQ(e.target.value)} placeholder={messages.length ? "Ask a follow-up" : "Ask Reflect or tell it what to do"} aria-label="Ask Reflect" aria-keyshortcuts="Meta+K Control+K /" className="placeholder:text-muted-foreground min-w-0 flex-1 bg-transparent py-2 text-base outline-none" />
        <MicButton onText={setQ} />
        {mac !== null && !q && !busy ? (
          <kbd className="text-muted-foreground bg-muted hidden shrink-0 rounded-md border px-1.5 py-0.5 font-sans text-xs lg:inline-block" aria-hidden="true">{mac ? "⌘K" : "Ctrl K"}</kbd>
        ) : null}
        {busy ? (
          <Button type="button" size="icon" className="rounded-full" aria-label="Stop" onClick={() => void stop()}><SquareIcon /></Button>
        ) : (
          <Button type="submit" size="icon" className="rounded-full" aria-label="Ask" disabled={!q.trim()}><ArrowUpIcon /></Button>
        )}
      </form>
      {messages.length ? (
        <Card className="gap-0 py-0" aria-live="polite" aria-busy={busy}>
          <CardContent className="grid max-h-[70vh] grid-cols-[minmax(0,1fr)] gap-4 overflow-y-auto p-4">
            {messages.map((m) => m.role === "user" ? (
              <Bubble key={m.id} align="end" variant="muted" className="justify-self-end">
                <BubbleContent className="whitespace-pre-wrap">{wordsOf(m)}</BubbleContent>
              </Bubble>
            ) : (
              <div key={m.id} className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-3 text-sm">
                <Answer message={m} streaming={busy && m.id === lastAnswer} />
              </div>
            ))}
            {status === "submitted" ? <p role="status" className="text-muted-foreground shimmer text-sm">Thinking</p> : null}
            {error ? (
              <div role="alert" className="text-muted-foreground flex flex-wrap items-center gap-3 text-sm">
                <span>Ask Reflect could not answer just now. Your apps are all still there.</span>
                <Button size="sm" variant="outline" onClick={() => void regenerate()}>Try again</Button>
              </div>
            ) : null}
          </CardContent>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t px-4 py-2">
            <span className="text-muted-foreground text-xs">Ask Reflect is an AI and can be wrong.</span>
            <span className="flex items-center gap-1">
              <Button size="sm" variant="ghost" onClick={continueInChat} disabled={busy}><MessageSquareIcon />Continue in chat</Button>
              <Button size="icon-sm" variant="ghost" aria-label="Close the answer" onClick={close}><XIcon /></Button>
            </span>
          </div>
        </Card>
      ) : (
        <ul className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [&>li]:shrink-0">
          {suggestions.map((s) => (
            <li key={s}><button type="button" onClick={() => ask(s)} className="hover:bg-accent text-muted-foreground hover:text-foreground rounded-full border px-3 py-1.5 text-sm transition">{s}</button></li>
          ))}
        </ul>
      )}
    </div>
  );
}
