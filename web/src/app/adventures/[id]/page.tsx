import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CheckIcon, Trash2Icon } from "lucide-react";
import { adventureOf, WITH } from "@reflect/core/adventures";
import { GROUPS } from "@reflect/core/plan";
import { ThingHeader } from "@/components/headers";
import { ActionRow, COLUMN, Group, Row } from "@/components/list-rows";
import { PAGE } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { lifeRecord } from "@/server/life-store";
import { requireUser } from "@/server/session";
import { hrefOf, MINE } from "../../home-tiles";
import { removeAdventureAction, setAdventureDoneAction, setAdventureWithAction, toggleAdventureTileAction } from "../actions";
import { TileGlyph, tileLabel } from "../parts";

export const dynamic = "force-dynamic";

async function load(id: string) {
  const user = await requireUser();
  const r = await lifeRecord(user.id, id);
  return r && r.app === "legacy" && r.kind === "adventure" ? adventureOf(r) : null;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  return { title: (await load(id))?.name ?? "Adventure" };
}

/** A tap row that turns something on or off, with a check when it is on. */
function Toggle({ on, label, action, icon }: { on: boolean; label: string; action: () => Promise<void>; icon?: React.ReactNode }) {
  return (
    <li>
      <form action={action}>
        <button type="submit" aria-pressed={on} className="hover:bg-accent flex min-h-14 w-full items-center gap-4 px-4 py-3 text-left transition">
          {icon ? <span className="text-muted-foreground grid min-w-6 shrink-0 place-items-center [&>svg]:size-5">{icon}</span> : null}
          <span className="flex-1 text-base">{label}</span>
          {on ? <CheckIcon aria-label="Chosen" className="text-primary size-5" /> : null}
        </button>
      </form>
    </li>
  );
}

/**
 * One adventure: its name, the one act (mark it done, or back to Not yet), the tiles it lives in, who it is with, and
 * taking it off. Every change is a tap.
 */
export default async function AdventurePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const a = await load(id);
  if (!a) notFound();
  return (
    <main className={PAGE}>
      <ThingHeader search={false} back="/adventures" backLabel="Adventures" crumbs={[{ label: "Adventures", href: "/adventures" }]} title={a.name} />
      <div className={COLUMN}>
        <div className="grid gap-3 text-center">
          <p className="text-muted-foreground text-sm">{a.done ? "Already" : "Not yet"}</p>
          <h1 id="page-title" className="text-3xl font-bold tracking-tight">{a.name}</h1>
          <form action={setAdventureDoneAction.bind(null, a.id, !a.done)} className="justify-self-center">
            <Button type="submit" size="lg" variant={a.done ? "outline" : "default"}>{a.done ? "Move back to Not yet" : "Mark it done"}</Button>
          </form>
        </div>

        <Group title="Where it lives" id="tiles">
          {a.tiles.length ? a.tiles.map((t) => {
            const tile = MINE.find((x) => x.id === t);
            const href = tile ? hrefOf(tile) : null;
            return <Row key={t} href={href ?? "/"} icon={<TileGlyph id={t} />} label={tileLabel(t)} />;
          }) : <li className="text-muted-foreground px-4 py-3 text-sm">No tile yet. Choose the tiles it touches below.</li>}
        </Group>

        <details className="group grid gap-4">
          <summary className="text-primary cursor-pointer px-4 text-sm">Add or remove tiles</summary>
          <div className="mt-4 grid gap-6">
            {GROUPS.map((g) => (
              <Group key={g.id} title={g.label}>
                {g.tiles.map((t) => <Toggle key={t} on={a.tiles.includes(t)} label={tileLabel(t)} icon={<TileGlyph id={t} />} action={toggleAdventureTileAction.bind(null, a.id, t)} />)}
              </Group>
            ))}
          </div>
        </details>

        <Group title="With" id="with">
          {WITH.map((w) => <Toggle key={w.id} on={a.with === w.id} label={w.label} action={setAdventureWithAction.bind(null, a.id, w.id)} />)}
        </Group>

        <Group>
          <ActionRow danger icon={<Trash2Icon />} label="Remove this adventure" action={removeAdventureAction.bind(null, a.id)} />
        </Group>
      </div>
    </main>
  );
}
