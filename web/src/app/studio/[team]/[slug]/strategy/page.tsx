"use client";

// V4 Strategy: the strategy canvas. The Five Ws and How foundation, the four problem assumptions graded by evidence,
// what the evidence lets the venture commit to, and the competitors. Naive's assess-problem logic, mocked.
import Link from "next/link";
import { use, useState } from "react";
import { BotIcon, CheckIcon, CircleIcon, ExternalLinkIcon, PencilIcon, PlusIcon, SparklesIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CommitmentStepper, Face, Num } from "@/components/studio/bits";
import { ScreenHead, useChat } from "@/components/studio/shell";
import { COMMITMENTS, agentOf, businessHref, ventureOf, type Commitment } from "@/components/studio/data";
import { isAgentId } from "@/components/studio/files-data";
import { useTeamSlug } from "@/components/studio/team";

type W = { key: string; label: string; text: string; whose: string; confirmed: boolean };
type Grade = "demonstrated" | "supported" | "untested" | "contradicted";
type Assumption = { key: string; label: string; claim: string; grade: Grade; evidence: { text: string; href?: string }[]; next: string };
type Competitor = { name: string; what: string; gap: string };
type Canvas = { ws: W[]; assumptions: Assumption[]; competitors: Competitor[] };

const GRADES: Grade[] = ["demonstrated", "supported", "untested", "contradicted"];
const GRADE_STYLE: Record<Grade, string> = {
  demonstrated: "bg-emerald-600 text-white",
  supported: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300",
  untested: "bg-muted text-muted-foreground",
  contradicted: "bg-red-500/15 text-red-800 dark:text-red-300",
};

