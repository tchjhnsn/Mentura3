"use client";

// C13 Template card: a venture, agent, automation or deck someone made, with what it sets up. Opens the template (S4).
import Link from "next/link";
import { BadgeCheckIcon, BotIcon, PresentationIcon, RocketIcon, UsersIcon, WorkflowIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Face, Num } from "./bits";
import type { Template } from "./data";

const KIND = {
  venture: { label: "Business", icon: RocketIcon },
  agent: { label: "Agent", icon: BotIcon },
  automation: { label: "Automation", icon: WorkflowIcon },
  deck: { label: "Deck", icon: PresentationIcon },
} as const;

/** The maker of a template: Mentura for official ones, a face with a name for everyone else. */
export function Maker({ maker, size = 20 }: { maker: string; size?: number }) {
  if (maker === "Mentura") return <span className="text-muted-foreground inline-flex items-center gap-1 text-xs"><BadgeCheckIcon className="size-3.5" />By Mentura</span>;
  return <Face id={maker} size={size} sub="" />;
}

export function TemplateCard({ t, className }: { t: Template; className?: string }) {
  const K = KIND[t.kind];
  return (
    <Link href={`/studio/library/${t.id}`} className={cn("bg-card hover:border-foreground/30 group relative flex min-w-0 flex-col rounded-xl border p-4 transition-colors", className)}>
      <Num n="C13" className="absolute -top-2 right-3" />
      <div className="flex items-center gap-2">
        <span className="grid size-8 shrink-0 place-items-center rounded-lg text-white" style={{ background: `oklch(0.62 0.13 ${t.hue})` }}><K.icon className="size-4" /></span>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold group-hover:underline">{t.title}</div>
          <div className="text-muted-foreground text-xs">{K.label} · {t.category}</div>
        </div>
      </div>
      <p className="text-muted-foreground mt-3 line-clamp-2 text-sm">{t.oneLine}</p>
      <ul className="mt-3 flex flex-wrap gap-1">
        {t.sets.map((s) => <li key={s} className="bg-muted rounded px-1.5 py-0.5 text-xs">{s}</li>)}
      </ul>
      <div className="mt-auto flex items-center justify-between gap-2 pt-4">
        <Maker maker={t.maker} />
        <span className="text-muted-foreground inline-flex shrink-0 items-center gap-1 text-xs"><UsersIcon className="size-3.5" />{t.uses.toLocaleString("en-US")} uses</span>
      </div>
    </Link>
  );
}
