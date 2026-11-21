"use client";

// The Venture Studio frame: C1 top bar with C2 venture switcher, C3 studio nav, C4 venture nav, and the slot for the
// C5 agent chat panel. Modeled on the shared anatomy of OpenAI Platform (project switcher, grouped left nav), Replit
// (agent beside the work, tools per project) and Base44 (prompt first, preview beside).
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type ReactNode } from "react";
import {
  ActivityIcon, BlocksIcon, BookOpenIcon, BotIcon, CheckIcon, ChevronsUpDownIcon, FileTextIcon, GaugeIcon, GitForkIcon,
  HashIcon, HomeIcon, LayoutGridIcon, LibraryIcon, MapIcon, MenuIcon, MessageSquareIcon, PlugIcon, PlusIcon,
  PresentationIcon, ScaleIcon, SendIcon, SettingsIcon, TargetIcon, WorkflowIcon, XIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Num, StatusDot, useNums } from "./bits";
import { LeadMark } from "./conversation";
import { LEADS } from "./phase";
import { VENTURES, ventureHref, ventureOf } from "./data";

type NavItem = { href: string; label: string; icon: typeof HomeIcon; n: string; exact?: boolean };
type NavGroup = { label?: string; more?: boolean; items: NavItem[] };

const STUDIO_NAV: NavGroup[] = [
  { items: [
    { href: "/studio", label: "Home", icon: HomeIcon, n: "S1", exact: true },
    { href: "/studio/new", label: "New venture", icon: PlusIcon, n: "S2" },
  ] },
  { label: "Find", items: [
    { href: "/studio/library", label: "Library", icon: LibraryIcon, n: "S3", exact: true },
  ] },
  { label: "Manage", items: [
    { href: "/studio/usage", label: "Usage", icon: GaugeIcon, n: "S6" },
    { href: "/studio/settings", label: "Settings", icon: SettingsIcon, n: "S7" },
    { href: "/studio/map", label: "Screen map", icon: MapIcon, n: "S0" },
  ] },
];

// Inside a venture the nav is short: the agents you talk to, then the venture's records. Everything else is
// reached from an agent's answer or from More, folded by default (Torian, 2026-11-21: "much more simplicity").
const ventureNav = (slug: string): NavGroup[] => {
  const h = (r: string) => ventureHref(slug, r);
  return [
    { label: "Records", items: [
      { href: h("files"), label: "Records and documents", icon: FileTextIcon, n: "V2" },
      { href: h("decisions"), label: "Decisions", icon: ScaleIcon, n: "V15" },
      { href: h("activity"), label: "Activity", icon: ActivityIcon, n: "V9" },
    ] },
    { label: "More", more: true, items: [
      { href: h("strategy"), label: "Strategy", icon: TargetIcon, n: "V4" },
      { href: h("decks/investor"), label: "Decks", icon: PresentationIcon, n: "V5" },
      { href: h("outreach"), label: "Outreach", icon: SendIcon, n: "V13" },
      { href: h("agents"), label: "Function agents", icon: BotIcon, n: "V6" },
      { href: h("automations"), label: "Automations", icon: WorkflowIcon, n: "V8" },
      { href: h("functions"), label: "Functions", icon: BlocksIcon, n: "V11" },
      { href: h("connectors"), label: "Connectors", icon: PlugIcon, n: "V14" },
      { href: h("settings"), label: "Settings", icon: SettingsIcon, n: "V16" },
    ] },
  ];
};