const CANVAS: Record<string, Canvas> = {
  "haptic-plays": {
    ws: [
      { key: "who", label: "Who", text: "High school football coaches who call plays from a loud sideline, and the 30 to 60 players who need to hear them.", whose: "torian", confirmed: true },
      { key: "what", label: "What", text: "A vest under $40 that buzzes the play call into every player at once.", whose: "torian", confirmed: true },
      { key: "why", label: "Why", text: "Coaches lose two or three plays a game to noise, and hand signals get stolen.", whose: "strategy-agent", confirmed: false },
      { key: "where", label: "Where", text: "Texas and Ohio high schools first, where state rules allow coach to player signals.", whose: "maya", confirmed: false },
      { key: "when", label: "When", text: "A two week pilot in December practice, five schools by spring.", whose: "torian", confirmed: true },
      { key: "how", label: "How", text: "Bring the vests, run practice as usual, count missed calls before and after.", whose: "dev", confirmed: false },
    ],
    assumptions: [
      { key: "exists", label: "The problem exists", claim: "Coaches miss play calls because of noise.", grade: "demonstrated", evidence: [{ text: "Interview: Coach R., Lincoln High", href: "files/products/interview-notes/coach-1.md" }, { text: "Interview: Coach T., Riverside Prep", href: "files/products/interview-notes/coach-2.md" }, { text: "Missed calls baseline sheet", href: "files/evidence/missed-calls-baseline.sheet" }], next: "None needed. Keep counting in the pilot." },
      { key: "segment", label: "The segment is right", claim: "High school coaches, not college, feel it most and can buy.", grade: "supported", evidence: [{ text: "Two of two coaches named budget lines they control" }], next: "Ask three athletic directors who signs for equipment." },
      { key: "hurts", label: "It hurts enough", claim: "Coaches would change how they call plays to fix it.", grade: "untested", evidence: [], next: "Run the two week pilot and see if the coach keeps the vests on in week two." },
      { key: "why-now", label: "Why now", claim: "Cheap motors and the 2025 rule change make it possible now.", grade: "supported", evidence: [{ text: "Strategy one-pager, Why now", href: "files/strategy/one-pager.md" }], next: "Confirm the rule text for Texas and Ohio." },
    ],
    competitors: [
      { name: "Wristband play cards", what: "Laminated cards players read between snaps.", gap: "Players forget to look, cards get lost." },
      { name: "Coach to player helmet radio", what: "One-way radio to the quarterback only.", gap: "Reaches one player, costs over $1,000." },
      { name: "Sideline signal boards", what: "Big picture boards held up by staff.", gap: "The other bench can read them too." },
    ],
  },
  "pattern-language": {
    ws: [
      { key: "who", label: "Who", text: "Small architecture studios and design students.", whose: "torian", confirmed: true },
      { key: "what", label: "What", text: "A searchable pattern language with real buildings for each pattern.", whose: "ana", confirmed: false },
      { key: "why", label: "Why", text: "Patterns live in a 1977 book and folders of photos.", whose: "torian", confirmed: false },
      { key: "where", label: "Where", text: "Online first, studios in the US.", whose: "ana", confirmed: false },
      { key: "when", label: "When", text: "Five interviews this month, a prototype after.", whose: "torian", confirmed: true },
      { key: "how", label: "How", text: "Start with 50 patterns and 200 buildings tagged by hand.", whose: "strategy-agent", confirmed: false },
    ],
    assumptions: [
      { key: "exists", label: "The problem exists", claim: "Architects struggle to find the right pattern.", grade: "supported", evidence: [{ text: "Interview: Architect J., small studio", href: "files/products/interview-notes/architect-1.md" }], next: "Four more architect interviews." },
      { key: "segment", label: "The segment is right", claim: "Small studios, not big firms.", grade: "untested", evidence: [], next: "Ask how big firms do it today." },
      { key: "hurts", label: "It hurts enough", claim: "They would pay for search.", grade: "untested", evidence: [], next: "Show a price in interview five." },
      { key: "why-now", label: "Why now", claim: "Image search makes tagging buildings cheap.", grade: "untested", evidence: [], next: "Tag 20 buildings and time it." },
    ],
    competitors: [{ name: "The printed book", what: "The 1977 original.", gap: "No search, no photos of real buildings." }, { name: "Pinterest boards", what: "Photo boards studios keep.", gap: "No structure, no patterns." }],
  },
  "founder-raise": {
    ws: [
      { key: "who", label: "Who", text: "Funders who back solo founders, and founders who start many businesses.", whose: "maya", confirmed: true },
      { key: "what", label: "What", text: "Two years of a founder's time, with a share in every business.", whose: "torian", confirmed: true },
      { key: "why", label: "Why", text: "Agents let one founder run several businesses, each needing less money.", whose: "torian", confirmed: true },
      { key: "where", label: "Where", text: "US angels and small funds.", whose: "maya", confirmed: true },
      { key: "when", label: "When", text: "Close by March.", whose: "torian", confirmed: false },
      { key: "how", label: "How", text: "Three to five funders at $80k to $150k each.", whose: "funder-scout", confirmed: false },
    ],
    assumptions: [
      { key: "exists", label: "The problem exists", claim: "Funders want exposure to prolific solo founders.", grade: "demonstrated", evidence: [{ text: "Harbor Angels asked for the deck", href: "files/marketing/outreach/funder-short-list.md" }], next: "None needed." },
      { key: "segment", label: "The segment is right", claim: "Angels and small funds, not large funds.", grade: "demonstrated", evidence: [{ text: "Funder short list", href: "files/marketing/outreach/funder-short-list.md" }], next: "None needed." },
      { key: "hurts", label: "It hurts enough", claim: "Funders will commit money on this structure.", grade: "supported", evidence: [{ text: "Two funders asked for terms" }], next: "Send the deck to three funders and ask for a yes or no." },
      { key: "why-now", label: "Why now", claim: "Agent tools make one founder many times faster.", grade: "supported", evidence: [{ text: "Investor deck, slide 2", href: "decks/investor" }], next: "Show this year's businesses and time spent." },
    ],
    competitors: [{ name: "Income share agreements", what: "Funders take a share of salary.", gap: "Built for employees, not founders." }, { name: "Studio models", what: "A studio owns the ideas.", gap: "The founder gives up control." }],
  },
};

/** What the evidence supports: Naive's rule, mocked. Each step needs the assumptions below it at least supported. */
function supported(as: Assumption[]): { at: Commitment; why: string } {
  const g = (k: string) => as.find((a) => a.key === k)?.grade ?? "untested";
  const ok = (k: string) => g(k) === "demonstrated" || g(k) === "supported";
  const proven = (k: string) => g(k) === "demonstrated";
  if (as.some((a) => a.grade === "contradicted")) return { at: "explore", why: "One assumption is contradicted. Go back to exploring until it is fixed or replaced." };
  if (as.every((a) => proven(a.key))) return { at: "raise", why: "All four assumptions are demonstrated. The evidence supports raising money." };
  if (proven("exists") && proven("segment") && ok("hurts") && ok("why-now")) return { at: "charge", why: "The problem and segment are demonstrated and the pain is supported. You may start charging." };
  if (ok("exists") && ok("segment")) return { at: "prototype", why: "The problem and segment are supported. Build a prototype to test whether it hurts enough." };
  return { at: "explore", why: "The problem or the segment is not supported yet. Keep interviewing before building." };
}

function Who({ id }: { id: string }) {
  return isAgentId(id)
    ? <span className="inline-flex items-center gap-1.5 text-xs"><span className="bg-muted grid size-5 place-items-center rounded-full"><BotIcon className="size-3" /></span>{agentOf(id).name}</span>
    : <span className="text-xs"><Face id={id} size={20} sub="" /></span>;
}

