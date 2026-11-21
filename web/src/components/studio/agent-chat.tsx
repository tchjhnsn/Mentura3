"use client";

// C5 Agent chat panel: the agent that works beside you inside one venture. Anatomy shared by Replit (actions,
// checkpoints, "Worked for N min", rollback, suggested next tasks) and Productboard Spark (Skills, Scheduled, Recent).
import { useEffect, useRef, useState } from "react";
import {
  BotIcon, BrainIcon, CalendarClockIcon, CheckIcon, ChevronDownIcon, ChevronRightIcon, FileTextIcon, GlobeIcon,
  HistoryIcon, PencilIcon, PlusIcon, RotateCcwIcon, SparklesIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HeldCard, Num, StatusDot } from "./bits";
import { AGENTS, agentOf, ventureOf, type Venture } from "./data";
import { PromptBox } from "./prompt-box";

type Mode = "Lite" | "Balanced" | "Power";
type Step = { icon: "read" | "web" | "edit" | "think"; label: string };
type Msg =
  | { id: string; kind: "you"; text: string }
  | { id: string; kind: "agent"; agent: string; text: string; steps?: Step[]; took?: string; pending?: boolean }
  | { id: string; kind: "checkpoint"; label: string; when: string }
  | { id: string; kind: "held"; who: string; what: string; detail: string }
  | { id: string; kind: "next"; items: string[] }
  | { id: string; kind: "note"; text: string };

const STEP_ICON = { read: FileTextIcon, web: GlobeIcon, edit: PencilIcon, think: BrainIcon } as const;

/** The conversation each venture opens with. */
function seed(v: Venture): Msg[] {
  const byVenture: Record<string, { ask: string; reply: string; web: string; held: [string, string, string]; next: string[] }> = {
    "haptic-plays": {
      ask: "Is the evidence strong enough to test the vest with a real team?",
      reply: "Yes for a small test. Four of six coaches said calling plays over crowd noise costs them games, so 'coaches hurt' is now supported. 'Why now' is still untested. I updated the assumptions and drafted the outreach to Lincoln High.",
      web: "Searched the web for high school wearable rules in Texas",
      held: ["Marketing agent", "Send the coach outreach email to Lincoln High", "Draft in marketing/outreach/coaches-v2.md. Goes to Coach Reyes and two assistants."],
      next: ["Book a practice slot with Lincoln High", "Grade the 'why now' assumption", "Price a ten vest pilot"],
    },
    "pattern-language": {
      ask: "Who should I interview first about picking patterns?",
      reply: "Start with small practice architects. They pick patterns by hand from old books and say it takes hours per project. I listed eight names and graded 'segment' as untested until you talk to five.",
      web: "Searched the web for small architecture practices in Austin",
      held: ["Product agent", "Send interview invites to five architects", "Draft in product/interviews/invite.md. Twenty minute calls next week."],
      next: ["Write the interview guide", "Map the first twenty patterns", "Find two architecture schools to ask"],
    },
    "founder-raise": {
      ask: "Which funders should get the deck first?",
      reply: "Three on the short list back founders over ideas: two angel syndicates and one studio fund. The deck is ready, and I tightened slide 4 on how a founder's time is priced. The sends are held for you.",
      web: "Searched the web for funds that back founders, not ideas",
      held: ["Funder scout", "Send the deck to three funders", "Draft notes in external/funders/first-notes.md with the deck attached."],
      next: ["Prepare answers for the ten hardest questions", "Set a follow up reminder for Friday", "Update the runway after the first reply"],
    },
  };
  const s = byVenture[v.slug] ?? byVenture["haptic-plays"]!;
  return [
    { id: "s1", kind: "you", text: s.ask },
    {
      id: "s2", kind: "agent", agent: "chief-of-staff", took: "Worked for 2 min", text: s.reply,
      steps: [
        { icon: "read", label: "Read strategy/assumptions.json" },
        { icon: "read", label: "Read product/interviews/notes.md" },
        { icon: "web", label: s.web },
        { icon: "edit", label: "Edited strategy/assumptions.json" },
      ],
    },
    { id: "s3", kind: "checkpoint", label: "Checkpoint after editing strategy/assumptions.json", when: "12 min ago" },
    { id: "s4", kind: "held", who: s.held[0], what: s.held[1], detail: s.held[2] },
    { id: "s5", kind: "next", items: s.next },
  ];
}

