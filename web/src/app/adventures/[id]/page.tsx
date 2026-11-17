import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarPlusIcon, CheckIcon, ExternalLinkIcon, MapPinIcon, MoreHorizontalIcon, PlusIcon, SparklesIcon, Trash2Icon, XIcon } from "lucide-react";
import { adventureOf, WITH, type Adventure } from "@reflect/core/adventures";
import { GROUPS } from "@reflect/core/plan";
import { ThingHeader } from "@/components/headers";
import { PinMap } from "@/components/map";
import { PAGE } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { lifeRecord } from "@/server/life-store";
import { requireUser } from "@/server/session";
import { cn } from "@/lib/utils";
import {
  addAdventurePersonAction, addAdventureTaskAction, addAdventureToCalendarAction, dropAdventureDraftAction, keepAdventureDraftAction,
  removeAdventureAction, removeAdventurePersonAction, setAdventureBudgetAction, setAdventureDatesAction, setAdventureDoneAction,
  setAdventurePlaceAction, setAdventureWithAction, toggleAdventureTaskAction, toggleAdventureTileAction,
} from "../actions";
import { Faces, photoOf, shortDay, TileGlyph, tileLabel, whenOf } from "../parts";

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

const TABS = [
  { id: "plan", label: "Plan" },
  { id: "checklist", label: "Checklist" },
  { id: "money", label: "Money" },
  { id: "details", label: "Details" },
] as const;
type Tab = (typeof TABS)[number]["id"];

/** What the chat is asked when the person taps Plan with Reflect on this adventure. */
const askFor = (a: Adventure) => `/chat?q=${encodeURIComponent(
  `Plan my adventure "${a.name}"${a.place ? ` in ${a.place}` : ""}${a.start ? ` from ${a.start}${a.end ? ` to ${a.end}` : ""}` : ""}: a day-by-day plan with stops, a packing checklist and a budget. Save it to the adventure.`,
)}`;

const money = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

/**
 * One adventure (doc "Adventures design guide", 2026-11-17), shaped like a trip in a trip planner: its photo with the
 * dates and who is going, the plan by day beside a map, then the checklist, the money and the details as tabs. The one
 * filled act is Plan with Reflect: the chat drafts the plan, and the person keeps or changes it.
 */
