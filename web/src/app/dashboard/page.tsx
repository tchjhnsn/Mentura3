import type { Metadata } from "next";
import { Suspense } from "react";
import { SidebarButton } from "@/components/sidebar";
import { requireUser } from "@/server/session";
import { selfOf } from "@/server/profile-store";
import { householdOf } from "@/server/household-store";
import { suggestionsOf } from "@/server/dashboard-brief";
import { BriefCard, BriefSkeleton } from "./brief-card";
import { EMPTY_LAYOUT, layoutOf } from "@/server/dashboard-layout";
import { AskBar } from "./ask-bar";
import { DASH_CARDS } from "./cards";
import { Board } from "./first-run";
import { DashBeacon } from "./beacon";
import { HouseholdDashboard, ScopeToggle } from "./household";
import { MemberDashboard } from "./member";
import { DashToaster } from "./instant";
import { DashGrid, EditButton, LayoutEditor } from "./layout-editor";
import { CardSkeleton, dayIn, hourIn, longDay, safe, type Ctx } from "./parts";
import { arrange, EMPTY_LAYOUT as EMPTY_EDIT, toEdit } from "./urgency";

/** A card's urgency, given a second and a half; a slow or failing read scores 0 rather than hold the page. */
const scoreOf = (u: Promise<number>) => Promise.race([u.catch(() => 0), new Promise<number>((r) => setTimeout(() => r(0), 1500))]);

export const metadata: Metadata = { title: "Dashboard", appleWebApp: { capable: true, title: "Reflect", statusBarStyle: "default" } };
export const dynamic = "force-dynamic";

/**
 * The dashboard, kept apart from Home so it can be tried out (Torian, 2026-11-18 18:35Z): what needs the person now,
 * read from every part of Reflect, with Ask Reflect at the top. Each card is its own file in `cards/` and loads on
 * its own.
 */
export default async function Dashboard({ searchParams }: { searchParams: Promise<{ view?: string; for?: string }> }) {
  const sp = await searchParams;
  const user = await requireUser();
  // A member without a login (an elder, a child) has their own view, opened from the household's.
  if (sp.for) return <MemberDashboard userId={user.id} memberId={sp.for} />;
  const now = new Date();
  const ctx: Ctx = { userId: user.id, now, today: dayIn(now), tomorrow: dayIn(new Date(now.getTime() + 86400_000)) };
  const [me, stored, suggestions, household, scores] = await Promise.all([
    safe(selfOf(user.id), { name: "", href: "" }),
    safe(layoutOf(user.id), EMPTY_LAYOUT),
    suggestionsOf(user.id, ctx.today),
    safe(householdOf(user.id), null),
    Promise.all(DASH_CARDS.map(async (d) => [d.id, d.urgency ? await scoreOf(d.urgency(ctx)) : 0] as const)).then((e) => Object.fromEntries(e) as Record<string, number>),
  ]);
  // Me or Household: the toggle shows when someone else lives with them; Me is the default.
  const shared = (household?.members.length ?? 0) > 1;
  const ours = shared && sp.view === "household";
  const hour = hourIn(now);
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const first = me.name && me.name !== "Owner" ? me.name.split(" ")[0] : "";
  // Cards rank by urgency (what needs the person soonest first) unless they set their own order in Edit dashboard;
  // the layout is kept in ../../server/dashboard-layout.ts and read here as Edit dashboard works on it (./urgency.ts).
  const layout = toEdit(stored);
  const shown = arrange(DASH_CARDS, scores, layout);
  const ranked = arrange(DASH_CARDS, scores, EMPTY_EDIT).order;
  const cards = DASH_CARDS.map(({ id, title, skeleton, Card }) => ({
    id, title, node: shown.hidden.includes(id) ? null : <Suspense fallback={<CardSkeleton shape={skeleton} />}><Card ctx={ctx} /></Suspense>,
  }));

  return (
    <DashToaster><LayoutEditor cards={cards} initial={{ ...shown, ranked }}>
    <main className="mx-auto grid min-h-screen max-w-5xl grid-cols-[minmax(0,1fr)] content-start gap-8 px-4 py-6 sm:px-6">
      <header className="flex items-center gap-3">
        <SidebarButton />
        <span className="text-muted-foreground min-w-0 flex-1 truncate text-sm">{longDay(now)}</span>
        {shared ? <ScopeToggle ours={ours} /> : null}
        {ours ? null : <EditButton />}
      </header>
      <DashBeacon />

      <section aria-label="Ask Reflect" data-dash-card="ask" className="grid grid-cols-[minmax(0,1fr)] gap-4">
        <h1 className="text-3xl font-semibold tracking-tight">{greeting}{first ? `, ${first}` : ""}</h1>
        <Suspense fallback={<BriefSkeleton />}><BriefCard ctx={ctx} /></Suspense>
        <AskBar suggestions={suggestions} />
      </section>

      {ours ? <Suspense fallback={<CardSkeleton />}><HouseholdDashboard ctx={ctx} /></Suspense> : (
      <Suspense fallback={<CardSkeleton shape="hero" />}>
        <Board ctx={ctx}>
          <DashGrid />
        </Board>
      </Suspense>
      )}
    </main>
    </LayoutEditor></DashToaster>
  );
}