const RECENT = [
  { id: "c1", title: "Grade the evidence for the four assumptions", when: "Today", agent: "strategy-agent" },
  { id: "c2", title: "Plan the week", when: "Monday", agent: "chief-of-staff" },
  { id: "c3", title: "Draft the coach outreach email", when: "Last week", agent: "marketing-agent" },
  { id: "c4", title: "Reconcile November spend", when: "Last week", agent: "finance-agent" },
];
const SKILLS = [
  { id: "deck", name: "Write a deck", about: "Builds a marketing or investor deck from the venture's records.", on: true },
  { id: "grade", name: "Grade evidence", about: "Grades each assumption demonstrated, supported, untested or contradicted.", on: true },
  { id: "outreach", name: "Draft outreach", about: "Drafts emails and notes. Every send is held for your yes.", on: true },
  { id: "week", name: "Plan the week", about: "Turns open decisions and runs into a plan for the week.", on: false },
];
const SCHEDULED_SEED = [
  { id: "p1", when: "Monday 8am", prompt: "Plan the week", on: true },
  { id: "p2", when: "Daily 6pm", prompt: "Summarize what the agents changed today", on: true },
  { id: "p3", when: "1st of the month", prompt: "Reconcile spend against the budget", on: false },
];

function reply(text: string): { text: string; steps: Step[] } {
  const t = text.toLowerCase();
  if (t.includes("deck")) return { text: "I opened the investor deck and drafted two new slides. Look them over in Decks before I send anything.", steps: [{ icon: "think", label: "Thought for 4s" }, { icon: "read", label: "Read marketing/decks/investor.json" }, { icon: "edit", label: "Edited marketing/decks/investor.json" }] };
  if (t.includes("grade") || t.includes("assumption")) return { text: "I graded it against the notes we have. It stays untested until we hear from two more people outside our network.", steps: [{ icon: "think", label: "Thought for 6s" }, { icon: "read", label: "Read strategy/assumptions.json" }] };
  return { text: "On it. I wrote a short plan and will hold anything that sends, spends or publishes for your yes.", steps: [{ icon: "think", label: "Thought for 3s" }, { icon: "read", label: "Read operations/week-47.md" }] };
}

/** C5 Agent chat panel. */
export function AgentChat({ slug }: { slug: string }) {
  return <ChatPanel key={slug} slug={slug} />;
}

