"use client";

// The switcher at the top of Mentura's sidebar: Personal (Mentura's social side), the Venture Studio, or one venture's
// console (spec "Venture console spec", 2026-11-24, after Whop's business switcher). Crossing it swaps the sidebar's
// contents; nothing stacks.
import Link from "next/link";
import { CheckIcon, ChevronsUpDownIcon, LayoutGridIcon, PlusIcon, RocketIcon } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { VENTURES, ventureHref, ventureOf } from "./data";
import { slugOf } from "./nav";

export type Mode = { kind: "personal" } | { kind: "studio" } | { kind: "venture"; slug: string };

export const modeOf = (path: string): Mode => {
  const slug = slugOf(path);
  if (slug) return { kind: "venture", slug };
  return path === "/studio" || path.startsWith("/studio/") ? { kind: "studio" } : { kind: "personal" };
};

const Swatch = ({ hue }: { hue: number }) => <span aria-hidden className="size-4 shrink-0 rounded" style={{ background: `oklch(0.65 0.14 ${hue})` }} />;

export function ModeSwitcher({ path, done }: { path: string; done: () => void }) {
  const mode = modeOf(path);
  const v = mode.kind === "venture" ? ventureOf(mode.slug) : null;
  const now = v
    ? { name: v.name, about: "Business console", icon: <Swatch hue={v.hue} /> }
    : mode.kind === "studio"
      ? { name: "Business Studio", about: "All your businesses", icon: <LayoutGridIcon className="size-4" /> }
      : { name: "Mentura", about: "Personal", icon: <RocketIcon className="size-4" /> };
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg" aria-label={`${now.name}, switch`}>
              <span className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">{now.icon}</span>
              <span className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{now.name}</span>
                <span className="text-muted-foreground truncate text-xs">{now.about}</span>
              </span>
              <ChevronsUpDownIcon className="text-muted-foreground ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            <DropdownMenuItem asChild>
              <Link href="/mentura" onClick={done} className="flex items-center gap-2"><RocketIcon className="size-4" /><span className="flex-1">Personal</span>{mode.kind === "personal" ? <CheckIcon className="size-4" /> : null}</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/studio" onClick={done} className="flex items-center gap-2"><LayoutGridIcon className="size-4" /><span className="flex-1">Business Studio</span>{mode.kind === "studio" ? <CheckIcon className="size-4" /> : null}</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-muted-foreground text-xs font-normal">Businesses</DropdownMenuLabel>
            {VENTURES.map((x) => (
              <DropdownMenuItem key={x.slug} asChild>
                <Link href={ventureHref(x.slug)} onClick={done} className="flex items-center gap-2"><Swatch hue={x.hue} /><span className="flex-1 truncate">{x.name}</span>{v?.slug === x.slug ? <CheckIcon className="size-4" /> : null}</Link>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/studio/new" onClick={done} className="flex items-center gap-2"><PlusIcon className="size-4" />New business</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
