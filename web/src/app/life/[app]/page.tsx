import type { Metadata } from "next";
import { TileAdventures } from "@/app/adventures/in-tile";
import { notFound, redirect } from "next/navigation";
import { TILE_KIND, appOf, isLifeApp, kindOf, type Body, type Kind, type LifeAppId } from "@reflect/core/life";
import { PAGE } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/server/session";
import { lifeActs, lifeRecords, type LifeAct, type LifeRecord } from "@/server/life-store";
import { Acts, RecordCard, RecordForm, States } from "../record";
import { Summary } from "../summary";
import { BodySpace } from "../body-space";
import { restoreLifeAction } from "../actions";
import { WorkHeader, type WorkTab } from "../work/parts";
import { TileHeader } from "../tile-header";
import { MealsLink, RiskCard, WaterCard } from "../place-cards";
import { TileConnections } from "../tile-connections";
import { NeedSpace } from "../need-space";
import { FitnessDash, FriendsDash, HealthDash, KinDash, LegacyDash, MateDash, PolisDash, StandingDash, VenturesDash } from "../dashboards";

export const dynamic = "force-dynamic";
/** The tiles an app's workspace speaks for, where they are not its own id. */
const APP_TILES: Partial<Record<LifeAppId, string[]>> = { body: ["health", "fitness"], polis: ["polis", "standing"], home: [] };
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export async function generateMetadata({ params }: { params: Promise<{ app: string }> }): Promise<Metadata> {
  const { app } = await params;
  return { title: isLifeApp(app) ? appOf(app).label : "Reflect" };
}

function Standard({ kind }: { kind: Kind }) {
  if (!kind.standard) return null;
  return <p className="bg-muted/50 rounded-lg border px-4 py-3 text-sm">{kind.standard.text} <span className="text-muted-foreground">({kind.standard.source})</span></p>;
}

/** One kind of record in an app: the one record when the kind is kept once, else the list and a way to add one. */
function KindView({ app, kind, records, acts, back, prefill }: { app: LifeAppId; kind: Kind; records: LifeRecord[]; acts: LifeAct[]; back: string; /** Choices carried in the address (?k=plan&name=will), so a dashboard's add opens with them chosen. */ prefill?: Body }) {
  const mine = records.filter((r) => r.kind === kind.id);
  if (kind.one) {
    const r = mine[0];
    return (
      <div className="grid gap-6">
        {r ? <States kind={kind} record={r} back={back} /> : null}
        <RecordForm app={app} kind={kind} {...(r ? { record: r } : {})} back={back} />
        {r ? <Acts kind={kind} record={r} acts={acts.filter((a) => a.record === r.id)} back={back} /> : null}
      </div>
    );
  }
  return (
    <div className="grid gap-6">
      {mine.length ? (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {mine.map((r) => { const last = acts.find((a) => a.record === r.id); return <RecordCard key={r.id} app={app} kind={kind} record={r} {...(last ? { last } : {})} />; })}
        </ul>
      ) : <p className="text-muted-foreground text-sm">No {kind.plural.toLowerCase()} kept yet.</p>}
      <details className="rounded-xl border p-4" open={!mine.length || Boolean(prefill && Object.keys(prefill).length)}>
        <summary className="cursor-pointer font-medium">Add {kind.label.toLowerCase()}</summary>
        <div className="mt-4"><RecordForm app={app} kind={kind} back={back} {...(prefill ? { initial: prefill } : {})} /></div>
      </details>
    </div>
  );
}

/** A tile's first view: the person's own workspace for it, or where they stand where a tile has none yet. */
function Overview({ app, userId, records, acts, today }: { app: LifeAppId; userId: string; records: LifeRecord[]; acts: LifeAct[]; today: string }) {
  switch (app) {
    case "body": return <BodySpace userId={userId} records={records} acts={acts} today={today} />;
    case "friends": return <FriendsDash userId={userId} records={records} acts={acts} today={today} />;
    case "mate": return <MateDash userId={userId} records={records} today={today} />;
    case "kin": return <KinDash userId={userId} records={records} acts={acts} today={today} />;
    case "polis": return <PolisDash userId={userId} records={records} today={today} />;
    case "ventures": return <VenturesDash userId={userId} records={records} acts={acts} today={today} />;
    case "legacy": return <LegacyDash userId={userId} records={records} acts={acts} today={today} />;
    default: return <Summary app={app} records={records} acts={acts} today={today} />;
  }
}

