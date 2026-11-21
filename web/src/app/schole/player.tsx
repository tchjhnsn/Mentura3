"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { CheckIcon, ChevronDownIcon, ListMusicIcon, ListOrderedIcon, Maximize2Icon, MoonIcon, PauseIcon, PlayIcon, RotateCcwIcon, RotateCwIcon, ScissorsIcon, SlidersHorizontalIcon, XIcon } from "lucide-react";
import type { Audiobook } from "@reflect/core/librivox";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioGroup,
  DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { backgroundFor, INTERLUDE, LEVELS } from "@reflect/core/background-music";
import type { CollectionItem } from "@reflect/core/collections";
import { keepUnitPlaceAction, setUnitDoneAction } from "./actions";
import { snipAction } from "./snips/actions";
import { BackgroundMusicLayer, BG_DEFAULT, BG_KEY, type BgSettings } from "./background-music";
import { localDay } from "./items/youtube";

/** An audiobook playing in Scholē: the recording and which book's page it belongs to. */
export type Playing = Audiobook & { work: string; bookTitle: string; cover?: string | null; /** Its page when it is not a book page (an audiobook from the catalog). */ page?: string };
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
export const stamp = (s: number) => {
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
  // Full screen (Torian, 2026-11-15 07:57Z): what is playing, large, with its chapters.
  const [full, setFull] = useState(false);
  const [snipped, setSnipped] = useState(false);
  useEffect(() => {
    if (!full) return;
    const was = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") setFull(false); };
    window.addEventListener("keydown", key);
    return () => { document.body.style.overflow = was; window.removeEventListener("keydown", key); };
  }, [full]);
  const [fx, setFx] = useState<{ even: boolean; silence: boolean }>({ even: false, silence: false });
  const [fxBlocked, setFxBlocked] = useState(false);
  const fxOn = fx.even || fx.silence;

  // Background music under a book (Torian, 2026-11-16 06:36Z): off until turned on; interludes between chapters.
  const [bg, setBgState] = useState<BgSettings>(BG_DEFAULT);
  const setBg = (next: Partial<BgSettings>) => setBgState((b) => { const n = { ...b, ...next }; writeJson(BG_KEY, n); return n; });
  const [interlude, setInterlude] = useState(false);
  const interludeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [bgNow, setBgNow] = useState<CollectionItem | null>(null);
  const bgList = useMemo(() => (book ? backgroundFor(book.id) : null), [book]);
  useEffect(() => () => { if (interludeTimer.current) clearTimeout(interludeTimer.current); }, []);
  useEffect(() => { if (interludeTimer.current) { clearTimeout(interludeTimer.current); interludeTimer.current = null; } setInterlude(false); }, [book?.id, track?.id]);

  useEffect(() => { setQueue(readJson<Track[]>(QUEUE, [])); setFx(readJson(FX, { even: false, silence: false })); setBgState({ ...BG_DEFAULT, ...readJson<Partial<BgSettings>>(BG_KEY, {}) }); }, []);
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
      if (chapter + 1 < book.chapters.length && !(sleep && "end" in sleep)) {
        // An interlude, as in a radio drama: the music comes forward for a few seconds, then the next chapter starts.
        if (bg.on && bg.interludes && bgList) {
          setInterlude(true);
          interludeTimer.current = setTimeout(() => { interludeTimer.current = null; setInterlude(false); setChapter(chapter + 1); setPlaying(true); }, INTERLUDE.seconds * 1000);
        } else setChapter(chapter + 1);
      }
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
  }, [book, chapter, track, queue, sleep, playTrack, bg.on, bg.interludes, bgList]);

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
  const art = track ? track.image ?? null : book?.cover ?? null;
  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator) || !title) return;
    const ms = navigator.mediaSession;
    ms.metadata = new MediaMetadata({ title, artist: artist ?? "", album: "Scholē", artwork: art ? [{ src: art, sizes: "512x512" }] : [] });
    const on = (a: MediaSessionAction, h: MediaSessionActionHandler | null) => { try { ms.setActionHandler(a, h); } catch { /* not supported here */ } };
    on("play", () => { void audio.current?.play(); });
    on("pause", () => audio.current?.pause());
    on("seekbackward", (d) => skip(-(d.seekOffset ?? 15)));
    on("seekforward", (d) => skip(d.seekOffset ?? 30));
    on("seekto", (d) => { if (d.seekTime !== undefined) seek(d.seekTime); });
    on("nexttrack", queue.length || track?.next ? () => ended() : null);
    return () => { for (const a of ["play", "pause", "seekbackward", "seekforward", "seekto", "nexttrack"] as MediaSessionAction[]) on(a, null); };
  }, [title, artist, art, track, queue.length, skip, seek, ended]);
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
  const href = track ? track.href : book ? book.page ?? `/schole/works/${book.work}` : "#";
  const chap = track?.chapters?.length ? [...track.chapters].reverse().find((x) => x.at <= time) ?? null : null;
  const left = sleep && "until" in sleep ? Math.max(0, Math.ceil((sleep.until - Date.now()) / 60000)) : null;
  const useFx = fxOn && !fxBlocked;
  const chapters = track?.chapters ?? [];
  const chapAt = chap ? chapters.indexOf(chap) : -1;
  // The place in the recording, with a mark where each chapter starts (Torian, 2026-11-15 07:57Z).
  const scrubber = (
    <div className="relative">
      <input
        type="range" min={0} max={Math.max(1, Math.floor(total))} step={1} value={Math.floor(time)} aria-label="Place in the recording"
        onChange={(e) => seek(Number(e.target.value))} className="accent-foreground block h-1 w-full cursor-pointer"
      />
      {total ? chapters.filter((x) => x.at > 0 && x.at < total).map((x) => (
        <span key={x.at} aria-hidden className="bg-background pointer-events-none absolute top-1/2 h-2 w-0.5 -translate-y-1/2" style={{ left: `${(x.at / total) * 100}%` }} />
      )) : null}
    </div>
  );
  // A book's parts are its chapters (Torian, 2026-11-15 08:26Z): each a file of its own, played by its number.
  const parts = !track && book && book.chapters.length > 1 ? book.chapters : [];
  const partsMenu = parts.length ? (
    <DropdownMenu>
      <DropdownMenuTrigger asChild><Button size="icon" variant="ghost" aria-label="Chapters" title="Chapters"><ListOrderedIcon /></Button></DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-h-80 w-80 overflow-y-auto">
        <DropdownMenuLabel>Chapters</DropdownMenuLabel>
        {parts.map((x, i) => (
          <DropdownMenuItem key={x.url} onSelect={() => play(book!, i)} className={`flex items-baseline gap-2 ${i === chapter ? "bg-muted font-medium" : ""}`}>
            <span className="min-w-0 flex-1 truncate">{x.title}</span><span className="text-muted-foreground shrink-0 text-xs tabular-nums">{x.seconds ? stamp(x.seconds) : ""}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  ) : null;
  const chaptersMenu = chapters.length ? (
    <DropdownMenu>
      <DropdownMenuTrigger asChild><Button size="icon" variant="ghost" aria-label="Chapters" title="Chapters"><ListOrderedIcon /></Button></DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-h-80 w-80 overflow-y-auto">
        <DropdownMenuLabel>Chapters</DropdownMenuLabel>
        {chapters.map((x, i) => (
          <DropdownMenuItem key={`${x.at}-${i}`} onSelect={() => seek(x.at)} className={`flex items-baseline gap-2 ${i === chapAt ? "bg-muted font-medium" : ""}`}>
            <span className="text-muted-foreground w-12 shrink-0 text-xs tabular-nums">{stamp(x.at)}</span><span className="min-w-0 flex-1 truncate">{x.title}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  ) : null;
  const sleepMenu = (
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
  );
  const soundMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild><Button size="icon" variant="ghost" aria-label="Sound"><SlidersHorizontalIcon /></Button></DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-w-72">
        <DropdownMenuCheckboxItem checked={fx.even} onCheckedChange={(v) => setEffects({ ...fx, even: Boolean(v) })}>Even out voices</DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem checked={fx.silence} onCheckedChange={(v) => setEffects({ ...fx, silence: Boolean(v) })}>Skip silences</DropdownMenuCheckboxItem>
        {fxOn && fxBlocked ? <p className="text-muted-foreground px-2 py-1.5 text-xs">This recording&apos;s host doesn&apos;t let the browser change its sound, so it plays as published.</p> : null}
        {bgList ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem checked={bg.on} onCheckedChange={(v) => setBg({ on: Boolean(v), hinted: true })}>Background music</DropdownMenuCheckboxItem>
            {bg.on ? (
              <>
                <DropdownMenuRadioGroup value={bg.level} onValueChange={(v) => setBg({ level: v as BgSettings["level"] })}>
                  {LEVELS.map((l) => <DropdownMenuRadioItem key={l.id} value={l.id} className="pl-8">{l.label}</DropdownMenuRadioItem>)}
                </DropdownMenuRadioGroup>
                <DropdownMenuCheckboxItem checked={bg.interludes} onCheckedChange={(v) => setBg({ interludes: Boolean(v) })}>Interludes between chapters</DropdownMenuCheckboxItem>
                {bgNow && bgNow.kind === "find" ? (
                  <p className="text-muted-foreground px-2 py-1.5 text-xs">Playing {bgNow.title}, {bgNow.by}.{bgNow.credit ? ` ${bgNow.credit}.` : ""} Chosen by Reflect&apos;s editors from Wikimedia Commons.</p>
                ) : null}
              </>
            ) : <p className="text-muted-foreground px-2 py-1.5 text-xs">Quiet instrumental music from the book&apos;s time, under the voice.</p>}
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
  // Snip (Torian, 2026-11-21, after Snipd): keep this moment; it goes to Snips with no words, for the journal.
  const snipMenu = (
    <Button size="icon" variant="ghost" aria-label={snipped ? "Snipped" : "Snip this moment"} title={snipped ? "Kept in Snips" : "Snip this moment"} onClick={() => {
      const at = Math.floor(time);
      void snipAction({
        at, title: track ? track.title : book!.bookTitle, by: track ? track.show : "", href, image: art,
        track: track ? { id: track.id, src: track.src, title: track.title, show: track.show, href: track.href, image: track.image ?? null, item: track.item, unit: track.unit, seconds: track.seconds ?? null } : null,
        chapter: track ? null : chapter, chapterTitle: track ? chap?.title ?? null : c?.title ?? null,
      }).then((r) => { if (r.ok) { setSnipped(true); setTimeout(() => setSnipped(false), 2000); } });
    }}>{snipped ? <CheckIcon /> : <ScissorsIcon />}</Button>
  );
  const queueMenu = queue.length ? (
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
  ) : null;
  const speed = <Button size="sm" variant="ghost" className="tabular-nums" aria-label={`Speed ${rate} times`} onClick={() => setRate(RATES[(RATES.indexOf(rate) + 1) % RATES.length]!)}>{rate}×</Button>;
  const name = track ? track.title : book?.bookTitle ?? "";
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
          {book && bg.on && bgList ? <BackgroundMusicLayer key={bgList.topic} items={bgList.items} sounding={playing} interlude={interlude} level={bg.level} onNow={setBgNow} /> : null}
          {book && bgList && !bg.on && !bg.hinted ? (
            <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-x-3 gap-y-1 border-b px-4 py-2 text-sm sm:px-6">
              <span className="min-w-0 flex-1">This book has background music from its time.</span>
              <Button size="sm" variant="secondary" className="h-7" onClick={() => setBg({ on: true, hinted: true })}>Turn on</Button>
              <Button size="sm" variant="ghost" className="text-muted-foreground h-7" onClick={() => setBg({ hinted: true })}>No thanks</Button>
            </div>
          ) : null}
          <div className="mx-auto max-w-3xl px-4 pt-1.5 pb-2 sm:px-6">
            {scrubber}
            <div className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 sm:flex-nowrap">
              <div className="order-first flex min-w-0 flex-1 basis-[calc(100%-3rem)] items-center gap-2.5 px-1 sm:order-none sm:basis-auto">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {art ? <button type="button" className="shrink-0" aria-label="Full screen" onClick={() => setFull(true)}><img src={art} alt="" className="size-10 rounded-md border object-cover" /></button> : null}
                <div className="min-w-0 flex-1">
                <Link href={href} className="block truncate text-sm font-medium">{track ? track.title : book!.bookTitle}</Link>
                <p className="text-muted-foreground truncate text-xs tabular-nums">
                  {[interlude ? "Interlude" : null, track ? track.show : c?.title, chap?.title, `${stamp(time)} / ${stamp(total)}`, left !== null ? `stops in ${left} min` : sleep ? "stops at the end" : null, follow ? "the text follows" : null].filter(Boolean).join(" · ")}
                </p>
                </div>
              </div>
              <Button size="icon" variant="ghost" aria-label="Close the player" className="order-first sm:order-last" onClick={value.close}><XIcon /></Button>
              <div className="flex w-full items-center justify-between gap-1 sm:contents">
              <Button size="icon" variant="ghost" aria-label="Back 15 seconds" onClick={() => skip(-15)}><RotateCcwIcon /></Button>
              <Button size="icon" className="rounded-full" aria-label={playing ? "Pause" : "Play"} onClick={toggle}>{playing ? <PauseIcon /> : <PlayIcon />}</Button>
              <Button size="icon" variant="ghost" aria-label="Forward 30 seconds" onClick={() => skip(30)}><RotateCwIcon /></Button>
              {speed}
              {chaptersMenu ?? partsMenu}
              {sleepMenu}
              {soundMenu}
              {snipMenu}
              {queueMenu}
              <Button size="icon" variant="ghost" aria-label="Full screen" title="Full screen" onClick={() => setFull(true)}><Maximize2Icon /></Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
      {src && full ? (
        <div role="dialog" aria-modal="true" aria-label={`Playing ${name}`} data-full-player={playing ? "playing" : "paused"} className="bg-background fixed inset-0 z-50 overflow-y-auto">
          <div className="mx-auto flex min-h-full max-w-md flex-col gap-5 px-6 pt-4 pb-10">
            <div className="flex items-center justify-between">
              <Button size="icon" variant="ghost" aria-label="Leave full screen" onClick={() => setFull(false)}><ChevronDownIcon /></Button>
              <Link href={href} onClick={() => setFull(false)} className="text-muted-foreground truncate text-sm underline-offset-4 hover:underline">{track ? track.show : book?.bookTitle}</Link>
              <span className="size-9" />
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {art ? <img src={art} alt="" className="mx-auto aspect-square w-full max-w-sm rounded-xl border object-cover shadow-md" /> : null}
            <div className="space-y-1">
              {chap ? <p className="text-muted-foreground truncate text-sm">{chap.title}</p> : c && !track ? <p className="text-muted-foreground truncate text-sm">{c.title}</p> : null}
              <h2 className="text-xl font-semibold leading-snug tracking-tight">{name}</h2>
            </div>
            <div className="space-y-1.5">
              {scrubber}
              <p className="text-muted-foreground flex justify-between text-xs tabular-nums"><span>{stamp(time)}</span><span>-{stamp(Math.max(0, total - time))}</span></p>
            </div>
            <div className="flex items-center justify-center gap-6">
              <Button size="icon" variant="ghost" className="size-12 [&_svg]:size-6" aria-label="Back 15 seconds" onClick={() => skip(-15)}><RotateCcwIcon /></Button>
              <Button size="icon" className="size-16 rounded-full [&_svg]:size-7" aria-label={playing ? "Pause" : "Play"} onClick={toggle}>{playing ? <PauseIcon /> : <PlayIcon className="fill-current" />}</Button>
              <Button size="icon" variant="ghost" className="size-12 [&_svg]:size-6" aria-label="Forward 30 seconds" onClick={() => skip(30)}><RotateCwIcon /></Button>
            </div>
            <div className="flex items-center justify-center gap-2">{speed}{sleepMenu}{soundMenu}{queueMenu}</div>
            {left !== null || sleep ? <p className="text-muted-foreground text-center text-xs">{left !== null ? `Stops in ${left} min` : "Stops at the end"}</p> : null}
            {chapters.length ? (
              <section className="space-y-2">
                <h3 className="text-sm font-medium">Chapters</h3>
                <ol className="divide-y rounded-lg border text-sm">
                  {chapters.map((x, i) => (
                    <li key={`${x.at}-${i}`}>
                      <button type="button" onClick={() => seek(x.at)} aria-current={i === chapAt ? "true" : undefined} className={`hover:bg-accent flex w-full items-baseline gap-3 px-3 py-2 text-left ${i === chapAt ? "bg-muted font-medium" : ""}`}>
                        <span className="text-muted-foreground w-14 shrink-0 tabular-nums">{stamp(x.at)}</span><span className="min-w-0 flex-1">{x.title}</span>
                      </button>
                    </li>
                  ))}
                </ol>
              </section>
            ) : parts.length ? (
              <section className="space-y-2">
                <h3 className="text-sm font-medium">Chapters</h3>
                <ol className="divide-y rounded-lg border text-sm">
                  {parts.map((x, i) => (
                    <li key={x.url}>
                      <button type="button" onClick={() => play(book!, i)} aria-current={i === chapter ? "true" : undefined} className={`hover:bg-accent flex w-full items-baseline gap-3 px-3 py-2 text-left ${i === chapter ? "bg-muted font-medium" : ""}`}>
                        <span className="min-w-0 flex-1">{x.title}</span><span className="text-muted-foreground shrink-0 text-xs tabular-nums">{x.seconds ? stamp(x.seconds) : ""}</span>
                      </button>
                    </li>
                  ))}
                </ol>
              </section>
            ) : null}
          </div>
        </div>
      ) : null}
    </ListenContext.Provider>
  );
}
