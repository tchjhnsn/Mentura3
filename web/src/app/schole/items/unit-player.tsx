"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CheckIcon, ChevronRightIcon, CircleCheckIcon, CopyIcon, HeartIcon, ListChecksIcon, ListPlusIcon, PauseIcon, PlayIcon, PlusIcon, ScaleIcon, XIcon } from "lucide-react";
import { STANCES } from "@reflect/core/claims";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { passageAt, type Passage } from "@reflect/core/courses";
import { clock } from "@reflect/core/media";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { addItemNoteAction, favoriteEpisodeAction, keepItemClaimAction, keepUnitPlaceAction, removeItemNoteAction, setUnitDoneAction } from "../actions";
import { loadYouTube, localDay, type YTPlayer } from "./youtube";
import { useListen, type Track } from "../player";
import { SaveEpisode } from "../podcasts/saved";
import { said } from "../podcasts/episode-buttons";
import { cn } from "@/lib/utils";

type Note = { id: string; at: number | null; quote: string | null; note: string | null };
export type UnitProps = {
  /** The person's item, or null when the course is only being explored (nothing is kept). */
  item: string | null; unit: string; title: string; by: string | null; cite: string;
  youtube: string | null; media: { src: string; kind: "audio" | "video" } | null;
  place: number | null; done: boolean; of: number | null;
  transcript: Passage[]; notes: Note[]; next: string | null;
  /** An episode's audio, played by Scholē's one player instead of a player on the page, so it keeps playing. */
  track?: Track | null;
  /** Shown in place of the transcript when there is none (an episode's "Make a transcript"). */
  noTranscript?: React.ReactNode;
  /** An episode's favorite mark, or null where it cannot be kept. */
  favorite?: boolean | null;
  /** What sits between the episode's acts and its transcript: its chapters and show notes. */
  between?: React.ReactNode;
};

/**
 * One lecture or episode played inside Reflect: the publisher's video through YouTube's player, or its audio or
 * video file in the page's own player. The place is kept as it plays; the transcript sits beside it, follows the
 * speaker, and any timed part seeks the player. Notes are taken at the current moment, and finishing it moves the
 * course or show forward.
 */
