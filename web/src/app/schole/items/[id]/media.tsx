"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { CopyIcon } from "lucide-react";
import { clock, readTranscript, searchTranscript, type Embed } from "@reflect/core/media";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { keepItemPlaceAction } from "../../actions";
import { loadYouTube, localDay, type YTPlayer } from "../youtube";

/**
 * Watching or listening inside Reflect. A YouTube video plays through YouTube's player API: the place is kept as
 * it plays (every 15 seconds and on pause). Other sites play in their own embed. A pasted transcript is searched here,
 * a moment seeks there, and any part is copied as a cited quote. No notes are written here: writing is in the journal
 * (Torian, 2026-11-16 18:45Z).
 */
export function ItemMedia({ id, title, by, embed, place, transcript, children }: { id: string; title: string; by: string | null; embed: Embed | null; place: number | null; transcript: string | null; /** What sits between the player and the transcript search: the title, channel line and description. */ children?: ReactNode }) {
  const holder = useRef<HTMLDivElement>(null);
  const player = useRef<YTPlayer | null>(null);
  const [q, setQ] = useState("");
  const [copied, setCopied] = useState<number | null>(null);
  const parts = useMemo(() => (transcript ? readTranscript(transcript) : []), [transcript]);
  const hits = useMemo(() => searchTranscript(parts, q), [parts, q]);

  useEffect(() => {
    if (embed?.kind !== "youtube" || !holder.current) return;
    let live = true;
    let timer: ReturnType<typeof setInterval> | undefined;
    const keep = () => { const s = player.current?.getCurrentTime(); if (s && s > 1) keepItemPlaceAction(id, s, localDay()).catch(() => {}); };
    loadYouTube().then((YT) => {
      if (!live || !holder.current) return;
      player.current = new YT.Player(holder.current, {
        videoId: embed.id,
        playerVars: { start: Math.floor(place ?? embed.start ?? 0), rel: 0, modestbranding: 1 },
        events: { onStateChange: (e: { data: number }) => { if (e.data === YT.PlayerState.PAUSED || e.data === YT.PlayerState.ENDED) keep(); } },
      });
      timer = setInterval(keep, 15000);
    });
    return () => { live = false; if (timer) clearInterval(timer); keep(); player.current?.destroy(); player.current = null; };
  }, [embed, id, place]);

  const seek = (s: number) => { player.current?.seekTo(s, true); player.current?.playVideo(); holder.current?.scrollIntoView?.({ block: "nearest" }); };
  const cite = (p: { at: number; text: string }) => `“${p.text}” (${[by, title].filter(Boolean).join(", ")}, at ${clock(p.at)})`;

  return (
    <div className="space-y-3">
      {embed?.kind === "youtube" ? (
        <div className="-mx-6 aspect-video overflow-hidden bg-black sm:mx-0 sm:rounded-xl"><div ref={holder} className="size-full" /></div>
      ) : embed ? (
        <iframe src={embed.src} title={`${title} on ${embed.site}`} className={embed.tall ? "-mx-6 aspect-video w-[calc(100%+3rem)] bg-black sm:mx-0 sm:w-full sm:rounded-xl" : embed.list ? "h-[450px] w-full rounded-lg border" : "h-40 w-full rounded-lg border"} allow="autoplay; encrypted-media; fullscreen; picture-in-picture" allowFullScreen loading="lazy" />
      ) : null}
      {children}

      {parts.length ? (
        <div className="space-y-2 pt-3">
          <h2 className="text-base font-semibold">Search the transcript</h2>
          <Input aria-label="Search the transcript" placeholder="A word or phrase" value={q} onChange={(e) => setQ(e.target.value)} />
          {q && !hits.length ? <p className="text-muted-foreground text-sm">Not found.</p> : null}
          <ul className="space-y-2">
            {hits.map((p, i) => (
              <li key={`${p.at}-${i}`} className="flex items-start gap-2 rounded-md border p-2 text-sm">
                {embed?.kind === "youtube" ? <button type="button" onClick={() => seek(p.at)} className="text-muted-foreground shrink-0 tabular-nums underline-offset-4 hover:underline">{clock(p.at)}</button> : <span className="text-muted-foreground shrink-0 tabular-nums">{clock(p.at)}</span>}
                <span className="min-w-0 flex-1">{p.text}</span>
                <span className="flex shrink-0 gap-1">
                  <Button type="button" size="icon" variant="ghost" aria-label="Copy as a cited quote" onClick={() => { navigator.clipboard?.writeText(cite(p)).catch(() => {}); setCopied(i); }}><CopyIcon /></Button>
                </span>
                {copied === i ? <span className="sr-only" role="status">Copied</span> : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
