"use client";

// V15 Decisions: calls only a person can make, ranked, each with the agent's recommendation and evidence.
import Link from "next/link";
import { use, useState } from "react";
import { BotIcon, CheckIcon, ChevronRightIcon, FileTextIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Face, Num } from "@/components/studio/bits";
import { agentOf, businessHref, ventureOf } from "@/components/studio/data";
import { ScreenHead } from "@/components/studio/shell";
import { useTeamSlug } from "@/components/studio/team";

type Why = "One-way door" | "Spends money" | "Public" | "Legal";
type Decision = {
  id: string; title: string; why: Why; whyLine: string; agent: string; rec: string; recOption: string;
  evidence: { label: string; path: string }[]; options: string[]; due: string;
  decided?: { option: string; by: string; when: string };
};

const WHY_TONE: Record<Why, string> = {
  "One-way door": "text-fuchsia-700 dark:text-fuchsia-400", "Spends money": "text-amber-700 dark:text-amber-400",
  Public: "text-sky-700 dark:text-sky-400", Legal: "text-red-700 dark:text-red-400",
};

const SEED: Record<string, Decision[]> = {
  "haptic-plays": [
    { id: "d1", title: "Run the pilot with Lincoln High or Westlake", why: "One-way door", whyLine: "A school only says yes once. Picking one closes the other for this season.", agent: "strategy-agent",
      rec: "Lincoln High. Coach Reyes already uses hand signals and plays in loud stadiums, so the test is harder and more honest.", recOption: "Lincoln High",
      evidence: [{ label: "Interview notes, Coach Reyes", path: "product/interviews/reyes.md" }, { label: "Assumptions", path: "strategy/assumptions.json" }], options: ["Lincoln High", "Westlake", "Wait a week"], due: "Due Friday" },
    { id: "d2", title: "Order ten vests at $38 each", why: "Spends money", whyLine: "$380 is more than any agent may spend alone in this business.", agent: "finance-agent",
      rec: "Order ten. It fits the budget and a full team needs at least eight.", recOption: "Order ten",
      evidence: [{ label: "Vendor quote", path: "supply-chain/quotes/vest-v2.pdf" }, { label: "November spend", path: "finance/spend/2026-11.json" }], options: ["Order ten", "Order four", "Not yet"], due: "Due next week" },
    { id: "d0", title: "Name the product Haptic Plays", why: "Public", whyLine: "The name goes on the landing page and the outreach.", agent: "marketing-agent",
      rec: "Keep Haptic Plays. Coaches understood it in every call.", recOption: "Keep the name",
      evidence: [{ label: "Name test notes", path: "marketing/names.md" }], options: ["Keep the name", "Test two more"], due: "",
      decided: { option: "Keep the name", by: "torian", when: "Nov 12" } },
  ],
  "pattern-language": [
    { id: "d1", title: "Interview architects or builders first", why: "One-way door", whyLine: "It sets who the first product is for.", agent: "strategy-agent",
      rec: "Architects. They pick the patterns; builders follow the drawings.", recOption: "Architects",
      evidence: [{ label: "Assumptions", path: "strategy/assumptions.json" }], options: ["Architects", "Builders"], due: "Due Monday" },
    { id: "d2", title: "Publish the pattern list on a public site", why: "Public", whyLine: "Once public, the list and its framing are out.", agent: "marketing-agent",
      rec: "Not yet. Publish after five interviews so the framing is tested.", recOption: "Not yet",
      evidence: [{ label: "Draft site", path: "marketing/site/index.md" }], options: ["Publish now", "Not yet"], due: "Due next week" },
    { id: "d3", title: "License the 1977 pattern text", why: "Legal", whyLine: "Using the original text needs permission from the rights holder.", agent: "legal-agent",
      rec: "Write our own short summaries and link to the book instead.", recOption: "Write summaries",
      evidence: [{ label: "Rights note", path: "risk-and-compliance/rights.md" }], options: ["Ask for a license", "Write summaries"], due: "Due in two weeks" },
    { id: "d4", title: "Pay $40 a month for a search index", why: "Spends money", whyLine: "A new monthly cost.", agent: "finance-agent",
      rec: "Wait. Twenty patterns fit in a plain file for now.", recOption: "Wait",
      evidence: [{ label: "Tool comparison", path: "it/search-options.md" }], options: ["Pay $40", "Wait"], due: "Due in two weeks" },
  ],
  "founder-raise": [
    { id: "d1", title: "Send the deck to three funders", why: "Public", whyLine: "Once sent, the deck and the ask are out of your hands.", agent: "funder-scout",
      rec: "Send to all three today. Each backed a founder like you in the last year.", recOption: "Send to all three",
      evidence: [{ label: "Short list", path: "external/funders/short-list.json" }, { label: "Investor deck", path: "marketing/decks/investor.json" }], options: ["Send to all three", "Send to one first", "Not yet"], due: "Due today" },
    { id: "d0", title: "Set the ask at $250k", why: "One-way door", whyLine: "Funders anchor on the first number they see.", agent: "finance-agent",
      rec: "$250k covers eighteen months of a founder's time.", recOption: "$250k",
      evidence: [{ label: "Runway model", path: "finance/runway.json" }], options: ["$250k", "$400k"], due: "",
      decided: { option: "$250k", by: "torian", when: "Nov 18" } },
  ],
};

