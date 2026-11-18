import Link from "next/link";
import { budgetView } from "@reflect/core/budget";
import { monthSpend } from "@reflect/core/spending";
import { planOf } from "@/server/plan";
import { receipts } from "@/server/spending-store";
import { cn } from "@/lib/utils";
import { money, safe, Section, type Ctx } from "../parts";
import { spendRows } from "../tiles";

/**
 * Spending: this month against each tile's allotment, as small bars. Reflect records spending only for Food, from the
 * receipts the person confirms, so every other tile shows its allotment alone and says so. No figure is made up.
 */
export async function SpendingCard({ ctx }: { ctx: Ctx }) {
  const [p, list] = await Promise.all([safe(planOf(ctx.userId), null), safe(receipts(ctx.userId), [])]);
  if (!p) return null;
  const month = ctx.today.slice(0, 7);
  const food = monthSpend(list, month);
  // Food counts as tracked once any receipt is kept, so a month with none yet reads as $0 spent, not untracked.
  const spent: Record<string, number> = list.length ? { food: food.total } : {};
  const rows = spendRows(budgetView(p.plan, p.budget).tiles, spent);
  if (!rows.length) return null;
  const untracked = rows.some((r) => r.spent === null);
  const monthName = new Intl.DateTimeFormat("en-US", { month: "long", timeZone: "UTC" }).format(new Date(`${month}-15T12:00:00Z`));
  return (
    <Section title="Spending" href="/plan" more="Budget">
      <ul className="grid grid-cols-[minmax(0,1fr)] gap-3">
        {rows.map((r) => (
          <li key={r.tile} className="grid gap-1">
            <span className="flex items-baseline justify-between gap-3 text-sm">
              <span className="truncate font-medium">{r.label}</span>
              <span className={cn("text-muted-foreground shrink-0 tabular-nums", r.over && "text-destructive")}>
                {r.spent === null ? `${money(r.allot)} a month` : `${money(r.spent)} of ${money(r.allot)}`}
              </span>
            </span>
            <span className="bg-muted block h-1.5 overflow-hidden rounded-full" role="img" aria-label={r.spent === null ? `${r.label}: ${money(r.allot)} allotted a month` : `${r.label}: ${money(r.spent)} spent of ${money(r.allot)} in ${monthName}`}>
              <span className={cn("block h-full rounded-full", r.spent === null ? "bg-primary/30" : r.over ? "bg-destructive" : "bg-primary")} style={{ width: `${Math.max(r.spent === null || r.spent > 0 ? 2 : 0, r.share * 100)}%` }} />
            </span>
          </li>
        ))}
      </ul>
      {untracked ? (
        <p className="text-muted-foreground text-sm">
          {"food" in spent ? <>Spending in {monthName} is tracked for Food from <Link href="/meals/spending" className="underline underline-offset-2">receipts</Link>; the other tiles aren&apos;t tracked yet, so they show what is allotted.</> : <>Spending isn&apos;t tracked yet, so these are what is allotted a month. Food can track it from <Link href="/meals/spending" className="underline underline-offset-2">receipts</Link>.</>}
        </p>
      ) : null}
    </Section>
  );
}
