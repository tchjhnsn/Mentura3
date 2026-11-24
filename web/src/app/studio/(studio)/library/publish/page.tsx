"use client";

// S5 Publish a template: share one of your ventures, agents or automations with the community, with private records
// stripped by default.
import Link from "next/link";
import { useState } from "react";
import { ArrowLeftIcon, CheckIcon, ClockIcon, LockIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Num } from "@/components/studio/bits";
import { ScreenHead } from "@/components/studio/shell";
import { TemplateCard } from "@/components/studio/template-card";
import { AGENTS, SCREENS, VENTURES, type Template, type TemplateCategory, type TemplateKind } from "@/components/studio/data";

const S5 = SCREENS.find((s) => s.id === "S5")!;

type Source = { id: string; kind: TemplateKind; name: string; line: string; hue: number };
const SOURCES: Source[] = [
  ...VENTURES.map((v) => ({ id: v.slug, kind: "venture" as const, name: v.name, line: v.oneLine, hue: v.hue })),
  ...AGENTS.filter((a) => a.kind === "yours").map((a) => ({ id: a.id, kind: "agent" as const, name: a.name, line: a.job, hue: 200 })),
  { id: "weekly-spend", kind: "automation", name: "Weekly spend check", line: "Every Monday, reconcile spend against budget.", hue: 100 },
  { id: "coach-follow-up", kind: "automation", name: "Coach follow up", line: "After each call, draft a thank you and hold it for your yes.", hue: 10 },
];
const GROUPS: { kind: TemplateKind; label: string }[] = [{ kind: "venture", label: "Businesses" }, { kind: "agent", label: "Agents" }, { kind: "automation", label: "Automations" }];

const PARTS = [
  { id: "strategy", label: "Strategy canvas and assumptions", line: "The four assumptions, with grades but without the interviews behind them.", on: true, private: false },
  { id: "files", label: "Folders and documents", line: "Structure and drafts. Names of people are replaced.", on: true, private: false },
  { id: "agents", label: "Agents and their instructions", line: "Each agent's job, tools and model.", on: true, private: false },
  { id: "automations", label: "Automations", line: "Triggers, steps and who approves.", on: true, private: false },
  { id: "decks", label: "Decks", line: "Slides with your numbers blanked.", on: true, private: false },
  { id: "private", label: "Private records", line: "Interview notes, decisions and anything marked private.", on: false, private: true },
  { id: "contacts", label: "Contacts", line: "Coaches, funders and everyone on an outreach list.", on: false, private: true },
  { id: "spend", label: "Spend and budget", line: "What you spent, on what, and your budget.", on: false, private: true },
];
const CATEGORIES: TemplateCategory[] = ["B2B SaaS", "Consumer app", "Services", "Hardware", "Nonprofit", "Creator"];
const LICENSES = ["Free to use and change", "Free to use, credit the maker", "Use only, no changes"];

