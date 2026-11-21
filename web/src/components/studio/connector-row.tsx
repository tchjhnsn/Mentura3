"use client";

// C14 Connector row: one account a venture can connect, with the consent step that sets what agents may do with it.
import { useState } from "react";
import { CheckIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Num } from "./bits";
import { AGENTS } from "./data";
import type { Connector, Scopes } from "./connect-data";

const SCOPE_TEXT: Record<keyof Scopes, { label: string; line: string }> = {
  read: { label: "Read", line: "See what is in the account." },
  write: { label: "Write", line: "Create and change drafts, files or issues." },
  send: { label: "Send", line: "Send or publish. Every send is held for your yes." },
};

/** The initial on a colored tile, standing in for the service's own icon. */
export function ConnectorTile({ c, size = 36 }: { c: Pick<Connector, "name" | "hue">; size?: number }) {
  return (
    <span aria-hidden className="grid shrink-0 place-items-center rounded-lg font-semibold text-white" style={{ width: size, height: size, fontSize: size * 0.42, background: `oklch(0.6 0.14 ${c.hue})` }}>
      {c.name[0]}
    </span>
  );
}

/** The consent step: scopes as switches and the agents that may use the account. Used by C14 and by any "Connect an account" flow. */
export function ConnectConsent({ c, connected, onDone, onDisconnect }: { c: Connector; connected: boolean; onDone: (scopes: Scopes, agents: string[]) => void; onDisconnect?: () => void }) {
  const [scopes, setScopes] = useState<Scopes>(c.scopes);
  const [agents, setAgents] = useState<string[]>(c.agents);
  const [step, setStep] = useState<"consent" | "signing-in">("consent");
  const toggleAgent = (id: string) => setAgents((a) => (a.includes(id) ? a.filter((x) => x !== id) : [...a, id]));
  const keys = (Object.keys(SCOPE_TEXT) as (keyof Scopes)[]).filter((k) => c.offers[k]);
  return (
    <>
      <DialogHeader>
        <div className="flex items-center gap-3">
          <ConnectorTile c={c} />
          <div className="min-w-0">
            <DialogTitle>{connected ? `Manage ${c.name}` : `Connect ${c.name}`}</DialogTitle>
            <DialogDescription>{connected && c.account ? `Signed in as ${c.account}.` : c.does}</DialogDescription>
          </div>
        </div>
      </DialogHeader>
      {step === "signing-in" ? (
        <div className="rounded-lg border p-4 text-sm">
          <div className="font-medium">Signed in to {c.name}</div>
          <p className="text-muted-foreground mt-1">The account is connected with {keys.filter((k) => scopes[k]).map((k) => SCOPE_TEXT[k].label.toLowerCase()).join(", ") || "no"} access for {agents.length} {agents.length === 1 ? "agent" : "agents"}.</p>
        </div>
      ) : (
        <div className="space-y-5">
          <section>
            <h3 className="mb-2 text-sm font-medium">What agents may do</h3>
            <ul className="divide-y rounded-lg border">
              {keys.map((k) => (
                <li key={k} className="flex items-center justify-between gap-3 p-3">
                  <label htmlFor={`${c.id}-${k}`} className="min-w-0">
                    <span className="block text-sm">{SCOPE_TEXT[k].label}</span>
                    <span className="text-muted-foreground block text-xs">{SCOPE_TEXT[k].line}</span>
                  </label>
                  <Switch id={`${c.id}-${k}`} checked={scopes[k]} onCheckedChange={(v) => setScopes((s) => ({ ...s, [k]: v }))} />
                </li>
              ))}
            </ul>
          </section>
          <section>
            <h3 className="mb-2 text-sm font-medium">Agents that may use it</h3>
            <div className="flex flex-wrap gap-1.5">
              {AGENTS.map((a) => {
                const on = agents.includes(a.id);
                return (
                  <button key={a.id} type="button" onClick={() => toggleAgent(a.id)} aria-pressed={on}
                    className={cn("inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs", on ? "border-foreground/40 bg-accent font-medium" : "text-muted-foreground hover:bg-accent/50")}>
                    {on ? <CheckIcon className="size-3" /> : null}{a.name}
                  </button>
                );
              })}
            </div>
          </section>
          <p className="text-muted-foreground text-xs">Private records never leave the venture. You can change this any time.</p>
        </div>
      )}
      <DialogFooter className="gap-2 sm:justify-between">
        {connected && onDisconnect && step === "consent" ? <Button variant="ghost" className="text-destructive" onClick={onDisconnect}>Disconnect</Button> : <span />}
        {step === "consent" ? (
          <Button onClick={() => { if (connected) onDone(scopes, agents); else setStep("signing-in"); }}>{connected ? "Save access" : `Sign in to ${c.name}`}</Button>
        ) : (
          <Button onClick={() => onDone(scopes, agents)}>Done</Button>
        )}
      </DialogFooter>
    </>
  );
}

/** C14 Connector row. Controlled when `connected` and `onConnectedChange` are passed, otherwise it keeps its own state. */
export function ConnectorRow({ c, connected: controlled, onConnectedChange, numbered = true }: { c: Connector; connected?: boolean; onConnectedChange?: (v: boolean) => void; numbered?: boolean }) {
  const [own, setOwn] = useState(c.connected);
  const connected = controlled ?? own;
  const setConnected = (v: boolean) => { setOwn(v); onConnectedChange?.(v); };
  const [open, setOpen] = useState(false);
  const [agentCount, setAgentCount] = useState(c.agents.length);
  const [note, setNote] = useState<string | null>(null);
  return (
    <div className="relative flex items-center gap-3 px-3 py-3">
      {numbered ? <Num n="C14" className="absolute top-0.5 right-1" /> : null}
      <ConnectorTile c={c} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2">
          <span className="text-sm font-medium">{c.name}</span>
          <span className={cn("inline-flex items-center gap-1 text-xs", connected ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground")}>
            <span className={cn("size-1.5 rounded-full", connected ? "bg-emerald-500" : "bg-muted-foreground/40")} />
            {connected ? "Connected" : "Not connected"}
          </span>
        </div>
        <p className="text-muted-foreground text-xs">{note ?? c.does}</p>
        {connected ? <p className="text-muted-foreground mt-0.5 text-xs">{agentCount} {agentCount === 1 ? "agent" : "agents"} may use it{c.account ? ` · ${c.account}` : ""}</p> : null}
      </div>
      <Button variant={connected ? "ghost" : "outline"} size="sm" onClick={() => setOpen(true)}>{connected ? "Manage" : "Connect"}</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          {open ? (
            <ConnectConsent c={c} connected={connected}
              onDone={(_, agents) => { setAgentCount(agents.length); setConnected(true); setNote(connected ? "Access saved." : `Connected. ${c.does}`); setOpen(false); }}
              onDisconnect={() => { setConnected(false); setNote("Disconnected. Agents can no longer use it."); setOpen(false); }} />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
