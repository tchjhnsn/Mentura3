"use client";

// V12 Function: one function's agent, tools, automations, records, recommended integrations and key measure.
import Link from "next/link";
import { use, useState } from "react";
import { ArrowLeftIcon, ArrowUpRightIcon, BotIcon, FileTextIcon, MessageSquareIcon, WrenchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Face, Num, StatusDot } from "@/components/studio/bits";
import { ScreenHead, useChat } from "@/components/studio/shell";
import { FunctionIntegrationsCard } from "@/components/studio/integrations-ui";
import { AGENTS, FUNCTIONS, fnOf, personOf, businessHref, ventureOf, type FunctionId } from "@/components/studio/data";
import { FN_DETAIL, FN_FOLDER, TOOL_ABOUT, TOOL_ROUTES } from "@/components/studio/connect-data";
import { useTeamSlug } from "@/components/studio/team";

export default function FunctionPage({ params }: { params: Promise<{ slug: string; fn: string }> }) {
  const team = useTeamSlug() ?? "";
  const { slug, fn: raw } = use(params);
  const id: FunctionId = FUNCTIONS.some((f) => f.id === raw) ? (raw as FunctionId) : "marketing-and-sales";
  const f = fnOf(id);
  const d = FN_DETAIL[id];
  const v = ventureOf(slug);
  const agent = AGENTS.find((a) => a.fn === id);
  const chat = useChat();
  const [autos, setAutos] = useState(d.automations.map((a) => a.on));
  const [tool, setTool] = useState<string | null>(null);
  const [asked, setAsked] = useState<string[]>([]);
  const [askedNote, setAskedNote] = useState<string | null>(null);
  const agentName = agent?.name ?? "Chief of staff";

  return (
    <div className="pb-16">
      <div className="px-4 pt-4 md:px-8">
        <Link href={businessHref(team, slug, "functions")} className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs"><ArrowLeftIcon className="size-3" />All functions</Link>
      </div>
      <ScreenHead n="V12" title={f.label} job={`${f.label} for ${v.name}: its agent, tools, automations and records.`}>
        <Button onClick={() => { chat.setOpen(true); setAskedNote(`${agentName} is open in the chat, ready for a ${f.short.toLowerCase()} task.`); }}><MessageSquareIcon />Ask {agentName.toLowerCase()}</Button>
      </ScreenHead>

      <div className="grid gap-6 px-4 md:px-8 lg:grid-cols-[2fr_1fr]">
        <div className="min-w-0 space-y-6">
          {askedNote ? <p className="rounded-lg border p-3 text-sm">{askedNote}</p> : null}

          <section className="relative">
            <Num n="V12.2" className="absolute -top-2 right-0" />
            <h2 className="mb-2 text-sm font-semibold">Tools</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {f.tools.map((t) => {
                const route = TOOL_ROUTES[t];
                const body = (
                  <>
                    <span className="bg-muted grid size-9 shrink-0 place-items-center rounded-lg"><WrenchIcon className="size-4" /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium">{t}</span>
                      <span className="text-muted-foreground block text-xs">{route ? "Open it" : asked.includes(t) ? "Agent is setting it up" : "Not set up yet"}</span>
                    </span>
                    {route ? <ArrowUpRightIcon className="text-muted-foreground size-4" /> : null}
                  </>
                );
                return route ? (
                  <Link key={t} href={businessHref(team, slug, route)} className="hover:bg-accent/40 flex items-center gap-3 rounded-lg border p-3">{body}</Link>
                ) : (
                  <button key={t} type="button" onClick={() => setTool(t)} className="hover:bg-accent/40 flex items-center gap-3 rounded-lg border border-dashed p-3 text-left">{body}</button>
                );
              })}
            </div>
          </section>

          <section className="relative">
            <Num n="V12.3" className="absolute -top-2 right-0" />
            <h2 className="mb-2 text-sm font-semibold">Automations</h2>
            <ul className="divide-y rounded-lg border">
              {d.automations.map((a, i) => (
                <li key={a.name} className="flex items-center gap-3 p-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm">{a.name}</div>
                    <div className="text-muted-foreground mt-0.5 flex flex-wrap items-center gap-x-2 text-xs">
                      <span>When: {a.trigger}</span>
                      <span className="inline-flex items-center gap-1">Approves: <Face id={a.approves} size={16} showName={false} /><span>{personOf(a.approves).name.split(" ")[0]}</span></span>
                      <span>{autos[i] ? "On" : "Off"}</span>
                    </div>
                  </div>
                  <Switch checked={autos[i]} onCheckedChange={(on) => setAutos((s) => s.map((x, k) => (k === i ? on : x)))} aria-label={a.name} />
                </li>
              ))}
            </ul>
            <Link href={businessHref(team, slug, "automations")} className="text-muted-foreground hover:text-foreground mt-2 inline-block text-xs underline">See every automation</Link>
          </section>

          <section className="relative">
            <Num n="V12.4" className="absolute -top-2 right-0" />
            <h2 className="mb-2 text-sm font-semibold">Records <span className="text-muted-foreground font-normal">in {FN_FOLDER[id]}/</span></h2>
            <ul className="divide-y rounded-lg border">
              {d.records.map((r) => (
                <li key={r}>
                  <Link href={businessHref(team, slug, `files/${FN_FOLDER[id]}/${r}`)} className="hover:bg-accent/40 flex items-center gap-2 p-3 text-sm">
                    <FileTextIcon className="text-muted-foreground size-4 shrink-0" /><span className="min-w-0 truncate">{r}</span>
                  </Link>
                </li>
              ))}
            </ul>
            <Link href={businessHref(team, slug, "files")} className="text-muted-foreground hover:text-foreground mt-2 inline-block text-xs underline">Open Files</Link>
          </section>

          <div className="relative">
            <Num n="V12.5" className="absolute -top-2 right-0" />
            <FunctionIntegrationsCard team={team} slug={slug} fn={id} />
          </div>
        </div>

        <div className="space-y-6">
          <section className="relative rounded-lg border p-4">
            <Num n="V12.1" className="absolute -top-2 right-2" />
            <div className="text-muted-foreground mb-2 text-xs">Agent</div>
            {agent ? (
              <>
                <div className="flex items-center gap-2"><BotIcon className="size-4" /><span className="text-sm font-semibold">{agent.name}</span><StatusDot status={agent.status} /></div>
                <p className="text-muted-foreground mt-2 text-sm">{agent.job}</p>
                <div className="text-muted-foreground mt-2 text-xs">{agent.model} model · {agent.runsToday} runs today</div>
                <Button variant="outline" size="sm" className="mt-3" asChild><Link href={businessHref(team, slug, `agents/${agent.id}`)}>Open in agent builder</Link></Button>
              </>
            ) : (
              <>
                <p className="text-sm">No agent yet. The chief of staff covers {f.short.toLowerCase()} work until you build one.</p>
                <Button variant="outline" size="sm" className="mt-3" asChild><Link href={businessHref(team, slug, "agents/new")}>Build an agent for it</Link></Button>
              </>
            )}
          </section>

          <section className="relative rounded-lg border p-4">
            <Num n="V12.6" className="absolute -top-2 right-2" />
            <div className="text-muted-foreground text-xs">Key measure</div>
            <div className="mt-1 text-sm font-medium">{d.measure.name}</div>
            <div className="mt-2 text-2xl font-semibold tracking-tight">{d.measure.now}</div>
            <div className="text-muted-foreground text-xs">Target: {d.measure.target}</div>
            <div className="text-muted-foreground mt-3 text-xs">{d.automated} of {d.tasks} tasks automated</div>
          </section>
        </div>
      </div>

      <Sheet open={tool !== null} onOpenChange={(o) => { if (!o) setTool(null); }}>
        <SheetContent>
          {tool ? (
            <>
              <SheetHeader>
                <SheetTitle>{tool}</SheetTitle>
                <SheetDescription>{TOOL_ABOUT[tool] ?? `A ${f.short.toLowerCase()} tool. ${agentName} can set it up from the business's records.`}</SheetDescription>
              </SheetHeader>
              <div className="space-y-2 px-4 text-sm">
                <p>It is not set up for {v.name} yet.</p>
                {asked.includes(tool) ? <p className="font-medium">Asked. {agentName} added it to today&apos;s plan and will hold the first version for your yes.</p> : null}
              </div>
              <SheetFooter>
                <Button disabled={asked.includes(tool)} onClick={() => setAsked((a) => [...a, tool])}>{asked.includes(tool) ? "Asked" : "Ask the agent to set it up"}</Button>
              </SheetFooter>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}
