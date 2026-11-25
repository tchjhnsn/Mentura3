"use client";

// V8 Automations: every function's automations with trigger, steps, agent and who approves, plus how much
// of each function's routine work is automated.
import { use, useState, type ReactNode } from "react";
import { ArrowDownIcon, PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ScreenHead } from "@/components/studio/shell";
import { Face, Num } from "@/components/studio/bits";
import { PromptBox } from "@/components/studio/prompt-box";
import { RunRow } from "@/components/studio/run-row";
import { AGENTS, FUNCTIONS, SCREENS, agentOf, fnOf, ventureOf, type FunctionId } from "@/components/studio/data";
import { AUTOMATIONS, COVERAGE, runsFor, type Automation, type TriggerKind } from "@/components/studio/automation-data";

const screen = SCREENS.find((s) => s.id === "V8")!;
type Status = "all" | "on" | "off" | "held";
const STATUS: { id: Status; label: string }[] = [{ id: "all", label: "All" }, { id: "on", label: "On" }, { id: "off", label: "Off" }, { id: "held", label: "Waiting on you" }];

/** A mock of what the agent would set up from a description in words. */
function draftFrom(text: string, venture: string): Automation {
  const t = text.toLowerCase();
  const trigger: TriggerKind = /email|mail|inbox/.test(t) ? "Email arrives" : /every|week|daily|monday|month|morning|friday/.test(t) ? "Schedule" : /form|webhook|stripe|payment|signup/.test(t) ? "Webhook" : "New record";
  const fn: FunctionId = /invoice|spend|budget|runway|receipt/.test(t) ? "finance" : /contract|terms|legal/.test(t) ? "risk-and-compliance"
    : /coach|outreach|lead|demo|deck/.test(t) ? "marketing-and-sales" : /bug|interview|card|roadmap/.test(t) ? "products"
    : /support|question|help|complaint/.test(t) ? "customer-service" : /hire|candidate|role/.test(t) ? "human-capital"
    : /investor|funder|partner|press/.test(t) ? "external-relationships" : "strategy";
  const when = { "Email arrives": "A matching email arrives", Schedule: "Mondays at 9:00", Webhook: "The form or service calls in", "New record": "A new record is written" }[trigger];
  const agent = AGENTS.find((a) => a.fn === fn && a.kind === "prebuilt")?.id ?? "chief-of-staff";
  const sends = /send|reply|email|post|pay/.test(t);
  return {
    id: `new-${Date.now()}`, name: text.length > 48 ? `${text.slice(0, 46).trimEnd()}...` : text, fn, trigger, when,
    steps: ["Read what came in", `Draft the work for ${ventureOf(venture).name}`, ...(sends ? ["Hold the send for a yes"] : []), `Write the result to ${fnOf(fn).short.toLowerCase()} records`],
    agent, approver: sends ? "torian" : null, lastRun: "Never", on: true,
  };
}

