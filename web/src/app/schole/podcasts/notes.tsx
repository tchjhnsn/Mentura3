"use client";

import type { NoteBlock } from "@reflect/core/podcasts";
import { splitStamps } from "@reflect/core/podcasts";
import { useListen, type Track } from "../player";

/** Runs of ~ = _ * - used as rules in show notes, dropped. */
const RULE = /[~=_*-]{3,}/g;

/**
 * Show notes as paragraphs and list items, links kept (opening outside Reflect, as the show's own pages). With the
 * episode's `track`, every time written in them ("26:54") plays the episode from there (Torian, 2026-11-15 07:41Z).
 */
export function Notes({ blocks, track = null, className = "" }: { blocks: NoteBlock[]; track?: Track | null; className?: string }) {
  const listen = useListen();
  const clean = blocks.map((b) => ({ ...b, parts: b.parts.map((p) => ({ ...p, text: p.text.replace(RULE, " ").replace(/\s{2,}/g, " ") })).filter((p) => p.text.trim()) })).filter((b) => b.parts.length);
  if (!clean.length) return null;
  const seek = track && listen ? (s: number) => listen.playTrack(track, s) : null;
  const words = (t: string, k: string) => !seek ? t : splitStamps(t).map((x, i) => "stamp" in x && (!track?.seconds || x.at <= track.seconds)
    ? <button key={`${k}-${i}`} type="button" onClick={() => seek(x.at)} className="font-medium tabular-nums underline underline-offset-2 hover:no-underline">{x.stamp}</button>
    : <span key={`${k}-${i}`}>{"stamp" in x ? x.stamp : x.text}</span>);
  const out: React.ReactNode[] = [];
  let list: React.ReactNode[] = [];
  const flush = () => { if (list.length) { out.push(<ul key={`l${out.length}`} className="list-disc space-y-1 pl-5">{list}</ul>); list = []; } };
  clean.forEach((b, i) => {
    const body = b.parts.map((p, j) => <span key={j}>{j ? " " : ""}{p.href ? <a href={p.href} target="_blank" rel="noreferrer nofollow" className="underline underline-offset-2">{p.text}</a> : words(p.text, `${i}-${j}`)}</span>);
    if (b.list) list.push(<li key={i}>{body}</li>);
    else { flush(); out.push(<p key={i}>{body}</p>); }
  });
  flush();
  return <div className={`max-w-prose space-y-2 text-sm leading-relaxed ${className}`}>{out}</div>;
}
