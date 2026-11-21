"use client";

import Link from "next/link";
import { useOptimistic, useState, useTransition } from "react";
import type { FirstProject } from "@reflect/core/crafts";
import { CheckIcon, PlusIcon } from "lucide-react";
import { Face } from "@/components/dash";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { craftActAction, setCraftLearnedAction, setCraftStageAction, setCraftStateAction, setCraftVouchAction } from "../actions";

type Choice = { id: string; label: string };

/** The Dreyfus five steps as one line: each step a tap that sets where the person is. */
export function StageLine({ craft, stages, stage }: { craft: string; stages: readonly Choice[]; stage: string | null }) {
  const [shown, setShown] = useOptimistic(stage);
  const [, start] = useTransition();
  const at = stages.findIndex((s) => s.id === shown);
  return (
    <ol className="grid grid-cols-5 gap-1" aria-label="Where you are">
      {stages.map((s, i) => (
        <li key={s.id} className="grid">
          <button
            type="button"
            aria-pressed={s.id === shown}
            onClick={() => start(async () => { setShown(s.id); await setCraftStageAction(craft, s.id); })}
            className="group grid gap-1.5 rounded-md py-1 text-left focus-visible:outline-2"
          >
            <span className={cn("h-1.5 rounded-full transition", i <= at ? "bg-primary" : "bg-muted group-hover:bg-primary/30")} />
            <span className={cn("text-xs leading-tight", s.id === shown ? "text-foreground font-semibold" : "text-muted-foreground")}>{s.label}</span>
          </button>
        </li>
      ))}
    </ol>
  );
}

/** How the craft was learned: tap each that is true, several at once. */
export function LearnedChoices({ craft, choices, how }: { craft: string; choices: readonly Choice[]; how: string[] }) {
  const [shown, setShown] = useOptimistic(how);
  const [, start] = useTransition();
  const toggle = (id: string) => start(async () => {
    const next = shown.includes(id) ? shown.filter((x) => x !== id) : [...shown, id];
    setShown(next);
    await setCraftLearnedAction(craft, next);
  });
  return (
    <div className="flex flex-wrap gap-2">
      {choices.map((c) => {
        const on = shown.includes(c.id);
        return (
          <Button key={c.id} type="button" size="sm" variant="outline" aria-pressed={on} onClick={() => toggle(c.id)} className={cn(on && "border-primary bg-primary/10")}>
            {on ? <CheckIcon /> : null}{c.label}
          </Button>
        );
      })}
    </div>
  );
}

/** Who vouches: the person's Reflect friends as faces with names, each a tap to vouch or not. */
export function VouchFaces({ craft, friends, vouch }: { craft: string; friends: { id: string; name: string }[]; vouch: string[] }) {
  const [shown, setShown] = useOptimistic(vouch);
  const [, start] = useTransition();
  const toggle = (id: string) => start(async () => {
    const next = shown.includes(id) ? shown.filter((x) => x !== id) : [...shown, id];
    setShown(next);
    await setCraftVouchAction(craft, next);
  });
  return (
    <ul className="flex flex-wrap gap-4">
      {friends.map((f) => {
        const on = shown.includes(f.id);
        return (
          <li key={f.id}>
            <button type="button" aria-pressed={on} onClick={() => toggle(f.id)} className="grid w-16 justify-items-center gap-1 text-center">
              <span className={cn("relative rounded-full", on ? "ring-primary ring-2 ring-offset-2" : "opacity-60")}>
                <Face name={f.name} size={44} />
                {on ? <CheckIcon aria-hidden className="bg-primary text-primary-foreground absolute -right-1 -bottom-1 size-4 rounded-full p-0.5" /> : null}
              </span>
              <span className={cn("w-full truncate text-xs", on ? "font-medium" : "text-muted-foreground")}>{f.name}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/** Add something the person made with the craft: a short name for it, kept as an act. Long writing is the journal's. */
export function AddMade({ craft, label }: { craft: string; label: string }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [pending, start] = useTransition();
  const save = () => start(async () => {
    await craftActAction(craft, "made", name.trim());
    setName("");
    setOpen(false);
  });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button"><PlusIcon />Add something you made</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>What did you make?</DialogTitle>
          <DialogDescription>A short name, such as &quot;Oak side table&quot;. Write about it in your journal if you want to say more.</DialogDescription>
        </DialogHeader>
        <Input aria-label={`What you made with ${label.toLowerCase()}`} value={name} maxLength={300} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && name.trim()) save(); }} autoFocus />
        <DialogFooter>
          <Button type="button" onClick={save} disabled={!name.trim() || pending}>Keep it</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * The craft's first project (Scholē picker design guide): about ten minutes, what it needs, and Start the first
 * project, which opens its steps. Filled when it is the screen's one primary, else outline.
 */
export function FirstProjectCard({ href, project, primary }: { href: string; project: FirstProject; primary: boolean }) {
  return (
    <section aria-labelledby="first-project" className="bg-card grid gap-2 rounded-xl border p-4 sm:p-5">
      <span className="text-muted-foreground text-xs font-medium">First project, {project.minutes} minutes</span>
      <h2 id="first-project" className="text-lg leading-snug font-semibold tracking-tight">{project.name}</h2>
      {project.needs ? <p className="text-muted-foreground text-sm">You need: {project.needs}</p> : null}
      <div className="pt-1">
        <Button asChild size="lg" variant={primary ? "default" : "outline"} className="h-10 w-full sm:w-auto sm:px-8"><Link href={href}>Start the first project</Link></Button>
      </div>
    </section>
  );
}

/** After three tries: does the person practise it now? Yes moves it to practising, the screen's one filled button. */
export function PractiseNow({ craft, label, tried }: { craft: string; label: string; tried: number }) {
  const [pending, start] = useTransition();
  return (
    <section aria-labelledby="practise-now" className="bg-primary/5 border-primary/30 grid gap-2 rounded-xl border p-4 sm:p-5">
      <h2 id="practise-now" className="text-lg leading-snug font-semibold tracking-tight">Do you practise this now?</h2>
      <p className="text-muted-foreground text-sm">You have tried {label.toLowerCase()} {tried} times. If it is part of your life now, say so and Work keeps where you are with it.</p>
      <div className="pt-1">
        <Button type="button" size="lg" disabled={pending} onClick={() => start(async () => { await setCraftStateAction(craft, "practising"); })} className="h-10 w-full sm:w-auto sm:px-8">Yes, I practise it</Button>
      </div>
    </section>
  );
}
