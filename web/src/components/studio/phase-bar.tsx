"use client";

// C16 Phase bar: where this venture is in Naive's phases and what must be true to reach the next one.
import { useState } from "react";
import Link from "next/link";
import { CheckIcon, ChevronDownIcon, CircleIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Face, Num } from "./bits";
import { fileHrefOf } from "./records";
import { useTeamSlug } from "./team";
import { PHASES, leadOf, nextPhase, phaseLabel, phaseOf } from "./phase";

export function PhaseBar({ slug }: { slug: string }) {
  const team = useTeamSlug() ?? "";
  const start = phaseOf(slug);
  const [criteria, setCriteria] = useState(start.criteria);
  const [open, setOpen] = useState(false);
  const [moved, setMoved] = useState(false);
  const at = PHASES.findIndex((p) => p.id === start.phase);
  const next = nextPhase(start.phase);
  const met = criteria.filter((c) => c.met).length;
  return (
    <section className="bg-card relative rounded-xl border">
      <Num n="C16" className="absolute -top-2 left-3" />
      <ol className="flex items-center gap-1 overflow-hidden px-3 pt-3 sm:px-4" aria-label="Phases">
        {PHASES.map((p, k) => (
          <li key={p.id} className="flex min-w-0 flex-1 items-center gap-1">
            <span className={cn("h-1.5 flex-1 rounded-full", k < at || (moved && k === at) ? "bg-foreground" : k === at ? "bg-foreground/60" : "bg-muted")} />
          </li>
        ))}
      </ol>
      <ol className="text-muted-foreground mt-1.5 grid grid-cols-5 px-3 text-[11px] sm:px-4 sm:text-xs">
        {PHASES.map((p, k) => <li key={p.id} className={cn("truncate", k === at && "text-foreground font-semibold")}>{p.label}</li>)}
      </ol>
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="hover:bg-accent/40 mt-2 flex w-full items-center gap-3 rounded-b-xl px-3 py-2.5 text-left sm:px-4">
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium">{moved && next ? `Moved to ${phaseLabel(next)}` : next ? `To reach ${phaseLabel(next)}: ${met} of ${criteria.length} done` : "Platform is the last phase"}</span>
          <span className="text-muted-foreground block truncate text-xs">{PHASES[at]!.question}</span>
        </span>
        <ChevronDownIcon className={cn("text-muted-foreground size-4 shrink-0 transition-transform", open && "rotate-180")} />
      </button>
      {open ? (
        <div className="border-t px-3 pt-1 pb-3 sm:px-4">
          <ul className="divide-y">
            {criteria.map((c) => (
              <li key={c.id} className="flex items-start gap-3 py-2.5">
                {c.met ? <CheckIcon className="mt-0.5 size-4 shrink-0" /> : <CircleIcon className="text-muted-foreground mt-0.5 size-4 shrink-0" />}
                <div className="min-w-0 flex-1">
                  <p className={cn("text-sm", c.met && "text-muted-foreground")}>{c.statement}</p>
                  {c.met ? (
                    <p className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-2 text-xs"><Face id={c.met.by} size={16} showName={false} />Met {c.met.at}, evidence <Link href={fileHrefOf(team, slug, c.met.evidence)} className="underline">{c.met.evidence}</Link></p>
                  ) : (
                    <p className="text-muted-foreground mt-1 text-xs">{leadOf(c.owner).name} is on it{c.proposedBy ? `. ${leadOf(c.proposedBy).name} thinks it is close and will bring you the evidence.` : "."}</p>
                  )}
                </div>
                {!c.met ? (
                  <button type="button" className="hover:bg-accent shrink-0 rounded-md border px-2 py-1 text-xs"
                    onClick={() => setCriteria((cs) => cs.map((x) => (x.id === c.id ? { ...x, met: { by: "torian", at: "Just now", evidence: "noted by you" } } : x)))}>Mark met</button>
                ) : null}
              </li>
            ))}
          </ul>
          <p className="text-muted-foreground mt-2 text-xs">Only you can mark a criterion met. Agents gather the evidence and propose it.</p>
          {next && met === criteria.length && !moved ? (
            <button type="button" onClick={() => setMoved(true)} className="hover:bg-accent mt-3 rounded-md border px-3 py-1.5 text-sm font-medium">Move to {phaseLabel(next)}</button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
