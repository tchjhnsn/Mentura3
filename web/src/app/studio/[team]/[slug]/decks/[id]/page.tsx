"use client";

// V5 Deck: build a marketing or investor deck slide by slide with the agent. Slides, rewrites and sharing are mock.
import Link from "next/link";
import { use, useCallback, useEffect, useState } from "react";
import {
  ArrowDownIcon, ArrowUpIcon, BotIcon, CheckIcon, ChevronLeftIcon, ChevronRightIcon, CopyIcon, PlayIcon, PlusIcon,
  SparklesIcon, TimerIcon, Trash2Icon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Face, Num } from "@/components/studio/bits";
import { ScreenHead, useChat } from "@/components/studio/shell";
import { businessHref, ventureOf, type Venture } from "@/components/studio/data";
import { deckFor, type Slide } from "@/components/studio/files-data";
import { useTeamSlug } from "@/components/studio/team";

const LAYOUTS: { id: Slide["layout"]; label: string }[] = [
  { id: "title", label: "Title" }, { id: "points", label: "Points" }, { id: "big-number", label: "Big number" }, { id: "quote", label: "Quote" },
];
type Tone = "shorter" | "bolder" | "investors" | "coaches";
const TONES: { id: Tone; label: string }[] = [
  { id: "shorter", label: "Shorter" }, { id: "bolder", label: "Bolder" }, { id: "investors", label: "For investors" }, { id: "coaches", label: "For coaches" },
];

/** Hand-written rewrites for the Haptic Plays slides; any other slide gets a plain rule. */
const REWRITES: Record<string, Partial<Record<Tone, { title: string; body: string[] }>>> = {
  i2: {
    shorter: { title: "The problem", body: ["Noise costs coaches plays", "Signals get stolen"] },
    bolder: { title: "Every game, coaches lose plays to noise", body: ["Two or three plays a game, every game", "Hand signals are read by the other bench"] },
    investors: { title: "A problem in 15,000 programs", body: ["Every program loses plays to noise", "No product reaches all players at once", "Coaches control a budget line for equipment"] },
    coaches: { title: "You call it, they miss it", body: ["Friday night noise drowns your call", "The other bench reads your signals", "Wristband cards go unread"] },
  },
  i3: {
    shorter: { title: "The solution", body: ["A $40 vest that buzzes the play"] },
    bolder: { title: "Every player feels the call at once", body: ["Under $40 a vest", "Five minute setup", "No sound needed"] },
    investors: { title: "Cheap hardware, recurring plays", body: ["$40 vest, made with off the shelf parts", "Play library sold by season", "Works in football, lacrosse and rugby"] },
    coaches: { title: "Call the play from your phone", body: ["Tap a play, every vest buzzes it", "Nothing for the other bench to read", "Your players learn it in one practice"] },
  },
  i4: {
    shorter: { title: "Traction", body: ["1 pilot team for December"] },
    bolder: { title: "A team wears it in December", body: ["3 coaches booked", "1 pilot team signed up"] },
    investors: { title: "Early, and honest about it", body: ["3 coach calls booked", "1 pilot lined up", "Next proof: missed calls before and after"] },
    coaches: { title: "Coaches like you are trying it", body: ["Lincoln High starts in December", "Two more coaches are talking to us"] },
  },
  i6: {
    shorter: { title: "The ask", body: ["$250k pre-seed"] },
    bolder: { title: "$250k puts vests in five schools", body: ["Pilots in five schools by spring", "A play library coaches pay for"] },
    investors: { title: "$250k pre-seed", body: ["Five school pilots by spring", "12 months of runway", "Proof of retention before the seed"] },
    coaches: { title: "Join the pilot", body: ["Free vests for the season", "First say on what we build"] },
  },
};

