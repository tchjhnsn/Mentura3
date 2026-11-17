import Link from "next/link";
import { CheckIcon, CircleIcon, MapPinIcon, PlusIcon, ShoppingCartIcon, UtensilsIcon } from "lucide-react";
import { counts } from "@reflect/core/household";
import { housingShare, markedByReflect, waterDays } from "@reflect/core/home";
import { incomeSummary, kindOf, shown, WAYS, type Kind } from "@reflect/core/life";
import { foodEstimate } from "@reflect/core/plan";
import { shoppingList } from "@reflect/core/meals";
import { ActionRow, Group, Row } from "@/components/list-rows";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { householdOf } from "@/server/household-store";
import { lifeActs, lifeRecords } from "@/server/life-store";
import { mealsView } from "@/server/meals-store";
import { placeRecord } from "@/server/public-data";
import { RiskCard, WaterCard } from "./place-cards";
import { addWayAction, checkedTodayAction, setFieldAction } from "./actions";

// One of Home's needs as its own workspace (doc "Household tiles design guide", 2026-11-17): the need's headline
// figure, what only it has, how it is met as rows that each open one choice, its standard, what you did. No form.

const money = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
const DAY = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });
const SHORT = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

function Headline({ figure, sub, href }: { figure: string | null; sub: string | null; href?: string }) {
  const big = <span className={cn("block text-3xl font-semibold tracking-tight", figure ? "" : "text-muted-foreground text-2xl")}>{figure ?? "Not stated yet"}</span>;
  return (
    <div className="grid justify-items-center gap-1 py-2 text-center">
      {href && !figure ? <Link href={href} className="hover:underline">{big}</Link> : big}
      {sub ? <span className="text-muted-foreground text-sm">{sub}</span> : null}
    </div>
  );
}

