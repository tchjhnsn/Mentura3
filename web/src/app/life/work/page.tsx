import type { Metadata } from "next";
import { TileAdventures } from "@/app/adventures/in-tile";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PenLineIcon, PlusIcon, StarIcon } from "lucide-react";
import { itemHref } from "@reflect/core/collections";
import { recommend } from "@reflect/core/recommend";
import { PAGE } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/server/session";
import { workspace, type Wanted, type Workspace } from "@/server/work-space";
import { signalsOf } from "@/server/recommend";
import { lifeActs } from "@/server/life-store";
import { connectionTallies, type Tally } from "@/server/profile-store";
import LifeAppPage from "../[app]/page";
import { WorkHeader } from "./parts";
import { writeTowardAction } from "./space-actions";
import { kindLabel, STATE, WAYS } from "./aims";
import { Steps } from "./steps";

export const metadata: Metadata = { title: "Ergon" };
export const dynamic = "force-dynamic";
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
const money = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
/** How much is under way toward an aim, in words, or null when nothing is. */
function underWay(w: Wanted): string | null {
  const parts = [
    w.entries ? `${w.entries} ${w.entries === 1 ? "entry" : "entries"}, last ${w.lastEntry}` : null,
    w.learning.length ? `learning ${w.learning.length} toward it` : null,
    w.talked ? `talked with ${w.talked} doing it` : null,
  ].filter(Boolean);
  return parts.length ? parts.join(" · ") : null;
}

/** The main aim, as the page's hero: the largest type, the only heavy border, and the one filled button. */
function Hero({ w }: { w: Wanted }) {
  const draws = typeof w.record.body.draws === "string" ? w.record.body.draws : "";
  const done = underWay(w);
  return (
    <section aria-labelledby="main-aim" className="relative grid gap-3 rounded-2xl border-2 border-foreground p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="grid min-w-0 gap-1">
          <p className="text-muted-foreground flex items-center gap-1.5 text-xs"><StarIcon className="fill-foreground size-3.5" aria-label="Main aim" />Main aim · {kindLabel(w)}{w.record.state && STATE[w.record.state] ? ` · ${STATE[w.record.state]}` : ""}</p>
          <h2 id="main-aim" className="text-[28px] leading-tight font-semibold tracking-tight first-letter:uppercase">
            <Link href={`/life/work/${w.record.id}`} className="after:absolute after:inset-0 after:rounded-2xl">{w.title}</Link>
          </h2>
        </div>
        <form action={writeTowardAction.bind(null, w.record.id)} className="relative z-10"><Button type="submit"><PenLineIcon />Write toward it</Button></form>
      </div>
      {draws ? <p className="text-muted-foreground line-clamp-2 text-sm">{draws}</p> : null}
      <p className="text-muted-foreground text-sm">{done ?? "Nothing under way yet"}</p>
    </section>
  );
}

/** With no aim, the hero asks the question Work answers, with the four ways in. */
function NoAim() {
  return (
    <section aria-labelledby="main-aim" className="grid gap-4 rounded-2xl border-2 border-foreground p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="grid gap-1">
          <h2 id="main-aim" className="text-[28px] leading-tight font-semibold tracking-tight">What are you working toward?</h2>
          <p className="text-muted-foreground text-sm">A job, a role, a venture or work that does not exist yet, paid or not.</p>
        </div>
        <Button asChild><Link href="/life/work/add">Choose an aim</Link></Button>
      </div>
      <ul className="grid gap-2 sm:grid-cols-2">
        {WAYS.map((x) => <li key={x.label}><Link href={x.href} className="hover:bg-accent grid rounded-lg border px-4 py-3 transition"><span className="font-medium">{x.label}</span><span className="text-muted-foreground text-sm">{x.note}</span></Link></li>)}
      </ul>
    </section>
  );
}

/** One figure of the season strip: muted label, the number at 20 semibold; it opens the page where it is set. */
function Figure({ label, value, note, href }: { label: string; value: string; note: string; href: string }) {
  return (
    <Link href={href} className="hover:bg-accent grid gap-0.5 rounded-xl border p-4 transition">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className="text-xl font-semibold">{value}</span>
      <span className="text-muted-foreground text-xs">{note}</span>
    </Link>
  );
}

function Season({ s }: { s: Workspace }) {
  return (
    <section aria-labelledby="season" className="order-first grid content-start gap-3 lg:order-none">
      <h2 id="season" className="font-semibold">This season</h2>
      <div className="grid grid-cols-3 gap-3 lg:grid-cols-1">
        <Figure label="To earn a year" value={s.left !== null ? money(s.left) : "Not known"} note={s.left !== null ? "After income" : "Add costs in Home"} href="/plan" />
        <Figure label="Hours a week" value={s.hours !== null ? String(s.hours) : "Not set"} note={s.learningHours ? `Learning ${s.learningHours}` : "Set them"} href="/life/work/season#hours" />
        <Figure label="Covered" value={s.need.covered.length ? String(s.need.covered.length) : "None"} note={s.need.covered.length ? s.need.covered.map((c) => c.label).join(", ") : "By others"} href="/life/work/season#covered" />
      </div>
    </section>
  );
}

