"use client";

// V6 Agents: the merged view. Pick an agent on the left (C17), talk to it in the middle (C5), and see what it is
// made of on the right (C23): model, status, skills and plugins. Modeled on OpenAI Platform's Assistants screen,
// which keeps the assistant's settings beside its thread. The canvas builder (V7) is one tap away.
import { use, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LibraryIcon, PauseIcon, PlayIcon, PlusIcon, SlidersHorizontalIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Num, StatusDot } from "@/components/studio/bits";
import { AGENTS, businessHref, ventureOf, type Agent } from "@/components/studio/data";
import { Conversation, LeadMark } from "@/components/studio/conversation";
import { LEADS, bossOf, leadOf, workersOf } from "@/components/studio/phase";
import { pluginsOf, skillsOf } from "@/components/studio/skills-data";
import { useTeamSlug } from "@/components/studio/team";

const MODEL: Record<string, string> = { "chief-of-staff": "Power", "strategy-lead": "Power", "product-lead": "Balanced", "growth-lead": "Balanced", "finance-lead": "Balanced" };

export default function AgentsPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ agent?: string }> }) {
  const team = useTeamSlug() ?? "";
  const { slug } = use(params);
  const { agent } = use(searchParams);
  const router = useRouter();
  const lead = leadOf(agent);
  const [about, setAbout] = useState(false);
  const pick = (id: string) => router.replace(businessHref(team, slug, `agents?agent=${id}`), { scroll: false });

  return (
    <div data-virtu-screen="V6" className="flex min-h-full">
      <aside className="relative hidden w-60 shrink-0 border-r lg:block">
        <div className="sticky top-0 max-h-[calc(100dvh-3rem)] overflow-y-auto p-3"><AgentList slug={slug} active={lead.id} onPick={pick} /></div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col px-4 md:px-8">
        <div className="bg-background sticky top-0 z-20 -mx-4 border-b px-4 py-3 md:-mx-8 md:px-8">
          <div className="flex items-center gap-2"><Num n="V6" /><span className="text-muted-foreground text-xs">Agents for {ventureOf(slug).name}</span></div>
          <div className="mt-2 flex items-center gap-3">
            <LeadMark lead={lead} size={36} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2"><h1 className="truncate text-lg font-semibold">{lead.name}</h1><StatusDot status={lead.status} /></div>
              <p className="text-muted-foreground truncate text-sm">{lead.covers}.</p>
            </div>
            <Button variant="outline" size="sm" className="xl:hidden" onClick={() => setAbout(true)}><SlidersHorizontalIcon />About</Button>
          </div>
          <div className="-mx-1 mt-3 flex gap-1 overflow-x-auto pb-1 lg:hidden">
            {talkable().map((a) => (
              <button key={a.id} type="button" ref={a.id === lead.id ? (el) => el?.scrollIntoView({ inline: "center", block: "nearest" }) : undefined} onClick={() => pick(a.id)} className={cn("flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-sm", a.id === lead.id ? "bg-accent font-medium" : "text-muted-foreground")}>
                <LeadMark lead={leadOf(a.id)} size={18} />{a.name}
              </button>
            ))}
          </div>
        </div>
        <Conversation key={lead.id} slug={slug} leadId={lead.id} />
      </div>

      <aside className="relative hidden w-80 shrink-0 border-l xl:block">
        <div className="sticky top-0 max-h-[calc(100dvh-3rem)] overflow-y-auto p-4"><AboutAgent slug={slug} id={lead.id} /></div>
      </aside>
      <Sheet open={about} onOpenChange={setAbout}>
        <SheetContent side="right" className="w-[22rem] overflow-y-auto p-4">
          <SheetTitle className="sr-only">About {lead.name}</SheetTitle>
          <AboutAgent slug={slug} id={lead.id} />
        </SheetContent>
      </Sheet>
    </div>
  );
}

/** Everyone you can talk to, in list order: chief of staff, then each lead followed by the agents under it. */
function talkable(): { id: string; name: string; depth: 0 | 1 }[] {
  const out: { id: string; name: string; depth: 0 | 1 }[] = [];
  for (const l of LEADS) {
    out.push({ id: l.id, name: l.name, depth: 0 });
    for (const w of workersOf(l)) out.push({ id: w.id, name: w.name, depth: 1 });
  }
  return out;
}

