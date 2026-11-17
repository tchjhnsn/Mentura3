import type { Metadata } from "next";
import Link from "next/link";
import { BookOpenIcon, CheckIcon, PlusIcon } from "lucide-react";
import { COOKBOOKS, fits, recipeOf, RECIPES, REGIONS, shelves } from "@reflect/core/recipes";
import { ThingHeader } from "@/components/headers";
import { COLUMN, Group } from "@/components/list-rows";
import { PAGE } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { likesOf, mealsView } from "@/server/meals-store";
import { requireUser } from "@/server/session";
import { basketAction } from "../actions";
import { RecipeArt } from "../recipe-art";

export const metadata: Metadata = { title: "Discover" };
export const dynamic = "force-dynamic";

/**
 * Discover (doc "Food design guide"): whole meals by where they come from, the food the person grew up on first, each
 * with a + that puts it in the week's basket; sides and breads on their own; old cookbooks to read where they are kept.
 */
export default async function DiscoverPage() {
  const user = await requireUser();
  const [likes, v] = await Promise.all([likesOf(user.id), mealsView(user.id)]);
  const recipeOfMeal = new Map(v.meals.map((m) => [m.id, m.recipe]));
  const have = new Set([...v.plan.map((p) => p.meal), ...v.basket.map((b) => b.meal)].map((id) => recipeOfMeal.get(id)).filter(Boolean));
  const sides = RECIPES.filter((r) => r.course !== "main" && fits(r, likes));
  return (
    <main className={PAGE}>
      <ThingHeader search={false} back="/meals" backLabel="Food" crumbs={[{ label: "Food", href: "/meals" }]} title="Discover" />
      <div className={COLUMN}>
        <div className="grid gap-1 text-center">
          <h1 id="page-title" className="text-xl font-semibold tracking-tight">Discover</h1>
          <p className="text-muted-foreground text-sm">Whole meals, a main and its sides. + puts one in this week&apos;s basket.</p>
        </div>
        {!likes.answered ? <p className="text-center text-sm"><Link href="/meals/start" className="text-primary underline-offset-2 hover:underline">Tell Reflect how you eat</Link> <span className="text-muted-foreground">and the food you grew up on comes first.</span></p> : null}

        {shelves(likes).map((s) => (
          <Group key={s.region} title={s.region === likes.region ? `${s.label}, where you grew up` : s.label} id={`shelf-${s.region}`}>
            {s.meals.map((m) => {
              const main = recipeOf(m.main)!;
              const added = have.has(m.main);
              return (
                <li key={m.id} className="flex items-center">
                  <Link href={`/meals/r/${main.id}`} className="hover:bg-accent flex min-h-20 min-w-0 flex-1 items-center gap-4 px-4 py-3 transition">
                    <RecipeArt region={main.region} className="size-14" />
                    <span className="grid min-w-0">
                      <span className="truncate text-base font-medium">{m.name}</span>
                      <span className="text-muted-foreground truncate text-sm">{m.sides.length ? `With ${m.sides.map((x) => recipeOf(x)!.name.toLowerCase()).join(", ")}` : `${main.minutes} minutes`}</span>
                    </span>
                  </Link>
                  <div className="pr-2">
                    {added ? <span className="text-primary grid size-9 place-items-center" aria-label={`${m.name} is in this week's basket`}><CheckIcon className="size-5" /></span> : (
                      <form action={basketAction.bind(null, m.id, "", "/meals/discover")}><Button type="submit" variant="ghost" size="icon" aria-label={`Put ${m.name} in the basket`}><PlusIcon /></Button></form>
                    )}
                  </div>
                </li>
              );
            })}
          </Group>
        ))}

        <Group title="Sides and breads" id="sides">
          {sides.map((r) => (
            <li key={r.id} className="flex items-center">
              <Link href={`/meals/r/${r.id}`} className="hover:bg-accent flex min-h-14 min-w-0 flex-1 items-center gap-4 px-4 py-3 transition">
                <RecipeArt region={r.region} className="size-10" />
                <span className="grid min-w-0"><span className="truncate text-base">{r.name}</span><span className="text-muted-foreground text-sm">{r.minutes} minutes, {REGIONS.find((x) => x.id === r.region)!.label}</span></span>
              </Link>
              <div className="pr-2">
                {have.has(r.id) ? <span className="text-primary grid size-9 place-items-center" aria-label={`${r.name} is in this week's basket`}><CheckIcon className="size-5" /></span> : (
                  <form action={basketAction.bind(null, r.id, "", "/meals/discover")}><Button type="submit" variant="ghost" size="icon" aria-label={`Put ${r.name} in the basket`}><PlusIcon /></Button></form>
                )}
              </div>
            </li>
          ))}
        </Group>

        <Group title="Old cookbooks to read" id="cookbooks">
          {COOKBOOKS.map((c) => (
            <li key={c.id}>
              <a href={c.url} target="_blank" rel="noreferrer" className="hover:bg-accent flex min-h-14 items-center gap-4 px-4 py-3 transition">
                <BookOpenIcon aria-hidden="true" className="text-muted-foreground size-5 shrink-0" />
                <span className="grid min-w-0 flex-1"><span className="text-base">{c.title}</span><span className="text-muted-foreground text-sm">{c.author}, {c.year}. {c.where}</span></span>
              </a>
            </li>
          ))}
        </Group>
        <p className="text-muted-foreground text-center text-xs">Reflect writes its recipes for these well-known dishes. The cookbooks are in the public domain and kept by their libraries.</p>
      </div>
    </main>
  );
}
