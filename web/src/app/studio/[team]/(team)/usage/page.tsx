"use client";

// S6 Usage: spend and agent runs across every venture against the studio budget (OpenAI usage dashboard anatomy).
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Num, SpendMeter } from "@/components/studio/bits";
import { ScreenHead } from "@/components/studio/shell";
import { AGENTS, VENTURES, businessHref } from "@/components/studio/data";
import { AGENT_SPEND, DAILY_SPEND, TIER_SPEND } from "@/components/studio/connect-data";
import { useTeamSlug } from "@/components/studio/team";

type Range = "7d" | "month" | "30d";
const RANGES: Record<Range, { label: string; days: number; scale: number }> = {
  "7d": { label: "Last 7 days", days: 7, scale: 0.42 },
  month: { label: "This month (Nov 1 to 21)", days: 21, scale: 1 },
  "30d": { label: "Last 30 days", days: 21, scale: 1.38 },
};
const MONTH_TOTAL = VENTURES.reduce((s, v) => s + v.spendMonth, 0);
const DAILY_SUM = DAILY_SPEND.reduce((s, x) => s + x, 0);
const DAY = (i: number) => DAILY_SPEND[i]! * (MONTH_TOTAL / DAILY_SUM);
const money = (n: number) => `$${n.toFixed(n < 10 ? 2 : 0)}`;