/** C17 Agent list. */
function AgentList({ slug, active, onPick }: { slug: string; active: string; onPick: (id: string) => void }) {
  const team = useTeamSlug() ?? "";
  return (
    <div className="space-y-4">
      <Num n="C17" className="absolute top-1 right-1" />
      <ul className="space-y-0.5">
        {talkable().map((a) => {
          const l = leadOf(a.id);
          const yours = AGENTS.find((x) => x.id === a.id)?.kind === "yours";
          return (
            <li key={a.id}>
              <button type="button" onClick={() => onPick(a.id)} aria-current={a.id === active ? "true" : undefined}
                className={cn("flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm", a.depth === 1 && "pl-7", a.id === active ? "bg-accent font-medium" : "text-muted-foreground hover:bg-accent/60 hover:text-foreground")}>
                <LeadMark lead={l} size={a.depth ? 18 : 22} />
                <span className="min-w-0 flex-1 truncate">{a.name}</span>
                {yours ? <span className="text-muted-foreground text-[10px]">yours</span> : null}
                <StatusDot status={l.status} label={false} />
              </button>
            </li>
          );
        })}
      </ul>
      <div className="space-y-0.5 border-t pt-3">
        <Link href={businessHref(team, slug, "agents/new")} className="text-muted-foreground hover:bg-accent/60 hover:text-foreground flex items-center gap-2 rounded-md px-2 py-1.5 text-sm"><PlusIcon className="size-4" />Build an agent</Link>
        <Link href="/studio/library" className="text-muted-foreground hover:bg-accent/60 hover:text-foreground flex items-center gap-2 rounded-md px-2 py-1.5 text-sm"><LibraryIcon className="size-4" />Add from the library</Link>
      </div>
    </div>
  );
}

/** C23 About panel: what the agent is made of, like the settings column beside an OpenAI Platform assistant. */
function AboutAgent({ slug, id }: { slug: string; id: string }) {
  const team = useTeamSlug() ?? "";
  const lead = leadOf(id);
  const a: Agent | undefined = AGENTS.find((x) => x.id === id);
  const boss = bossOf(id);
  const [paused, setPaused] = useState(lead.status === "paused");
  const [off, setOff] = useState<Record<string, boolean>>({});
  const skills = skillsOf(id);
  const plugins = pluginsOf(id);
  const flip = (k: string) => setOff((o) => ({ ...o, [k]: !o[k] }));
  return (
    <div className="relative space-y-5 text-sm">
      <Num n="C23" className="absolute -top-3 -left-2" />
      <section className="space-y-2">
        <Row label="Model">{a?.model ?? MODEL[id] ?? "Balanced"}</Row>
        <Row label="Status"><StatusDot status={paused ? "paused" : lead.status === "paused" ? "idle" : lead.status} /></Row>
        <Row label="Reports to">{boss ? boss.name : id === "chief-of-staff" ? "You" : "Chief of staff"}</Row>
        <Row label="Runs today">{a?.runsToday ?? 5}</Row>
        <div className="flex gap-2 pt-1">
          <Button variant="outline" size="sm" onClick={() => setPaused(!paused)}>{paused ? <><PlayIcon />Resume</> : <><PauseIcon />Pause</>}</Button>
          <Button variant="ghost" size="sm" asChild><Link href={businessHref(team, slug, `agents/${a?.id ?? "chief-of-staff"}`)}>Open in builder</Link></Button>
        </div>
      </section>

      <section className="relative">
        <Num n="V6.1" className="absolute -top-2 right-0" />
        <h2 className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Skills</h2>
        {skills.length ? (
          <ul className="mt-2 space-y-2">
            {skills.map((s) => (
              <li key={s.id} className="flex items-start gap-2">
                <div className="min-w-0 flex-1"><div className="font-medium">{s.name}</div><div className="text-muted-foreground text-xs">{s.source === "Naive" ? "Built into Naive" : s.source === "Library" ? "From the library" : "Written by you"}{s.held ? ` · ${s.held} waits for you` : ""}</div></div>
                <Switch checked={!off[s.id]} onCheckedChange={() => flip(s.id)} aria-label={`${s.name} on`} />
              </li>
            ))}
          </ul>
        ) : <p className="text-muted-foreground mt-2 text-xs">No skills yet.</p>}
      </section>

      <section className="relative">
        <Num n="V6.2" className="absolute -top-2 right-0" />
        <h2 className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Plugins</h2>
        {plugins.length ? (
          <ul className="mt-2 space-y-2.5">
            {plugins.map((p) => (
              <li key={p.id}>
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1"><div className="font-medium">{p.name}</div><div className="text-muted-foreground text-xs">{p.connected ? p.tools.map((t) => t.name).join(", ") : "Not connected"}</div></div>
                  <Switch checked={p.connected && !off[p.id]} disabled={!p.connected} onCheckedChange={() => flip(p.id)} aria-label={`${p.name} on`} />
                </div>
                {p.connected && p.tools.some((t) => t.ask) ? <p className="text-muted-foreground mt-0.5 text-xs">Asks you before {p.tools.filter((t) => t.ask).map((t) => t.does.toLowerCase()).join(" or ")}.</p> : null}
              </li>
            ))}
          </ul>
        ) : <p className="text-muted-foreground mt-2 text-xs">No plugins yet.</p>}
      </section>

      <Link href={businessHref(team, slug, "skills")} className="text-muted-foreground hover:text-foreground block text-xs underline-offset-4 hover:underline">Manage every skill and plugin</Link>
    </div>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return <div className="flex items-center justify-between gap-3"><span className="text-muted-foreground">{label}</span><span className="font-medium">{children}</span></div>;
}
