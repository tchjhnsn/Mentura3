import type { Metadata } from "next";
import Link from "next/link";
import { BookHeartIcon, ChevronLeftIcon, ChevronRightIcon, CompassIcon, PlusIcon, ShoppingBasketIcon, Trash2Icon } from "lucide-react";
import { QUESTIONS, recipeOf, type Region } from "@reflect/core/recipes";
import { ThingHeader } from "@/components/headers";
import { COLUMN, Group, Row } from "@/components/list-rows";
import { PAGE } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { lifeRecords } from "@/server/life-store";
import { likesOf, mealsView, toBuy, type KeptMeal } from "@/server/meals-store";
import { requireUser } from "@/server/session";
import { planMyWeekAction, unplanDayAction } from "../actions";
import { RecipeArt } from "../recipe-art";

export const metadata: Metadata = { title: "This week" };
export const dynamic = "force-dynamic";
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
const shift = (day: string, n: number) => new Date(Date.parse(`${day}T12:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);
const label = (day: string, o: Intl.DateTimeFormatOptions) => new Date(`${day}T12:00:00Z`).toLocaleDateString("en-US", { timeZone: "UTC", ...o });
const COURSE = { main: 0, side: 1, bread: 2 } as const;
const regionOf = (m: KeptMeal): Region => (m.recipe ? recipeOf(m.recipe)!.region : "everyday");
const href = (m: KeptMeal) => (m.recipe ? `/meals/r/${m.recipe}` : `/meals/${m.id}`);

/**
 * This week's meals (doc "Food design guide"): tonight's whole meal large, the week a day to a row, one button that
 * plans the open days from how the person eats, then Discover, Your recipes and the Basket, and the answers that shape
 * the plan.
 */
export default async function WeekPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser();
  const asked = one((await searchParams).day);
  const day = /^\d{4}-\d{2}-\d{2}$/.test(asked) ? asked : new Date().toISOString().slice(0, 10);
  const [v, likes, home] = await Promise.all([mealsView(user.id, day), likesOf(user.id), lifeRecords(user.id, "home")]);
  const byId = new Map(v.meals.map((m) => [m.id, m]));
  const items = toBuy(v).length;
  const today = new Date().toISOString().slice(0, 10);
  const days = v.week.map((d) => {
    const planned = v.plan.filter((p) => p.day === d && byId.has(p.meal)).map((p) => ({ event: p.event, meal: byId.get(p.meal)! }));
    planned.sort((a, b) => (a.meal.recipe ? COURSE[recipeOf(a.meal.recipe)!.course] : 0) - (b.meal.recipe ? COURSE[recipeOf(b.meal.recipe)!.course] : 0));
    return { day: d, main: planned[0]?.meal, sides: planned.slice(1).map((p) => p.meal), events: planned.map((p) => p.event) };
  });
  const tonight = days.find((d) => d.day === today && d.main);
  const filled = days.filter((d) => d.main).length;
  const open = days.filter((d) => !d.main && d.day >= today).length;
  const canPlan = open > 0 && filled < (likes.nights ?? 5);
  const kept = v.meals.length;
  const b = home.find((r) => r.kind === "food-likes")?.body ?? {};
  const avoid = QUESTIONS.find((q) => q.key === "avoid")!.options.filter(([id]) => b[`avoid-${id}`] === true).map(([, l]) => l);
  return (
    <main className={PAGE}>
      <ThingHeader search={false} back="/meals" backLabel="Food" crumbs={[{ label: "Food", href: "/meals" }]} title="This week" />
      <div className={COLUMN}>
        {!likes.answered ? (
          <Link href="/meals/start" className="bg-primary text-primary-foreground grid gap-1 rounded-2xl p-5 transition hover:opacity-90">
            <span className="text-lg font-semibold">Tell Reflect how you eat</span>
            <span className="text-sm opacity-90">Five questions, a tap each. Then Reflect plans whole meals for your week.</span>
          </Link>
        ) : null}

        {tonight?.main ? (
          <Link href={href(tonight.main)} className="hover:bg-accent grid gap-3 rounded-2xl border p-3 transition">
            <RecipeArt recipe={tonight.main.recipe} eager className="aspect-[16/9] w-full" />
            <span className="grid gap-1 px-1 pb-1">
              <span className="text-muted-foreground text-sm">Tonight</span>
              <span className="text-2xl font-semibold tracking-tight">{tonight.main.name}</span>
              {tonight.sides.length ? <span className="text-muted-foreground text-base">With {tonight.sides.map((s) => s.name.toLowerCase()).join(", ")}</span> : null}
            </span>
          </Link>
        ) : null}

        <section className="grid gap-2" aria-labelledby="week">
          <div className="flex items-center justify-between gap-2 px-2">
            <Button asChild variant="ghost" size="icon" aria-label="Week before"><Link href={`/meals/week?day=${shift(v.week[0]!, -7)}`}><ChevronLeftIcon /></Link></Button>
            <h2 id="week" className="text-muted-foreground text-sm">{label(v.week[0]!, { month: "short", day: "numeric" })} to {label(v.week[6]!, { month: "short", day: "numeric" })}, for {v.people} {v.people === 1 ? "person" : "people"}</h2>
            <Button asChild variant="ghost" size="icon" aria-label="Week after"><Link href={`/meals/week?day=${shift(v.week[0]!, 7)}`}><ChevronRightIcon /></Link></Button>
          </div>
          <ul className="bg-card divide-y overflow-hidden rounded-2xl border">
            {days.map((d) => (
              <li key={d.day} className="flex items-center">
                <span className={`w-14 shrink-0 pl-4 text-sm ${d.day === today ? "text-primary font-semibold" : "text-muted-foreground"}`}>{label(d.day, { weekday: "short" })}</span>
                {d.main ? (
                  <>
                    <Link href={href(d.main)} className="hover:bg-accent flex min-h-16 min-w-0 flex-1 items-center gap-3 px-3 py-3 transition">
                      <RecipeArt recipe={d.main.recipe} className="size-10" />
                      <span className="grid min-w-0"><span className="truncate text-base">{d.main.name}</span>{d.sides.length ? <span className="text-muted-foreground truncate text-sm">With {d.sides.map((s) => s.name.toLowerCase()).join(", ")}</span> : null}</span>
                    </Link>
                    <form action={unplanDayAction.bind(null, d.events, d.day)} className="pr-2"><Button type="submit" variant="ghost" size="icon" aria-label={`Take ${d.main.name} off ${label(d.day, { weekday: "long" })}`}><Trash2Icon /></Button></form>
                  </>
                ) : (
                  <Link href={`/meals/plan?day=${d.day}`} className="hover:bg-accent text-muted-foreground flex min-h-16 flex-1 items-center justify-between gap-3 px-3 py-3 text-sm transition">
                    <span>Nothing planned</span><PlusIcon aria-label={`Add a meal on ${label(d.day, { weekday: "long" })}`} className="size-4" />
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </section>

        {canPlan ? <form action={planMyWeekAction.bind(null, v.week[0]! < today ? today : v.week[0]!)}><Button type="submit" size="lg" className="w-full">{filled ? "Plan the rest of the week" : "Plan my week"}</Button></form> : null}

        <Group>
          <Row href="/meals/discover" icon={<CompassIcon />} label="Discover" sub="Whole meals from where you grew up, and old cookbooks" />
          <Row href="/meals/mine" icon={<BookHeartIcon />} label="Your recipes" value={String(kept)} />
          <Row href={`/meals/list?day=${v.week[0]}`} icon={<ShoppingBasketIcon />} label="Basket" value={items ? `${items} ${items === 1 ? "item" : "items"}` : "Empty"} />
        </Group>

        <Group title="How you eat" id="likes">
          {QUESTIONS.map((q) => {
            const value = q.key === "avoid" ? (avoid.length ? avoid.join(", ") : null) : (q.options as readonly (readonly [string, string])[]).find(([id]) => id === b[q.key])?.[1] ?? null;
            return <Row key={q.key} href={`/meals/start?q=${q.key}&one=1`} label={q.label} value={value ?? "Not said"} />;
          })}
        </Group>
      </div>
    </main>
  );
}