export async function NeedSpace({ userId, kind }: { userId: string; kind: Kind }) {
  const [home, work, household] = await Promise.all([lifeRecords(userId, "home"), lifeRecords(userId, "work"), householdOf(userId).catch(() => null)]);
  const r = home.find((x) => x.kind === kind.id);
  const b = r?.body ?? {};
  const acts = r ? (await lifeActs(userId, r.id)).filter((a) => a.kind === "checked") : [];
  const people = Math.max(1, household?.members.length ?? 1);
  const cost = typeof b.cost === "number" ? b.cost : null;
  const set = (f: string) => `/life/home/set?k=${kind.id}&f=${f}`;
  const back = `/life/home?k=${kind.id}`;

  // The headline and what Reflect can mark of the standard, from the person's own figures.
  let figure: string | null = cost !== null ? `${money(cost)} a month` : null;
  let sub: string | null = null;
  let marked: Record<string, boolean> = {};
  let own: React.ReactNode = null;
  if (kind.id === "shelter") {
    const income = incomeSummary(work.map((x) => ({ kind: x.kind, state: x.state, body: x.body }))).year;
    const share = housingShare(cost, income);
    figure = share !== null ? `${share}% of your income` : figure;
    sub = share !== null ? `${money(cost!)} a month. HUD's line is 30%.` : cost !== null ? "Add your income in Work to see its share" : "HUD's line is 30% of income";
    marked = markedByReflect("shelter", { share });
    const place = await placeRecord(userId);
    own = <Group title="Where you live" id="where"><Row href="/settings/place" icon={<MapPinIcon />} label={place?.county ? `${place.county} County, ${place.state}` : "Where you live"} value={place?.county ? undefined : "Not set"} /></Group>;
  } else if (kind.id === "water") {
    const gallons = typeof b.gallons === "number" ? b.gallons : null;
    const days = waterDays(gallons, people);
    figure = days !== null ? `${days} ${days === 1 ? "day" : "days"} of water stored` : null;
    sub = days !== null ? `${gallons} gallons for ${people} ${people === 1 ? "person" : "people"}, at a gallon each a day (Ready.gov)` : "A gallon a person a day, three days at least (Ready.gov)";
    marked = markedByReflect("water", { days });
    own = <WaterCard userId={userId} />;
  } else if (kind.id === "safety") {
    const checks = kind.fields.filter((f) => f.kind === "check");
    figure = `${checks.filter((f) => b[f.key] === true).length} of ${checks.length} ready`;
    sub = "Ready.gov's four: a kit, a plan, a fund, documents";
    own = <RiskCard userId={userId} />;
  } else if (kind.id === "transport") {
    const ways = home.filter((x) => x.kind === "way");
    marked = markedByReflect("transport", { ways: ways.length });
    sub = cost !== null ? "What getting around costs" : null;
    const wayKind = kindOf("home", "way")!;
    const kept = new Set(ways.map((w) => String(w.body.how)));
    own = (
      <Group title="Ways you get around" id="ways">
        {ways.map((w) => <Row key={w.id} href={`/life/home/${w.id}`} label={shown(wayKind.fields[0]!, w.body) ?? "A way"} />)}
        {WAYS.filter((o) => !kept.has(o.id)).map((o) => <ActionRow key={o.id} icon={<PlusIcon />} label={o.label} action={addWayAction.bind(null, o.id)} />)}
      </Group>
    );
  } else if (kind.id === "food") {
    const v = await mealsView(userId);
    const n = household ? counts(household.members, new Date().getUTCFullYear()) : { adults: 1, children: 0 };
    const usda = foodEstimate("low", n.adults || 1, n.children);
    sub = `USDA low-cost plan for ${n.adults + n.children || 1}: ${money(usda)} a month`;
    const names = new Map(v.meals.map((m) => [m.id, m.name]));
    const list = shoppingList(v.meals, v.plan, v.people);
    own = (
      <>
        <Group title="This week" id="week">
          {v.plan.length ? v.plan.map((p) => <Row key={p.event} href={`/meals/${p.meal}`} label={names.get(p.meal) ?? "A meal"} sub={DAY(p.day)} />) : <li className="text-muted-foreground px-4 py-4 text-sm">No meals planned this week.</li>}
          <Row href="/meals/list" icon={<ShoppingCartIcon />} label="Shopping list" value={list.length ? `${list.length} items` : "Empty"} />
          <Row href="/meals" icon={<UtensilsIcon />} label="Your meals" value={String(v.meals.length)} />
        </Group>
        <Button asChild size="lg" className="w-full"><Link href="/meals">Plan this week&apos;s meals</Link></Button>
      </>
    );
  }

  const facts = kind.fields.filter((f) => ["choice", "money", "number"].includes(f.kind) && f.key !== "gallons");
  const gallons = kind.fields.find((f) => f.key === "gallons");
  const checks = kind.fields.filter((f) => f.kind === "check");
  return (
    <div className="mx-auto grid w-full max-w-xl gap-8 pb-4">
      <Headline figure={figure} sub={sub} href={set("cost")} />
      {own}
      <Group title="How it is met" id="met">
        {gallons ? <Row href={set("gallons")} label={gallons.label} value={shown(gallons, b) ?? "Not said"} /> : null}
        {facts.map((f) => <Row key={f.key} href={set(f.key)} label={f.label} value={shown(f, b) ?? "Not said"} />)}
      </Group>
      {checks.length ? (
        <Group title={kind.standard?.source && kind.standard.source !== "Domain design" ? `Standard, ${kind.standard.source}` : "Standard"} id="standard">
          {checks.map((f) => {
            const byReflect = f.key in marked;
            const met = byReflect ? marked[f.key]! : b[f.key] === true;
            const inner = (
              <>
                {met ? <CheckIcon aria-hidden="true" className="text-primary size-5 shrink-0" /> : <CircleIcon aria-hidden="true" className="text-muted-foreground size-5 shrink-0" />}
                <span className="flex-1 text-base">{f.label}</span>
                {byReflect ? <span className="text-muted-foreground text-xs">From your figures</span> : null}
              </>
            );
            return (
              <li key={f.key}>
                {byReflect ? <div className="flex min-h-14 items-center gap-4 px-4 py-3">{inner}</div> : (
                  <form action={setFieldAction.bind(null, "home", kind.id, f.key, !met, back)}>
                    <button type="submit" aria-pressed={met} className="hover:bg-accent flex min-h-14 w-full items-center gap-4 px-4 py-3 text-left transition">{inner}</button>
                  </form>
                )}
              </li>
            );
          })}
        </Group>
      ) : null}
      <Group title="What you did" id="did">
        {acts.slice(0, 3).map((a) => <li key={a.id} className="flex min-h-12 items-center justify-between gap-4 px-4 py-3 text-base"><span>Checked the standard</span><span className="text-muted-foreground text-sm">{SHORT(a.day)}</span></li>)}
        <ActionRow icon={<CheckIcon />} label="Checked the standard today" action={checkedTodayAction.bind(null, kind.id)} />
      </Group>
    </div>
  );
}
