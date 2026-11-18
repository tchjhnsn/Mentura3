import Link from "next/link";
import { cn } from "@/lib/utils";
import { planFor } from "../data";
import { budgetView } from "@reflect/core/budget";
import { money, Section, type Ctx } from "../parts";

/** Money: what is left to allot a month, from the budget against take-home. */
export async function MoneyCard({ ctx }: { ctx: Ctx }) {
  const { plan, budget } = await planFor(ctx.userId);
  const v = budgetView(plan, budget);
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