export function UnitPlayer(p: UnitProps) {
  const holder = useRef<HTMLDivElement>(null);
  const yt = useRef<YTPlayer | null>(null);
  const el = useRef<HTMLMediaElement | null>(null);
  const list = useRef<HTMLOListElement>(null);
  const [now, setNow] = useState(p.place ?? 0);
  const [follow, setFollow] = useState(true);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [text, setText] = useState("");
  const [copied, setCopied] = useState<number | null>(null);
  const [claiming, setClaiming] = useState<number | null>(null);
  const [claimed, setClaimed] = useState<number | null>(null);
  const [writing, setWriting] = useState(false);
  const [fav, setFav] = useState(p.favorite ?? null);
  const [pending, run] = useTransition();
  const router = useRouter();
  const path = usePathname();

  const listen = useListen();
  const shared = p.track && p.media?.kind === "audio" && listen ? p.track : null;
  const mine = Boolean(shared && listen?.track?.id === shared.id);
  const sharedTime = useRef(0);
  sharedTime.current = mine ? listen!.time : p.place ?? 0;
  const time = useCallback(() => (shared ? sharedTime.current : yt.current ? yt.current.getCurrentTime() : el.current ? el.current.currentTime : 0), [shared]);
  // Scholē's player keeps the place of what it plays; a player on the page keeps its own.
  const keep = useCallback(() => { if (shared) return; const s = time(); if (s > 1 && p.item) keepUnitPlaceAction(p.item, p.unit, s, localDay()).catch(() => {}); }, [p.item, p.unit, time, shared]);

  useEffect(() => {
    if (!p.youtube || !holder.current) return;
    let live = true;
    let player: YTPlayer | null = null;
    loadYouTube().then((YT) => {
      if (!live || !holder.current) return;
      // The player is only asked for its time once it is ready; before that its methods do not exist yet.
      player = new YT.Player(holder.current, {
        videoId: p.youtube,
        playerVars: { start: Math.floor(p.place ?? 0), rel: 0, modestbranding: 1 },
        events: {
          onReady: () => { if (live) yt.current = player; },
          onStateChange: (e: { data: number }) => { if (e.data === YT.PlayerState.PAUSED || e.data === YT.PlayerState.ENDED) keep(); },
        },
      });
    });
    return () => { live = false; keep(); try { player?.destroy(); } catch { /* not ready yet */ } player = null; yt.current = null; };
  }, [p.youtube, p.place, keep]);

  useEffect(() => {
    const tick = setInterval(() => setNow(time()), 1000);
    const save = setInterval(keep, 15000);
    return () => { clearInterval(tick); clearInterval(save); };
  }, [time, keep]);

  const current = useMemo(() => passageAt(p.transcript, now), [p.transcript, now]);
  useEffect(() => {
    if (!open || !follow || current < 0 || q) return;
    const li = list.current?.querySelector<HTMLElement>(`[data-i="${current}"]`);
    if (li && list.current) list.current.scrollTo({ top: li.offsetTop - list.current.offsetTop - 8, behavior: "smooth" });
  }, [current, follow, q, open]);

  const seek = (s: number) => {
    if (shared) { listen!.playTrack(shared, s); setNow(s); return; }
    if (yt.current) { yt.current.seekTo(s, true); yt.current.playVideo(); }
    else if (el.current) { el.current.currentTime = s; el.current.play().catch(() => {}); }
    setNow(s);
  };
  const hits = useMemo(() => {
    const w = q.trim().toLowerCase();
    return w ? p.transcript.map((x, i) => ({ x, i })).filter(({ x }) => x.text.toLowerCase().includes(w)) : null;
  }, [q, p.transcript]);
  // A passage without its own time takes the time of the chapter it falls under.
  const timeOf = (i: number) => { for (let j = i; j >= 0; j--) if (p.transcript[j]!.at !== null) return p.transcript[j]!.at!; return null; };
  const quoteOf = (x: Passage, i: number) => { const t = timeOf(i); return `“${x.text}” (${p.cite}${t !== null ? `, at ${clock(t)}` : ""})`; };
  const note = (n: { at: number | null; quote?: string; note?: string }) => run(async () => { if (!p.item) return; await addItemNoteAction(p.item, { ...n, unit: p.unit }); setText(""); setWriting(false); router.refresh(); });
  const finish = (done: boolean) => run(async () => { if (!p.item) return; keep(); await setUnitDoneAction(p.item, p.unit, done, p.of, localDay()); if (done && p.next && !shared) router.push(p.next); else router.refresh(); });
  const playLabel = (() => {
    if (!shared) return "";
    if (mine && listen!.playing) return "Pause";
    const total = shared.seconds ?? 0;
    const at = mine ? listen!.time : p.place ?? 0;
    if (p.done && !mine) return "Play again";
    if (at > 1 && total) return `Continue · ${said(Math.max(0, total - at))} left`;
    if (at > 1) return `Continue from ${clock(Math.floor(at))}`;
    return total ? said(total) : "Play";
  })();
  const shown = hits ?? p.transcript.map((x, i) => ({ x, i }));

  const transcriptPanel = p.transcript.length ? (
        <Collapsible open={open} onOpenChange={setOpen} className="rounded-lg border">
          <div className="flex items-center justify-between gap-2 px-3 py-2">
            <CollapsibleTrigger className="hover:bg-muted -m-1 flex flex-1 items-center gap-2 rounded-md p-1 text-left text-sm font-medium">
              <ChevronRightIcon className={`text-muted-foreground size-4 transition ${open ? "rotate-90" : ""}`} /> Transcript
            </CollapsibleTrigger>
            {open ? <label className="text-muted-foreground flex items-center gap-1.5 text-xs"><input type="checkbox" checked={follow} onChange={(e) => setFollow(e.target.checked)} /> Follow along</label> : null}
          </div>
          <CollapsibleContent className="space-y-2 border-t p-3">
            <Input aria-label="Search the transcript" placeholder="Search the transcript" value={q} onChange={(e) => setQ(e.target.value)} className="h-9" />
            {hits && !hits.length ? <p className="text-muted-foreground text-sm">Not found.</p> : null}
            <ol ref={list} className="max-h-[60vh] space-y-2 overflow-y-auto rounded-md border p-3 text-sm leading-relaxed">
                {shown.map(({ x, i }) => {
                  const t = timeOf(i);
                  return (
                    <li key={i} data-i={i} className={`group rounded-md px-2 py-1 ${i === current ? "bg-muted" : ""}`}>
                      {x.heading ? (
                        <button type="button" disabled={x.at === null} onClick={() => x.at !== null && seek(x.at)} className="text-left font-medium underline-offset-4 hover:underline">
                            {x.text}{x.at !== null ? <span className="text-muted-foreground ml-2 font-normal tabular-nums">{clock(x.at)}</span> : null}
                        </button>
                      ) : (
                        <p>
                            {x.at !== null ? <button type="button" onClick={() => seek(x.at!)} className="text-muted-foreground mr-2 tabular-nums underline-offset-4 hover:underline">{clock(x.at)}</button> : null}
                            {x.who ? <span className="font-medium">{x.who}: </span> : null}{x.text}
                        </p>
                      )}
                      {!x.heading && p.item ? (
                        <span className="mt-1 hidden gap-1 group-hover:flex group-focus-within:flex pointer-coarse:flex">
                            <Button type="button" size="sm" variant="outline" className="h-7" disabled={pending} onClick={() => note({ at: t, quote: x.text })}>Quote in a note</Button>
                            <Button type="button" size="icon" variant="ghost" className="size-7" aria-label="Copy as a cited quote" onClick={() => { navigator.clipboard?.writeText(quoteOf(x, i)).catch(() => {}); setCopied(i); }}><CopyIcon /></Button>
                            <Button type="button" size="icon" variant="ghost" className="size-7" aria-label="Keep as a claim" title="Keep as a claim" aria-expanded={claiming === i} onClick={() => setClaiming(claiming === i ? null : i)}><ScaleIcon /></Button>
                            {copied === i ? <span role="status" className="text-muted-foreground self-center text-xs">Copied</span> : null}
                        </span>
                      ) : null}
                      {claimed === i ? <p role="status" className="text-muted-foreground mt-1 text-xs">Kept as a claim</p> : null}
                      {claiming === i && p.item ? (
                        <form
                          className="mt-2 space-y-2 rounded-md border p-2"
                          action={(fd) => run(async () => { await keepItemClaimAction(fd); setClaiming(null); setClaimed(i); router.refresh(); })}
                        >
                          <input type="hidden" name="item" value={p.item} />
                          <input type="hidden" name="cite" value={`${p.cite}${t !== null ? `, at ${clock(t)}` : ""}`} />
                          <input type="hidden" name="back" value={path} />
                          <label className="block space-y-1 text-xs font-medium">The claim, in your words or theirs<Textarea name="claim" required maxLength={500} rows={2} defaultValue={x.text.slice(0, 500)} /></label>
                          <label className="block space-y-1 text-xs font-medium">Who holds it, one per line<Textarea name="holders" rows={1} defaultValue={x.who ?? (p.by && !/ and |, /.test(p.by) ? p.by : "")} /></label>
                          <div className="flex flex-wrap gap-1.5">
                            {STANCES.map((s) => <Button key={s.id} size="sm" variant="outline" className="h-7" name="stance" value={s.id} disabled={pending}>{s.text}</Button>)}
                            <Button type="button" size="icon" variant="ghost" className="size-7" aria-label="Close" onClick={() => setClaiming(null)}><XIcon /></Button>
                          </div>
                        </form>
                      ) : null}
                    </li>
                  );
                })}
            </ol>
          </CollapsibleContent>
        </Collapsible>
      ) : p.noTranscript ?? <p className="text-muted-foreground text-sm">The publisher gives no transcript for this one.</p>;

  return (
    <div className="min-w-0 space-y-5">
      <div className="min-w-0 space-y-4">
        {p.youtube ? (
          <div className="aspect-video w-full overflow-hidden rounded-lg border bg-black"><div ref={holder} className="size-full" /></div>
        ) : p.media?.kind === "video" ? (
          <video ref={(v) => { el.current = v; }} src={p.media.src} controls preload="metadata" className="aspect-video w-full rounded-lg border bg-black" onLoadedMetadata={(e) => { if (p.place) e.currentTarget.currentTime = p.place; }} onPause={keep} />
        ) : shared ? (
          <div className="flex flex-wrap items-center gap-1">
            <Button className="mr-1 rounded-full" aria-label={mine && listen!.playing ? "Pause" : p.place ? "Continue" : "Play"} onClick={() => (mine ? listen!.toggle() : listen!.playTrack(shared))}>
              {mine && listen!.playing ? <PauseIcon /> : <PlayIcon className="fill-current" />}<span className="tabular-nums">{playLabel}</span>
            </Button>
            {!mine ? (
              listen!.queue.some((x) => x.id === shared.id)
                ? <Button size="icon" variant="ghost" aria-label="Up next; take it off" title="Up next. Tap to take it off." onClick={() => listen!.dequeue(shared.id)}><ListChecksIcon /></Button>
                : <Button size="icon" variant="ghost" className="text-muted-foreground" aria-label="Play after what is playing" title="Up next" onClick={() => listen!.enqueue(shared)}><ListPlusIcon /></Button>
            ) : null}
            {fav !== null && p.item ? (
              <Button size="icon" variant="ghost" className={fav ? "text-foreground" : "text-muted-foreground"} aria-pressed={fav} aria-label={fav ? "A favorite; take it off" : "Favorite this episode"} title={fav ? "Favorite" : "Favorite this episode"}
                onClick={() => { const next = !fav; setFav(next); run(async () => { try { await favoriteEpisodeAction(p.item!, p.unit, next); } catch { setFav(!next); } }); }}>
                <HeartIcon className={cn(fav && "fill-current")} />
              </Button>
            ) : null}
            <SaveEpisode src={shared.src} />
            {p.item ? (
              <Button size="icon" variant="ghost" className={p.done ? "text-foreground" : "text-muted-foreground"} disabled={pending} aria-pressed={p.done} aria-label={p.done ? "Played; mark not played" : "Mark as played"} title={p.done ? "Played. Tap to mark not played." : "Mark as played"} onClick={() => finish(!p.done)}>
                <CircleCheckIcon className={cn(p.done && "fill-foreground text-background")} />
              </Button>
            ) : null}
            {mine ? <span className="text-muted-foreground ml-1 text-xs tabular-nums">{clock(Math.floor(listen!.time))} of {clock(Math.floor(listen!.duration || shared.seconds || 0))}</span> : p.done ? <span className="text-muted-foreground ml-1 text-xs">Played</span> : null}
          </div>
        ) : p.media ? (
          <audio ref={(a) => { el.current = a; }} src={p.media.src} controls preload="metadata" className="w-full" onLoadedMetadata={(e) => { if (p.place) e.currentTarget.currentTime = p.place; }} onPause={keep} />
        ) : <p className="text-muted-foreground text-sm">This one has no recording Reflect can play.</p>}
        {p.place && !shared ? <p className="text-muted-foreground text-xs">Picks up at {clock(p.place)}, where you stopped.</p> : null}

        {p.item ? <>{shared ? null : <div className="flex flex-wrap items-center gap-2">
          {p.done ? (
            <>
              <span className="flex items-center gap-1 text-sm"><CheckIcon className="size-4" /> Finished</span>
              <Button size="sm" variant="ghost" disabled={pending} onClick={() => finish(false)}>Not finished</Button>
              {p.next ? <Button size="sm" variant="outline" asChild><Link href={p.next}>Next</Link></Button> : null}
            </>
          ) : <Button size="sm" disabled={pending} onClick={() => finish(true)}>{p.next ? "Finished, next" : "Finished"}</Button>}
        </div>}

        {p.between}

        {transcriptPanel}

        <div className="space-y-2">
          <div className="flex items-center gap-1">
            <h2 className="text-sm font-medium">Notes</h2>
            <Button type="button" size="icon" variant="ghost" className="size-7 rounded-full" aria-label={`Add a note at ${clock(Math.floor(now))}`} title={`Add a note at ${clock(Math.floor(now))}`} aria-expanded={writing} onClick={() => setWriting(true)}><PlusIcon /></Button>
          </div>
          {!p.notes.length && !writing ? <p className="text-muted-foreground text-sm">None yet. The + adds one at the moment playing.</p> : null}
          {p.notes.length ? (
            <ul className="space-y-2">
              {p.notes.map((n) => (
                <li key={n.id} className="flex items-start gap-2 rounded-md border p-2 text-sm">
                  {n.at !== null ? <button type="button" onClick={() => seek(n.at!)} className="text-muted-foreground shrink-0 tabular-nums underline-offset-4 hover:underline">{clock(n.at)}</button> : null}
                  <span className="min-w-0 flex-1 space-y-1">
                    {n.quote ? <span className="block italic">“{n.quote}”</span> : null}
                    {n.note ? <span className="block">{n.note}</span> : null}
                  </span>
                  <Button type="button" size="icon" variant="ghost" aria-label="Remove note" disabled={pending} onClick={() => run(async () => { if (p.item) await removeItemNoteAction(p.item, n.id); router.refresh(); })}><XIcon /></Button>
                </li>
              ))}
            </ul>
          ) : null}
          {writing ? <>
            <Textarea aria-label="Note" rows={2} maxLength={4000} value={text} onChange={(e) => setText(e.target.value)} placeholder="A note" autoFocus />
            <div className="flex gap-2">
              <Button type="button" size="sm" disabled={pending || !text.trim()} onClick={() => note({ at: Math.floor(time()), note: text })}>Note at {clock(Math.floor(now))}</Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => { setWriting(false); setText(""); }}>Cancel</Button>
            </div>
          </> : null}
        </div></> : <>{transcriptPanel}{p.next ? <Button size="sm" variant="outline" asChild><Link href={p.next}>Next lecture</Link></Button> : null}</>}
      </div>

    </div>
  );
}
