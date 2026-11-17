import type { Metadata } from "next";
import Link from "next/link";
import { CheckIcon, ChevronRightIcon, PlusIcon } from "lucide-react";
import { COOKBOOKS, fits, MEAL_PLANS, recipeOf, RECIPES, shelves, wholeMealOf } from "@reflect/core/recipes";
import { ThingHeader } from "@/components/headers";
import { COLUMN } from "@/components/list-rows";
import { PAGE } from "@/components/page-header";
import { likesOf, mealsView } from "@/server/meals-store";
import { requireUser } from "@/server/session";
import { basketAction, startPlanAction } from "../actions";
import { RecipeArt } from "../recipe-art";

export const metadata: Metadata = { title: "Discover" };
export const dynamic = "force-dynamic";
const time = (m: number) => (m < 60 ? `${m} min` : `${Math.floor(m / 60)} hr${m % 60 ? ` ${m % 60} min` : ""}`);

function Card({ id, recipe, name, sub, added }: { id: string; recipe: string; name: string; sub: string; added: boolean }) {
  return (
    <li className="grid gap-2">
      <div className="relative">
        <Link href={`/meals/r/${recipe}`} aria-label={name} className="block"><RecipeArt recipe={recipe} className="aspect-[4/3] w-full" /></Link>
        <div className="absolute right-2 bottom-2">
          {added ? (
            <span className="bg-background text-primary grid size-9 place-items-center rounded-full shadow" aria-label={`${name} is in this week's basket`}><CheckIcon className="size-5" /></span>
          ) : (
            <form action={basketAction.bind(null, id, "", "/meals/discover")}>
              <button type="submit" aria-label={`Put ${name} in the basket`} className="bg-primary text-primary-foreground grid size-9 place-items-center rounded-full shadow transition hover:opacity-90"><PlusIcon className="size-5" /></button>
            </form>
          )}
        </div>
      </div>
      <Link href={`/meals/r/${recipe}`} className="grid gap-0.5 hover:underline">
        <span className="text-base leading-snug">{name}</span>
        <span className="text-muted-foreground text-sm">{sub}</span>
      </Link>
    </li>
  );
}

/**
 * Discover (doc "Food design guide"): shelves of photo cards two across, the food the person grew up on first, each
 * card with a + that puts it in the week's basket; old cookbooks; meal plans to start; sides and breads.
 */
export default async function DiscoverPage() {
  const user = await requireUser();
  const [likes, v] = await Promise.all([likesOf(user.id), mealsView(user.id)]);
  const recipeOfMeal = new Map(v.meals.map((m) => [m.id, m.recipe]));
  const have = new Set([...v.plan.map((p) => p.meal), ...v.basket.map((b) => b.meal)].map((id) => recipeOfMeal.get(id)).filter(Boolean));
  const sides = RECIPES.filter((r) => r.course !== "main" && fits(r, likes));
  const plans = MEAL_PLANS.filter((p) => p.meals.some((m) => { const w = wholeMealOf(m); const r = w && recipeOf(w.main); return r && fits(r, likes); }));
  const H2 = "text-lg font-semibold tracking-tight";
  return (
    <main className={PAGE}>
      <ThingHeader search={false} back="/meals" backLabel="Food" crumbs={[{ label: "Food", href: "/meals" }]} title="Discover" />
      <div className={COLUMN}>
        <h1 id="page-title" className="text-3xl font-bold tracking-tight">Discover</h1>
        {!likes.answered ? <p className="text-sm"><Link href="/meals/start" className="text-primary underline-offset-2 hover:underline">Tell Reflect how you eat</Link> <span className="text-muted-foreground">and the food you grew up on comes first.</span></p> : null}

        {shelves(likes).map((s, i) => (
          <section key={s.region} aria-labelledby={`shelf-${s.region}`} className="grid gap-3">
            <h2 id={`shelf-${s.region}`} className={H2}>From {s.label === "Everyday" ? "every day" : s.label.replace(/^The /, "the ")}</h2>
            {s.region === likes.region ? <p className="text-muted-foreground -mt-2 text-sm">Where you grew up.</p> : null}
            <ul className="grid grid-cols-2 gap-x-3 gap-y-5">
              {s.meals.map((m) => { const main = recipeOf(m.main)!; return <Card key={m.id} id={m.id} recipe={main.id} name={m.name} sub={`${time(main.minutes)}${m.sides.length ? `, with ${m.sides.length} ${m.sides.length === 1 ? "side" : "sides"}` : ""}`} added={have.has(m.main)} />; })}
            </ul>
            {i === 0 ? (
              <>
                <section aria-labelledby="cookbooks" className="mt-4 grid gap-3">
                  <h2 id="cookbooks" className={H2}>Cookbooks</h2>
                  <ul className="grid grid-cols-3 gap-3">
                    {COOKBOOKS.map((c) => (
                      <li key={c.id}>
                        <a href={c.url} target="_blank" rel="noreferrer" className="grid gap-2">
                          <span className="grid aspect-[3/4] place-items-center rounded-xl border bg-stone-100 p-3 text-center font-serif text-xs leading-snug text-stone-700 dark:bg-stone-900 dark:text-stone-300">{c.title}</span>
                          <span className="text-sm leading-snug">{c.author.split(" ").slice(-1)[0]}, {c.year}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </section>
                <section aria-labelledby="plans" className="mt-4 grid gap-3">
                  <h2 id="plans" className={H2}>Meal plans</h2>
                  <ul className="grid gap-2">
                    {plans.map((p) => (
                      <li key={p.id}>
                        <form action={startPlanAction.bind(null, p.id)}>
                          <button type="submit" className="bg-card hover:bg-accent flex w-full items-center gap-4 rounded-2xl border px-4 py-3 text-left transition">
                            <span className="grid flex-1"><span className="text-base font-semibold">{p.name}</span><span className="text-muted-foreground text-sm">{p.about}. Tap to put it on this week.</span></span>
                            <ChevronRightIcon aria-hidden="true" className="text-muted-foreground size-4" />
                          </button>
                        </form>
                      </li>
                    ))}
                  </ul>
                </section>
              </>
            ) : null}
          </section>
        ))}

        <section aria-labelledby="sides" className="grid gap-3">
          <h2 id="sides" className={H2}>Sides and breads</h2>
          <ul className="grid grid-cols-2 gap-x-3 gap-y-5">
            {sides.map((r) => <Card key={r.id} id={r.id} recipe={r.id} name={r.name} sub={time(r.minutes)} added={have.has(r.id)} />)}
          </ul>
        </section>
        <p className="text-muted-foreground text-center text-xs">Reflect writes its recipes for these well-known dishes. The cookbooks are in the public domain and kept by their libraries. Photos are from Wikimedia Commons, credited on each recipe.</p>
      </div>
    </main>
  );
}
