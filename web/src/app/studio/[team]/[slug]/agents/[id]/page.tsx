"use client";

// V7 Agent builder: an agent as a canvas of steps, with a node palette on the left and the selected step's
// fields on the right. On a phone the canvas is a list of steps and the palette and inspector are sheets.
import { useTeamSlug } from "@/components/studio/team";
import { use, useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeftIcon, FileTextIcon, FlaskConicalIcon, PlayIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ScreenHead } from "@/components/studio/shell";
import { Num } from "@/components/studio/bits";
import { PromptBox } from "@/components/studio/prompt-box";
import { RunRow } from "@/components/studio/run-row";
import { AGENTS, FUNCTIONS, RUNS, agentOf, fnOf, businessHref, type Agent, type FunctionId } from "@/components/studio/data";
import {
  BUILDER_TOOLS, KIND_LABEL, KNOWLEDGE, NEEDS_YES, OUTPUTS, PALETTE, TRIGGERS, hireable, makeNode, seedFlow,
  type FlowNode, type NodeKind,
} from "@/components/studio/automation-data";

const W = 184, H = 64, GX = 56, GY = 60, PAD = 24;

/** Width of an element, kept current as it resizes. 0 before the first measure. */
function useWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(e!.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

function resolveAgent(id: string): Agent | null {
  if (id === "new") return null;
  const known = AGENTS.find((a) => a.id === id);
  if (known) return known;
  const fn = FUNCTIONS.find((f) => `${f.id}-agent` === id);
  return fn ? hireable(fn.id, fn.label.split(" (")[0]!) : agentOf(id);
}

const TEMPLATES = [
  { id: "blank", title: "Start blank", body: "A Start and an End. Add each step yourself." },
  { id: "marketing-agent", title: "From Marketing agent", body: "Reads product cards, drafts outreach, holds every send for your yes." },
  { id: "interview-scheduler", title: "From Interview scheduler", body: "Picks coaches, books 20 minute calls, records each booking." },
] as const;

export default function AgentBuilderPage({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const team = useTeamSlug() ?? "";
  const { slug, id } = use(params);
  const base = resolveAgent(id);
  const [name, setName] = useState(base?.name ?? "New agent");
  const [fn, setFn] = useState<FunctionId>(base?.fn ?? "products");
  const [nodes, setNodes] = useState<FlowNode[]>(() => seedFlow(base?.id ?? "blank", base?.fn ?? "products"));
  const [sel, setSel] = useState<string | null>(null);
  const [live, setLive] = useState(base !== null);
  const [picker, setPicker] = useState(id === "new");
  const [note, setNote] = useState("");
  const [paletteSheet, setPaletteSheet] = useState(false);
  const [inspectSheet, setInspectSheet] = useState(false);
  const [testOpen, setTestOpen] = useState(false);
  const [evalOpen, setEvalOpen] = useState(false);
  const [wrapRef, width] = useWidth();
  const wide = width >= 1000;
  const canvasOn = width >= 620;

  const selected = nodes.find((n) => n.id === sel) ?? null;
  const edit = (patch: Partial<FlowNode>) => {
    if (!selected) return;
    setNodes((all) => all.map((n) => (n.id === selected.id ? { ...n, ...patch } : n)));
    setLive(false);
  };
  const add = (kind: NodeKind) => {
    const n = makeNode(kind, fn);
    setNodes((all) => {
      const endAt = all.findIndex((x) => x.kind === "end");
      if (kind === "end" && endAt >= 0) return all;
      const at = endAt >= 0 ? endAt : all.length;
      return [...all.slice(0, at), n, ...all.slice(at)];
    });
    if (kind === "end" && nodes.some((x) => x.kind === "end")) { setNote("The flow already ends. Add steps before End."); return; }
    setSel(n.id);
    setLive(false);
    setPaletteSheet(false);
    setNote(`Added ${KIND_LABEL[kind]} before End. Its fields are open.`);
    if (!wide) setInspectSheet(true);
  };
  const remove = () => {
    if (!selected || selected.kind === "start") return;
    setNodes((all) => all.filter((n) => n.id !== selected.id));
    setNote(`Removed ${selected.name}.`);
    setSel(null);
    setInspectSheet(false);
    setLive(false);
  };
  const pick = (n: FlowNode) => { setSel(n.id); if (!wide) setInspectSheet(true); };
  const choose = (t: (typeof TEMPLATES)[number]["id"]) => {
    const from = t === "blank" ? null : agentOf(t);
    const f = from?.fn ?? "products";
    setFn(f);
    setNodes(seedFlow(t, f));
    setName(from ? `${from.name} (copy)` : "New agent");
    setPicker(false);
    setNote(from ? `Copied ${from.name}. Change any step, then publish.` : "Blank agent. Add steps from the palette.");
  };

  const palette = <Palette onAdd={add} />;
  const inspector = <Inspector node={selected} onEdit={edit} onRemove={remove} />;

  return (
    <div className="pb-12">
      <div className="px-4 pt-4 md:px-8">
        <Link href={businessHref(team, slug, "agents")} className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs"><ArrowLeftIcon className="size-3" />All agents</Link>
      </div>
      <div className="relative">
        <Num n="V7.1" className="absolute top-1 right-2 z-10" />
        <ScreenHead n="V7" title={name} job={`${fnOf(fn).label}. ${base?.job ?? "A new agent for this venture."}`}>
          <Badge variant={live ? "secondary" : "outline"}>{live ? "Live" : "Draft"}</Badge>
          <Button variant="outline" size="sm" onClick={() => setTestOpen(true)}><PlayIcon />Test</Button>
          <Button variant="outline" size="sm" onClick={() => setEvalOpen(true)}><FlaskConicalIcon />Evaluate</Button>
          <Button size="sm" onClick={() => { setNote(live ? "Already live. Change a step to start a new draft." : `Published. ${name} now runs this flow of ${nodes.length} steps.`); setLive(true); }}>Publish</Button>
        </ScreenHead>
      </div>

      <div ref={wrapRef} className="px-4 md:px-8">
        {note ? <p role="status" className="bg-muted mb-3 rounded-md px-3 py-2 text-sm">{note}</p> : null}
        <Tabs defaultValue="flow">
          <div className="relative">
            <Num n="V7.2" className="absolute -top-2 -left-1 z-10" />
            <TabsList className="max-w-full overflow-x-auto">
              <TabsTrigger value="flow">Flow</TabsTrigger>
              <TabsTrigger value="knowledge">Knowledge</TabsTrigger>
              <TabsTrigger value="schedule">Schedule</TabsTrigger>
              <TabsTrigger value="runs">Runs</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="flow" className="mt-2">
            {!wide ? (
              <Button variant="outline" size="sm" className="mb-3" onClick={() => setPaletteSheet(true)}><PlusIcon />Add a step</Button>
            ) : null}
            <div className={cn("grid gap-3", wide && "grid-cols-[176px_minmax(0,1fr)_280px]")}>
              {wide ? <Panel n="V7.3">{palette}</Panel> : null}
              {canvasOn ? <Canvas nodes={nodes} sel={sel} onPick={pick} /> : <StepList nodes={nodes} sel={sel} onPick={pick} />}
              {wide ? <Panel n="V7.6">{inspector}</Panel> : null}
            </div>
          </TabsContent>

          <TabsContent value="knowledge" className="mt-2"><Knowledge /></TabsContent>
          <TabsContent value="schedule" className="mt-2"><Schedule /></TabsContent>
          <TabsContent value="runs" className="mt-2">
            <div className="relative rounded-xl border">
              <Num n="V7.11" className="absolute -top-2 right-2 z-10" />
              {RUNS.filter((r) => r.agent === base?.id).length ? (
                <div className="divide-y">{RUNS.filter((r) => r.agent === base?.id).map((r, i) => <RunRow key={r.id} run={r} numbered={i === 0} />)}</div>
              ) : <p className="text-muted-foreground p-4 text-sm">No runs yet. Use Test to try it, or publish it and it runs on its schedule.</p>}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Sheet open={paletteSheet} onOpenChange={setPaletteSheet}>
        <SheetContent side="bottom" className="max-h-[80dvh] overflow-y-auto p-4">
          <SheetHeader className="p-0"><SheetTitle>Add a step</SheetTitle><SheetDescription>It goes in before End.</SheetDescription></SheetHeader>
          <div className="relative"><Num n="V7.3" className="absolute -top-2 right-0" />{palette}</div>
        </SheetContent>
      </Sheet>
      <Sheet open={inspectSheet && !wide} onOpenChange={setInspectSheet}>
        <SheetContent className="w-full overflow-y-auto p-4 sm:max-w-md">
          <SheetHeader className="p-0"><SheetTitle>{selected?.name ?? "Step"}</SheetTitle><SheetDescription>Change what this step does.</SheetDescription></SheetHeader>
          <div className="relative"><Num n="V7.6" className="absolute -top-2 right-0" />{inspector}</div>
        </SheetContent>
      </Sheet>

      <TestSheet open={testOpen} onOpenChange={setTestOpen} name={name} nodes={nodes} />

      <Dialog open={evalOpen} onOpenChange={setEvalOpen}>
        <DialogContent>
          <Num n="V7.13" className="absolute top-2 left-2" />
          <DialogHeader><DialogTitle>Evaluation of {name}</DialogTitle><DialogDescription>Ran 12 saved cases from past runs against this draft.</DialogDescription></DialogHeader>
          <ul className="space-y-2 text-sm">
            <li className="flex justify-between gap-3"><span>Cases that passed</span><span className="font-medium">10 of 12</span></li>
            <li className="flex justify-between gap-3"><span>Drafts held for a person when they should be</span><span className="font-medium">12 of 12</span></li>
            <li className="flex justify-between gap-3"><span>Average cost per run</span><span className="font-medium">$0.14</span></li>
          </ul>
          <div className="text-muted-foreground rounded-md border p-3 text-xs">
            Two cases need work. Coach Lee&apos;s notes produced a card with no quote behind it, and one run read a file outside its knowledge list.
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={picker} onOpenChange={(o) => { if (!o) choose("blank"); }}>
        <DialogContent>
          <Num n="V7.7" className="absolute top-2 left-2" />
          <DialogHeader><DialogTitle>Build an agent</DialogTitle><DialogDescription>Start from nothing or copy an agent you have and change its steps.</DialogDescription></DialogHeader>
          <div className="grid gap-2">
            {TEMPLATES.map((t) => (
              <button key={t.id} type="button" onClick={() => choose(t.id)} className="hover:bg-accent rounded-lg border p-3 text-left">
                <div className="text-sm font-medium">{t.title}</div>
                <div className="text-muted-foreground mt-0.5 text-xs">{t.body}</div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Panel({ n, children }: { n: string; children: ReactNode }) {
  return <div className="bg-card relative rounded-xl border p-3"><Num n={n} className="absolute -top-2 right-2" />{children}</div>;
}

function Palette({ onAdd }: { onAdd: (k: NodeKind) => void }) {
  return (
    <div className="space-y-4">
      {PALETTE.map((g) => (
        <div key={g.group}>
          <div className="text-muted-foreground mb-1 text-xs font-medium">{g.group}</div>
          <div className="grid grid-cols-2 gap-1 md:grid-cols-1">
            {g.items.map((it) => (
              <button key={it.kind} type="button" onClick={() => onAdd(it.kind)} className="hover:bg-accent flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm">
                <span className={cn("size-2 rounded-sm", TONE[it.kind])} />{it.label}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

const TONE: Record<NodeKind, string> = {
  start: "bg-emerald-500", end: "bg-zinc-500", agent: "bg-sky-500", ask: "bg-fuchsia-600", note: "bg-yellow-400",
  "file-search": "bg-orange-500", web: "bg-orange-500", connector: "bg-orange-500", write: "bg-orange-500",
  if: "bg-violet-500", loop: "bg-violet-500", approval: "bg-fuchsia-600", transform: "bg-teal-500", state: "bg-teal-500",
};

/** The flow drawn as boxes in rows that turn at the edge, with a line from each step to the next. */
function Canvas({ nodes, sel, onPick }: { nodes: FlowNode[]; sel: string | null; onPick: (n: FlowNode) => void }) {
  const [ref, width] = useWidth();
  const cols = Math.max(2, Math.floor((width - PAD * 2 + GX) / (W + GX)));
  const pos = nodes.map((_, i) => {
    const row = Math.floor(i / cols), c = i % cols, col = row % 2 ? cols - 1 - c : c;
    return { x: PAD + col * (W + GX), y: PAD + row * (H + GY), row, col };
  });
  const rows = Math.ceil(nodes.length / cols);
  const h = PAD * 2 + rows * H + (rows - 1) * GY;
  const cw = PAD * 2 + cols * W + (cols - 1) * GX;
  const paths = pos.slice(1).map((b, k) => {
    const a = pos[k]!;
    if (a.row === b.row) {
      const right = b.col > a.col;
      const x1 = right ? a.x + W : a.x, x2 = right ? b.x : b.x + W, y = a.y + H / 2;
      return `M${x1},${y} L${x2},${y}`;
    }
    const x = a.x + W / 2, y1 = a.y + H, y2 = b.y, m = (y1 + y2) / 2;
    return `M${x},${y1} C${x},${m} ${b.x + W / 2},${m} ${b.x + W / 2},${y2}`;
  });
  return (
    <div ref={ref} className="relative min-h-[420px] overflow-auto rounded-xl border bg-[radial-gradient(circle,var(--color-border)_1px,transparent_1px)] [background-size:16px_16px]">
      <Num n="V7.4" className="absolute top-1 left-1 z-10" />
      <div className="relative" style={{ width: Math.max(cw, 0), height: h }}>
        <svg className="text-muted-foreground/60 absolute inset-0" width={cw} height={h} aria-hidden>
          <defs><marker id="arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="currentColor" /></marker></defs>
          {paths.map((d, i) => <path key={i} d={d} fill="none" stroke="currentColor" strokeWidth={1.5} markerEnd="url(#arrow)" />)}
        </svg>
        {nodes.map((n, i) => (
          <button key={n.id} type="button" onClick={() => onPick(n)} style={{ left: pos[i]!.x, top: pos[i]!.y, width: W, height: H }}
            className={cn("bg-card absolute flex flex-col justify-center rounded-lg border px-3 text-left shadow-xs", sel === n.id ? "ring-foreground border-foreground ring-1" : "hover:border-foreground/40")}>
            {i === 1 ? <Num n="V7.5" className="absolute -top-2 right-2" /> : null}
            <span className="text-muted-foreground flex items-center gap-1.5 text-[11px]"><span className={cn("size-2 rounded-sm", TONE[n.kind])} />{KIND_LABEL[n.kind]}</span>
            <span className="truncate text-sm font-medium">{n.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/** Phone and narrow widths: the same flow as a list of steps, top to bottom. */
function StepList({ nodes, sel, onPick }: { nodes: FlowNode[]; sel: string | null; onPick: (n: FlowNode) => void }) {
  return (
    <ol className="relative space-y-0">
      <Num n="V7.12" className="absolute -top-2 right-0 z-10" />
      {nodes.map((n, i) => (
        <li key={n.id}>
          <button type="button" onClick={() => onPick(n)} className={cn("bg-card flex w-full items-center gap-3 rounded-lg border p-3 text-left", sel === n.id && "border-foreground")}>
            <span className="text-muted-foreground w-5 text-xs tabular-nums">{i + 1}</span>
            <span className="min-w-0 flex-1">
              <span className="text-muted-foreground flex items-center gap-1.5 text-[11px]"><span className={cn("size-2 rounded-sm", TONE[n.kind])} />{KIND_LABEL[n.kind]}</span>
              <span className="block truncate text-sm font-medium">{n.name}</span>
            </span>
          </button>
          {i < nodes.length - 1 ? <div className="bg-border ml-7 h-4 w-px" /> : null}
        </li>
      ))}
    </ol>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <div className="space-y-1"><div className="text-muted-foreground text-xs font-medium">{label}</div>{children}</div>;
}

function Inspector({ node, onEdit, onRemove }: { node: FlowNode | null; onEdit: (p: Partial<FlowNode>) => void; onRemove: () => void }) {
  if (!node) return <p className="text-muted-foreground text-sm">Pick a step on the canvas to see and change its fields.</p>;
  const flip = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  return (
    <div className="space-y-4">
      <div className="text-muted-foreground flex items-center gap-1.5 text-xs"><span className={cn("size-2 rounded-sm", TONE[node.kind])} />{KIND_LABEL[node.kind]}</div>
      <Field label="Name"><Input value={node.name} onChange={(e) => onEdit({ name: e.target.value })} /></Field>
      <Field label="Instructions"><Textarea rows={4} value={node.instructions} placeholder="What this step should do, in plain words." onChange={(e) => onEdit({ instructions: e.target.value })} /></Field>
      <Field label="Model">
        <Select value={node.model} onValueChange={(v) => onEdit({ model: v as FlowNode["model"] })}>
          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>{(["Lite", "Balanced", "Power"] as const).map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
        </Select>
      </Field>
      <Field label="Tools">
        <div className="grid grid-cols-2 gap-1">
          {BUILDER_TOOLS.map((t) => (
            <label key={t} className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-foreground" checked={node.tools.includes(t)} onChange={() => onEdit({ tools: flip(node.tools, t) })} />{t}</label>
          ))}
        </div>
      </Field>
      <Field label="Function">
        <Select value={node.fn} onValueChange={(v) => onEdit({ fn: v as FunctionId })}>
          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>{FUNCTIONS.map((f) => <SelectItem key={f.id} value={f.id}>{f.label}</SelectItem>)}</SelectContent>
        </Select>
      </Field>
      <Field label="What needs a person's yes">
        <div className="space-y-1">
          {NEEDS_YES.map((t) => (
            <label key={t} className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-foreground" checked={node.needsYes.includes(t)} onChange={() => onEdit({ needsYes: flip(node.needsYes, t) })} />{t}</label>
          ))}
        </div>
      </Field>
      <Field label="Output format">
        <Select value={node.output} onValueChange={(v) => onEdit({ output: v })}>
          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>{OUTPUTS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
        </Select>
      </Field>
      {node.kind !== "start" ? <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={onRemove}><Trash2Icon />Remove step</Button> : null}
    </div>
  );
}

function Knowledge() {
  const [files, setFiles] = useState(KNOWLEDGE.map((f, i) => ({ ...f, on: i < 3 })));
  return (
    <div className="relative rounded-xl border">
      <Num n="V7.9" className="absolute -top-2 right-2 z-10" />
      <div className="flex flex-wrap items-center justify-between gap-2 border-b p-3">
        <p className="text-muted-foreground text-sm">Files this agent may read. Anything unticked stays closed to it.</p>
        <Button variant="outline" size="sm" onClick={() => setFiles((f) => f.some((x) => x.path === "finance/budget-2026.json") ? f : [...f, { path: "finance/budget-2026.json", size: "1 KB", on: true }])}><PlusIcon />Add a file</Button>
      </div>
      <ul className="divide-y">
        {files.map((f) => (
          <li key={f.path}>
            <label className="flex items-center gap-3 px-3 py-2.5 text-sm">
              <input type="checkbox" className="accent-foreground" checked={f.on} onChange={() => setFiles((all) => all.map((x) => (x.path === f.path ? { ...x, on: !x.on } : x)))} />
              <FileTextIcon className="text-muted-foreground size-4 shrink-0" />
              <span className="min-w-0 flex-1 truncate font-mono text-xs">{f.path}</span>
              <span className="text-muted-foreground text-xs">{f.size}</span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Schedule() {
  const [triggers, setTriggers] = useState(TRIGGERS);
  return (
    <div className="relative rounded-xl border">
      <Num n="V7.10" className="absolute -top-2 right-2 z-10" />
      <div className="flex flex-wrap items-center justify-between gap-2 border-b p-3">
        <p className="text-muted-foreground text-sm">What starts a run. Any trigger that is on can start one.</p>
        <Button variant="outline" size="sm" onClick={() => setTriggers((t) => t.some((x) => x.id === "t4") ? t : [...t, { id: "t4", what: "An email arrives at coaches@hapticplays.com", kind: "Email arrives", on: true }])}><PlusIcon />Add a trigger</Button>
      </div>
      <ul className="divide-y">
        {triggers.map((t) => (
          <li key={t.id} className="flex items-center gap-3 px-3 py-2.5">
            <span className="min-w-0 flex-1">
              <span className="block text-sm">{t.what}</span>
              <span className="text-muted-foreground text-xs">{t.kind}{t.on ? "" : ", off"}</span>
            </span>
            <Switch checked={t.on} onCheckedChange={(v) => setTriggers((all) => all.map((x) => (x.id === t.id ? { ...x, on: v } : x)))} aria-label={`Trigger: ${t.what}`} />
          </li>
        ))}
      </ul>
    </div>
  );
}

type Msg = { from: "you" | "agent"; text: string };
function TestSheet({ open, onOpenChange, name, nodes }: { open: boolean; onOpenChange: (v: boolean) => void; name: string; nodes: FlowNode[] }) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const reply = (q: string): string => {
    const steps = nodes.filter((n) => n.kind !== "start" && n.kind !== "end");
    const stop = steps.findIndex((n) => n.kind === "approval" || n.kind === "ask");
    const ran = stop >= 0 ? steps.slice(0, stop) : steps;
    const did = ran.length ? ran.map((n) => n.name).join(", then ") : "nothing yet, since the flow has no steps";
    const held = stop >= 0 ? ` I stopped at "${steps[stop]!.name}" and would hold the draft for your yes.` : " Nothing needed a person's yes, so I would finish on my own.";
    return `Test run for "${q}". I ran ${did}.${held} This was a test, so nothing was written or sent.`;
  };
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full p-4 sm:max-w-md">
        <Num n="V7.8" className="absolute top-2 left-2" />
        <SheetHeader className="p-0"><SheetTitle>Test {name}</SheetTitle><SheetDescription>Runs the draft on mock data. Nothing is saved.</SheetDescription></SheetHeader>
        <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
          {msgs.length === 0 ? <p className="text-muted-foreground text-sm">Ask it to do one job, as you would on a normal day.</p> : null}
          {msgs.map((m, i) => (
            <div key={i} className={cn("max-w-[90%] rounded-lg px-3 py-2 text-sm", m.from === "you" ? "bg-muted self-end" : "border self-start")}>{m.text}</div>
          ))}
        </div>
        <PromptBox placeholder="Give it a task to try" suggestions={["Turn Coach Lee's notes into cards", "Draft this week's outreach"]}
          onSubmit={(t) => setMsgs((m) => [...m, { from: "you", text: t }, { from: "agent", text: reply(t) }])} />
      </SheetContent>
    </Sheet>
  );
}
