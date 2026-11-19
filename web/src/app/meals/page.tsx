import type { Metadata } from "next";
import { TileAdventures } from "@/app/adventures/in-tile";
import Link from "next/link";
import { ChevronRightIcon } from "lucide-react";
import { kindOf, shown } from "@reflect/core/life";
import { waterDays } from "@reflect/core/home";
import { householdOf } from "@/server/household-store";
import { recipeOf } from "@reflect/core/recipes";
import { ThingHeader } from "@/components/headers";
import { COLUMN, Group, Row } from "@/components/list-rows";
import { PAGE } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { likesOf, mealsView, toBuy, type KeptMeal } from "@/server/meals-store";
import { requireUser } from "@/server/session";
import { lifeRecords } from "@/server/life-store";
import { foodMoney } from "@/server/spending-store";
import { RecipeArt } from "./recipe-art";
import { ReceiptPicker } from "./receipt-picker";

export const metadata: Metadata = { title: "Food and water" };
export const dynamic = "force-dynamic";
const money = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
const COURSE = { main: 0, side: 1, bread: 2 } as const;
const minutesOf = (m: KeptMeal) => (m.recipe ? recipeOf(m.recipe)!.minutes : 45);

/**
 * Food (doc "Food design guide", revision 2): this month's food money against what is set aside for it, split into
 * groceries and eating out; this week's cooking time against the hours given to it; the next grocery run, the one
 * filled button; a receipt added with a tap; then this week's meals, and Discover, Spending and Your recipes.
 */