function rewrite(slide: Slide, tone: Tone, v: Venture): Slide {
  const hand = REWRITES[slide.id]?.[tone];
  if (hand) return { ...slide, ...hand };
  const words = (t: string, n: number) => t.split(" ").slice(0, n).join(" ");
  if (tone === "shorter") return { ...slide, body: slide.body.slice(0, 2).map((t) => words(t, 7)) };
  if (tone === "bolder") return slide.body.length > 1 ? { ...slide, title: slide.body[0]!, body: slide.body.slice(1) } : { ...slide, title: `${slide.title}, now` };
  if (tone === "investors") return { ...slide, body: [...slide.body.slice(0, 2), `Why it matters to a funder: it moves ${v.name} from ${v.commitment} to the next step`] };
  return { ...slide, body: [...slide.body.slice(0, 2), "In plain words for a coach: less shouting, fewer missed calls"] };
}

/** One slide at any size: text is sized to the slide's width, so thumbnails and the presenter match. */
function SlideView({ slide, v, className }: { slide: Slide; v: Venture; className?: string }) {
  const accent = `oklch(0.62 0.14 ${v.hue})`;
  return (
    <div className={cn("@container relative aspect-video w-full overflow-hidden rounded-md border bg-white text-stone-900 shadow-sm", className)}>
      <div className="absolute inset-x-0 top-0 h-[1.5cqw]" style={{ background: accent }} />
      <div className="flex h-full flex-col p-[6cqw]">
        {slide.layout === "title" ? (
          <div className="my-auto">
            <div className="text-[length:7cqw] leading-tight font-semibold tracking-tight">{slide.title}</div>
            {slide.body[0] ? <div className="mt-[2cqw] text-[length:3cqw] text-stone-600">{slide.body[0]}</div> : null}
          </div>
        ) : slide.layout === "big-number" ? (
          <>
            <div className="text-[length:3cqw] font-medium" style={{ color: accent }}>{slide.title}</div>
            <div className="my-auto space-y-[1.5cqw]">
              {slide.body.map((b, i) => <div key={i} className={i === 0 ? "text-[length:6cqw] leading-tight font-semibold" : "text-[length:3cqw] text-stone-600"}>{b}</div>)}
            </div>
          </>
        ) : slide.layout === "quote" ? (
          <>
            <div className="text-[length:3cqw] font-medium" style={{ color: accent }}>{slide.title}</div>
            <div className="my-auto text-[length:4.2cqw] leading-snug font-medium italic">{slide.body.join(" ")}</div>
          </>
        ) : (
          <>
            <div className="text-[length:5cqw] leading-tight font-semibold tracking-tight">{slide.title}</div>
            <ul className="mt-[3cqw] space-y-[1.5cqw] text-[length:3cqw]">
              {slide.body.map((b, i) => <li key={i} className="flex gap-[1.5cqw]"><span className="mt-[1.2cqw] size-[1cqw] shrink-0 rounded-full" style={{ background: accent }} />{b}</li>)}
            </ul>
          </>
        )}
        <div className="mt-auto text-[length:1.8cqw] text-stone-400">{v.name}</div>
      </div>
    </div>
  );
}