function WCard({ w, onChange }: { w: W; onChange: (w: W) => void }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(w.text);
  return (
    <li className="flex flex-col gap-2 rounded-lg border p-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">{w.label}</h3>
        {!editing ? <Button variant="ghost" size="icon-xs" onClick={() => { setText(w.text); setEditing(true); }} aria-label={`Edit ${w.label}`}><PencilIcon /></Button> : null}
      </div>
      {editing ? (
        <div className="space-y-2">
          <Textarea value={text} onChange={(e) => setText(e.target.value)} className="min-h-20 text-sm" aria-label={w.label} autoFocus />
          <div className="flex gap-2">
            <Button variant="outline" size="xs" onClick={() => { onChange({ ...w, text, whose: "torian", confirmed: false }); setEditing(false); }}>Keep</Button>
            <Button variant="ghost" size="xs" onClick={() => setEditing(false)}>Cancel</Button>
          </div>
        </div>
      ) : <p className="flex-1 text-sm">{w.text}</p>}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-2">
        <Who id={w.whose} />
        {w.confirmed
          ? <button type="button" onClick={() => onChange({ ...w, confirmed: false })} className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400"><CheckIcon className="size-3.5" />Confirmed</button>
          : <Button variant="outline" size="xs" onClick={() => onChange({ ...w, confirmed: true })}><CircleIcon />Confirm</Button>}
      </div>
    </li>
  );
}