/** C17 Agent list: the chief of staff and the four leads, each opening its conversation (V1). */
function AgentList({ slug, onGo }: { slug: string; onGo?: () => void }) {
  const path = usePathname() ?? "";
  const params = useSearchParams();
  const at = path === ventureHref(slug) ? (params?.get("agent") ?? "chief-of-staff") : null;
  return (
    <div className="relative">
      <Num n="C17" className="absolute -top-1 right-0" />
      <div className="text-muted-foreground px-2 pb-1 text-xs">Agents</div>
      <ul className="space-y-0.5">
        {LEADS.map((l) => (
          <li key={l.id}>
            <Link href={l.id === "chief-of-staff" ? ventureHref(slug) : `${ventureHref(slug)}?agent=${l.id}`} onClick={onGo} aria-current={at === l.id ? "page" : undefined}
              className={cn("flex items-center gap-2 rounded-md px-2 py-1.5 text-sm", at === l.id ? "bg-accent font-medium" : "hover:bg-accent/60")}>
              <LeadMark lead={l} size={l.id === "chief-of-staff" ? 22 : 18} />
              <span className="min-w-0 flex-1 truncate">{l.name}</span>
              <StatusDot status={l.status} label={false} />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

const slugOf = (path: string) => path.match(/^\/studio\/v\/([^/]+)/)?.[1] ?? null;

/** C2 Venture switcher (OpenAI Platform's project switcher). */
function VentureSwitcher({ slug }: { slug: string | null }) {
  const v = slug ? ventureOf(slug) : null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className="hover:bg-accent relative flex min-w-0 items-center gap-2 rounded-md px-2 py-1.5 text-sm">
          <Num n="C2" className="absolute -top-1.5 -right-1" />
          {v ? <span className="size-4 shrink-0 rounded" style={{ background: `oklch(0.65 0.14 ${v.hue})` }} /> : <LibraryIcon className="size-4 shrink-0" />}
          <span className="truncate font-medium">{v ? v.name : "All ventures"}</span>
          <ChevronsUpDownIcon className="text-muted-foreground size-3.5 shrink-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel className="text-muted-foreground text-xs font-normal">Ventures</DropdownMenuLabel>
        {VENTURES.map((x) => (
          <DropdownMenuItem key={x.slug} asChild>
            <Link href={ventureHref(x.slug)} className="flex items-center gap-2">
              <span className="size-4 rounded" style={{ background: `oklch(0.65 0.14 ${x.hue})` }} />
              <span className="flex-1 truncate">{x.name}</span>
              {x.slug === slug ? <CheckIcon className="size-4" /> : null}
            </Link>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild><Link href="/studio/new"><PlusIcon className="size-4" />New venture</Link></DropdownMenuItem>
        <DropdownMenuItem asChild><Link href="/studio"><LayoutGridIcon className="size-4" />All ventures</Link></DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NavList({ groups, path, onGo }: { groups: NavGroup[]; path: string; onGo?: () => void }) {
  return (
    <nav className="space-y-4">
      {groups.map((g, i) => (
        <details key={i} open={!g.more || g.items.some((it) => path.startsWith(it.href))} className="group/nav">
          <summary className={cn("text-muted-foreground list-none px-2 pb-1 text-xs [&::-webkit-details-marker]:hidden", g.more ? "hover:text-foreground cursor-pointer" : "pointer-events-none", !g.label && "sr-only")}>{g.label ?? "Pages"}{g.more ? <span className="ml-1 group-open/nav:hidden">({g.items.length})</span> : null}</summary>
          <ul className="space-y-0.5">
            {g.items.map((it) => {
              const active = it.exact ? path === it.href : path === it.href || path.startsWith(`${it.href}/`) || (it.n === "V5" && path.includes("/decks/"));
              return (
                <li key={it.href}>
                  <Link href={it.href} onClick={onGo} aria-current={active ? "page" : undefined}
                    className={cn("flex items-center gap-2 rounded-md px-2 py-1.5 text-sm", active ? "bg-accent font-medium" : "text-muted-foreground hover:bg-accent/60 hover:text-foreground")}>
                    <it.icon className="size-4 shrink-0" /><span className="flex-1 truncate">{it.label}</span><Num n={it.n} />
                  </Link>
                </li>
              );
            })}
          </ul>
        </details>
      ))}
    </nav>
  );
}

/** "Ask the agent" from any venture screen opens the chief of staff's conversation (V1). */
export function useChat() {
  const router = useRouter();
  const slug = slugOf(usePathname() ?? "");
  return { open: false, setOpen: (v: boolean) => { if (v && slug) router.push(ventureHref(slug)); } };
}

/** C1 Top bar plus the left nav (C3 studio, C4 venture) for every Studio screen. No side panels: inside a venture
 * the agents are in the nav and you talk to them in the page itself. */
export function StudioFrame({ children }: { children: ReactNode }) {
  const path = usePathname() ?? "/studio";
  const slug = slugOf(path);
  const groups = slug ? ventureNav(slug) : STUDIO_NAV;
  const navN = slug ? "C4" : "C3";
  const [menu, setMenu] = useState(false);
  const nums = useNums();
  const nav = (onGo?: () => void) => (
    <div className="space-y-4">
      {slug ? <Suspense fallback={null}><AgentList slug={slug} onGo={onGo} /></Suspense> : null}
      <NavList groups={groups} path={path} onGo={onGo} />
    </div>
  );
  return (
    <div className="bg-background flex h-dvh flex-col overflow-hidden">
      <header className="relative flex h-12 shrink-0 items-center gap-1 border-b px-2 md:px-3">
        <Num n="C1" className="absolute top-0.5 left-0.5" />
        <Button variant="ghost" size="icon-sm" className="md:hidden" onClick={() => setMenu(true)} aria-label="Menu"><MenuIcon /></Button>
        <Link href="/mentura" className="hidden items-center gap-2 px-2 text-sm font-semibold md:flex">Mentura</Link>
        <span className="text-muted-foreground hidden md:inline">/</span>
        <Link href="/studio" className="hover:bg-accent hidden rounded-md px-2 py-1.5 text-sm md:block">Venture Studio</Link>
        <span className="text-muted-foreground hidden md:inline">/</span>
        <VentureSwitcher slug={slug} />
        <div className="flex-1" />
        <Button variant="ghost" size="sm" onClick={() => nums.set(!nums.on)} aria-pressed={nums.on} title="Show screen and component numbers">
          <HashIcon />
          <span className="hidden sm:inline">{nums.on ? "Numbers on" : "Numbers off"}</span>
        </Button>
      </header>
      <div className="flex min-h-0 flex-1">
        <aside className="relative hidden w-56 shrink-0 overflow-y-auto border-r p-3 md:block">
          <Num n={navN} className="absolute top-1 right-1" />
          {nav()}
        </aside>
        <main className="min-w-0 flex-1 overflow-y-auto">{children}</main>
      </div>
      <Sheet open={menu} onOpenChange={setMenu}>
        <SheetContent side="left" className="w-72 overflow-y-auto p-3">
          <SheetTitle className="px-2 pt-1 text-sm">{slug ? ventureOf(slug).name : "Venture Studio"}</SheetTitle>
          {nav(() => setMenu(false))}
        </SheetContent>
      </Sheet>
    </div>
  );
}

/** The heading every screen starts with: number, title, one line on its job, and the screen's main act on the right. */
export function ScreenHead({ n, title, job, children }: { n: string; title: string; job?: string; children?: ReactNode }) {
  return (
    <div data-virtu-screen={n} className="flex flex-wrap items-start justify-between gap-3 px-4 pt-5 pb-4 md:px-8 md:pt-8">
      <div className="min-w-0">
        <div className="flex items-center gap-2"><Num n={n} /><h1 className="truncate text-xl font-semibold tracking-tight md:text-2xl">{title}</h1></div>
        {job ? <p className="text-muted-foreground mt-1 text-sm">{job}</p> : null}
      </div>
      {children ? <div className="flex shrink-0 items-center gap-2">{children}</div> : null}
    </div>
  );
}
