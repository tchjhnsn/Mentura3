import type { Metadata } from "next";
import type { ReactNode } from "react";
import { BellIcon } from "lucide-react";
import { ThingHeader } from "@/components/headers";
import { COLUMN, Group, InfoRow } from "@/components/list-rows";
import { PAGE } from "@/components/page-header";
import { cn } from "@/lib/utils";
import { db } from "@/db/pool";
import { BRIEF_SENDER_ENV, briefOf, isOwnerOf } from "@/server/dashboard-reach";
import { dashUsage, morningBriefOn } from "@/server/dashboard-event-store";
import { todayFacts } from "@/server/dashboard-today";
import { OWNER_ID, requireUser } from "@/server/session";
import { DASH_CARDS } from "@/app/dashboard/cards";
import { setMorningBriefFromPage } from "./actions";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

const CARD_LABEL: Record<string, string> = {
  ...Object.fromEntries(DASH_CARDS.map((c) => [c.id, c.title])),
  ask: "New Chat", "household-people": "Household, who is doing what", "household-calendar": "Household, this week", "household-money": "Household budget",
};
const seconds = (ms: number | null) => (ms === null ? "None yet" : ms < 10_000 ? `${(ms / 1000).toFixed(1)} s` : `${Math.round(ms / 1000)} s`);

/** A row that switches something on or off with one tap, in Settings' list style. */
function SwitchRow({ icon, label, sub, on, action }: { icon: ReactNode; label: string; sub: string; on: boolean; action: () => Promise<void> }) {
  return (
    <li>
      <form action={action}>
        <button type="submit" role="switch" aria-checked={on} className="hover:bg-accent flex min-h-14 w-full items-center gap-4 px-4 py-3 text-left transition">
          <span className="text-muted-foreground grid min-w-6 shrink-0 place-items-center [&>svg]:size-5">{icon}</span>
          <span className="grid min-w-0 flex-1"><span className="text-base">{label}</span><span className="text-muted-foreground text-sm">{sub}</span></span>
          <span aria-hidden="true" className={cn("relative h-6 w-10 shrink-0 rounded-full transition", on ? "bg-primary" : "bg-input")}>
            <span className={cn("bg-background absolute top-0.5 size-5 rounded-full shadow-sm transition-all", on ? "left-[1.125rem]" : "left-0.5")} />
          </span>
        </button>
      </form>
    </li>
  );
}

/**
 * Settings, Dashboard: the morning brief's opt-in with today's brief as it would read, and, for Reflect's owner
 * only, which dashboard cards people tap and how long they take to act (first-party counts, migration 0054).
 */
export default async function DashboardSettings() {
  const user = await requireUser();
  const [on, who, facts] = await Promise.all([
    morningBriefOn(user.id).catch(() => false),
    db().query(`SELECT name, email FROM "user" WHERE id = $1`, [user.id]).then((r) => r.rows[0] as { name?: string; email?: string } | undefined),
    todayFacts(user.id),
  ]);
  const owner = isOwnerOf({ id: user.id, email: who?.email }, OWNER_ID, process.env.REFLECT_OWNER_EMAILS ?? "");
  const usage = owner ? await dashUsage(30).catch(() => null) : null;
  const first = who?.name && who.name !== "Owner" ? who.name.split(" ")[0] : "";
  const brief = briefOf(facts, first);
  return (
    <main className={PAGE}>
      <ThingHeader search={false} back="/settings" backLabel="Settings" crumbs={[{ label: "Settings", href: "/settings" }]} title="Dashboard" />
      <div className={COLUMN}>
        <h1 id="page-title" className="text-center text-xl font-semibold tracking-tight">Dashboard</h1>

        <Group title="Morning brief" id="brief">
          <SwitchRow icon={<BellIcon />} label="Morning brief" sub="Your next item, who is waiting and your money left, each morning" on={on} action={setMorningBriefFromPage.bind(null, !on)} />
        </Group>
        <section aria-label="Today's brief" className="bg-card grid gap-2 rounded-2xl border p-4">
          <span className="text-muted-foreground text-sm">Today's brief would read</span>
          <span className="font-medium">{brief.subject}</span>
          {brief.lines.map((l, i) => <p key={i} className="text-sm">{l}</p>)}
        </section>
        <p className="text-muted-foreground px-4 text-sm">Sending it is not built yet: Reflect has no email or notification service. Turning it on keeps your choice for when it does.</p>

        {usage ? (
          <>
            <Group title={`Use, last ${usage.days} days (only you see this)`} id="use">
              <InfoRow label="People who opened it" value={String(usage.people)} />
              <InfoRow label="Opens" value={String(usage.opens)} />
              <InfoRow label="Median time to first act" value={`${seconds(usage.medianMs)}${usage.firstActs ? ` (${usage.firstActs})` : ""}`} />
            </Group>
            <Group title="Taps by card" id="taps">
              {usage.taps.length ? usage.taps.map((t) => <InfoRow key={t.card} label={CARD_LABEL[t.card] ?? t.card} value={String(t.taps)} />) : <InfoRow label="No taps yet" value="" />}
            </Group>
            <p className="text-muted-foreground px-4 text-sm">Counted by Reflect itself, no outside analytics. To send the brief, set {BRIEF_SENDER_ENV.email.join(" and ")} for email, or {BRIEF_SENDER_ENV.push.join(", ")} for notifications, plus {BRIEF_SENDER_ENV.cron[0]} for the daily job.</p>
          </>
        ) : null}
      </div>
    </main>
  );
}
