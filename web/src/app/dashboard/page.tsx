import type { Metadata } from "next";
import { Suspense } from "react";
import { SidebarButton } from "@/components/sidebar";
import { requireUser } from "@/server/session";
import { selfOf } from "@/server/profile-store";
import { AskBar } from "./ask-bar";
import { DASH_CARDS } from "./cards";
import { CardSkeleton, dayIn, hourIn, longDay, safe, type Ctx } from "./parts";

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
  const column = (c: "main" | "side") => DASH_CARDS.filter((d) => d.column === c).map(({ id, Card }) => (
    <Suspense key={id} fallback={<CardSkeleton />}><Card ctx={ctx} /></Suspense>
  ));

  return (
    <main className="mx-auto grid min-h-screen max-w-5xl grid-cols-[minmax(0,1fr)] content-start gap-8 px-4 py-6 sm:px-6">
      <header className="flex items-center gap-3">
        <SidebarButton />
        <span className="text-muted-foreground text-sm">{longDay(now)}</span>
      </header>

      <section aria-label="Ask Reflect" className="grid grid-cols-[minmax(0,1fr)] gap-4">
        <h1 className="text-3xl font-semibold tracking-tight">{greeting}{first ? `, ${first}` : ""}</h1>
        <AskBar suggestions={suggestions} />
      </section>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="grid grid-cols-[minmax(0,1fr)] content-start gap-8">{column("main")}</div>
        <aside className="grid grid-cols-[minmax(0,1fr)] content-start gap-8">{column("side")}</aside>
      </div>
    </main>
  );
}
