"use client";

// V1 Overview: the phase bar (C16), what the venture needs now, its gate, and what the agents are doing.
import Link from "next/link";
import { use } from "react";
import { ArrowRightIcon, FileTextIcon, MessageSquareIcon, PresentationIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CommitmentStepper, Face, HeldCard, Num, SpendMeter, StatusDot } from "@/components/studio/bits";
import { AGENTS, COMMITMENTS, RUNS, ventureHref, ventureOf, type Commitment } from "@/components/studio/data";
import { RunRow } from "@/components/studio/run-row";
import { ScreenHead, useChat } from "@/components/studio/shell";
import { PhaseBar } from "@/components/studio/phase-bar";

type Grade = "demonstrated" | "supported" | "untested" | "contradicted";
const GRADE_TONE: Record<Grade, string> = {
  demonstrated: "bg-emerald-500", supported: "bg-sky-500", untested: "bg-muted-foreground/40", contradicted: "bg-red-500",
};

const ASSUMPTIONS: Record<string, { key: string; claim: string; grade: Grade }[]> = {
  "haptic-plays": [
    { key: "Exists", claim: "Coaches lose plays to crowd noise.", grade: "demonstrated" },
    { key: "Segment", claim: "High school football coaches feel it most.", grade: "supported" },
    { key: "Hurts", claim: "It costs them games they could win.", grade: "supported" },
    { key: "Why now", claim: "Cheap haptic motors and new league rules on headsets.", grade: "untested" },
  ],
  "pattern-language": [
    { key: "Exists", claim: "Architects pick patterns by hand from old books.", grade: "supported" },
    { key: "Segment", claim: "Small practices of under ten people.", grade: "untested" },
    { key: "Hurts", claim: "It takes hours per project.", grade: "untested" },
    { key: "Why now", claim: "Language models can read and connect patterns.", grade: "untested" },
  ],
  "founder-raise": [
    { key: "Exists", claim: "Good founders stall between ideas for lack of money.", grade: "demonstrated" },
    { key: "Segment", claim: "Second time founders with one exit or more.", grade: "demonstrated" },
    { key: "Hurts", claim: "They take jobs and leave business building.", grade: "supported" },
    { key: "Why now", claim: "Solo founders build more with agents than teams did.", grade: "contradicted" },
  ],
};

const SUPPORTS: Record<Commitment, string> = {
  explore: "The evidence supports exploring. Talk to more people before you build.",
  prototype: "The evidence supports a prototype. Charging waits until 'why now' is graded.",
  charge: "The evidence supports charging. Raising waits until 'why now' stops being contradicted.",
  raise: "The evidence supports raising.",
};

const HELD: Record<string, [string, string, string][]> = {
  "haptic-plays": [
    ["Marketing agent", "Send the coach outreach email to Lincoln High", "Goes to Coach Reyes and two assistants."],
    ["Strategy agent", "Move 'hurts' from untested to supported", "Based on four of six coach interviews."],
  ],
  "pattern-language": [
    ["Product agent", "Send interview invites to five architects", "Twenty minute calls next week."],
    ["Strategy agent", "Add 'small practices' as the first segment", "From two conversations so far."],
  ],
  "founder-raise": [
    ["Funder scout", "Send the deck to three funders", "Two angel syndicates and one studio fund."],
    ["Finance agent", "Raise the monthly budget to $140", "Spend is at 63 of 100 with ten days left."],
  ],
};

