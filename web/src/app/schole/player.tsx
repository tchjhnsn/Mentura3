"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ListMusicIcon, MoonIcon, PauseIcon, PlayIcon, RotateCcwIcon, RotateCwIcon, SlidersHorizontalIcon, XIcon } from "lucide-react";
import type { Audiobook } from "@reflect/core/librivox";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioGroup,
  DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { keepUnitPlaceAction, setUnitDoneAction } from "./actions";
import { localDay } from "./items/youtube";

/** An audiobook playing in Scholē: the recording and which book's page it belongs to. */
export type Playing = Audiobook & { work: string; bookTitle: string };
/**
 * An episode (or any one recording) playing in Scholē's player: what plays, what it is called and where its page is,
 * and, when it is on the person's shelves, the item and unit its place and finishing are kept against.
 */
export type Track = {
  id: string; src: string; title: string; show: string; href: string; image?: string | null;
  item: string | null; unit: string; place?: number | null; seconds?: number | null;
  /** What follows it when the queue is empty: the show's next episode. */
  next?: Omit<Track, "next"> | null;
  chapters?: { at: number; title: string }[];
};
type Place = { chapter: number; at: number };
type Sleep = { until: number } | { end: true } | null;
const keyOf = (id: string) => `reflect:listen:${id}`;
const QUEUE = "reflect:queue";
const FX = "reflect:audio-fx";
const RATES = [1, 1.25, 1.5, 1.75, 2, 0.75];

/** Where the person stopped in a recording, kept in this browser. */
export function listenPlace(id: string): Place | null {
  try {
    const t = window.localStorage.getItem(keyOf(id));
    return t ? (JSON.parse(t) as Place) : null;
  } catch {
    return null;
  }
}
const readJson = <T,>(k: string, d: T): T => { try { const t = window.localStorage.getItem(k); return t ? (JSON.parse(t) as T) : d; } catch { return d; } };
const writeJson = (k: string, v: unknown) => { try { window.localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage blocked: kept for this visit only */ } };

type Listen = {
  book: Playing | null;
  track: Track | null;
  chapter: number;
  playing: boolean;
  time: number;
  duration: number;
  rate: number;
  /** Whether the reader follows the recording (read and listen together). */
  follow: boolean;
  queue: Track[];
  play: (book: Playing, chapter?: number, opts?: { follow?: boolean }) => void;
  playTrack: (t: Track, at?: number) => void;
  enqueue: (t: Track) => void;
  dequeue: (id: string) => void;
  toggle: () => void;
  skip: (seconds: number) => void;
  seek: (seconds: number) => void;
  setFollow: (f: boolean) => void;
  close: () => void;
};
const ListenContext = createContext<Listen | null>(null);
export const useListen = () => useContext(ListenContext);

