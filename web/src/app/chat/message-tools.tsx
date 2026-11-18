"use client";

// The small tools under a turn of Ask (the ones ChatGPT, Claude and chatcn's message-actions share): copy,
// try again, read aloud, and edit for the person's own message. Icons only, each with its name for screen readers.
import { useEffect, useState } from "react";
import { CheckIcon, CopyIcon, PencilIcon, RefreshCwIcon, SquareIcon, Volume2Icon } from "lucide-react";
import type { UIMessage } from "ai";
import { MessageAction, MessageActions } from "@/components/ai-elements/message";
import { Button } from "@/components/ui/button";

/** The words of a message, its text parts joined. */
export const wordsOf = (m: UIMessage): string =>
  m.parts.map((p) => (p.type === "text" ? p.text : "")).filter((t) => t.trim()).join("\n\n");

function Copy({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <MessageAction
      tooltip={done ? "Copied" : "Copy"}
      onClick={() => {
        void navigator.clipboard?.writeText(text).then(() => {
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        });
      }}
    >
      {done ? <CheckIcon className="size-4" /> : <CopyIcon className="size-4" />}
    </MessageAction>
  );
}

function ReadAloud({ text }: { text: string }) {
  const [speaking, setSpeaking] = useState(false);
  const [can, setCan] = useState(false);
  useEffect(() => setCan(typeof window !== "undefined" && "speechSynthesis" in window), []);
  useEffect(() => () => { if (speaking) window.speechSynthesis.cancel(); }, [speaking]);
  if (!can) return null;
  return (
    <MessageAction
      tooltip={speaking ? "Stop reading" : "Read aloud"}
      onClick={() => {
        const synth = window.speechSynthesis;
        if (speaking) { synth.cancel(); setSpeaking(false); return; }
        synth.cancel();
        const u = new SpeechSynthesisUtterance(text.replace(/[*_#`>]/g, ""));
        u.onend = () => setSpeaking(false);
        u.onerror = () => setSpeaking(false);
        setSpeaking(true);
        synth.speak(u);
      }}
    >
      {speaking ? <SquareIcon className="size-4" /> : <Volume2Icon className="size-4" />}
    </MessageAction>
  );
}

/** Under an answer: copy, read aloud, and try again on the latest one. */
export function AnswerTools({ message, latest, busy, onRetry }: { message: UIMessage; latest: boolean; busy: boolean; onRetry: () => void }) {
  const text = wordsOf(message);
  if (!text || (latest && busy)) return null;
  return (
    <MessageActions className={latest ? "" : "opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100"}>
      <Copy text={text} />
      <ReadAloud text={text} />
      {latest ? (
        <MessageAction tooltip="Try again" onClick={onRetry}>
          <RefreshCwIcon className="size-4" />
        </MessageAction>
      ) : null}
    </MessageActions>
  );
}

/** Under the person's own message: copy, and edit, which asks again from that message. */
export function AskedTools({ message, busy, onEdit }: { message: UIMessage; busy: boolean; onEdit: (text: string) => void }) {
  const text = wordsOf(message);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(text);
  if (editing) {
    return (
      <div className="flex w-full flex-col gap-2">
        <textarea
          aria-label="Edit your message"
          className="bg-background min-h-20 w-full rounded-md border p-2 text-sm"
          value={draft}
          autoFocus
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setEditing(false);
            if (e.key === "Enter" && !e.shiftKey && draft.trim()) { e.preventDefault(); setEditing(false); onEdit(draft.trim()); }
          }}
        />
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
          <Button size="sm" disabled={!draft.trim()} onClick={() => { setEditing(false); onEdit(draft.trim()); }}>Send</Button>
        </div>
      </div>
    );
  }
  if (!text) return null;
  return (
    <MessageActions className="justify-end opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
      <Copy text={text} />
      {busy ? null : (
        <MessageAction tooltip="Edit" onClick={() => { setDraft(text); setEditing(true); }}>
          <PencilIcon className="size-4" />
        </MessageAction>
      )}
    </MessageActions>
  );
}
