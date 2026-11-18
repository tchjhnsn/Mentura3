import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { CalendarIcon, ChevronRightIcon, UsersIcon, WalletIcon } from "lucide-react";
import { Face } from "@/components/dash";
import { cn } from "@/lib/utils";
import { requireUser } from "@/server/session";
import { todayFacts } from "@/server/dashboard-today";
import { longDay, money } from "../parts";

export const metadata: Metadata = { title: "At a glance", appleWebApp: { capable: true, title: "Reflect", statusBarStyle: "default" } };
export const dynamic = "force-dynamic";

const TILE = "bg-card hover:bg-accent grid min-w-0 gap-1 rounded-2xl border p-4 transition";
const Label = ({ icon, children }: { icon: ReactNode; children: ReactNode }) => (
  <span className="text-muted-foreground flex items-center gap-1.5 text-sm font-medium [&>svg]:size-4">{icon}{children}</span>
);

/**
 * The glance (dashboard, 2026-11-18): three facts a home-screen bookmark opens to, the next item, the people waiting
 * and the money left, each opening its page. Reflect has no native app, so this page stands in for a widget.
 */
export default async function Glance() {
  const user = await requireUser();
  const now = new Date();
  const f = await todayFacts(user.id, now);
  const names = [...new Set(f.people.map((p) => p.name))];
  return (
    <main className="mx-auto grid min-h-screen max-w-md grid-cols-[minmax(0,1fr)] content-start gap-3 px-4 py-6">
      <header className="flex items-baseline justify-between gap-3 pb-1">
        <h1 className="text-xl font-semibold tracking-tight">{longDay(now)}</h1>
        <Link href="/dashboard" className="text-muted-foreground hover:text-foreground inline-flex items-center gap-0.5 text-sm">Dashboard<ChevronRightIcon className="size-4" /></Link>
      </header>

      <Link href={f.next?.href ?? `/calendar?day=${f.day}`} className={TILE}>
        <Label icon={<CalendarIcon />}>{f.next ? (f.next.starts ? `Next · ${f.next.when}` : "All day") : "Today"}</Label>
        <span className="truncate text-2xl font-semibold">{f.next?.title ?? "Nothing on your calendar"}</span>
        {f.today.length > 1 ? <span className="text-muted-foreground text-sm">{f.today.length - 1} more today</span> : null}
      </Link>

      <Link href={f.people[0]?.href ?? "/life/friends"} className={TILE}>
        <Label icon={<UsersIcon />}>Waiting on you</Label>
        {names.length ? (
          <span className="flex items-center gap-3">
            <span className="flex -space-x-2">{names.slice(0, 3).map((n) => <Face key={n} name={n} size={32} />)}</span>
            <span className="min-w-0 truncate text-lg font-semibold">{names.length === 1 ? names[0] : `${names.length} people`}</span>
          </span>
        ) : <span className="text-lg font-semibold">No one</span>}
      </Link>

      <Link href={f.money.href} className={TILE}>
        <Label icon={<WalletIcon />}>Left to allot a month</Label>
        <span className={cn("text-2xl font-semibold", f.money.left_to_allot < 0 && "text-destructive")}>{money(f.money.left_to_allot)}</span>
        <span className="text-muted-foreground text-sm">{money(f.money.allotted)} allotted of {money(f.money.take_home)}</span>
      </Link>
    </main>
  );
}
