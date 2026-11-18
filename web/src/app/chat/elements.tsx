"use client";

// Ask's AI Elements, built as shadcn/ui's AI Elements patterns say (ui.shadcn.com/docs/ai-elements), on Trace,
// Code Block, Marker, Hover Card, Progress and Dropdown Menu. Each export names the pattern it follows.
import * as React from "react";
import type { ToolUIPart, UIMessage } from "ai";
import {
  ArrowUpRightIcon,
  BookOpenIcon,
  CheckIcon,
  ChevronDownIcon,
  CircleCheckIcon,
  CircleXIcon,
  LoaderCircleIcon,
  SparklesIcon,
  WrenchIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CodeBlock, CodeBlockContent } from "@/components/ui/code-block";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { InputGroupButton } from "@/components/ui/input-group";
import { Marker, MarkerContent } from "@/components/ui/marker";
import { Progress } from "@/components/ui/progress";
import {
  Trace,
  TraceCollapsible,
  TraceCollapsibleContent,
  TraceCollapsibleTrigger,
  TraceDescription,
  TraceIcon,
  TraceLine,
  TraceTitle,
} from "@/components/ui/trace";
import { CHAT_MODELS } from "@/lib/chat-models";

/** What a tool did, in words: Reflect's own titles, else its id as a sentence ("add_event" is "Add event"). */
const DONE: Record<string, string> = {
  show_shelves: "Looked at your shelves",
  show_ways: "Looked at your ways of learning",
  show_claims: "Looked at your claims",
  search_library: "Searched the library",
  browse_category: "Browsed the library",
  find_item: "Looked for it",
  quote_book: "Found the passage",
  quote_transcript: "Found the passage",
  calendar: "Read your calendar",
  add_event: "Added it to your calendar",
  add_events: "Added them to your calendar",
  lenses: "Looked at the thinkers",
  lens: "Read a thinker's ideas",
  apply_lens: "Read a thinker's ideas",
  propose_claim: "Proposed a claim",
  find_actions: "Looked for what Reflect can do",
  act: "Did it in Reflect",
  start_plan: "Started a plan",
  plans: "Looked at your plans",
};
const sentence = (id: string) => {
  const s = id.replace(/_/g, " ");
  return s.charAt(0).toUpperCase() + s.slice(1);
};
const toolId = (p: ToolUIPart) => p.type.slice(5);
const doneTitle = (p: ToolUIPart) => {
  const id = toolId(p);
  if (id === "act") {
    const action = (p.input as { action?: unknown } | undefined)?.action;
    if (typeof action === "string") return sentence(action);
  }
  return DONE[id] ?? sentence(id);
};
const text = (v: unknown) => (typeof v === "string" ? v : JSON.stringify(v, null, 2));

type Step = { kind: "reasoning"; text: string; streaming: boolean } | { kind: "tool"; part: ToolUIPart };

/** The steps of an answer: its reasoning and tool parts, in order. */
export function stepsOf(message: UIMessage): Step[] {
  const steps: Step[] = [];
  for (const part of message.parts) {
    if (part.type === "reasoning" && part.text.trim()) steps.push({ kind: "reasoning", text: part.text, streaming: part.state === "streaming" });
    else if (part.type.startsWith("tool-")) steps.push({ kind: "tool", part: part as ToolUIPart });
  }
  return steps;
}

/** Reasoning: "Thinking" while the model thinks, open; "Thought" after, closed unless the person opens it. */
function ReasoningLine({ text: words, running }: { text: string; running: boolean }) {
  const [open, setOpen] = React.useState<boolean>();
  const line = (
    <TraceLine status={running ? "running" : undefined}>
      <TraceIcon>{running ? <LoaderCircleIcon className="animate-spin" /> : <SparklesIcon />}</TraceIcon>
      <TraceTitle>{running ? "Thinking" : "Thought"}</TraceTitle>
    </TraceLine>
  );
  return (
    <TraceCollapsible open={open ?? running} onOpenChange={setOpen}>
      <TraceCollapsibleTrigger>{line}</TraceCollapsibleTrigger>
      <TraceCollapsibleContent className="whitespace-pre-wrap">{words}</TraceCollapsibleContent>
    </TraceCollapsible>
  );
}