export const clock = (s: number) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h ? `${h} h ${m} min` : `${m} min`;
};
const stamp = (s: number) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = String(Math.floor(s % 60)).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`;
};

/**
 * The one audio player for Scholē (Torian, 2026-11-15 "Build all"): books and episodes alike keep playing while the
 * person moves between pages. It skips back 15 and forward 30 seconds, plays at 0.75 to 2 times, shows on the lock
 * screen and answers headphone buttons (Media Session), plays to AirPlay, stops on a sleep timer or at the end of
 * the episode, plays an up-next queue across shows and then the show's next episode, and can even out voices and
 * skip silences where the show's host allows the browser to process its audio (CORS). An episode on the person's
 * shelves keeps its place every 15 seconds and on pause, and is marked heard when it ends.
 */
export function ListenProvider({ children }: { children: React.ReactNode }) {
  const audio = useRef<HTMLAudioElement>(null);
  const resume = useRef<number | null>(null);
  const graph = useRef<{ ctx: AudioContext; analyser: AnalyserNode; el: HTMLAudioElement } | null>(null);
  const [book, setBook] = useState<Playing | null>(null);
  const [track, setTrack] = useState<Track | null>(null);
  const [chapter, setChapter] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [rate, setRate] = useState(1);
  const [follow, setFollow] = useState(false);
  const [queue, setQueue] = useState<Track[]>([]);
  const [sleep, setSleep] = useState<Sleep>(null);
  const [fx, setFx] = useState<{ even: boolean; silence: boolean }>({ even: false, silence: false });
  const [fxBlocked, setFxBlocked] = useState(false);
  const fxOn = fx.even || fx.silence;

  useEffect(() => { setQueue(readJson<Track[]>(QUEUE, [])); setFx(readJson(FX, { even: false, silence: false })); }, []);
  const saveQueue = (q: Track[]) => { setQueue(q); writeJson(QUEUE, q); };

  const save = useCallback(() => {
    const a = audio.current;
    if (!a) return;
    const at = Math.floor(a.currentTime);
    if (track) {
      if (track.item && at > 1) keepUnitPlaceAction(track.item, track.unit, at, localDay()).catch(() => {});
      writeJson(keyOf(track.id), { chapter: 0, at } satisfies Place);
      return;
    }
    if (book) writeJson(keyOf(book.id), { chapter, at } satisfies Place);
  }, [book, chapter, track]);

  const play = useCallback((b: Playing, c?: number, opts?: { follow?: boolean }) => {
    const p = c === undefined ? listenPlace(b.id) : null;
    const next = c ?? (p && p.chapter < b.chapters.length ? p.chapter : 0);
    resume.current = c === undefined && p && p.chapter === next ? p.at : null;
    if (track) save();
    setTrack(null);
    setBook(b);
    setChapter(next);
    setFollow(Boolean(opts?.follow));
    setPlaying(true);
    // The same part again: play it from where it is.
    if (!track && book?.id === b.id && chapter === next) void audio.current?.play();
  }, [book, chapter, track, save]);

  const playTrack = useCallback((t: Track, at?: number) => {
    if (track?.id === t.id) {
      if (at !== undefined && audio.current) audio.current.currentTime = at;
      void audio.current?.play();
      return;
    }
    save();
    resume.current = at ?? t.place ?? listenPlace(t.id)?.at ?? null;
    setBook(null);
    setFollow(false);
    setTrack(t);
    setPlaying(true);
    setQueue((q) => { const n = q.filter((x) => x.id !== t.id); writeJson(QUEUE, n); return n; });
  }, [track, save]);

  useEffect(() => {
    if (audio.current) audio.current.playbackRate = rate;
  }, [rate, book, chapter, track]);

  // What follows when a recording ends: the next part of a book, else the queue, else the show's next episode.
  const ended = useCallback(() => {
    if (book) {
      if (chapter + 1 < book.chapters.length && !(sleep && "end" in sleep)) setChapter(chapter + 1);
      else { setPlaying(false); if (sleep && "end" in sleep) setSleep(null); }
      return;
    }
    if (!track) return;
    if (track.item) setUnitDoneAction(track.item, track.unit, true, null, localDay()).catch(() => {});
    writeJson(keyOf(track.id), { chapter: 0, at: 0 });
    if (sleep && "end" in sleep) { setSleep(null); setPlaying(false); return; }
    const next = queue[0] ?? (track.next ? { ...track.next } : null);
    if (next) playTrack(next, next.place ?? 0);
    else setPlaying(false);
  }, [book, chapter, track, queue, sleep, playTrack]);

  // The sleep timer: a time to stop, checked each second, or the end of what is playing (in ended).
  useEffect(() => {
    if (!sleep || !("until" in sleep)) return;
    const t = setInterval(() => { if (Date.now() >= sleep.until) { audio.current?.pause(); setSleep(null); } }, 1000);
    return () => clearInterval(t);
  }, [sleep]);

  const seek = useCallback((s: number) => {
    const a = audio.current;
    if (a) { a.currentTime = Math.max(0, Math.min(a.duration || Infinity, s)); setTime(a.currentTime); }
  }, []);
  const skip = useCallback((s: number) => { const a = audio.current; if (a) seek(a.currentTime + s); }, [seek]);
  const toggle = useCallback(() => { const a = audio.current; if (!a) return; if (a.paused) void a.play(); else a.pause(); }, []);

  // The lock screen and headphone buttons.
  const title = track ? track.title : book ? book.chapters[chapter]?.title ?? book.bookTitle : null;
  const artist = track ? track.show : book ? book.bookTitle : null;
  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator) || !title) return;
    const ms = navigator.mediaSession;
    ms.metadata = new MediaMetadata({ title, artist: artist ?? "", album: "Scholē", artwork: track?.image ? [{ src: track.image, sizes: "512x512" }] : [] });
    const on = (a: MediaSessionAction, h: MediaSessionActionHandler | null) => { try { ms.setActionHandler(a, h); } catch { /* not supported here */ } };
    on("play", () => { void audio.current?.play(); });
    on("pause", () => audio.current?.pause());
    on("seekbackward", (d) => skip(-(d.seekOffset ?? 15)));
    on("seekforward", (d) => skip(d.seekOffset ?? 30));
    on("seekto", (d) => { if (d.seekTime !== undefined) seek(d.seekTime); });
    on("nexttrack", queue.length || track?.next ? () => ended() : null);
    return () => { for (const a of ["play", "pause", "seekbackward", "seekforward", "seekto", "nexttrack"] as MediaSessionAction[]) on(a, null); };
  }, [title, artist, track, queue.length, skip, seek, ended]);
  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    navigator.mediaSession.playbackState = playing ? "playing" : "paused";
    try { if (duration && Number.isFinite(duration)) navigator.mediaSession.setPositionState({ duration, position: Math.min(time, duration), playbackRate: rate }); } catch { /* not supported */ }
  }, [playing, time, duration, rate]);

  // Evening out voices and skipping silences: the audio runs through the browser's audio graph (a compressor for
  // even loudness, a lift where voices sit, and an analyser that plays quiet stretches fast). The graph only hears a
  // recording whose host sends CORS headers; one that does not fails to load and plays again without it.
  const wire = useCallback((el: HTMLAudioElement) => {
    if (!fxOn || graph.current?.el === el) return;
    try {
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = graph.current?.ctx ?? new Ctx();
      const src = ctx.createMediaElementSource(el);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      let node: AudioNode = src;
      if (fx.even) {
        const low = ctx.createBiquadFilter(); low.type = "highpass"; low.frequency.value = 80;
        const voice = ctx.createBiquadFilter(); voice.type = "peaking"; voice.frequency.value = 3000; voice.Q.value = 0.9; voice.gain.value = 4;
        const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -28; comp.knee.value = 12; comp.ratio.value = 4; comp.attack.value = 0.005; comp.release.value = 0.25;
        const gain = ctx.createGain(); gain.gain.value = 1.6;
        node.connect(low); low.connect(voice); voice.connect(comp); comp.connect(gain); node = gain;
      }
      node.connect(analyser);
      analyser.connect(ctx.destination);
      graph.current = { ctx, analyser, el };
      void ctx.resume();
    } catch {
      setFxBlocked(true);
    }
  }, [fxOn, fx.even]);

  useEffect(() => {
    if (!fx.silence || !playing) return;
    const buf = new Float32Array(1024);
    let quiet = 0;
    const t = setInterval(() => {
      const g = graph.current; const a = audio.current;
      if (!g || !a || g.el !== a) return;
      g.analyser.getFloatTimeDomainData(buf);
      let sum = 0; for (const v of buf) sum += v * v;
      quiet = Math.sqrt(sum / buf.length) < 0.008 ? quiet + 1 : 0;
      a.playbackRate = quiet >= 3 ? Math.min(4, rate * 2.5) : rate;
    }, 100);
    return () => { clearInterval(t); if (audio.current) audio.current.playbackRate = rate; };
  }, [fx.silence, playing, rate]);

  const setEffects = (next: { even: boolean; silence: boolean }) => {
    if (audio.current) resume.current = audio.current.currentTime;
    graph.current = graph.current ? { ...graph.current, el: null as unknown as HTMLAudioElement } : null;
    setFxBlocked(false);
    setFx(next);
    writeJson(FX, next);
  };

  const value = useMemo<Listen>(() => ({
    book, track, chapter, playing, time, duration, rate, follow, queue, play, playTrack, setFollow, toggle, skip, seek,
    enqueue: (t) => saveQueue([...queue.filter((x) => x.id !== t.id), t]),
    dequeue: (id) => saveQueue(queue.filter((x) => x.id !== id)),
    close: () => {
      save();
      audio.current?.pause();
      setBook(null);
      setTrack(null);
      setFollow(false);
      setSleep(null);
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [book, track, chapter, playing, time, duration, rate, follow, queue, play, playTrack, toggle, skip, seek, save]);

  const c = book?.chapters[chapter];
  const src = track ? track.src : c?.url ?? null;
  const total = duration || (track ? track.seconds ?? 0 : c?.seconds ?? 0);
  const href = track ? track.href : book ? `/schole/works/${book.work}` : "#";
  const chap = track?.chapters?.length ? [...track.chapters].reverse().find((x) => x.at <= time) ?? null : null;
  const left = sleep && "until" in sleep ? Math.max(0, Math.ceil((sleep.until - Date.now()) / 60000)) : null;
  const useFx = fxOn && !fxBlocked;
  return (
    <ListenContext.Provider value={value}>
      {children}
      {src ? <div aria-hidden className="h-32 sm:h-20" /> : null}
      {src ? (
        <div className="bg-background fixed inset-x-0 bottom-0 z-30 border-t shadow-lg" data-player>
          <audio
            ref={audio}
            key={`${src}|${useFx ? "fx" : ""}`}
            src={src}
            autoPlay={playing}
            preload="metadata"
            crossOrigin={useFx ? "anonymous" : undefined}
            x-webkit-airplay="allow"
            onLoadedMetadata={(e) => {
              e.currentTarget.playbackRate = rate;
              setDuration(e.currentTarget.duration || total);
              if (resume.current !== null) {
                e.currentTarget.currentTime = resume.current;
                resume.current = null;
              }
              if (useFx) wire(e.currentTarget);
            }}
            onError={() => {
              // A host without CORS headers: play it again without the audio graph.
              if (useFx && audio.current) { resume.current = time; setFxBlocked(true); }
            }}
            onPlay={() => { setPlaying(true); void graph.current?.ctx.resume(); }}
            onPause={() => { setPlaying(false); save(); }}
            onTimeUpdate={(e) => {
              setTime(e.currentTarget.currentTime);
              if (Math.floor(e.currentTarget.currentTime) % 15 === 0) save();
            }}
            onEnded={ended}
          />
          <div className="mx-auto max-w-3xl px-4 pt-1.5 pb-2 sm:px-6">
            <input
              type="range" min={0} max={Math.max(1, Math.floor(total))} step={1} value={Math.floor(time)} aria-label="Place in the recording"
              onChange={(e) => seek(Number(e.target.value))} className="accent-foreground block h-1 w-full cursor-pointer"
            />
            <div className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 sm:flex-nowrap">
              <div className="order-first min-w-0 flex-1 basis-[calc(100%-3rem)] px-1 sm:order-none sm:basis-auto">
                <Link href={href} className="block truncate text-sm font-medium">{track ? track.title : book!.bookTitle}</Link>
                <p className="text-muted-foreground truncate text-xs tabular-nums">
                  {[track ? track.show : c?.title, chap?.title, `${stamp(time)} / ${stamp(total)}`, left !== null ? `stops in ${left} min` : sleep ? "stops at the end" : null, follow ? "the text follows" : null].filter(Boolean).join(" · ")}
                </p>
              </div>
              <Button size="icon" variant="ghost" aria-label="Close the player" className="order-first sm:order-last" onClick={value.close}><XIcon /></Button>
              <div className="flex w-full items-center justify-between gap-1 sm:contents">
              <Button size="icon" variant="ghost" aria-label="Back 15 seconds" onClick={() => skip(-15)}><RotateCcwIcon /></Button>
              <Button size="icon" className="rounded-full" aria-label={playing ? "Pause" : "Play"} onClick={toggle}>{playing ? <PauseIcon /> : <PlayIcon />}</Button>
              <Button size="icon" variant="ghost" aria-label="Forward 30 seconds" onClick={() => skip(30)}><RotateCwIcon /></Button>
              <Button size="sm" variant="ghost" className="tabular-nums" aria-label={`Speed ${rate} times`} onClick={() => setRate(RATES[(RATES.indexOf(rate) + 1) % RATES.length]!)}>{rate}×</Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild><Button size="icon" variant="ghost" aria-label="Sleep timer" className={sleep ? "text-foreground" : ""}><MoonIcon className={sleep ? "fill-current" : ""} /></Button></DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Stop playing</DropdownMenuLabel>
                  <DropdownMenuRadioGroup value={sleep ? ("end" in sleep ? "end" : "time") : "off"}>
                    <DropdownMenuRadioItem value="off" onSelect={() => setSleep(null)}>Don&apos;t stop</DropdownMenuRadioItem>
                    {[15, 30, 45, 60].map((m) => <DropdownMenuItem key={m} onSelect={() => setSleep({ until: Date.now() + m * 60000 })}>In {m} minutes</DropdownMenuItem>)}
                    <DropdownMenuRadioItem value="end" onSelect={() => setSleep({ end: true })}>At the end of {track ? "the episode" : "the part"}</DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild><Button size="icon" variant="ghost" aria-label="Sound"><SlidersHorizontalIcon /></Button></DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="max-w-72">
                  <DropdownMenuCheckboxItem checked={fx.even} onCheckedChange={(v) => setEffects({ ...fx, even: Boolean(v) })}>Even out voices</DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem checked={fx.silence} onCheckedChange={(v) => setEffects({ ...fx, silence: Boolean(v) })}>Skip silences</DropdownMenuCheckboxItem>
                  {fxOn && fxBlocked ? <p className="text-muted-foreground px-2 py-1.5 text-xs">This recording&apos;s host doesn&apos;t let the browser change its sound, so it plays as published.</p> : null}
                </DropdownMenuContent>
              </DropdownMenu>
              {queue.length ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild><Button size="icon" variant="ghost" aria-label={`Up next, ${queue.length}`} className="relative"><ListMusicIcon /><span className="bg-foreground text-background absolute -top-0.5 -right-0.5 rounded-full px-1 text-[10px] leading-4">{queue.length}</span></Button></DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-72">
                    <DropdownMenuLabel>Up next</DropdownMenuLabel>
                    {queue.map((q) => (
                      <DropdownMenuItem key={q.id} onSelect={() => playTrack(q)} className="flex items-start gap-2">
                        <span className="min-w-0 flex-1"><span className="block truncate">{q.title}</span><span className="text-muted-foreground block truncate text-xs">{q.show}</span></span>
                        <button type="button" aria-label={`Take ${q.title} off up next`} className="text-muted-foreground hover:text-foreground" onClick={(e) => { e.preventDefault(); e.stopPropagation(); value.dequeue(q.id); }}><XIcon className="size-4" /></button>
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => saveQueue([])}>Clear up next</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </ListenContext.Provider>
  );
}
