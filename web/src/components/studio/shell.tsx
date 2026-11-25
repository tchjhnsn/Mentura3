"use client";

// The Venture Studio frame: C1 top bar. Ventures are switched at the top of the app's one sidebar (./switcher.tsx), and
// the C3 studio nav and C4 venture nav (./nav.ts) are drawn there in place of Mentura's (src/components/sidebar.tsx).
// Modeled on OpenAI Platform (project switcher, grouped nav), Replit and Base44.
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { HashIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarButton } from "@/components/sidebar";
import { Num, useNums } from "./bits";
import { businessHref, FUNCTIONS, teamHref } from "./data";
import { useBusiness } from "./business";
import { levelOf, toolOf } from "./tools";
import { useTeam } from "./team";
import { BottomBar } from "./bottom-bar";

/** "Ask the agent" from any business screen opens the Agents view (V6). */
export function useChat() {
  const router = useRouter();
  const at = levelOf(usePathname() ?? "");
  return { open: false, setOpen: (v: boolean) => { if (v && at.kind !== "studio") router.push(businessHref(at.team, at.slug, "agents")); } };
}

/** C1 Top bar for every Studio screen, and B1 the bottom bar inside a business. Its pages are in the app's one sidebar, under Mentura's (StudioNav in
 * src/components/sidebar.tsx: C3 studio pages, C4 a venture's pages), in place of Mentura's, under the switcher. */
export function StudioFrame({ children }: { children: ReactNode }) {
  const path = usePathname() ?? "/studio";
  const nums = useNums();
  return (
    <div className="bg-background flex h-dvh flex-col overflow-hidden md:h-[calc(100dvh-1rem)]">
      <header className="relative flex h-12 shrink-0 items-center gap-1 border-b px-2 md:px-3">
        <Num n="C1" className="absolute top-0.5 left-0.5" />
        <SidebarButton className="-ml-1" />
        <Crumbs path={path} />
        <div className="flex-1" />
        {/* Screen and component numbers are a design aid, shown only in development (doc "Mentura console", C2). */}
        {process.env.NODE_ENV !== "production" ? (
          <Button variant="ghost" size="sm" onClick={() => nums.set(!nums.on)} aria-pressed={nums.on} title="Show screen and component numbers">
            <HashIcon />
            <span className="hidden sm:inline">{nums.on ? "Numbers on" : "Numbers off"}</span>
          </Button>
        ) : null}
      </header>
      {/* B1 Bottom bar (./bottom-bar.tsx) under the content, never under the sidebar; its panel opens over the page's foot. */}
      <div className="relative flex min-h-0 flex-1 flex-col">
        <main className="min-w-0 flex-1 overflow-y-auto">{children}</main>
        <BottomBar />
      </div>
    </div>
  );
}

/** The path in the top bar, after Vercel's: the team, then the business, the function and the tool, each a link up. */
function Crumbs({ path }: { path: string }) {
  const at = levelOf(path);
  const team = useTeam();
  const link = "hover:bg-accent truncate rounded-md px-2 py-1.5 text-sm";
  const sep = <span aria-hidden className="text-muted-foreground/60 text-sm">/</span>;
  const teamSlug = at.team ?? team?.slug ?? null;
  const teamLink = teamSlug
    ? <Link href={teamHref(teamSlug)} className={`${link} ${at.kind === "studio" ? "font-medium" : "text-muted-foreground hidden sm:inline"}`}>{team?.slug === teamSlug ? team.name : "Team"}</Link>
    : <Link href="/studio" className={`${link} font-medium`}>Businesses</Link>;
  if (at.kind === "studio") return teamLink;
  const fn = at.kind === "function" ? FUNCTIONS.find((f) => f.id === at.fn) : undefined;
  const tool = at.kind === "function" && at.tool ? toolOf(at.tool) : undefined;
  return (
    <nav aria-label="Where you are" className="flex min-w-0 items-center gap-0.5">
      {teamLink}<span className="hidden sm:inline">{sep}</span>
      <Path team={at.team} slug={at.slug} fn={fn} tool={tool} integrations={at.kind === "integrations"} link={link} sep={sep} />
    </nav>
  );
}

function Path({ team, slug, fn, tool, integrations, link, sep }: { team: string; slug: string; fn?: { id: string; label: string }; tool?: { title: string }; integrations?: boolean; link: string; sep: ReactNode }) {
  const name = useBusiness(slug)?.name ?? slug;
  return (
    <>
      <Link href={businessHref(team, slug)} className={`${link} font-medium`}>{name}</Link>
      {fn ? <>{sep}<Link href={businessHref(team, slug, `functions/${fn.id}`)} className={link}>{fn.label}</Link></> : null}
      {tool ? <>{sep}<span className="truncate px-2 py-1.5 text-sm">{tool.title}</span></> : null}
      {integrations ? <>{sep}<Link href={businessHref(team, slug, "integrations")} className={link}>Integrations</Link></> : null}
    </>
  );
}

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
