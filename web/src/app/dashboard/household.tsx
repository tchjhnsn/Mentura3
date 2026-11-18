import Link from "next/link";
import { Face } from "@/components/dash";
import { Segmented } from "@/components/segmented";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { householdView, type MemberDoing } from "@/server/dashboard-today";
import type { DayItem } from "@/server/dashboard-reach";
import { Empty, money, Section, type Ctx } from "./parts";

/** Me or Household, in the URL; Me unless the person picks Household. */
export function ScopeToggle({ ours }: { ours: boolean }) {
  return <Segmented label="Whose dashboard" items={[{ label: "Me", href: "/dashboard", on: !ours }, { label: "Household", href: "/dashboard?view=household", on: ours }]} />;
}

const dayName = (day: string, today: string) => (day === today ? "Today" : new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(`${day}T12:00:00Z`)));

function ItemRow({ e, today }: { e: DayItem; today: string }) {
  return (
    <li><Link href={e.href} className="hover:bg-accent grid grid-cols-[6.5rem_minmax(0,1fr)] gap-3 rounded-lg px-2 py-1.5 text-sm">
      <span className="text-muted-foreground truncate">{dayName(e.day, today)}{e.starts ? ` ${e.when}` : ""}</span><span className="truncate">{e.title}</span>
    </Link></li>
  );
}

/** One member: who they are and what names them this week; a member someone keeps opens their own dashboard. */
function MemberCard({ m, today }: { m: MemberDoing; today: string }) {
  const href = !m.account && m.kept ? `/dashboard?for=${m.id}` : `/settings/member/${m.id}`;
  const next = m.items[0];
  return (
    <li className="bg-card grid min-w-0 content-start gap-3 rounded-xl border p-4">
      <Link href={href} className="flex min-w-0 items-center gap-3">
        <Face name={m.name} size={40} />
        <span className="grid min-w-0"><span className="truncate font-medium">{m.name}</span><span className="text-muted-foreground truncate text-sm">{m.relation}{m.account ? "" : ", no login"}</span></span>
      </Link>
      {next ? <Link href={next.href} className="hover:bg-accent -mx-2 grid rounded-lg px-2 py-1"><span className="text-muted-foreground text-xs">{dayName(next.day, today)}{next.starts ? ` · ${next.when}` : ""}</span><span className="truncate text-sm">{next.title}</span></Link> : <span className="text-muted-foreground text-sm">Nothing this week names them.</span>}
      {m.records.length ? (
        <ul className="flex flex-wrap gap-1.5">
          {m.records.slice(0, 4).map((r) => <li key={r.id}><Link href={r.href}><Badge variant="secondary" className="max-w-48 truncate">{r.title}</Badge></Link></li>)}
          {m.records.length > 4 ? <li><Badge variant="outline">{m.records.length - 4} more</Badge></li> : null}
        </ul>
      ) : null}
    </li>
  );
}

/**
 * The household's view of the dashboard: who is in the household and what names each of them, the week's items on
 * the person's calendar that name someone at home, and the household budget. Each part is marked for the beacon.
 */
export async function HouseholdDashboard({ ctx }: { ctx: Ctx }) {
  const h = await householdView(ctx.userId, ctx.now).catch(() => null);
  if (!h) return <Empty>Add someone to your household in Settings to see the household here.</Empty>;
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <div className="grid grid-cols-[minmax(0,1fr)] content-start gap-8">
        <div data-dash-card="household-people" className="contents"><Section title="Who is doing what" href="/settings/household" more="Household">
          <ul className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-2">{h.members.map((m) => <MemberCard key={m.id} m={m} today={ctx.today} />)}</ul>
        </Section></div>
        <div data-dash-card="household-calendar" className="contents"><Section title="This week at home" href={`/calendar?day=${ctx.today}`} more="Calendar">
          {h.shared.length ? <ul className="grid grid-cols-[minmax(0,1fr)] gap-1">{h.shared.slice(0, 8).map((e) => <ItemRow key={`${e.id}-${e.day}`} e={e} today={ctx.today} />)}</ul> : <Empty>Nothing on your calendar this week names anyone at home.</Empty>}
        </Section></div>
      </div>
      <aside className="grid grid-cols-[minmax(0,1fr)] content-start gap-8">
        <div data-dash-card="household-money" className="contents"><Section title="Household budget" href="/plan" more="Budget">
          <Link href="/plan" className="bg-card hover:bg-accent grid gap-1 rounded-xl border p-4 transition">
            <span className="text-muted-foreground text-sm font-medium">Left to allot a month</span>
            <span className={cn("text-2xl font-semibold", h.money.left_to_allot < 0 && "text-destructive")}>{money(h.money.left_to_allot)}</span>
            <span className="text-muted-foreground text-sm">{money(h.money.allotted)} allotted of {money(h.money.take_home)} take-home, for {h.members.length + 1} people</span>
          </Link>
        </Section></div>
      </aside>
    </div>
  );
}