export default function Overview({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const v = ventureOf(slug);
  const chat = useChat();
  const next = COMMITMENTS[COMMITMENTS.indexOf(v.commitment) + 1];
  const runs = (RUNS.some((r) => r.venture === slug) ? RUNS.filter((r) => r.venture === slug) : RUNS.map((r) => ({ ...r, venture: slug }))).slice(0, 5);
  const agentSpend = [
    { id: "marketing-agent", amount: Math.round(v.spendMonth * 0.4) },
    { id: "strategy-agent", amount: Math.round(v.spendMonth * 0.3) },
    { id: "chief-of-staff", amount: Math.round(v.spendMonth * 0.2) },
  ];

  return (
    <div className="@container pb-10">
      <ScreenHead n="V1" title={v.name} job={v.oneLine} />

      <div className="space-y-4 px-4 md:px-8">
        <PhaseBar slug={slug} />
        {/* V1.1 Need now */}
        <section className="bg-card relative rounded-xl border p-5 md:p-7">
          <Num n="V1.1" className="absolute top-2 right-2" />
          <div className="text-muted-foreground text-xs font-medium">What {v.name} needs now</div>
          <p className="mt-2 max-w-2xl text-2xl font-semibold tracking-tight text-balance md:text-3xl">{v.needNow}</p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button size="lg" onClick={() => chat.setOpen(true)}><MessageSquareIcon />Do this now</Button>
            <span className="text-muted-foreground text-xs">Opens the chief of staff, who plans it with you.</span>
          </div>
        </section>

        <div className="grid gap-4 @3xl:grid-cols-5">
          {/* V1.2 Commitment and gate */}
          <section className="relative rounded-xl border p-4 @3xl:col-span-3">
            <Num n="V1.2" className="absolute top-2 right-2" />
            <h2 className="text-sm font-semibold">Commitment and gate</h2>
            <div className="mt-3 overflow-x-auto"><CommitmentStepper at={v.commitment} /></div>
            <ul className="mt-4 divide-y">
              {ASSUMPTIONS[slug]?.map((a) => (
                <li key={a.key} className="flex items-start gap-3 py-2.5">
                  <span className="w-16 shrink-0 text-sm font-medium">{a.key}</span>
                  <span className="text-muted-foreground min-w-0 flex-1 text-sm">{a.claim}</span>
                  <span className="flex shrink-0 items-center gap-1.5 text-xs capitalize"><span className={cn("size-2 rounded-full", GRADE_TONE[a.grade])} />{a.grade}</span>
                </li>
              ))}
            </ul>
            <div className="bg-muted/50 mt-3 rounded-lg p-3 text-sm">
              {SUPPORTS[v.commitment]}
              {next ? <span className="text-muted-foreground"> Next gate: <span className="capitalize">{next}</span>.</span> : null}
            </div>
            <Link href={ventureHref(slug, "strategy")} className="mt-3 inline-flex items-center gap-1 text-sm font-medium hover:underline">
              See the evidence in Strategy<ArrowRightIcon className="size-3.5" />
            </Link>
          </section>

          {/* V1.3 Waiting for you */}
          <section className="relative space-y-3 rounded-xl border p-4 @3xl:col-span-2">
            <Num n="V1.3" className="absolute top-2 right-2" />
            <h2 className="text-sm font-semibold">Waiting for you</h2>
            {HELD[slug]?.map(([who, what, detail]) => <HeldCard key={what} who={who} what={what} detail={detail} />)}
            <Link href={ventureHref(slug, "decisions")} className="inline-flex items-center gap-1 text-sm font-medium hover:underline">
              {v.openDecisions} open {v.openDecisions === 1 ? "decision" : "decisions"} only you can make<ArrowRightIcon className="size-3.5" />
            </Link>
          </section>
        </div>

        {/* V1.4 Live agents */}
        <section className="relative rounded-xl border p-4">
          <Num n="V1.4" className="absolute top-2 right-2" />
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="text-sm font-semibold">Agents</h2>
            <span className="text-muted-foreground text-xs">{v.agentsRunning} running now</span>
          </div>
          <ul className="mt-3 grid gap-2 @md:grid-cols-2 @3xl:grid-cols-4">
            {AGENTS.map((a) => (
              <li key={a.id}>
                <Link href={ventureHref(slug, `agents/${a.id}`)} className="hover:bg-accent/60 block rounded-lg border p-3">
                  <div className="truncate text-sm font-medium">{a.name}</div>
                  <div className="mt-1 flex items-center justify-between gap-2"><StatusDot status={a.status} /><span className="text-muted-foreground text-xs">{a.runsToday} runs today</span></div>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <div className="grid gap-4 @3xl:grid-cols-5">
          {/* V1.5 Recent runs */}
          <section className="relative rounded-xl border @3xl:col-span-3">
            <Num n="V1.5" className="absolute top-2 right-2 z-10" />
            <div className="flex items-baseline justify-between gap-2 px-4 pt-4 pb-2">
              <h2 className="text-sm font-semibold">Recent runs</h2>
              <Link href={ventureHref(slug, "activity")} className="mr-10 text-xs font-medium hover:underline">All activity</Link>
            </div>
            <div className="divide-y border-t">{runs.map((r, i) => <RunRow key={r.id} run={r} numbered={i === 0} />)}</div>
          </section>

          <div className="space-y-4 @3xl:col-span-2">
            {/* V1.6 Spend */}
            <section className="relative rounded-xl border p-4">
              <Num n="V1.6" className="absolute top-2 right-2" />
              <h2 className="mb-3 text-sm font-semibold">Spend</h2>
              <div className="relative"><Num n="C15" className="absolute -top-3 left-0" /><SpendMeter spent={v.spendMonth} budget={v.budgetMonth} /></div>
              <ul className="mt-3 space-y-1">
                {agentSpend.map((s) => (
                  <li key={s.id} className="flex justify-between text-xs"><span className="text-muted-foreground">{AGENTS.find((a) => a.id === s.id)?.name}</span><span className="tabular-nums">${s.amount}</span></li>
                ))}
              </ul>
              <Link href={ventureHref(slug, "settings")} className="mt-3 inline-block text-xs font-medium hover:underline">Change the budget</Link>
            </section>

            {/* V1.7 Team */}
            <section className="relative rounded-xl border p-4">
              <Num n="V1.7" className="absolute top-2 right-2" />
              <h2 className="mb-3 text-sm font-semibold">Team</h2>
              <ul className="space-y-2">{v.team.map((id) => <li key={id}><Face id={id} /></li>)}</ul>
            </section>

            {/* V1.8 Quick links */}
            <section className="relative rounded-xl border p-4">
              <Num n="V1.8" className="absolute top-2 right-2" />
              <h2 className="mb-2 text-sm font-semibold">Jump to</h2>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" asChild><Link href={ventureHref(slug, "files")}><FileTextIcon />Files</Link></Button>
                <Button variant="outline" size="sm" asChild><Link href={ventureHref(slug, "decks/investor")}><PresentationIcon />Investor deck</Link></Button>
                <Button variant="outline" size="sm" asChild><Link href={ventureHref(slug, "files/strategy/assumptions.json")}><FileTextIcon />assumptions.json</Link></Button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
