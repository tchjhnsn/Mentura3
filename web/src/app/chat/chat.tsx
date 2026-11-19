"use client";

// Ask, built as shadcn/ui's AI Elements say (ui.shadcn.com/docs/ai-elements): Chat on Message Scroller, Message
// with Bubble, Prompt Input on Input Group with the Model Selector and Context, Suggestion for starters, and each
// answer's steps as Reasoning, Chain of Thought, Tool, Task and Stack Trace lines (./elements.tsx), its Sources,
// and a Checkpoint between turns. Cards (json-render) and held changes (Confirmation, Plan, Queue) are in
// ./registry.tsx. Same /api/chat as before.
import * as React from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { SPEC_DATA_PART_TYPE } from "@json-render/core";
import { JSONUIProvider, Renderer, useJsonRenderMessage } from "@json-render/react";
import { ArrowUpIcon, MessageCircleIcon, SquareIcon } from "lucide-react";
import { usePane } from "@/components/pane-context";
import { SidebarButton } from "@/components/sidebar";
import { MessageResponse } from "@/components/ai-elements/message";
import { PromptInputSpeechButton } from "@/components/ai-elements/prompt-input";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupTextarea } from "@/components/ui/input-group";
import { Message, MessageContent, MessageFooter } from "@/components/ui/message";
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@/components/ui/message-scroller";
import { Checkpoint, ContextMeter, ModelMenu, Sources, Steps, stepsOf } from "./elements";
import { AnswerTools, AskedTools, wordsOf } from "./message-tools";
import { Queue, registry } from "./registry";
import type { planCard } from "./spec";

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const STARTERS = ["Help me think through a decision", "What should I read next?", "What's on my calendar this week?"];
export const MODEL_KEY = "reflect.ask.model";
/** Where a page that asked inline (the dashboard's ask bar) leaves its conversation for "Continue in chat": { id, messages }. */
export const CARRY_KEY = "reflect.ask.carry";

