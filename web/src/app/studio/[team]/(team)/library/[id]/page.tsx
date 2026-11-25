"use client";

// S4 Template: everything a template sets up (files, agents, automations, decks, the commitment it starts at), who made
// it, what people say, and its versions. "Use this template" adds it to a new or existing venture.
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { ArrowLeftIcon, ArrowRightIcon, BotIcon, CheckIcon, FileTextIcon, FolderIcon, PlusIcon, PresentationIcon, StarIcon, UsersIcon, WorkflowIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CommitmentStepper, Face, Num } from "@/components/studio/bits";
import { ScreenHead } from "@/components/studio/shell";
import { Maker } from "@/components/studio/template-card";
import { SCREENS, VENTURES, templateOf, businessHref, teamHref, type Template } from "@/components/studio/data";
import { useTeamSlug } from "@/components/studio/team";

const S4 = SCREENS.find((s) => s.id === "S4")!;

type Tree = { name: string; files: string[] }[];
const TREES: Record<string, Tree> = {
  "b2b-saas": [
    { name: "strategy", files: ["one-pager.md", "assumptions.json", "competitors.md"] },
    { name: "products", files: ["product-card.json", "roadmap.md"] },
    { name: "marketing", files: ["pricing-page.md", "outreach/first-touch.md"] },
    { name: "validation", files: ["interview-guide.md", "buyer-list.csv"] },
    { name: "finance", files: ["budget.json"] },
  ],
  haptic: [
    { name: "strategy", files: ["one-pager.md", "assumptions.json"] },
    { name: "products", files: ["vest-spec.md", "bench-test-plan.md", "bill-of-materials.csv"] },
    { name: "supply-chain", files: ["vendors.json", "quotes/"] },
    { name: "service-delivery", files: ["pilot-plan.md", "coach-onboarding.md"] },
    { name: "finance", files: ["budget.json"] },
  ],
};
const treeOf = (t: Template): Tree => TREES[t.id] ?? [
  { name: "strategy", files: ["one-pager.md", "assumptions.json"] },
  { name: t.kind === "deck" ? "decks" : t.kind === "agent" ? "agents" : t.kind === "automation" ? "automations" : "products", files: t.sets.slice(0, 3).map((s) => `${s.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.md`) },
  { name: "finance", files: ["budget.json"] },
];

const AGENTS_ADDED = [
  { name: "Chief of staff", job: "Plans the week and routes work." },
  { name: "Strategy agent", job: "Grades the evidence behind each assumption." },
  { name: "Product agent", job: "Turns interview notes into product cards." },
];
const AUTOMATIONS_ADDED = [
  { name: "Weekly spend check", trigger: "Every Monday at 9", approves: "torian" },
  { name: "Interview follow up", trigger: "After each booked call", approves: "torian" },
];
const DECKS_ADDED = ["Investor deck, 12 slides", "Customer one pager"];
const REVIEWS = [
  { who: "maya", stars: 5, when: "Oct 30", text: "The interview guide alone saved me a week. Assumptions came out graded, not guessed." },
  { who: "Priya Shah", stars: 4, when: "Oct 12", text: "Good start. I removed the pricing page until I had ten buyers, which the template suggests anyway." },
  { who: "dev", stars: 5, when: "Sep 28", text: "Agents held every send for a yes, so I trusted it on day one." },
];
const VERSIONS = [
  { v: "1.4", when: "Nov 14, 2026", note: "Pricing page waits until 'hurts' is supported." },
  { v: "1.3", when: "Oct 2, 2026", note: "Added the buyer list and the first-touch draft." },
  { v: "1.0", when: "Aug 19, 2026", note: "First version." },
];