function Presenter({ open, onOpenChange, slides, start, v }: { open: boolean; onOpenChange: (o: boolean) => void; slides: Slide[]; start: number; v: Venture }) {
  const [i, setI] = useState(start);
  const [secs, setSecs] = useState(0);
  useEffect(() => { if (!open) return; const t = setInterval(() => setSecs((s) => s + 1), 1000); return () => clearInterval(t); }, [open]);
  const go = useCallback((d: number) => setI((x) => Math.min(slides.length - 1, Math.max(0, x + d))), [slides.length]);
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => { if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); go(1); } if (e.key === "ArrowLeft") { e.preventDefault(); go(-1); } };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [open, go]);
  const cur = slides[i] ?? slides[0]!;
  const next = slides[i + 1];
  const mm = String(Math.floor(secs / 60)).padStart(2, "0");
  const ss = String(secs % 60).padStart(2, "0");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-dvh w-screen max-w-none flex-col gap-3 overflow-y-auto rounded-none border-0 bg-stone-950 p-4 text-stone-100 sm:max-w-none md:p-6">
        <Num n="V5.5" className="absolute top-2 left-2" />
        <DialogHeader className="pr-8">
          <DialogTitle className="text-sm font-medium text-stone-300">Presenting slide {i + 1} of {slides.length}</DialogTitle>
          <DialogDescription className="sr-only">Use the arrow keys or the buttons to move between slides.</DialogDescription>
        </DialogHeader>
        <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <SlideView slide={cur} v={v} className="self-start border-stone-800" />
          <div className="flex min-w-0 flex-col gap-4">
            <div className="flex items-center gap-2 font-mono text-2xl tabular-nums"><TimerIcon className="size-5 text-stone-400" />{mm}:{ss}</div>
            <div>
              <div className="mb-1 text-xs text-stone-400">Next</div>
              {next ? <SlideView slide={next} v={v} className="border-stone-800 opacity-80" /> : <div className="rounded-md border border-stone-800 p-4 text-sm text-stone-400">This is the last slide.</div>}
            </div>
            <div>
              <div className="mb-1 text-xs text-stone-400">Notes</div>
              <p className="text-base leading-relaxed">{cur.notes || "No notes for this slide."}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" className="border-stone-700 bg-transparent text-stone-100 hover:bg-stone-800" onClick={() => go(-1)} disabled={i === 0}><ChevronLeftIcon />Back</Button>
          <Button variant="outline" className="border-stone-700 bg-transparent text-stone-100 hover:bg-stone-800" onClick={() => go(1)} disabled={i === slides.length - 1}>Next<ChevronRightIcon /></Button>
          <Button variant="ghost" className="text-stone-300 hover:bg-stone-800 hover:text-stone-100" onClick={() => onOpenChange(false)}>End</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function DeckPage({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const team = useTeamSlug() ?? "";
  const { slug, id } = use(params);
  const v = ventureOf(slug);
  const deck = deckFor(slug, id);
  const chat = useChat();
  const [slides, setSlides] = useState<Slide[]>(deck.slides);
  const [cur, setCur] = useState(0);
  const [presenting, setPresenting] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [access, setAccess] = useState("team");
  const [copied, setCopied] = useState(false);
  const [undo, setUndo] = useState<{ before: Slide; tone: string } | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const slide = slides[cur] ?? slides[0]!;
  const link = `https://mentura.app/d/${slug}-${deck.id}`;

  const update = (s: Slide) => setSlides((xs) => xs.map((x, k) => (k === cur ? s : x)));
  const move = (k: number, d: number) => {
    const j = k + d;
    if (j < 0 || j >= slides.length) return;
    setSlides((xs) => { const n = [...xs]; [n[k], n[j]] = [n[j]!, n[k]!]; return n; });
    if (cur === k) setCur(j); else if (cur === j) setCur(k);
  };
  const add = () => {
    const s: Slide = { id: `n${Date.now()}`, layout: "points", title: "New slide", body: ["Add a point"], notes: "" };
    setSlides((xs) => [...xs.slice(0, cur + 1), s, ...xs.slice(cur + 1)]);
    setCur(cur + 1);
  };
  const remove = (k: number) => {
    if (slides.length === 1) { setNote("A deck needs at least one slide."); return; }
    setSlides((xs) => xs.filter((_, x) => x !== k));
    setCur((c) => Math.max(0, c >= k ? c - 1 : c));
    setNote(`Deleted slide ${k + 1}.`);
  };
  const doRewrite = (tone: Tone, label: string) => {
    setUndo({ before: slide, tone: label });
    update(rewrite(slide, tone, v));
  };
  const copy = async () => { try { await navigator.clipboard.writeText(link); } catch {} setCopied(true); setTimeout(() => setCopied(false), 1500); };
  const others = slug === "haptic-plays" ? [{ id: "investor", name: "Investor deck" }, { id: "coach-pitch", name: "Coach pitch" }] : [{ id: "investor", name: "Investor deck" }];

  return (
    <div className="@container pb-16">
      <ScreenHead n="V5" title={deck.name} job={`For ${deck.audience.toLowerCase()}. ${slides.length} slides.`}>
        <Button variant="outline" onClick={() => setPresenting(true)}><PlayIcon />Present</Button>
        <Button onClick={() => setSharing(true)} className="relative"><Num n="V5.6" className="absolute -top-2 -right-2" />Share deck</Button>
      </ScreenHead>

      <div className="mb-3 flex flex-wrap items-center gap-1 px-4 md:px-8" aria-label="Decks">
        {others.map((d) => (
          <Button key={d.id} variant={d.id === deck.id ? "secondary" : "ghost"} size="sm" asChild>
            <Link href={businessHref(team, slug, `decks/${d.id}`)} aria-current={d.id === deck.id ? "page" : undefined}>{d.name}</Link>
          </Button>
        ))}
      </div>

      {note ? (
        <div className="mx-4 mb-3 flex items-center justify-between gap-2 rounded-md border bg-emerald-500/5 px-3 py-2 text-sm md:mx-8">
          <span>{note}</span><Button variant="ghost" size="xs" onClick={() => setNote(null)}>Dismiss</Button>
        </div>
      ) : null}

      <div className="flex flex-col gap-5 px-4 md:px-8 @4xl:grid @4xl:grid-cols-[150px_minmax(0,1fr)_240px] @4xl:items-start">
        <aside className="relative order-3 @4xl:order-none">
          <Num n="V5.1" className="absolute -top-2 right-0 z-10" />
          <div className="mb-2 flex items-center justify-between @4xl:hidden"><h2 className="text-sm font-semibold">Slides</h2></div>
          <ol className="space-y-2">
            {slides.map((s, k) => (
              <li key={s.id} className={cn("group rounded-md p-1", k === cur ? "bg-accent" : "hover:bg-accent/50")}>
                <button type="button" onClick={() => setCur(k)} className="flex w-full min-w-0 items-center gap-2 text-left @4xl:block" aria-current={k === cur ? "true" : undefined}>
                  <span className="text-muted-foreground w-4 shrink-0 text-xs @4xl:hidden">{k + 1}</span>
                  <span className="hidden @4xl:block"><SlideView slide={s} v={v} /></span>
                  <span className="min-w-0 flex-1 truncate text-sm @4xl:hidden">{s.title}</span>
                </button>
                <div className={cn("mt-1 flex items-center gap-0.5", k === cur ? "flex" : "flex @4xl:hidden @4xl:group-hover:flex")}>
                  <span className="text-muted-foreground mr-auto hidden text-xs @4xl:inline">{k + 1}</span>
                  <Button variant="ghost" size="icon-xs" onClick={() => move(k, -1)} disabled={k === 0} aria-label={`Move slide ${k + 1} up`}><ArrowUpIcon /></Button>
                  <Button variant="ghost" size="icon-xs" onClick={() => move(k, 1)} disabled={k === slides.length - 1} aria-label={`Move slide ${k + 1} down`}><ArrowDownIcon /></Button>
                  <Button variant="ghost" size="icon-xs" onClick={() => remove(k)} aria-label={`Delete slide ${k + 1}`}><Trash2Icon /></Button>
                </div>
              </li>
            ))}
          </ol>
          <Button variant="outline" size="sm" className="mt-2 w-full" onClick={add}><PlusIcon />Add slide</Button>
        </aside>

        <section className="order-1 min-w-0 space-y-4 @4xl:order-none">
          <div className="relative">
            <Num n="V5.2" className="absolute -top-2 left-2 z-10" />
            <SlideView slide={slide} v={v} />
          </div>
          <div className="relative">
            <Num n="V5.3" className="absolute -top-2 right-0" />
            <label htmlFor="notes" className="mb-1 block text-xs font-medium">Speaker notes</label>
            <Textarea id="notes" value={slide.notes} onChange={(e) => update({ ...slide, notes: e.target.value })} placeholder="What to say on this slide" className="min-h-20 text-sm" />
          </div>
        </section>

        <aside className="relative order-2 space-y-5 rounded-lg border p-3 @4xl:order-none">
          <Num n="V5.4" className="absolute -top-2 right-2" />
          <div>
            <h2 className="mb-2 text-xs font-medium">Layout</h2>
            <div className="grid grid-cols-2 gap-1.5">
              {LAYOUTS.map((l) => (
                <Button key={l.id} variant={slide.layout === l.id ? "secondary" : "ghost"} size="sm" className={cn("justify-start", slide.layout === l.id && "ring-1 ring-ring")} aria-pressed={slide.layout === l.id} onClick={() => update({ ...slide, layout: l.id })}>{l.label}</Button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-xs font-medium">Text</h2>
            <Input value={slide.title} onChange={(e) => update({ ...slide, title: e.target.value })} aria-label="Slide title" />
            <Textarea value={slide.body.join("\n")} onChange={(e) => update({ ...slide, body: e.target.value.split("\n") })} className="min-h-24 text-sm" aria-label="Slide points, one per line" />
            <p className="text-muted-foreground text-xs">One point per line.</p>
          </div>
          <div>
            <h2 className="mb-2 flex items-center gap-1.5 text-xs font-medium"><SparklesIcon className="size-3.5" />Rewrite with agent</h2>
            <div className="grid grid-cols-2 gap-1.5">
              {TONES.map((t) => <Button key={t.id} variant="outline" size="sm" onClick={() => doRewrite(t.id, t.label)}>{t.label}</Button>)}
            </div>
            {undo ? (
              <div className="mt-2 flex items-center justify-between gap-2 rounded-md bg-fuchsia-600/5 px-2 py-1.5 text-xs">
                <span className="inline-flex items-center gap-1"><BotIcon className="size-3.5" />Marketing agent rewrote it: {undo.tone.toLowerCase()}.</span>
                <Button variant="ghost" size="xs" onClick={() => { const b = undo.before; setSlides((xs) => xs.map((x) => (x.id === b.id ? b : x))); setUndo(null); }}>Undo</Button>
              </div>
            ) : null}
            <Button variant="ghost" size="sm" className="mt-2 w-full" onClick={() => { chat.setOpen(true); setNote(`The agent panel is open. Tell it what slide ${cur + 1} should say.`); }}>Ask for something else</Button>
          </div>
        </aside>
      </div>

      <Presenter key={presenting ? `on-${cur}` : "off"} open={presenting} onOpenChange={setPresenting} slides={slides} start={cur} v={v} />

      <Dialog open={sharing} onOpenChange={setSharing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share {deck.name.toLowerCase()}</DialogTitle>
            <DialogDescription>Anyone you share with sees the deck as it is now. Edits stay with the team.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input readOnly value={link} aria-label="Deck link" className="min-w-0 flex-1 font-mono text-xs" />
              <Button variant="outline" onClick={copy}>{copied ? <CheckIcon /> : <CopyIcon />}{copied ? "Copied" : "Copy"}</Button>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Who can open it</label>
              <Select value={access} onValueChange={setAccess}>
                <SelectTrigger className="w-full" aria-label="Access"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="team">Only the {v.name} team</SelectItem>
                  <SelectItem value="link">Anyone with the link</SelectItem>
                  <SelectItem value="named">Only people I name</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-muted-foreground text-xs">{access === "link" ? "Anyone with the link can view. The Marketing agent logs each open." : access === "named" ? "Type an email in the agent panel to add a person." : "Only people on the team can open it."}</p>
            </div>
            <div className="space-y-2">
              <div className="text-xs font-medium">Team</div>
              {v.team.map((p) => <Face key={p} id={p} size={24} />)}
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => { setSharing(false); setNote(`Sharing set: ${access === "link" ? "anyone with the link" : access === "named" ? "named people only" : "team only"}.`); }}>Done</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