/** Tool (and Stack Trace for one that failed): a line while it runs, then what it read and what came back. */
function ToolLine({ part, streaming }: { part: ToolUIPart; streaming: boolean }) {
  const title = doneTitle(part);
  if (part.state === "input-streaming" || part.state === "input-available") {
    return (
      <TraceLine status={streaming ? "running" : "error"}>
        <TraceIcon>{streaming ? <LoaderCircleIcon className="animate-spin" /> : <CircleXIcon />}</TraceIcon>
        <TraceTitle>{streaming ? `${sentence(toolId(part))}…` : `Didn't finish: ${title}`}</TraceTitle>
      </TraceLine>
    );
  }
  if (part.state === "output-denied") {
    return (
      <TraceLine>
        <TraceIcon><CircleXIcon /></TraceIcon>
        <TraceTitle>Declined: {title}</TraceTitle>
      </TraceLine>
    );
  }
  if (part.state === "output-error") {
    // Stack Trace: the title truncates, so the full error leads the content.
    const [first, ...rest] = String(part.errorText ?? "Something went wrong.").split("\n").map((l) => l.trim());
    return (
      <TraceCollapsible>
        <TraceCollapsibleTrigger>
          <TraceLine status="error">
            <TraceIcon><CircleXIcon /></TraceIcon>
            <TraceTitle>Failed: {title}</TraceTitle>
          </TraceLine>
        </TraceCollapsibleTrigger>
        <TraceCollapsibleContent>
          <div className="bg-muted flex flex-col gap-2 rounded-md p-3 font-mono text-xs">
            <p className="text-destructive">{first}</p>
            {rest.length ? <ol className="text-muted-foreground">{rest.map((f, i) => <li key={i}>{f}</li>)}</ol> : null}
          </div>
        </TraceCollapsibleContent>
      </TraceCollapsible>
    );
  }
  if (part.state !== "output-available") {
    return (
      <TraceLine>
        <TraceIcon><WrenchIcon /></TraceIcon>
        <TraceTitle>{title}</TraceTitle>
      </TraceLine>
    );
  }
  const input = part.input && typeof part.input === "object" && Object.keys(part.input).length ? text(part.input) : null;
  return (
    <TraceCollapsible>
      <TraceCollapsibleTrigger>
        <TraceLine>
          <TraceIcon><CircleCheckIcon /></TraceIcon>
          <TraceTitle>{title}</TraceTitle>
        </TraceLine>
      </TraceCollapsibleTrigger>
      <TraceCollapsibleContent className="flex flex-col gap-2">
        {input ? (
          <CodeBlock size="sm">
            <CodeBlockContent wrap className="max-h-40">{input}</CodeBlockContent>
          </CodeBlock>
        ) : null}
        <CodeBlock size="sm">
          <CodeBlockContent wrap className="max-h-64">{text(part.output)}</CodeBlockContent>
        </CodeBlock>
      </TraceCollapsibleContent>
    </TraceCollapsible>
  );
}

function StepLine({ step, streaming }: { step: Step; streaming: boolean }) {
  return step.kind === "reasoning" ? <ReasoningLine text={step.text} running={streaming && step.streaming} /> : <ToolLine part={step.part} streaming={streaming} />;
}

/**
 * Chain of Thought and Task: one or two steps show as lines; more fold into "Worked in N steps", open while the
 * answer streams, so a long turn reads as one summary with the steps under it.
 */
export function Steps({ steps, streaming }: { steps: Step[]; streaming: boolean }) {
  const [open, setOpen] = React.useState<boolean>();
  if (!steps.length) return null;
  if (steps.length <= 2) {
    return <Trace>{steps.map((s, i) => <StepLine key={i} step={s} streaming={streaming} />)}</Trace>;
  }
  const failed = steps.some((s) => s.kind === "tool" && s.part.state === "output-error");
  return (
    <Trace>
      <TraceCollapsible open={open ?? streaming} onOpenChange={setOpen}>
        <TraceCollapsibleTrigger>
          <TraceLine status={streaming ? "running" : undefined}>
            <TraceIcon>{streaming ? <LoaderCircleIcon className="animate-spin" /> : <CircleCheckIcon />}</TraceIcon>
            <TraceTitle>{streaming ? "Working" : `Worked in ${steps.length} steps`}</TraceTitle>
            {failed ? <TraceDescription>one failed</TraceDescription> : null}
          </TraceLine>
        </TraceCollapsibleTrigger>
        <TraceCollapsibleContent>
          <Trace>{steps.map((s, i) => <StepLine key={i} step={s} streaming={streaming} />)}</Trace>
        </TraceCollapsibleContent>
      </TraceCollapsible>
    </Trace>
  );
}

