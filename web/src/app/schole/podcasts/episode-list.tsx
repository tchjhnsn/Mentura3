"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { clock } from "@reflect/core/media";
import { Badge } from "@/components/ui/badge";
import type { Track } from "../player";
import { EpisodeButtons } from "./episode-buttons";

/** One episode as a show's list gives it, with where the person is with it. */
export type EpisodeRow = {
  key: string; title: string; date: string | null; /** The day as a person reads it ("Nov 14"). */ day: string | null; seconds: number | null; about: string | null; audio: string; image: string | null;
  season: number | null; number: number | null; type: "full" | "trailer" | "bonus"; kind: "audio" | "video";
  href: string; status: "heard" | "begun" | "new"; place: number | null;
};
type Shown = "all" | "new" | "begun" | "heard";
const SHOWN: [Shown, string][] = [["all", "All"], ["new", "Not heard"], ["begun", "Under way"], ["heard", "Heard"]];
const STEP = 100;

/**
 * A show's whole catalog (Torian, 2026-11-15): seasons to pick from when the show has them, a filter by where you are
 * with each episode, a hundred at a time with More, and each episode to play in Scholē's player or put up next.
 */
export function EpisodeList({ rows, show, image, item, feed }: { rows: EpisodeRow[]; show: string; image: string | null; item: string | null; feed: string }) {
  const seasons = useMemo(() => [...new Set(rows.map((r) => r.season).filter((s): s is number => s !== null))].sort((a, b) => b - a), [rows]);
  const [season, setSeason] = useState<number | null>(null);
  const [shown, setShown] = useState<Shown>("all");
  const [n, setN] = useState(STEP);
  const list = rows.filter((r) => (season === null || r.season === season) && (shown === "all" || r.status === shown));
  const trackOf = (i: number): Track => {
    const one = (r: EpisodeRow): Omit<Track, "next"> => ({ id: `episode:${item ?? feed}:${r.key}`, src: r.audio, title: r.title, show, href: r.href, image: r.image ?? image, item, unit: r.key, place: r.status === "heard" ? 0 : r.place, seconds: r.seconds });
    const r = list[i]!;
    const after = item ? list[i + 1] : undefined;
    return { ...one(r), next: after && after.kind === "audio" ? one(after) : null };
  };
  const chip = (on: boolean) => `inline-flex h-7 items-center rounded-full border px-3 text-xs whitespace-nowrap ${on ? "bg-foreground text-background border-foreground" : "hover:bg-muted"}`;
  return (
    <section className="space-y-3">
      <div className="-mx-6 flex gap-1.5 overflow-x-auto px-6 pb-1 sm:mx-0 sm:px-0">
        {SHOWN.map(([id, label]) => <button key={id} type="button" className={chip(shown === id)} aria-pressed={shown === id} onClick={() => { setShown(id); setN(STEP); }}>{label}</button>)}
        {seasons.length > 1 ? <span className="bg-border mx-1 w-px shrink-0" /> : null}
        {seasons.length > 1 ? <button type="button" className={chip(season === null)} aria-pressed={season === null} onClick={() => setSeason(null)}>Every season</button> : null}
        {seasons.length > 1 ? seasons.map((s) => <button key={s} type="button" className={chip(season === s)} aria-pressed={season === s} onClick={() => { setSeason(s); setN(STEP); }}>Season {s}</button>) : null}
      </div>
      {list.length ? (
        <ol className="divide-y border-y text-sm">
          {list.slice(0, n).map((r, i) => (
            <li key={r.key} className="py-3">
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="text-xs font-semibold tabular-nums">{[r.day, r.seconds ? clock(r.seconds) : null].filter(Boolean).join(" · ") || "Undated"}</p>
                  <Link href={r.href} className="block font-medium leading-snug underline-offset-4 hover:underline">{r.title}</Link>
                  {r.season || r.number || r.type !== "full" || r.kind === "video" || r.status !== "new" ? (
                    <p className="text-muted-foreground flex flex-wrap items-center gap-1.5 text-xs tabular-nums">
                      {r.season && r.number ? `S${r.season} E${r.number}` : r.number ? `E${r.number}` : null}
                      {r.type !== "full" ? <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">{r.type === "trailer" ? "Trailer" : "Bonus"}</Badge> : null}
                      {r.kind === "video" ? <Badge variant="outline" className="h-4 px-1.5 text-[10px]">Video</Badge> : null}
                      {r.status === "heard" ? <span className="text-foreground">Heard</span> : r.status === "begun" ? <span className="text-foreground">Under way{r.place ? `, at ${clock(r.place)}` : ""}</span> : null}
                    </p>
                  ) : null}
                  {r.about ? <p className="text-muted-foreground line-clamp-2">{r.about}</p> : null}
                </div>
                {r.kind === "audio" ? <EpisodeButtons track={trackOf(i)} /> : null}
              </div>
            </li>
          ))}
        </ol>
      ) : <p className="text-muted-foreground text-sm">None here.</p>}
      {list.length > n ? <button type="button" className="text-sm underline underline-offset-4" onClick={() => setN(n + STEP)}>More ({list.length - n} left)</button> : null}
    </section>
  );
}
