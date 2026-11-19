import Link from "next/link";
import { ChevronRightIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { planFor } from "../data";
import { budgetView } from "@reflect/core/budget";
import { money, Section, type Ctx } from "../parts";

/** The question the plan page's Budget section asks Reflect, where allotments are set with the person. */
export const BUDGET_ASK = `/chat?q=${encodeURIComponent("Help me set my monthly budget for each tile.")}`;

/**
 * Money: what is left to allot a month, from the budget against take-home. With nothing allotted yet it asks the
 * person to set a budget instead, opening the income plan's Budget section (allotments are set there with Ask Reflect).
 */
export async function MoneyCard({ ctx }: { ctx: Ctx }) {
  const { plan, budget } = await planFor(ctx.userId);
  const v = budgetView(plan, budget);
  if (v.allotted === 0) {
    return (
      <Section title="Money" href="/plan" more="Budget">
        <div className="bg-card grid gap-2 rounded-xl border p-4">
          <Link href="/plan#budget" className="group grid gap-1">
            <span className="flex items-center justify-between gap-2 text-lg font-semibold">Set your budget<ChevronRightIcon className="text-muted-foreground size-5 transition group-hover:translate-x-0.5" /></span>
            <span className="text-muted-foreground text-sm">{v.takeHome > 0 ? `Decide what each part of life gets from ${money(v.takeHome)} take-home a month.` : "Decide what each part of life gets a month."}</span>
          </Link>
          <Link href={BUDGET_ASK} className="text-muted-foreground hover:text-foreground w-fit text-sm underline-offset-4 hover:underline">Get help in a new chat</Link>
        </div>
      </Section>
    );
  }
  return (
    <Section title="Money" href="/plan" more="Budget">
      <Link href="/plan" className="bg-card hover:bg-accent grid gap-1 rounded-xl border p-4 transition">
        <span className="text-muted-foreground text-sm font-medium">Left to allot a month</span>
        <span className={cn("text-2xl font-semibold", v.leftToAllot < 0 && "text-destructive")}>{money(v.leftToAllot)}</span>
        <span className="text-muted-foreground text-sm">{money(v.allotted)} allotted of {money(v.takeHome)} take-home</span>
      </Link>
    </Section>
  );
}
