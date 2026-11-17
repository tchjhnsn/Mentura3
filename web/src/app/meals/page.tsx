import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon, ShoppingCartIcon, Trash2Icon } from "lucide-react";
import { shoppingList } from "@reflect/core/meals";
import { ThingHeader } from "@/components/headers";
import { ActionRow, COLUMN, Group, Row } from "@/components/list-rows";
import { PAGE } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { mealsView } from "@/server/meals-store";
import { requireUser } from "@/server/session";
import { unplanMealAction } from "./actions";

export const metadata: Metadata = { title: "Meals" };
export const dynamic = "force-dynamic";
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
const shift = (day: string, n: number) => new Date(Date.parse(`${day}T12:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);
const label = (day: string, o: Intl.DateTimeFormatOptions) => new Date(`${day}T12:00:00Z`).toLocaleDateString("en-US", { timeZone: "UTC", ...o });

/** Meals (doc "Tiles and their connections", Food): the week's days down the page, each with its meals, then the list. */
export default async function MealsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser();
  const asked = one((await searchParams).day);
  const day = /^\d{4}-\d{2}-\d{2}$/.test(asked) ? asked : new Date().toISOString().slice(0, 10);
  const v = await mealsView(user.id, day);
  const names = new Map(v.meals.map((m) => [m.id, m.name]));
  const items = shoppingList(v.meals, v.plan, v.people).length;
  const today = new Date().toISOString().slice(0, 10);
  return (
    <main className={PAGE}>
      <ThingHeader back="/life/home?k=food" backLabel="Food" crumbs={[{ label: "Home", href: "/life/home" }, { label: "Food", href: "/life/home?k=food" }]} title="Meals" />
      <div className={COLUMN}>
        <div className="grid gap-1 text-center">
          <h1 id="page-title" className="text-xl font-semibold tracking-tight">Meals</h1>
          <div className="flex items-center justify-center gap-2">
            <Button asChild variant="ghost" size="icon" aria-label="Week before"><Link href={`/meals?day=${shift(v.week[0]!, -7)}`}><ChevronLeftIcon /></Link></Button>
            <p className="text-muted-foreground text-sm">{label(v.week[0]!, { month: "short", day: "numeric" })} to {label(v.week[6]!, { month: "short", day: "numeric" })}, for {v.people} {v.people === 1 ? "person" : "people"}</p>
            <Button asChild variant="ghost" size="icon" aria-label="Week after"><Link href={`/meals?day=${shift(v.week[0]!, 7)}`}><ChevronRightIcon /></Link></Button>
          </div>
        </div>

        <Group>
          <Row href={`/meals/list?day=${v.week[0]}`} icon={<ShoppingCartIcon />} label="Shopping list" value={items ? `${items} ${items === 1 ? "item" : "items"}` : "Empty"} />
        </Group>

        {v.week.map((d) => {
          const planned = v.plan.filter((p) => p.day === d);
          return (
            <Group key={d} title={`${label(d, { weekday: "long", month: "short", day: "numeric" })}${d === today ? ", today" : ""}`} id={`d-${d}`}>
              {planned.map((p) => (
                <li key={p.event} className="flex items-center">
                  <Link href={`/meals/${p.meal}`} className="hover:bg-accent flex min-h-14 min-w-0 flex-1 items-center px-4 py-3 transition"><span className="truncate text-base">{names.get(p.meal)}</span></Link>
                  <form action={unplanMealAction.bind(null, p.event, d)} className="pr-2"><Button type="submit" variant="ghost" size="icon" aria-label={`Take ${names.get(p.meal)} off ${label(d, { weekday: "long" })}`}><Trash2Icon /></Button></form>
                </li>
              ))}
              <ActionRow icon={<PlusIcon />} label="Add a meal" href={`/meals/plan?day=${d}`} />
            </Group>
          );
        })}

        <Group title="Your meals" id="mine">
          {v.meals.map((m) => <Row key={m.id} href={`/meals/${m.id}`} label={m.name} sub={`${m.ingredients.length} ${m.ingredients.length === 1 ? "ingredient" : "ingredients"}`} {...(m.serves ? { value: `Serves ${m.serves}` } : {})} />)}
          <ActionRow icon={<PlusIcon />} label="New meal" href="/meals/new" />
        </Group>
      </div>
    </main>
  );
}
