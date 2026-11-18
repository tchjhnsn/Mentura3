"use client";

import { useEffect, useRef, useState } from "react";
import { MicIcon, MicOffIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// The browser's own speech recognition (Web Speech API). TypeScript's DOM types leave it out, so the little of it
// used here is typed by hand.
type Recognition = {
  lang: string; interimResults: boolean; continuous: boolean;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null; onerror: (() => void) | null;
  start: () => void; stop: () => void;
};
type RecognitionCtor = new () => Recognition;
const recognitionCtor = (): RecognitionCtor | null => {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
};

/** A mic in the ask bar: speaking fills the input as the browser hears it. Hidden where the browser cannot listen. */
export function MicButton({ onText }: { onText: (text: string) => void }) {
  const [can, setCan] = useState(false);
  const [on, setOn] = useState(false);
  const rec = useRef<Recognition | null>(null);
  useEffect(() => { setCan(!!recognitionCtor()); return () => rec.current?.stop(); }, []);
  if (!can) return null;
  const toggle = () => {
    if (on) { rec.current?.stop(); return; }
    const Ctor = recognitionCtor();
    if (!Ctor) return;
    const r = new Ctor();
    r.lang = navigator.language || "en-US";
    r.interimResults = true;
    r.continuous = false;
    r.onresult = (e) => onText(Array.from(e.results).map((x) => x[0]?.transcript ?? "").join(""));
    r.onend = () => setOn(false);
    r.onerror = () => setOn(false);
    rec.current = r;
    try { r.start(); setOn(true); } catch { setOn(false); }
  };
  return (
    <Button type="button" variant="ghost" size="icon" className={cn("text-muted-foreground rounded-full", on && "text-destructive animate-pulse")} onClick={toggle} aria-label={on ? "Stop listening" : "Speak your question"} aria-pressed={on}>
      {on ? <MicOffIcon /> : <MicIcon />}
    </Button>
  );
}
