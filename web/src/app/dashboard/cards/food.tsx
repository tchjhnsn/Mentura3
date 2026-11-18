import Link from "next/link";
import { recipeOf } from "@reflect/core/recipes";
import { monthSpend } from "@reflect/core/spending";
import { mealsView, toBuy, type KeptMeal } from "@/server/meals-store";
import { receipts } from "@/server/spending-store";
import { planOf } from "@/server/plan";
import { RecipeArt } from "@/app/meals/recipe-art";
import { cn } from "@/lib/utils";
import { money, safe, Section, type Ctx } from "../parts";
import { foodLeft } from "../tiles";

const COURSE = { main: 0, side: 1, bread: 2 } as const;
const mealHref = (m: KeptMeal) => (m.recipe ? `/meals/r/${m.recipe}` : `/meals/${m.id}`);
const courseOf = (m: KeptMeal) => (m.recipe ? COURSE[recipeOf(m.recipe)?.course ?? "main"] : 0);

/** Food: tonight's planned meal, what is in the grocery basket, and what is left of Food's allotment this month. */
export async function FoodCard({ ctx }: { ctx: Ctx }) {
  const [v, list, foodAllot] = await Promise.all([
    safe(mealsView(ctx.userId, ctx.today), null),
    safe(receipts(ctx.userId), []),
    safe(planOf(ctx.userId).then((p) => p.budget.food ?? null), null),
  ]);
  if (!v) return null;
  const byId = new Map(v.meals.map((m) => [m.id, m]));
  const tonight = v.plan.filter((p) => p.day === ctx.today).map((p) => byId.get(p.meal)).filter((m): m is KeptMeal => Boolean(m)).sort((a, b) => courseOf(a) - courseOf(b));
  const main = tonight[0] ?? null;
  const basket = toBuy(v).length;
  const left = foodLeft(foodAllot, monthSpend(list, ctx.today.slice(0, 7)).total);
  if (!main && !basket && !left) {
    return (
      <Section title="Food" href="/meals" more="Food">
        <Link href="/meals/week" className="text-muted-foreground hover:text-foreground text-sm">Plan this week&apos;s dinners</Link>
      </Section>
    );
  }
  return (
    <Section title="Food" href="/meals" more="Food">
      <Link href={main ? mealHref(main) : "/meals/week"} className="bg-card hover:bg-accent flex items-center gap-4 rounded-xl border p-3 transition">
        <RecipeArt recipe={main?.recipe ?? null} className="h-14 w-16 shrink-0" />
        <span className="grid min-w-0">
          <span className="text-muted-foreground text-sm">{main ? "Tonight" : "Nothing planned tonight"}</span>
          <span className="truncate font-semibold">{main ? main.name : "Plan a dinner"}</span>
          {tonight.length > 1 ? <span className="text-muted-foreground truncate text-sm">with {tonight.slice(1).map((m) => m.name).join(", ")}</span> : null}
        </span>
      </Link>
      <div className="flex flex-wrap gap-2">
        <Link href="/meals/list" className="bg-secondary hover:bg-accent rounded-full px-3 py-1 text-sm">{basket ? `${basket} ${basket === 1 ? "thing" : "things"} in the basket` : "Basket empty"}</Link>
      </div>
      {left ? (
        <Link href="/meals/spending" className="grid gap-1.5 rounded-lg px-2 py-1">
          <span className="flex items-baseline justify-between gap-3 text-sm">
            <span className={cn("font-medium", left.left < 0 && "text-destructive")}>{left.left < 0 ? `${money(-left.left)} over` : `${money(left.left)} left`}</span>
            <span className="text-muted-foreground">of {money(left.allot)} for food this month</span>
          </span>
          <span className="bg-muted block h-1.5 overflow-hidden rounded-full"><span className={cn("block h-full", left.left < 0 ? "bg-destructive" : "bg-primary")} style={{ width: `${left.share * 100}%` }} /></span>
        </Link>
      ) : null}
    </Section>
  );
}
