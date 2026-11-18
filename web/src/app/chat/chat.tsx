"use client";

// The chat with AI Elements (shadcn): Conversation, Message, Tool, Suggestion and Prompt Input, over the
// same /api/chat and the same cards. Torian chose this look over the mono one (2026-11-12).
import { Suspense } from "react";
import { BackButton } from "@/components/back-button";
import { SidebarButton } from "@/components/sidebar";
import { useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type ToolUIPart, type UIMessage } from "ai";
import { SPEC_DATA_PART_TYPE } from "@json-render/core";
import { JSONUIProvider, Renderer, useJsonRenderMessage } from "@json-render/react";
import { Conversation, ConversationContent, ConversationEmptyState, ConversationScrollButton } from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { PromptInput, PromptInputBody, PromptInputFooter, PromptInputSpeechButton, PromptInputSubmit, PromptInputTextarea, PromptInputTools } from "@/components/ai-elements/prompt-input";
import { AnswerTools, AskedTools } from "./message-tools";
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion";
import { Tool, ToolHeader } from "@/components/ai-elements/tool";
import { Approval, Plan, registry } from "./registry";
import type { planCard } from "./spec";

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
// The device's date goes with each message, so the journal entry this chat is kept in has the person's day.
const transport = new DefaultChatTransport({ api: "/api/chat", body: () => ({ localDate: today() }) });
const TITLE: Record<string, string> = {
  show_shelves: "Looked at your shelves",
  show_claims: "Looked at your claims",
  search_library: "Searched the library",
  browse_category: "Browsed a category of the library",
  propose_claim: "Proposed a claim",
};
const STARTERS = ["Help me think through a decision", "What should I read next?", "What's on my calendar this week?"];

function Answer({ message }: { message: UIMessage }) {
  const { spec } = useJsonRenderMessage(message.parts);
  let cardsShown = false;
  return (
    <>
      {message.parts.map((part, i) => {
        if (part.type === "text" && part.text.trim()) return <MessageResponse key={i}>{part.text}</MessageResponse>;
        if (part.type.startsWith("tool-")) {
          const t = part as ToolUIPart;
          if (t.state === "output-error") return null;
          return (
            <Tool key={i}>
              <ToolHeader type={t.type} state={t.state} title={TITLE[t.type.slice(5)] ?? t.type.slice(5)} />
            </Tool>
          );
        }
        if (part.type === SPEC_DATA_PART_TYPE && spec && !cardsShown) {
          cardsShown = true;
          return (
            <JSONUIProvider key={i} registry={registry}>
              <Renderer spec={spec} registry={registry} />
            </JSONUIProvider>
          );
        }
        return null;
      })}
    </>
  );
}

/** A held change shown at the top of Ask, with where it was asked for. */
export type Waiting = { change: string; title: string; preview: string; tap: "Keep" | "Send"; from: string };

export function Chat({ ask, pending = [], plans = [] }: { ask?: string; pending?: Waiting[]; plans?: ReturnType<typeof planCard>[] } = {}) {
  // A chat's id (a uuid), made once per visit to the page; the chat is kept under it in the chat history.
  const [id] = useState(() => crypto.randomUUID());
  const { messages, sendMessage, status, error, regenerate, stop } = useChat({ id, transport });
  const input = useRef<HTMLTextAreaElement>(null);
  const busy = status === "submitted" || status === "streaming";
  const lastAnswer = [...messages].reverse().find((m) => m.role === "assistant")?.id;
  return (
    <div className="mx-auto flex h-screen max-w-3xl flex-col p-6">
      <div className="mb-4 flex items-center justify-between">
        <span className="flex items-center gap-1"><SidebarButton className="-ml-2" /><Suspense fallback={null}><BackButton fallback="/" label="Back" /></Suspense></span>
        <span className="text-sm font-medium">Ask</span>
        <a href="/chat/history" className="text-muted-foreground text-sm hover:text-foreground">History</a>
      </div>
      {pending.length || plans.length ? (
        <div className="mb-4 flex max-h-[40vh] flex-col gap-2 overflow-y-auto">
          {plans.map((p, i) => <Plan key={i} {...p} />)}
          {pending.map((p) => <Approval key={p.change} {...p} />)}
        </div>
      ) : null}
      <Conversation className="flex-1">
        <ConversationContent>
          {messages.length === 0 ? (
            <ConversationEmptyState title="What's on your mind?" description="Talk something through, or ask about anything in Reflect. This chat is kept in your chat history; nothing changes in your apps unless you say so." />
          ) : (
            messages.map((m) => (
              <Message key={m.id} from={m.role}>
                <MessageContent>{m.role === "user" ? m.parts.map((p, i) => (p.type === "text" ? <span key={i} className="whitespace-pre-wrap">{p.text}</span> : null)) : <Answer message={m} />}</MessageContent>
                {m.role === "user" ? (
                  <AskedTools message={m} busy={busy} onEdit={(text) => void sendMessage({ text, messageId: m.id })} />
                ) : (
                  <AnswerTools message={m} latest={m.id === lastAnswer} busy={busy} onRetry={() => void regenerate()} />
                )}
              </Message>
            ))
          )}
          {status === "submitted" ? (
            <p role="status" className="text-muted-foreground animate-pulse text-sm">Thinking…</p>
          ) : null}
          {error ? (
            <div role="alert" className="text-muted-foreground flex items-center gap-3 text-sm">
              <span>Ask Reflect could not answer just now. Your apps are all still there.</span>
              <button type="button" className="text-foreground underline underline-offset-4" onClick={() => void regenerate()}>Try again</button>
            </div>
          ) : null}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>
      {messages.length === 0 ? (
        <Suggestions className="mb-3">
          {(ask ? [ask, ...STARTERS] : STARTERS).map((s) => <Suggestion key={s} suggestion={s} onClick={(t) => void sendMessage({ text: t })} />)}
        </Suggestions>
      ) : null}
      <PromptInput onSubmit={(m) => { if (busy) return; if (m.text?.trim()) void sendMessage({ text: m.text }); }}>
        <PromptInputBody>
          <PromptInputTextarea ref={input} placeholder="Say anything..." />
        </PromptInputBody>
        <PromptInputFooter>
          <PromptInputTools>
            <PromptInputSpeechButton textareaRef={input} aria-label="Speak instead of typing" />
          </PromptInputTools>
          <PromptInputSubmit
            status={status === "error" ? "ready" : status}
            aria-label={busy ? "Stop" : "Send"}
            onClick={(e) => { if (busy) { e.preventDefault(); void stop(); } }}
          />
        </PromptInputFooter>
      </PromptInput>
      {/* AI disclosure (California SB 243, New York's AI companion law): always shown, beside the input. */}
      <p className="text-muted-foreground mt-2 text-center text-xs">Ask Reflect is an AI and can be wrong.</p>
    </div>
  );
}
