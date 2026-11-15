import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MicIcon } from "lucide-react";
import { bareName, episodeGuests, showGuests } from "@reflect/core/guests";
import { episodeDay, episodeKey } from "@reflect/core/podcasts";
import { PAGE } from "@/components/page-header";
import { ThingHeader } from "@/components/headers";
import { requireUser } from "@/server/session";
import { listItems } from "@/server/ways-store";
import { showFor } from "@/server/podcasts";
import { appearancesOf, bioFor } from "@/server/guests";
import { browseCrumbs } from "../../crumbs";
import { GuestChips } from "../../podcasts/mentions";
import { followed, personFacts } from "@/server/people";
import { Button } from "@/components/ui/button";
import { followPersonAction } from "../actions";

export const metadata: Metadata = { title: "Person" };
export const dynamic = "force-dynamic";

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
const said = (s: number) => { const h = Math.floor(s / 3600), m = Math.round((s % 3600) / 60); return h ? `${h}h${m ? ` ${m}m` : ""}` : `${Math.max(1, m)}m`; };

type Row = { key: string; title: string; show: string; date: string | null; seconds: number | null; image: string | null; href: string };

function Episodes({ rows, today }: { rows: Row[]; today: string }) {
  return (
    <ul className="divide-y rounded-lg border">
      {rows.map((r) => (
        <li key={r.key}>
          <Link href={r.href} className="hover:bg-accent flex items-center gap-3 p-3">
            {r.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={r.image} alt="" loading="lazy" className="size-12 shrink-0 rounded-md border object-cover" />
            ) : <span className="bg-muted text-muted-foreground flex size-12 shrink-0 items-center justify-center rounded-md border"><MicIcon className="size-4" /></span>}
            <span className="min-w-0 flex-1">
              <span className="line-clamp-2 text-sm font-medium">{r.title}</span>
              <span className="text-muted-foreground block truncate text-xs">{[r.show, episodeDay(r.date, today), r.seconds ? said(r.seconds) : null].filter(Boolean).join(" · ")}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/**
 * A person's page (Torian, 2026-11-15 16:20Z, widened 16:47Z): who they are, from Wikipedia; the podcasts they host
 * (Wikidata, and Apple shows named for them); their X and other accounts; a Follow button; their episodes on the show
 * they were found on; their appearances on other shows, each heard here; and the show's other guests.
 */
export default async function PersonPage({ params, searchParams }: { params: Promise<{ name: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser();
  const name = bareName(decodeURIComponent((await params).name)).slice(0, 80);
  if (!/^[\p{L}][\p{L}'’. -]{2,79}$/u.test(name)) notFound();
  const sp = await searchParams;
  const feed = one(sp.u);
  const showTitle = one(sp.t).slice(0, 200);
  const wiki = /^https:\/\/en\.wikipedia\.org\/wiki\/\S+$/.test(one(sp.w)) ? one(sp.w) : null;
  const [bio, elsewhere, show, items] = await Promise.all([
    bioFor(name, wiki), appearancesOf(name), /^https?:\/\/\S+$/.test(feed) ? showFor(feed) : Promise.resolve(null), listItems(user.id),
  ]);
  const qid = /^Q\d{1,12}$/.test(one(sp.q)) ? one(sp.q) : bio?.qid ?? null;
  const [facts, follows] = await Promise.all([personFacts(qid, name), followed(user.id)]);
  const following = follows.some((f) => f.name.toLowerCase() === name.toLowerCase());
  const own = new Set(facts.shows.map((x) => x.title.toLowerCase()));
  const today = new Date().toISOString().slice(0, 10);
  const keptBy = new Map(items.filter((i) => i.medium === "podcast" && i.url).map((i) => [i.url!, i.id]));
  const lower = name.toLowerCase();
  // Their episodes on the show they were found on, then on any other show Apple knows of.
  const title = showTitle || show?.title || "";
  const onShow: Row[] = show ? show.episodes.filter((e) => episodeGuests(e, show).some((g) => bareName(g.name).toLowerCase() === lower)).map((e) => {
    const kept = keptBy.get(feed) ?? keptBy.get(show.feed);
    return { key: e.key, title: e.title, show: title, date: e.date, seconds: e.seconds, image: e.image ?? show.image, href: kept ? `/schole/items/${kept}/episodes/${e.key}` : `/schole/podcasts/episode?u=${encodeURIComponent(feed)}&k=${e.key}&t=${encodeURIComponent(title)}` };
  }) : [];
  const shown = new Set(onShow.map((r) => r.key));
  const others: Row[] = elsewhere.filter((a) => !own.has(a.show.toLowerCase())).filter((a) => !(show && ((a.feed === show.feed && shown.has(episodeKey(a.guid))) || onShow.some((r) => r.title === a.title)))).map((a) => {
    const k = episodeKey(a.guid);
    const kept = keptBy.get(a.feed);
    return { key: `${a.feed}|${k}`, title: a.title, show: a.show, date: a.date, seconds: a.seconds, image: a.image, href: kept ? `/schole/items/${kept}/episodes/${k}` : `/schole/podcasts/episode?u=${encodeURIComponent(a.feed)}&k=${k}&t=${encodeURIComponent(a.show)}` };
  });
  const alsoOn = show ? showGuests(show, 40).filter((g) => bareName(g.name).toLowerCase() !== lower).slice(0, 16) : [];
  const shows = new Set(others.map((r) => r.show)).size;
  return (
    <main className={PAGE}>
      <ThingHeader back={show ? `/schole/podcasts?u=${encodeURIComponent(feed)}&t=${encodeURIComponent(title)}` : "/schole/browse?m=podcast"} crumbs={browseCrumbs("podcast")} title={name} />
      <div className="mt-6 space-y-8">
        <header className="flex gap-4">
          {bio?.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={bio.image} alt="" className="size-24 shrink-0 rounded-full border object-cover sm:size-28" />
          ) : <span aria-hidden className="bg-muted text-muted-foreground flex size-24 shrink-0 items-center justify-center rounded-full text-2xl font-medium sm:size-28">{name.split(" ").map((w) => w[0]).slice(0, 2).join("")}</span>}
          <div className="min-w-0 space-y-1.5">
            <h1 id="page-title" className="text-2xl font-semibold tracking-tight">{name}</h1>
            {bio?.description ? <p className="text-muted-foreground">{bio.description.replace(/^./, (c) => c.toUpperCase())}</p> : null}
            {facts.shows.length ? <p className="text-sm">Hosts {facts.shows.slice(0, 2).map((x, i) => <span key={x.title}>{i ? " and " : ""}<em className="not-italic font-medium">{x.title}</em></span>)}</p> : null}
            <p className="text-muted-foreground text-sm">{[onShow.length ? `${onShow.length} on ${title}` : null, others.length ? `${others.length} more episode${others.length === 1 ? "" : "s"} on ${shows} show${shows === 1 ? "" : "s"}` : null].filter(Boolean).join(" · ")}</p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <form action={followPersonAction}>
                <input type="hidden" name="name" value={name} />{qid ? <input type="hidden" name="qid" value={qid} /> : null}
                <input type="hidden" name="follow" value={following ? "0" : "1"} />
                <Button size="sm" variant={following ? "outline" : "default"} aria-pressed={following}>{following ? "Following" : "Follow"}</Button>
              </form>
              {facts.links.map((l) => (
                <a key={l.href} href={l.href} target="_blank" rel="noreferrer nofollow" className="hover:bg-accent inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-sm">
                  {l.kind === "x" ? <svg aria-hidden viewBox="0 0 24 24" className="size-3.5 fill-current"><path d="M18.9 2H22l-6.8 7.8L23 22h-6.2l-4.8-6.3L6.4 22H3.3l7.3-8.3L1 2h6.3l4.4 5.8L18.9 2Zm-1.1 18h1.7L6.3 3.9H4.5L17.8 20Z" /></svg> : null}
                  {l.label}
                </a>
              ))}
            </div>
          </div>
        </header>
        {facts.shows.length ? (
          <section className="space-y-2">
            <h2 className="text-sm font-medium">{facts.shows.length === 1 ? "Their podcast" : "Their podcasts"}</h2>
            <ul className="grid gap-2 sm:grid-cols-2">
              {facts.shows.map((x) => {
                const link = x.feed ?? (x.apple ? `https://podcasts.apple.com/us/podcast/id${x.apple}` : null);
                const inner = (
                  <>
                    {x.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={x.image} alt="" loading="lazy" className="size-14 shrink-0 rounded-md border object-cover" />
                    ) : <span className="bg-muted text-muted-foreground flex size-14 shrink-0 items-center justify-center rounded-md border"><MicIcon className="size-5" /></span>}
                    <span className="min-w-0"><span className="line-clamp-2 text-sm font-medium">{x.title}</span>{x.by ? <span className="text-muted-foreground block truncate text-xs">{x.by}</span> : null}</span>
                  </>
                );
                return <li key={x.title}>{link ? <Link href={`/schole/podcasts?u=${encodeURIComponent(link)}&t=${encodeURIComponent(x.title)}${x.image ? `&i=${encodeURIComponent(x.image)}` : ""}`} className="hover:bg-accent flex items-center gap-3 rounded-lg border p-2">{inner}</Link> : <div className="flex items-center gap-3 rounded-lg border p-2">{inner}</div>}</li>;
              })}
            </ul>
          </section>
        ) : null}
        {bio ? (
          <section className="space-y-2">
            <p className="max-w-prose text-sm leading-relaxed">{bio.about}</p>
            <p className="text-muted-foreground text-xs">From <a href={bio.href} target="_blank" rel="noreferrer" className="underline underline-offset-2">Wikipedia</a>. A Wikipedia page by this name may be about someone else.</p>
          </section>
        ) : null}
        {onShow.length ? <section className="space-y-2"><h2 className="text-sm font-medium">On {title}</h2><Episodes rows={onShow} today={today} /></section> : null}
        {others.length ? <section className="space-y-2"><h2 className="text-sm font-medium">On other shows</h2><Episodes rows={others} today={today} /><p className="text-muted-foreground text-xs">Episodes that name {name}, from Apple Podcasts&apos; search; each plays here.</p></section> : null}
        {!onShow.length && !others.length ? <p className="text-muted-foreground text-sm">No episodes found that name {name}.</p> : null}
        {show ? <GuestChips guests={alsoOn} show={{ feed, title }} title={`Other guests on ${title}`} /> : null}
      </div>
    </main>
  );
}
