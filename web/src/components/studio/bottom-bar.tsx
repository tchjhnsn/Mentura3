"use client";

// B1 Bottom bar (doc "Mentura console: screens, navigation and teams", round 5): keeps what needs the person next and
// what is running one tap away, without leaving the page. After VS Code's status bar and Salesforce's utility bar.
//
// - The bar: a 28 px strip along the bottom of the content area, on every page inside a real business and on no team,
//   account or sign-in page. Left: Stream and Running with counts. Right: the sync state, when the server knows one.
// - The panel: Stream or Running opens upward, 320 px tall, over the bottom of the page; the page keeps scrolling above.
//   A second tap or Escape closes it, and Ctrl+backtick toggles the last one used, which the browser remembers.
// - On a phone the bar folds into one chip above the bottom edge, which opens a bottom sheet with both tabs.
//
// Stream is what waits on the person, in the order of Naive's decision index (bridge op `needs`). Running is the feed of
// running work (src/server/work-runs.ts); today only sync pushes report there, so a business with none shows nothing.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Loader2Icon } from "lucide-react";
import { readRunning, readStream, type RunningRead, type StreamRead } from "@/app/studio/bar-actions";
import type { Result } from "@/app/studio/actions";
import { Progress } from "@/components/ui/progress";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { runningCounts, startedLine, type ShownRun } from "@/server/work-runs-core";
import { useBusiness } from "./business";
import { businessHref } from "./data";
import { actionable, anyOverdue, dueLine, functionLabel, unlocksLine } from "./needs-format";
import { levelOf } from "./tools";

type Tab = "stream" | "running";
const TAB_KEY = "mentura.bottom-bar.tab";
const STREAM_ROWS = 20;

function rememberedTab(): Tab {
  try { return window.localStorage.getItem(TAB_KEY) === "running" ? "running" : "stream"; } catch { return "stream"; }
}
function rememberTab(t: Tab) {
  try { window.localStorage.setItem(TAB_KEY, t); } catch { /* a blocked store only forgets the tab */ }
}

/** The business the page is inside, when it is a real one: the bar is not drawn on team pages or sample businesses. */
function useBarBusiness(): { team: string; slug: string; venture: string } | null {
  const at = levelOf(usePathname() ?? "");
  const slug = at.kind === "studio" ? null : at.slug;
  const business = useBusiness(slug);
  if (at.kind === "studio" || !slug || !business?.real) return null;
  return { team: decodeURIComponent(at.team), slug, venture: decodeURIComponent(slug) };
}

/** Reads Stream and Running for the business: on opening the page, on coming back to the tab, and Running every few
 * seconds while something runs. */
function useBarData(team: string | null, venture: string | null) {
  const [stream, setStream] = useState<Result<StreamRead> | null>(null);
  const [running, setRunning] = useState<Result<RunningRead> | null>(null);
  const readS = useCallback(async () => {
    if (team && venture) setStream(await readStream(team, venture).catch(() => ({ ok: false as const, error: "Stream could not be read. Try again." })));
  }, [team, venture]);
  const readR = useCallback(async () => {
    if (team && venture) setRunning(await readRunning(team, venture).catch(() => ({ ok: false as const, error: "Running could not be read. Try again." })));
  }, [team, venture]);
  useEffect(() => {
    setStream(null); setRunning(null);
    if (!team || !venture) return;
    void readS(); void readR();
    const back = () => { if (document.visibilityState === "visible") { void readS(); void readR(); } };
    document.addEventListener("visibilitychange", back);
    return () => document.removeEventListener("visibilitychange", back);
  }, [team, venture, readS, readR]);
  const busy = running?.ok ? runningCounts(running.value.runs).running > 0 : false;
  useEffect(() => {
    if (!team || !venture) return;
    const t = setInterval(() => { void readR(); }, busy ? 5_000 : 60_000);
    return () => clearInterval(t);
  }, [team, venture, busy, readR]);
  const refresh = useCallback(() => { void readS(); void readR(); }, [readS, readR]);
  return { stream, running, refresh };
}

function useOnline(): boolean {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const set = () => setOnline(navigator.onLine);
    set();
    window.addEventListener("online", set); window.addEventListener("offline", set);
    return () => { window.removeEventListener("online", set); window.removeEventListener("offline", set); };
  }, []);
  return online;
}