export default function StrategyPage({ params }: { params: Promise<{ slug: string }> }) {
  const team = useTeamSlug() ?? "";
  const { slug } = use(params);
  const v = ventureOf(slug);
  const chat = useChat();
  const base = CANVAS[slug] ?? CANVAS["haptic-plays"]!;
  const [ws, setWs] = useState(base.ws);
  const [as, setAs] = useState(base.assumptions);
  const [comps, setComps] = useState(base.competitors);
  const [newComp, setNewComp] = useState("");
  const [gate, setGate] = useState<null | { at: Commitment; why: string; open: string[]; unconfirmed: string[] }>(null);
  const [note, setNote] = useState<string | null>(null);
  const sup = supported(as);
  const confirmed = ws.filter((w) => w.confirmed).length;

  const runGate = () => {
    const s = supported(as);
    setGate({ ...s, open: as.filter((a) => a.grade === "untested" || a.grade === "contradicted").map((a) => `${a.label}: ${a.next}`), unconfirmed: ws.filter((w) => !w.confirmed).map((w) => w.label) });
  };

  return (
    <div className="@container pb-16">
      <ScreenHead n="V4" title="Strategy" job="The strategy canvas and the four assumptions, graded by evidence.">
        <Button variant="ghost" size="sm" onClick={() => { chat.setOpen(true); setNote("The agent panel is open. Ask the Strategy agent to grade new evidence or find competitors."); }}><SparklesIcon />Ask the agent</Button>
        <Button onClick={runGate}>Run gate review</Button>
      </ScreenHead>

      {note ? (
        <div className="mx-4 mb-3 flex items-center justify-between gap-2 rounded-md border bg-emerald-500/5 px-3 py-2 text-sm md:mx-8">
          <span>{note}</span><Button variant="ghost" size="xs" onClick={() => setNote(null)}>Dismiss</Button>
        </div>
      ) : null}

      <div className="space-y-8 px-4 md:px-8">
        {gate ? (
          <section className="relative rounded-lg border-2 border-foreground p-4" aria-live="polite">
            <Num n="V4.5" className="absolute -top-2 right-2" />
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="text-muted-foreground text-xs">Gate review, just now</div>
                <h2 className="mt-0.5 text-lg font-semibold">You may commit to <span className="capitalize">{gate.at}</span>{gate.at === v.commitment ? ", where you are now" : COMMITMENTS.indexOf(gate.at) > COMMITMENTS.indexOf(v.commitment) ? ", one step up" : ", a step back"}</h2>
              </div>
              <Button variant="ghost" size="xs" onClick={() => setGate(null)}>Close</Button>
            </div>
            <p className="mt-2 text-sm">{gate.why}</p>
            {gate.open.length ? (
              <div className="mt-3"><div className="text-xs font-medium">To go further, test</div><ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm">{gate.open.map((o) => <li key={o}>{o}</li>)}</ul></div>
            ) : null}
            {gate.unconfirmed.length ? <p className="text-muted-foreground mt-3 text-xs">Not confirmed by a person yet: {gate.unconfirmed.join(", ")}. The review counts them, but a person should confirm them.</p> : null}
          </section>
        ) : null}

        <section className="relative rounded-lg border p-4">
          <Num n="V4.1" className="absolute -top-2 right-2" />
          <div className="flex flex-col gap-3 @2xl:flex-row @2xl:items-center @2xl:justify-between">
            <div className="min-w-0">
              <div className="text-muted-foreground text-xs">Commitment</div>
              <div className="mt-1 overflow-x-auto"><CommitmentStepper at={v.commitment} /></div>
            </div>
            <div className="min-w-0 text-sm @2xl:max-w-md @2xl:text-right">
              <span className="font-medium">The evidence supports <span className="capitalize">{sup.at}</span>.</span>{" "}
              <span className="text-muted-foreground">{sup.why}</span>
            </div>
          </div>
        </section>

        <section className="relative">
          <Num n="V4.2" className="absolute -top-2 right-0" />
          <div className="mb-3 flex items-baseline justify-between gap-2">
            <h2 className="text-base font-semibold">Foundation</h2>
            <span className="text-muted-foreground text-xs">{confirmed} of 6 confirmed by a person</span>
          </div>
          <ul className="grid gap-3 @xl:grid-cols-2 @4xl:grid-cols-3">
            {ws.map((w) => <WCard key={w.key} w={w} onChange={(nw) => setWs((xs) => xs.map((x) => (x.key === nw.key ? nw : x)))} />)}
          </ul>
        </section>

        <section className="relative">
          <Num n="V4.3" className="absolute -top-2 right-0" />
          <h2 className="mb-1 text-base font-semibold">The four assumptions</h2>
          <p className="text-muted-foreground mb-3 text-sm">Each grade comes from the evidence it cites. Change a grade to see what the evidence would then support.</p>
          <ul className="grid gap-3 @3xl:grid-cols-2">
            {as.map((a) => (
              <li key={a.key} className="rounded-lg border p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0"><h3 className="text-sm font-semibold">{a.label}</h3><p className="text-muted-foreground text-sm">{a.claim}</p></div>
                  <Select value={a.grade} onValueChange={(g) => setAs((xs) => xs.map((x) => (x.key === a.key ? { ...x, grade: g as Grade } : x)))}>
                    <SelectTrigger size="sm" className={cn("h-7 w-36 border-0 capitalize", GRADE_STYLE[a.grade])} aria-label={`Grade for ${a.label}`}><SelectValue /></SelectTrigger>
                    <SelectContent>{GRADES.map((g) => <SelectItem key={g} value={g} className="capitalize">{g}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="mt-3 text-xs font-medium">Evidence</div>
                {a.evidence.length ? (
                  <ul className="mt-1 space-y-1">
                    {a.evidence.map((e) => (
                      <li key={e.text} className="text-sm">
                        {e.href ? <Link href={businessHref(team, slug, e.href)} className="inline-flex items-center gap-1 underline-offset-2 hover:underline">{e.text}<ExternalLinkIcon className="text-muted-foreground size-3" /></Link> : <span className="text-muted-foreground">{e.text}</span>}
                      </li>
                    ))}
                  </ul>
                ) : <p className="text-muted-foreground mt-1 text-sm">None yet.</p>}
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t pt-2">
                  <p className="min-w-0 text-sm"><span className="font-medium">Next test: </span>{a.next}</p>
                  <Button variant="ghost" size="xs" onClick={() => setNote(`Handed to the Strategy agent: plan "${a.next}" and report back.`)}>Plan this test</Button>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="relative">
          <Num n="V4.4" className="absolute -top-2 right-0" />
          <h2 className="mb-3 text-base font-semibold">Competitors</h2>
          <ul className="divide-y rounded-lg border">
            {comps.map((c) => (
              <li key={c.name} className="grid gap-1 p-3 @2xl:grid-cols-[180px_1fr_1fr] @2xl:gap-4">
                <span className="text-sm font-medium">{c.name}</span>
                <span className="text-muted-foreground text-sm">{c.what}</span>
                <span className="text-sm"><span className="text-muted-foreground @2xl:hidden">Gap: </span>{c.gap}</span>
              </li>
            ))}
          </ul>
          <form className="mt-2 flex gap-2" onSubmit={(e) => { e.preventDefault(); const n = newComp.trim(); if (!n) return; setComps((cs) => [...cs, { name: n, what: "Added by you. The Strategy agent will research it.", gap: "Not known yet." }]); setNewComp(""); }}>
            <Input value={newComp} onChange={(e) => setNewComp(e.target.value)} placeholder="Add a competitor" aria-label="Competitor name" className="min-w-0 flex-1" />
            <Button type="submit" variant="outline" disabled={!newComp.trim()}><PlusIcon />Add</Button>
          </form>
        </section>
      </div>
    </div>
  );
}
