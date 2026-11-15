"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * A show's episodes and what supports them (Scholē page priority guides, 2026-11-15, decision 2): on a phone, two tabs
 * under the hero, Episodes first; on a wide screen, the episodes in the main column and About in a side column.
 */
export function ShowTabs({ episodes, about }: { episodes: ReactNode; about: ReactNode }) {
  const [tab, setTab] = useState<"episodes" | "about">("episodes");
  const tabClass = (on: boolean) => cn("-mb-px border-b-2 px-1 pb-2 text-sm font-medium", on ? "border-foreground text-foreground" : "text-muted-foreground hover:text-foreground border-transparent");
  return (
    <div className="space-y-5">
      <div role="tablist" className="flex gap-6 border-b lg:hidden">
        <button type="button" role="tab" aria-selected={tab === "episodes"} className={tabClass(tab === "episodes")} onClick={() => setTab("episodes")}>Episodes</button>
        <button type="button" role="tab" aria-selected={tab === "about"} className={tabClass(tab === "about")} onClick={() => setTab("about")}>About</button>
      </div>
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start lg:gap-10">
        <div role="tabpanel" className={cn(tab === "episodes" ? "" : "hidden lg:block")}>{episodes}</div>
        <aside role="tabpanel" aria-label="About" className={cn("space-y-8", tab === "about" ? "" : "hidden lg:block")}>{about}</aside>
      </div>
    </div>
  );
}