/** The bar, its panel and, on a phone, the chip and sheet. Renders nothing outside a real business. */
export function BottomBar() {
  const b = useBarBusiness();
  const { stream, running, refresh } = useBarData(b?.team ?? null, b?.venture ?? null);
  const online = useOnline();
  const [open, setOpen] = useState<Tab | null>(null);
  const [sheet, setSheet] = useState(false);
  const [last, setLast] = useState<Tab>("stream");
  const path = usePathname();

  useEffect(() => { setLast(rememberedTab()); }, []);
  // A page change closes the panel: the row the person tapped has opened.
  useEffect(() => { setOpen(null); setSheet(false); }, [path]);

  const toggle = useCallback((t: Tab) => {
    setOpen((o) => (o === t ? null : t));
    setLast(t); rememberTab(t);
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!b) return;
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) { setOpen(null); return; }
      if (e.ctrlKey && (e.key === "`" || e.code === "Backquote")) { e.preventDefault(); toggle(last); }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [b, open, last, toggle]);

  if (!b) return null;
  const s = stream?.ok ? stream.value : null;
  const waiting = s ? actionable(s.needs.decisions, s.role) : [];
  const r = running?.ok ? running.value : null;
  const counts = r ? runningCounts(r.runs) : { running: 0, failed: 0 };
  const shown = counts.running + counts.failed;
  const sync = !online ? "offline" : r?.sync ?? null;

  const streamCount = stream === null ? <span aria-label="loading">–</span> : !s ? null : <span className={s && anyOverdue(waiting) ? "text-primary" : ""}>{waiting.length}</span>;
  const runningCount = running === null ? <span aria-label="loading">–</span> : shown ? <span className={counts.failed ? "text-destructive" : ""}>{shown}</span> : null;

  return (
    <>
      {open ? (
        <div id="bottom-bar-panel" role="region" aria-label={open === "stream" ? "Stream" : "Running"}
          className="bg-background absolute inset-x-0 bottom-7 z-20 hidden h-80 flex-col border-t shadow-[0_-8px_24px_-12px_rgb(0_0_0/0.25)] md:flex">
          {open === "stream" ? <StreamPanel read={stream} team={b.team} slug={b.slug} /> : <RunningPanel read={running} />}
        </div>
      ) : null}
      <div role="toolbar" aria-label="Bottom bar" className="bg-background hidden h-7 shrink-0 items-center gap-1 border-t px-2 text-[11.5px] md:flex">
        <button type="button" onClick={() => toggle("stream")} aria-expanded={open === "stream"} aria-controls="bottom-bar-panel"
          className={`hover:bg-accent flex h-6 items-center gap-1.5 rounded px-2 font-semibold ${open === "stream" ? "bg-accent" : ""} ${s && !waiting.length ? "text-muted-foreground" : ""}`}>
          Stream {streamCount}
        </button>
        <button type="button" onClick={() => toggle("running")} aria-expanded={open === "running"} aria-controls="bottom-bar-panel"
          className={`hover:bg-accent flex h-6 items-center gap-1.5 rounded px-2 ${open === "running" ? "bg-accent" : ""}`}>
          Running {counts.running ? <Loader2Icon aria-hidden className="size-3 animate-spin" /> : null}{runningCount}
        </button>
        <div className="flex-1" />
        {sync === "offline" ? <span className="text-muted-foreground px-2">Offline</span> : null}
        {sync === "conflict" ? (
          <button type="button" onClick={() => toggle("running")} className="text-destructive hover:bg-accent h-6 rounded px-2">Conflict</button>
        ) : null}
      </div>
      <button type="button" onClick={() => { setSheet(true); refresh(); }} aria-label="Open Stream and Running"
        className="bg-background absolute bottom-3 left-1/2 z-20 flex h-8 -translate-x-1/2 items-center gap-1.5 rounded-full border px-3.5 text-[11.5px] shadow-md md:hidden">
        <span className="font-semibold">Stream {streamCount}</span>
        <span aria-hidden className="text-muted-foreground">·</span>
        <span>Running {counts.running ? <Loader2Icon aria-hidden className="inline size-3 animate-spin" /> : null} {runningCount}</span>
        {sync === "conflict" ? <span className="text-destructive">· Conflict</span> : sync === "offline" ? <span className="text-muted-foreground">· Offline</span> : null}
      </button>
      <Sheet open={sheet} onOpenChange={setSheet}>
        <SheetContent side="bottom" className="h-[70dvh] gap-0 p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Stream and Running</SheetTitle>
            <SheetDescription>What needs you in this business and what is running.</SheetDescription>
          </SheetHeader>
          <Tabs value={last} onValueChange={(v) => { const t = v === "running" ? "running" : "stream"; setLast(t); rememberTab(t); }} className="flex min-h-0 flex-1 flex-col pt-3">
            <TabsList className="mx-4">
              <TabsTrigger value="stream">Stream</TabsTrigger>
              <TabsTrigger value="running">Running</TabsTrigger>
            </TabsList>
            <TabsContent value="stream" className="flex min-h-0 flex-1 flex-col"><StreamPanel read={stream} team={b.team} slug={b.slug} /></TabsContent>
            <TabsContent value="running" className="flex min-h-0 flex-1 flex-col"><RunningPanel read={running} /></TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>
    </>
  );
}

