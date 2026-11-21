"use client";

// S3 Venture library: templates for ventures, agents, automations, decks and docs, from Mentura, the community and you.
import Link from "next/link";
import { useState } from "react";
import { GitForkIcon, SearchIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Num } from "@/components/studio/bits";
import { ScreenHead } from "@/components/studio/shell";
import { TemplateCard } from "@/components/studio/template-card";
import { SCREENS, TEMPLATES, type TemplateCategory, type TemplateKind, type TemplateSource } from "@/components/studio/data";

const S3 = SCREENS.find((s) => s.id === "S3")!;
const TABS: { id: TemplateKind; label: string }[] = [
  { id: "venture", label: "Ventures" }, { id: "agent", label: "Agents" }, { id: "automation", label: "Automations" }, { id: "deck", label: "Decks and docs" },
];
const SOURCES: { id: TemplateSource | "all"; label: string }[] = [
  { id: "all", label: "All" }, { id: "official", label: "Official" }, { id: "community", label: "Community" }, { id: "yours", label: "Yours" },
];
const CATEGORIES: TemplateCategory[] = ["B2B SaaS", "Consumer app", "Services", "Hardware", "Nonprofit", "Creator"];

export default function Library() {
  const [tab, setTab] = useState<TemplateKind>("venture");
  const [source, setSource] = useState<TemplateSource | "all">("all");
  const [cat, setCat] = useState<TemplateCategory | null>(null);
  const [q, setQ] = useState("");

  const needle = q.trim().toLowerCase();
  const shown = TEMPLATES.filter((t) => t.kind === tab && (source === "all" || t.source === source) && (!cat || t.category === cat)
    && (!needle || `${t.title} ${t.oneLine} ${t.maker} ${t.sets.join(" ")}`.toLowerCase().includes(needle)));
  const clear = () => { setSource("all"); setCat(null); setQ(""); };

  return (
    <div className="pb-16">
      <ScreenHead n="S3" title={S3.title} job={S3.job}>
        <Button variant="outline" asChild><Link href="/studio/library/publish"><GitForkIcon />Publish a template</Link></Button>
      </ScreenHead>

      <div className="space-y-4 px-4 md:px-8">
        <div className="relative">
          <Num n="S3.1" className="absolute -top-2 right-0 z-10" />
          <Tabs value={tab} onValueChange={(v) => setTab(v as TemplateKind)}>
            <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
              <TabsList variant="line">
                {TABS.map((t) => <TabsTrigger key={t.id} value={t.id}>{t.label}<span className="text-muted-foreground text-xs">{TEMPLATES.filter((x) => x.kind === t.id).length}</span></TabsTrigger>)}
              </TabsList>
            </div>
          </Tabs>
        </div>

        <div className="relative flex flex-col gap-3 md:flex-row md:items-center">
          <Num n="S3.2" className="absolute -top-2 right-0 z-10" />
          <div className="relative md:w-72">
            <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search templates" className="pl-8" aria-label="Search templates" />
          </div>
          <div className="bg-muted inline-flex w-fit rounded-lg p-0.5" role="radiogroup" aria-label="Source">
            {SOURCES.map((s) => (
              <button key={s.id} type="button" role="radio" aria-checked={source === s.id} onClick={() => setSource(s.id)}
                className={cn("rounded-md px-2.5 py-1 text-xs font-medium", source === s.id ? "bg-background shadow-xs" : "text-muted-foreground hover:text-foreground")}>{s.label}</button>
            ))}
          </div>
        </div>

        <div className="relative flex flex-wrap gap-1.5" role="group" aria-label="Category">
          <Num n="S3.3" className="absolute -top-2 right-0" />
          {CATEGORIES.map((c) => (
            <button key={c} type="button" aria-pressed={cat === c} onClick={() => setCat(cat === c ? null : c)}
              className={cn("rounded-full border px-2.5 py-1 text-xs", cat === c ? "bg-foreground text-background border-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground")}>{c}</button>
          ))}
        </div>

        <section className="relative pt-2">
          <Num n="S3.4" className="absolute -top-1 right-0" />
          <p className="text-muted-foreground mb-2 text-xs" aria-live="polite">{shown.length} {shown.length === 1 ? "template" : "templates"}</p>
          {shown.length ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {shown.map((t) => <TemplateCard key={t.id} t={t} />)}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed p-8 text-center">
              <p className="text-sm font-medium">No templates match</p>
              <p className="text-muted-foreground mt-1 text-xs">Try another word, or clear the source and category.</p>
              <Button variant="ghost" size="sm" className="mt-3" onClick={clear}>Clear filters</Button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
