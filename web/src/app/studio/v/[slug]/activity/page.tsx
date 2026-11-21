"use client";

// V9 Activity: watch every agent run live, with logs, spend and what it changed.
import { use, useEffect, useMemo, useRef, useState } from "react";
import { ChevronDownIcon, PauseIcon, PlayIcon, SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { HeldCard, Num, StatusDot } from "@/components/studio/bits";
import { RunRow } from "@/components/studio/run-row";
import { ScreenHead } from "@/components/studio/shell";
import { AGENTS, FUNCTIONS, agentOf, fnOf, ventureOf, type FunctionId } from "@/components/studio/data";
import { FEED_RUNS, LIVE_STEPS, LOG_POOL, SPEND_CAP, SPEND_TODAY } from "@/components/studio/activity-data";
import { cn } from "@/lib/utils";

type StatusFilter = "all" | "running" | "held" | "failed";
const STATUS_TABS: { id: StatusFilter; label: string }[] = [
  { id: "all", label: "All" }, { id: "running", label: "Running" }, { id: "held", label: "Held" }, { id: "failed", label: "Failed" },
];
const LEVEL_TONE = { info: "text-muted-foreground", tool: "text-sky-600 dark:text-sky-400", warn: "text-amber-600 dark:text-amber-400", held: "text-fuchsia-600" } as const;

export default function ActivityPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const venture = ventureOf(slug);
  const runs = useMemo(() => FEED_RUNS.map((r) => ({ ...r, venture: slug })), [slug]);

  const [paused, setPaused] = useState(false);
  const [tick, setTick] = useState(0);
  const [agentF, setAgentF] = useState("all");
  const [fnF, setFnF] = useState<"all" | FunctionId>("all");
  const [statusF, setStatusF] = useState<StatusFilter>("all");
  const [q, setQ] = useState("");
  const [decided, setDecided] = useState<Record<string, "yes" | "no">>({});

  // Mock ticker: the live strip moves one step every few seconds while agents are not paused.
  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setTick((n) => n + 1), 3000);
    return () => clearInterval(t);
  }, [paused]);

  const live = AGENTS.filter((a) => a.status === "running");
  const shown = runs.filter((r) => {
    if (agentF !== "all" && r.agent !== agentF) return false;
    if (fnF !== "all" && agentOf(r.agent).fn !== fnF) return false;
    if (statusF !== "all" && r.status !== statusF) return false;
    if (q && !`${r.title} ${agentOf(r.agent).name}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });
  const held = runs.filter((r) => r.status === "held");
  const heldOpen = held.filter((r) => !decided[r.id]).length;
  const failed = runs.filter((r) => r.status === "failed").length;
  const runsToday = AGENTS.reduce((s, a) => s + a.runsToday, 0);
  const fnsInUse = FUNCTIONS.filter((f) => AGENTS.some((a) => a.fn === f.id));

  const spendBy = AGENTS.map((a) => ({ a, cost: runs.filter((r) => r.agent === a.id).reduce((s, r) => s + r.cost, 0) }))
    .filter((x) => x.cost > 0).sort((x, y) => y.cost - x.cost);
  const maxSpend = Math.max(...spendBy.map((x) => x.cost));

  return (
    <div className="pb-10">
      <ScreenHead n="V9" title="Activity" job={`Watch every agent run live in ${venture.name}, with logs, spend and what each run changed.`}>
        <Button onClick={() => setPaused(!paused)}>
          {paused ? <PlayIcon /> : <PauseIcon />}{paused ? "Resume all" : "Pause all agents"}
        </Button>
      </ScreenHead>

      <div className="space-y-6 px-4 md:px-8">
        {paused ? (
          <p className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm">
            Every agent is paused. Runs stop at their next step and nothing new starts until you resume.
          </p>
        ) : null}

        {/* V9.1 Live now strip */}
        <section className="relative">
          <Num n="V9.1" className="absolute -top-2 right-0" />
          <h2 className="mb-2 text-sm font-medium">Live now</h2>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {live.map((a, i) => {
              const steps = LIVE_STEPS[a.id] ?? ["Working"];
              const step = steps[(tick + i) % steps.length]!;
              return (
                <div key={a.id} className="min-w-0 rounded-lg border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium">{a.name}</span>
                    <StatusDot status={paused ? "paused" : "running"} />
                  </div>
                  <p key={paused ? "p" : step} className="text-muted-foreground mt-1 truncate text-xs animate-in fade-in">
                    {paused ? `Paused at: ${step}` : step}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* V9.2 Stats row */}
        <section className="relative grid grid-cols-2 gap-2 lg:grid-cols-4">
          <Num n="V9.2" className="absolute -top-2 right-0 z-10" />
          <Stat label="Runs today" value={String(runsToday)} />
          <Stat label="Held for you" value={String(heldOpen)} tone={heldOpen ? "text-fuchsia-600" : undefined} />
          <Stat label="Failed" value={String(failed)} tone={failed ? "text-red-600" : undefined} />
          <div className="rounded-lg border p-3">
            <div className="text-muted-foreground text-xs">Spend today</div>
            <div className="mt-0.5 text-xl font-semibold tabular-nums">${SPEND_TODAY.toFixed(2)}<span className="text-muted-foreground text-sm font-normal"> of ${SPEND_CAP} cap</span></div>
            <div className="bg-muted mt-2 h-1.5 overflow-hidden rounded-full"><div className="bg-foreground h-full rounded-full" style={{ width: `${(SPEND_TODAY / SPEND_CAP) * 100}%` }} /></div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="min-w-0 space-y-6">
            {/* V9.3 Run feed with filters */}
            <section className="relative rounded-lg border">
              <Num n="V9.3" className="absolute -top-2 right-2 z-10" />
              <div className="space-y-2 border-b p-3">
                <div className="flex flex-wrap gap-1" role="tablist" aria-label="Status">
                  {STATUS_TABS.map((t) => (
                    <button key={t.id} type="button" role="tab" aria-selected={statusF === t.id} onClick={() => setStatusF(t.id)}
                      className={cn("rounded-md px-2.5 py-1 text-sm", statusF === t.id ? "bg-secondary font-medium" : "text-muted-foreground hover:bg-accent")}>
                      {t.label}
                    </button>
                  ))}
                </div>
                <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
                  <div className="relative">
                    <SearchIcon className="text-muted-foreground absolute top-2.5 left-2.5 size-4" />
                    <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search runs" className="pl-8" aria-label="Search runs" />
                  </div>
                  <Select value={agentF} onValueChange={setAgentF}>
                    <SelectTrigger className="w-full sm:w-44" aria-label="Agent"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Every agent</SelectItem>
                      {AGENTS.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={fnF} onValueChange={(v) => setFnF(v as "all" | FunctionId)}>
                    <SelectTrigger className="w-full sm:w-44" aria-label="Function"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Every function</SelectItem>
                      {fnsInUse.map((f) => <SelectItem key={f.id} value={f.id}>{f.short}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {shown.length ? (
                <ul className="divide-y">
                  {shown.map((r, i) => (
                    <li key={r.id} className={cn(paused && r.status === "running" && "opacity-60")}>
                      <RunRow run={r} numbered={i === 0} />
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-6 text-center text-sm">
                  <p className="text-muted-foreground">No runs match these filters.</p>
                  <Button variant="ghost" size="sm" className="mt-2" onClick={() => { setAgentF("all"); setFnF("all"); setStatusF("all"); setQ(""); }}>Clear filters</Button>
                </div>
              )}
              {paused && shown.some((r) => r.status === "running") ? (
                <p className="text-muted-foreground border-t px-3 py-2 text-xs">Runs shown faded are paused mid-step.</p>
              ) : null}
            </section>

            {/* V9.4 Log tail */}
            <LogTail paused={paused} />
          </div>

          <div className="min-w-0 space-y-6">
            {/* V9.5 Held for you */}
            <section className="relative">
              <Num n="V9.5" className="absolute -top-2 right-0" />
              <h2 className="mb-2 text-sm font-medium">Held for you</h2>
              <div className="space-y-3">
                {held.map((r) => (
                  <HeldCard key={r.id} who={agentOf(r.agent).name} what={r.title} detail={r.changed.length ? `Changes ${r.changed.join(", ")}` : undefined}
                    onYes={() => setDecided((d) => ({ ...d, [r.id]: "yes" }))} onNo={() => setDecided((d) => ({ ...d, [r.id]: "no" }))} />
                ))}
              </div>
            </section>

            {/* V9.6 Spend by agent */}
            <section className="relative rounded-lg border p-3">
              <Num n="V9.6" className="absolute -top-2 right-2" />
              <h2 className="mb-3 text-sm font-medium">Spend by agent, recent runs</h2>
              <ul className="space-y-2">
                {spendBy.map(({ a, cost }) => (
                  <li key={a.id} className="space-y-1">
                    <div className="flex justify-between gap-2 text-xs"><span className="truncate">{a.name} <span className="text-muted-foreground">· {fnOf(a.fn).short}</span></span><span className="tabular-nums">${cost.toFixed(2)}</span></div>
                    <div className="bg-muted h-1.5 overflow-hidden rounded-full"><div className="bg-foreground/80 h-full rounded-full" style={{ width: `${(cost / maxSpend) * 100}%` }} /></div>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-lg border p-3">
      <div className="text-muted-foreground text-xs">{label}</div>
      <div className={cn("mt-0.5 text-xl font-semibold tabular-nums", tone)}>{value}</div>
    </div>
  );
}

function clock(d: Date) {
  return d.toTimeString().slice(0, 8);
}

/** V9.4 Log tail: lines stream in on a timer. Open on wide screens, behind a disclosure on a phone. */
function LogTail({ paused: allPaused }: { paused: boolean }) {
  const [open, setOpen] = useState(false);
  const [held, setHeld] = useState(false);
  const [lines, setLines] = useState<{ id: number; time: string; agent: string; level: keyof typeof LEVEL_TONE; text: string }[]>([]);
  const next = useRef(0);
  const box = useRef<HTMLDivElement>(null);
  const stopped = held || allPaused;

  useEffect(() => {
    try { if (window.matchMedia("(min-width: 1024px)").matches) setOpen(true); } catch {}
    const seed = Array.from({ length: 5 }, (_, i) => {
      const l = LOG_POOL[i]!;
      return { id: i, time: clock(new Date(Date.now() - (5 - i) * 4000)), ...l };
    });
    next.current = 5;
    setLines(seed);
  }, []);

  useEffect(() => {
    if (stopped) return;
    const t = setInterval(() => {
      const n = next.current++;
      const l = LOG_POOL[n % LOG_POOL.length]!;
      setLines((ls) => [...ls.slice(-39), { id: n, time: clock(new Date()), ...l }]);
    }, 1600);
    return () => clearInterval(t);
  }, [stopped]);

  useEffect(() => {
    const el = box.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines, open]);

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="relative rounded-lg border">
      <Num n="V9.4" className="absolute -top-2 right-2 z-10" />
      <div className="flex items-center justify-between gap-2 px-3 py-2">
        <CollapsibleTrigger asChild>
          <button type="button" className="flex items-center gap-1.5 text-sm font-medium">
            <ChevronDownIcon className={cn("size-4 transition-transform", !open && "-rotate-90")} />
            Log tail
            <span className="text-muted-foreground text-xs font-normal">{stopped ? "paused" : "streaming"}</span>
          </button>
        </CollapsibleTrigger>
        {open ? (
          <Button variant="ghost" size="xs" onClick={() => setHeld(!held)} disabled={allPaused}>
            {held ? <PlayIcon /> : <PauseIcon />}{held ? "Resume log" : "Pause log"}
          </Button>
        ) : null}
      </div>
      <CollapsibleContent>
        <div ref={box} className="bg-muted/40 h-56 overflow-y-auto border-t px-3 py-2 font-mono text-[11px] leading-5">
          {lines.map((l) => (
            <div key={l.id} className="break-words">
              <span className="text-muted-foreground">{l.time}</span>{" "}
              <span className="font-semibold">{agentOf(l.agent).name}</span>{" "}
              <span className={LEVEL_TONE[l.level]}>{l.text}</span>
            </div>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
