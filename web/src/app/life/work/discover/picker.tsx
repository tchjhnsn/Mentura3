"use client";

import { useEffect, useMemo, useRef, useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeftIcon, CheckIcon, SearchIcon, XIcon } from "lucide-react";
import { CRAFTS, WORLDS, craftOf, craftPhoto, matchCrafts, related, worldPhoto, type Craft } from "@reflect/core/crafts";
import { TaskHeader } from "@/components/headers";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { savePicksAction } from "../crafts/actions";
import { Photo } from "./photo";

/** Toggle one id in a list, keeping the order picked. */
const toggled = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/**
 * The photo picker (Scholē picker design guide): Screen 1 picks worlds, Screen 2 (?step=crafts) picks crafts with
 * the matches so far on top, then a one-second matching moment and the matches page. Every tap shows at once and
 * saves in the background, so leaving and coming back finds the picks still checked.
 */
export function Picker({ initialWorlds, initialPicks }: { initialWorlds: string[]; initialPicks: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const step = params.get("step") === "crafts" ? 2 : 1;
  const [worlds, setWorlds] = useState(initialWorlds);
  const [picks, setPicks] = useState(initialPicks);
  // Related crafts slid in after a picked tile, by the picked craft's id; kept for the visit so nothing jumps back out.
  const [slid, setSlid] = useState<Record<string, string[]>>({});
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState("");
  const [matching, setMatching] = useState(false);
  const [, start] = useTransition();
  const saving = useRef<Promise<unknown>>(Promise.resolve());
  const pushedStep = useRef(false);

  useEffect(() => { router.prefetch("/life/work/discover/matches"); }, [router]);

  const save = (w: string[], p: string[]) => {
    start(async () => {
      const next = saving.current.then(() => savePicksAction(w, p)).catch(() => undefined);
      saving.current = next;
      await next;
    });
  };

  const tapWorld = (id: string) => {
    const w = toggled(worlds, id);
    setWorlds(w);
    save(w, picks);
  };

  const tapCraft = (id: string) => {
    const p = toggled(picks, id);
    setPicks(p);
    save(worlds, p);
    if (!picks.includes(id) && !slid[id]) {
      // Related crafts not already beside it (two tiles either way in its own world) and not picked or slid in yet.
      const shown = new Set([...Object.values(slid).flat(), ...picks]);
      const at = (c: string) => CRAFTS.findIndex((x) => x.id === c);
      const beside = (r: string) => craftOf(r)?.group === craftOf(id)?.group && Math.abs(at(r) - at(id)) <= 2;
      const near = related(id).filter((r) => !shown.has(r) && !beside(r)).slice(0, 2);
      if (near.length) setSlid((s) => ({ ...s, [id]: near }));
    }
  };

  const toCrafts = () => {
    window.history.pushState(null, "", `${pathname}?step=crafts`);
    pushedStep.current = true;
    window.scrollTo({ top: 0 });
  };
  const toWorlds = () => {
    if (pushedStep.current) window.history.back();
    else window.history.replaceState(null, "", pathname);
    pushedStep.current = false;
  };

  const seeMatches = async () => {
    setMatching(true);
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    await Promise.all([saving.current, new Promise((r) => setTimeout(r, still ? 400 : 1000))]);
    router.push("/life/work/discover/matches");
  };

  const header = () => <TaskHeader back={{ href: "/life/work", label: "Back to Work" }} title="Work" position="Find your crafts" />;

  if (matching) return <Matching picks={picks} />;

  if (step === 1) {
    return (
      <Column>
        {header()}
        <div className="mt-4 grid flex-1 grid-cols-[minmax(0,1fr)] content-start gap-5">
          <div className="flex items-start justify-between gap-4">
            <div className="grid gap-1">
              <h1 className="text-[21px] leading-tight font-bold">What pulls you?</h1>
              <p className="text-muted-foreground text-sm text-pretty">Pick any worlds. In a minute you will have three crafts to try this week.</p>
            </div>
            <Button asChild variant="ghost" size="sm" className="-mr-2 shrink-0"><Link href="/life/work/discover/matches?range=1">Skip</Link></Button>
          </div>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {WORLDS.map((w, i) => (
              <li key={w.id}>
                <Tile name={w.name} src={worldPhoto(w.id)?.src} on={worlds.includes(w.id)} onTap={() => tapWorld(w.id)} className="aspect-[4/5]" eager={i < 6} />
              </li>
            ))}
          </ul>
        </div>
        <BottomBar>
          <Button type="button" size="lg" className="w-full" disabled={!worlds.length} onClick={toCrafts}>
            {worlds.length ? `Show me crafts (${worlds.length})` : "Pick a world"}
          </Button>
        </BottomBar>
      </Column>
    );
  }

  const chosen = WORLDS.filter((w) => worlds.includes(w.id));
  const others = WORLDS.filter((w) => !worlds.includes(w.id));
  const q = query.trim().toLowerCase();
  const found = q ? CRAFTS.filter((c) => c.label.toLowerCase().includes(q)) : [];
  const section = (crafts: readonly Craft[]) => {
    // A related craft slid in beside a pick in the same list moves there rather than showing twice.
    const ids = new Set(crafts.map((c) => c.id));
    const moved = new Set(crafts.flatMap((c) => slid[c.id] ?? []).filter((r) => ids.has(r) && !slid[r]));
    return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {crafts.filter((c) => !moved.has(c.id)).flatMap((c) => [
        <li key={c.id}><Tile name={c.label} src={craftPhoto(c.id)?.src} on={picks.includes(c.id)} onTap={() => tapCraft(c.id)} className="aspect-[110/92]" /></li>,
        ...(slid[c.id] ?? []).map((r) => {
          const rc = craftOf(r)!;
          return (
            <li key={`${c.id}>${r}`} className="animate-in fade-in slide-in-from-left-4 duration-250 ease-out motion-reduce:animate-none">
              <Tile name={rc.label} src={craftPhoto(r)?.src} on={picks.includes(r)} onTap={() => tapCraft(r)} note={`like ${c.label}`} dashed className="aspect-[110/92]" />
            </li>
          );
        }),
      ])}
    </ul>
    );
  };

  const label = picks.length < 3 ? "Pick 3 to see your matches" : picks.length === 3 ? "See my 3 matches" : `See matches (${picks.length})`;
  return (
    <Column>
      {header()}
      <div className="mt-2 grid flex-1 grid-cols-[minmax(0,1fr)] content-start gap-4">
        <div className="flex items-center justify-between gap-3">
          <Button type="button" variant="ghost" size="sm" className="-ml-3" onClick={toWorlds}><ArrowLeftIcon />Worlds</Button>
          <Button type="button" variant="ghost" size="sm" className="-mr-3" aria-pressed={searching} onClick={() => { setSearching((s) => !s); setQuery(""); }}>
            {searching ? <><XIcon />Close search</> : <><SearchIcon />Search crafts</>}
          </Button>
        </div>
        {searching ? (
          <input
            autoFocus type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`Search all ${CRAFTS.length} crafts`} aria-label="Search crafts by name"
            className="border-input focus-visible:border-ring focus-visible:ring-ring/50 h-11 w-full rounded-lg border bg-transparent px-3 text-base outline-none focus-visible:ring-[3px]"
          />
        ) : null}
        <SoFar picks={picks} />

        {q ? (
          <section aria-label="Search results" className="grid gap-3">
            <h2 className="text-muted-foreground text-sm">{found.length ? plural(found.length, "craft", "crafts") : `No craft called "${query.trim()}"`}</h2>
            {section(found)}
          </section>
        ) : (
          <>
            {chosen.map((w) => (
              <section key={w.id} aria-labelledby={`w-${w.id}`} className="grid gap-3">
                <h2 id={`w-${w.id}`} className="text-base font-semibold">{w.name}</h2>
                {section(CRAFTS.filter((c) => c.group === w.id))}
              </section>
            ))}
            {others.length ? (
              <div className="mt-4 grid gap-6 border-t pt-6">
                <h2 className="text-muted-foreground text-sm font-medium">{chosen.length ? "More worlds" : "Every world"}</h2>
                {others.map((w) => (
                  <section key={w.id} aria-labelledby={`w-${w.id}`} className="grid gap-3">
                    <h3 id={`w-${w.id}`} className="text-sm font-semibold">{w.name}</h3>
                    {section(CRAFTS.filter((c) => c.group === w.id))}
                  </section>
                ))}
              </div>
            ) : null}
          </>
        )}
      </div>
      <BottomBar>
        <Button type="button" size="lg" className="w-full" disabled={picks.length < 3} onClick={seeMatches}>{label}</Button>
      </BottomBar>
    </Column>
  );
}