function Tallies({ title, rows }: { title: string; rows: Tally[] }) {
  return (
    <div className="grid content-start gap-1.5">
      <h3 className="text-muted-foreground text-xs">{title}</h3>
      {rows.length ? (
        <ol className="grid gap-1">
          {rows.map((r) => <li key={r.label} className="flex items-baseline justify-between gap-3 text-sm"><span className="min-w-0 truncate">{r.label}</span><span className="text-muted-foreground shrink-0 tabular-nums">{r.count}</span></li>)}
        </ol>
      ) : <p className="text-muted-foreground text-sm">None listed</p>}
    </div>
  );
}

/** What the people around the person do, from their own LinkedIn connections: for them alone, never shown to anyone. */
function Around({ t }: { t: { companies: Tally[]; positions: Tally[] } }) {
  return (
    <section aria-labelledby="around" className="grid max-w-xl gap-3 rounded-xl border p-4">
      <h2 id="around" className="font-semibold">What the people around you do</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Tallies title="Companies" rows={t.companies} />
        <Tallies title="Positions" rows={t.positions} />
      </div>
      <p className="text-muted-foreground text-xs">From your LinkedIn connections. Only you see this.</p>
    </section>
  );
}

/**
 * Work's workspace (doc "Work design guide", Workspace): the main aim first, with the one act, writing toward it;
 * this season's three figures; the next steps toward the aim; then the other aims and the records, small.
 */
export default async function WorkPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const k = one(sp.k);
  if (k === "inspired") redirect("/life/work");
  if (k) return LifeAppPage({ params: Promise.resolve({ app: "work" }), searchParams: Promise.resolve(sp) });
  const user = await requireUser();
  const [s, signals, around] = await Promise.all([workspace(user.id), signalsOf(user.id), connectionTallies(user.id).catch(() => null)]);
  const main = s.main;
  const others = s.wanted.filter((w) => w !== main);
  const learn = main ? recommend(signals, undefined, 3) : [];
  const talks = main ? (await lifeActs(user.id, main.record.id)).filter((a) => a.kind === "talked").slice(0, 3) : [];
  return (
    <main className={PAGE}>
      <WorkHeader on="space" />
      <div className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-8">
        {main ? <Hero w={main} /> : <NoAim />}

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_16rem]">
          {main ? (
            <section aria-labelledby="next" className="grid content-start gap-3">
              <h2 id="next" className="text-lg font-semibold tracking-tight">Next steps</h2>
              <div className="grid gap-6 md:grid-cols-3">
                <Steps title="Work for now" empty="No job covers what is left to earn at your hours." rows={s.now.slice(0, 3).map((x) => ({ key: x.job.code, href: `/life/work/jobs/${x.job.code}`, label: x.job.title, reason: x.why[0] ?? (x.pay ? `${money(x.pay)} a year` : "Pay not published") }))} />
                <Steps title="Learn it in Scholē" empty={<>Nothing chosen for this aim yet. <Link href="/schole/browse" className="underline underline-offset-2">Browse Scholē</Link>.</>} rows={learn.map((p) => ({ key: `${p.item.kind}:${p.item.title}`, href: itemHref(p.item), label: p.item.title, reason: p.reason }))} />
                <Steps title="People to talk with" empty={<>Talk with someone who does this work, then keep it on <Link href={`/life/work/${main.record.id}#talked`} className="underline underline-offset-2">the aim</Link>.</>} rows={talks.map((a) => ({ key: a.id, href: `/life/work/${main.record.id}#talked`, label: a.note ?? "Talked with someone doing it", reason: a.day }))} />
              </div>
            </section>
          ) : <div />}
          <Season s={s} />
        </div>

        <section aria-labelledby="others" className="grid gap-2">
          <h2 id="others" className="text-muted-foreground text-sm">{others.length ? "Other aims" : main ? "One aim so far" : "Aims"}</h2>
          <ul className="-mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-1 sm:flex-wrap sm:overflow-visible [&>li]:shrink-0 [&>li]:snap-start">
            {others.map((w) => (
              <li key={w.record.id}>
                <Link href={`/life/work/${w.record.id}`} className="hover:bg-accent grid max-w-56 rounded-lg border px-3 py-2 transition">
                  <span className="text-muted-foreground text-xs">{kindLabel(w)}</span>
                  <span className="truncate text-sm font-medium first-letter:uppercase">{w.title}</span>
                </Link>
              </li>
            ))}
            <li><Link href="/life/work/add" className="text-muted-foreground hover:text-foreground hover:bg-accent flex h-full items-center gap-1.5 rounded-lg border border-dashed px-3 py-2 text-sm transition"><PlusIcon className="size-4" />Add an aim</Link></li>
          </ul>
        </section>

        {around?.total ? <Around t={around} /> : null}

        <nav aria-label="Work records" className="text-muted-foreground flex flex-wrap gap-x-3 gap-y-1 border-t pt-4 text-sm">
          <Link href="/life/work/season" className="hover:text-foreground">This season</Link>
          <Link href="/life/work?k=income" className="hover:text-foreground">Income</Link>
          <Link href="/life/work?k=household" className="hover:text-foreground">Intended household</Link>
          <Link href="/life/work?k=work" className="hover:text-foreground">Work you do</Link>
          <Link href="/life/work?k=credential" className="hover:text-foreground">Credentials</Link>
          <Link href="/life/work/browse" className="hover:text-foreground">Browse work</Link>
        </nav>
      </div>
      <div className="mt-8 max-w-xl"><TileAdventures userId={user.id} tiles={["work"]} /></div>
    </main>
  );
}
