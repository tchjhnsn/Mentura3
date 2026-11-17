import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Trash2Icon } from "lucide-react";
import { ThingHeader } from "@/components/headers";
import { ActionRow, COLUMN, Group } from "@/components/list-rows";
import { PAGE } from "@/components/page-header";
import { lifeRecord } from "@/server/life-store";
import { requireUser } from "@/server/session";
import { removeMealAction, saveMealAction } from "../actions";
import { MealForm } from "../meal-form";

export const metadata: Metadata = { title: "Meal" };
export const dynamic = "force-dynamic";

/** One of the person's meals, to change or remove. */
export default async function MealPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const r = /^[0-9a-f-]{36}$/.test(id) ? await lifeRecord(user.id, id) : null;
  if (!r || r.kind !== "meal") notFound();
  const name = String(r.body.name ?? "Meal");
  return (
    <main className={PAGE}>
      <ThingHeader back="/meals" backLabel="Meals" crumbs={[{ label: "Meals", href: "/meals" }]} title={name} />
      <div className={COLUMN}>
        <h1 id="page-title" className="text-center text-xl font-semibold tracking-tight">{name}</h1>
        <div className="bg-card rounded-2xl border p-4"><MealForm action={saveMealAction.bind(null, id)} body={r.body as Record<string, string | number | boolean>} submit="Save" /></div>
        <Group><ActionRow icon={<Trash2Icon />} label="Remove this meal" action={removeMealAction.bind(null, id)} danger /></Group>
      </div>
    </main>
  );
}
