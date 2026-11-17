import type { Metadata } from "next";
import Link from "next/link";
import { Trash2Icon } from "lucide-react";
import { itemText } from "@reflect/core/meals";
import { aisleOf } from "@reflect/core/recipes";
import { ThingHeader } from "@/components/headers";
import { COLUMN, Group } from "@/components/list-rows";
import { PAGE } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { instacartReady, mealsView, toBuy } from "@/server/meals-store";
import { requireUser } from "@/server/session";
import { instacartAction, takeFromBasketAction } from "../actions";

export const metadata: Metadata = { title: "Basket" };
export const dynamic = "force-dynamic";
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
const AISLES = ["Produce", "Meat and seafood", "Dairy and eggs", "Breads", "Pantry"];

/**
 * The week's basket (doc "Food design guide"): the meals in it, then everything to buy for them and for the planned
 * days, scaled to the household and set out by the aisle it is usually found in.
 */
export default async function ListPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const asked = one(sp.day);
  const day = /^\d{4}-\d{2}-\d{2}$/.test(asked) ? asked : new Date().toISOString().slice(0, 10);
  const error = one(sp.error).slice(0, 200);
  const v = await mealsView(user.id, day);
  const list = toBuy(v);
  const names = new Map(v.meals.map((m) => [m.id, m]));
  const here = `/meals/list?day=${day}`;
  const planned = [...new Set(v.plan.map((p) => p.meal))];
  return (
    <main className={PAGE}>
      <ThingHeader search={false} back={`/meals?day=${day}`} backLabel="Food" crumbs={[{ label: "Food", href: `/meals?day=${day}` }]} title="Basket" />
      <div className={COLUMN}>
        <div className="grid gap-1 text-center">
          <h1 id="page-title" className="text-xl font-semibold tracking-tight">Basket</h1>
          <p className="text-muted-foreground text-sm">{list.length ? `${list.length} ${list.length === 1 ? "item" : "items"} for ${v.people} ${v.people === 1 ? "person" : "people"}` : "Nothing in it yet"}</p>
        </div>

        {list.length && instacartReady() ? <form action={instacartAction.bind(null, day)}><Button type="submit" size="lg" className="w-full">Shop it on Instacart</Button></form> : null}
        {error ? <p role="alert" className="text-destructive text-center text-sm">{error}</p> : null}

        {v.basket.length || planned.length ? (
          <Group title="Meals in it" id="meals">
            {planned.map((id) => <li key={id} className="flex min-h-12 items-center justify-between gap-4 px-4 py-3"><Link href={names.get(id)?.recipe ? `/meals/r/${names.get(id)!.recipe}` : `/meals/${id}`} className="truncate text-base hover:underline">{names.get(id)?.name}</Link><span className="text-muted-foreground shrink-0 text-sm">Planned</span></li>)}
            {v.basket.map((b) => (
              <li key={b.id} className="flex items-center">
                <Link href={names.get(b.meal)?.recipe ? `/meals/r/${names.get(b.meal)!.recipe}` : `/meals/${b.meal}`} className="hover:bg-accent flex min-h-12 min-w-0 flex-1 items-center px-4 py-3 transition"><span className="truncate text-base">{names.get(b.meal)?.name}</span></Link>
                <form action={takeFromBasketAction.bind(null, b.id, here)} className="pr-2"><Button type="submit" variant="ghost" size="icon" aria-label={`Take ${names.get(b.meal)?.name} out of the basket`}><Trash2Icon /></Button></form>
              </li>
            ))}
          </Group>
        ) : (
          <div className="grid justify-items-center gap-3 py-6 text-center">
            <p className="text-muted-foreground text-sm">Put meals in from Discover, or plan your week, and what to buy appears here by aisle.</p>
            <Button asChild size="lg"><Link href="/meals/discover">Discover meals</Link></Button>
          </div>
        )}

        {AISLES.map((a) => {
          const items = list.filter((i) => aisleOf(i.name) === a);
          return items.length ? (
            <Group key={a} title={a} id={`aisle-${a.toLowerCase().replace(/\W+/g, "-")}`}>
              {items.map((i) => (
                <li key={`${i.name}|${i.unit}`} className="grid px-4 py-3">
                  <span className="text-base">{itemText(i)}</span>
                  <span className="text-muted-foreground truncate text-sm">For {i.meals.join(", ")}</span>
                </li>
              ))}
            </Group>
          ) : null;
        })}
        {list.length && !instacartReady() ? <p className="text-muted-foreground text-center text-xs">Sending the basket to Instacart turns on once Reflect is connected to Instacart.</p> : null}
      </div>
    </main>
  );
}