export default async function FoodPage() {
  const user = await requireUser();
  const today = new Date().toISOString().slice(0, 10);
  const month = today.slice(0, 7);
  const [v, likes, f, home] = await Promise.all([mealsView(user.id, today), likesOf(user.id), foodMoney(user.id, month), lifeRecords(user.id, "home")]);
  // Water is part of this tile since 2026-11-19 (Torian: combine food and water); its own page stays at /life/home?k=water.
  const people = Math.max(1, (await householdOf(user.id).catch(() => null))?.members.length ?? 1);
  const gallons = home.find((r) => r.kind === "water")?.body.gallons;
  const waterLeft = waterDays(typeof gallons === "number" ? gallons : null, people);
  // Who meets the need and how, which the income plan reads; each opens one choice on its own page.
  const need = kindOf("home", "food")!;
  const met = home.find((r) => r.kind === "food")?.body ?? {};
  const facts = need.fields.filter((x) => ["choice", "money", "number"].includes(x.kind) && x.key !== "cost");
  const byId = new Map(v.meals.map((m) => [m.id, m]));
  const items = toBuy(v).length;

  // Each day's whole meal, main first; its time is its longest recipe, since sides cook beside the main.
  const days = v.week.map((d) => {
    const meals = v.plan.filter((p) => p.day === d).map((p) => byId.get(p.meal)).filter((m): m is KeptMeal => Boolean(m));
    meals.sort((a, b) => (a.recipe ? COURSE[recipeOf(a.recipe)!.course] : 0) - (b.recipe ? COURSE[recipeOf(b.recipe)!.course] : 0));
    return { day: d, main: meals[0], sides: meals.slice(1), minutes: meals.length ? Math.max(...meals.map(minutesOf)) : 0 };
  });
  const planned = days.filter((d) => d.main);
  const cooked = planned.reduce((s, d) => s + d.minutes, 0);
  const tonight = days.find((d) => d.day === today && d.main);
  const hours = likes.hours ?? null;

  const spent = f.spent.total;
  const share = (n: number) => `${Math.min(100, f.allot ? (n / f.allot) * 100 : 0)}%`;
  const dayOfMonth = Number(today.slice(8, 10));
  const monthName = new Date(`${today}T12:00:00Z`).toLocaleDateString("en-US", { month: "long", timeZone: "UTC" });

  return (
    <main className={PAGE}>
      <ThingHeader search={false} back="/" backLabel="Home" crumbs={[{ label: "Home", href: "/" }]} title="Food and water" />
      <div className={COLUMN}>
        <div className="flex items-baseline justify-between gap-4">
          <h1 id="page-title" className="text-3xl font-bold tracking-tight">Food and water</h1>
          <Link href="/meals/list" className="text-muted-foreground hover:text-foreground text-sm">Basket {items}</Link>
        </div>

        <section aria-labelledby="money" className="bg-card grid gap-3 rounded-2xl border p-5">
          <h2 id="money" className="text-muted-foreground text-sm">{monthName}, {dayOfMonth} {dayOfMonth === 1 ? "day" : "days"} in</h2>
          <p className="flex flex-wrap items-baseline gap-x-2">
            <span className="text-4xl font-bold tracking-tight">{money(spent)}</span>
            <Link href="/life/home/set?k=food&f=cost&to=/meals" className="text-muted-foreground hover:text-foreground text-base underline-offset-2 hover:underline">of {money(f.allot)} for food</Link>
          </p>
          <div className="bg-muted flex h-2.5 overflow-hidden rounded-full" role="img" aria-label={`Groceries ${money(f.spent.groceries)} and eating out ${money(f.spent.eatingOut)} of ${money(f.allot)}`}>
            <span className="bg-primary h-full" style={{ width: share(f.spent.groceries) }} />
            <span className="h-full bg-amber-500" style={{ width: share(f.spent.eatingOut) }} />
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
            <span className="flex items-center gap-2"><span aria-hidden="true" className="bg-primary size-2.5 rounded-full" />Groceries {money(f.spent.groceries)}</span>
            <span className="flex items-center gap-2"><span aria-hidden="true" className="size-2.5 rounded-full bg-amber-500" />Eating out {money(f.spent.eatingOut)}</span>
          </div>
          <p className="text-muted-foreground text-xs">{f.from === "set" ? `${money(f.allot)} a month, from your budget.` : `The USDA low-cost plan for ${f.people} ${f.people === 1 ? "person" : "people"}. Tap the amount to set your own.`}{f.spent.count ? "" : " Spending comes from the receipts you add."}</p>
        </section>

        <Link href={hours ? "/meals/week" : "/meals/start?q=hours&one=1"} className="bg-card hover:bg-accent grid gap-2 rounded-2xl border px-5 py-4 transition">
          <span className="flex items-baseline justify-between gap-4">
            <span className="text-base whitespace-nowrap">Cooking this week</span>
            <span className="text-base font-semibold whitespace-nowrap">{hours ? `${Math.round((cooked / 60) * 10) / 10} of ${hours} ${hours === 1 ? "hour" : "hours"}` : "Say how many hours"}</span>
          </span>
          {hours ? <span className="bg-muted block h-1.5 overflow-hidden rounded-full"><span className="bg-primary block h-full" style={{ width: `${Math.min(100, (cooked / (hours * 60)) * 100)}%` }} /></span> : null}
        </Link>

        <Button asChild size="lg" className="w-full"><Link href="/meals/run">Plan the next grocery run</Link></Button>

        <Group><ReceiptPicker /></Group>

        <section aria-labelledby="week" className="grid gap-2">
          <h2 id="week" className="text-muted-foreground px-4 text-sm">This week&apos;s meals</h2>
          <Link href="/meals/week" className="bg-card hover:bg-accent flex items-center gap-4 rounded-2xl border p-3 transition">
            {tonight?.main ? <RecipeArt recipe={tonight.main.recipe} className="h-16 w-20" /> : <RecipeArt recipe={null} className="h-16 w-20" />}
            <span className="grid min-w-0 flex-1">
              <span className="text-muted-foreground text-sm">{tonight?.main ? "Tonight" : planned.length ? "Nothing tonight" : "Nothing planned yet"}</span>
              <span className="truncate text-base font-semibold">{tonight?.main ? tonight.main.name : planned.length ? `Next: ${planned.find((d) => d.day > today)?.main?.name ?? "see the week"}` : "Plan the week's dinners"}</span>
              <span className="text-muted-foreground truncate text-sm">{planned.length} of {likes.nights ?? 5} nights planned{planned.length ? `, about ${Math.round(cooked / planned.length)} minutes each` : ""}</span>
            </span>
            <ChevronRightIcon aria-hidden="true" className="text-muted-foreground size-4 shrink-0" />
          </Link>
        </section>

        <Group>
          <Row href="/meals/discover" label="Discover recipes" />
          <Row href="/meals/spending" label="Spending" value={f.receipts.length ? `${f.receipts.length} ${f.receipts.length === 1 ? "receipt" : "receipts"}` : undefined} />
          <Row href="/meals/mine" label="Your recipes" value={String(v.meals.length)} />
          <Row href="/meals/week#likes" label="How you eat" value={likes.answered ? undefined : "Not said"} />
        </Group>

        {facts.length ? (
          <Group title="How it is met" id="met">
            {facts.map((x) => <Row key={x.key} href={`/life/home/set?k=food&f=${x.key}&to=/meals`} label={x.label} value={shown(x, met) ?? "Not said"} />)}
          </Group>
        ) : null}
        <Group title="Water" id="water">
          <Row href="/life/home?k=water" label="Water at home" value={waterLeft !== null ? `${waterLeft} ${waterLeft === 1 ? "day" : "days"} stored` : "Not said"} />
        </Group>
        <TileAdventures userId={user.id} tiles={["food", "water"]} />
      </div>
    </main>
  );
}
