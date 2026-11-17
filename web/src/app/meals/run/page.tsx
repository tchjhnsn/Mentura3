import type { Metadata } from "next";
import Link from "next/link";
import { CheckIcon } from "lucide-react";
import { aisleOf } from "@reflect/core/recipes";
import { estimate, priceBook } from "@reflect/core/spending";
import { ThingHeader } from "@/components/headers";
import { COLUMN, Group, Row } from "@/components/list-rows";
import { PAGE } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { lifeRecords } from "@/server/life-store";
import { instacartReady, mealsView, toBuy } from "@/server/meals-store";
import { requireUser } from "@/server/session";
import { foodMoney } from "@/server/spending-store";
import { instacartAction, runDayAction } from "../actions";

export const metadata: Metadata = { title: "Grocery run" };
export const dynamic = "force-dynamic";
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
const shift = (day: string, n: number) => new Date(Date.parse(`${day}T12:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);
const DAY = (d: string, o: Intl.DateTimeFormatOptions) => new Date(`${d}T12:00:00Z`).toLocaleDateString("en-US", { timeZone: "UTC", ...o });
const money = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
const AISLES = ["Produce", "Meat and seafood", "Dairy and eggs", "Breads", "Pantry"];

/**
 * The next grocery run (doc "Food design guide", revision 2): the day and what it covers, an estimate from the person's
 * own receipts and what it leaves of the month, the items by aisle, then Order on Instacart, the one filled button,
 * or the list to take to a store. Instacart's checkout happens on Instacart's own page.
 */
export default async function RunPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser();
  const picking = one((await searchParams).pick) === "day";
  const today = new Date().toISOString().slice(0, 10);
  const home = await lifeRecords(user.id, "home");
  const set = home.find((r) => r.kind === "grocery-run")?.body.day;
  const day = typeof set === "string" && set >= today ? set : null;
  const [v, f] = await Promise.all([mealsView(user.id, day ?? today), foodMoney(user.id, today.slice(0, 7))]);
  const list = toBuy(v);
  const est = estimate(list, priceBook(f.receipts));
  const dinners = new Set(v.plan.map((p) => p.day)).size;
  const left = f.allot - f.spent.total;

  if (picking) {
    return (
      <main className={PAGE}>
        <ThingHeader search={false} back="/meals/run" backLabel="Grocery run" crumbs={[{ label: "Food", href: "/meals" }, { label: "Grocery run", href: "/meals/run" }]} title="Day" />
        <div className={COLUMN}>
          <h1 id="page-title" className="text-center text-xl font-semibold tracking-tight">When will you shop?</h1>
          <Group>
            {Array.from({ length: 8 }, (_, i) => shift(today, i)).map((d) => (
              <li key={d}>
                <form action={runDayAction.bind(null, d)}>
                  <button type="submit" aria-pressed={d === day} className="hover:bg-accent flex min-h-14 w-full items-center gap-4 px-4 py-3 text-left text-base transition">
                    <span className="flex-1">{d === today ? "Today" : d === shift(today, 1) ? "Tomorrow" : DAY(d, { weekday: "long", month: "short", day: "numeric" })}</span>
                    {d === day ? <CheckIcon aria-label="Chosen" className="text-primary size-5" /> : null}
                  </button>
                </form>
              </li>
            ))}
          </Group>
        </div>
      </main>
    );
  }

  return (
    <main className={PAGE}>
      <ThingHeader search={false} back="/meals" backLabel="Food" crumbs={[{ label: "Food", href: "/meals" }]} title="Grocery run" />
      <div className={COLUMN}>
        <h1 id="page-title" className="text-2xl font-semibold tracking-tight">Grocery run</h1>
        <Group>
          <Row href="/meals/run?pick=day" label="Day" value={day ? (day === today ? "Today" : DAY(day, { weekday: "long" })) : "Not chosen"} />
          <Row href={`/meals/week?day=${v.week[0]}`} label="For" value={`${dinners} ${dinners === 1 ? "dinner" : "dinners"}${v.basket.length ? `, ${v.basket.length} in the basket` : ""}`} />
        </Group>

        <div className="grid gap-1">
          {est.priced && est.priced >= est.items / 2 ? (
            <>
              <p className="text-3xl font-semibold tracking-tight">About {money(est.total)}</p>
              <p className="text-muted-foreground text-sm">From prices on your receipts, for {est.priced} of {est.items} items.{` Leaves ${money(left - est.total)} for the rest of ${DAY(today, { month: "long" })}.`}</p>
            </>
          ) : (
            <p className="text-muted-foreground text-sm">{est.priced ? `Your receipts price ${est.priced} of these ${est.items} items so far; a few more and Reflect estimates the run.` : "Add a few grocery receipts and Reflect estimates each run from what you paid."} {money(Math.max(0, left))} of food money is left this month.</p>
          )}
        </div>

        {list.length ? (
          <Group title={`${list.length} items by aisle`} id="aisles">
            {AISLES.map((a) => { const n = list.filter((i) => aisleOf(i.name) === a).length; return n ? <Row key={a} href={`/meals/list?day=${v.week[0]}#aisle-${a.toLowerCase().replace(/\W+/g, "-")}`} label={a} value={String(n)} /> : null; })}
          </Group>
        ) : <p className="text-muted-foreground text-sm">Nothing to buy yet. <Link href="/meals/week" className="text-primary underline-offset-2 hover:underline">Plan the week</Link> or put meals in the basket from <Link href="/meals/discover" className="text-primary underline-offset-2 hover:underline">Discover</Link>.</p>}

        {list.length ? (
          <div className="grid gap-2">
            {instacartReady() ? <form action={instacartAction.bind(null, v.week[0]!)}><Button type="submit" size="lg" className="w-full">Order on Instacart</Button></form> : null}
            <Button asChild size="lg" variant={instacartReady() ? "outline" : "default"} className="w-full"><Link href={`/meals/list?day=${v.week[0]}`}>Shop in a store with the list</Link></Button>
            {!instacartReady() ? <p className="text-muted-foreground text-center text-xs">Ordering on Instacart turns on once Reflect is connected to Instacart.</p> : <p className="text-muted-foreground text-center text-xs">Instacart opens with your list. You pick the store, add it to your cart and pay there.</p>}
          </div>
        ) : null}
      </div>
    </main>
  );
}