/**
 * An app behind the home screen's tiles (`@reflect/core/life`): its overview, where the person stands from their
 * own records, and a tab for each kind of record it keeps. A tile that names one part (Income, Food) opens its tab.
 */
export default async function LifeAppPage({ params, searchParams }: { params: Promise<{ app: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser();
  const { app } = await params;
  if (!isLifeApp(app)) notFound();
  const sp = await searchParams;
  const a = appOf(app);
  const kind = kindOf(app, one(sp.k));
  // Food is its own app; every way into Home's food lands on it.
  if (app === "home" && kind?.id === "food") redirect("/meals");
  // Home is no longer a tile: its needs are tiles of the household, and its page is The household's dashboard.
  if (app === "home" && !kind) redirect("/group/household");
  const [records, acts] = await Promise.all([lifeRecords(user.id, app), lifeActs(user.id)]);
  const ids = new Set(records.map((r) => r.id));
  const mine = acts.filter((x) => ids.has(x.record));
  const back = `/life/${app}${kind ? `?k=${kind.id}` : ""}`;
  const removed = one(sp.removed);
  const today = new Date().toISOString().slice(0, 10);
  // A part that is its own tile on the home screen (Food, Shelter, Income) carries the tile's name and goes back home.
  // Home's needs (Food, Water, Shelter, Transport, Safety) open their own workspace, without a form.
  const need = app === "home" && kind?.one && kind.standard && !kind.hidden;
  // Health and Fitness open to their dashboards (doc "Tile designs"); ?all=1 shows the records behind them.
  const dash = !one(sp.all) && ((app === "body" && (kind?.id === "health" || kind?.id === "fitness")) || (app === "polis" && kind?.id === "standing")) ? kind!.id : null;
  const tile = kind ? Object.entries(TILE_KIND).find(([, t]) => t.app === app && t.kind === kind.id)?.[0] : undefined;
  return (
    <main className={PAGE}>
      {tile && tile !== "work" ? <TileHeader tile={app} label={kind!.plural} /> : app === "work" ? <WorkHeader on={(kind?.id as WorkTab | undefined) ?? null} /> : app === "home" ? <TileHeader tile={app} label="The household" part={kind?.plural ?? null} workspace="/group/household" /> : <TileHeader tile={app} label={a.label} part={kind?.plural ?? null} />}
      {removed ? (
        <form action={restoreLifeAction.bind(null, removed, back)} className="bg-muted mt-4 flex items-center justify-between gap-3 rounded-lg px-4 py-2 text-sm">
          <span>Removed.</span><Button type="submit" variant="outline" size="sm">Undo</Button>
        </form>
      ) : null}
      <div className="mt-4 grid max-w-4xl grid-cols-1 gap-6">
        {need || dash || (!kind && ["friends", "kin", "mate", "polis", "ventures", "legacy"].includes(app)) ? null : <p className="text-muted-foreground text-sm">{kind ? kind.intro : a.intro}</p>}
        {dash === "health" ? <HealthDash userId={user.id} records={records} acts={mine} today={today} /> : dash === "fitness" ? <FitnessDash userId={user.id} records={records} acts={mine} today={today} /> : dash === "standing" ? <StandingDash userId={user.id} records={records} acts={mine} today={today} /> : need ? <NeedSpace userId={user.id} kind={kind!} /> : kind ? <>{app === "work" && kind.id === "income" ? <Summary app={app} records={records} acts={mine} today={today} /> : null}<Standard kind={kind} />{app === "home" && kind.id === "safety" ? <RiskCard userId={user.id} /> : null}{app === "home" && kind.id === "water" ? <WaterCard userId={user.id} /> : null}{app === "home" && kind.id === "food" ? <MealsLink /> : null}<KindView app={app} kind={kind} records={records} acts={mine} back={back} prefill={Object.fromEntries(kind.fields.filter((f) => f.kind === "choice" && f.options?.some((o) => o.id === one(sp[f.key]))).map((f) => [f.key, one(sp[f.key])]))} /></> : <Overview app={app} userId={user.id} records={records} acts={mine} today={today} />}
        <TileAdventures userId={user.id} tiles={tile ? [tile] : APP_TILES[app] ?? [app]} />
        <TileConnections userId={user.id} app={app} kind={kind?.id ?? null} />
        {!kind ? <p className="text-muted-foreground text-xs">Everything here is what you state. What you do is kept in your log; reflect on it in your journal.</p> : null}
      </div>
    </main>
  );
}