/** The page's height at least, so the bottom bar sits at the bottom even when there is little above it. */
const Column = ({ children }: { children: ReactNode }) => <div className="-my-6 flex min-h-dvh flex-col pt-6">{children}</div>;

/** A photo tile that lifts, rings in primary and checks on tap. */
function Tile({ name, src, on, onTap, note, dashed, className, eager }: { name: string; src?: string; on: boolean; onTap: () => void; note?: string; dashed?: boolean; className?: string; eager?: boolean }) {
  return (
    <button
      type="button" aria-pressed={on} onClick={onTap}
      className={cn(
        "focus-visible:ring-ring/50 relative block w-full overflow-hidden rounded-xl text-left outline-none transition-[scale,box-shadow] duration-150 ease-out [-webkit-tap-highlight-color:transparent] focus-visible:ring-[3px] active:scale-[0.97] motion-reduce:transition-none",
        on && "ring-primary ring-offset-background scale-[1.05] shadow-lg ring-[3px] ring-offset-2 active:scale-[1.02]",
        dashed && !on && "outline-primary/70 outline-2 outline-offset-2 outline-dashed",
        className,
      )}
    >
      <Photo src={src} name={name} eager={eager} className="absolute inset-0 size-full" />
      <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent px-2.5 pt-10 pb-2">
        {note ? <span className="block text-[11px] leading-tight font-medium text-white/85">{note}</span> : null}
        <span className="block text-sm leading-tight font-semibold text-white">{name}</span>
      </span>
      <span aria-hidden className={cn("absolute top-2 right-2 grid size-6 place-items-center rounded-full border-2 transition-colors duration-150 motion-reduce:transition-none", on ? "border-primary bg-primary text-primary-foreground" : "border-white/90 bg-black/25")}>
        {on ? <CheckIcon className="size-3.5" strokeWidth={3} /> : null}
      </span>
    </button>
  );
}

