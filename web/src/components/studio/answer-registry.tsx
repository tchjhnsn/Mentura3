"use client";

// How each piece of an agent's answer looks (answer-catalog.ts). Parts are numbered C18 to C22.
import { useState } from "react";
import Link from "next/link";
import { CheckIcon, CircleDotIcon, CircleIcon, FileTextIcon, LoaderIcon } from "lucide-react";
import { defineRegistry } from "@json-render/react";
import type { Spec, UIElement } from "@json-render/core";
import { cn } from "@/lib/utils";
import { HeldCard, Num } from "./bits";
import { RUNS } from "./data";
import { RunRow } from "./run-row";
import { answerCatalog } from "./answer-catalog";
import { recordAt } from "./records";
import { leadOf, nextPhase, phaseLabel, phaseOf } from "./phase";
import { businessHref } from "./data";
import { useTeamSlug } from "@/components/studio/team";

/** C18 Record: a record read as a document, with its JSON behind a toggle. */
function RecordPiece({ slug, path, title, lines }: { slug: string; path: string; title: string; lines: string[] }) {
  const team = useTeamSlug() ?? "";
  const [json, setJson] = useState(false);
  const rec = recordAt(slug, path) ?? { id: path, venture: slug, title, lines };
  return (
    <div className="bg-card relative rounded-lg border">
      <Num n="C18" className="absolute -top-2 right-2" />
      <div className="flex items-center gap-2 border-b px-3 py-2">
        <FileTextIcon className="text-muted-foreground size-4 shrink-0" />
        <Link href={businessHref(team, slug, `files/${path}`)} className="min-w-0 flex-1 truncate text-sm font-medium hover:underline">{title}</Link>
        <div className="bg-muted flex shrink-0 rounded-md p-0.5 text-xs">
          <button type="button" onClick={() => setJson(false)} className={cn("rounded px-2 py-0.5", !json && "bg-background shadow-xs")}>Document</button>
          <button type="button" onClick={() => setJson(true)} className={cn("rounded px-2 py-0.5", json && "bg-background shadow-xs")}>Record</button>
        </div>
      </div>
      {json ? (
        <pre className="max-h-64 overflow-auto px-3 py-2 font-mono text-xs leading-relaxed">{JSON.stringify(rec, null, 2)}</pre>
      ) : (
        <div className="space-y-1.5 px-3 py-2.5 text-sm">{lines.map((l) => <p key={l}>{l}</p>)}<p className="text-muted-foreground pt-1 font-mono text-[11px]">{path}</p></div>
      )}
    </div>
  );
}

/** C19 Next phase: the exit criteria, short form. The full list sits in the phase bar (C16). */
function NextPhasePiece({ slug }: { slug: string }) {
  const s = phaseOf(slug);
  const next = nextPhase(s.phase);
  return (
    <div className="bg-card relative rounded-lg border px-3 py-2.5">
      <Num n="C19" className="absolute -top-2 right-2" />
      <div className="text-sm font-medium">{next ? `To reach ${phaseLabel(next)}` : "Last phase"}</div>
      <ul className="mt-1.5 space-y-1.5">
        {s.criteria.map((c) => (
          <li key={c.id} className="flex gap-2 text-sm">
            {c.met ? <CheckIcon className="mt-0.5 size-4 shrink-0" /> : <CircleIcon className="text-muted-foreground mt-0.5 size-4 shrink-0" />}
            <span className={cn(c.met && "text-muted-foreground")}>{c.statement}{!c.met ? <span className="text-muted-foreground"> · {leadOf(c.owner).name}</span> : null}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const STEP_ICON = { Done: CheckIcon, Running: LoaderIcon, Next: CircleIcon, "Waiting for you": CircleDotIcon } as const;

/** C20 Plan: who is doing what. C21 Choice: a call that is the person's. C22 Runs. */
export const { registry: answerRegistry } = defineRegistry(answerCatalog, {
  components: {
    Stack: ({ children }) => <div className="flex flex-col gap-2.5">{children}</div>,
    Note: ({ props }) => <p className="text-sm leading-relaxed">{props.text}</p>,
    Record: ({ props }) => <RecordPiece {...props} />,
    NextPhase: ({ props }) => <NextPhasePiece slug={props.slug} />,
    Held: ({ props }) => <HeldCard who={props.who} what={props.what} detail={props.detail} />,
    Plan: ({ props }) => (
      <div className="bg-card relative rounded-lg border px-3 py-2.5">
        <Num n="C20" className="absolute -top-2 right-2" />
        <div className="text-sm font-medium">{props.title}</div>
        <ol className="mt-1.5 space-y-1.5">
          {props.steps.map((s) => {
            const Icon = STEP_ICON[s.status];
            return (
              <li key={s.title} className="flex items-start gap-2 text-sm">
                <Icon className={cn("mt-0.5 size-4 shrink-0", s.status === "Running" && "animate-spin", s.status === "Next" && "text-muted-foreground", s.status === "Waiting for you" && "text-fuchsia-600")} />
                <span className="min-w-0 flex-1">{s.title}<span className="text-muted-foreground"> · {s.who}</span></span>
                {s.status === "Waiting for you" ? <span className="shrink-0 text-xs font-medium text-fuchsia-600">You</span> : null}
              </li>
            );
          })}
        </ol>
      </div>
    ),
    Choice: ({ props }) => <ChoicePiece {...props} />,
    Runs: ({ props }) => (
      <div className="bg-card relative divide-y rounded-lg border">
        <Num n="C22" className="absolute -top-2 right-2" />
        {RUNS.slice(0, 4).map((r) => <RunRow key={r.id} run={{ ...r, venture: props.slug }} />)}
      </div>
    ),
  },
});

function ChoicePiece({ question, why, options }: { question: string; why: string; options: string[] }) {
  const [picked, setPicked] = useState<string | null>(null);
  return (
    <div className="relative rounded-lg border border-fuchsia-600/30 bg-fuchsia-600/5 px-3 py-2.5">
      <Num n="C21" className="absolute -top-2 right-2" />
      <div className="text-sm font-medium">{question}</div>
      <p className="text-muted-foreground mt-0.5 text-xs">{why}</p>
      {picked ? <p className="mt-2 text-sm">You chose <span className="font-medium">{picked}</span>. It is recorded as your decision.</p> : (
        <div className="mt-2 flex flex-wrap gap-2">{options.map((o) => <button key={o} type="button" onClick={() => setPicked(o)} className="hover:bg-accent rounded-md border px-2.5 py-1 text-xs">{o}</button>)}</div>
      )}
    </div>
  );
}

/** One spec from a list of pieces, the shape json-render renders. */
export function specOf(pieces: { type: string; props: Record<string, unknown> }[]): Spec {
  const elements: Record<string, UIElement> = {};
  const root: string[] = [];
  pieces.forEach((p, i) => { const key = `p${i}`; elements[key] = { type: p.type, props: p.props, children: [] }; root.push(key); });
  elements.root = { type: "Stack", props: {}, children: root };
  return { root: "root", elements };
}
