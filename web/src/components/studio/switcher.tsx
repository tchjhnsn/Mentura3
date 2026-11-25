"use client";

// C1 Team switcher, the top of Mentura's sidebar (doc "Mentura console: screens, navigation and teams", 2026-11-25,
// after Vercel's team and project popover, Mobbin "Switching teams" e626cf86). It names the team you are in, never a
// mode: Personal moved into the account menu at the sidebar's foot (Torian chose it on 2026-11-25), and the sample
// businesses left it. Until teams exist (round 2) everyone has one team, their own, named after them.
import Link from "next/link";
import { CheckIcon, ChevronsUpDownIcon, PlusIcon } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { useState } from "react";
import { listVentures } from "@/app/studio/actions";
import { ventureHref } from "./data";
import { hueOf } from "./business-data";
import { slugOf } from "./nav";
import { TeamAvatar, teamName } from "./team";

const Swatch = ({ hue }: { hue: number }) => <span aria-hidden className="size-4 shrink-0 rounded" style={{ background: `oklch(0.65 0.14 ${hue})` }} />;

export function TeamSwitcher({ path, me, done }: { path: string; /** The signed-in person's name, which names their team. */ me: string | null; done: () => void }) {
  const team = teamName(me);
  const current = slugOf(path);
  // The team's businesses, read from Naive once the menu is first opened.
  const [real, setReal] = useState<{ id: string; name: string }[] | null>(null);
  const load = (open: boolean) => { if (open && real === null) void listVentures().then((r) => setReal(r.ok ? r.value : [])); };
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu onOpenChange={load}>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg" aria-label={`${team}, switch team or business`}>
              <TeamAvatar name={team} />
              <span className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{team}</span>
                <span className="text-muted-foreground truncate text-xs">Owner</span>
              </span>
              <ChevronsUpDownIcon className="text-muted-foreground ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            <DropdownMenuLabel className="text-muted-foreground text-xs font-normal">Teams</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link href="/studio" onClick={done} className="flex items-center gap-2"><TeamAvatar name={team} small /><span className="flex-1 truncate">{team}</span><CheckIcon className="size-4" aria-label="Current team" /></Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-muted-foreground text-xs font-normal">Businesses</DropdownMenuLabel>
            {real === null ? <DropdownMenuItem disabled>Loading</DropdownMenuItem> : real.length === 0 ? <DropdownMenuItem disabled>No businesses yet</DropdownMenuItem> : real.map((x) => (
              <DropdownMenuItem key={x.id} asChild>
                <Link href={ventureHref(encodeURIComponent(x.id))} onClick={done} className="flex items-center gap-2"><Swatch hue={hueOf(x.id)} /><span className="flex-1 truncate">{x.name}</span>{current && decodeURIComponent(current) === x.id ? <CheckIcon className="size-4" aria-label="Current business" /> : null}</Link>
              </DropdownMenuItem>
            ))}
            <DropdownMenuItem asChild>
              <Link href="/studio/new" onClick={done} className="flex items-center gap-2"><PlusIcon className="size-4" />New business</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
