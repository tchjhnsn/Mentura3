import type { Metadata } from "next";
import { ThingHeader } from "@/components/headers";
import { COLUMN } from "@/components/list-rows";
import { PAGE } from "@/components/page-header";
import { requireUser } from "@/server/session";
import { addMealAction } from "../actions";
import { MealForm } from "../meal-form";

export const metadata: Metadata = { title: "New meal" };
export const dynamic = "force-dynamic";
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

/** A new meal; from a day's "Add a meal", it is put on that day too. */
export default async function NewMealPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireUser();
  const day = one((await searchParams).day).replace(/[^0-9-]/g, "");
  return (
    <main className={PAGE}>
      <ThingHeader back="/meals" backLabel="Meals" crumbs={[{ label: "Meals", href: "/meals" }]} title="New meal" />
      <div className={COLUMN}>
        <h1 id="page-title" className="text-center text-xl font-semibold tracking-tight">New meal</h1>
        <div className="bg-card rounded-2xl border p-4"><MealForm action={addMealAction.bind(null, day)} body={{}} submit={day ? "Keep it and add it" : "Keep it"} /></div>
      </div>
    </main>
  );
}