export default function PublishTemplate() {
  const [src, setSrc] = useState<string>("haptic-plays");
  const [parts, setParts] = useState<Record<string, boolean>>(Object.fromEntries(PARTS.map((p) => [p.id, p.on])));
  const [title, setTitle] = useState("Hardware wearable pilot");
  const [desc, setDesc] = useState("A bench test plan, a pilot with one team, and a vendor list for a wearable you sew into gear.");
  const [category, setCategory] = useState<TemplateCategory>("Hardware");
  const [license, setLicense] = useState(LICENSES[1]!);
  const [published, setPublished] = useState(false);

  const source = SOURCES.find((s) => s.id === src)!;
  const included = PARTS.filter((p) => parts[p.id]);
  const preview: Template = {
    id: "haptic", title: title.trim() || source.name, kind: source.kind, source: "yours", category, maker: "torian", uses: 0,
    oneLine: desc.trim() || source.line, sets: included.filter((p) => !p.private).map((p) => p.label.split(" ")[0]!), commitment: "prototype", hue: source.hue,
  };

  if (published) {
    return (
      <div className="pb-16">
        <ScreenHead n="S5" title={S5.title} job={S5.job} />
        <div className="relative mx-4 max-w-xl rounded-2xl border p-6 md:mx-8" aria-live="polite">
          <Num n="S5.7" className="absolute top-2 right-2" />
          <span className="grid size-10 place-items-center rounded-full bg-amber-500 text-white"><ClockIcon className="size-5" /></span>
          <h2 className="mt-3 text-lg font-semibold">Published, under review</h2>
          <p className="text-muted-foreground mt-1 text-sm">{preview.title} goes into the community library once a reviewer checks that nothing private slipped through. That usually takes a day. You will see it under Yours in the library until then.</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button variant="outline" asChild><Link href="/studio/library">Go to the library</Link></Button>
            <Button variant="ghost" onClick={() => setPublished(false)}>Edit the listing</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-16">
      <div className="px-4 pt-4 md:px-8"><Link href="/studio/library" className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs"><ArrowLeftIcon className="size-3.5" />Library</Link></div>
      <ScreenHead n="S5" title={S5.title} job={S5.job} />

      <div className="grid gap-8 px-4 md:px-8 lg:grid-cols-[3fr_2fr]">
        <div className="min-w-0 space-y-8">
          <section className="relative">
            <Num n="S5.1" className="absolute -top-2 right-0" />
            <h2 className="text-sm font-semibold">What do you want to share?</h2>
            <div className="mt-2 space-y-3">
              {GROUPS.map((g) => (
                <div key={g.kind}>
                  <div className="text-muted-foreground mb-1 text-xs">{g.label}</div>
                  <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label={g.label}>
                    {SOURCES.filter((s) => s.kind === g.kind).map((s) => (
                      <button key={s.id} type="button" role="radio" aria-checked={src === s.id} onClick={() => setSrc(s.id)}
                        className={cn("flex min-w-0 items-start gap-2 rounded-lg border p-2.5 text-left", src === s.id ? "border-foreground ring-foreground ring-1" : "hover:border-foreground/30")}>
                        <span className="mt-0.5 size-4 shrink-0 rounded" style={{ background: `oklch(0.62 0.13 ${s.hue})` }} />
                        <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{s.name}</span><span className="text-muted-foreground line-clamp-1 text-xs">{s.line}</span></span>
                        {src === s.id ? <CheckIcon className="size-4 shrink-0" /> : null}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="relative">
            <Num n="S5.2" className="absolute -top-2 right-0" />
            <h2 className="text-sm font-semibold">What goes in</h2>
            <p className="text-muted-foreground text-xs">Private records, contacts and spend are left out unless you turn them on.</p>
            <ul className="mt-2 divide-y rounded-xl border">
              {PARTS.map((p) => (
                <li key={p.id}>
                  <label className="flex cursor-pointer items-start justify-between gap-3 p-3">
                    <span className="min-w-0">
                      <span className="flex items-center gap-1.5 text-sm font-medium">{p.private ? <LockIcon className="size-3.5 shrink-0" /> : null}{p.label}</span>
                      <span className="text-muted-foreground block text-xs">{p.line}</span>
                      {p.private && parts[p.id] ? <span className="mt-1 block text-xs font-medium text-amber-600">This will be visible to anyone who uses the template.</span> : null}
                    </span>
                    <Switch checked={!!parts[p.id]} onCheckedChange={(v) => setParts({ ...parts, [p.id]: v })} aria-label={p.label} className="mt-0.5" />
                  </label>
                </li>
              ))}
            </ul>
          </section>

          <section className="relative space-y-4">
            <Num n="S5.3" className="absolute -top-2 right-0" />
            <div>
              <label htmlFor="t-title" className="text-sm font-semibold">Title</label>
              <Input id="t-title" className="mt-1" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
              <label htmlFor="t-desc" className="text-sm font-semibold">Description</label>
              <Textarea id="t-desc" rows={3} className="mt-1" value={desc} onChange={(e) => setDesc(e.target.value)} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <div className="text-sm font-semibold">Category</div>
                <Select value={category} onValueChange={(v) => setCategory(v as TemplateCategory)}>
                  <SelectTrigger className="mt-1 w-full" aria-label="Category"><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <div className="text-sm font-semibold">License</div>
                <Select value={license} onValueChange={setLicense}>
                  <SelectTrigger className="mt-1 w-full" aria-label="License"><SelectValue /></SelectTrigger>
                  <SelectContent>{LICENSES.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </section>
        </div>

        <aside className="min-w-0">
          <div className="space-y-4 lg:sticky lg:top-4">
            <section className="relative">
              <Num n="S5.4" className="absolute -top-2 left-0" />
              <h2 className="text-sm font-semibold">Preview</h2>
              <p className="text-muted-foreground text-xs">How the card shows in the library.</p>
              <div className="pointer-events-none mt-2"><TemplateCard t={preview} /></div>
            </section>
            <section className="relative rounded-xl border p-3 text-xs">
              <Num n="S5.5" className="absolute -top-2 right-2" />
              <div className="font-medium">Summary</div>
              <p className="text-muted-foreground mt-1">{included.length} of {PARTS.length} parts included. {PARTS.filter((p) => p.private && !parts[p.id]).length} private parts stripped. License: {license.toLowerCase()}.</p>
            </section>
            <div className="relative">
              <Num n="S5.6" className="absolute -top-2 right-0" />
              <Button size="lg" className="w-full" onClick={() => setPublished(true)}>Publish to community</Button>
              <p className="text-muted-foreground mt-2 text-xs">A reviewer checks every template before it is listed.</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
