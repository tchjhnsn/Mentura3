import Link from "next/link";
import { CheckIcon } from "lucide-react";
import { homeCost, homeNeeds, type NeedView } from "@reflect/core/home";
import { cn } from "@/lib/utils";
import type { LifeAct, LifeRecord } from "@/server/life-store";
import { Button } from "@/components/ui/button";
import { actLifeAction } from "./actions";
import { Head, SPACE } from "./space";
import { Upcoming } from "./upcoming";

const money = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
const BY: Record<string, string> = { kin: "family", polis: "the polis", gifts: "gifts", nature: "nature" };
const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

function NeedCard({ n, id, today }: { n: NeedView; id: string | null; today: string }) {
  const how = [n.how, n.by ? `by ${n.by.toLowerCase()}` : null].filter(Boolean).join(" ");
  const check = n.lapsed ? `Check it again: due ${n.due}` : n.checked ? `Checked ${n.checked}${n.due ? `, again by ${n.due}` : ""}` : n.cycle ? "Not checked yet" : null;
  return (
    <li className="bg-card flex h-full flex-col rounded-xl border shadow-xs">
      <Link href={`/life/home?k=${n.id}`} className="hover:bg-accent flex flex-1 flex-col gap-2 rounded-t-xl p-4 transition">
        <span className="flex items-baseline justify-between gap-2"><span className="font-medium">{n.label}</span><span className={cn("text-xs", n.done === n.of ? "text-foreground" : "text-muted-foreground")}>{n.done} of {n.of} of the standard</span></span>
        <span className="text-sm">{n.stated ? how || "How it is met not said" : <span className="text-muted-foreground">Not stated yet</span>}</span>
        <span className="text-muted-foreground text-xs">{n.covered ? `Covered by ${BY[n.byId!] ?? n.by}` : n.cost !== null ? `${money(n.cost)} a month` : "Cost not given"}</span>
        {n.missing.length ? <ul className="text-muted-foreground mt-auto grid gap-0.5 text-xs">{n.missing.map((m) => <li key={m}>Not yet: {lower(m)}</li>)}</ul> : null}
      </Link>
      {id ? (
        <form action={actLifeAction.bind(null, id)} className="flex items-center justify-between gap-2 border-t px-4 py-2">
          <input type="hidden" name="kind" value="checked" /><input type="hidden" name="day" value={today} /><input type="hidden" name="$back" value="/life/home" />
          <span className={cn("text-xs", n.lapsed ? "font-medium" : "text-muted-foreground")}>{check ?? (n.stated ? "Not checked yet" : "")}</span>
          <Button type="submit" size="icon" variant={n.lapsed ? "default" : "outline"} className="size-8 rounded-full" aria-label={`Checked ${n.label.toLowerCase()} today`} title="Checked today"><CheckIcon /></Button>
        </form>
      ) : null}
    </li>
  );
}

/**
 * Home's workspace (Torian, 2026-11-14 17:44Z, 18:11Z): the person's own needs, how each is met and by whom
 * against its standard and what of it is not in place yet; what Home costs them and what others cover, which is what Work
 * reads to find what is left to earn; the firearms they keep; and Home's calendar.
 */
export async function HomeSpace({ userId, records, acts, today }: { userId: string; records: LifeRecord[]; acts: LifeAct[]; today: string }) {
  const needs = homeNeeds(records, acts, today);
  const idOf = (k: string) => records.find((r) => r.kind === k)?.id ?? null;
  const things = records.filter((r) => r.kind === "belonging");
  const worth = things.reduce((s, r) => s + (typeof r.body.value === "number" ? r.body.value : 0), 0);
  const cost = homeCost(needs);
  const guns = records.filter((r) => r.kind === "firearm");
  return (
    <div className={SPACE}>
      <section className="grid gap-3">
        <Head title="Your needs" note="How each is met now and by whom, and what of its standard is not in place yet. Each comes back when it is time to check it again; open one to say how often." />
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{needs.map((n) => <NeedCard key={n.id} n={n} id={idOf(n.id)} today={today} />)}</ul>
      </section>

      <section className="grid gap-3">
        <Head title="What Home asks of Work" note="What your needs cost you, after what others cover. Work reads this to find what is left to earn." />
        <dl className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border p-4"><dt className="text-muted-foreground text-xs">You pay a month</dt><dd className="mt-1 text-2xl font-semibold">{cost.pay !== null ? money(cost.pay) : "Not known"}</dd><dd className="text-muted-foreground mt-1 text-xs">{cost.pay !== null ? `${money(cost.pay * 12)} a year` : "Give what a need costs to see it."}</dd></div>
          <div className="rounded-xl border p-4"><dt className="text-muted-foreground text-xs">Covered by others</dt><dd className="mt-1 text-base font-medium">{cost.covered.length ? cost.covered.map((n) => `${n.label} by ${BY[n.byId!] ?? n.by}`).join(", ") : "None recorded"}</dd></div>
          <div className="rounded-xl border p-4"><dt className="text-muted-foreground text-xs">In Work</dt><dd className="mt-1 text-sm"><Link href="/life/work#now" className="font-medium underline underline-offset-2">See what is left to earn</Link> and the work that covers it.</dd></div>
        </dl>
      </section>

      <section className="grid gap-3">
        <Head title="Firearms" note="Training and safe storage for each one you keep." add={{ label: "Add a firearm", href: "/life/home?k=firearm" }} />
        {guns.length ? (
          <ul className="divide-y rounded-xl border text-sm">
            {guns.map((g) => (
              <li key={g.id}><Link href={`/life/home/${g.id}`} className="hover:bg-accent flex items-baseline justify-between gap-3 px-4 py-2"><span className="font-medium">{String(g.body.name ?? "Firearm")}</span><span className="text-muted-foreground text-xs">{g.body.training === true ? "Trained" : "Not trained yet"}, {g.body.storage === true ? "stored safely" : "storage not in place"}</span></Link></li>
            ))}
          </ul>
        ) : <p className="text-muted-foreground text-sm">None kept.</p>}
      </section>

      <section className="grid gap-3">
        <Head title="Belongings" note="What you own of value, so a loss can be shown and claimed. Keep a copy away from home too (NAIC)." add={{ label: "Add a belonging", href: "/life/home?k=belonging" }} />
        {things.length ? (
          <>
            <ul className="divide-y rounded-xl border text-sm">
              {things.map((t) => (
                <li key={t.id}><Link href={`/life/home/${t.id}`} className="hover:bg-accent flex items-baseline justify-between gap-3 px-4 py-2"><span className="min-w-0 font-medium">{String(t.body.name ?? "A belonging")}{typeof t.body.where === "string" && t.body.where ? <span className="text-muted-foreground font-normal"> · {t.body.where}</span> : null}</span><span className="text-muted-foreground shrink-0 text-xs">{[typeof t.body.value === "number" ? money(t.body.value) : null, t.body.proof === true ? "photo or receipt kept" : "no photo or receipt"].filter(Boolean).join(", ")}</span></Link></li>
              ))}
            </ul>
            <p className="text-muted-foreground text-sm">{things.length} kept{worth ? `, worth ${money(worth)}` : ""}; {things.filter((t) => t.body.proof !== true).length || "none"} without a photo or receipt.</p>
          </>
        ) : <p className="text-muted-foreground text-sm">None kept.</p>}
      </section>

      <Upcoming userId={userId} tile="home" today={today} />
    </div>
  );
}