/** "Your matches so far": empty circles until three picks, then the top three, reshuffling as picks change. */
function SoFar({ picks }: { picks: string[] }) {
  const top = useMemo(() => (picks.length >= 3 ? matchCrafts(picks).top : []), [picks]);
  return (
    <div className="bg-background sticky top-14 z-20 -mx-1 px-1 pb-1">
      <div className="bg-primary/10 rounded-xl px-3 py-2.5" aria-live="polite">
        <p className="text-primary text-xs font-semibold">Your matches so far</p>
        {top.length ? (
          <ul className="mt-2 grid grid-cols-3 gap-2">
            {top.map((m) => {
              const c = craftOf(m.id)!;
              return (
                <li key={m.id} className="animate-in fade-in grid min-w-0 justify-items-center gap-1 text-center duration-200 motion-reduce:animate-none">
                  <Photo src={craftPhoto(m.id)?.src} name={c.label} className="size-10 rounded-full" />
                  <span className="line-clamp-2 min-w-0 text-xs leading-tight font-medium break-words">{c.label}</span>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="mt-2 flex items-center gap-3">
            <span className="flex shrink-0 gap-1.5" aria-hidden>
              {[0, 1, 2].map((i) => {
                const id = picks[i];
                return id
                  ? <Photo key={id} src={craftPhoto(id)?.src} name={craftOf(id)?.label ?? id} className="animate-in zoom-in-75 size-10 rounded-full duration-150 motion-reduce:animate-none" />
                  : <span key={i} className="border-primary/35 size-10 rounded-full border-2 border-dashed" />;
              })}
            </span>
            <span className="text-sm">{plural(3 - picks.length, "more pick", "more picks")} to see your matches</span>
          </div>
        )}
      </div>
    </div>
  );
}

/** The one filled button, pinned to the bottom of the screen inside the page's column. */
function BottomBar({ children }: { children: ReactNode }) {
  return (
    <div className="bg-background sticky bottom-0 z-20 -mx-6 mt-8 border-t px-6 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto max-w-sm">{children}</div>
    </div>
  );
}

/** The matching moment: about a second, while the last picks finish saving. */
function Matching({ picks }: { picks: string[] }) {
  return (
    <div className="bg-background animate-in fade-in fixed inset-0 z-50 grid place-items-center px-6 duration-200 motion-reduce:animate-none" role="status">
      <div className="grid justify-items-center gap-5 text-center">
        <div className="flex -space-x-3">
          {picks.slice(0, 6).map((id) => <Photo key={id} src={craftPhoto(id)?.src} name={craftOf(id)?.label ?? id} eager className="ring-background size-12 rounded-full ring-2" />)}
        </div>
        <p className="text-lg font-semibold text-balance">Matching your {picks.length} picks against {CRAFTS.length} crafts</p>
      </div>
    </div>
  );
}
