"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { PaletteIcon } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { LookPicker } from "@/components/look-picker";
import type { Look } from "@/lib/themes";

/**
 * Home's color key, which is also the way to change the look (Torian, 2026-11-17): a tap on the key opens the theme,
 * light or dark, and background, without leaving Home.
 */
export function LookMenu({ look, today, children }: { look: Look; today: string; children: ReactNode }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="text-muted-foreground hover:text-foreground hover:bg-accent flex items-center gap-6 rounded-full px-4 py-1.5 text-xs transition" aria-label="Color key. Change theme and background">
        {children}
        <PaletteIcon className="size-3.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="center" className="w-[22rem] p-4">
        <LookPicker look={look} today={today} compact />
        <Link href="/settings/appearance" className="text-muted-foreground hover:text-foreground mt-3 block text-xs">More in Settings</Link>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