export default function Decisions({ params }: { params: Promise<{ slug: string }> }) {
  const team = useTeamSlug() ?? "";
  const { slug } = use(params);
  const v = ventureOf(slug);
  const [items, setItems] = useState<Decision[]>(() => SEED[slug] ?? SEED["haptic-plays"]!);
  const [filter, setFilter] = useState<"open" | "decided">("open");
  const [openId, setOpenId] = useState<string | null>(null);
  const [justDecided, setJustDecided] = useState<string | null>(null);

  const decide = (id: string, option: string) => {
    setItems((xs) => xs.map((d) => (d.id === id ? { ...d, decided: { option, by: "torian", when: "Just now" } } : d)));
    setJustDecided(id);
  };
  const reopen = (id: string) => setItems((xs) => xs.map((d) => (d.id === id ? { ...d, decided: undefined } : d)));

  const open = items.filter((d) => !d.decided);
  const decided = items.filter((d) => d.decided);
  const shown = filter === "open" ? open : decided;
  const current = items.find((d) => d.id === openId) ?? null;

  return (
    <div className="pb-10">
      <ScreenHead n="V15" title="Decisions" job={`Calls only you can make for ${v.name}, ranked by what they block.`} />

      <div className="space-y-4 px-4 md:px-8">
        {/* V15.1 Filters */}
        <div className="relative flex items-center gap-1" role="tablist">
          <Num n="V15.1" className="absolute -top-3 left-0" />
          {([["open", `Open (${open.length})`], ["decided", `Decided (${decided.length})`]] as const).map(([k, label]) => (
            <button key={k} type="button" role="tab" aria-selected={filter === k} onClick={() => setFilter(k)}
              className={cn("rounded-md px-3 py-1.5 text-sm", filter === k ? "bg-accent font-medium" : "text-muted-foreground hover:bg-accent/60")}>{label}</button>
          ))}
        </div>

        {justDecided && filter === "open" ? (
          <div className="bg-muted/60 flex flex-wrap items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm">
            <span>Recorded. The agents carry on with your call, and it moved to Decided.</span>
            <Button variant="ghost" size="xs" onClick={() => { setFilter("decided"); setJustDecided(null); }}>See it</Button>
          </div>
        ) : null}

        {/* V15.2 Ranked list */}
        <ol className="relative space-y-3">
          <Num n="V15.2" className="absolute -top-2 right-0 z-10" />
          {shown.length === 0 ? (
            <li className="text-muted-foreground rounded-xl border border-dashed p-8 text-center text-sm">
              {filter === "open" ? "Nothing waits for you. The agents will ask when a call is yours." : "No decisions recorded yet."}
            </li>
          ) : null}
          {shown.map((d, i) => {
            const a = agentOf(d.agent);
            return (
              <li key={d.id} className="bg-card relative rounded-xl border p-4">
                {i === 0 ? <Num n="V15.3" className="absolute -top-2 left-3" /> : null}
                <div className="flex items-start gap-3">
                  {filter === "open" ? <span className="text-muted-foreground w-5 shrink-0 pt-0.5 text-sm tabular-nums">{i + 1}</span> : null}
                  <div className="min-w-0 flex-1">
                    <button type="button" onClick={() => setOpenId(d.id)} className="group flex w-full items-start justify-between gap-2 text-left">
                      <span className="text-base font-semibold group-hover:underline">{d.title}</span>
                      <ChevronRightIcon className="text-muted-foreground mt-1 size-4 shrink-0" />
                    </button>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 text-xs">
                      <span className={cn("font-medium", WHY_TONE[d.why])}>{d.why}</span>
                      <span className="text-muted-foreground">{d.whyLine}</span>
                      {d.due && !d.decided ? <span className="text-muted-foreground">· {d.due}</span> : null}
                    </div>

                    {d.decided ? (
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                        <span className="inline-flex items-center gap-1.5 font-medium"><CheckIcon className="size-4" />{d.decided.option}</span>
                        <Face id={d.decided.by} size={22} sub={d.decided.when} />
                        <Button variant="ghost" size="xs" onClick={() => reopen(d.id)}>Reopen</Button>
                      </div>
                    ) : (
                      <>
                        {/* V15.4 Recommendation */}
                        <div className="bg-muted/50 relative mt-3 rounded-lg p-3">
                          {i === 0 ? <Num n="V15.4" className="absolute -top-2 right-2" /> : null}
                          <div className="text-muted-foreground flex items-center gap-1.5 text-xs"><BotIcon className="size-3.5" />{a.name} recommends</div>
                          <p className="mt-1 text-sm">{d.rec}</p>
                          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                            {d.evidence.map((e) => (
                              <Link key={e.path} href={businessHref(team, slug, `files/${e.path}`)} className="inline-flex items-center gap-1 text-xs font-medium hover:underline"><FileTextIcon className="size-3.5" />{e.label}</Link>
                            ))}
                          </div>
                        </div>
                        {/* V15.5 Options */}
                        <div className="relative mt-3 flex flex-wrap gap-2">
                          {i === 0 ? <Num n="V15.5" className="absolute -top-2 -right-1" /> : null}
                          {d.options.map((o) => (
                            <Button key={o} variant={o === d.recOption ? "outline" : "ghost"} size="sm" onClick={() => decide(d.id, o)}
                              className={cn(o === d.recOption && "border-foreground/40 font-semibold")}>
                              {o}{o === d.recOption ? <span className="text-muted-foreground text-xs font-normal">Recommended</span> : null}
                            </Button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      {/* V15.6 Decision detail */}
      <Sheet open={!!current} onOpenChange={(o) => { if (!o) setOpenId(null); }}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          {current ? (
            <>
              <SheetHeader className="relative">
                <Num n="V15.6" className="absolute top-1 left-1" />
                <SheetTitle className="pr-6 text-lg">{current.title}</SheetTitle>
                <SheetDescription><span className={cn("font-medium", WHY_TONE[current.why])}>{current.why}.</span> {current.whyLine}</SheetDescription>
              </SheetHeader>
              <div className="space-y-5 px-4 pb-6">
                <div>
                  <div className="text-muted-foreground text-xs">Recommendation from {agentOf(current.agent).name}</div>
                  <p className="mt-1 text-sm">{current.rec}</p>
                </div>
                <div>
                  <div className="text-muted-foreground text-xs">Evidence</div>
                  <ul className="mt-1 space-y-1">
                    {current.evidence.map((e) => (
                      <li key={e.path}><Link href={businessHref(team, slug, `files/${e.path}`)} className="inline-flex items-center gap-1.5 text-sm hover:underline"><FileTextIcon className="size-4" />{e.label}<span className="text-muted-foreground text-xs">{e.path}</span></Link></li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="text-muted-foreground text-xs">Who is involved</div>
                  <div className="mt-2 flex flex-wrap gap-4">{v.team.map((id) => <Face key={id} id={id} size={24} />)}</div>
                </div>
                {current.decided ? (
                  <div className="rounded-lg border p-3 text-sm">
                    <div className="font-medium">Decided: {current.decided.option}</div>
                    <div className="mt-2"><Face id={current.decided.by} size={22} sub={current.decided.when} /></div>
                  </div>
                ) : (
                  <div>
                    <div className="text-muted-foreground mb-2 text-xs">Your call</div>
                    <div className="flex flex-col gap-2">
                      {current.options.map((o) => (
                        <Button key={o} variant={o === current.recOption ? "outline" : "ghost"} className="justify-between" onClick={() => decide(current.id, o)}>
                          {o}{o === current.recOption ? <span className="text-muted-foreground text-xs font-normal">Recommended</span> : null}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}
