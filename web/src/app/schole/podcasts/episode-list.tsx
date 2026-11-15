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
  href: string; status: "played" | "begun" | "new"; place: number | null; /** Null where favorites are not kept (a show not on the shelves). */ favorite: boolean | null;
  /** Its chapters, for the player. */ chapters: { at: number; title: string }[];
};
type Shown = "all" | "new" | "begun" | "played" | "favorite";
// Played, Not played and Continue, as podcast apps say it (Torian, 2026-11-15 06:46Z).
const SHOWN: [Shown, string][] = [["all", "All"], ["new", "Not played"], ["begun", "Continue"], ["played", "Played"], ["favorite", "Favorites"]];
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
  const list = rows.filter((r) => (season === null || r.season === season) && (shown === "all" || (shown === "favorite" ? r.favorite === true : r.status === shown)));
  const trackOf = (i: number): Track => {
    const one = (r: EpisodeRow): Omit<Track, "next"> => ({ id: `episode:${item ?? feed}:${r.key}`, src: r.audio, title: r.title, show, href: r.href, image: r.image ?? image, item, unit: r.key, place: r.status === "played" ? 0 : r.place, seconds: r.seconds, chapters: r.chapters });
    const r = list[i]!;
    const after = item ? list[i + 1] : undefined;
    return { ...one(r), next: after && after.kind === "audio" ? one(after) : null };
  };
  // The newest episode not yet played gets a faint highlight, the one to hear next (priority guides, show page).
  const fresh = list.find((r) => r.status !== "played")?.key;
  const chip = (on: boolean) => `inline-flex h-7 items-center rounded-full border px-3 text-xs whitespace-nowrap ${on ? "bg-foreground text-background border-foreground" : "hover:bg-muted"}`;
  return (
    <section className="space-y-3">
      <div className="-mx-6 flex gap-1.5 overflow-x-auto px-6 pb-1 sm:mx-0 sm:px-0">
        {SHOWN.filter(([id]) => id !== "favorite" || rows.some((r) => r.favorite !== null)).map(([id, label]) => <button key={id} type="button" className={chip(shown === id)} aria-pressed={shown === id} onClick={() => { setShown(id); setN(STEP); }}>{label}</button>)}
        {seasons.length > 1 ? <span className="bg-border mx-1 w-px shrink-0" /> : null}
        {seasons.length > 1 ? <button type="button" className={chip(season === null)} aria-pressed={season === null} onClick={() => setSeason(null)}>Every season</button> : null}
        {seasons.length > 1 ? seasons.map((s) => <button key={s} type="button" className={chip(season === s)} aria-pressed={season === s} onClick={() => { setSeason(s); setN(STEP); }}>Season {s}</button>) : null}
      </div>
      {list.length ? (
        <ol className="divide-y border-y text-sm">
          {list.slice(0, n).map((r, i) => (
            <li key={r.key} className={`flex gap-3 py-4 sm:gap-4 ${r.key === fresh && i === 0 ? "bg-muted/50 -mx-3 rounded-md px-3" : ""}`}>
              {r.image ?? image ? (
                <Link href={r.href} tabIndex={-1} aria-hidden className="shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={(r.image ?? image)!} alt="" loading="lazy" className="size-16 rounded-md border object-cover sm:size-20" />
                </Link>
              ) : null}
              <div className="min-w-0 flex-1 space-y-1">
                <p className="flex flex-wrap items-center gap-1.5 text-xs font-semibold tabular-nums">
                  <span>{r.day ?? "Undated"}</span>
                  {r.season && r.number ? <span className="text-muted-foreground font-normal">S{r.season} E{r.number}</span> : r.number ? <span className="text-muted-foreground font-normal">E{r.number}</span> : null}
                  {r.type !== "full" ? <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">{r.type === "trailer" ? "Trailer" : "Bonus"}</Badge> : null}
                  {r.kind === "video" ? <Badge variant="outline" className="h-4 px-1.5 text-[10px]">Video</Badge> : null}
                </p>
                <Link href={r.href} className="block font-medium leading-snug underline-offset-4 hover:underline">{r.title}</Link>
                {r.about ? <p className="text-muted-foreground line-clamp-2">{r.about}</p> : null}
                <div className="pt-1.5">
                  {r.kind === "audio" ? <EpisodeButtons track={trackOf(i)} status={r.status} favorite={r.favorite} /> : <Link href={r.href} className="text-sm underline underline-offset-4">Watch{r.seconds ? ` · ${clock(r.seconds)}` : ""}</Link>}
                </div>
              </div>
            </li>
          ))}
        </ol>
      ) : <p className="text-muted-foreground text-sm">None here.</p>}
      {list.length > n ? <button type="button" className="text-sm underline underline-offset-4" onClick={() => setN(n + STEP)}>More ({list.length - n} left)</button> : null}
    </section>
  );
}
