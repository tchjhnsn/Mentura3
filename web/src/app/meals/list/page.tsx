import type { Metadata } from "next";
import { itemText, shoppingList } from "@reflect/core/meals";
import { ThingHeader } from "@/components/headers";
import { COLUMN, Group } from "@/components/list-rows";
import { PAGE } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { instacartReady, mealsView } from "@/server/meals-store";
import { requireUser } from "@/server/session";
import { instacartAction } from "../actions";

export const metadata: Metadata = { title: "Shopping list" };
export const dynamic = "force-dynamic";
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

/** The week's shopping list: every planned meal's ingredients, scaled to the household, like items added together. */
export default async function ListPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const asked = one(sp.day);
  const day = /^\d{4}-\d{2}-\d{2}$/.test(asked) ? asked : new Date().toISOString().slice(0, 10);
  const error = one(sp.error).slice(0, 200);
  const v = await mealsView(user.id, day);
  const list = shoppingList(v.meals, v.plan, v.people);
  return (
    <main className={PAGE}>
      <ThingHeader back={`/meals?day=${day}`} backLabel="Meals" crumbs={[{ label: "Meals", href: `/meals?day=${day}` }]} title="Shopping list" />
      <div className={COLUMN}>
        <div className="grid gap-1 text-center">
          <h1 id="page-title" className="text-xl font-semibold tracking-tight">Shopping list</h1>
          <p className="text-muted-foreground text-sm">The week&apos;s meals, scaled to {v.people} {v.people === 1 ? "person" : "people"}</p>
        </div>

        {list.length ? (
          <Group title="To buy" id="buy">
            {list.map((i) => (
              <li key={`${i.name}|${i.unit}`} className="grid px-4 py-3">
                <span className="text-base">{itemText(i)}</span>
                <span className="text-muted-foreground text-sm">For {i.meals.join(", ")}</span>
              </li>
            ))}
          </Group>
        ) : <p className="text-muted-foreground text-center text-sm">Plan a meal this week and its ingredients appear here.</p>}

        {list.length ? (
          <div className="grid gap-2">
            {instacartReady() ? (
              <form action={instacartAction.bind(null, day)}><Button type="submit" className="w-full">Shop it on Instacart</Button></form>
            ) : <p className="text-muted-foreground text-center text-sm">Sending the list to Instacart turns on once Reflect is connected to Instacart.</p>}
            {error ? <p role="alert" className="text-destructive text-center text-sm">{error}</p> : null}
          </div>
        ) : null}
      </div>
    </main>
  );
}
