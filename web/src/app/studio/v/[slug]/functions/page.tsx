"use client";

// V11 Functions: the 13 functions of the venture as a tools grid (Replit's Tools anatomy), grouped Build, Sell, Run, Keep.
import Link from "next/link";
import { use, useState } from "react";
import { BotIcon, PlusIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Num, StatusDot } from "@/components/studio/bits";
import { ScreenHead } from "@/components/studio/shell";
import { AGENTS, FUNCTIONS, fnOf, ventureHref, ventureOf, type FunctionId } from "@/components/studio/data";
import { FN_DETAIL, FN_GROUPS, fnsAt, levelFor } from "@/components/studio/connect-data";

export default function FunctionsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const v = ventureOf(slug);
  const [on, setOn] = useState<FunctionId[]>(() => fnsAt(v.commitment));
  const [onlyUsed, setOnlyUsed] = useState(false);
  const [adding, setAdding] = useState(false);
  const [pick, setPick] = useState<FunctionId | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const off = FUNCTIONS.filter((f) => !on.includes(f.id));

  const turnOn = () => {
    if (!pick) return;
    setOn((o) => [...o, pick]);
    setNote(`${fnOf(pick).label} is on. Its tools and records folder are ready, and its agent will introduce itself in the chat.`);
    setAdding(false);
    setPick(null);
  };

  return (
    <div className="pb-16">
      <ScreenHead n="V11" title="Functions" job={`The 13 functions of ${v.name} and the tools each one needs.`}>
        <Button onClick={() => setAdding(true)}><PlusIcon />Turn on a function</Button>
      </ScreenHead>

      <div className="space-y-6 px-4 md:px-8">
        <div className="relative flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
          <Num n="V11.1" className="absolute -top-2 left-2" />
          <div className="min-w-0 text-sm">
            <span className="font-medium">{on.length} of 13 on.</span>{" "}
            <span className="text-muted-foreground">At <span className="capitalize">{v.commitment}</span>, {v.name} needs {fnsAt(v.commitment).length}. More turn on as it grows.</span>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={onlyUsed} onCheckedChange={setOnlyUsed} aria-label="Only functions this venture uses" />
            Only what this venture uses
          </label>
        </div>

        {note ? <p className="relative rounded-lg border border-emerald-600/30 bg-emerald-600/5 p-3 text-sm">{note}</p> : null}

        {FN_GROUPS.map((g, gi) => {
          const fns = g.fns.filter((id) => !onlyUsed || on.includes(id));
          if (!fns.length) return null;
          return (
            <section key={g.label} className="relative">
              <Num n={`V11.${gi + 2}`} className="absolute -top-2 right-0" />
              <div className="mb-2 flex items-baseline gap-2">
                <h2 className="text-sm font-semibold">{g.label}</h2>
                <span className="text-muted-foreground text-xs">{g.line}</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {fns.map((id) => <FnTile key={id} id={id} slug={slug} isOn={on.includes(id)} />)}
              </div>
            </section>
          );
        })}
      </div>

      <Dialog open={adding} onOpenChange={setAdding}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Turn on a function</DialogTitle>
            <DialogDescription>Turning one on gives it a records folder, its tools and, where there is one, its agent.</DialogDescription>
          </DialogHeader>
          {off.length ? (
            <ul className="max-h-[50vh] divide-y overflow-y-auto rounded-lg border">
              {off.map((f) => {
                const agent = AGENTS.find((a) => a.fn === f.id);
                return (
                  <li key={f.id}>
                    <button type="button" onClick={() => setPick(f.id)} aria-pressed={pick === f.id}
                      className={cn("flex w-full items-start gap-3 p-3 text-left", pick === f.id ? "bg-accent" : "hover:bg-accent/50")}>
                      <span className={cn("mt-1 size-3 shrink-0 rounded-full border", pick === f.id && "border-foreground bg-foreground")} />
                      <span className="min-w-0">
                        <span className="block text-sm font-medium">{f.label}</span>
                        <span className="text-muted-foreground block text-xs">Usually from <span className="capitalize">{levelFor(f.id)}</span>. {agent ? `${agent.name} comes with it.` : "No agent yet."} Tools: {f.tools.join(", ")}.</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : <p className="text-muted-foreground text-sm">Every function is already on.</p>}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAdding(false)}>Cancel</Button>
            <Button onClick={turnOn} disabled={!pick}>{pick ? `Turn on ${fnOf(pick).short}` : "Pick a function"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FnTile({ id, slug, isOn }: { id: FunctionId; slug: string; isOn: boolean }) {
  const f = fnOf(id);
  const d = FN_DETAIL[id];
  const agent = AGENTS.find((a) => a.fn === id);
  const pct = Math.round((d.automated / d.tasks) * 100);
  return (
    <Link href={ventureHref(slug, `functions/${id}`)} className={cn("hover:bg-accent/40 flex flex-col gap-3 rounded-lg border p-4 transition-colors", !isOn && "border-dashed")}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-sm font-semibold">{f.label}</div>
          <div className="text-muted-foreground mt-0.5 flex items-center gap-1.5 text-xs">
            <BotIcon className="size-3.5" />
            {agent ? <><span className="truncate">{agent.name}</span><StatusDot status={agent.status} label={false} /></> : <span>No agent yet</span>}
          </div>
        </div>
        <span className={cn("shrink-0 text-xs", isOn ? "font-medium" : "text-muted-foreground")}>{isOn ? "On" : "Off"}</span>
      </div>
      <div className="space-y-1">
        <div className="text-muted-foreground flex justify-between text-xs"><span>{d.automated} of {d.tasks} tasks automated</span><span>{pct}%</span></div>
        <div className="bg-muted h-1 overflow-hidden rounded-full"><div className="bg-foreground h-full" style={{ width: `${pct}%` }} /></div>
      </div>
      <div className="flex flex-wrap gap-1">
        {f.tools.map((t) => <span key={t} className="bg-muted rounded px-1.5 py-0.5 text-xs">{t}</span>)}
      </div>
    </Link>
  );
}
