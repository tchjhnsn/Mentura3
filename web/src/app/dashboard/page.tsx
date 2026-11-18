import type { Metadata } from "next";
import { Suspense } from "react";
import { SidebarButton } from "@/components/sidebar";
import { requireUser } from "@/server/session";
import { selfOf } from "@/server/profile-store";
import { EMPTY_LAYOUT, layoutOf } from "@/server/dashboard-layout";
import { AskBar } from "./ask-bar";
import { DASH_CARDS } from "./cards";
import { DashToaster } from "./instant";
import { DashGrid, EditButton, LayoutEditor } from "./layout-editor";
import { CardSkeleton, dayIn, hourIn, longDay, safe, type Ctx } from "./parts";
import { arrange } from "./urgency";

/** A card's urgency, given a second and a half; a slow or failing read scores 0 rather than hold the page. */
const scoreOf = (u: Promise<number>) => Promise.race([u.catch(() => 0), new Promise<number>((r) => setTimeout(() => r(0), 1500))]);

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

/**
 * The dashboard, kept apart from Home so it can be tried out (Torian, 2026-11-18 18:35Z): what needs the person now,
 * read from every part of Reflect, with Ask Reflect at the top. Each card is its own file in `cards/` and loads on
 * its own.
 */
export default async function Dashboard() {
  const user = await requireUser();
  const now = new Date();
  const ctx: Ctx = { userId: user.id, now, today: dayIn(now), tomorrow: dayIn(new Date(now.getTime() + 86400_000)) };
  const me = await safe(selfOf(user.id), { name: "", href: "" });
  const hour = hourIn(now);
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const first = me.name && me.name !== "Owner" ? me.name.split(" ")[0] : "";
  const suggestions = ["What's on my day?", "How is my budget this month?", "Find an event this week", "What should I learn next?"];
  // Cards rank by urgency (what needs the person soonest first) unless they set their own order in Edit dashboard.
  const [layout, scores] = await Promise.all([
    safe(layoutOf(user.id), EMPTY_LAYOUT),
    Promise.all(DASH_CARDS.map(async (d) => [d.id, d.urgency ? await scoreOf(d.urgency(ctx)) : 0] as const)).then(Object.fromEntries),
  ]);
  const shown = arrange(DASH_CARDS, scores, layout);
  const ranked = arrange(DASH_CARDS, scores, { order: [], hidden: [], size: {} }).order;
  const cards = DASH_CARDS.map(({ id, title, Card }) => ({
    id, title, node: shown.hidden.includes(id) ? null : <Suspense fallback={<CardSkeleton />}><Card ctx={ctx} /></Suspense>,
  }));

  return (
    <DashToaster><LayoutEditor cards={cards} initial={{ ...shown, ranked }}>
    <main className="mx-auto grid min-h-screen max-w-5xl grid-cols-[minmax(0,1fr)] content-start gap-8 px-4 py-6 sm:px-6">
      <header className="flex items-center gap-3">
        <SidebarButton />
        <span className="text-muted-foreground text-sm">{longDay(now)}</span>
        <EditButton />
      </header>

      <section aria-label="Ask Reflect" className="grid grid-cols-[minmax(0,1fr)] gap-4">
        <h1 className="text-3xl font-semibold tracking-tight">{greeting}{first ? `, ${first}` : ""}</h1>
        <AskBar suggestions={suggestions} />
      </section>

      <DashGrid />
    </main>
    </LayoutEditor></DashToaster>
  );
}