export default function AutomationsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [items, setItems] = useState<Automation[]>(AUTOMATIONS);
  const [fnFilter, setFnFilter] = useState<FunctionId | "all">("all");
  const [status, setStatus] = useState<Status>("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<Automation | null>(null);
  const [note, setNote] = useState("");

  const setOn = (id: string, on: boolean) => {
    setItems((all) => all.map((a) => (a.id === id ? { ...a, on } : a)));
    const a = items.find((x) => x.id === id);
    if (a) setNote(on ? `${a.name} is on. It runs ${a.when.charAt(0).toLowerCase()}${a.when.slice(1)}.` : `${a.name} is off. Nothing runs until you turn it back on.`);
  };
  const shown = items.filter((a) => (fnFilter === "all" || a.fn === fnFilter) && (status === "all" || (status === "on" && a.on) || (status === "off" && !a.on) || (status === "held" && a.held)));
  const groups = FUNCTIONS.map((f) => ({ f, list: shown.filter((a) => a.fn === f.id) })).filter((g) => g.list.length);
  const current = items.find((a) => a.id === openId) ?? null;

  return (
    <div className="pb-12">
      <ScreenHead n="V8" title={screen.title} job={screen.job}>
        <span className="relative">
          <Num n="V8.7" className="absolute -top-2 -right-2 z-10" />
          <Button onClick={() => { setDraft(null); setCreating(true); }}><PlusIcon />New automation</Button>
        </span>
      </ScreenHead>

      <div className="space-y-8 px-4 md:px-8">
        {note ? <p role="status" className="bg-muted rounded-md px-3 py-2 text-sm">{note}</p> : null}

        <section className="relative">
          <Num n="V8.1" className="absolute -top-2 right-0" />
          <h2 className="text-sm font-semibold">How much of each function runs on its own</h2>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-7">
            {FUNCTIONS.map((f) => {
              const done = Math.min(COVERAGE[f.id], items.filter((a) => a.fn === f.id).length);
              const pct = Math.round((done / COVERAGE[f.id]) * 100);
              return (
                <button key={f.id} type="button" onClick={() => setFnFilter(fnFilter === f.id ? "all" : f.id)} aria-pressed={fnFilter === f.id}
                  className={cn("hover:bg-accent/50 rounded-lg border p-2.5 text-left", fnFilter === f.id && "border-foreground")}>
                  <div className="truncate text-xs font-medium">{f.short}</div>
                  <div className="text-muted-foreground text-[11px]">{done} of {COVERAGE[f.id]} tasks</div>
                  <div className="bg-muted mt-1.5 h-1 overflow-hidden rounded-full"><div className="bg-foreground h-full rounded-full" style={{ width: `${pct}%` }} /></div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="relative flex flex-wrap items-center gap-2">
          <Num n="V8.2" className="absolute -top-3 right-0" />
          <Select value={fnFilter} onValueChange={(v) => setFnFilter(v as FunctionId | "all")}>
            <SelectTrigger size="sm" className="w-full sm:w-56" aria-label="Filter by function"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Every function</SelectItem>
              {FUNCTIONS.map((f) => <SelectItem key={f.id} value={f.id}>{f.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="flex flex-wrap gap-1" role="group" aria-label="Filter by status">
            {STATUS.map((s) => (
              <Button key={s.id} size="sm" variant={status === s.id ? "secondary" : "ghost"} aria-pressed={status === s.id} onClick={() => setStatus(s.id)}>{s.label}</Button>
            ))}
          </div>
          <span className="text-muted-foreground text-xs">{shown.length} of {items.length} automations</span>
        </section>

        {groups.length === 0 ? (
          <div className="text-muted-foreground rounded-xl border border-dashed p-6 text-sm">
            Nothing matches. {fnFilter !== "all" ? `${fnOf(fnFilter).label} has no automation like that yet. Describe one with New automation.` : "Try another status."}
          </div>
        ) : groups.map((g, gi) => (
          <section key={g.f.id} className="relative">
            {gi === 0 ? <Num n="V8.3" className="absolute -top-2 right-0" /> : null}
            <h2 className="mb-2 text-sm font-semibold">{g.f.label}</h2>
            <ul className="divide-y rounded-xl border">
              {g.list.map((a, i) => (
                <li key={a.id} className="relative">
                  {gi === 0 && i === 0 ? <Num n="V8.4" className="absolute -top-2 left-2 z-10" /> : null}
                  <div role="button" tabIndex={0} onClick={() => setOpenId(a.id)} onKeyDown={(e) => { if (e.key === "Enter") setOpenId(a.id); }}
                    className="hover:bg-accent/40 grid cursor-pointer grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 p-3 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)_5rem_auto]">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium">{a.name}</span>
                        {a.held ? <span className="shrink-0 text-xs font-medium text-fuchsia-600">Waiting on you</span> : null}
                      </div>
                      <div className="text-muted-foreground truncate text-xs">{a.steps.join(", then ")}</div>
                    </div>
                    <span className="relative row-span-1 justify-self-end lg:order-last" onClick={(e) => e.stopPropagation()}>
                      {gi === 0 && i === 0 ? <Num n="V8.5" className="absolute -top-3 -right-1 z-10" /> : null}
                      <Switch checked={a.on} onCheckedChange={(v) => setOn(a.id, v)} aria-label={`${a.name} on or off`} />
                    </span>
                    <div className="col-span-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs lg:contents">
                      <span className="min-w-0"><span className="block font-medium">{a.trigger}</span><span className="text-muted-foreground block truncate">{a.when}</span></span>
                      <span className="text-muted-foreground min-w-0 truncate">{agentOf(a.agent).name}</span>
                      <span className="min-w-0">{a.approver ? <Face id={a.approver} size={20} sub="approves" /> : <span className="text-muted-foreground">No approval</span>}</span>
                      <span className="text-muted-foreground">{a.lastRun}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <Sheet open={current !== null} onOpenChange={(o) => { if (!o) setOpenId(null); }}>
        <SheetContent className="w-full overflow-y-auto p-4 sm:max-w-md">
          <Num n="V8.6" className="absolute top-2 left-2" />
          {current ? (
            <>
              <SheetHeader className="p-0">
                <SheetTitle>{current.name}</SheetTitle>
                <SheetDescription>{fnOf(current.fn).label}. Run by {agentOf(current.agent).name}.</SheetDescription>
              </SheetHeader>
              <label className="flex items-center justify-between rounded-lg border p-3 text-sm">
                {current.on ? "On, runs when triggered" : "Off, nothing runs"}
                <Switch checked={current.on} onCheckedChange={(v) => setOn(current.id, v)} />
              </label>
              <ol className="space-y-0">
                <FlowStep label="Trigger" title={current.trigger} body={current.when} />
                {current.steps.map((s, i) => <FlowStep key={s} label={`Step ${i + 1}`} title={s} />)}
                <FlowStep last label="Approval" title={current.approver ? "A person says yes first" : "Runs on its own"}
                  body={current.approver ? undefined : "Nothing in it leaves the business or spends money."}>
                  {current.approver ? <div className="mt-1.5"><Face id={current.approver} size={24} /></div> : null}
                </FlowStep>
              </ol>
              <div>
                <h3 className="mb-1 text-sm font-semibold">Recent runs</h3>
                <div className="divide-y rounded-lg border">{runsFor(current, slug).map((r, i) => <RunRow key={r.id} run={r} numbered={i === 0} />)}</div>
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New automation</DialogTitle>
            <DialogDescription>Say what should happen and when. The agent sets up the trigger and steps for you to check.</DialogDescription>
          </DialogHeader>
          {!draft ? (
            <PromptBox autoFocus placeholder="When a coach replies to outreach, book a call and add them to the pipeline"
              suggestions={["Every Friday, send me a spend summary", "When a support email arrives, draft a reply", "When a funder replies, add them to investors"]}
              onSubmit={(t) => setDraft(draftFrom(t, slug))} />
          ) : (
            <div className="relative space-y-3">
              <Num n="V8.8" className="absolute -top-2 right-0" />
              <div className="text-sm font-medium">{draft.name}</div>
              <div className="text-muted-foreground text-xs">{fnOf(draft.fn).label}. Run by {agentOf(draft.agent).name}.</div>
              <ol className="space-y-0">
                <FlowStep label="Trigger" title={draft.trigger} body={draft.when} />
                {draft.steps.map((s, i) => <FlowStep key={s} label={`Step ${i + 1}`} title={s} />)}
                <FlowStep last label="Approval" title={draft.approver ? "Torian says yes first" : "Runs on its own"} />
              </ol>
              <div className="flex flex-wrap justify-end gap-2">
                <Button variant="ghost" onClick={() => setDraft(null)}>Describe it again</Button>
                <Button onClick={() => {
                  setItems((all) => [...all, draft]); setCreating(false); setFnFilter(draft.fn); setStatus("all");
                  setNote(`Added ${draft.name} to ${fnOf(draft.fn).label}. It is on.`);
                }}>Add automation</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FlowStep({ label, title, body, last, children }: { label: string; title: string; body?: string; last?: boolean; children?: ReactNode }) {
  return (
    <li>
      <div className="rounded-lg border p-3">
        <div className="text-muted-foreground text-[11px] font-medium uppercase tracking-wide">{label}</div>
        <div className="text-sm font-medium">{title}</div>
        {body ? <div className="text-muted-foreground text-xs">{body}</div> : null}
        {children}
      </div>
      {!last ? <div className="text-muted-foreground flex justify-center py-1"><ArrowDownIcon className="size-3.5" /></div> : null}
    </li>
  );
}
