"use client";

// V17 Skills and plugins: what the venture's agents know how to do, and which outside tools they may call.
// Modeled on OpenAI Platform: tools listed with on/off switches beside the agent, and a configure dialog per tool.
// A skill is instructions plus the records it reads and writes; a plugin is a connector or MCP server with tools.
import { use, useState, type ReactNode } from "react";
import Link from "next/link";
import { PlugIcon, PlusIcon, PuzzleIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { ScreenHead } from "@/components/studio/shell";
import { Num } from "@/components/studio/bits";
import { SCREENS, ventureHref } from "@/components/studio/data";
import { LeadMark } from "@/components/studio/conversation";
import { leadOf } from "@/components/studio/phase";
import { PLUGINS, SKILLS, type Plugin, type Skill, type SkillSource } from "@/components/studio/skills-data";

const screen = SCREENS.find((s) => s.id === "V17")!;
const SOURCES: ("All" | SkillSource)[] = ["All", "Naive", "Library", "Yours"];
const SOURCE_LABEL: Record<SkillSource, string> = { Naive: "Built into Naive", Library: "From the library", Yours: "Written by you" };

export default function SkillsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [skills, setSkills] = useState<Skill[]>(SKILLS);
  const [plugins, setPlugins] = useState<Plugin[]>(PLUGINS);
  const [source, setSource] = useState<(typeof SOURCES)[number]>("All");
  const [openSkill, setOpenSkill] = useState<Skill | null>(null);
  const [openPlugin, setOpenPlugin] = useState<Plugin | null>(null);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [job, setJob] = useState("");

  const shown = skills.filter((s) => source === "All" || s.source === source);
  const add = () => {
    if (!name.trim()) return;
    setSkills((all) => [...all, { id: `mine-${all.length}`, name: name.trim(), job: job.trim() || "No description yet.", source: "Yours", fn: "capabilities", reads: [], writes: [], steps: [], agents: [], on: false }]);
    setName(""); setJob(""); setAdding(false); setSource("Yours");
  };

  return (
    <div className="pb-12">
      <ScreenHead n="V17" title={screen.title} job={screen.job}>
        <span className="relative">
          <Num n="V17.5" className="absolute -top-2 -right-2 z-10" />
          <Button onClick={() => setAdding(true)}><PlusIcon />Add a skill</Button>
        </span>
      </ScreenHead>

      <div className="px-4 md:px-8">
        <Tabs defaultValue="skills">
          <TabsList><TabsTrigger value="skills"><PuzzleIcon />Skills <span className="text-muted-foreground">{skills.length}</span></TabsTrigger><TabsTrigger value="plugins"><PlugIcon />Plugins <span className="text-muted-foreground">{plugins.length}</span></TabsTrigger></TabsList>

          <TabsContent value="skills" className="relative mt-4">
            <Num n="V17.1" className="absolute -top-2 right-0" />
            <div className="mb-3 flex flex-wrap gap-1">
              {SOURCES.map((s) => <button key={s} type="button" onClick={() => setSource(s)} className={cn("rounded-md px-2.5 py-1 text-sm", source === s ? "bg-accent font-medium" : "text-muted-foreground hover:bg-accent/60")}>{s === "All" ? "All" : SOURCE_LABEL[s]}</button>)}
            </div>
            <ul className="divide-y rounded-lg border">
              {shown.map((s, i) => (
                <li key={s.id} className="relative flex items-center gap-3 px-3 py-3 md:px-4">
                  {i === 0 ? <Num n="C24" className="absolute -top-2 left-3" /> : null}
                  <button type="button" onClick={() => setOpenSkill(s)} className="min-w-0 flex-1 text-left">
                    <div className="flex flex-wrap items-baseline gap-x-2"><span className="text-sm font-medium hover:underline">{s.name}</span><span className="text-muted-foreground text-xs">{SOURCE_LABEL[s.source]}</span></div>
                    <p className="text-muted-foreground mt-0.5 line-clamp-2 text-sm">{s.job}</p>
                  </button>
                  <Agents ids={s.agents} />
                  <Switch checked={s.on} onCheckedChange={(v) => setSkills((all) => all.map((x) => (x.id === s.id ? { ...x, on: v } : x)))} aria-label={`${s.name} on`} />
                </li>
              ))}
            </ul>
          </TabsContent>

          <TabsContent value="plugins" className="relative mt-4">
            <Num n="V17.2" className="absolute -top-2 right-0" />
            <ul className="divide-y rounded-lg border">
              {plugins.map((p) => (
                <li key={p.id} className="flex items-center gap-3 px-3 py-3 md:px-4">
                  <button type="button" onClick={() => setOpenPlugin(p)} className="min-w-0 flex-1 text-left">
                    <div className="flex flex-wrap items-baseline gap-x-2"><span className="text-sm font-medium hover:underline">{p.name}</span><span className="text-muted-foreground text-xs">{p.kind} · {p.tools.length} tools</span></div>
                    <p className="text-muted-foreground mt-0.5 text-sm">{p.job}</p>
                  </button>
                  <Agents ids={p.agents} />
                  {p.connected ? (
                    <Switch checked={p.on} onCheckedChange={(v) => setPlugins((all) => all.map((x) => (x.id === p.id ? { ...x, on: v } : x)))} aria-label={`${p.name} on`} />
                  ) : <Button variant="outline" size="sm" asChild><Link href={ventureHref(slug, "integrations")}>Connect</Link></Button>}
                </li>
              ))}
            </ul>
            <p className="text-muted-foreground mt-3 text-xs">A tool that sends, pays or signs always asks you first. That cannot be turned off here.</p>
          </TabsContent>
        </Tabs>
      </div>

      <Sheet open={!!openSkill} onOpenChange={(o) => !o && setOpenSkill(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto p-5 sm:max-w-md">
          {openSkill ? (
            <div className="relative space-y-5 text-sm">
              <Num n="V17.3" className="absolute -top-1 right-8" />
              <div><SheetTitle className="text-lg">{openSkill.name}</SheetTitle><SheetDescription>{openSkill.job}</SheetDescription><p className="text-muted-foreground mt-1 text-xs">{SOURCE_LABEL[openSkill.source]}</p></div>
              <Block title="Steps">{openSkill.steps.length ? <ol className="list-decimal space-y-1 pl-5">{openSkill.steps.map((s) => <li key={s}>{s}</li>)}</ol> : <p className="text-muted-foreground">No steps written yet.</p>}</Block>
              <Block title="Reads">{openSkill.reads.length ? openSkill.reads.map((r) => <p key={r} className="font-mono text-xs">{r}</p>) : <p className="text-muted-foreground">Nothing.</p>}</Block>
              <Block title="Writes">{openSkill.writes.length ? openSkill.writes.map((r) => <p key={r} className="font-mono text-xs">{r}</p>) : <p className="text-muted-foreground">Nothing. It only changes drafts.</p>}</Block>
              {openSkill.held ? <Block title="Waits for you"><p>{openSkill.held} is held for your yes.</p></Block> : null}
              <Block title="Agents that use it"><AgentNames ids={openSkill.agents} slug={slug} /></Block>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>

      <Sheet open={!!openPlugin} onOpenChange={(o) => !o && setOpenPlugin(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto p-5 sm:max-w-md">
          {openPlugin ? (
            <div className="relative space-y-5 text-sm">
              <Num n="V17.4" className="absolute -top-1 right-8" />
              <div><SheetTitle className="text-lg">{openPlugin.name}</SheetTitle><SheetDescription>{openPlugin.job}</SheetDescription><p className="text-muted-foreground mt-1 text-xs">{openPlugin.kind}{openPlugin.account ? ` · ${openPlugin.account}` : " · not connected"}</p></div>
              <Block title="Tools">
                <ul className="divide-y rounded-md border">
                  {openPlugin.tools.map((t) => (
                    <li key={t.name} className="flex items-center justify-between gap-3 px-3 py-2">
                      <div><div className="font-mono text-xs">{t.name}</div><div className="text-muted-foreground text-xs">{t.does}</div></div>
                      <span className={cn("text-xs", t.ask ? "font-medium text-fuchsia-600" : "text-muted-foreground")}>{t.ask ? "Asks you first" : "Allowed"}</span>
                    </li>
                  ))}
                </ul>
              </Block>
              <Block title="Agents allowed to use it"><AgentNames ids={openPlugin.agents} slug={slug} /></Block>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>

      <Dialog open={adding} onOpenChange={setAdding}>
        <DialogContent>
          <DialogTitle>Add a skill</DialogTitle>
          <DialogDescription>Write what the agent should know how to do. You can give it steps and records after.</DialogDescription>
          <div className="space-y-3">
            <Input placeholder="Name, for example Write a weekly update" value={name} onChange={(e) => setName(e.target.value)} />
            <Textarea placeholder="What it does, in one or two sentences" value={job} onChange={(e) => setJob(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="ghost" asChild><Link href="/studio/library">Find one in the library</Link></Button>
            <Button onClick={add} disabled={!name.trim()}>Add skill</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Agents({ ids }: { ids: string[] }) {
  return (
    <span className="hidden shrink-0 items-center -space-x-1 sm:flex" title={ids.map((i) => leadOf(i).name).join(", ")}>
      {ids.slice(0, 4).map((i) => <span key={i} className="ring-background rounded-lg ring-2"><LeadMark lead={leadOf(i)} size={22} /></span>)}
      {ids.length > 4 ? <span className="text-muted-foreground pl-2 text-xs">+{ids.length - 4}</span> : null}
    </span>
  );
}

function AgentNames({ ids, slug }: { ids: string[]; slug: string }) {
  if (!ids.length) return <p className="text-muted-foreground">No agent uses it yet.</p>;
  return (
    <ul className="space-y-1.5">
      {ids.map((i) => <li key={i}><Link href={ventureHref(slug, `agents?agent=${i}`)} className="flex items-center gap-2 hover:underline"><LeadMark lead={leadOf(i)} size={22} />{leadOf(i).name}</Link></li>)}
    </ul>
  );
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return <section className="space-y-1.5"><h3 className="text-muted-foreground text-xs font-medium uppercase tracking-wide">{title}</h3>{children}</section>;
}
