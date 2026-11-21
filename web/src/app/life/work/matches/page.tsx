import type { Metadata } from "next";
import Link from "next/link";
import { ZONES } from "@reflect/core/work-browse";
import type { Fit, VentureCandidate } from "@reflect/core/job-fit";
import { ThingHeader } from "@/components/headers";
import { PAGE } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/server/session";
import { workFit } from "@/server/fit-store";

export const metadata: Metadata = { title: "Jobs for you" };
export const dynamic = "force-dynamic";

type Query = { craft?: string; zone?: string; pay?: string };

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || undefined;

/** A link to this page with some query params changed (undefined drops one). */
function hrefWith(q: Query, change: Partial<Record<keyof Query, string | undefined>>): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...q, ...change })) if (v) p.set(k, v);
  const s = p.toString();
  return s ? `/life/work/matches?${s}` : "/life/work/matches";
}

/** Jobs for you (doc "Work and Scholē as Reflect apps", Job matching): the jobs that fit, ranked with why, and crafts worth a venture. */
export default async function MatchesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const raw = await searchParams;
  const q: Query = { craft: one(raw.craft), zone: one(raw.zone), pay: one(raw.pay) };
  const user = await requireUser();
  const fit = await workFit(user.id, 30);

  if (!fit.fits.length) {
    return (
      <main className={PAGE}>
        <Header title="Jobs for you" />
        <div className="mt-10 grid max-w-md justify-items-start gap-3">
          <h1 id="page-title" className="text-2xl font-semibold tracking-tight">No jobs to show yet</h1>
          <p className="text-muted-foreground text-sm">Say which crafts you like and keep a few. The jobs they lead to show here, with the reasons they fit.</p>
          <Button asChild><Link href="/life/work/discover">Find your crafts</Link></Button>
        </div>
      </main>
    );
  }

  const craftLabel = q.craft
    ? fit.crafts.find((c) => c.craft?.id === q.craft)?.craft?.label ?? fit.ventures.find((v) => v.craft.id === q.craft)?.craft.label ?? q.craft
    : null;
  const zone = Number(q.zone);
  const pay = Number(q.pay);
  const zoneOn = zone >= 1 && zone <= 5;
  const payOn = pay > 0;
  const shown = fit.fits.filter((f) =>
    (!q.craft || f.crafts.includes(q.craft)) &&
    (!zoneOn || (f.job.zone ?? 0) <= zone) &&
    (!payOn || (f.job.pay ?? 0) >= pay));
  const kept = fit.crafts.some((c) => c.craft !== null);
  const title = craftLabel ? `Jobs ${craftLabel} leads to` : "Jobs for you";
  const first = shown.slice(0, 10);
  const rest = shown.slice(10);

  return (
    <main className={PAGE}>
      <Header title={title} />
      <div className="mt-4 grid max-w-3xl gap-6">
        <div className="grid gap-1">
          <h1 id="page-title" className="text-3xl font-semibold tracking-tight">{title}</h1>
          {craftLabel ? <p className="text-sm"><Link href={hrefWith(q, { craft: undefined })} className="text-muted-foreground underline-offset-2 hover:underline">Show all jobs for you</Link></p> : null}
          {!kept ? <p className="text-muted-foreground text-sm">From your interests so far. <Link href="/life/work/discover" className="underline underline-offset-2">Keep crafts to sharpen this.</Link></p> : null}
        </div>
        <Filters q={q} />
        {shown.length ? (
          <>
            <JobList fits={first} />
            <Ventures list={fit.ventures} />
            {rest.length ? <JobList fits={rest} /> : null}
          </>
        ) : (
          <div className="grid justify-items-start gap-2 rounded-xl border p-5">
            <p className="font-medium">Nothing fits these filters</p>
            <Link href={zoneOn || payOn ? hrefWith(q, { zone: undefined, pay: undefined }) : "/life/work/matches"} className="text-muted-foreground text-sm underline underline-offset-2">Reset the filters</Link>
          </div>
        )}
      </div>
    </main>
  );
}

function Header({ title }: { title: string }) {
  return <ThingHeader back="/life/work" backLabel="Work" crumbs={[{ label: "Home", href: "/" }, { label: "Work", href: "/life/work" }]} title={title} />;
}

function JobList({ fits }: { fits: Fit[] }) {
  return (
    <ul className="divide-y rounded-xl border">
      {fits.map((f) => {
        const facts = [f.job.pay ? `$${f.job.pay.toLocaleString("en-US")} median` : null, f.job.zone ? ZONES[f.job.zone] : null].filter(Boolean);
        return (
          <li key={f.job.code} className="grid gap-1 px-4 py-3">
            <Link href={`/life/work/jobs/${f.job.code}`} className="text-[15px] font-semibold leading-snug hover:underline">{f.job.title}</Link>
            {f.reasons.length ? <p className="text-muted-foreground text-xs">{f.reasons.join(" · ")}</p> : null}
            {facts.length ? <p className="text-muted-foreground text-xs">{facts.join(" · ")}</p> : null}
          </li>
        );
      })}
    </ul>
  );
}

function Ventures({ list }: { list: VentureCandidate[] }) {
  if (!list.length) return null;
  return (
    <section className="grid gap-3">
      <h2 className="text-lg font-semibold tracking-tight">Crafts you could build a venture on</h2>
      <ul className="divide-y rounded-xl border">
        {list.map((v) => (
          <li key={v.craft.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <span className="grid gap-0.5">
              <span className="text-[15px] font-semibold">{v.craft.label} ({v.stage})</span>
              <span className="text-muted-foreground text-xs">Few jobs pay for it</span>
            </span>
            <Button asChild size="sm" variant="outline"><Link href="/life/ventures">Explore as a venture</Link></Button>
          </li>
        ))}
      </ul>
    </section>
  );
}

const ZONE_OPTIONS = [1, 2, 3, 4, 5];
const PAY_OPTIONS = [30000, 50000, 75000, 100000];

/** Most preparation and least pay, as a GET form: behind a Filter button on a phone, inline when wide. */
function Filters({ q }: { q: Query }) {
  const form = (
    <form action="/life/work/matches" method="get" className="flex flex-wrap items-end gap-3 text-sm">
      {q.craft ? <input type="hidden" name="craft" value={q.craft} /> : null}
      <label className="grid gap-1">
        <span className="text-muted-foreground text-xs">Preparation, at most</span>
        <select name="zone" defaultValue={q.zone ?? ""} className="bg-background h-8 rounded-md border px-2">
          <option value="">Any</option>
          {ZONE_OPTIONS.map((z) => <option key={z} value={z}>{ZONES[z]}</option>)}
        </select>
      </label>
      <label className="grid gap-1">
        <span className="text-muted-foreground text-xs">Median pay, at least</span>
        <select name="pay" defaultValue={q.pay ?? ""} className="bg-background h-8 rounded-md border px-2">
          <option value="">Any</option>
          {PAY_OPTIONS.map((p) => <option key={p} value={p}>${p.toLocaleString("en-US")}</option>)}
        </select>
      </label>
      <Button type="submit" size="sm" variant="outline">Apply</Button>
    </form>
  );
  return (
    <>
      <details className="sm:hidden">
        <Button asChild size="sm" variant="ghost"><summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">Filter</summary></Button>
        <div className="mt-3">{form}</div>
      </details>
      <div className="hidden sm:block">{form}</div>
    </>
  );
}