export default async function AdventurePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { id } = await params;
  const sp = await searchParams;
  const a = await load(id);
  if (!a) notFound();
  const raw = Array.isArray(sp.tab) ? sp.tab[0] : sp.tab;
  const tab: Tab = TABS.some((t) => t.id === raw) ? (raw as Tab) : "plan";
  const today = new Date().toISOString().slice(0, 10);
  const p = photoOf(a);
  const when = whenOf(a, today);
  return (
    <main className={PAGE}>
      <ThingHeader search={false} back="/adventures" backLabel="Adventures" crumbs={[{ label: "Adventures", href: "/adventures" }]} title={a.name} />

      <div className="mt-4 grid max-w-6xl gap-6">
        <section className="bg-muted relative overflow-hidden rounded-2xl">
          <div className="relative aspect-[4/3] sm:aspect-[3/1]">
            {p ? <img src={`/adventure-photos/${p.image}`} alt="" className="absolute inset-0 size-full object-cover" /> : null}
            <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 grid gap-1.5 p-5 text-white">
              <span className="text-sm text-white/80">{a.done ? "Already" : when ?? "Not yet"}{a.place ? ` · ${a.place}` : ""}</span>
              <h1 id="page-title" className="text-2xl font-bold tracking-tight sm:text-4xl">{a.name}</h1>
              <span className="flex flex-wrap items-center gap-3 text-sm text-white/85">
                <Faces people={a.people} />
                {a.people.length ? <span>{a.people.length} going</span> : null}
                {a.tiles.length ? <span className="flex items-center gap-1.5">{a.tiles.map((t) => <span key={t} title={tileLabel(t)} className="size-4 [&>svg]:size-4"><TileGlyph id={t} /></span>)}</span> : null}
              </span>
            </div>
            {p ? <a href={p.page} target="_blank" rel="noreferrer" className="absolute top-2 right-3 max-w-[70%] truncate text-[0.65rem] text-white/70 hover:text-white">Photo: {p.author}, {p.license}</a> : null}
          </div>
        </section>

        <div className="flex flex-wrap items-center gap-2">
          <Button asChild><Link href={askFor(a)}><SparklesIcon />Plan with Reflect</Link></Button>
          {a.start ? (
            <form action={addAdventureToCalendarAction.bind(null, a.id)}>
              <Button type="submit" variant="outline"><CalendarPlusIcon />Add to calendar</Button>
            </form>
          ) : <Button asChild variant="outline"><Link href="?tab=details#dates"><CalendarPlusIcon />Pick dates</Link></Button>}
          <form action={setAdventureDoneAction.bind(null, a.id, !a.done)}>
            <Button type="submit" variant="ghost"><CheckIcon />{a.done ? "Move to Not yet" : "Mark done"}</Button>
          </form>
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label="More" className="ml-auto"><MoreHorizontalIcon /></Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <form action={removeAdventureAction.bind(null, a.id)}>
                <DropdownMenuItem asChild variant="destructive"><button type="submit" className="w-full"><Trash2Icon />Remove</button></DropdownMenuItem>
              </form>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <nav aria-label="Adventure" className="flex gap-6 border-b">
          {TABS.map((t) => (
            <Link key={t.id} href={t.id === "plan" ? `/adventures/${a.id}` : `?tab=${t.id}`} aria-current={tab === t.id ? "page" : undefined}
              className={cn("-mb-px border-b-2 pb-2 text-sm font-medium transition", tab === t.id ? "border-foreground text-foreground" : "text-muted-foreground hover:text-foreground border-transparent")}>
              {t.label}{t.id === "checklist" && a.checklist.length ? ` ${a.checklist.filter((c) => c.done).length}/${a.checklist.length}` : ""}
            </Link>
          ))}
        </nav>

        {tab === "plan" ? <PlanTab a={a} /> : tab === "checklist" ? <ChecklistTab a={a} /> : tab === "money" ? <MoneyTab a={a} /> : <DetailsTab a={a} />}
      </div>
    </main>
  );
}

