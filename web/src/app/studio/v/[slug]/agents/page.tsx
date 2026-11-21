"use client";

// V6 Agents: the prebuilt function agents, the ones you built, and community agents from the Library.
import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PauseIcon, PlayIcon, PlusIcon, UsersIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScreenHead } from "@/components/studio/shell";
import { Num, StatusDot } from "@/components/studio/bits";
import { AGENTS, FUNCTIONS, SCREENS, fnOf, ventureHref, ventureOf, type Agent } from "@/components/studio/data";
import { COMMUNITY_AGENTS, hireable } from "@/components/studio/automation-data";

const screen = SCREENS.find((s) => s.id === "V6")!;

export default function AgentsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const venture = ventureOf(slug);
  const router = useRouter();
  const [agents, setAgents] = useState<Agent[]>(AGENTS);
  const [before, setBefore] = useState<Record<string, Agent["status"]>>({});
  const [note, setNote] = useState("");

  const team = agents.filter((a) => a.kind === "prebuilt");
  const yours = agents.filter((a) => a.kind === "yours");
  const covered = new Set(team.map((a) => a.fn));
  const missing = FUNCTIONS.filter((f) => !covered.has(f.id));

  const toggle = (a: Agent) => {
    const pausing = a.status !== "paused";
    if (pausing) setBefore((b) => ({ ...b, [a.id]: a.status }));
    const next: Agent["status"] = pausing ? "paused" : before[a.id] === "idle" ? "idle" : "running";
    setAgents((all) => all.map((x) => (x.id === a.id ? { ...x, status: next } : x)));
    setNote(pausing ? `${a.name} is paused. It finishes nothing new until you resume it.` : `${a.name} is back at work.`);
  };
  const hire = (fnId: Agent["fn"]) => {
    const f = fnOf(fnId);
    const a = hireable(f.id, f.short === "IT" ? "IT" : f.label.split(" (")[0]!);
    setAgents((all) => [...all, a]);
    setNote(`${a.name} joined the team. It starts on ${venture.name} today.`);
  };
  const open = (id: string) => router.push(ventureHref(slug, `agents/${id}`));

  return (
    <div className="pb-12">
      <ScreenHead n="V6" title={screen.title} job={screen.job}>
        <span className="relative">
          <Num n="V6.7" className="absolute -top-2 -right-2 z-10" />
          <Button asChild><Link href={ventureHref(slug, "agents/new")}><PlusIcon />Build an agent</Link></Button>
        </span>
      </ScreenHead>

      <div className="space-y-10 px-4 md:px-8">
        {note ? <p role="status" className="bg-muted rounded-md px-3 py-2 text-sm">{note}</p> : null}

        <section className="relative">
          <Num n="V6.1" className="absolute -top-2 right-0" />
          <h2 className="text-base font-semibold">Your team</h2>
          <p className="text-muted-foreground mt-0.5 text-sm">One agent per function plus a chief of staff, ready on day one. Each holds important drafts for your yes.</p>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-3">
            {team.map((a, i) => <AgentCard key={a.id} a={a} first={i === 0} onOpen={() => open(a.id)} onToggle={() => toggle(a)} />)}
            {missing.map((f, i) => (
              <button key={f.id} type="button" onClick={() => hire(f.id)}
                className="hover:bg-accent/50 text-muted-foreground relative flex min-h-28 flex-col items-start justify-center gap-1 rounded-xl border border-dashed p-4 text-left">
                {i === 0 ? <Num n="V6.4" className="absolute -top-2 right-2" /> : null}
                <span className="text-foreground flex items-center gap-1.5 text-sm font-medium"><UsersIcon className="size-4" />Hire an agent</span>
                <span className="text-xs">{f.label} has no agent yet. Hire the prebuilt one to take its routine work.</span>
              </button>
            ))}
          </div>
        </section>

        <section className="relative">
          <Num n="V6.5" className="absolute -top-2 right-0" />
          <h2 className="text-base font-semibold">Built by you</h2>
          <p className="text-muted-foreground mt-0.5 text-sm">Agents you made on the canvas, from a prebuilt one or from blank.</p>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-3">
            {yours.map((a) => <AgentCard key={a.id} a={a} onOpen={() => open(a.id)} onToggle={() => toggle(a)} />)}
            <Link href={ventureHref(slug, "agents/new")} className="hover:bg-accent/50 text-muted-foreground flex min-h-28 flex-col items-start justify-center gap-1 rounded-xl border border-dashed p-4 text-sm">
              <span className="text-foreground flex items-center gap-1.5 font-medium"><PlusIcon className="size-4" />Start a new one</span>
              <span className="text-xs">Begin blank or copy a prebuilt agent and change its steps.</span>
            </Link>
          </div>
        </section>

        <section className="relative">
          <Num n="V6.6" className="absolute -top-2 right-0" />
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold">Add from the library</h2>
              <p className="text-muted-foreground mt-0.5 text-sm">Agents other founders built and shared.</p>
            </div>
            <Button variant="ghost" size="sm" asChild><Link href="/studio/library">Browse the library</Link></Button>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-3">
            {COMMUNITY_AGENTS.map((c) => (
              <Link key={c.id} href="/studio/library" className="hover:bg-accent/50 rounded-xl border p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium">{c.name}</span>
                  <Badge variant="outline">{fnOf(c.fn).short}</Badge>
                </div>
                <p className="text-muted-foreground mt-1 text-xs">{c.job}</p>
                <p className="text-muted-foreground mt-3 text-xs">By {c.author} · {c.installs.toLocaleString("en-US")} ventures use it</p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

/** One agent: a click opens it in the builder (V7); the toggle pauses or resumes it. */
function AgentCard({ a, first, onOpen, onToggle }: { a: Agent; first?: boolean; onOpen: () => void; onToggle: () => void }) {
  const paused = a.status === "paused";
  return (
    <div role="link" tabIndex={0} onClick={onOpen} onKeyDown={(e) => { if (e.key === "Enter") onOpen(); }}
      className="bg-card hover:border-foreground/30 relative flex cursor-pointer flex-col rounded-xl border p-4 transition-colors">
      {first ? <Num n="V6.2" className="absolute -top-2 left-3" /> : null}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">{a.name}</div>
          <div className="text-muted-foreground text-xs">{fnOf(a.fn).label}</div>
        </div>
        <span className="relative">
          {first ? <Num n="V6.3" className="absolute -top-3 -right-1 z-10" /> : null}
          <Button variant="outline" size="xs" onClick={(e) => { e.stopPropagation(); onToggle(); }} aria-pressed={paused}>
            {paused ? <><PlayIcon />Resume</> : <><PauseIcon />Pause</>}
          </Button>
        </span>
      </div>
      <p className="text-muted-foreground mt-2 line-clamp-2 text-sm">{a.job}</p>
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
        <StatusDot status={a.status} />
        <span className="text-muted-foreground">{a.model} model</span>
        <span className="text-muted-foreground">{a.runsToday} runs today</span>
      </div>
      {a.tools.length ? (
        <div className="mt-3 flex flex-wrap gap-1">
          {a.tools.map((t) => <Badge key={t} variant="secondary" className="font-normal">{t}</Badge>)}
        </div>
      ) : <p className="text-muted-foreground mt-3 text-xs">No tools yet. Open it to add some.</p>}
    </div>
  );
}
