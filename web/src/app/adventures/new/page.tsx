import type { Metadata } from "next";
import { PlusIcon } from "lucide-react";
import { IDEAS } from "@reflect/core/adventures";
import { ThingHeader } from "@/components/headers";
import { ActionRow, COLUMN, Group } from "@/components/list-rows";
import { PAGE } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requireUser } from "@/server/session";
import { addAdventureAction } from "../actions";

export const metadata: Metadata = { title: "Add an adventure" };
export const dynamic = "force-dynamic";

/** Adding an adventure: tap an idea, or name your own. The tiles and who it is with are changed on its page. */
export default async function NewAdventurePage() {
  await requireUser();
  return (
    <main className={PAGE}>
      <ThingHeader search={false} back="/adventures" backLabel="Adventures" crumbs={[{ label: "Adventures", href: "/adventures" }]} title="Add an adventure" />
      <div className={COLUMN}>
        <h1 id="page-title" className="text-center text-2xl font-semibold tracking-tight">Add an adventure</h1>
        <form action={addAdventureAction.bind(null, null)} className="flex items-center gap-2">
          <Input name="name" required maxLength={300} placeholder="Your own, such as see the northern lights" aria-label="Your own adventure" className="h-12 text-base" />
          <Button type="submit" size="lg" className="h-12">Add</Button>
        </form>
        {IDEAS.map((g) => (
          <Group key={g.label} title={g.label}>
            {g.ideas.map((i) => <ActionRow key={i.id} action={addAdventureAction.bind(null, i.id)} icon={<PlusIcon />} label={i.name} />)}
          </Group>
        ))}
      </div>
    </main>
  );
}
