import Link from "next/link";
import { CheckIcon, CircleIcon, MapPinIcon, PlusIcon, ShoppingCartIcon, SparklesIcon, UtensilsIcon } from "lucide-react";
import { DashCard, DashHead, Hero, Ring } from "@/components/dash";
import { counts } from "@reflect/core/household";
import { housingShare, markedByReflect, waterDays } from "@reflect/core/home";
import { incomeSummary, kindOf, shown, WAYS, type Kind } from "@reflect/core/life";
import { foodEstimate } from "@reflect/core/plan";
import { ActionRow, Group, Row } from "@/components/list-rows";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { householdOf } from "@/server/household-store";
import { lifeActs, lifeRecords } from "@/server/life-store";
import { mealsView, toBuy } from "@/server/meals-store";
import { placeRecord } from "@/server/public-data";
import { RiskCard, WaterCard } from "./place-cards";
import { addWayAction, checkedTodayAction, setFieldAction } from "./actions";

// One of Home's needs as its own workspace (doc "Household tiles design guide", 2026-11-17): the need's headline
// figure, what only it has, how it is met as rows that each open one choice, its standard, what you did. No form.

const money = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
const DAY = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });
const SHORT = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

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
    own = <DashCard href="/settings/place" title="Where you live" value={place?.county ? `${place.county} County, ${place.state}` : "Not set"} sub="Fair market rent and hazards come from here"><MapPinIcon className="text-muted-foreground size-4" /></DashCard>;
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
      <section className="grid gap-3">
        <DashHead title="Ways you get around" />
        {ways.length ? <ul className="grid gap-4 sm:grid-cols-3">{ways.map((w) => <li key={w.id}><DashCard href={`/life/home/${w.id}`} title="Way" value={shown(wayKind.fields[0]!, w.body) ?? "A way"} className="h-full" /></li>)}</ul> : null}
        <div className="flex flex-wrap gap-2">
          {WAYS.filter((o) => !kept.has(o.id)).map((o) => <form key={o.id} action={addWayAction.bind(null, o.id)}><button type="submit" className="hover:bg-accent flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition"><PlusIcon className="size-3.5" />{o.label}</button></form>)}
        </div>
      </section>
    );
  } else if (kind.id === "food") {
    const v = await mealsView(userId);
    const n = household ? counts(household.members, new Date().getUTCFullYear()) : { adults: 1, children: 0 };
    const usda = foodEstimate("low", n.adults || 1, n.children);
    sub = `USDA low-cost plan for ${n.adults + n.children || 1}: ${money(usda)} a month`;
    const names = new Map(v.meals.map((m) => [m.id, m.name]));
    const list = toBuy(v);
    own = (
      <>
        <Group title="This week" id="week">
          {v.plan.length ? v.plan.map((p) => <Row key={p.event} href={`/meals/${p.meal}`} label={names.get(p.meal) ?? "A meal"} sub={DAY(p.day)} />) : <li className="text-muted-foreground px-4 py-4 text-sm">No meals planned this week.</li>}
          <Row href="/meals/list" icon={<ShoppingCartIcon />} label="Basket" value={list.length ? `${list.length} items` : "Empty"} />
          <Row href="/meals" icon={<UtensilsIcon />} label="Your recipes" value={String(v.meals.length)} />
        </Group>
        <Button asChild size="lg" className="w-full"><Link href="/meals">Plan this week&apos;s meals</Link></Button>
      </>
    );
  }

  const facts = kind.fields.filter((f) => ["choice", "money", "number"].includes(f.kind) && f.key !== "gallons");
  const gallons = kind.fields.find((f) => f.key === "gallons");
  const checks = kind.fields.filter((f) => f.kind === "check");
  const metOf = (key: string) => (key in marked ? marked[key]! : b[key] === true);
  const done = checks.filter((f) => metOf(f.key)).length;
  const ASK: Record<string, string> = {
    shelter: "Help me with housing: what I pay against my county's fair market rent, and the home I intend.",
    water: "Help me get water stored for my household and check my water system.",
    safety: "Help me get my household ready for emergencies: a kit, a plan, a fund and documents.",
    transport: "Help me cut what getting around costs and plan the car or transit I need.",
    food: "Help me plan this week's meals within my budget.",
  };
  return (
    <div className="grid gap-6 pb-4">
      <Hero>
        <div className="flex flex-wrap items-center gap-5">
          <div className="flex min-w-0 flex-1 basis-full items-center gap-5 sm:basis-0">
          {checks.length ? (
            <Ring value={checks.length ? done / checks.length : 0} size={96} stroke={9} label={`${done} of ${checks.length} of the standard met`}>
              <span className="text-lg font-bold">{done}/{checks.length}</span>
            </Ring>
          ) : null}
          <div className="grid min-w-0 flex-1 gap-1">
            <span className="text-muted-foreground text-sm">{kind.standard?.source && kind.standard.source !== "Domain design" ? `By ${kind.standard.source}` : kind.plural}</span>
            {figure ? <span className="text-2xl font-bold tracking-tight sm:text-4xl">{figure}</span> : <Link href={set("cost")} className="text-muted-foreground text-xl font-semibold hover:underline sm:text-2xl">Not stated yet</Link>}
            {sub ? <span className="text-muted-foreground text-sm">{sub}</span> : null}
          </div>
          </div>
          <Button asChild><Link href={`/chat?q=${encodeURIComponent(ASK[kind.id] ?? `Help me with ${kind.plural.toLowerCase()}.`)}`}><SparklesIcon />New Chat</Link></Button>
        </div>
        {checks.length ? (
          <ul className="flex flex-wrap gap-2" aria-label="The standard">
            {checks.map((f) => {
              const byReflect = f.key in marked, met = metOf(f.key);
              const chip = cn("flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition", met ? "bg-primary/10 border-primary/40" : "hover:bg-accent");
              const inner = <>{met ? <CheckIcon aria-hidden="true" className="text-primary size-4" /> : <CircleIcon aria-hidden="true" className="text-muted-foreground size-4" />}{f.label}</>;
              return (
                <li key={f.key}>
                  {byReflect ? <span className={chip} title="From your figures">{inner}</span> : (
                    <form action={setFieldAction.bind(null, "home", kind.id, f.key, !met, back)}><button type="submit" aria-pressed={met} className={chip}>{inner}</button></form>
                  )}
                </li>
              );
            })}
          </ul>
        ) : null}
      </Hero>
      {own}
      <section className="grid gap-3">
        <DashHead title="How it is met" />
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {gallons ? <li><DashCard href={set("gallons")} title={gallons.label} value={shown(gallons, b) ?? "Not said"} className="h-full" /></li> : null}
          {facts.map((f) => <li key={f.key}><DashCard href={set(f.key)} title={f.label} value={shown(f, b) ?? "Not said"} className="h-full" /></li>)}
        </ul>
      </section>
      <form action={checkedTodayAction.bind(null, kind.id)} className="text-muted-foreground flex flex-wrap items-center gap-3 text-sm">
        <span>{acts[0] ? `You last checked the standard on ${SHORT(acts[0].day)}.` : "You have not checked the standard yet."}</span>
        <Button type="submit" variant="outline" size="sm"><CheckIcon />Checked it today</Button>
      </form>
    </div>
  );
}