/** The conversation another page left for this chat id, or null. Read once and removed. */
function carried(id: string): UIMessage[] | null {
  try {
    const raw = sessionStorage.getItem(CARRY_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as { id?: unknown; messages?: unknown };
    if (v.id !== id || !Array.isArray(v.messages)) return null;
    sessionStorage.removeItem(CARRY_KEY);
    return v.messages as UIMessage[];
  } catch {
    return null;
  }
}

/** One answer of Ask Reflect: its steps, cards (with Approval and Undo), words and sources. The dashboard's ask bar draws answers with it too. */
export function Answer({ message, streaming }: { message: UIMessage; streaming: boolean }) {
  const { spec } = useJsonRenderMessage(message.parts);
  const reply = message.parts.filter((p) => p.type === "text" && p.text.trim());
  const hasCards = Boolean(spec) && message.parts.some((p) => p.type === SPEC_DATA_PART_TYPE);
  return (
    <>
      <Steps steps={stepsOf(message)} streaming={streaming} />
      {hasCards && spec ? (
        <JSONUIProvider registry={registry}>
          <Renderer spec={spec} registry={registry} />
        </JSONUIProvider>
      ) : null}
      {reply.map((p, i) => (p.type === "text" ? <MessageResponse key={i}>{p.text}</MessageResponse> : null))}
      <Sources message={message} />
    </>
  );
}

/** A held change shown at the top of Ask, with where it was asked for. */
export type Waiting = { change: string; title: string; preview: string; tap: "Keep" | "Send"; from: string };

/** What the second pane (src/components/pane.tsx) gives a chat it holds: the pane draws the header, and hears the chat's id, words and title for its tab and for Open as a page. */
export type InPane = { onState: (s: { id: string; messages: UIMessage[]; title: string }) => void };

export function Chat({ ask, pending = [], plans = [], chatId, initial, pane }: { ask?: string; pending?: Waiting[]; plans?: ReturnType<typeof planCard>[]; chatId?: string; initial?: UIMessage[]; pane?: InPane } = {}) {
  // A chat's id (a uuid), made once per visit to the page; the chat is kept under it in the chat history. A chat
  // continued from another page (the dashboard) keeps that page's id, so it stays one conversation in the history.
  const [id] = React.useState(() => chatId ?? crypto.randomUUID());
  const [model, setModel] = React.useState("default");
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem(MODEL_KEY);
      if (saved) setModel(saved);
    } catch {
      // No storage (a private window): the default model.
    }
  }, []);
  const modelRef = React.useRef(model);
  modelRef.current = model;
  // The device's date goes with each message, so the journal entry this chat is kept in has the person's day.
  const [transport] = React.useState(() => new DefaultChatTransport({ api: "/api/chat", body: () => ({ localDate: today(), model: modelRef.current }) }));
  const { messages, sendMessage, setMessages, status, error, regenerate, stop } = useChat({ id, transport, ...(initial?.length ? { messages: initial } : {}) });
  // The whole conversation as the other page had it (cards and steps too), when it left one; otherwise `initial`, its
  // words as the chat history keeps them.
  React.useEffect(() => {
    if (!chatId) return;
    const left = carried(chatId);
    if (left?.length) setMessages(left);
  }, [chatId, setMessages]);
  const [draft, setDraft] = React.useState("");
  const form = React.useRef<HTMLFormElement>(null);
  const input = React.useRef<HTMLTextAreaElement>(null);
  const busy = status === "submitted" || status === "streaming";
  const lastAnswer = [...messages].reverse().find((m) => m.role === "assistant")?.id;
  const pick = (m: string) => {
    setModel(m);
    try {
      localStorage.setItem(MODEL_KEY, m);
    } catch {
      // Kept for this visit only.
    }
  };
  // The pane hears this chat's state for its tab's title and for Open as a page.
  const onState = pane?.onState;
  React.useEffect(() => {
    onState?.({ id, messages, title: (messages[0] && wordsOf(messages[0]).slice(0, 40)) || "New Chat" });
  }, [onState, id, messages]);
  // open_pane (src/server/actions/pane.ts): when the call finishes, the page opens in a tab beside the chat. Calls
  // already in the conversation when it was opened (a carried chat) do not open again.
  const paneCtl = usePane();
  const opened = React.useRef<Set<string> | null>(null);
  React.useEffect(() => {
    const calls = messages.flatMap((m) => m.parts.filter((p) => p.type === "tool-open_pane")) as { toolCallId: string; state: string; input?: { path?: string; title?: string } }[];
    if (!opened.current) {
      opened.current = new Set(calls.map((c) => c.toolCallId));
      return;
    }
    for (const c of calls) {
      if (c.state !== "output-available" || opened.current.has(c.toolCallId) || !c.input?.path?.startsWith("/")) continue;
      opened.current.add(c.toolCallId);
      // Only into a pane the person opened; never a page change they did not ask for.
      paneCtl?.openPage(c.input.path, c.input.title);
    }
  }, [messages, paneCtl]);
  const send = (words: string) => {
    if (!words.trim() || busy) return;
    void sendMessage({ text: words.trim() });
    setDraft("");
  };

  return (
    <MessageScrollerProvider>
      <div className={pane ? "flex h-full flex-col gap-3 px-3 pt-3 pb-3" : "mx-auto flex h-screen max-w-3xl flex-col gap-3 p-4 sm:p-6"}>
        {pane ? null : (
          <div className="flex items-center justify-between">
            <SidebarButton className="-ml-2" />
            <span className="text-sm font-medium">{messages.length ? "Chat" : "New Chat"}</span>
            <a href="/chat/history" className="text-muted-foreground text-sm hover:text-foreground">History</a>
          </div>
        )}
        <Queue pending={pending} plans={plans} />
        <div className="min-h-0 flex-1">
          {messages.length === 0 ? (
            <Empty className="h-full">
              <EmptyHeader>
                <EmptyMedia variant="icon"><MessageCircleIcon /></EmptyMedia>
                <EmptyTitle>What's on your mind?</EmptyTitle>
                <EmptyDescription>Talk something through, or ask about anything in Reflect. This chat is kept in your chat history; nothing changes in your apps unless you say so.</EmptyDescription>
              </EmptyHeader>
              {/* Suggestion: one tap sends it. */}
              <div className="flex flex-wrap justify-center gap-2">
                {(ask ? [ask, ...STARTERS] : STARTERS).map((s) => (
                  <Button key={s} variant="outline" size="sm" className="rounded-full" onClick={() => send(s)}>{s}</Button>
                ))}
              </div>
            </Empty>
          ) : (
            <MessageScroller>
              <MessageScrollerViewport>
                <MessageScrollerContent aria-busy={busy} className="gap-6 py-2">
                  {messages.map((m, i) => {
                    if (m.role === "user") {
                      return (
                        <MessageScrollerItem key={m.id} messageId={m.id} scrollAnchor>
                          <Message align="end" className="group">
                            <MessageContent>
                              <Bubble align="end" variant="muted">
                                <BubbleContent className="whitespace-pre-wrap">{wordsOf(m)}</BubbleContent>
                              </Bubble>
                              <AskedTools message={m} busy={busy} onEdit={(words) => void sendMessage({ text: words, messageId: m.id })} />
                            </MessageContent>
                          </Message>
                        </MessageScrollerItem>
                      );
                    }
                    const latest = m.id === lastAnswer;
                    return (
                      <MessageScrollerItem key={m.id} messageId={m.id}>
                        <Message className="group">
                          <MessageContent className="gap-3">
                            <Answer message={m} streaming={busy && latest} />
                            <MessageFooter>
                              <AnswerTools message={m} latest={latest} busy={busy} onRetry={() => void regenerate()} />
                            </MessageFooter>
                          </MessageContent>
                        </Message>
                        {!latest ? <Checkpoint disabled={busy} onRestore={() => setMessages(messages.slice(0, i + 1))} /> : null}
                      </MessageScrollerItem>
                    );
                  })}
                  {status === "submitted" ? <p role="status" className="text-muted-foreground shimmer text-sm">Thinking</p> : null}
                  {error ? (
                    <div role="alert" className="text-muted-foreground flex items-center gap-3 text-sm">
                      <span>The chat could not answer just now. Your apps are all still there.</span>
                      <Button size="sm" variant="outline" onClick={() => void regenerate()}>Try again</Button>
                    </div>
                  ) : null}
                </MessageScrollerContent>
              </MessageScrollerViewport>
              <MessageScrollerButton variant="outline" />
            </MessageScroller>
          )}
        </div>
        <form ref={form} onSubmit={(e) => { e.preventDefault(); send(draft); }}>
          <InputGroup>
            <InputGroupTextarea
              ref={input}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Say anything..."
              aria-label="Message"
              className="min-h-14"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  form.current?.requestSubmit();
                }
              }}
            />
            <InputGroupAddon align="block-end" className="pt-1">
              <ModelMenu value={model} onChange={pick} />
              <ContextMeter messages={messages} model={model} />
              <PromptInputSpeechButton textareaRef={input} onTranscriptionChange={setDraft} aria-label="Speak instead of typing" />
              {busy ? (
                <InputGroupButton type="button" variant="default" size="icon-sm" className="ml-auto rounded-full" aria-label="Stop" onClick={() => void stop()}>
                  <SquareIcon />
                </InputGroupButton>
              ) : (
                <InputGroupButton type="submit" variant="default" size="icon-sm" className="ml-auto rounded-full" aria-label="Send" disabled={!draft.trim()}>
                  <ArrowUpIcon />
                </InputGroupButton>
              )}
            </InputGroupAddon>
          </InputGroup>
        </form>
        {/* AI disclosure (California SB 243, New York's AI companion law): always shown, beside the input. */}
        <p className="text-muted-foreground -mt-1 text-center text-xs">Replies come from an AI and can be wrong.</p>
      </div>
    </MessageScrollerProvider>
  );
}
