"use client";

// Small shared parts of the Venture Studio, each numbered (src/components/studio/data.ts, COMPONENTS).
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { COMMITMENTS, personOf, type Agent, type Commitment } from "./data";

const NumsOn = createContext<{ on: boolean; set: (v: boolean) => void }>({ on: true, set: () => {} });
const KEY = "studio-nums";

/** Holds whether number tags show. On by default; remembered on this device only. */
export function NumProvider({ children }: { children: ReactNode }) {
  const [on, setOn] = useState(true);
  useEffect(() => { try { if (localStorage.getItem(KEY) === "off") setOn(false); } catch {} }, []);
  const set = (v: boolean) => { setOn(v); try { localStorage.setItem(KEY, v ? "on" : "off"); } catch {} };
  return <NumsOn.Provider value={{ on, set }}>{children}</NumsOn.Provider>;
}
export const useNums = () => useContext(NumsOn);

/** C10 Number tag: the screen or component number, shown while numbers are on. */
export function Num({ n, className }: { n: string; className?: string }) {
  const { on } = useNums();
  if (!on) return null;
  return <span data-virtu-callout={n} className={cn("pointer-events-none inline-flex h-4 shrink-0 select-none items-center rounded-sm bg-fuchsia-600 px-1 font-mono text-[10px] font-semibold leading-none text-white", className)}>{n}</span>;
}

/** C7 Face with name. People are faces with names, never pills. */
export function Face({ id, size = 28, showName = true, sub }: { id: string; size?: number; showName?: boolean; sub?: string }) {
  const p = personOf(id);
  const initials = p.name.split(" ").map((w) => w[0]).slice(0, 2).join("");
  return (
    <span className="inline-flex min-w-0 items-center gap-2">
      <span aria-hidden className="grid shrink-0 place-items-center rounded-full font-medium text-white" style={{ width: size, height: size, fontSize: size * 0.38, background: `oklch(0.62 0.13 ${p.hue})` }}>{initials}</span>
      {showName ? <span className="min-w-0"><span className="block truncate text-sm font-medium">{p.name}</span>{sub ?? p.role ? <span className="text-muted-foreground block truncate text-xs">{sub ?? p.role}</span> : null}</span> : <span className="sr-only">{p.name}</span>}
    </span>
  );
}

/** C9 Agent status dot. */
export function StatusDot({ status, label = true }: { status: Agent["status"]; label?: boolean }) {
  const tone = { running: "bg-emerald-500 animate-pulse", idle: "bg-muted-foreground/40", paused: "bg-amber-500", "needs-you": "bg-fuchsia-600" }[status];
  const text = { running: "Running", idle: "Idle", paused: "Paused", "needs-you": "Needs you" }[status];
  return <span className="inline-flex items-center gap-1.5 text-xs"><span className={cn("size-2 rounded-full", tone)} />{label ? <span className="text-muted-foreground">{text}</span> : null}</span>;
}

/** C8 Commitment stepper: explore, prototype, charge, raise. The evidence decides how far a venture may go. */
export function CommitmentStepper({ at, compact }: { at: Commitment; compact?: boolean }) {
  const i = COMMITMENTS.indexOf(at);
  return (
    <ol className="flex items-center gap-1" aria-label={`Commitment: ${at}`}>
      {COMMITMENTS.map((c, k) => (
        <li key={c} className="flex items-center gap-1">
          <span className={cn("rounded-full px-2 py-0.5 text-xs capitalize", k < i && "text-muted-foreground", k === i && "bg-foreground text-background font-medium", k > i && "text-muted-foreground/60")}>{compact && k !== i ? c[0]!.toUpperCase() : c}</span>
          {k < COMMITMENTS.length - 1 ? <span className="bg-border h-px w-2" /> : null}
        </li>
      ))}
    </ol>
  );
}

/** C15 Spend meter. */
export function SpendMeter({ spent, budget, label = "This month" }: { spent: number; budget: number; label?: string }) {
  const pct = Math.min(100, Math.round((spent / budget) * 100));
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between text-xs"><span className="text-muted-foreground">{label}</span><span><span className="font-medium">${spent}</span><span className="text-muted-foreground"> of ${budget}</span></span></div>
      <div className="bg-muted h-1.5 overflow-hidden rounded-full"><div className={cn("h-full rounded-full", pct > 85 ? "bg-amber-500" : "bg-foreground")} style={{ width: `${pct}%` }} /></div>
    </div>
  );
}

/** C11 Held-for-you card: an agent's draft that waits for a person's yes. */
export function HeldCard({ who, what, detail, onYes, onNo }: { who: string; what: string; detail?: string; onYes?: () => void; onNo?: () => void }) {
  const [state, setState] = useState<"held" | "yes" | "no">("held");
  return (
    <div className="border-fuchsia-600/30 bg-fuchsia-600/5 relative rounded-lg border p-3">
      <Num n="C11" className="absolute -top-2 right-2" />
      <div className="text-muted-foreground text-xs">{who} is waiting for you</div>
      <div className="mt-0.5 text-sm font-medium">{what}</div>
      {detail ? <div className="text-muted-foreground mt-1 text-xs">{detail}</div> : null}
      {state === "held" ? (
        <div className="mt-2 flex gap-2">
          <button type="button" onClick={() => { setState("yes"); onYes?.(); }} className="rounded-md border px-2.5 py-1 text-xs font-medium hover:bg-accent">Approve</button>
          <button type="button" onClick={() => { setState("no"); onNo?.(); }} className="text-muted-foreground rounded-md px-2.5 py-1 text-xs hover:bg-accent">Send back</button>
        </div>
      ) : <div className="mt-2 text-xs font-medium">{state === "yes" ? "Approved. The agent carries on." : "Sent back with a note to redo it."}</div>}
    </div>
  );
}