export default function UsagePage() {
  const team = useTeamSlug() ?? "";
  const [range, setRange] = useState<Range>("month");
  const [budget, setBudget] = useState(VENTURES.reduce((s, v) => s + v.budgetMonth, 0));
  const [budgetOpen, setBudgetOpen] = useState(false);
  const [draftBudget, setDraftBudget] = useState(String(budget));
  const [limitsOpen, setLimitsOpen] = useState(false);
  const [limits, setLimits] = useState({ perRun: 2, stopAtBudget: true, warnAt: 85 });
  const [draftLimits, setDraftLimits] = useState(limits);
  const [day, setDay] = useState<number | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const r = RANGES[range];
  const total = MONTH_TOTAL * r.scale;
  const runs = Math.round(590 * r.scale);
  const days = DAILY_SPEND.map((_, i) => i).slice(DAILY_SPEND.length - r.days);
  const max = Math.max(...days.map(DAY));
  const agents = [...AGENTS].sort((a, b) => (AGENT_SPEND[b.id]?.cost ?? 0) - (AGENT_SPEND[a.id]?.cost ?? 0));

  return (
    <div className="pb-16">
      <ScreenHead n="S6" title="Usage" job="Spend and agent runs across every business against the budget.">
        <Select value={range} onValueChange={(x) => setRange(x as Range)}>
          <SelectTrigger className="w-[11rem]" aria-label="Date range"><SelectValue /></SelectTrigger>
          <SelectContent>{(Object.keys(RANGES) as Range[]).map((k) => <SelectItem key={k} value={k}>{RANGES[k].label}</SelectItem>)}</SelectContent>
        </Select>
        <Button onClick={() => { setDraftBudget(String(budget)); setBudgetOpen(true); }}>Set a budget</Button>
      </ScreenHead>

      <div className="space-y-6 px-4 md:px-8">
        {note ? <p className="rounded-lg border border-emerald-600/30 bg-emerald-600/5 p-3 text-sm">{note}</p> : null}

        <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
          <section className="relative rounded-lg border p-4 md:p-5">
            <Num n="S6.1" className="absolute -top-2 left-2" />
            <div className="text-muted-foreground text-xs">Total spend · {r.label}</div>
            <div className="mt-1 flex flex-wrap items-baseline gap-x-2">
              <span className="text-4xl font-semibold tracking-tight tabular-nums">${total.toFixed(2)}</span>
              <span className="text-muted-foreground text-sm">of ${budget} studio budget this month</span>
            </div>
            <div className="mt-4"><SpendMeter spent={Math.round(MONTH_TOTAL)} budget={budget} label="This month across all businesses" /></div>
            <div className="text-muted-foreground mt-2 text-xs">At this pace the month ends near ${Math.round((MONTH_TOTAL / 21) * 30)}. {Math.round((MONTH_TOTAL / 21) * 30) > budget ? "That is over budget." : "That is inside the budget."}</div>
          </section>

          <section className="relative grid grid-cols-2 gap-4 rounded-lg border p-4 md:p-5">
            <Num n="S6.2" className="absolute -top-2 left-2" />
            <div><div className="text-muted-foreground text-xs">Agent runs</div><div className="mt-1 text-2xl font-semibold tabular-nums">{runs}</div></div>
            <div><div className="text-muted-foreground text-xs">Average per run</div><div className="mt-1 text-2xl font-semibold tabular-nums">${(total / runs).toFixed(2)}</div></div>
            <div><div className="text-muted-foreground text-xs">Held for a yes</div><div className="mt-1 text-2xl font-semibold tabular-nums">{Math.round(31 * r.scale)}</div></div>
            <div><div className="text-muted-foreground text-xs">Failed</div><div className="mt-1 text-2xl font-semibold tabular-nums">{Math.round(9 * r.scale)}</div></div>
          </section>
        </div>

        <section className="relative rounded-lg border p-4 md:p-5">
          <Num n="S6.3" className="absolute -top-2 left-2" />
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-sm font-semibold">Spend per day</h2>
            <span className="text-muted-foreground text-xs">{day !== null ? `Nov ${day + 1}: ${money(DAY(day))}` : "Tap a bar for the day"}</span>
          </div>
          <div className="mt-4 flex h-40 items-end gap-0.5 sm:gap-1">
            {days.map((i) => (
              <button key={i} type="button" onClick={() => setDay(i)} title={`Nov ${i + 1}: ${money(DAY(i))}`} aria-label={`Nov ${i + 1}: ${money(DAY(i))}`}
                className="group flex h-full min-w-0 flex-1 items-end">
                <span className={`w-full rounded-t-sm ${day === i ? "bg-fuchsia-600" : "bg-foreground/70 group-hover:bg-foreground"}`} style={{ height: `${(DAY(i) / max) * 100}%` }} />
              </button>
            ))}
          </div>
          <div className="text-muted-foreground mt-1 flex justify-between text-[10px]"><span>Nov {days[0]! + 1}</span><span>Nov {days[days.length - 1]! + 1}</span></div>
        </section>

        <div className="grid gap-4 lg:grid-cols-2">
          <section className="relative rounded-lg border p-4 md:p-5">
            <Num n="S6.4" className="absolute -top-2 left-2" />
            <h2 className="mb-3 text-sm font-semibold">By business</h2>
            <ul className="space-y-4">
              {VENTURES.map((v) => (
                <li key={v.slug}>
                  <Link href={businessHref(team, v.slug)} className="mb-1 flex items-center gap-2 text-sm font-medium hover:underline"><span className="size-3 rounded" style={{ background: `oklch(0.65 0.14 ${v.hue})` }} />{v.name}</Link>
                  <SpendMeter spent={v.spendMonth} budget={v.budgetMonth} label={`${v.agentsRunning} agents running`} />
                </li>
              ))}
            </ul>
          </section>

          <section className="relative rounded-lg border p-4 md:p-5">
            <Num n="S6.5" className="absolute -top-2 left-2" />
            <h2 className="mb-3 text-sm font-semibold">By model tier</h2>
            <ul className="space-y-3">
              {TIER_SPEND.map((t) => (
                <li key={t.tier}>
                  <div className="flex items-baseline justify-between text-sm"><span className="font-medium">{t.tier}</span><span className="tabular-nums">${(t.cost * r.scale).toFixed(2)}</span></div>
                  <div className="bg-muted mt-1 h-1.5 overflow-hidden rounded-full"><div className="bg-foreground h-full rounded-full" style={{ width: `${(t.cost / MONTH_TOTAL) * 100}%` }} /></div>
                  <div className="text-muted-foreground mt-1 text-xs">{Math.round(t.runs * r.scale)} runs · {t.line}</div>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
          <section className="relative rounded-lg border">
            <Num n="S6.6" className="absolute -top-2 left-2" />
            <h2 className="p-4 pb-2 text-sm font-semibold md:px-5">By agent</h2>
            <ul className="divide-y">
              {agents.map((a) => {
                const s = AGENT_SPEND[a.id] ?? { cost: 0, runs: 0 };
                return (
                  <li key={a.id} className="flex items-center gap-3 px-4 py-2.5 md:px-5">
                    <div className="min-w-0 flex-1"><div className="truncate text-sm">{a.name}</div><div className="text-muted-foreground text-xs">{a.model} · {Math.round(s.runs * r.scale)} runs</div></div>
                    <div className="hidden w-24 sm:block"><div className="bg-muted h-1.5 overflow-hidden rounded-full"><div className="bg-foreground h-full" style={{ width: `${(s.cost / 31.2) * 100}%` }} /></div></div>
                    <div className="w-16 text-right text-sm tabular-nums">${(s.cost * r.scale).toFixed(2)}</div>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="relative h-fit rounded-lg border p-4 md:p-5">
            <Num n="S6.7" className="absolute -top-2 left-2" />
            <h2 className="text-sm font-semibold">Limits</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-2"><dt className="text-muted-foreground">Studio budget</dt><dd>${budget} a month</dd></div>
              <div className="flex justify-between gap-2"><dt className="text-muted-foreground">Most one run may cost</dt><dd>${limits.perRun.toFixed(2)}</dd></div>
              <div className="flex justify-between gap-2"><dt className="text-muted-foreground">Warn at</dt><dd>{limits.warnAt} percent</dd></div>
              <div className="flex justify-between gap-2"><dt className="text-muted-foreground">At the budget</dt><dd>{limits.stopAtBudget ? "Agents pause" : "Agents keep going"}</dd></div>
            </dl>
            <Button variant="outline" size="sm" className="mt-4" onClick={() => { setDraftLimits(limits); setLimitsOpen(true); }}>Edit limits</Button>
          </section>
        </div>
      </div>

      <Dialog open={budgetOpen} onOpenChange={setBudgetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set a budget</DialogTitle>
            <DialogDescription>The most the whole studio may spend on agent runs each month. Business budgets sit inside it.</DialogDescription>
          </DialogHeader>
          <label className="block space-y-1 text-sm">
            <span>Monthly studio budget in dollars</span>
            <Input inputMode="numeric" value={draftBudget} onChange={(e) => setDraftBudget(e.target.value.replace(/[^0-9]/g, ""))} />
          </label>
          <p className="text-muted-foreground text-xs">Spent so far this month: ${MONTH_TOTAL}. Venture budgets add up to ${VENTURES.reduce((s, v) => s + v.budgetMonth, 0)}.</p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setBudgetOpen(false)}>Cancel</Button>
            <Button disabled={!Number(draftBudget)} onClick={() => { const b = Number(draftBudget); setBudget(b); setNote(`Studio budget set to $${b} a month. Agents will warn you at ${limits.warnAt} percent.`); setBudgetOpen(false); }}>Save budget</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={limitsOpen} onOpenChange={setLimitsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit limits</DialogTitle>
            <DialogDescription>Limits apply to every agent in every business.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <label className="block space-y-1 text-sm"><span>Most one run may cost, in dollars</span><Input inputMode="decimal" value={String(draftLimits.perRun)} onChange={(e) => setDraftLimits((l) => ({ ...l, perRun: Number(e.target.value.replace(/[^0-9.]/g, "")) || 0 }))} /></label>
            <label className="block space-y-1 text-sm"><span>Warn at this percent of budget</span><Input inputMode="numeric" value={String(draftLimits.warnAt)} onChange={(e) => setDraftLimits((l) => ({ ...l, warnAt: Math.min(100, Number(e.target.value.replace(/[^0-9]/g, "")) || 0) }))} /></label>
            <label className="flex items-center justify-between gap-3 text-sm"><span>Pause agents when the budget runs out</span><Switch checked={draftLimits.stopAtBudget} onCheckedChange={(v) => setDraftLimits((l) => ({ ...l, stopAtBudget: v }))} /></label>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setLimitsOpen(false)}>Cancel</Button>
            <Button onClick={() => { setLimits(draftLimits); setNote("Limits saved."); setLimitsOpen(false); }}>Save limits</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