/** Sources: the passages in Reflect an answer drew on, folded under "Used N sources". */
export function Sources({ message }: { message: UIMessage }) {
  const sources = message.parts.flatMap((p) => (p.type === "source-url" ? [{ url: p.url, title: p.title ?? p.url }] : []));
  if (!sources.length) return null;
  return (
    <Trace>
      <TraceCollapsible>
        <TraceCollapsibleTrigger>
          <TraceLine>
            <TraceIcon><BookOpenIcon /></TraceIcon>
            <TraceTitle>Used {sources.length} {sources.length === 1 ? "source" : "sources"}</TraceTitle>
          </TraceLine>
        </TraceCollapsibleTrigger>
        <TraceCollapsibleContent>
          <Trace>
            {sources.map((s) => (
              <a key={s.url} href={s.url}>
                <TraceLine>
                  <TraceIcon><BookOpenIcon /></TraceIcon>
                  <TraceTitle>{s.title}</TraceTitle>
                  <TraceIcon><ArrowUpRightIcon /></TraceIcon>
                </TraceLine>
              </a>
            ))}
          </Trace>
        </TraceCollapsibleContent>
      </TraceCollapsible>
    </Trace>
  );
}

/** Inline Citation: a cited source inside a line, opening on hover with where it is in Reflect. */
export function InlineCitation({ label, href }: { label: string; href: string }) {
  return (
    <HoverCard openDelay={10} closeDelay={100}>
      <HoverCardTrigger asChild>
        <Button asChild variant="secondary" size="xs" className="mx-0.5 align-baseline">
          <a href={href}>{label.length > 28 ? `${label.slice(0, 27)}…` : label}</a>
        </Button>
      </HoverCardTrigger>
      <HoverCardContent className="flex w-64 flex-col gap-1 text-sm">
        <div className="font-medium">{label}</div>
        <a href={href} className="text-muted-foreground underline underline-offset-4">Open the passage in Reflect</a>
      </HoverCardContent>
    </HoverCard>
  );
}

/** Context: how much of the model's context window this conversation has used, from the last answer's tokens. */
export function ContextMeter({ messages, model }: { messages: UIMessage[]; model: string }) {
  const last = [...messages].reverse().find((m) => m.role === "assistant" && (m.metadata as { usage?: unknown } | undefined)?.usage);
  const usage = (last?.metadata as { usage?: { inputTokens?: number; outputTokens?: number } } | undefined)?.usage;
  if (!usage) return null;
  const limit = (CHAT_MODELS.find((m) => m.id === model) ?? CHAT_MODELS[0]).context;
  const used = (usage.inputTokens ?? 0) + (usage.outputTokens ?? 0);
  const percent = Math.min(100, Math.round((used / limit) * 100));
  return (
    <HoverCard openDelay={10} closeDelay={100}>
      <HoverCardTrigger asChild>
        <InputGroupButton size="sm" variant="ghost" className="text-muted-foreground">{used > 0 && percent < 1 ? "<1" : percent}% context</InputGroupButton>
      </HoverCardTrigger>
      <HoverCardContent className="flex w-64 flex-col gap-3">
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="font-medium">Context</span>
          <span className="text-muted-foreground">{used.toLocaleString("en-US")} / {limit.toLocaleString("en-US")}</span>
        </div>
        <Progress value={percent} aria-label="Context used" />
        <p className="text-muted-foreground text-xs">How much of what the model can hold at once this conversation fills. A new chat starts empty.</p>
      </HoverCardContent>
    </HoverCard>
  );
}

/** Model Selector: which model answers. Models the gateway refuses until Reflect buys credits are listed, shut. */
export function ModelMenu({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const current = CHAT_MODELS.find((m) => m.id === value) ?? CHAT_MODELS[0];
  const makers = [...new Set(CHAT_MODELS.map((m) => m.maker))];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <InputGroupButton size="sm" variant="ghost" aria-label="Model">
          {current.label}
          <ChevronDownIcon />
        </InputGroupButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        {makers.map((maker) => (
          <DropdownMenuGroup key={maker}>
            <DropdownMenuLabel>{maker}</DropdownMenuLabel>
            {CHAT_MODELS.filter((m) => m.maker === maker).map((m) => (
              <DropdownMenuItem key={m.id} disabled={!m.open} onSelect={() => onChange(m.id)} className="flex items-start justify-between gap-2">
                <span className="flex flex-col">
                  <span>{m.label}</span>
                  <span className="text-muted-foreground text-xs">{m.note}</span>
                </span>
                {m.id === current.id ? <CheckIcon className="mt-0.5 size-4" /> : null}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Checkpoint: a point in the conversation to return to. It brings the chat back, not records it changed. */
export function Checkpoint({ onRestore, disabled }: { onRestore: () => void; disabled: boolean }) {
  return (
    <Marker variant="separator" className="opacity-0 transition-opacity hover:opacity-100 focus-within:opacity-100">
      <MarkerContent className="inline-flex items-center gap-2 text-xs">
        Conversation to here
        <Button size="xs" variant="outline" disabled={disabled} onClick={onRestore}>Restore</Button>
      </MarkerContent>
    </Marker>
  );
}