function PanelHead({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="flex h-9 shrink-0 items-center justify-between px-4">
      <h2 className="text-[13px] font-semibold">{title}</h2>
      {children}
    </div>
  );
}

function StreamPanel({ read, team, slug }: { read: Result<StreamRead> | null; team: string; slug: string }) {
  const decisions = businessHref(team, slug, "decisions");
  const seeAll = <Link href={decisions} className="text-muted-foreground text-[11.5px] hover:underline">See all</Link>;
  if (!read) return <><PanelHead title="Stream" /><p className="text-muted-foreground px-4 text-[13px]">Reading what needs you.</p></>;
  if (!read.ok) return <><PanelHead title="Stream" /><p className="px-4 text-[13px]">{read.error}</p></>;
  const { needs, role } = read.value;
  const rows = actionable(needs.decisions, role);
  if (!rows.length) {
    return (
      <>
        <PanelHead title="Stream">{seeAll}</PanelHead>
        <div className="px-4">
          <p className="text-[13px] font-medium">Nothing needs you</p>
          <p className="text-muted-foreground mt-0.5 text-[11.5px]">
            {role === "viewer" ? "You are a Viewer here, so decisions go to the team's Owners and Members."
              : needs.last_decided ? `The last thing you decided: ${needs.last_decided.question}` : "Decisions show here when one waits on you."}
          </p>
        </div>
      </>
    );
  }
  return (
    <>
      <PanelHead title="Stream">{seeAll}</PanelHead>
      <ol className="min-h-0 flex-1 overflow-y-auto pb-2" aria-label="Waiting on you">
        {rows.slice(0, STREAM_ROWS).map((d) => {
          const due = dueLine(d.due);
          return (
            <li key={d.id}>
              <Link href={`${decisions}#decision-${encodeURIComponent(d.id)}`} className="hover:bg-accent block px-4 py-2">
                <span className="block truncate text-[13px]">{d.question}</span>
                <span className="text-muted-foreground block truncate text-[11.5px]">
                  {[functionLabel(d.function), unlocksLine(d), due].filter(Boolean).join(" · ")}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </>
  );
}

function RunningPanel({ read }: { read: Result<RunningRead> | null }) {
  const [opened, setOpened] = useState<string | null>(null);
  if (!read) return <><PanelHead title="Running" /><p className="text-muted-foreground px-4 text-[13px]">Reading what is running.</p></>;
  if (!read.ok) return <><PanelHead title="Running" /><p className="px-4 text-[13px]">{read.error}</p></>;
  const { runs, total } = read.value;
  return (
    <>
      <PanelHead title="Running">{total > runs.length ? <span className="text-muted-foreground text-[11.5px]">{runs.length} of {total}</span> : null}</PanelHead>
      {runs.length ? (
        <ul className="min-h-0 flex-1 overflow-y-auto pb-2" aria-label="Running work">
          {runs.map((r) => <RunRow key={r.id} r={r} open={opened === r.id} onToggle={() => setOpened(opened === r.id ? null : r.id)} />)}
        </ul>
      ) : (
        <p className="text-muted-foreground px-4 text-[13px]">Nothing is running.</p>
      )}
    </>
  );
}

function RunRow({ r, open, onToggle }: { r: ShownRun; open: boolean; onToggle: () => void }) {
  const failed = r.status === "failed" || r.status === "conflict";
  return (
    <li>
      <button type="button" onClick={onToggle} aria-expanded={open} className="hover:bg-accent block w-full px-4 py-2 text-left">
        <span className="flex items-center gap-1.5 text-[13px]">
          {r.status === "running" ? <Loader2Icon aria-hidden className="size-3 animate-spin" /> : null}
          <span className="truncate">{r.name}</span>
        </span>
        {r.status === "running" ? <Progress value={Math.round((r.step / Math.max(1, r.steps)) * 100)} className="mt-1 h-0.5" aria-label={`Step ${r.step} of ${r.steps}`} /> : null}
        <span className={`block truncate text-[11.5px] ${failed ? "text-destructive" : "text-muted-foreground"}`}>
          {failed ? r.failure : `Step ${r.step} of ${r.steps}${r.step_label ? `: ${r.step_label}` : ""}`}
        </span>
        <span className="text-muted-foreground block text-[11.5px]">{startedLine(r)}</span>
      </button>
      {open ? (
        <ol className="text-muted-foreground mx-4 mb-2 space-y-0.5 border-l pl-3 text-[11.5px]" aria-label={`Log of ${r.name}`}>
          {r.log.map((l, i) => <li key={i}><time dateTime={l.at}>{new Date(l.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</time> {l.text}</li>)}
        </ol>
      ) : null}
    </li>
  );
}
