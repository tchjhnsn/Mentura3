"use client";

import { useState } from "react";
import type { Chapter } from "@reflect/core/podcasts";
import { clock } from "@reflect/core/media";
import { useListen, type Track } from "../player";

/** An episode's chapters: each plays the episode from its start in Scholē's player; the one playing is marked. */
export function Chapters({ chapters, track }: { chapters: Chapter[]; track: Track | null }) {
  const listen = useListen();
  const [all, setAll] = useState(false);
  if (!chapters.length) return null;
  const on = Boolean(track && listen?.track?.id === track.id);
  const now = on ? listen!.time : -1;
  const current = on ? chapters.reduce((c, x, i) => (x.at <= now ? i : c), -1) : -1;
  return (
    <section className="space-y-2">
      <h2 className="text-base font-semibold">Chapters</h2>
      <ol className="divide-y rounded-lg border text-sm">
        {chapters.map((c, i) => (!all && i >= 8 && i !== current ? null : (
          <li key={`${c.at}-${i}`}>
            <button type="button" disabled={!track || !listen} onClick={() => track && listen?.playTrack({ ...track, chapters }, c.at)} className={`hover:bg-accent flex w-full items-baseline gap-3 px-3 py-2 text-left ${i === current ? "bg-muted border-foreground border-l-2 pl-2.5 font-semibold" : ""}`} aria-current={i === current ? "true" : undefined}>
              <span className="text-muted-foreground w-14 shrink-0 text-xs tabular-nums">{clock(c.at)}</span>
              <span className="min-w-0 flex-1">{c.title}</span>
            </button>
          </li>
        )))}
      </ol>
      {chapters.length > 8 ? <button type="button" className="text-sm underline underline-offset-4" onClick={() => setAll(!all)}>{all ? "Fewer chapters" : `All ${chapters.length} chapters`}</button> : null}
    </section>
  );
}
