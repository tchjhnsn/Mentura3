import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HeartIcon, MinusIcon, PlusIcon } from "lucide-react";
import { itemText } from "@reflect/core/meals";
import { ingredientsOf, recipeOf, REGIONS } from "@reflect/core/recipes";
import { ThingHeader } from "@/components/headers";
import { COLUMN, Group, Row } from "@/components/list-rows";
import { PAGE } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { mealsView, people } from "@/server/meals-store";
import { requireUser } from "@/server/session";
import { basketAction, keepRecipeAction } from "../../actions";
import { RecipeArt } from "../../recipe-art";

export const dynamic = "force-dynamic";
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  return { title: recipeOf((await params).id)?.name ?? "Recipe" };
}

/**
 * One of Reflect's recipes (doc "Food design guide"): what it is, how long and for how many, what goes in it scaled
 * to the people eating, how to make it, and what goes with it. The one filled button puts it in the week's basket;
 * the heart keeps it in Your recipes.
 */
export default async function RecipePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser();
  const r = recipeOf((await params).id);
  if (!r) notFound();
  const sp = await searchParams;
  const [v, household] = await Promise.all([mealsView(user.id), people(user.id)]);
  const n = Math.min(24, Math.max(1, Number(one(sp.n)) || household));
  const mine = v.meals.find((m) => m.recipe === r.id);
  const inBasket = Boolean(mine && (v.basket.some((b) => b.meal === mine.id) || v.plan.some((p) => p.meal === mine.id)));
  const factor = n / r.serves;
  const here = `/meals/r/${r.id}`;
  const region = REGIONS.find((x) => x.id === r.region)!.label;
  return (
    <main className={PAGE}>
      <ThingHeader search={false} back="/meals/discover" backLabel="Discover" crumbs={[{ label: "Food", href: "/meals" }, { label: "Discover", href: "/meals/discover" }]} title={r.name} />
      <div className={COLUMN}>
        <RecipeArt region={r.region} className="aspect-[16/9] w-full" />
        <div className="flex items-start gap-3">
          <div className="grid flex-1 gap-1">
            <h1 id="page-title" className="text-2xl font-semibold tracking-tight">{r.name}</h1>
            <p className="text-muted-foreground text-sm">{r.minutes} minutes, serves {r.serves}, {region}</p>
          </div>
          <form action={keepRecipeAction.bind(null, r.id, !mine)}>
            <Button type="submit" variant="ghost" size="icon" aria-pressed={Boolean(mine)} aria-label={mine ? "Kept in Your recipes" : "Keep in Your recipes"}>
              <HeartIcon className={cn(mine && "fill-primary text-primary")} />
            </Button>
          </form>
        </div>
        {inBasket ? (
          <Button asChild size="lg" variant="outline" className="w-full"><Link href="/meals/list">In this week&apos;s basket</Link></Button>
        ) : (
          <form action={basketAction.bind(null, r.id, "", here)}><Button type="submit" size="lg" className="w-full">Add to basket</Button></form>
        )}

        <Group title="Ingredients" id="ingredients">
          <li className="flex items-center justify-between gap-2 px-4 py-2">
            <span className="text-muted-foreground text-sm">For {n} {n === 1 ? "person" : "people"}</span>
            <span className="flex items-center gap-1">
              <Button asChild variant="ghost" size="icon" aria-label="Fewer people"><Link href={`${here}?n=${Math.max(1, n - 1)}`} scroll={false}><MinusIcon /></Link></Button>
              <Button asChild variant="ghost" size="icon" aria-label="More people"><Link href={`${here}?n=${Math.min(24, n + 1)}`} scroll={false}><PlusIcon /></Link></Button>
            </span>
          </li>
          {ingredientsOf(r).map((i) => (
            <li key={`${i.name}|${i.unit}`} className="px-4 py-3 text-base">{itemText({ ...i, qty: i.qty === null ? null : Math.round(i.qty * factor * 4) / 4 || 0.25 })}</li>
          ))}
        </Group>

        <section className="grid gap-3" aria-labelledby="steps">
          <h2 id="steps" className="text-muted-foreground px-4 text-sm">How to make it</h2>
          <ol className="grid gap-4">
            {r.steps.map((s, i) => (
              <li key={i} className="flex gap-4">
                <span className="bg-muted grid size-7 shrink-0 place-items-center rounded-full text-sm font-semibold">{i + 1}</span>
                <span className="text-base leading-relaxed">{s}</span>
              </li>
            ))}
          </ol>
        </section>

        {r.goesWith?.length ? (
          <Group title="Goes with" id="goes">
            {r.goesWith.map(recipeOf).filter((x) => x !== undefined).map((g) => <Row key={g.id} href={`/meals/r/${g.id}`} icon={<RecipeArt region={g.region} className="size-8" />} label={g.name} value={`${g.minutes} min`} />)}
          </Group>
        ) : null}
      </div>
    </main>
  );
}
