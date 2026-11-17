import type { Metadata } from "next";
import { PlusIcon } from "lucide-react";
import { ThingHeader } from "@/components/headers";
import { ActionRow, COLUMN, Group } from "@/components/list-rows";
import { PAGE } from "@/components/page-header";
import { meals } from "@/server/meals-store";
import { requireUser } from "@/server/session";
import { planMealAction } from "../actions";

export const metadata: Metadata = { title: "Add a meal" };
export const dynamic = "force-dynamic";
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

/** Choosing a meal for a day: tap one of your meals, or make a new one. */
export default async function PlanPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser();
  const asked = one((await searchParams).day);
  const day = /^\d{4}-\d{2}-\d{2}$/.test(asked) ? asked : new Date().toISOString().slice(0, 10);
  const mine = await meals(user.id);
  const name = new Date(`${day}T12:00:00Z`).toLocaleDateString("en-US", { timeZone: "UTC", weekday: "long", month: "short", day: "numeric" });
  return (
    <main className={PAGE}>
      <ThingHeader back={`/meals/week?day=${day}`} backLabel="This week" crumbs={[{ label: "This week", href: `/meals/week?day=${day}` }]} title="Add a meal" />
      <div className={COLUMN}>
        <div className="grid gap-1 text-center">
          <h1 id="page-title" className="text-xl font-semibold tracking-tight">Add a meal</h1>
          <p className="text-muted-foreground text-sm">{name}</p>
        </div>
        <Group title="Your meals" id="mine">
          {mine.map((m) => (
            <li key={m.id}>
              <form action={planMealAction.bind(null, m.id, day)}>
                <button type="submit" className="hover:bg-accent flex min-h-14 w-full items-center gap-4 px-4 py-3 text-left transition">
                  <span className="grid min-w-0 flex-1"><span className="truncate text-base">{m.name}</span><span className="text-muted-foreground text-sm">{m.serves ? `Serves ${m.serves}` : `${m.ingredients.length} ingredients`}</span></span>
                  <PlusIcon aria-hidden="true" className="text-muted-foreground size-4" />
                </button>
              </form>
            </li>
          ))}
          {!mine.length ? <li className="text-muted-foreground px-4 py-4 text-sm">You keep no meals yet.</li> : null}
          <ActionRow icon={<PlusIcon />} label="New meal" href={`/meals/new?day=${day}`} />
        </Group>
      </div>
    </main>
  );
}