/** The plan by day, each stop a card numbered like its pin on the map beside it. */
function PlanTab({ a }: { a: Adventure }) {
  let n = 0;
  const numbered = a.plan.map((d) => ({ ...d, stops: d.stops.map((s) => ({ ...s, n: s.lat !== null && s.lon !== null ? ++n : null })) }));
  const pins = numbered.flatMap((d) => d.stops.filter((s) => s.n !== null).map((s) => ({ lat: s.lat!, lon: s.lon!, label: s.title, n: s.n! })));
  const mapPins = pins.length ? pins : a.lat !== null && a.lon !== null ? [{ lat: a.lat, lon: a.lon, label: a.place ?? a.name }] : [];
  if (!a.plan.length) return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
      <div className="grid content-start justify-items-start gap-3 rounded-2xl border border-dashed p-8">
        <SparklesIcon className="text-muted-foreground size-6" />
        <h2 className="text-lg font-semibold">No plan yet</h2>
        <p className="text-muted-foreground max-w-md">Ask Reflect to draft one: the days, the stops on each, what to pack and what it costs. You keep what you like and change the rest.</p>
        <Button asChild><Link href={askFor(a)}><SparklesIcon />Ask Reflect to draft a plan</Link></Button>
      </div>
      {mapPins.length ? <PinMap pins={mapPins} className="h-72 w-full overflow-hidden rounded-2xl border" /> : null}
    </div>
  );
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
      <div className="grid content-start gap-6">
        {a.drafted ? (
          <div className="bg-primary/10 flex flex-wrap items-center gap-3 rounded-xl px-4 py-3 text-sm">
            <SparklesIcon className="text-primary size-4" />
            <span className="flex-1">Drafted by Reflect. Keep it, or ask for changes.</span>
            <form action={keepAdventureDraftAction.bind(null, a.id)}><Button type="submit" size="sm">Keep</Button></form>
            <Button asChild size="sm" variant="outline"><Link href={`/chat?q=${encodeURIComponent(`Change the plan for "${a.name}": `)}`}>Change</Link></Button>
            <form action={dropAdventureDraftAction.bind(null, a.id)}><Button type="submit" size="sm" variant="ghost" aria-label="Discard draft"><XIcon /></Button></form>
          </div>
        ) : null}
        {numbered.map((d, i) => (
          <section key={i} className="grid gap-3">
            <h2 className="flex items-baseline gap-2">
              <span className="text-lg font-semibold">Day {i + 1}</span>
              <span className="text-muted-foreground text-sm">{[d.day ? shortDay(d.day) : null, d.title].filter(Boolean).join(" · ")}</span>
            </h2>
            <ol className="grid gap-2">
              {d.stops.map((s, j) => (
                <li key={j} className="bg-card flex gap-3 rounded-xl border p-3">
                  <span className={cn("grid size-7 shrink-0 place-items-center rounded-full text-xs font-semibold", s.n ? "bg-foreground text-background" : "bg-muted text-muted-foreground")}>{s.n ?? <MapPinIcon className="size-3.5" />}</span>
                  <span className="grid min-w-0 flex-1 gap-0.5">
                    <span className="flex items-baseline gap-2">
                      {s.time ? <span className="text-muted-foreground text-sm tabular-nums">{s.time}</span> : null}
                      <span className="font-medium">{s.title}</span>
                    </span>
                    {s.note ? <span className="text-muted-foreground text-sm">{s.note}</span> : null}
                  </span>
                  {s.link ? <a href={s.link} target="_blank" rel="noreferrer" aria-label={`Open ${new URL(s.link).hostname}`} className="text-muted-foreground hover:text-foreground self-start p-1"><ExternalLinkIcon className="size-4" /></a> : null}
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>
      <div className="lg:sticky lg:top-20 lg:self-start">
        {mapPins.length ? <PinMap pins={mapPins} className="h-72 w-full overflow-hidden rounded-2xl border lg:h-[28rem]" /> : null}
      </div>
    </div>
  );
}

function ChecklistTab({ a }: { a: Adventure }) {
  return (
    <div className="grid max-w-xl gap-4">
      {a.checklist.length ? (
        <ul className="grid gap-1">
          {a.checklist.map((t, i) => (
            <li key={i}>
              <form action={toggleAdventureTaskAction.bind(null, a.id, i)}>
                <button type="submit" aria-pressed={t.done} className="hover:bg-accent flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition">
                  <span className={cn("grid size-5 shrink-0 place-items-center rounded-md border", t.done && "bg-foreground text-background border-foreground")}>{t.done ? <CheckIcon className="size-3.5" /> : null}</span>
                  <span className={cn(t.done && "text-muted-foreground line-through")}>{t.text}</span>
                </button>
              </form>
            </li>
          ))}
        </ul>
      ) : <p className="text-muted-foreground">Nothing to bring or do yet. Reflect adds a checklist when it drafts the plan.</p>}
      <form action={addAdventureTaskAction.bind(null, a.id)} className="flex items-center gap-2">
        <input name="text" placeholder="Add an item" aria-label="Add an item" className="border-input bg-background h-9 flex-1 rounded-md border px-3 text-sm" />
        <Button type="submit" size="icon" variant="outline" aria-label="Add"><PlusIcon /></Button>
      </form>
    </div>
  );
}

function MoneyTab({ a }: { a: Adventure }) {
  const each = a.budget && a.people.length ? a.budget / (a.people.length + 1) : null;
  return (
    <div className="grid max-w-xl gap-6">
      <div className="grid gap-1">
        <span className="text-muted-foreground text-sm">Budget</span>
        <span className="text-4xl font-bold tracking-tight">{a.budget !== null ? money(a.budget) : "Not set"}</span>
        {each ? <span className="text-muted-foreground text-sm">About {money(each)} each, counting you and {a.people.length} more</span> : null}
      </div>
      <form action={setAdventureBudgetAction.bind(null, a.id)} className="flex items-center gap-2">
        <input name="budget" type="number" min={0} step={1} defaultValue={a.budget ?? ""} placeholder="Total in dollars" aria-label="Budget" className="border-input bg-background h-9 w-48 rounded-md border px-3 text-sm" />
        <Button type="submit" variant="outline" size="sm">Save</Button>
      </form>
      <p className="text-muted-foreground text-sm">The budget counts toward the cost of the life you intend, in your <Link href="/plan" className="underline">income plan</Link>.</p>
    </div>
  );
}

const field = "border-input bg-background h-9 rounded-md border px-3 text-sm";

function DetailsTab({ a }: { a: Adventure }) {
  return (
    <div className="grid max-w-3xl gap-8">
      <section className="grid gap-2" id="place">
        <h2 className="font-semibold">Where</h2>
        <form action={setAdventurePlaceAction.bind(null, a.id)} className="flex flex-wrap items-center gap-2">
          <input name="place" defaultValue={a.place ?? ""} placeholder="A park, a town, a trail" aria-label="Place" className={cn(field, "min-w-64 flex-1")} />
          <Button type="submit" variant="outline" size="sm">Save</Button>
        </form>
        {a.place && a.lat === null ? <p className="text-muted-foreground text-sm">Not found on the map. Try the name of a nearby town.</p> : null}
      </section>

      <section className="grid gap-2" id="dates">
        <h2 className="font-semibold">When</h2>
        <form action={setAdventureDatesAction.bind(null, a.id)} className="flex flex-wrap items-center gap-2">
          <input type="date" name="start" defaultValue={a.start ?? ""} aria-label="Start" className={field} />
          <span className="text-muted-foreground text-sm">to</span>
          <input type="date" name="end" defaultValue={a.end ?? ""} aria-label="End" className={field} />
          <Button type="submit" variant="outline" size="sm">Save</Button>
        </form>
      </section>

      <section className="grid gap-3">
        <h2 className="font-semibold">Who is going</h2>
        <div className="flex flex-wrap items-center gap-2">
          {a.people.map((n, i) => (
            <form key={i} action={removeAdventurePersonAction.bind(null, a.id, i)}>
              <button type="submit" aria-label={`Remove ${n}`} className="bg-muted hover:bg-accent flex items-center gap-2 rounded-full py-1 pr-2 pl-1 text-sm transition">
                <Faces people={[n]} size="size-6" />{n}<XIcon className="text-muted-foreground size-3.5" />
              </button>
            </form>
          ))}
          <form action={addAdventurePersonAction.bind(null, a.id)} className="flex items-center gap-1">
            <input name="name" placeholder="Add a name" aria-label="Add a person" className={cn(field, "h-8 w-36")} />
            <Button type="submit" size="icon" variant="ghost" aria-label="Add person"><PlusIcon /></Button>
          </form>
        </div>
        <div className="flex flex-wrap gap-2">
          {WITH.map((w) => (
            <form key={w.id} action={setAdventureWithAction.bind(null, a.id, w.id)}>
              <button type="submit" aria-pressed={a.with === w.id} className={cn("rounded-full border px-3 py-1 text-sm transition", a.with === w.id ? "bg-foreground text-background border-foreground" : "hover:bg-accent")}>{w.label}</button>
            </form>
          ))}
        </div>
      </section>

      <section className="grid gap-3">
        <h2 className="font-semibold">Tiles it touches</h2>
        {GROUPS.map((g) => (
          <div key={g.id} className="grid gap-2">
            <span className="text-muted-foreground text-xs font-medium">{g.label}</span>
            <div className="flex flex-wrap gap-2">
              {g.tiles.map((t) => (
                <form key={t} action={toggleAdventureTileAction.bind(null, a.id, t)}>
                  <button type="submit" aria-pressed={a.tiles.includes(t)} className={cn("flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition [&>svg]:size-4", a.tiles.includes(t) ? "bg-foreground text-background border-foreground" : "hover:bg-accent")}>
                    <TileGlyph id={t} />{tileLabel(t)}
                  </button>
                </form>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
