import type { Metadata } from "next";
import { PlusIcon } from "lucide-react";
import { recipeOf } from "@reflect/core/recipes";
import { ThingHeader } from "@/components/headers";
import { ActionRow, COLUMN, Group, Row } from "@/components/list-rows";
import { PAGE } from "@/components/page-header";
import { meals } from "@/server/meals-store";
import { requireUser } from "@/server/session";
import { RecipeArt } from "../recipe-art";

export const metadata: Metadata = { title: "Your recipes" };
export const dynamic = "force-dynamic";

/** Your recipes: the ones you wrote, and Reflect's that you kept, planned or put in the basket. */
export default async function MinePage() {
  const user = await requireUser();
  const mine = await meals(user.id);
  return (
    <main className={PAGE}>
      <ThingHeader search={false} back="/meals" backLabel="Food" crumbs={[{ label: "Food", href: "/meals" }]} title="Your recipes" />
      <div className={COLUMN}>
        <h1 id="page-title" className="text-center text-xl font-semibold tracking-tight">Your recipes</h1>
        <Group>
          {mine.map((m) => {
            const r = m.recipe ? recipeOf(m.recipe) : undefined;
            return <Row key={m.id} href={r ? `/meals/r/${r.id}` : `/meals/${m.id}`} icon={<RecipeArt region={r?.region ?? "everyday"} className="size-8" />} label={m.name} value={r ? `${r.minutes} min` : m.serves ? `Serves ${m.serves}` : undefined} />;
          })}
          {!mine.length ? <li className="text-muted-foreground px-4 py-4 text-sm">Tap the heart on a recipe in Discover to keep it here.</li> : null}
          <ActionRow icon={<PlusIcon />} label="Write your own recipe" href="/meals/new" />
        </Group>
      </div>
    </main>
  );
}
