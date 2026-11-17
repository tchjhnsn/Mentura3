import type { Metadata } from "next";
import { CompassIcon, PlusIcon } from "lucide-react";
import { IDEAS } from "@reflect/core/adventures";
import { SectionHeader } from "@/components/headers";
import { ActionRow, COLUMN, Group, Row } from "@/components/list-rows";
import { PAGE } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { adventuresOf } from "@/server/adventures";
import { requireUser } from "@/server/session";
import { addAdventureAction, restoreAdventureAction } from "./actions";
import { adventureSub } from "./parts";

export const metadata: Metadata = { title: "Adventures" };
export const dynamic = "force-dynamic";
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

/**
 * The Adventures lens (Torian, 2026-11-17, decided 11:02Z): what the person wants to do, from camping to a band,
 * across every tile it touches. Not yet first; what is done moves to Already. With none kept, ideas to tap.
 */
export default async function AdventuresPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser();
  const removed = one((await searchParams).removed);
  const all = await adventuresOf(user.id);
  const notYet = all.filter((a) => !a.done), already = all.filter((a) => a.done);
  return (
    <main className={PAGE}>
      <SectionHeader back="/" backLabel="Home" title="Adventures" />
      <div className={COLUMN}>
        {removed ? (
          <form action={restoreAdventureAction.bind(null, removed)} className="bg-muted flex items-center justify-between gap-3 rounded-lg px-4 py-2 text-sm">
            <span>Removed.</span><Button type="submit" variant="outline" size="sm">Undo</Button>
          </form>
        ) : null}
        <p className="text-muted-foreground px-4 text-sm">What you want to do, alone or with others. Each one shows in every tile it touches.</p>

        <Group title="Not yet" id="not-yet">
          {notYet.map((a) => <Row key={a.id} href={`/adventures/${a.id}`} icon={<CompassIcon />} label={a.name} sub={adventureSub(a)} />)}
          <ActionRow href="/adventures/new" icon={<PlusIcon />} label="Add an adventure" />
        </Group>

        {!all.length ? IDEAS.map((g) => (
          <Group key={g.label} title={g.label}>
            {g.ideas.map((i) => <ActionRow key={i.id} action={addAdventureAction.bind(null, i.id)} icon={<PlusIcon />} label={i.name} />)}
          </Group>
        )) : null}

        {already.length ? (
          <Group title="Already" id="already">
            {already.map((a) => <Row key={a.id} href={`/adventures/${a.id}`} icon={<CompassIcon />} label={a.name} sub={adventureSub(a)} value="Done" />)}
          </Group>
        ) : null}
      </div>
    </main>
  );
}