export default function TemplatePage() {
  const team = useTeamSlug() ?? "";
  const params = useParams<{ id: string }>();
  const t = templateOf(params?.id ?? "b2b-saas");
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState<string>("new");
  const [done, setDone] = useState(false);
  const tree = treeOf(t);
  const targetName = target === "new" ? `New business from ${t.title}` : VENTURES.find((v) => v.slug === target)?.name ?? "";
  const rating = (REVIEWS.reduce((a, r) => a + r.stars, 0) / REVIEWS.length).toFixed(1);

  return (
    <div className="pb-16">
      <div className="px-4 pt-4 md:px-8"><Link href={teamHref(team, "library")} className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs"><ArrowLeftIcon className="size-3.5" />Library</Link></div>
      <ScreenHead n="S4" title={t.title} job={S4.job}>
        <Button onClick={() => { setOpen(true); setDone(false); }}>{done ? <><CheckIcon />Added</> : "Use this template"}</Button>
      </ScreenHead>

      <div className="grid gap-6 px-4 md:px-8 lg:grid-cols-[2fr_1fr]">
        <div className="min-w-0 space-y-6">
          <section className="relative rounded-xl border p-4">
            <Num n="S4.1" className="absolute -top-2 right-3" />
            <p className="text-sm">{t.oneLine}</p>
            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
              <Maker maker={t.maker} size={24} />
              <span className="text-muted-foreground inline-flex items-center gap-1"><UsersIcon className="size-3.5" />{t.uses.toLocaleString("en-US")} uses</span>
              <span className="text-muted-foreground inline-flex items-center gap-1"><StarIcon className="size-3.5" />{rating} from {REVIEWS.length} reviews</span>
              <span className="text-muted-foreground">{t.category}</span>
            </div>
            <div className="mt-4">
              <div className="text-muted-foreground mb-1 text-xs">Starts the business at</div>
              <div className="overflow-hidden"><CommitmentStepper at={t.commitment} /></div>
            </div>
          </section>

          <section className="relative">
            <Num n="S4.2" className="absolute -top-2 right-0" />
            <h2 className="text-sm font-semibold">Folders and files</h2>
            <ul className="mt-2 space-y-2 rounded-xl border p-3 font-mono text-xs">
              {tree.map((f) => (
                <li key={f.name}>
                  <div className="flex items-center gap-1.5 font-medium"><FolderIcon className="size-3.5 shrink-0" />{f.name}/</div>
                  <ul className="mt-1 ml-5 space-y-0.5">
                    {f.files.map((x) => <li key={x} className="text-muted-foreground flex min-w-0 items-center gap-1.5"><FileTextIcon className="size-3.5 shrink-0" /><span className="truncate">{x}</span></li>)}
                  </ul>
                </li>
              ))}
            </ul>
          </section>

          <div className="grid gap-6 md:grid-cols-2">
            <section className="relative">
              <Num n="S4.3" className="absolute -top-2 right-0" />
              <h2 className="text-sm font-semibold">Agents it adds</h2>
              <ul className="mt-2 divide-y rounded-xl border">
                {AGENTS_ADDED.map((a) => <li key={a.name} className="flex gap-2 p-3"><BotIcon className="mt-0.5 size-4 shrink-0" /><div><div className="text-sm font-medium">{a.name}</div><div className="text-muted-foreground text-xs">{a.job}</div></div></li>)}
              </ul>
            </section>
            <section className="relative">
              <Num n="S4.4" className="absolute -top-2 right-0" />
              <h2 className="text-sm font-semibold">Automations</h2>
              <ul className="mt-2 divide-y rounded-xl border">
                {AUTOMATIONS_ADDED.map((a) => (
                  <li key={a.name} className="flex gap-2 p-3">
                    <WorkflowIcon className="mt-0.5 size-4 shrink-0" />
                    <div className="min-w-0"><div className="text-sm font-medium">{a.name}</div><div className="text-muted-foreground text-xs">{a.trigger}. Approved by you before anything goes out.</div></div>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <section className="relative">
            <Num n="S4.5" className="absolute -top-2 right-0" />
            <h2 className="text-sm font-semibold">Decks</h2>
            <ul className="mt-2 grid gap-2 sm:grid-cols-2">
              {DECKS_ADDED.map((d) => <li key={d} className="flex items-center gap-2 rounded-xl border p-3 text-sm"><PresentationIcon className="size-4 shrink-0" />{d}</li>)}
            </ul>
          </section>
        </div>

        <aside className="min-w-0 space-y-6">
          <section className="relative">
            <Num n="S4.6" className="absolute -top-2 right-0" />
            <h2 className="text-sm font-semibold">Reviews</h2>
            <ul className="mt-2 space-y-3">
              {REVIEWS.map((r) => (
                <li key={r.who + r.when} className="rounded-xl border p-3">
                  <div className="flex items-center justify-between gap-2"><Face id={r.who} size={22} sub={r.when} /><span className="text-muted-foreground shrink-0 text-xs" aria-label={`${r.stars} of 5 stars`}>{"★".repeat(r.stars)}{"☆".repeat(5 - r.stars)}</span></div>
                  <p className="mt-2 text-sm">{r.text}</p>
                </li>
              ))}
            </ul>
          </section>
          <section className="relative">
            <Num n="S4.7" className="absolute -top-2 right-0" />
            <h2 className="text-sm font-semibold">Version history</h2>
            <ol className="mt-2 space-y-3 border-l pl-4">
              {VERSIONS.map((v, i) => (
                <li key={v.v} className="relative">
                  <span className={cn("absolute top-1.5 -left-[21px] size-2 rounded-full", i === 0 ? "bg-foreground" : "bg-muted-foreground/40")} />
                  <div className="text-sm font-medium">{v.v}{i === 0 ? <span className="text-muted-foreground font-normal"> (current)</span> : null}</div>
                  <div className="text-muted-foreground text-xs">{v.when}. {v.note}</div>
                </li>
              ))}
            </ol>
          </section>
        </aside>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <Num n="S4.8" className="absolute top-2 left-2" />
          {done ? (
            <>
              <DialogHeader>
                <DialogTitle>{t.title} is added</DialogTitle>
                <DialogDescription>{targetName} now has {tree.length} folders, {AGENTS_ADDED.length} agents and {AUTOMATIONS_ADDED.length} automations. The automations wait for your yes before they run.</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setOpen(false)}>Stay here</Button>
                <Button variant="outline" asChild><Link href={businessHref(team, target === "new" ? "haptic-plays" : target)}>Open the business<ArrowRightIcon /></Link></Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Use {t.title}</DialogTitle>
                <DialogDescription>Pick where it goes. Nothing in an existing business is overwritten; new files sit beside yours.</DialogDescription>
              </DialogHeader>
              <ul className="space-y-1.5" role="radiogroup" aria-label="Business">
                {[{ slug: "new", name: "A new business", oneLine: `Starts at ${t.commitment} with this template`, hue: -1 }, ...VENTURES].map((v) => (
                  <li key={v.slug}>
                    <button type="button" role="radio" aria-checked={target === v.slug} onClick={() => setTarget(v.slug)}
                      className={cn("flex w-full items-center gap-2 rounded-lg border p-2.5 text-left", target === v.slug ? "border-foreground ring-foreground ring-1" : "hover:border-foreground/30")}>
                      {v.hue < 0 ? <PlusIcon className="size-4 shrink-0" /> : <span className="size-4 shrink-0 rounded" style={{ background: `oklch(0.65 0.14 ${v.hue})` }} />}
                      <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{v.name}</span><span className="text-muted-foreground block truncate text-xs">{v.oneLine}</span></span>
                      {target === v.slug ? <CheckIcon className="size-4 shrink-0" /> : null}
                    </button>
                  </li>
                ))}
              </ul>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                <Button variant="outline" onClick={() => setDone(true)}>Add to {target === "new" ? "a new business" : targetName}</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
