"use client";

import { useState, useTransition } from "react";
import { CheckIcon, PlusIcon, RefreshCwIcon, SparklesIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { followTopicAction, makePlaylistAction, saveMadeAction } from "./actions";

/** Make one for me: the topic's quiet button; Reflect makes the playlist only when asked (guide "Topics and playlists", point 3). */
export function MakeButton({ topic, label = "Make one for me", instead, variant = "outline" }: { topic: string; label?: string; instead?: string; variant?: "outline" | "ghost" }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, run] = useTransition();
  return (
    <div className="space-y-1.5">
      <Button variant={variant} size="sm" disabled={pending} onClick={() => run(async () => {
        const f = new FormData(); f.set("topic", topic); if (instead) f.set("instead", instead);
        setError(await makePlaylistAction(f));
      })}>{instead ? <RefreshCwIcon /> : <SparklesIcon />}{pending ? "Making it..." : label}</Button>
      {error ? <p className="text-destructive text-xs" role="alert">{error}</p> : null}
    </div>
  );
}

/** Change it in plain words: makes a new playlist from this one and what the person typed (point 11). */
export function ChangeIt({ topic, instead }: { topic: string; instead: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, run] = useTransition();
  return (
    <form className="max-w-xl space-y-1.5" action={(f) => run(async () => { f.set("topic", topic); f.set("instead", instead); setError(await makePlaylistAction(f)); })}>
      <label htmlFor="ask" className="text-sm font-semibold">Change it</label>
      <div className="flex gap-2">
        <Input id="ask" name="ask" required maxLength={300} placeholder="Shorter, more music, no lectures..." disabled={pending} />
        <Button variant="outline" disabled={pending}>{pending ? "Making it..." : "Make it"}</Button>
      </div>
      {error ? <p className="text-destructive text-xs" role="alert">{error}</p> : null}
    </form>
  );
}

/** Save to the library's Lists, or take it out. */
export function SaveMade({ id, saved }: { id: string; saved: boolean }) {
  const [on, setOn] = useState(saved);
  const [pending, run] = useTransition();
  return (
    <Button variant={on ? "secondary" : "outline"} size="sm" disabled={pending} aria-pressed={on} onClick={() => {
      const next = !on; setOn(next);
      run(async () => { const f = new FormData(); f.set("id", id); f.set("saved", next ? "1" : "0"); try { await saveMadeAction(f); } catch { setOn(!next); } });
    }}>{on ? <CheckIcon /> : <PlusIcon />}{on ? "Saved" : "Save"}</Button>
  );
}

/** Follow a topic: top right beside its name, as Follow sits on shows and people. */
export function TopicFollow({ topic, following }: { topic: string; following: boolean }) {
  const [on, setOn] = useState(following);
  const [pending, run] = useTransition();
  return (
    <Button size="sm" variant={on ? "secondary" : "outline"} className="shrink-0" disabled={pending} aria-pressed={on} onClick={() => {
      const next = !on; setOn(next);
      run(async () => { const f = new FormData(); f.set("topic", topic); f.set("follow", next ? "1" : "0"); try { await followTopicAction(f); } catch { setOn(!next); } });
    }}>{on ? <CheckIcon /> : <PlusIcon />}{on ? "Following" : "Follow"}</Button>
  );
}
