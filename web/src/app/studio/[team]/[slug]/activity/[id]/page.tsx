"use client";

// V10 Run: one agent run step by step, with checkpoints and rollback.
import { use, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeftIcon, BrainIcon, CheckIcon, ChevronRightIcon, FileIcon, FilePenIcon, HandIcon, RotateCcwIcon, WrenchIcon, ZapIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { HeldCard, Num, StatusDot } from "@/components/studio/bits";
import { ScreenHead } from "@/components/studio/shell";
import { agentOf, fnOf, businessHref } from "@/components/studio/data";
import { detailOf, runById, type Step } from "@/components/studio/activity-data";
import { cn } from "@/lib/utils";
import { useTeamSlug } from "@/components/studio/team";

const WORD = { running: "Running", done: "Done", held: "Held for you", failed: "Failed" } as const;
const TONE = { running: "text-emerald-600", done: "text-muted-foreground", held: "text-fuchsia-600", failed: "text-red-600" } as const;

export default function RunPage({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const team = useTeamSlug() ?? "";
  const { slug, id } = use(params);
  const run = runById(id);
  const detail = detailOf(run);
  const agent = agentOf(run.agent);

  const [decision, setDecision] = useState<"yes" | "no" | null>(null);
  const [confirm, setConfirm] = useState<{ id: string; label: string } | null>(null);
  const [rolledTo, setRolledTo] = useState<string | null>(null);
  const [rerun, setRerun] = useState(false);
  const isHeld = run.status === "held" && decision === null;
  const status = decision === "yes" ? "Approved" : decision === "no" ? "Sent back" : WORD[run.status];

  return (
    <div className="pb-10">
      <div className="px-4 pt-4 md:px-8">
        <Link href={businessHref(team, slug, "activity")} className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"><ArrowLeftIcon className="size-4" />Activity</Link>
      </div>
      <ScreenHead n="V10" title={run.title} job={`${agent.name} · run ${run.id}`}>
        <Button variant="outline" onClick={() => setRerun(true)} disabled={rerun}><RotateCcwIcon />{rerun ? "Rerun queued" : "Rerun"}</Button>
        {isHeld ? <Button onClick={() => setDecision("yes")}><CheckIcon />Approve</Button> : null}
      </ScreenHead>

      <div className="space-y-6 px-4 md:px-8">
        {rerun ? <p className="rounded-md border px-3 py-2 text-sm">Rerun queued as r-{Number(run.id.slice(2)) + 10}. It starts from the same trigger and shows up in Activity.</p> : null}
        {rolledTo ? <p className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm">Rolled back to "{rolledTo}". Files changed after that point are restored to how they were.</p> : null}

        {/* V10.1 Header facts */}
        <section className="relative grid grid-cols-2 gap-x-4 gap-y-3 rounded-lg border p-4 sm:grid-cols-3 lg:grid-cols-6">
          <Num n="V10.1" className="absolute -top-2 right-2" />
          <Fact label="Agent"><span className="flex items-center gap-2"><StatusDot status={agent.status} label={false} />{agent.name}</span><span className="text-muted-foreground block text-xs">{fnOf(agent.fn).short}</span></Fact>
          <Fact label="Status"><span className={cn("font-medium", decision ? "text-foreground" : TONE[run.status])}>{status}</span></Fact>
          <Fact label="Started">{run.started}</Fact>
          <Fact label="Took">{run.took}</Fact>
          <Fact label="Cost">${run.cost.toFixed(2)}</Fact>
          <Fact label="Tokens">{detail.tokens.toLocaleString("en-US")}</Fact>
        </section>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="min-w-0 space-y-6">
            {/* V10.2 Trigger */}
            <section className="relative flex gap-3 rounded-lg border p-4">
              <Num n="V10.2" className="absolute -top-2 right-2" />
              <ZapIcon className="text-muted-foreground mt-0.5 size-4 shrink-0" />
              <div><div className="text-muted-foreground text-xs">What started it</div><p className="mt-0.5 text-sm">{detail.trigger}</p></div>
            </section>

            {/* V10.3 Step timeline */}
            <section className="relative">
              <Num n="V10.3" className="absolute -top-2 right-0" />
              <h2 className="mb-3 text-sm font-medium">Step by step</h2>
              <ol className="relative space-y-4 border-l pl-5">
                {detail.steps.map((s, i) => <StepItem key={i} step={s} slug={slug} />)}
              </ol>
            </section>
          </div>

          <div className="min-w-0 space-y-6">
            {/* V10.4 Held for you */}
            {run.status === "held" ? (
              <section className="relative">
                <Num n="V10.4" className="absolute -top-2 left-0" />
                {decision === null ? (
                  <HeldCard who={agent.name} what={run.title} detail={`Changes ${run.changed.join(", ")}. Nothing is sent until you approve.`} onYes={() => setDecision("yes")} onNo={() => setDecision("no")} />
                ) : (
                  <p className="rounded-lg border p-3 text-sm">{decision === "yes" ? "Approved. The agent carries on and sends it." : "Sent back. The agent redoes the draft with your note."}</p>
                )}
              </section>
            ) : null}

            {/* V10.5 Files changed */}
            <section className="relative rounded-lg border p-3">
              <Num n="V10.5" className="absolute -top-2 right-2" />
              <h2 className="mb-2 text-sm font-medium">Files changed</h2>
              {run.changed.length ? (
                <ul className="space-y-1">
                  {run.changed.map((p) => (
                    <li key={p}><Link href={businessHref(team, slug, `files/${p}`)} className="hover:bg-accent flex items-center gap-2 rounded-md px-2 py-1.5 text-sm"><FileIcon className="text-muted-foreground size-4 shrink-0" /><span className="truncate font-mono text-xs">{p}</span></Link></li>
                  ))}
                </ul>
              ) : <p className="text-muted-foreground text-sm">This run changed no files.</p>}
            </section>

            {/* V10.6 Checkpoints */}
            <section className="relative rounded-lg border p-3">
              <Num n="V10.6" className="absolute -top-2 right-2" />
              <h2 className="mb-2 text-sm font-medium">Checkpoints</h2>
              <ul className="space-y-2">
                {detail.checkpoints.map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-2">
                    <span className="min-w-0"><span className="block truncate text-sm">{c.label}</span><span className="text-muted-foreground text-xs">at {c.at}{rolledTo === c.label ? " · current" : ""}</span></span>
                    <Button variant="ghost" size="xs" onClick={() => setConfirm(c)} disabled={rolledTo === c.label}>Roll back to here</Button>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      </div>

      <Dialog open={confirm !== null} onOpenChange={(o) => { if (!o) setConfirm(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Roll back to this checkpoint?</DialogTitle>
            <DialogDescription>Files go back to how they were at "{confirm?.label}". Later changes from this run are undone. You can roll forward again from the next checkpoint.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild><Button variant="ghost">Keep as is</Button></DialogClose>
            <Button variant="outline" onClick={() => { if (confirm) setRolledTo(confirm.label); setConfirm(null); }}>Roll back</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return <div className="min-w-0"><div className="text-muted-foreground text-xs">{label}</div><div className="mt-0.5 truncate text-sm">{children}</div></div>;
}

const ICON = { thought: BrainIcon, tool: WrenchIcon, read: FileIcon, edit: FilePenIcon, wait: HandIcon } as const;

function StepItem({ step, slug }: { step: Step; slug: string }) {
  const team = useTeamSlug() ?? "";
  const Icon = ICON[step.kind];
  return (
    <li className="relative">
      <span className="bg-background absolute top-0.5 -left-[30px] grid size-5 place-items-center rounded-full border"><Icon className="size-3" /></span>
      <div className="text-muted-foreground text-xs">{step.at}</div>
      {step.kind === "thought" ? <p className="mt-0.5 text-sm">{step.text}</p> : null}
      {step.kind === "read" ? <p className="mt-0.5 text-sm">Read <Link href={businessHref(team, slug, `files/${step.path}`)} className="font-mono text-xs underline underline-offset-2">{step.path}</Link></p> : null}
      {step.kind === "wait" ? <p className="mt-0.5 text-sm font-medium text-fuchsia-600">Waiting for approval. <span className="text-foreground font-normal">{step.text}</span></p> : null}
      {step.kind === "tool" ? (
        <Collapsible className="mt-0.5">
          <CollapsibleTrigger asChild>
            <button type="button" className="group flex items-center gap-1 text-sm">
              <ChevronRightIcon className="size-4 transition-transform group-data-[state=open]:rotate-90" />Called <span className="font-mono text-xs">{step.name}</span>
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-2 space-y-2">
              <pre className="bg-muted/50 overflow-x-auto rounded-md p-2 font-mono text-[11px]"><span className="text-muted-foreground">input </span>{step.input}</pre>
              <pre className="bg-muted/50 overflow-x-auto rounded-md p-2 font-mono text-[11px]"><span className="text-muted-foreground">output </span>{step.output}</pre>
            </div>
          </CollapsibleContent>
        </Collapsible>
      ) : null}
      {step.kind === "edit" ? (
        <div className="mt-0.5">
          <p className="text-sm">Edited <Link href={businessHref(team, slug, `files/${step.path}`)} className="font-mono text-xs underline underline-offset-2">{step.path}</Link></p>
          <div className="mt-2 overflow-x-auto rounded-md border font-mono text-[11px] leading-5">
            {step.minus.map((l) => <div key={`m${l}`} className="bg-red-500/10 px-2 text-red-700 dark:text-red-300">- {l}</div>)}
            {step.plus.map((l) => <div key={`p${l}`} className="bg-emerald-500/10 px-2 text-emerald-700 dark:text-emerald-300">+ {l}</div>)}
          </div>
        </div>
      ) : null}
    </li>
  );
}