function ChatPanel({ slug }: { slug: string }) {
  const v = ventureOf(slug);
  const [agentId, setAgentId] = useState("chief-of-staff");
  const [mode, setMode] = useState<Mode>("Balanced");
  const [tab, setTab] = useState("chat");
  const [msgs, setMsgs] = useState<Msg[]>(() => seed(v));
  const [started, setStarted] = useState<string[]>([]);
  const [skills, setSkills] = useState(() => Object.fromEntries(SKILLS.map((s) => [s.id, s.on])));
  const [scheduled, setScheduled] = useState(SCHEDULED_SEED);
  const [ranNow, setRanNow] = useState<string | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const end = useRef<HTMLDivElement>(null);
  const agent = agentOf(agentId);

  useEffect(() => () => { timers.current.forEach(clearTimeout); }, []);
  useEffect(() => { end.current?.scrollIntoView({ block: "end" }); }, [msgs.length]);

  const send = (text: string) => {
    const id = `m${Date.now()}`;
    setTab("chat");
    setMsgs((m) => [...m, { id: `${id}u`, kind: "you", text }, { id: `${id}a`, kind: "agent", agent: agentId, text: "", pending: true, steps: [{ icon: "think", label: "Thinking" }] }]);
    const r = reply(text);
    timers.current.push(setTimeout(() => {
      setMsgs((m) => m.map((x) => (x.id === `${id}a` && x.kind === "agent" ? { ...x, pending: false, text: r.text, steps: r.steps, took: "Worked for 9s" } : x)));
    }, 1400));
  };

  const rollBack = (cpId: string) => {
    setMsgs((m) => {
      const i = m.findIndex((x) => x.id === cpId);
      return [...m.slice(0, i + 1), { id: `n${Date.now()}`, kind: "note", text: "Rolled back to this checkpoint. Changes made after it were undone." }];
    });
  };

  const newChat = () => {
    timers.current.forEach(clearTimeout);
    setMsgs([{ id: `n${Date.now()}`, kind: "note", text: `New chat with ${agent.name} about ${v.name}.` }]);
    setStarted([]);
    setTab("chat");
  };

  const openRecent = (r: (typeof RECENT)[number]) => {
    setAgentId(r.agent);
    setMsgs([
      { id: `${r.id}u`, kind: "you", text: r.title },
      { id: `${r.id}a`, kind: "agent", agent: r.agent, took: "Worked for 1 min", text: `Done. You can read what I changed in Activity. This chat is from ${r.when.toLowerCase()}.`, steps: [{ icon: "read", label: "Read the venture's records" }] },
    ]);
    setTab("chat");
  };

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <Num n="C5" className="absolute top-1 left-1 z-10" />

      {/* C5.1 Header: who you are talking to, the mode, and a new chat. Right padding on a phone leaves room for the frame's close button. */}
      <div className="relative flex items-center gap-1 border-b py-2 pr-12 pl-2 md:pr-2">
        <Num n="C5.1" className="absolute -bottom-2 left-8 z-10" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className="hover:bg-accent relative flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-left">
              <Num n="C5.2" className="absolute -top-1.5 right-0" />
              <span className="bg-muted grid size-7 shrink-0 place-items-center rounded-full"><BotIcon className="size-4" /></span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">{agent.name}</span>
                <span className="block"><StatusDot status={agent.status} /></span>
              </span>
              <ChevronDownIcon className="text-muted-foreground size-3.5 shrink-0" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-72">
            <DropdownMenuLabel className="text-muted-foreground text-xs font-normal">Talk to</DropdownMenuLabel>
            {AGENTS.map((a) => (
              <DropdownMenuItem key={a.id} onSelect={() => setAgentId(a.id)} className="flex items-start gap-2">
                <BotIcon className="mt-0.5 size-4" />
                <span className="min-w-0 flex-1"><span className="block text-sm">{a.name}</span><span className="text-muted-foreground block truncate text-xs">{a.job}</span></span>
                {a.id === agentId ? <CheckIcon className="mt-0.5 size-4" /> : null}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="relative px-2 text-xs" aria-label={`Mode: ${mode}`}>
              <Num n="C5.3" className="absolute -top-1.5 right-0" />
              <SparklesIcon />{mode}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuLabel className="text-muted-foreground text-xs font-normal">Mode</DropdownMenuLabel>
            {([
              ["Lite", "Fast and cheap, for small edits."],
              ["Balanced", "Good for most work."],
              ["Power", "Thinks longer, costs more."],
            ] as [Mode, string][]).map(([m, about]) => (
              <DropdownMenuItem key={m} onSelect={() => setMode(m)} className="flex items-start gap-2">
                <span className="min-w-0 flex-1"><span className="block text-sm">{m}</span><span className="text-muted-foreground block text-xs">{about}</span></span>
                {m === mode ? <CheckIcon className="mt-0.5 size-4" /> : null}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <Button variant="ghost" size="sm" className="px-2 text-xs" onClick={newChat}><PlusIcon />New chat</Button>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="flex min-h-0 flex-1 flex-col gap-0">
        {/* C5.4 Tabs */}
        <div className="relative px-2 pt-2">
          <Num n="C5.4" className="absolute top-0.5 right-2 z-10" />
          <TabsList variant="line" className="w-full justify-start">
            <TabsTrigger value="chat" className="flex-none">Chat</TabsTrigger>
            <TabsTrigger value="recent" className="flex-none">Recent</TabsTrigger>
            <TabsTrigger value="skills" className="flex-none">Skills</TabsTrigger>
            <TabsTrigger value="scheduled" className="flex-none">Scheduled</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="chat" className="flex min-h-0 flex-col data-[state=inactive]:hidden">
          {/* C5.5 Conversation */}
          <div className="relative min-h-0 flex-1 space-y-4 overflow-y-auto px-3 py-4">
            <Num n="C5.5" className="absolute top-1 right-2" />
            {msgs.map((m) => <MsgView key={m.id} m={m} started={started}
              onRollBack={rollBack}
              onStart={(t) => { setStarted((s) => [...s, t]); send(t); }} />)}
            <div ref={end} />
          </div>
          {/* C5.10 Composer */}
          <div className="relative border-t p-3">
            <Num n="C5.10" className="absolute top-1 right-2" />
            <PromptBox placeholder={`Ask ${agent.name} about ${v.name}`} onSubmit={send}
              suggestions={["Grade the why now assumption", "Draft two deck slides", "What should I do today?"]} />
            <p className="text-muted-foreground mt-2 text-[11px]">{mode} mode. Sends, spends and publishing wait for your yes.</p>
          </div>
        </TabsContent>

        <TabsContent value="recent" className="min-h-0 overflow-y-auto data-[state=inactive]:hidden">
          {/* C5.11 Recent chats */}
          <div className="relative p-2">
            <Num n="C5.11" className="absolute top-1 right-2" />
            <ul>
              {RECENT.map((r) => (
                <li key={r.id}>
                  <button type="button" onClick={() => openRecent(r)} className="hover:bg-accent flex w-full items-start gap-3 rounded-md px-2 py-2.5 text-left">
                    <HistoryIcon className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm">{r.title}</span>
                      <span className="text-muted-foreground block text-xs">{agentOf(r.agent).name} · {r.when}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </TabsContent>

        <TabsContent value="skills" className="min-h-0 overflow-y-auto data-[state=inactive]:hidden">
          {/* C5.12 Skills */}
          <div className="relative p-3">
            <Num n="C5.12" className="absolute top-1 right-2" />
            <p className="text-muted-foreground mb-2 text-xs">What {agent.name} may do in this venture.</p>
            <ul className="divide-y">
              {SKILLS.map((s) => (
                <li key={s.id} className="flex items-start gap-3 py-3">
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">{s.name}</span>
                    <span className="text-muted-foreground block text-xs">{s.about}</span>
                    <span className="text-muted-foreground mt-1 block text-[11px]">{skills[s.id] ? "On" : "Off"}</span>
                  </span>
                  <Switch checked={!!skills[s.id]} onCheckedChange={(c) => setSkills((x) => ({ ...x, [s.id]: c }))} aria-label={`${s.name} skill`} />
                </li>
              ))}
            </ul>
          </div>
        </TabsContent>

        <TabsContent value="scheduled" className="min-h-0 overflow-y-auto data-[state=inactive]:hidden">
          {/* C5.13 Scheduled prompts */}
          <div className="relative p-3">
            <Num n="C5.13" className="absolute top-1 right-2" />
            <ul className="divide-y">
              {scheduled.map((p) => (
                <li key={p.id} className="py-3">
                  <div className="flex items-start gap-3">
                    <CalendarClockIcon className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium">{p.prompt}</span>
                      <span className="text-muted-foreground block text-xs">{p.when} · {p.on ? "On" : "Paused"}</span>
                    </span>
                    <Switch checked={p.on} onCheckedChange={(c) => setScheduled((s) => s.map((x) => (x.id === p.id ? { ...x, on: c } : x)))} aria-label={`Schedule ${p.prompt}`} />
                  </div>
                  <div className="mt-1 pl-7">
                    {ranNow === p.id
                      ? <span className="text-xs font-medium">Started now. Watch it in Activity.</span>
                      : <Button variant="ghost" size="xs" onClick={() => setRanNow(p.id)}>Run now</Button>}
                  </div>
                </li>
              ))}
            </ul>
            <Button variant="outline" size="sm" className="mt-2" onClick={() => setScheduled((s) => s.some((x) => x.id === "p4") ? s : [...s, { id: "p4", when: "Friday 4pm", prompt: "Review spend and runway", on: true }])}>
              <PlusIcon />Schedule a prompt
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MsgView({ m, started, onRollBack, onStart }: { m: Msg; started: string[]; onRollBack: (id: string) => void; onStart: (t: string) => void }) {
  if (m.kind === "you") {
    return <div className="flex justify-end"><div className="bg-muted max-w-[85%] rounded-2xl rounded-br-sm px-3 py-2 text-sm">{m.text}</div></div>;
  }
  if (m.kind === "note") {
    return <div className="text-muted-foreground text-center text-xs">{m.text}</div>;
  }
  if (m.kind === "agent") {
    const a = agentOf(m.agent);
    return (
      <div className="space-y-2">
        <div className="text-muted-foreground flex items-center gap-1.5 text-xs"><BotIcon className="size-3.5" />{a.name}</div>
        {m.steps?.length ? (
          <Collapsible defaultOpen={!!m.pending} className="relative">
            {/* C5.6 Action steps */}
            <Num n="C5.6" className="absolute -top-2 right-0" />
            <CollapsibleTrigger className="text-muted-foreground hover:text-foreground group flex items-center gap-1 text-xs">
              <ChevronRightIcon className="size-3.5 transition-transform group-data-[state=open]:rotate-90" />
              {m.pending ? <span className="animate-pulse">Thinking</span> : m.took}
              <span className="text-muted-foreground/70">· {m.steps.length} {m.steps.length === 1 ? "step" : "steps"}</span>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <ul className="mt-1.5 space-y-1 border-l pl-3">
                {m.steps.map((s, i) => {
                  const Icon = STEP_ICON[s.icon];
                  return <li key={i} className="text-muted-foreground flex items-center gap-2 text-xs"><Icon className={cn("size-3.5 shrink-0", m.pending && "animate-pulse")} /><span className="truncate">{s.label}</span></li>;
                })}
              </ul>
            </CollapsibleContent>
          </Collapsible>
        ) : null}
        {m.pending ? null : <p className="text-sm leading-relaxed">{m.text}</p>}
      </div>
    );
  }
  if (m.kind === "checkpoint") {
    return (
      <div className="relative flex items-center gap-2">
        {/* C5.7 Checkpoint */}
        <Num n="C5.7" className="absolute -top-2 left-0" />
        <span className="bg-border h-px flex-1" />
        <span className="text-muted-foreground min-w-0 truncate text-[11px]">{m.label} · {m.when}</span>
        <Button variant="ghost" size="xs" onClick={() => onRollBack(m.id)}><RotateCcwIcon />Roll back here</Button>
        <span className="bg-border h-px w-3" />
      </div>
    );
  }
  if (m.kind === "held") {
    return (
      <div className="relative">
        {/* C5.8 Held draft (C11) */}
        <Num n="C5.8" className="absolute -top-2 left-2 z-10" />
        <HeldCard who={m.who} what={m.what} detail={m.detail} />
      </div>
    );
  }
  return (
    <div className="relative space-y-1.5">
      {/* C5.9 Suggested next */}
      <Num n="C5.9" className="absolute -top-1 right-0" />
      <div className="text-muted-foreground text-xs">Suggested next</div>
      <ul className="divide-y rounded-lg border">
        {m.items.map((t) => (
          <li key={t} className="flex items-center gap-2 px-3 py-2">
            <span className="min-w-0 flex-1 text-sm">{t}</span>
            {started.includes(t)
              ? <span className="text-muted-foreground flex items-center gap-1 text-xs"><CheckIcon className="size-3.5" />Started</span>
              : <Button variant="outline" size="xs" onClick={() => onStart(t)}>Start</Button>}
          </li>
        ))}
      </ul>
    </div>
  );
}
